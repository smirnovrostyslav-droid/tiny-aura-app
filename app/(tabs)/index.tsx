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
  Pressable,
  Dimensions,
  Animated,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ShopifyProduct } from '../../types/shopify';
import { getCollectionProducts, optimizeImageUrl } from '../../services/shopify';
import { useCart } from '../../services/cartContext';

// ─── Design tokens ───────────────────────────────────────
const BURGUNDY = '#780b0c';
const DARK_BROWN = '#3a2313';
const HEADING_FONT = Platform.OS === 'web' ? 'Cormorant, serif' : 'serif';

// ─── Menu sections ───────────────────────────────────────
const MENU_SECTIONS = [
  {
    title: 'Shop',
    items: [
      { label: 'Women', route: '/collection/women' },
      { label: 'Men', route: '/collection/men' },
      { label: 'Best Sellers', route: '/collection/best-sellers' },
      { label: 'Gift Sets', route: '/collection/gift-sets' },
      { label: 'Sale', route: '/collection/sale-1' },
      { label: 'Unisex', route: '/collection/unisex' },
      { label: 'Shop All', route: '/collection/all' },
    ],
  },
  {
    title: 'Brands',
    items: [
      { label: 'Creed', route: '/collection/creed' },
      { label: 'Dior', route: '/collection/dior' },
      { label: 'Chanel', route: '/collection/chanel' },
      { label: 'Tom Ford', route: '/collection/tom-ford' },
      { label: 'Louis Vuitton', route: '/collection/louis-vuitton' },
      { label: 'Le Labo', route: '/collection/le-labo' },
      { label: 'Kilian Paris', route: '/collection/kilian-paris' },
      { label: 'MFK', route: '/collection/maison-francis-kurkdjian' },
      { label: 'Parfums de Marly', route: '/collection/parfums-de-marly-paris' },
      { label: 'Xerjoff', route: '/collection/xerjoff' },
    ],
  },
  {
    title: 'More',
    items: [
      { label: 'About Us', route: 'https://kissofaroma.shop/pages/about-us' },
      { label: 'Contact', route: 'https://kissofaroma.shop/pages/contact' },
      { label: 'FAQ', route: 'https://kissofaroma.shop/pages/faq' },
      { label: 'My Cart', route: '/(tabs)/cart' },
      { label: 'Wishlist', route: '/(tabs)/wishlist' },
    ],
  },
];

// ─── Dynamic dimensions ──────────────────────────────────
const { width: SCREEN_W } = Dimensions.get('window');
const HERO_W = SCREEN_W;
const HERO_H = Math.round(SCREEN_W * 1.1);

// ─── Hero slides — using KOA banner assets ───────────────
const SLIDES = [
  {
    id: '1',
    image: require('../../assets/koa/BANER_1_mob_1.png'),
    title: 'Luxury Perfume\nSamples',
    subtitle: 'TRY BEFORE FULL SIZE\n100+ authentic designer & niche\nscents in 1-10 ml sizes',
    btnText: 'Shop Samples from $4.99',
    link: '/collection/all',
  },
  {
    id: '2',
    image: require('../../assets/koa/First slide 1.png'),
    title: 'Best Sellers',
    subtitle: 'Discover our most popular\nniche & designer fragrances.',
    btnText: 'SHOP NOW',
    link: '/collection/best-sellers',
  },
];

// ─── How It Works steps ──────────────────────────────────
const STEPS = [
  {
    num: '01',
    title: 'Pick Your Scent',
    desc: 'Shop 100+ authentic fragrances — from bestsellers to niche finds.',
    img: require('../../assets/koa/How It Work 1.jpg'),
  },
  {
    num: '02',
    title: 'Choose Your Size',
    desc: 'Start small with sample vials or sprays, or upgrade to 5 ml and 10 ml travel sprays.',
    img: require('../../assets/koa/How It Work 2.png'),
  },
  {
    num: '03',
    title: 'Fast Shipping',
    desc: 'Most orders ship within 1-5 business days, so you can enjoy your fragrance without the wait.',
    img: require('../../assets/koa/How It Work 3.jpg'),
  },
];

