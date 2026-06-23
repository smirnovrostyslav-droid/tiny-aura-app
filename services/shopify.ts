import {
  ShopifyProduct,
  ShopifyCollection,
  ShopifyCart,
} from '../types/shopify';

const SHOPIFY_STORE_URL = '0uaabs-ta.myshopify.com';
const STOREFRONT_ACCESS_TOKEN = '6a08c3a66a6f3a5d229a37cd2da2ec29';
const API_ENDPOINT = `https://${SHOPIFY_STORE_URL}/api/2024-01/graphql.json`;

async function shopifyFetch<T>(query: string, variables = {}): Promise<T> {
  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': STOREFRONT_ACCESS_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`Shopify API error: ${response.statusText}`);
  }

  const json = await response.json();
  
  if (json.errors) {
    console.error('GraphQL errors:', json.errors);
    throw new Error(json.errors[0]?.message || 'GraphQL query failed');
  }

  return json.data;
}

// Optimize Shopify CDN image URLs with size parameters
export function optimizeImageUrl(url: string, width: number = 400): string {
  if (!url) return url;
  // Shopify CDN supports _WIDTHx suffix or crop params
  try {
    const u = new URL(url);
    u.searchParams.set('width', String(width));
    u.searchParams.set('quality', '80');
    return u.toString();
  } catch {
    return url;
  }
}

// Get all collections
export async function getCollections(): Promise<ShopifyCollection[]> {
  const query = `
    query GetCollections {
      collections(first: 50) {
        edges {
          node {
            id
            handle
            title
            description
            image {
              url
              altText
            }
          }
        }
      }
    }
  `;

  const data = await shopifyFetch<{
    collections: { edges: Array<{ node: ShopifyCollection }> };
  }>(query);

  return data.collections.edges.map((edge) => edge.node);
}

