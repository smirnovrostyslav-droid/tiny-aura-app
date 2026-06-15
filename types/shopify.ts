export interface ShopifyImage {
  url: string;
  altText?: string;
  width?: number;
  height?: number;
}

export interface ShopifyMoney {
  amount: string;
  currencyCode: string;
}

export interface ShopifyProductVariant {
  id: string;
  title: string;
  price: ShopifyMoney;
  compareAtPrice?: ShopifyMoney | null;
  availableForSale: boolean;
  selectedOptions: Array<{
    name: string;
    value: string;
  }>;
  product?: {
    title: string;
    images: {
      edges: Array<{
        node: ShopifyImage;
      }>;
    };
  };
}

export interface ShopifyProduct {
  id: string;
  handle: string;
  title: string;
  description: string;
  vendor?: string;
  images: {
    edges: Array<{
      node: ShopifyImage;
    }>;
  };
  priceRange: {
    minVariantPrice: ShopifyMoney;
    maxVariantPrice?: ShopifyMoney;
  };
  compareAtPriceRange?: {
    minVariantPrice: ShopifyMoney;
  };
  variants: {
    edges: Array<{
      node: ShopifyProductVariant;
    }>;
  };
}

export interface ShopifyCollection {
  id: string;
  handle: string;
  title: string;
  description?: string;
  image?: ShopifyImage;
  products?: {
    edges: Array<{
      node: ShopifyProduct;
    }>;
  };
}

export interface ShopifyCartLine {
  id: string;
  quantity: number;
  merchandise: ShopifyProductVariant;
}

export interface ShopifyCart {
  id: string;
  checkoutUrl: string;
  lines: {
    edges: Array<{
      node: ShopifyCartLine;
    }>;
  };
  cost: {
    totalAmount: ShopifyMoney;
    subtotalAmount: ShopifyMoney;
  };
}