// ─── Brands carousel ────────────────────────────────────
const BRAND_ITEM_W = Math.floor(SCREEN_W / 3.5);
const BRAND_LOGOS = {
  creed: require('../../assets/brands/creed.png'),
  tomford: require('../../assets/brands/tom_ford.png'),
  dior: require('../../assets/brands/christiandior.png'),
  mfk: require('../../assets/brands/mfk.png'),
  armani: require('../../assets/brands/armani.png'),
  gucci: require('../../assets/brands/gucci.png'),
  hermes: require('../../assets/brands/hermes.png'),
  kilian: require('../../assets/brands/kilian.png'),
  lv: require('../../assets/brands/louisvuitton.png'),
  pdm: require('../../assets/brands/pdm.png'),
};
const BRANDS_BASE = [
  { handle: 'creed', logo: BRAND_LOGOS.creed },
  { handle: 'tom-ford', logo: BRAND_LOGOS.tomford },
  { handle: 'dior', logo: BRAND_LOGOS.dior },
  { handle: 'maison-francis-kurkdjian', logo: BRAND_LOGOS.mfk },
  { handle: 'armani', logo: BRAND_LOGOS.armani },
  { handle: 'gucci', logo: BRAND_LOGOS.gucci },
  { handle: 'hermes', logo: BRAND_LOGOS.hermes },
  { handle: 'kilian-paris', logo: BRAND_LOGOS.kilian },
  { handle: 'louis-vuitton', logo: BRAND_LOGOS.lv },
  { handle: 'parfums-de-marly-paris', logo: BRAND_LOGOS.pdm },
];
const BRAND_REPEATS = 20;
const BRANDS_LOOP = Array.from({ length: BRAND_REPEATS }, (_, r) =>
  BRANDS_BASE.map((b, i) => ({ ...b, _key: `br-${r}-${i}` }))
).flat();
const BRAND_MID_OFFSET = Math.floor(BRAND_REPEATS / 2) * BRANDS_BASE.length * BRAND_ITEM_W;

// ─── Nav links (horizontal bar under header) ─────────────
const NAV_LINKS = [
  { label: 'WOMEN', route: '/collection/women' },
  { label: 'MEN', route: '/collection/men' },
  { label: 'UNISEX', route: '/collection/unisex' },
  { label: 'BEST SELLERS', route: '/collection/best-sellers' },
  { label: 'GIFT 🎁', route: '/collection/gift-sets' },
  { label: 'SALE', route: '/collection/sale-1' },
];

// ─── Product card dimensions ─────────────────────────────
const PRODUCT_CARD_W = Math.floor((SCREEN_W - 48) / 2);

