#!/usr/bin/env python3
"""App Store Connect API helper for Kiss of Aroma.

Reads credentials from eas.json's submit.production.ios config.
Usage:
  python3 scripts/asc.py builds           # list recent builds + processing state
  python3 scripts/asc.py wait-build <buildId>   # poll until processingState != PROCESSING
  python3 scripts/asc.py create-version <versionString>  # create App Store version
  python3 scripts/asc.py attach-build <versionId> <buildId>
  python3 scripts/asc.py set-whats-new <versionId> "text"
  python3 scripts/asc.py submit-for-review <versionId>
  python3 scripts/asc.py status            # current iOS app version + state summary
"""
import json
import os
import sys
import time
import urllib.request
import urllib.error

import jwt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EAS = json.load(open(os.path.join(ROOT, "eas.json")))
APP = json.load(open(os.path.join(ROOT, "app.json")))
IOS_CFG = EAS["submit"]["production"]["ios"]
APP_ID = str(IOS_CFG["ascAppId"])
KEY_ID = IOS_CFG["ascApiKeyId"]
ISSUER_ID = IOS_CFG["ascApiKeyIssuerId"]
KEY_PATH = os.path.join(ROOT, IOS_CFG["ascApiKeyPath"].lstrip("./"))
BUNDLE_ID = APP["expo"]["ios"]["bundleIdentifier"]
APP_VERSION = APP["expo"]["version"]

API_BASE = "https://api.appstoreconnect.apple.com/v1"


def make_token() -> str:
    with open(KEY_PATH) as f:
        private_key = f.read()
    now = int(time.time())
    payload = {
        "iss": ISSUER_ID,
        "iat": now,
        "exp": now + 60 * 15,
        "aud": "appstoreconnect-v1",
    }
    return jwt.encode(payload, private_key, algorithm="ES256", headers={"kid": KEY_ID, "typ": "JWT"})


def request(method: str, path: str, body: dict | None = None) -> dict:
    url = path if path.startswith("http") else f"{API_BASE}{path}"
    headers = {
        "Authorization": f"Bearer {make_token()}",
        "Content-Type": "application/json",
    }
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            txt = resp.read().decode()
            return json.loads(txt) if txt else {}
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        print(f"HTTP {e.code} {method} {url}\n{err}", file=sys.stderr)
        sys.exit(1)


def cmd_builds():
    # List most recent 10 builds with state
    res = request(
        "GET",
        f"/builds?filter[app]={APP_ID}&sort=-version&limit=10&include=preReleaseVersion",
    )
    for b in res.get("data", []):
        a = b["attributes"]
        print(f"  build {a.get('version'):>4} | {a.get('processingState'):<10} | uploaded={a.get('uploadedDate')} | id={b['id']}")


def cmd_status():
    # App + current versions
    app = request("GET", f"/apps/{APP_ID}")
    print("App:", app["data"]["attributes"]["name"], f"(bundle {BUNDLE_ID})")
    versions = request("GET", f"/apps/{APP_ID}/appStoreVersions?limit=5")
    print("Recent versions:")
    for v in versions.get("data", []):
        a = v["attributes"]
        print(f"  {a['versionString']:<10} {a['appStoreState']:<30} created={a['createdDate']}  id={v['id']}")


def cmd_wait_build(build_number: str):
    # Find build by buildNumber + version + bundle
    while True:
        res = request(
            "GET",
            f"/builds?filter[app]={APP_ID}&filter[version]={build_number}&limit=1",
        )
        data = res.get("data", [])
        if not data:
            print(f"Build {build_number} not found yet, retrying in 30s…")
            time.sleep(30)
            continue
        b = data[0]
        state = b["attributes"]["processingState"]
        print(f"  build {build_number} state: {state}")
        if state != "PROCESSING":
            print(f"DONE: {state}, build id = {b['id']}")
            return b["id"], state
        time.sleep(30)


