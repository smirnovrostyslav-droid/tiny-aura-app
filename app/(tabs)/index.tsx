import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Modal,
  Animated,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ShopifyProduct } from '../../types/shopify';
import { getCollectionProducts } from '../../services/shopify';
import { useCart } from '../../services/cartContext';

// ─── Menu sections — synced with tinyaura.us mobile drawer ──
const MENU_SECTIONS = [
  {
    title: 'Shop by Category',
    items: [
      { label: "Women's Perfumes", route: '/collection/women' },
      { label: "Men's Cologne", route: '/collection/men' },
      { label: 'Unisex', route: '/collection/unisex' },
      { label: 'Shop All', route: '/collection/all' },
    ],
  },
  {
    title: 'Featured Collections',
    items: [
      { label: 'New Arrivals', route: '/collection/new' },
      { label: 'Best Sellers', route: '/collection/best-sellers' },
      { label: 'Gift Sets', route: '/collection/gift-sets' },
      { label: 'Sale', route: '/collection/sale' },
    ],
  },
  {
    title: 'Account & More',
    items: [
      { label: 'About Us', route: '/(tabs)/account' },
      { label: 'Contact', route: '/(tabs)/account' },
      { label: 'Cart', route: '/(tabs)/cart' },
    ],
  },
];

// Fixed width for consistent mobile layout
const W = 390;
const HERO_W = W - 32; // 358px with 16px margins

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

// ─── Hero slider banners (clean images, text added in code) ─
// Links synced with tinyaura.us Shopify collections
const SLIDES = [
  {
    id: '1',
    image: require('../../assets/banners/slide_1_clean.png'),
    title: 'New Arrivals',
    desc: "Introducing our latest products,\nmade especially for the season.\nShop your favorites before\nthey're gone!",
    btnText: 'SHOP NOW',
    link: '/collection/new',
  },
  {
    id: '2',
    image: require('../../assets/banners/slide_2_clean.png'),
    title: 'Discovery Sets',
    desc: "Explore our curated selection\nof premium fragrances.\nFind your signature scent\nwith our sample collections.",
    btnText: 'SHOP NOW',
    link: '/collection/gift-sets',
  },
  {
    id: '3',
    image: require('../../assets/banners/slide_3_clean.png'),
    title: 'Spin & Win',
    desc: "Try your luck! Spin the wheel\nfor a chance to win up to\n15% off on premium\nfragrances. Limited time only!",
    btnText: 'Browse All Scents',
    link: '/collection/all',
  },
];

const ICONS = {
  navSearch: require('../../assets/icons/nav_search.png'),
  navCart: require('../../assets/icons/nav_cart.png'),
  trustAuth: require('../../assets/icons/trust_authentic.png'),
  trustService: require('../../assets/icons/trust_service.png'),
  trustShipping: require('../../assets/icons/trust_shipping.png'),
};

// Categories synced with tinyaura.us/collections/*
const CATEGORIES = [
  { title: "Today's\nDeals", handle: 'sale', img: FIGMA.catDeals },
  { title: "Women's\nParfume", handle: 'women', img: FIGMA.catWomen },
  { title: "Men's\nCologne", handle: 'men', img: FIGMA.catMen },
  { title: 'Travel\nSprays', handle: 'unisex', img: FIGMA.catTravel },
  { title: 'Gift\nSets', handle: 'gift-sets', img: FIGMA.catGifts },
];