// Get products from a collection
export async function getCollectionProducts(
  handle: string
): Promise<ShopifyProduct[]> {
  const query = `
    query GetCollectionProducts($handle: String!) {
      collection(handle: $handle) {
        products(first: 250) {
          edges {
            node {
              id
              handle
              title
              description
              vendor
              images(first: 5) {
                edges {
                  node {
                    url
                    altText
                  }
                }
              }
              priceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
              compareAtPriceRange {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
              variants(first: 10) {
                edges {
                  node {
                    id
                    title
                    price {
                      amount
                      currencyCode
                    }
                    compareAtPrice {
                      amount
                      currencyCode
                    }
                    availableForSale
                    selectedOptions {
                      name
                      value
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const data = await shopifyFetch<{
    collection: { products: { edges: Array<{ node: ShopifyProduct }> } } | null;
  }>(query, { handle });

  if (!data.collection) {
    return [];
  }

  return data.collection.products.edges.map((edge) => edge.node);
}

// Get product by handle
export async function getProductByHandle(
  handle: string
): Promise<ShopifyProduct> {
  const query = `
    query GetProduct($handle: String!) {
      product(handle: $handle) {
        id
        handle
        title
        description
        vendor
        images(first: 10) {
          edges {
            node {
              url
              altText
            }
          }
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
          maxVariantPrice {
            amount
            currencyCode
          }
        }
        compareAtPriceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
        variants(first: 20) {
          edges {
            node {
              id
              title
              price {
                amount
                currencyCode
              }
              compareAtPrice {
                amount
                currencyCode
              }
              availableForSale
              selectedOptions {
                name
                value
              }
            }
          }
        }
      }
    }
  `;

  const data = await shopifyFetch<{ product: ShopifyProduct | null }>(query, {
    handle,
  });

  if (!data.product) {
    throw new Error(`Product not found: ${handle}`);
  }

  return data.product;
}

// Search products
export async function searchProducts(query: string): Promise<ShopifyProduct[]> {
  const searchQuery = `
    query SearchProducts($query: String!) {
      products(first: 100, query: $query) {
        edges {
          node {
            id
            handle
            title
            description
            vendor
            images(first: 1) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
            priceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            compareAtPriceRange {
              minVariantPrice {
                amount
                currencyCode
              }
            }
            variants(first: 1) {
              edges {
                node {
                  id
                  title
                  price {
                    amount
                    currencyCode
                  }
                  compareAtPrice {
                    amount
                    currencyCode
                  }
                  availableForSale
                  selectedOptions {
                    name
                    value
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const data = await shopifyFetch<{
    products: { edges: Array<{ node: ShopifyProduct }> };
  }>(searchQuery, { query });

  return data.products.edges.map((edge) => edge.node);
}

// Get products by their IDs (for wishlist)
export async function getProductsByIds(ids: string[]): Promise<ShopifyProduct[]> {
  if (ids.length === 0) return [];

  const query = `
    query GetProductsByIds($ids: [ID!]!) {
      nodes(ids: $ids) {
        ... on Product {
          id
          handle
          title
          description
          vendor
          images(first: 3) {
            edges {
              node {
                url
                altText
              }
            }
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          compareAtPriceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          variants(first: 10) {
            edges {
              node {
                id
                title
                price {
                  amount
                  currencyCode
                }
                compareAtPrice {
                  amount
                  currencyCode
                }
                availableForSale
                selectedOptions {
                  name
                  value
                }
              }
            }
          }
        }
      }
    }
  `;

  const data = await shopifyFetch<{ nodes: (ShopifyProduct | null)[] }>(query, { ids });
  return data.nodes.filter((n): n is ShopifyProduct => n !== null && n.id !== undefined);
}

// Customer auth moved to services/shopifyCustomerAccount.ts (OAuth via Customer Account API).

// Create cart
export async function createCart(): Promise<ShopifyCart> {
  const mutation = `
    mutation CreateCart {
      cartCreate {
        cart {
          id
          checkoutUrl
          lines(first: 10) {
            edges {
              node {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    price {
                      amount
                      currencyCode
                    }
                    product {
                      title
                      handle
                      images(first: 1) {
                        edges {
                          node {
                            url
                            altText
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          cost {
            totalAmount {
              amount
              currencyCode
            }
            subtotalAmount {
              amount
              currencyCode
            }
          }
        }
      }
    }
  `;

  const data = await shopifyFetch<{ cartCreate: { cart: ShopifyCart } }>(
    mutation
  );

  return data.cartCreate.cart;
}

// Add items to cart
export async function addToCart(
  cartId: string,
  variantId: string,
  quantity: number
): Promise<ShopifyCart> {
  const mutation = `
    mutation AddToCart($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart {
          id
          checkoutUrl
          lines(first: 50) {
            edges {
              node {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    price {
                      amount
                      currencyCode
                    }
                    product {
                      title
                      handle
                      images(first: 1) {
                        edges {
                          node {
                            url
                            altText
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          cost {
            totalAmount {
              amount
              currencyCode
            }
            subtotalAmount {
              amount
              currencyCode
            }
          }
        }
      }
    }
  `;

  const data = await shopifyFetch<{ cartLinesAdd: { cart: ShopifyCart } }>(
    mutation,
    {
      cartId,
      lines: [{ merchandiseId: variantId, quantity }],
    }
  );

  return data.cartLinesAdd.cart;
}

// Update cart line
export async function updateCartLine(
  cartId: string,
  lineId: string,
  quantity: number
): Promise<ShopifyCart> {
  const mutation = `
    mutation UpdateCartLine($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart {
          id
          checkoutUrl
          lines(first: 50) {
            edges {
              node {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    price {
                      amount
                      currencyCode
                    }
                    product {
                      title
                      handle
                      images(first: 1) {
                        edges {
                          node {
                            url
                            altText
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          cost {
            totalAmount {
              amount
              currencyCode
            }
            subtotalAmount {
              amount
              currencyCode
            }
          }
        }
      }
    }
  `;

  const data = await shopifyFetch<{ cartLinesUpdate: { cart: ShopifyCart } }>(
    mutation,
    {
      cartId,
      lines: [{ id: lineId, quantity }],
    }
  );

  return data.cartLinesUpdate.cart;
}

// Remove from cart
export async function removeFromCart(
  cartId: string,
  lineId: string
): Promise<ShopifyCart> {
  const mutation = `
    mutation RemoveFromCart($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
        cart {
          id
          checkoutUrl
          lines(first: 50) {
            edges {
              node {
                id
                quantity
                merchandise {
                  ... on ProductVariant {
                    id
                    title
                    price {
                      amount
                      currencyCode
                    }
                    product {
                      title
                      handle
                      images(first: 1) {
                        edges {
                          node {
                            url
                            altText
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          cost {
            totalAmount {
              amount
              currencyCode
            }
            subtotalAmount {
              amount
              currencyCode
            }
          }
        }
      }
    }
  `;

  const data = await shopifyFetch<{ cartLinesRemove: { cart: ShopifyCart } }>(
    mutation,
    {
      cartId,
      lineIds: [lineId],
    }
  );

  return data.cartLinesRemove.cart;
}

// Get cart by ID
export async function getCart(cartId: string): Promise<ShopifyCart> {
  const query = `
    query GetCart($cartId: ID!) {
      cart(id: $cartId) {
        id
        checkoutUrl
        lines(first: 50) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  price {
                    amount
                    currencyCode
                  }
                  product {
                    title
                    handle
                    images(first: 1) {
                      edges {
                        node {
                          url
                          altText
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        cost {
          totalAmount {
            amount
            currencyCode
          }
          subtotalAmount {
            amount
            currencyCode
          }
        }
      }
    }
  `;

  const data = await shopifyFetch<{ cart: ShopifyCart | null }>(query, { cartId });

  if (!data.cart) {
    throw new Error('Cart not found or expired');
  }

  return data.cart;
}
