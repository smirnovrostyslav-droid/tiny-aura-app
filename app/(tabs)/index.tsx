import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ShopifyProduct } from '../../types/shopify';
import { getCollectionProducts } from '../../services/shopify';
import { useCart } from '../../services/cartContext';

const { width } = Dimensions.get('window');

// ─── Images from Figma ─────────────────────────────────
const FIGMA = {
  logo: require('../../assets/figma/logo.png'),
  heroBanner: require('../../assets/figma/hero_banner.png'),
  product: require('../../assets/figma/product_baccarat.png'),
  promoBg: require('../../assets/figma/promo_60off_bg.png'),
  catDeals: require('../../assets/figma/cat_deals.png'),
  catWomen: require('../../assets/figma/cat_women.png'),
  catMen: require('../../assets/figma/cat_men.png'),
  catTravel: require('../../assets/figma/cat_travel.png'),
  catGifts: require('../../assets/figma/cat_gifts.png'),
};

const ICONS = {
  navSearch: require('../../assets/icons/nav_search.png'),
  navCart: require('../../assets/icons/nav_cart.png'),
  trustAuth: require('../../assets/icons/trust_authentic.png'),
  trustService: require('../../assets/icons/trust_service.png'),
  trustShipping: require('../../assets/icons/trust_shipping.png'),
};

// ─── Categories — exactly from the design screenshot ────
const CATEGORIES = [
  { title: "Today's\nDeals", handle: 'deals', img: FIGMA.catDeals },
  { title: "Women's\nParfume", handle: 'womens-perfume', img: FIGMA.catWomen },
  { title: "Men's\nCologne", handle: 'mens-cologne', img: FIGMA.catMen },
  { title: 'Travel\nSprays', handle: 'travel-sprays', img: FIGMA.catTravel },
  { title: 'Gift\nSets', handle: 'gift-sets', img: FIGMA.catGifts },
];