export default function HomeScreen() {
  const router = useRouter();
  const { getCartItemCount } = useCart();
  const [bestsellers, setBestsellers] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const sliderRef = useRef<FlatList>(null);

  useEffect(() => { loadData(); }, []);

  // Auto-scroll every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => {
        const next = (prev + 1) % SLIDES.length;
        sliderRef.current?.scrollToOffset({ offset: next * HERO_W, animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const onSliderScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / HERO_W);
    if (index >= 0 && index < SLIDES.length) {
      setActiveSlide(index);
    }
  }, []);

  async function loadData() {
    try {
      const products = await getCollectionProducts('best-sellers').catch(() => []);
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

      {/* ══════ TOP BAR ══════ */}
      <View style={s.topBar}>
        <Text style={s.topBarText}>Free US shipping on orders over $50</Text>
      </View>

      {/* ══════ MENU DRAWER ══════ */}
      <MenuDrawer visible={menuOpen} onClose={() => setMenuOpen(false)} router={router} />

      {/* ══════ HEADER ══════ */}
      <View style={s.header}>
        <TouchableOpacity style={s.headerBtn} onPress={() => setMenuOpen(true)}>
          <Text style={{ fontSize: 20, color: '#1a1a1a' }}>☰</Text>
        </TouchableOpacity>
        <Image source={FIGMA.logo} style={s.logo} resizeMode="contain" />
        <View style={s.headerRight}>
          <TouchableOpacity style={s.headerBtn} onPress={() => router.push('/(tabs)/search')}>
            <Text style={{ fontSize: 18 }}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.headerBtn} onPress={() => router.push('/(tabs)/cart')}>
            <Text style={{ fontSize: 18 }}>🛍️</Text>
            {cartCount > 0 && (
              <View style={s.cartBadge}><Text style={s.cartBadgeText}>{cartCount}</Text></View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ══════ SALE STRIP ══════ */}
      <View style={s.saleStrip}>
        <Text style={s.saleText}>75% OFF — Sale! Limited Time Only →</Text>
      </View>

      {/* ══════ HERO SLIDER ══════ */}
      <View style={s.heroWrap}>
        <FlatList
          ref={sliderRef}
          data={SLIDES}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onSliderScroll}
          scrollEventThrottle={16}
          keyExtractor={(item) => item.id}
          getItemLayout={(_, index) => ({ length: HERO_W, offset: HERO_W * index, index })}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.95}
              style={s.slide}
              onPress={() => router.push(item.link as any)}
            >
              <Image source={item.image} style={s.heroImg} resizeMode="cover" />
              <View style={s.heroOverlay}>
                <Text style={s.heroTitle}>{item.title}</Text>
                <Text style={s.heroDesc}>{item.desc}</Text>
                <View style={s.heroBtn}>
                  <Text style={s.heroBtnText}>{item.btnText}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
        {/* Dots */}
        <View style={s.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[s.dot, i === activeSlide && s.dotActive]} />
          ))}
        </View>
      </View>

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

      {/* ══════ 60% OFF PROMO BANNER → /collection/sale ══════ */}
      <TouchableOpacity activeOpacity={0.9} style={s.promoWrap} onPress={() => router.push('/collection/sale')}>
        <Image source={FIGMA.promoBg} style={s.promoImg} resizeMode="cover" />
        <View style={s.promoOverlay}>
          <Text style={s.promoTitle}>60% OFF!</Text>
          <Text style={s.promoSub}>LIMITED TIME HOLIDAY DEALS!</Text>
          <View style={s.promoBtn}>
            <Text style={s.promoBtnText}>SHOP NOW</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* ══════ BESTSELLER ══════ */}
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

      {/* ══════ SHOP BY BRAND — all 10 from tinyaura.us ══════ */}
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
          <TouchableOpacity style={s.brandCell} onPress={() => router.push('/collection/maison-francis-kurkdjian')}>
            <Text style={s.brandMFK}>{'Maison\nFrancis Kurkdjian\nParis'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.brandCell} onPress={() => router.push('/collection/armani')}>
            <Text style={s.brandGeneric}>ARMANI</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.brandCell} onPress={() => router.push('/collection/gucci')}>
            <Text style={s.brandGeneric}>GUCCI</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.brandCell} onPress={() => router.push('/collection/hermes')}>
            <Text style={s.brandHermes}>HERMÈS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.brandCell} onPress={() => router.push('/collection/kilian-paris')}>
            <Text style={s.brandKilian}>KILIAN{'\n'}PARIS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.brandCell} onPress={() => router.push('/collection/louis-vuitton')}>
            <Text style={s.brandLV}>LOUIS VUITTON</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.brandCell} onPress={() => router.push('/collection/parfums-de-marly-paris')}>
            <Text style={s.brandPDM}>{'Parfums de\nMarly Paris'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ══════ TRUST BADGES ══════ */}
      <View style={s.trustBox}>
        <TrustBadge icon="🔒" title="100% AUTHENTIC" desc="Choose from 500+ scents, all in one place" />
        <TrustBadge icon="🎧" title="EXPERT CUSTOMER SERVICE" desc="Our friendly expert team is on hand to assist you" />
        <TrustBadge icon="🚚" title="FAST & FREE U.S. SHIPPING OVER $50" desc="Orders ship on the day you order them & arrive within days" last />
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function TrustBadge({ icon, title, desc, last }: { icon: string; title: string; desc: string; last?: boolean }) {
  return (
    <View style={[s.trustRow, last && { marginBottom: 0 }]}>
      <Text style={s.trustEmoji}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={s.trustTitle}>{title}</Text>
        <Text style={s.trustDesc}>{desc}</Text>
      </View>
    </View>
  );
}