def cmd_find_build(build_number: str):
    res = request(
        "GET",
        f"/builds?filter[app]={APP_ID}&filter[version]={build_number}&limit=1",
    )
    data = res.get("data", [])
    if not data:
        print(f"Build {build_number} not found")
        sys.exit(1)
    print(data[0]["id"], data[0]["attributes"]["processingState"])


def cmd_create_version(version_string: str):
    # Find existing first
    versions = request("GET", f"/apps/{APP_ID}/appStoreVersions?filter[versionString]={version_string}")
    if versions.get("data"):
        v = versions["data"][0]
        print(f"Existing version {version_string}: id={v['id']} state={v['attributes']['appStoreState']}")
        return v["id"]
    body = {
        "data": {
            "type": "appStoreVersions",
            "attributes": {
                "platform": "IOS",
                "versionString": version_string,
                "releaseType": "AFTER_APPROVAL",
            },
            "relationships": {
                "app": {"data": {"type": "apps", "id": APP_ID}},
            },
        }
    }
    res = request("POST", "/appStoreVersions", body)
    v = res["data"]
    print(f"Created version {version_string}: id={v['id']}")
    return v["id"]


def cmd_attach_build(version_id: str, build_id: str):
    body = {"data": {"type": "builds", "id": build_id}}
    request("PATCH", f"/appStoreVersions/{version_id}/relationships/build", body)
    print(f"Attached build {build_id} to version {version_id}")


def cmd_set_whats_new(version_id: str, text: str):
    # Get localizations
    locs = request("GET", f"/appStoreVersions/{version_id}/appStoreVersionLocalizations")
    for loc in locs.get("data", []):
        loc_id = loc["id"]
        locale = loc["attributes"]["locale"]
        body = {
            "data": {
                "type": "appStoreVersionLocalizations",
                "id": loc_id,
                "attributes": {"whatsNew": text},
            }
        }
        request("PATCH", f"/appStoreVersionLocalizations/{loc_id}", body)
        print(f"  {locale}: whatsNew updated")


def cmd_submit_for_review(version_id: str):
    # Modern flow: create reviewSubmission, add reviewSubmissionItem, then submit.
    # 1. Create review submission for the app (platform IOS)
    body = {
        "data": {
            "type": "reviewSubmissions",
            "attributes": {"platform": "IOS"},
            "relationships": {"app": {"data": {"type": "apps", "id": APP_ID}}},
        }
    }
    res = request("POST", "/reviewSubmissions", body)
    sub_id = res["data"]["id"]
    print(f"Created reviewSubmission: {sub_id}")

    # 2. Add the appStoreVersion as an item
    body = {
        "data": {
            "type": "reviewSubmissionItems",
            "relationships": {
                "reviewSubmission": {"data": {"type": "reviewSubmissions", "id": sub_id}},
                "appStoreVersion": {"data": {"type": "appStoreVersions", "id": version_id}},
            },
        }
    }
    res = request("POST", "/reviewSubmissionItems", body)
    print(f"Added item: {res['data']['id']}")

    # 3. Submit (PATCH submitted=true)
    body = {
        "data": {
            "type": "reviewSubmissions",
            "id": sub_id,
            "attributes": {"submitted": True},
        }
    }
    request("PATCH", f"/reviewSubmissions/{sub_id}", body)
    print(f"Submitted for review: {sub_id}")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    cmd = sys.argv[1]
    args = sys.argv[2:]
    if cmd == "builds":
        cmd_builds()
    elif cmd == "status":
        cmd_status()
    elif cmd == "wait-build":
        cmd_wait_build(args[0])
    elif cmd == "find-build":
        cmd_find_build(args[0])
    elif cmd == "create-version":
        cmd_create_version(args[0])
    elif cmd == "attach-build":
        cmd_attach_build(args[0], args[1])
    elif cmd == "set-whats-new":
        cmd_set_whats_new(args[0], args[1])
    elif cmd == "submit-for-review":
        cmd_submit_for_review(args[0])
    else:
        print(f"Unknown command: {cmd}")
        sys.exit(1)


if __name__ == "__main__":
    main()