// ─── Brand logos from the design ────────────────────────
const BRANDS = [
  { name: 'CREED', sub: '1760', handle: 'creed' },
  { name: 'TOM FORD', handle: 'tom-ford' },
  { name: 'ChristianDior', handle: 'dior' },
  { name: 'Maison\nFrancis Kurkdjian\nParis', handle: 'mfk' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { getCartItemCount } = useCart();
  const [bestsellers, setBestsellers] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const products = await getCollectionProducts('new-arrivals').catch(() => []);
      setBestsellers(products);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <View style={s.center}><ActivityIndicator size="large" color="#1a1a1a" /></View>;
  }

  const cartCount = getCartItemCount();

  return (
    <ScrollView style={s.root} showsVerticalScrollIndicator={false}>

      {/* ══════ TOP BAR: "Free US shipping on orders over $50" ══════ */}
      <View style={s.topBar}>
        <Text style={s.topBarText}>Free US shipping on orders over $50</Text>
      </View>

      {/* ══════ HEADER: hamburger | TINY AURA logo | search + bag ══════ */}
      <View style={s.header}>
        <TouchableOpacity style={s.headerBtn} hitSlop={8}>
          <Text style={s.hamburger}>☰</Text>
        </TouchableOpacity>
        <Image source={FIGMA.logo} style={s.logo} resizeMode="contain" />
        <View style={s.headerRight}>
          <TouchableOpacity style={s.headerBtn} hitSlop={8} onPress={() => router.push('/(tabs)/search')}>
            <Image source={ICONS.navSearch} style={s.headerIcon} resizeMode="contain" />
          </TouchableOpacity>
          <TouchableOpacity style={s.headerBtn} hitSlop={8} onPress={() => router.push('/(tabs)/cart')}>
            <Image source={ICONS.navCart} style={s.headerIcon} resizeMode="contain" />
            {cartCount > 0 && (
              <View style={s.cartBadge}><Text style={s.cartBadgeText}>{cartCount}</Text></View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ══════ SALE STRIP: "75% OFF — Sale! Limited Time Only →" ══════ */}
      <View style={s.saleStrip}>
        <Text style={s.saleText}>75% OFF — Sale! Limited Time Only →</Text>
      </View>

      {/* ══════ HERO BANNER: "New Arrivals" with woman + perfumes ══════ */}
      <TouchableOpacity
        activeOpacity={0.95}
        style={s.heroWrap}
        onPress={() => router.push('/collection/new-arrivals')}
      >
        <ImageBackground source={FIGMA.heroBanner} style={s.heroBanner} imageStyle={s.heroImage} resizeMode="cover">
          <View style={s.heroContent}>
            <Text style={s.heroTitle}>New Arrivals</Text>
            <Text style={s.heroDesc}>
              Introducing our latest products,{'\n'}made especially for the season.{'\n'}Shop your favorites before{'\n'}they're gone!
            </Text>
            <TouchableOpacity style={s.heroBtn} onPress={() => router.push('/collection/new-arrivals')}>
              <Text style={s.heroBtnText}>SHOP NOW</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </TouchableOpacity>

      {/* ══════ CATEGORY CIRCLES ══════ */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catRow}>
        {CATEGORIES.map((c, i) => (
          <TouchableOpacity key={i} style={s.catItem} onPress={() => router.push(`/collection/${c.handle}`)}>
            <View style={s.catCircle}>
              <Image source={c.img} style={s.catCircleImg} resizeMode="cover" />
            </View>
            <Text style={s.catLabel}>{c.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ══════ 60% OFF PROMO BANNER ══════ */}
      <TouchableOpacity activeOpacity={0.9} style={s.promoWrap}>
        <ImageBackground source={FIGMA.promoBg} style={s.promoBanner} imageStyle={s.promoImgStyle} resizeMode="cover">
          <Text style={s.promoTitle}>60% OFF!</Text>
          <Text style={s.promoSub}>LIMITED TIME HOLIDAY DEALS!</Text>
          <TouchableOpacity style={s.promoBtn}>
            <Text style={s.promoBtnText}>SHOP NOW</Text>
          </TouchableOpacity>
        </ImageBackground>
      </TouchableOpacity>

      {/* ══════ BESTSELLER SECTION ══════ */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Bestseller</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.bsRow}>
          {bestsellers.length > 0 ? (
            bestsellers.slice(0, 8).map((product) => {
              const price = product.priceRange?.minVariantPrice;
              const comparePrice = product.compareAtPriceRange?.minVariantPrice;
              const imageUrl = product.images?.edges?.[0]?.node?.url;
              const vendor = product.vendor || '';
              const hasDiscount = comparePrice && parseFloat(comparePrice.amount) > parseFloat(price?.amount || '0');
              return (
                <TouchableOpacity key={product.id} style={s.bsCard} onPress={() => router.push(`/product/${product.handle}`)}>
                  <View style={s.bsBadge}><Text style={s.bsBadgeText}>BESTSELLER</Text></View>
                  <View style={s.bsImgWrap}>
                    {imageUrl ? (
                      <Image source={{ uri: imageUrl }} style={s.bsImg} resizeMode="contain" />
                    ) : (
                      <Image source={FIGMA.product} style={s.bsImg} resizeMode="contain" />
                    )}
                  </View>
                  <View style={s.bsInfo}>
                    <Text style={s.bsName} numberOfLines={1}>{product.title}</Text>
                    <Text style={s.bsVendor} numberOfLines={2}>{vendor}</Text>
                    <View style={s.bsPriceRow}>
                      <Text style={s.bsFrom}>From</Text>
                      {hasDiscount && <Text style={s.bsOldPrice}>${parseFloat(comparePrice.amount).toFixed(2)}</Text>}
                      <Text style={s.bsPrice}>${parseFloat(price?.amount || '0').toFixed(2)}</Text>
                    </View>
                    <TouchableOpacity style={s.bsBtn}><Text style={s.bsBtnText}>SELECT SIZE</Text></TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            // Fallback cards matching the design exactly
            [0, 1].map((i) => (
              <View key={i} style={s.bsCard}>
                <View style={s.bsBadge}><Text style={s.bsBadgeText}>BESTSELLER</Text></View>
                <View style={s.bsImgWrap}>
                  <Image source={FIGMA.product} style={s.bsImg} resizeMode="contain" />
                </View>
                <View style={s.bsInfo}>
                  <Text style={s.bsName}>Baccarat Rouge 540</Text>
                  <Text style={s.bsVendor}>Maison Francis Kurkdjian{'\n'}Paris, 2ml</Text>
                  <View style={s.bsPriceRow}>
                    <Text style={s.bsFrom}>From</Text>
                    <Text style={s.bsOldPrice}>$17.70</Text>
                    <Text style={s.bsPrice}>$16.70</Text>
                  </View>
                  <TouchableOpacity style={s.bsBtn}><Text style={s.bsBtnText}>SELECT SIZE</Text></TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </View>

      {/* ══════ SHOP BY BRAND ══════ */}
      <View style={s.section}>
        <Text style={s.brandSectionTitle}>Shop by Brand</Text>
        <View style={s.brandGrid}>
          <TouchableOpacity style={s.brandCell} onPress={() => router.push('/collection/creed')}>
            <Text style={s.brandCreed}>CREED</Text>
            <Text style={s.brandCreedX}>✕</Text>
            <Text style={s.brandCreedYear}>1760</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.brandCell} onPress={() => router.push('/collection/tom-ford')}>
            <Text style={s.brandTomFord}>TOM FORD</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.brandCell} onPress={() => router.push('/collection/dior')}>
            <Text style={s.brandDior}>ChristianDior</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.brandCell} onPress={() => router.push('/collection/mfk')}>
            <Text style={s.brandMFK}>{'Maison\nFrancis Kurkdjian\nParis'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ══════ TRUST BADGES ══════ */}
      <View style={s.trustBox}>
        <TrustBadge
          icon={ICONS.trustAuth}
          title="100% AUTHENTIC"
          desc="Choose from 500+ scents, all in one place"
        />
        <TrustBadge
          icon={ICONS.trustService}
          title="EXPERT CUSTOMER SERVICE"
          desc="Our friendly expert team is on hand to assist you"
        />
        <TrustBadge
          icon={ICONS.trustShipping}
          title="FAST & FREE U.S. SHIPPING OVER $50"
          desc="Orders ship on the day you order them & arrive within days"
          last
        />
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Trust Badge Component ──────────────────────────────
function TrustBadge({ icon, title, desc, last }: { icon: any; title: string; desc: string; last?: boolean }) {
  return (
    <View style={[s.trustRow, last && { marginBottom: 0 }]}>
      <Image source={icon} style={s.trustIcon} resizeMode="contain" />
      <View style={{ flex: 1 }}>
        <Text style={s.trustTitle}>{title}</Text>
        <Text style={s.trustDesc}>{desc}</Text>
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
// STYLES — pixel-perfect from the design screenshot
// Base width: 390px (iPhone 14 Pro)
// ═══════════════════════════════════════════════════════════
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // ── Top shipping bar ──
  topBar: {
    backgroundColor: '#1a1a1b',
    paddingVertical: 6,
    alignItems: 'center',
  },
  topBarText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 0.2,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: '#FFFFFF',
  },
  headerBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  hamburger: { fontSize: 22, color: '#1a1a1a' },
  logo: { width: 110, height: 48 },
  headerRight: { flexDirection: 'row', gap: 8 },
  headerIcon: { width: 22, height: 22, tintColor: '#1a1a1a' },
  cartBadge: {
    position: 'absolute', top: -2, right: -4,
    backgroundColor: '#770a0c', borderRadius: 8,
    minWidth: 16, height: 16,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },

  // ── Sale strip ──
  saleStrip: {
    backgroundColor: '#3a2313',
    paddingVertical: 8,
    alignItems: 'center',
  },
  saleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.3,
  },

  // ── Hero Banner ──
  heroWrap: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  heroBanner: {
    width: width - 32,
    aspectRatio: 358 / 220,
    justifyContent: 'center',
  },
  heroImage: { borderRadius: 16 },
  heroContent: {
    paddingLeft: 20,
    paddingRight: 100,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'serif',
    marginBottom: 8,
  },
  heroDesc: {
    fontSize: 11,
    color: '#333333',
    lineHeight: 16,
    marginBottom: 14,
  },
  heroBtn: {
    backgroundColor: '#770a0c',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  heroBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // ── Category circles ──
  catRow: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
    gap: 14,
  },
  catItem: { alignItems: 'center', width: 72 },
  catCircle: {
    width: 72, height: 72, borderRadius: 36,
    overflow: 'hidden',
    backgroundColor: '#f5e0d0',
  },
  catCircleImg: { width: 72, height: 72 },
  catLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#1a1a1a',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 14,
  },

  // ── 60% OFF promo banner ──
  promoWrap: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  promoBanner: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoImgStyle: { borderRadius: 20 },
  promoTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'serif',
    fontStyle: 'italic',
  },
  promoSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  promoBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 24,
    marginTop: 14,
  },
  promoBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#770a0c',
    letterSpacing: 0.3,
  },

  // ── Bestseller section ──
  section: { marginTop: 20 },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'serif',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  bsRow: { paddingHorizontal: 16, gap: 12 },
  bsCard: {
    width: 165,
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
  },
  bsBadge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: '#770a0c',
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 4, zIndex: 10,
  },
  bsBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '700', letterSpacing: 0.3 },
  bsImgWrap: {
    backgroundColor: '#b5a97a',
    height: 155,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  bsImg: { width: '100%', height: '100%' },
  bsInfo: { paddingTop: 10, paddingHorizontal: 4, paddingBottom: 4 },
  bsName: { fontSize: 14, fontWeight: '700', color: '#000000' },
  bsVendor: { fontSize: 11, color: '#666666', marginTop: 2, lineHeight: 15 },
  bsPriceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 },
  bsFrom: { fontSize: 11, color: '#888888' },
  bsOldPrice: { fontSize: 12, color: '#999999', textDecorationLine: 'line-through' },
  bsPrice: { fontSize: 16, fontWeight: '700', color: '#000000' },
  bsBtn: {
    backgroundColor: '#770a0c',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  bsBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  // ── Shop by Brand ──
  brandSectionTitle: {
    fontSize: 22,
    fontWeight: '400',
    fontFamily: 'serif',
    fontStyle: 'italic',
    color: '#000000',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  brandGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  brandCell: {
    width: (width - 32) / 2,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandCreed: {
    fontFamily: 'serif',
    fontSize: 28,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 4,
  },
  brandCreedX: { fontSize: 10, color: '#000000', marginTop: -4 },
  brandCreedYear: { fontSize: 11, color: '#000000', marginTop: -2 },
  brandTomFord: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 2,
  },
  brandDior: {
    fontFamily: 'serif',
    fontSize: 22,
    fontStyle: 'italic',
    color: '#000000',
  },
  brandMFK: {
    fontFamily: 'serif',
    fontSize: 14,
    color: '#000000',
    textAlign: 'center',
    lineHeight: 20,
  },

  // ── Trust badges ──
  trustBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 20,
    marginTop: 24,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  trustIcon: { width: 28, height: 28, marginRight: 14, marginTop: 2 },
  trustTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  trustDesc: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 17,
  },
});