// ─── Menu Drawer Component ──────────────────────────────
function MenuDrawer({ visible, onClose, router }: { visible: boolean; onClose: () => void; router: any }) {
  const [expandedSection, setExpandedSection] = useState<number | null>(0);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={s.drawerOverlay}>
        <Pressable style={s.drawerBackdrop} onPress={onClose} />
        <View style={s.drawer}>
          {/* Close button */}
          <View style={s.drawerHeader}>
            <Text style={s.drawerLogo}>TINY AURA</Text>
            <TouchableOpacity onPress={onClose} style={s.drawerClose}>
              <Text style={{ fontSize: 24, color: '#1a1a1a' }}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={s.drawerContent} showsVerticalScrollIndicator={false}>
            {MENU_SECTIONS.map((section, sIdx) => (
              <View key={sIdx} style={s.drawerSection}>
                <TouchableOpacity
                  style={s.drawerSectionHeader}
                  onPress={() => setExpandedSection(expandedSection === sIdx ? null : sIdx)}
                >
                  <Text style={s.drawerSectionTitle}>{section.title}</Text>
                  <Text style={s.drawerChevron}>{expandedSection === sIdx ? '−' : '+'}</Text>
                </TouchableOpacity>

                {expandedSection === sIdx && section.items.map((item, iIdx) => (
                  <TouchableOpacity
                    key={iIdx}
                    style={s.drawerItem}
                    onPress={() => {
                      onClose();
                      router.push(item.route as any);
                    }}
                  >
                    <Text style={s.drawerItemText}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════
// All measurements for 390px width (iPhone 14 Pro)
// ═══════════════════════════════════════════════════════════
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // ── Top bar ──
  topBar: { backgroundColor: '#1a1a1b', paddingVertical: 6, alignItems: 'center' },
  topBarText: { color: '#FFFFFF', fontSize: 11, fontWeight: '400' },

  // ── Header ──
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, height: 56, backgroundColor: '#FFFFFF',
  },
  headerBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  logo: { width: 110, height: 48 },
  headerRight: { flexDirection: 'row', gap: 8 },
  cartBadge: {
    position: 'absolute', top: -2, right: -4,
    backgroundColor: '#770a0c', borderRadius: 8,
    minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3,
  },
  cartBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },

  // ── Sale strip ──
  saleStrip: { backgroundColor: '#3a2313', paddingVertical: 8, alignItems: 'center' },
  saleText: { color: '#FFFFFF', fontSize: 12, fontWeight: '500' },

  // ── Hero Slider ──
  heroWrap: {
    marginHorizontal: 16, marginTop: 12,
    borderRadius: 16, overflow: 'hidden',
  },
  slide: {
    width: HERO_W,
    height: 220,
    position: 'relative',
  },
  heroImg: {
    width: HERO_W,
    height: 220,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0, left: 0, bottom: 0,
    width: '55%',
    paddingLeft: 20,
    paddingTop: 24,
    justifyContent: 'flex-start',
  },
  dots: {
    flexDirection: 'row', justifyContent: 'center',
    paddingVertical: 10, gap: 6,
  },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#d9d9d9',
  },
  dotActive: {
    width: 20, backgroundColor: '#1a1a1a',
    borderRadius: 4,
  },
  heroTitle: {
    fontSize: 22, fontWeight: '700', color: '#000000',
    fontFamily: Platform.OS === 'web' ? 'Georgia, serif' : 'serif',
    marginBottom: 8,
  },
  heroDesc: { fontSize: 10, color: '#333333', lineHeight: 15, marginBottom: 14 },
  heroBtn: {
    backgroundColor: '#770a0c', paddingHorizontal: 18, paddingVertical: 9,
    borderRadius: 6, alignSelf: 'flex-start',
  },
  heroBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },

  // ── Categories ──
  catRow: { paddingHorizontal: 12, paddingTop: 20, paddingBottom: 8, gap: 12 },
  catItem: { alignItems: 'center', width: 68 },
  catCircle: { width: 68, height: 68, borderRadius: 34, overflow: 'hidden', backgroundColor: '#f5e0d0' },
  catCircleImg: { width: 68, height: 68 },
  catLabel: { fontSize: 11, fontWeight: '500', color: '#1a1a1a', textAlign: 'center', marginTop: 6, lineHeight: 14 },

  // ── 60% OFF promo — position: relative with absolute overlay ──
  promoWrap: {
    marginHorizontal: 16, marginTop: 16,
    borderRadius: 20, overflow: 'hidden',
    position: 'relative',
  },
  promoImg: { width: W - 32, height: 155 },
  promoOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
  },
  promoTitle: {
    fontSize: 34, fontWeight: '700', color: '#FFFFFF',
    fontFamily: Platform.OS === 'web' ? 'Georgia, serif' : 'serif',
    fontStyle: 'italic',
  },
  promoSub: { fontSize: 11, fontWeight: '600', color: '#FFFFFF', letterSpacing: 1.5, marginTop: 4 },
  promoBtn: { backgroundColor: '#FFFFFF', paddingHorizontal: 28, paddingVertical: 10, borderRadius: 24, marginTop: 12 },
  promoBtnText: { fontSize: 12, fontWeight: '700', color: '#770a0c' },

  // ── Bestseller ──
  section: { marginTop: 20 },
  sectionTitle: {
    fontSize: 22, fontWeight: '700', color: '#000000',
    fontFamily: Platform.OS === 'web' ? 'Georgia, serif' : 'serif',
    paddingHorizontal: 16, marginBottom: 14,
  },
  bsRow: { paddingHorizontal: 16, gap: 12 },
  bsCard: { width: 165, backgroundColor: '#FFFFFF' },
  bsBadge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: '#770a0c', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 4, zIndex: 10,
  },
  bsBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '700' },
  bsImgWrap: { backgroundColor: '#b5a97a', height: 155, justifyContent: 'center', alignItems: 'center', padding: 16 },
  bsImg: { width: '100%', height: '100%' },
  bsInfo: { paddingTop: 10, paddingHorizontal: 4, paddingBottom: 4 },
  bsName: { fontSize: 14, fontWeight: '700', color: '#000000' },
  bsVendor: { fontSize: 11, color: '#666666', marginTop: 2, lineHeight: 15 },
  bsPriceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 },
  bsFrom: { fontSize: 11, color: '#888888' },
  bsOldPrice: { fontSize: 12, color: '#999999', textDecorationLine: 'line-through' },
  bsPrice: { fontSize: 16, fontWeight: '700', color: '#000000' },
  bsBtn: { backgroundColor: '#770a0c', paddingVertical: 10, borderRadius: 6, alignItems: 'center', marginTop: 10 },
  bsBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },

  // ── Brands ──
  brandSectionTitle: {
    fontSize: 22, fontWeight: '400',
    fontFamily: Platform.OS === 'web' ? 'Georgia, serif' : 'serif',
    fontStyle: 'italic', color: '#000000', paddingHorizontal: 16, marginBottom: 16,
  },
  brandGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16 },
  brandCell: { width: (W - 32) / 2, height: 80, justifyContent: 'center', alignItems: 'center' },
  brandCreed: {
    fontFamily: Platform.OS === 'web' ? 'Georgia, serif' : 'serif',
    fontSize: 26, fontWeight: '900', color: '#000000', letterSpacing: 4,
  },
  brandCreedX: { fontSize: 10, color: '#000000', marginTop: -4 },
  brandCreedYear: { fontSize: 11, color: '#000000', marginTop: -2 },
  brandTomFord: { fontSize: 20, fontWeight: '700', color: '#000000', letterSpacing: 2 },
  brandDior: {
    fontFamily: Platform.OS === 'web' ? 'Georgia, serif' : 'serif',
    fontSize: 20, fontStyle: 'italic', color: '#000000',
  },
  brandMFK: {
    fontFamily: Platform.OS === 'web' ? 'Georgia, serif' : 'serif',
    fontSize: 14, color: '#000000', textAlign: 'center', lineHeight: 20,
  },
  brandGeneric: {
    fontSize: 18, fontWeight: '700', color: '#000000', letterSpacing: 3,
  },
  brandHermes: {
    fontFamily: Platform.OS === 'web' ? 'Georgia, serif' : 'serif',
    fontSize: 18, fontWeight: '700', color: '#000000', letterSpacing: 2,
  },
  brandKilian: {
    fontSize: 14, fontWeight: '600', color: '#000000',
    textAlign: 'center', letterSpacing: 3, lineHeight: 20,
  },
  brandLV: {
    fontSize: 13, fontWeight: '700', color: '#000000', letterSpacing: 2,
  },
  brandPDM: {
    fontFamily: Platform.OS === 'web' ? 'Georgia, serif' : 'serif',
    fontSize: 13, fontStyle: 'italic', color: '#000000',
    textAlign: 'center', lineHeight: 19,
  },

  // ── Menu Drawer ──
  drawerOverlay: {
    flex: 1, flexDirection: 'row',
  },
  drawerBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawer: {
    position: 'absolute', top: 0, left: 0, bottom: 0,
    width: 300, backgroundColor: '#FFFFFF',
    ...(Platform.OS === 'web' ? { boxShadow: '4px 0 20px rgba(0,0,0,0.15)' } : {}),
  },
  drawerHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 50, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  drawerLogo: {
    fontSize: 18, fontWeight: '700', color: '#1a1a1a', letterSpacing: 2,
  },
  drawerClose: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  drawerContent: { flex: 1, paddingTop: 8 },
  drawerSection: {
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  drawerSectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
  },
  drawerSectionTitle: {
    fontSize: 14, fontWeight: '700', color: '#1a1a1a',
    letterSpacing: 0.5, textTransform: 'uppercase',
  },
  drawerChevron: { fontSize: 20, color: '#999' },
  drawerItem: {
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: '#fafafa',
  },
  drawerItemText: {
    fontSize: 15, color: '#333', fontWeight: '400',
  },

  // ── Trust badges ──
  trustBox: { backgroundColor: '#f5f5f5', borderRadius: 16, marginHorizontal: 16, padding: 20, marginTop: 24 },
  trustRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  trustEmoji: { fontSize: 22, marginRight: 14, marginTop: 0 },
  trustTitle: { fontSize: 13, fontWeight: '800', color: '#000000', letterSpacing: 0.3, marginBottom: 4 },
  trustDesc: { fontSize: 12, color: '#666666', lineHeight: 17 },
});