// ─── Fixed header height calculation ─────────────────────
const HEADER_H = 52;

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getCartItemCount } = useCart();
  const [bestsellers, setBestsellers] = useState<ShopifyProduct[]>([]);
  const [womenProducts, setWomenProducts] = useState<ShopifyProduct[]>([]);
  const [menProducts, setMenProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const sliderRef = useRef<FlatList>(null);
  const brandRef = useRef<FlatList>(null);
  const heroTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heroRestartTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll brand carousel to middle on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      brandRef.current?.scrollToOffset({ offset: BRAND_MID_OFFSET, animated: false });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Brand carousel infinite loop reset
  const onBrandScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const totalW = BRANDS_LOOP.length * BRAND_ITEM_W;
    const oneSetW = BRANDS_BASE.length * BRAND_ITEM_W;
    if (x < oneSetW * 2 || x > totalW - oneSetW * 2) {
      const itemInSet = Math.round(x / BRAND_ITEM_W) % BRANDS_BASE.length;
      const midOffset = BRAND_MID_OFFSET + itemInSet * BRAND_ITEM_W;
      brandRef.current?.scrollToOffset({ offset: midOffset, animated: false });
    }
  }, []);

  useEffect(() => { loadData(); }, []);

  // Auto-scroll hero every 5 seconds
  const startHeroTimer = useCallback(() => {
    if (heroTimerRef.current) clearInterval(heroTimerRef.current);
    heroTimerRef.current = setInterval(() => {
      setActiveSlide((prev) => {
        const next = (prev + 1) % SLIDES.length;
        sliderRef.current?.scrollToOffset({ offset: next * HERO_W, animated: true });
        return next;
      });
    }, 5000);
  }, []);

  useEffect(() => {
    startHeroTimer();
    return () => {
      if (heroTimerRef.current) clearInterval(heroTimerRef.current);
      if (heroRestartTimeout.current) clearTimeout(heroRestartTimeout.current);
    };
  }, [startHeroTimer]);

  const onHeroScrollBeginDrag = useCallback(() => {
    if (heroTimerRef.current) {
      clearInterval(heroTimerRef.current);
      heroTimerRef.current = null;
    }
    if (heroRestartTimeout.current) {
      clearTimeout(heroRestartTimeout.current);
      heroRestartTimeout.current = null;
    }
  }, []);

  const onHeroScrollEndDrag = useCallback(() => {
    heroRestartTimeout.current = setTimeout(() => {
      startHeroTimer();
    }, 5000);
  }, [startHeroTimer]);

  const onSliderScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / HERO_W);
    if (index >= 0 && index < SLIDES.length) {
      setActiveSlide(index);
    }
  }, []);

  async function loadData() {
    try {
      const [bs, women, men] = await Promise.all([
        getCollectionProducts('best-sellers').catch(() => []),
        getCollectionProducts('women').catch(() => []),
        getCollectionProducts('men').catch(() => []),
      ]);
      setBestsellers(bs);
      setWomenProducts(women);
      setMenProducts(men);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  if (loading) {
    return <View style={s.center}><ActivityIndicator size="large" color={BURGUNDY} /></View>;
  }

  const cartCount = getCartItemCount();

  return (
    <View style={s.root}>
      {/* ══════ FIXED TOP SECTION ══════ */}
      <View style={[s.fixedTop, { paddingTop: insets.top }]}>
        {/* Announcement bar */}
        <View style={s.announcementBar}>
          <Text style={s.announcementText}>
            ✓ 100% Authentic Perfumes  {'•'}  Free US Shipping $59+  {'•'}  Samples From $4.99
          </Text>
        </View>

        {/* Header */}
        <View style={s.header}>
          <TouchableOpacity style={s.headerBtn} onPress={() => setMenuOpen(true)} accessibilityLabel="Open menu" accessibilityRole="button">
            <Ionicons name="menu-outline" size={24} color="#1a1a1a" />
          </TouchableOpacity>

          <Image source={require('../../assets/koa/logo_transparent.png')} style={s.logo} resizeMode="contain" accessibilityLabel="Kiss of Aroma logo" />

          <View style={s.headerRight}>
            <TouchableOpacity style={s.headerBtn} onPress={() => router.push('/(tabs)/search')} accessibilityLabel="Search" accessibilityRole="button">
              <Ionicons name="search-outline" size={22} color="#1a1a1a" />
            </TouchableOpacity>
            <TouchableOpacity style={s.headerBtn} onPress={() => router.push('/(tabs)/cart')} accessibilityLabel={cartCount > 0 ? `Cart, ${cartCount} items` : 'Cart'} accessibilityRole="button">
              <Ionicons name="bag-outline" size={22} color="#1a1a1a" />
              {cartCount > 0 && (
                <View style={s.cartBadge}><Text style={s.cartBadgeText}>{cartCount}</Text></View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ══════ MENU DRAWER ══════ */}
      <MenuDrawer visible={menuOpen} onClose={() => setMenuOpen(false)} router={router} insets={insets} />

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BURGUNDY} colors={[BURGUNDY]} />}>

        {/* ══════ NAV LINKS ══════ */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.navBar} contentContainerStyle={s.navBarInner}>
          {NAV_LINKS.map((link) => (
            <TouchableOpacity key={link.label} style={s.navItem} onPress={() => router.push(link.route as any)} accessibilityLabel={link.label} accessibilityRole="link">
              <Text style={s.navItemText}>{link.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ══════ HERO SLIDESHOW ══════ */}
        <View style={s.heroWrap}>
          <FlatList
            ref={sliderRef}
            data={SLIDES}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onSliderScroll}
            onScrollBeginDrag={onHeroScrollBeginDrag}
            onScrollEndDrag={onHeroScrollEndDrag}
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
                <LinearGradient
                  colors={['transparent', 'rgba(255,255,255,0.08)', 'transparent']}
                  start={{ x: 0, y: 0.4 }}
                  end={{ x: 0, y: 0.6 }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                  pointerEvents="none"
                />
                <View style={s.heroOverlay}>
                  <Text style={s.heroTitle}>{item.title}</Text>
                  <Text style={s.heroSubtitle}>{item.subtitle}</Text>
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

        {/* ══════ SCROLLING TICKER (animated) ══════ */}
        <TickerMarquee />

        {/* ══════ SHOP BY BRAND ══════ */}
        <View style={s.section}>
          <FlatList
            ref={brandRef}
            data={BRANDS_LOOP}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={BRAND_ITEM_W}
            decelerationRate="fast"
            onMomentumScrollEnd={onBrandScrollEnd}
            getItemLayout={(_, index) => ({ length: BRAND_ITEM_W, offset: BRAND_ITEM_W * index, index })}
            keyExtractor={(item) => item._key}
            renderItem={({ item: b }) => (
              <TouchableOpacity style={s.brandCellSmall} onPress={() => router.push(`/collection/${b.handle}`)}>
                <Image source={b.logo} style={s.brandLogoSmall} resizeMode="contain" />
              </TouchableOpacity>
            )}
          />
        </View>

        {/* ══════ PROMO BANNER ══════ */}
        <TouchableOpacity style={s.promoBanner} onPress={() => router.push('/collection/all')} activeOpacity={0.9}>
          <Image source={require('../../assets/koa/small baner.png')} style={s.promoBannerImg} resizeMode="cover" />
          <View style={s.promoBannerOverlay}>
            <Text style={s.promoBannerTitle}>SAVE UP TO 43%</Text>
            <View style={s.promoBannerBtn}>
              <Text style={s.promoBannerBtnText}>SHOP NOW</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* ══════ BEST SELLERS ══════ */}
        <View style={s.section}>
          <View style={s.sectionHeaderRow}>
            <Text style={s.sectionHeading}>BEST SELLERS</Text>
            <TouchableOpacity onPress={() => router.push('/collection/best-sellers')}>
              <Text style={s.viewAllText}>Shop All Perfumes</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.productRow}>
            {bestsellers.slice(0, 10).map((product) => (
              <ProductCardInline key={product.id} product={product} router={router} isBestSeller />
            ))}
          </ScrollView>
        </View>

        {/* ══════ HOW DOES IT WORK ══════ */}
        <View style={s.howSection}>
          <Text style={s.howTitle}>How Does It Work?</Text>
          <Text style={s.howSubtitle}>3 Simple Steps</Text>
          <StepsSlider />
          <TouchableOpacity style={s.howCta} onPress={() => router.push('/collection/all')}>
            <Text style={s.howCtaText}>SHOP SAMPLES FROM $4.99</Text>
          </TouchableOpacity>
        </View>

        {/* ══════ WOMEN'S PERFUMES (2-col grid, 2 rows = 4 products) ══════ */}
        {womenProducts.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeaderRow}>
              <Text style={s.sectionHeading}>Women's Perfumes</Text>
              <TouchableOpacity onPress={() => router.push('/collection/women')}>
                <Text style={s.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={s.productGrid}>
              {womenProducts.slice(0, 6).map((product) => (
                <ProductCardGrid key={product.id} product={product} router={router} />
              ))}
            </View>
            <TouchableOpacity style={s.sectionCta} onPress={() => router.push('/collection/women')}>
              <Text style={s.sectionCtaText}>SHOP NOW</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ══════ MEN'S COLOGNE (2-col grid, 2 rows = 4 products) ══════ */}
        {menProducts.length > 0 && (
          <View style={s.section}>
            <View style={s.sectionHeaderRow}>
              <Text style={s.sectionHeading}>Men's Cologne</Text>
              <TouchableOpacity onPress={() => router.push('/collection/men')}>
                <Text style={s.viewAllText}>Shop All Colognes</Text>
              </TouchableOpacity>
            </View>
            <View style={s.productGrid}>
              {menProducts.slice(0, 6).map((product) => (
                <ProductCardGrid key={product.id} product={product} router={router} />
              ))}
            </View>
            <TouchableOpacity style={s.sectionCta} onPress={() => router.push('/collection/men')}>
              <Text style={s.sectionCtaText}>SHOP NOW</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ══════ TRUST BADGES ══════ */}
        <View style={s.trustSection}>
          <TrustBadge icon={'✓'} title="100% Authentic" desc="Choose from 100+ scents, all in one place" />
          <TrustBadge icon={'🎧'} title="Expert Customer Service" desc="Our friendly, expert team is on hand to assist you" />
          <TrustBadge icon={'🚚'} title="Fast & Free U.S. Shipping Over $59" desc="Orders ship on the day you order them. Arrive within days." last />
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerBrand}>Kiss of Aroma</Text>
          <Text style={s.footerContact}>support@kissofaroma.shop | +1 949 337 8464</Text>
          <Text style={s.footerAddress}>1022 Family Tree, Irvine, CA 92618</Text>
          <Text style={s.footerCopy}>{'©'} 2026 Kiss of Aroma. All rights reserved.</Text>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

// ─── Inline product card (horizontal scroll) ─────────────
function ProductCardInline({ product, router, isBestSeller = false }: { product: ShopifyProduct; router: any; isBestSeller?: boolean }) {
  const price = product.priceRange?.minVariantPrice;
  const comparePrice = product.compareAtPriceRange?.minVariantPrice;
  const rawImageUrl = product.images?.edges?.[0]?.node?.url;
  const imageUrl = rawImageUrl ? optimizeImageUrl(rawImageUrl, 330) : null;
  const vendor = product.vendor || '';
  const hasDiscount = comparePrice && parseFloat(comparePrice.amount) > parseFloat(price?.amount || '0');
  const discountPercent = hasDiscount && comparePrice ? Math.round((1 - parseFloat(price?.amount || '0') / parseFloat(comparePrice.amount)) * 100) : 0;

  return (
    <TouchableOpacity style={s.prodCardInline} onPress={() => router.push(`/product/${product.handle}`)} accessibilityLabel={`${product.title}, from $${parseFloat(price?.amount || '0').toFixed(2)}`} accessibilityRole="button">
      <View style={s.prodImgWrap}>
        {imageUrl ? (
          <ExpoImage source={{ uri: imageUrl }} style={s.prodImg} contentFit="cover" transition={200} cachePolicy="memory-disk" />
        ) : (
          <View style={s.prodImgPlaceholder}><Text style={{ color: '#999' }}>No Image</Text></View>
        )}
        {/* Badges */}
        {isBestSeller && (
          <View style={[s.prodBadge, { backgroundColor: '#2E7D32' }]}><Text style={s.prodBadgeText}>Best Seller</Text></View>
        )}
        {discountPercent > 0 && (
          <View style={[s.prodBadge, { backgroundColor: '#C41E3A', top: isBestSeller ? 26 : 6 }]}><Text style={s.prodBadgeText}>{discountPercent}% OFF</Text></View>
        )}
      </View>
      <View style={s.prodInfo}>
        <Text style={s.prodName} numberOfLines={2}>{product.title}</Text>
        {vendor ? <Text style={s.prodVendor} numberOfLines={1}>{vendor}</Text> : null}
        <View style={s.prodPriceRow}>
          <Text style={s.prodPrice}>From ${parseFloat(price?.amount || '0').toFixed(2)}</Text>
          {hasDiscount && comparePrice && (
            <Text style={s.prodOldPrice}>${parseFloat(comparePrice.amount).toFixed(2)}</Text>
          )}
        </View>
        <TouchableOpacity style={s.prodBtn} onPress={() => router.push(`/product/${product.handle}`)}>
          <Text style={s.prodBtnText}>SELECT SIZE</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ─── Grid product card ───────────────────────────────────
function ProductCardGrid({ product, router }: { product: ShopifyProduct; router: any }) {
  const price = product.priceRange?.minVariantPrice;
  const comparePrice = product.compareAtPriceRange?.minVariantPrice;
  const rawImageUrl = product.images?.edges?.[0]?.node?.url;
  const imageUrl = rawImageUrl ? optimizeImageUrl(rawImageUrl, 400) : null;
  const vendor = product.vendor || '';
  const hasDiscount = comparePrice && parseFloat(comparePrice.amount) > parseFloat(price?.amount || '0');
  const discountPercent = hasDiscount && comparePrice ? Math.round((1 - parseFloat(price?.amount || '0') / parseFloat(comparePrice.amount)) * 100) : 0;

  return (
    <TouchableOpacity style={s.gridCard} onPress={() => router.push(`/product/${product.handle}`)} accessibilityLabel={`${product.title}, from $${parseFloat(price?.amount || '0').toFixed(2)}`} accessibilityRole="button">
      <View style={s.gridImgWrap}>
        {imageUrl ? (
          <ExpoImage source={{ uri: imageUrl }} style={s.gridImg} contentFit="cover" transition={200} cachePolicy="memory-disk" />
        ) : (
          <View style={s.gridImgPlaceholder}><Text style={{ color: '#999' }}>No Image</Text></View>
        )}
        {discountPercent > 0 && (
          <View style={[s.prodBadge, { backgroundColor: '#C41E3A' }]}><Text style={s.prodBadgeText}>{discountPercent}% OFF</Text></View>
        )}
      </View>
      <View style={s.gridInfo}>
        <Text style={s.gridName} numberOfLines={2}>{product.title}</Text>
        {vendor ? <Text style={s.gridVendor} numberOfLines={1}>{vendor}</Text> : null}
        <View style={s.prodPriceRow}>
          <Text style={s.gridPrice}>From ${parseFloat(price?.amount || '0').toFixed(2)}</Text>
          {hasDiscount && comparePrice && <Text style={s.prodOldPrice}>${parseFloat(comparePrice.amount).toFixed(2)}</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Trust badge ─────────────────────────────────────────
// ─── Steps slider with dots ─────────────────────────────
function StepsSlider() {
  const [activeStep, setActiveStep] = useState(0);
  return (
    <View>
      <FlatList
        data={STEPS}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.num}
        onScroll={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
          setActiveStep(idx);
        }}
        scrollEventThrottle={16}
        renderItem={({ item: step }) => (
          <View style={[s.stepCard, { width: SCREEN_W, paddingHorizontal: 16 }]}>
            <View style={s.stepCardInner}>
              <Image source={step.img} style={s.stepImg} resizeMode="cover" />
              <View style={s.stepOverlay}>
                <View style={s.stepNumBadge}>
                  <Text style={s.stepNum}>{step.num}</Text>
                </View>
                <Text style={s.stepTitle}>{step.title}</Text>
                <Text style={s.stepDesc}>{step.desc}</Text>
              </View>
            </View>
          </View>
        )}
      />
      <View style={s.stepDots}>
        {STEPS.map((_, i) => (
          <View key={i} style={[s.stepDot, i === activeStep && s.stepDotActive]} />
        ))}
      </View>
    </View>
  );
}

// ─── Animated scrolling ticker ──────────────────────────
function TickerMarquee() {
  const scrollX = useRef(new Animated.Value(0)).current;
  const [blockW, setBlockW] = useState(0);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (blockW > 0) {
      scrollX.setValue(0);
      animRef.current = Animated.loop(
        Animated.timing(scrollX, {
          toValue: -blockW,
          duration: blockW * 20,
          useNativeDriver: true,
          isInteraction: false,
        })
      );
      animRef.current.start();
    }
    return () => { animRef.current?.stop(); };
  }, [blockW]);

  const items = ['100% AUTHENTIC PERFUMES', 'SAMPLES FROM $4.99', 'FREE US SHIPPING $59+', 'TRY BEFORE YOU BUY'];

  const TickerBlock = ({ onLayout }: { onLayout?: (e: any) => void }) => (
    <View style={s.tickerBlock} onLayout={onLayout}>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          <Text style={s.tickerItemText}>{item}</Text>
          <Text style={s.tickerDot}>✦</Text>
        </React.Fragment>
      ))}
    </View>
  );

  return (
    <View style={s.ticker}>
      <Animated.View style={[s.tickerRow, { transform: [{ translateX: scrollX }] }]}>
        <TickerBlock onLayout={(e: any) => setBlockW(e.nativeEvent.layout.width)} />
        <TickerBlock />
        <TickerBlock />
      </Animated.View>
    </View>
  );
}

function TrustBadge({ icon, title, desc, last }: { icon: string; title: string; desc: string; last?: boolean }) {
  return (
    <View style={[s.trustRow, last && { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 }]}>
      <Text style={s.trustIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={s.trustTitle}>{title}</Text>
        <Text style={s.trustDesc}>{desc}</Text>
      </View>
    </View>
  );
}

// ─── Menu Drawer ─────────────────────────────────────────
function MenuDrawer({ visible, onClose, router, insets }: { visible: boolean; onClose: () => void; router: any; insets: any }) {
  const [expandedSection, setExpandedSection] = useState<number | null>(0);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={s.drawerOverlay}>
        <Pressable style={s.drawerBackdrop} onPress={onClose} />
        <View style={[s.drawer, { paddingTop: insets.top }]}>
          <View style={s.drawerHeader}>
            <Text style={s.drawerLogo}>KISS OF AROMA</Text>
            <TouchableOpacity onPress={onClose} style={s.drawerClose}>
              <Ionicons name="close" size={22} color="#000" />
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
                      if (item.route.startsWith('http')) {
                        onClose();
                        setTimeout(() => {
                          WebBrowser.openBrowserAsync(item.route).catch((e: any) =>
                            console.error('Error opening browser:', e)
                          );
                        }, 300);
                      } else {
                        onClose();
                        router.push(item.route as any);
                      }
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
// Styles
// ═══════════════════════════════════════════════════════════
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },

  // ── Fixed top ──
  fixedTop: {
    backgroundColor: '#FFFFFF',
    zIndex: 100,
    borderBottomWidth: 1,
    borderBottomColor: '#e6e6e6',
  },

  // ── Announcement bar ──
  announcementBar: {
    backgroundColor: DARK_BROWN,
    paddingVertical: 6,
    alignItems: 'center',
  },
  announcementText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '400',
    letterSpacing: 0.3,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: HEADER_H,
    backgroundColor: '#FFFFFF',
  },
  headerBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hamburger: {
    fontSize: 22,
    color: '#000',
  },
  logo: { width: 140, height: 52 },
  headerRight: { flexDirection: 'row', gap: 4 },
  headerIcon: { fontSize: 18 },
  cartBadge: {
    position: 'absolute', top: 0, right: -2,
    backgroundColor: BURGUNDY, borderRadius: 8,
    minWidth: 16, height: 16,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },

  // ── Nav bar ──
  navBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e6e6e6',
  },
  navBarInner: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 20,
  },
  navItem: {},
  navItemText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#000',
    letterSpacing: 0.8,
  },

  // ── Hero ──
  heroWrap: { overflow: 'hidden', borderRadius: 0, borderWidth: 0, marginHorizontal: 0 },
  slide: {
    width: SCREEN_W,
    height: HERO_H,
    position: 'relative',
  },
  heroImg: {
    width: SCREEN_W,
    height: HERO_H,
    borderRadius: 0,
    opacity: 0.95,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0, left: 0, bottom: 0,
    width: '60%',
    paddingLeft: 24,
    paddingTop: 40,
    justifyContent: 'flex-start',
    backgroundColor: 'rgba(245, 235, 222, 0.15)',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
    fontFamily: HEADING_FONT,
    marginBottom: 12,
    lineHeight: 38,
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#333',
    lineHeight: 18,
    marginBottom: 20,
  },
  heroBtn: {
    backgroundColor: BURGUNDY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  heroBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#d9d9d9',
  },
  dotActive: {
    width: 24,
    backgroundColor: BURGUNDY,
    borderRadius: 4,
  },

  // ── Sections ──
  section: { marginTop: 28 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  sectionHeading: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    fontFamily: HEADING_FONT,
  },
  viewAllText: {
    fontSize: 13,
    color: BURGUNDY,
    fontWeight: '500',
  },

  // ── Product cards (horizontal) ──
  productRow: { paddingHorizontal: 16, gap: 12 },
  prodCardInline: {
    width: 160,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e6e6e6',
    overflow: 'hidden',
  },
  prodImgWrap: {
    backgroundColor: '#f5f5f5',
    height: Math.round(160 * 1.3),
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
  },
  prodImg: { width: '100%', height: '100%' },
  prodImgPlaceholder: {
    width: '100%', height: '100%',
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  prodInfo: { padding: 10 },
  prodName: { fontSize: 13, fontWeight: '700', color: '#000' },
  prodVendor: { fontSize: 11, color: '#888', marginTop: 2 },
  prodPrice: { fontSize: 14, fontWeight: '700', color: '#000', marginTop: 6 },
  prodBtn: {
    backgroundColor: BURGUNDY,
    paddingVertical: 9,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
  },
  prodBtnText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  // ── Product grid ──
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  gridCard: {
    width: PRODUCT_CARD_W,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e6e6e6',
    overflow: 'hidden',
  },
  gridImgWrap: {
    backgroundColor: '#f5f5f5',
    height: Math.round(PRODUCT_CARD_W * 1.3),
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
  },
  gridImg: { width: '100%', height: '100%' },
  gridImgPlaceholder: {
    width: '100%', height: '100%',
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  gridInfo: { padding: 10 },
  gridName: { fontSize: 13, fontWeight: '700', color: '#000' },
  gridVendor: { fontSize: 11, color: '#888', marginTop: 2 },
  gridPrice: { fontSize: 14, fontWeight: '700', color: '#000', marginTop: 6 },

  // ── Brands ──
  brandCellSmall: {
    width: Math.floor(SCREEN_W / 3.5),
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderColor: '#e6e6e6',
    backgroundColor: '#fff',
  },
  brandLogoSmall: { width: Math.floor(SCREEN_W / 3.5) - 20, height: 36 },

  // ── Ticker ──
  ticker: { backgroundColor: '#f5ebe0', paddingVertical: 10, overflow: 'hidden' as const, height: 36 },
  tickerRow: { flexDirection: 'row' as const, alignItems: 'center' as const, height: 16 },
  tickerBlock: { flexDirection: 'row' as const, alignItems: 'center' as const },
  tickerItemText: { fontSize: 11, fontWeight: '600' as const, color: '#3a2313', letterSpacing: 0.5 },
  tickerDot: { fontSize: 8, color: '#3a2313', marginHorizontal: 8 },

  // ── Section CTA button ──
  sectionCta: {
    marginHorizontal: 16, marginTop: 12, paddingVertical: 14,
    borderWidth: 1, borderColor: '#000', borderRadius: 12, alignItems: 'center' as const,
  },
  sectionCtaText: { fontSize: 14, fontWeight: '600' as const, color: '#000', letterSpacing: 1 },

  // ── How It Works ──
  howSection: { marginTop: 36, paddingBottom: 24 },
  howTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#000',
    fontFamily: HEADING_FONT,
    textAlign: 'center',
    marginBottom: 4,
  },
  howSubtitle: {
    fontSize: 15,
    fontWeight: '400',
    fontFamily: HEADING_FONT,
    fontStyle: 'italic',
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  stepCard: {
    marginBottom: 16,
    height: 220,
  },
  stepCardInner: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  stepImg: {
    width: '100%',
    height: '100%',
  },
  stepOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  stepNumBadge: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: BURGUNDY,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 6,
  },
  stepNum: { color: '#fff', fontSize: 13, fontWeight: '700' },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    fontFamily: HEADING_FONT,
    marginBottom: 4,
  },
  stepDesc: { fontSize: 12, color: 'rgba(255,255,255,0.9)', lineHeight: 17 },
  stepDots: { flexDirection: 'row' as const, justifyContent: 'center' as const, gap: 6, marginTop: 12 },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ccc' },
  stepDotActive: { backgroundColor: '#000', width: 20, borderRadius: 4 },
  howCta: {
    backgroundColor: BURGUNDY,
    paddingVertical: 14,
    borderRadius: 4,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
  },
  howCtaText: { color: '#fff', fontSize: 13, fontWeight: '700', letterSpacing: 1 },

  // ── Trust section ──
  trustSection: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 20,
    marginTop: 28,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e6e6e6',
  },
  trustIcon: { fontSize: 22, marginRight: 14, marginTop: 0 },
  trustTitle: { fontSize: 13, fontWeight: '800', color: '#000', letterSpacing: 0.3, marginBottom: 3 },
  trustDesc: { fontSize: 12, color: '#666', lineHeight: 17 },

  // ── Footer ──
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e6e6e6',
  },
  footerBrand: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    fontFamily: HEADING_FONT,
    marginBottom: 6,
  },
  footerContact: { fontSize: 12, color: '#666', marginBottom: 4 },
  footerAddress: { fontSize: 12, color: '#666', marginBottom: 8 },
  footerCopy: { fontSize: 11, color: '#999' },

  // Promo banner
  promoBanner: { marginHorizontal: 16, marginTop: 16, borderRadius: 16, overflow: 'hidden', position: 'relative' as const },
  promoBannerImg: { width: '100%' as const, height: 180 },
  promoBannerOverlay: { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center' as const, alignItems: 'center' as const },
  promoBannerTitle: { fontSize: 28, fontWeight: '700' as const, color: '#000', fontFamily: HEADING_FONT, marginBottom: 12 },
  promoBannerBtn: { backgroundColor: BURGUNDY, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  promoBannerBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' as const },

  // Product badges
  prodBadge: { position: 'absolute' as const, top: 6, left: 6, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 100, zIndex: 10 },
  prodBadgeText: { color: '#fff', fontSize: 8, fontWeight: '600' as const },
  prodPriceRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, marginTop: 4 },
  prodOldPrice: { fontSize: 13, color: '#000', textDecorationLine: 'line-through' as const },

  // ── Drawer ──
  drawerOverlay: { flex: 1, flexDirection: 'row' },
  drawerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  drawer: {
    position: 'absolute', top: 0, left: 0, bottom: 0,
    width: 300, backgroundColor: '#FFFFFF',
    ...(Platform.OS === 'web' ? { boxShadow: '4px 0 20px rgba(0,0,0,0.15)' } : {}),
  },
  drawerHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#e6e6e6',
  },
  drawerLogo: {
    fontSize: 16, fontWeight: '700', color: '#000', letterSpacing: 2,
    fontFamily: HEADING_FONT,
  },
  drawerClose: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  drawerContent: { flex: 1, paddingTop: 4 },
  drawerSection: { borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  drawerSectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  drawerSectionTitle: {
    fontSize: 13, fontWeight: '700', color: '#000',
    letterSpacing: 0.5, textTransform: 'uppercase',
  },
  drawerChevron: { fontSize: 20, color: '#999' },
  drawerItem: {
    paddingHorizontal: 20, paddingVertical: 12,
    backgroundColor: '#fafafa',
  },
  drawerItemText: { fontSize: 14, color: '#333', fontWeight: '400' },
});
