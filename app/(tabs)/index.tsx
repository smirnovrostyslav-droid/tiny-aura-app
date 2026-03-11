import React, { useEffect, useState, useCallback } from 'react';
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
import { Colors } from '../../constants/theme';
import { useCart } from '../../services/cartContext';

const { width } = Dimensions.get('window');

// All images from Figma
const FIGMA = {
  logo: require('../../assets/figma/logo.png'),
  heroBanner: require('../../assets/figma/hero_banner.png'),
  product: require('../../assets/figma/product_baccarat.png'),
  promoBg: require('../../assets/figma/promo_60off_bg.png'),
  // Category circles
  catDeals: require('../../assets/figma/cat_deals.png'),
  catWomen: require('../../assets/figma/cat_women.png'),
  catMen: require('../../assets/figma/cat_men.png'),
  catTravel: require('../../assets/figma/cat_travel.png'),
  catGifts: require('../../assets/figma/cat_gifts.png'),
};

// Icons generated via Nano Banana (Gemini)
const ICONS = {
  navHome: require('../../assets/icons/nav_home.png'),
  navSearch: require('../../assets/icons/nav_search.png'),
  navHeart: require('../../assets/icons/nav_heart.png'),
  navCart: require('../../assets/icons/nav_cart.png'),
  navAccount: require('../../assets/icons/nav_account.png'),
  trustAuth: require('../../assets/icons/trust_authentic.png'),
  trustService: require('../../assets/icons/trust_service.png'),
  trustShipping: require('../../assets/icons/trust_shipping.png'),
};

const CATEGORIES = [
  { title: "Today's\nDeals", handle: 'deals', img: FIGMA.catDeals },
  { title: "Women's\nParfume", handle: 'womens-perfume', img: FIGMA.catWomen },
  { title: "Men's\nCologne", handle: 'mens-cologne', img: FIGMA.catMen },
  { title: 'Travel\nSprays', handle: 'travel-sprays', img: FIGMA.catTravel },
  { title: 'Gift\nSets', handle: 'gift-sets', img: FIGMA.catGifts },
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
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.black} /></View>;
  }

  const cartCount = getCartItemCount();

  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      {/* FREE SHIPPING bar — from Figma: #1a1a1b */}
      <View style={styles.shippingBar}>
        <Text style={styles.shippingText}>Free US shipping on orders over $50</Text>
      </View>

      {/* HEADER — from Figma: logo image */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn}>
          <Text style={{ fontSize: 20, color: '#1a1a1a' }}>☰</Text>
        </TouchableOpacity>
        <Image source={FIGMA.logo} style={styles.logoImg} resizeMode="contain" />
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(tabs)/search')}>
            <Image source={ICONS.navSearch} style={styles.headerIcon} resizeMode="contain" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(tabs)/cart')}>
            <Image source={ICONS.navCart} style={styles.headerIcon} resizeMode="contain" />
            {cartCount > 0 && (
              <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{cartCount}</Text></View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* SALE STRIP — from Figma: #3a2313 */}
      <View style={styles.saleStrip}>
        <Text style={styles.saleText}>75% OFF — Sale! Limited Time Only →</Text>
      </View>

      {/* HERO BANNER — entire image from Figma */}
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.heroWrap}
        onPress={() => router.push('/collection/new-arrivals')}
      >
        <Image source={FIGMA.heroBanner} style={styles.heroImg} resizeMode="cover" />
      </TouchableOpacity>

      {/* Slide dots — from Figma design */}
      <View style={styles.dots}>
        <View style={[styles.dot, styles.dotActive]} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>

      {/* CATEGORIES — from Figma: "Browse Categories" */}
      <Text style={styles.browseCat}>Browse Categories</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
        {CATEGORIES.map((c, i) => (
          <TouchableOpacity key={i} style={styles.catItem} onPress={() => router.push(`/collection/${c.handle}`)}>
            <View style={styles.catCircle}>
              <Image source={c.img} style={styles.catCircleImg} resizeMode="cover" />
            </View>
            <Text style={styles.catLabel}>{c.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 60% OFF PROMO — background image from Figma */}
      <TouchableOpacity activeOpacity={0.9} style={styles.promoWrap}>
        <ImageBackground
          source={FIGMA.promoBg}
          style={styles.promoBanner}
          imageStyle={styles.promoImage}
          resizeMode="cover"
        >
          <Text style={styles.promoTitle}>60% off!</Text>
          <Text style={styles.promoSub}>limited time holiday deals!</Text>
          <View style={styles.promoBtn}>
            <Text style={styles.promoBtnText}>Shop now</Text>
          </View>
        </ImageBackground>
      </TouchableOpacity>

      {/* BESTSELLER — from Figma */}
      {bestsellers.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.bestsellerTitle}>Bestseller</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bsScroll}>
            {bestsellers.slice(0, 8).map((product) => {
              const price = product.priceRange?.minVariantPrice;
              const comparePrice = product.compareAtPriceRange?.minVariantPrice;
              const imageUrl = product.images?.edges?.[0]?.node?.url;
              const vendor = product.vendor || '';
              const hasDiscount = comparePrice && parseFloat(comparePrice.amount) > parseFloat(price?.amount || '0');
              return (
                <TouchableOpacity key={product.id} style={styles.bsCard} onPress={() => router.push(`/product/${product.handle}`)}>
                  {/* Badge — Figma: #770a0c */}
                  <View style={styles.bsBadge}><Text style={styles.bsBadgeText}>BESTSELLER</Text></View>
                  <View style={styles.bsImgBox}>
                    {imageUrl ? (
                      <Image source={{ uri: imageUrl }} style={styles.bsImg} resizeMode="contain" />
                    ) : (
                      <Image source={FIGMA.product} style={styles.bsImg} resizeMode="contain" />
                    )}
                  </View>
                  <View style={styles.bsInfo}>
                    <Text style={styles.bsName} numberOfLines={1}>{product.title}</Text>
                    <Text style={styles.bsVendor} numberOfLines={2}>{vendor}</Text>
                    <View style={styles.bsPriceRow}>
                      <Text style={styles.bsPriceFrom}>From</Text>
                      {hasDiscount && <Text style={styles.bsPriceOld}>${parseFloat(comparePrice.amount).toFixed(2)}</Text>}
                      <Text style={styles.bsPrice}>${parseFloat(price?.amount || '0').toFixed(2)}</Text>
                    </View>
                    {/* Button — Figma: #770a0c */}
                    <TouchableOpacity style={styles.bsBtn}><Text style={styles.bsBtnText}>SELECT SIZE</Text></TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* SHOP BY BRAND — text logos (Figma vectors, awaiting export) */}
      <View style={styles.section}>
        <Text style={styles.brandTitle}>Shop by Brand</Text>
        <View style={styles.brandGrid}>
          <TouchableOpacity style={styles.brandCell} onPress={() => router.push('/collection/creed')}>
            <Text style={styles.brandCreed}>CREED</Text>
            <Text style={styles.brandCreedSub}>✕</Text>
            <Text style={styles.brandCreedYear}>1760</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.brandCell} onPress={() => router.push('/collection/tom-ford')}>
            <Text style={styles.brandTomFord}>TOM FORD</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.brandCell} onPress={() => router.push('/collection/dior')}>
            <Text style={styles.brandDior}>Christian Dior</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.brandCell} onPress={() => router.push('/collection/mfk')}>
            <Text style={styles.brandMFK}>{'Maison\nFrancis Kurkdjian\nParis'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* TRUST BADGES — with generated icons */}
      <View style={styles.trustBox}>
        <TrustBadge icon={ICONS.trustAuth} title="100% AUTHENTIC" desc="Choose from 500+ scents, all in one place" />
        <TrustBadge icon={ICONS.trustService} title="EXPERT CUSTOMER SERVICE" desc="Our friendly expert team is on hand to assist you" />
        <TrustBadge icon={ICONS.trustShipping} title="FAST & FREE U.S. SHIPPING OVER $50" desc="Orders ship on the day you order them & arrive within days" last />
      </View>

      {/* Bottom Tab Bar (from Figma): Home, Search, Wishlist, Cart, Account */}
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

function TrustBadge({ icon, title, desc, last }: { icon: any; title: string; desc: string; last?: boolean }) {
  return (
    <View style={[styles.trustRow, last && { marginBottom: 0 }]}>
      <Image source={icon} style={styles.trustIconImg} resizeMode="contain" />
      <View style={{ flex: 1 }}>
        <Text style={styles.trustTitle}>{title}</Text>
        <Text style={styles.trustDesc}>{desc}</Text>
      </View>
    </View>
  );
}

// All measurements from Figma (390px width frame)
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fafafa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // FREE SHIPPING — Figma: #1a1a1b, h23
  shippingBar: { backgroundColor: '#1a1a1b', height: 23, justifyContent: 'center', alignItems: 'center' },
  shippingText: { color: '#ffffff', fontSize: 10, fontWeight: '400' },

  // HEADER — Figma: #ffffff, h64
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 64, backgroundColor: '#ffffff' },
  iconBtn: { width: 34, height: 34, justifyContent: 'center', alignItems: 'center' },
  headerRight: { flexDirection: 'row', gap: 4 },
  headerIcon: { width: 22, height: 22 },
  logoImg: { width: 116, height: 53 },
  cartBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#770a0c', borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  cartBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },

  // SALE STRIP — Figma: #3a2313, h32
  saleStrip: { backgroundColor: '#3a2313', height: 32, justifyContent: 'center', alignItems: 'center' },
  saleText: { color: '#ffffff', fontSize: 11, fontWeight: '500' },

  // HERO — Figma: 358x267, border-radius 16
  heroWrap: { marginHorizontal: 16, marginTop: 12, borderRadius: 16, overflow: 'hidden' },
  heroImg: { width: width - 32, aspectRatio: 358 / 267 },

  // DOTS — Figma indicators
  dots: { flexDirection: 'row', justifyContent: 'center', marginTop: 10, gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#d9d9d9' },
  dotActive: { width: 16, backgroundColor: '#1a1a1a' },

  // CATEGORIES — Figma: "Browse Categories"
  browseCat: { fontSize: 22, fontWeight: '700', fontFamily: 'serif', color: '#000000', paddingHorizontal: 16, marginTop: 16, marginBottom: 12 },
  catRow: { paddingHorizontal: 16, gap: 16 },
  catItem: { alignItems: 'center', width: 72 },
  catCircle: { width: 72, height: 72, borderRadius: 36, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5e0d0' },
  catCircleImg: { width: 72, height: 72 },
  catLabel: { fontSize: 11, fontWeight: '500', color: '#1a1a1a', textAlign: 'center', marginTop: 6, lineHeight: 14 },

  // 60% OFF — Figma: uses background image + overlay text
  promoWrap: { marginHorizontal: 16, marginTop: 16, borderRadius: 16, overflow: 'hidden' },
  promoBanner: { height: 151, justifyContent: 'center', alignItems: 'center' },
  promoImage: { borderRadius: 16 },
  promoTitle: { fontSize: 36, fontWeight: '700', fontFamily: 'serif', color: '#ffffff', fontStyle: 'italic' },
  promoSub: { fontSize: 13, fontWeight: '600', color: '#ffffff', letterSpacing: 1, marginTop: 2, textTransform: 'uppercase' },
  promoBtn: { backgroundColor: '#ffffff', paddingHorizontal: 24, paddingVertical: 8, borderRadius: 20, marginTop: 10 },
  promoBtnText: { fontSize: 12, fontWeight: '600', color: '#770a0c' },

  // BESTSELLER — Figma: cards 171x293
  section: { paddingVertical: 16 },
  bestsellerTitle: { fontSize: 26, fontWeight: '700', fontFamily: 'serif', color: '#000000', paddingHorizontal: 16, marginBottom: 12 },
  bsScroll: { paddingHorizontal: 16, gap: 12 },
  bsCard: { width: 171, backgroundColor: '#ffffff', borderRadius: 0 },
  bsBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: '#770a0c', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, zIndex: 10 },
  bsBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  bsImgBox: { backgroundColor: '#a8a77a', height: 148, justifyContent: 'center', alignItems: 'center', padding: 12 },
  bsImg: { width: '100%', height: '100%' },
  bsInfo: { padding: 8 },
  bsName: { fontSize: 13, fontWeight: '700', color: '#000' },
  bsVendor: { fontSize: 11, color: '#6b6b6b', marginTop: 2 },
  bsPriceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 },
  bsPriceFrom: { fontSize: 10, color: '#6b6b6b' },
  bsPriceOld: { fontSize: 12, color: '#999', textDecorationLine: 'line-through' },
  bsPrice: { fontSize: 15, fontWeight: '700', color: '#000' },
  bsBtn: { backgroundColor: '#770a0c', paddingVertical: 8, borderRadius: 4, alignItems: 'center', marginTop: 8 },
  bsBtnText: { color: '#fff', fontSize: 11, fontWeight: '600' },

  // BRANDS — Figma: text logos
  brandTitle: { fontSize: 22, fontWeight: '400', fontFamily: 'serif', fontStyle: 'italic', color: '#000', paddingHorizontal: 16, marginBottom: 16 },
  brandGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16 },
  brandCell: { width: (width - 32) / 2, height: 80, justifyContent: 'center', alignItems: 'center' },
  brandCreed: { fontFamily: 'serif', fontSize: 28, fontWeight: '900', color: '#000', letterSpacing: 3 },
  brandCreedSub: { fontSize: 10, color: '#000', marginTop: -2 },
  brandCreedYear: { fontSize: 10, color: '#000' },
  brandTomFord: { fontSize: 20, fontWeight: '700', color: '#000', letterSpacing: 2 },
  brandDior: { fontFamily: 'serif', fontSize: 20, fontStyle: 'italic', color: '#000' },
  brandMFK: { fontFamily: 'serif', fontSize: 14, color: '#000', textAlign: 'center', lineHeight: 20 },

  // TRUST — Figma
  trustBox: { backgroundColor: '#f5f5f5', borderRadius: 16, marginHorizontal: 16, padding: 20, marginTop: 8 },
  trustRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18 },
  trustIconImg: { width: 32, height: 32, marginRight: 12 },
  trustTitle: { fontSize: 13, fontWeight: '700', color: '#000', letterSpacing: 0.3, marginBottom: 2 },
  trustDesc: { fontSize: 11, color: '#6b6b6b', lineHeight: 16 },
});
