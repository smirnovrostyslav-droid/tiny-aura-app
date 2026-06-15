import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
  Share,
  Platform,
  FlatList,
  TextInput,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
} from 'react-native';
import { Toast } from '../../components/Toast';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import { ShopifyProduct, ShopifyProductVariant } from '../../types/shopify';
import { getProductByHandle, getCollectionProducts, optimizeImageUrl } from '../../services/shopify';
import { useCart } from '../../services/cartContext';
import { useWishlist } from '../../services/wishlistContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BURGUNDY = '#780b0c';
const BADGE_RED = '#C41E3A';
const HEADING_FONT = Platform.OS === 'web' ? 'Cormorant, serif' : 'serif';
const { width } = Dimensions.get('window');

// Badge config for size variants
const SIZE_BADGES: Record<string, { label: string; bg: string; color: string }> = {
  '3 ml': { label: 'BEST SELLER', bg: '#f5e6c8', color: '#8b6914' },
  '3ml': { label: 'BEST SELLER', bg: '#f5e6c8', color: '#8b6914' },
  '5 ml': { label: 'SAVE MORE', bg: '#d4edda', color: '#2d6a3f' },
  '5ml': { label: 'SAVE MORE', bg: '#d4edda', color: '#2d6a3f' },
  '10 ml': { label: 'BEST VALUE', bg: '#28a745', color: '#fff' },
  '10ml': { label: 'BEST VALUE', bg: '#28a745', color: '#fff' },
};

export default function ProductDetailScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState<ShopifyProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<ShopifyProductVariant | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<ShopifyProduct[]>([]);
  const [descExpanded, setDescExpanded] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '' });

  const stickyBarOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (handle) loadProduct();
  }, [handle]);

  useEffect(() => {
    Animated.timing(stickyBarOpacity, {
      toValue: showStickyBar ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [showStickyBar]);

  async function loadProduct() {
    if (!handle) return;
    try {
      const data = await getProductByHandle(handle);
      setProduct(data);
      setCurrentImageIndex(0);
      if (data.variants.edges.length > 0) {
        const threeml = data.variants.edges.find(e => e.node.title.includes('3 ml') || e.node.title.includes('3ml'));
        setSelectedVariant(threeml ? threeml.node : data.variants.edges[0].node);
      }
      // Fire related products in background (non-blocking, non-critical)
      loadRelatedProducts();
    } catch (error) {
      console.error('Error loading product:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadRelatedProducts() {
    try {
      const products = await getCollectionProducts('best-sellers');
      const filtered = products.filter((p) => p.handle !== handle).slice(0, 6);
      setRelatedProducts(filtered);
    } catch {
      try {
        const products = await getCollectionProducts('all');
        const filtered = products.filter((p) => p.handle !== handle).slice(0, 6);
        setRelatedProducts(filtered);
      } catch {
        // Silently fail -- recommendations are optional
      }
    }
  }

  async function handleShare() {
    if (!product || !handle) return;
    const url = `https://kissofaroma.shop/products/${handle}`;
    try {
      if (Platform.OS === 'web') {
        if (navigator.share) await navigator.share({ title: product.title, url });
        else { await navigator.clipboard.writeText(url); Alert.alert('Link Copied'); }
      } else {
        await Share.share({ message: `${product.title}\n${url}`, url });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }

  async function handleAddToCart() {
    if (!selectedVariant) return;
    setAddingToCart(true);
    try {
      await addToCart(selectedVariant.id, 1);
      setToast({ visible: true, message: `${selectedVariant.title} added to cart` });
    } catch {
      setToast({ visible: true, message: 'Failed to add to cart' });
    } finally {
      setAddingToCart(false);
    }
  }

  function extractNotes(description: string): string[] {
    const notes: string[] = [];
    const notePatterns = [
      /top\s*notes?[:\s]+([^.]+)/gi,
      /middle\s*notes?[:\s]+([^.]+)/gi,
      /heart\s*notes?[:\s]+([^.]+)/gi,
      /base\s*notes?[:\s]+([^.]+)/gi,
      /notes?\s*(?:of|include|are)?[:\s]+([^.]+)/gi,
    ];
    for (const pattern of notePatterns) {
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(description)) !== null) {
        const noteList = match[1].split(/,|&/).map((n) => n.trim()).filter(Boolean);
        notes.push(...noteList);
      }
    }
    return [...new Set(notes)];
  }

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const scrollY = e.nativeEvent.contentOffset.y;
    setShowStickyBar(scrollY > 500);
  }

  if (loading) {
    return <View style={[s.center, { paddingTop: insets.top }]}><ActivityIndicator size="large" color={BURGUNDY} /></View>;
  }

  if (!product) {
    return <View style={[s.center, { paddingTop: insets.top }]}><Text style={s.errorText}>Product not found</Text></View>;
  }

  const images = product.images.edges.map((e) => e.node);
  const variants = product.variants.edges.map((e) => e.node);
  const inWishlist = isInWishlist(product.id);

  const currentPrice = selectedVariant ? parseFloat(selectedVariant.price.amount) : parseFloat(product.priceRange.minVariantPrice.amount);
  const compareAtPrice = selectedVariant?.compareAtPrice ? parseFloat(selectedVariant.compareAtPrice.amount) : null;
  const hasDiscount = compareAtPrice !== null && compareAtPrice > currentPrice;
  const discountPercent = hasDiscount && compareAtPrice !== null ? Math.round((1 - currentPrice / compareAtPrice) * 100) : 0;
  const afterpayInstallment = (currentPrice / 4).toFixed(2);
  const fragranceNotes = product.description ? extractNotes(product.description) : [];
  const firstImage = images.length > 0 ? images[0] : null;


  return (
    <View style={s.container}>
      {/* Header */}
      <View style={[s.header, { paddingTop: Platform.OS === 'web' ? 8 : insets.top + 8 }]}>
        <TouchableOpacity style={s.headerBtn} onPress={() => router.back()} accessibilityLabel="Go back" accessibilityRole="button">
          <Ionicons name="chevron-back" size={28} color="#000" />
        </TouchableOpacity>
        <View style={s.headerRight}>
          <TouchableOpacity style={s.headerBtn} onPress={() => toggleWishlist(product.id)} accessibilityLabel={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'} accessibilityRole="button">
            <Ionicons name={inWishlist ? "heart" : "heart-outline"} size={24} color={inWishlist ? BURGUNDY : "#000"} />
          </TouchableOpacity>
          <TouchableOpacity style={s.headerBtn} onPress={handleShare} accessibilityLabel="Share product" accessibilityRole="button">
            <Ionicons name="share-outline" size={22} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Floating Sticky Add to Cart Bar (top) */}
      <Animated.View
        style={[
          s.stickyTopBar,
          { top: Platform.OS === 'web' ? 0 : insets.top, opacity: stickyBarOpacity },
        ]}
        pointerEvents={showStickyBar ? 'auto' : 'none'}
      >
        {firstImage && (
          <ExpoImage
            source={{ uri: optimizeImageUrl(firstImage.url, 80) }}
            style={s.stickyBarImage}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        )}
        <View style={s.stickyBarInfo}>
          <Text style={s.stickyBarTitle} numberOfLines={1}>
            {product.title}
          </Text>
          {selectedVariant && (
            <Text style={s.stickyBarVariant} numberOfLines={1}>{selectedVariant.title}</Text>
          )}
        </View>
        <View style={s.stickyBarPriceWrap}>
          {hasDiscount && compareAtPrice !== null && (
            <Text style={s.stickyBarOldPrice}>${compareAtPrice.toFixed(2)}</Text>
          )}
          <Text style={s.stickyBarPrice}>${currentPrice.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[s.stickyBarBtn, (!selectedVariant?.availableForSale || addingToCart) && { backgroundColor: '#999' }]}
          onPress={handleAddToCart}
          disabled={!selectedVariant?.availableForSale || addingToCart}
        >
          {addingToCart ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={s.stickyBarBtnText}>Add to cart</Text>
          )}
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Image Gallery */}
        <View style={s.gallery}>
          <FlatList
            data={images.length > 0 ? images : [null]}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / width);
              setCurrentImageIndex(idx);
            }}
            scrollEventThrottle={16}
            keyExtractor={(_, i) => `img-${i}`}
            renderItem={({ item }) =>
              item ? (
                <ExpoImage
                  source={{ uri: optimizeImageUrl(item.url, 800) }}
                  style={s.productImage}
                  contentFit="contain"
                  transition={200}
                  cachePolicy="memory-disk"
                />
              ) : (
                <View style={[s.productImage, s.placeholderWrap]}>
                  <Text style={s.placeholderText}>No Image</Text>
                </View>
              )
            }
          />
          {images.length > 1 && (
            <View style={s.dots}>
              {images.map((_, i) => (
                <View key={i} style={[s.dot, i === currentImageIndex && s.dotActive]} />
              ))}
            </View>
          )}
          {discountPercent > 0 && (
            <View style={s.discountBadge}>
              <Text style={s.discountText}>{discountPercent}% OFF</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={s.info}>
          {/* Vendor */}
          {product.vendor && (
            <Text style={s.vendor}>{product.vendor}</Text>
          )}

          {/* Title */}
          <Text style={s.title}>{product.title}</Text>

          {/* Write a review link - no fake stars */}
          <TouchableOpacity style={s.ratingRow} onPress={() => {}}>
            <Text style={s.ratingText}>✍ Write a review</Text>
          </TouchableOpacity>

          {/* Price */}
          <View style={s.priceRow}>
            {hasDiscount && compareAtPrice !== null && (
              <Text style={s.comparePrice}>${compareAtPrice.toFixed(2)}</Text>
            )}
            <Text style={[s.price, hasDiscount && s.salePrice]}>
              ${currentPrice.toFixed(2)}
            </Text>
            {hasDiscount && (
              <View style={s.saveBadge}>
                <Text style={s.saveText}>Save {discountPercent}%</Text>
              </View>
            )}
          </View>

          {/* Shipping note */}
          <Text style={s.shippingNote}>Free US shipping on orders over $59</Text>

          {/* Payment Methods -- Change 1: Styled payment icons */}
          <View style={s.paymentSection}>
            <View style={s.paymentIconsRow}>
              {['PayPal', 'G Pay', 'Apple Pay', 'Shop Pay'].map((method) => (
                <View key={method} style={s.paymentIconBox}>
                  <Text style={s.paymentIconText}>{method}</Text>
                </View>
              ))}
            </View>
            <Text style={s.afterpayText}>
              or 4 interest-free payments of <Text style={s.afterpayAmount}>${afterpayInstallment}</Text> with{' '}
              <Text style={s.afterpayBrand}>Afterpay</Text>
            </Text>
          </View>

          {/* Size selector -- Change 4: 2-column grid */}
          {variants.length > 1 && (
            <View style={s.sizeSection}>
              <Text style={s.sizeLabel}>Size</Text>
              <View style={s.sizeGrid}>
                {variants.map((variant) => {
                  const isSelected = selectedVariant?.id === variant.id;
                  const vPrice = parseFloat(variant.price.amount);
                  const vCompare = variant.compareAtPrice ? parseFloat(variant.compareAtPrice.amount) : null;
                  const vDiscount = vCompare !== null && vCompare > vPrice;
                  // Match badge by checking if title starts with the size (e.g. "3 ml Sample Spray" → "3 ml")
                  const titleLower = variant.title.toLowerCase().trim();
                  const badge = Object.entries(SIZE_BADGES).find(([key]) => titleLower.startsWith(key))?.[1] || null;

                  return (
                    <TouchableOpacity
                      key={variant.id}
                      style={[
                        s.sizeCard,
                        isSelected && s.sizeCardActive,
                        !variant.availableForSale && s.sizeCardDisabled,
                      ]}
                      onPress={() => setSelectedVariant(variant)}
                      disabled={!variant.availableForSale}
                      accessibilityLabel={`Size ${variant.title}, $${vPrice.toFixed(2)}${isSelected ? ', selected' : ''}${!variant.availableForSale ? ', sold out' : ''}`}
                      accessibilityRole="button"
                    >
                      {badge && (
                        <View style={[s.sizeBadge, { backgroundColor: badge.bg }]}>
                          <Text style={[s.sizeBadgeText, { color: badge.color }]}>{badge.label}</Text>
                        </View>
                      )}
                      <Text style={[s.sizeCardName, isSelected && s.sizeCardNameActive]}>
                        {variant.title}
                      </Text>
                      <Text style={s.sizeCardSubtitle}>SAMPLE SPRAY</Text>
                      <View style={s.sizeCardPriceRow}>
                        {vDiscount && vCompare !== null && (
                          <Text style={s.sizeCardOldPrice}>${vCompare.toFixed(2)}</Text>
                        )}
                        <Text style={[s.sizeCardPrice, isSelected && s.sizeCardPriceActive]}>
                          ${vPrice.toFixed(2)}
                        </Text>
                      </View>
                      {!variant.availableForSale && (
                        <Text style={s.soldOut}>Sold out</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* Description -- Change 2: Collapsible with Read More */}
          {product.description ? (
            <View style={s.descSection}>
              <Text style={s.descHeading}>Description</Text>
              <Text
                style={s.descText}
                numberOfLines={descExpanded ? undefined : 4}
              >
                {product.description}
              </Text>
              <TouchableOpacity
                style={s.readMoreBtn}
                onPress={() => setDescExpanded(!descExpanded)}
              >
                <Text style={s.readMoreText}>
                  {descExpanded ? 'Show less ▲' : 'Read more ▼'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Trust badges */}
          <View style={s.trustSection}>
            <View style={s.trustItem}>
              <Text style={s.trustIcon}>{'✓'}</Text>
              <Text style={s.trustText}>100% Authentic</Text>
            </View>
            <View style={s.trustItem}>
              <Text style={s.trustIcon}>{'🚚'}</Text>
              <Text style={s.trustText}>Fast Shipping</Text>
            </View>
            <View style={s.trustItem}>
              <Text style={s.trustIcon}>{'↩'}</Text>
              <Text style={s.trustText}>Easy Returns</Text>
            </View>
          </View>

          {/* 100% Authentic Guarantee */}
          <View style={s.authenticBox}>
            <View style={s.authenticHeader}>
              <Text style={s.authenticCheck}>{'✓'}</Text>
              <Text style={s.authenticTitle}>100% Authentic Guarantee</Text>
            </View>
            <Text style={s.authenticText}>
              Every fragrance we sell is 100% authentic, sourced directly from authorized distributors. We stand behind the quality of every product -- if you're not satisfied, we'll make it right.
            </Text>
          </View>

          {/* Fragrance Notes */}
          {fragranceNotes.length > 0 && (
            <View style={s.notesSection}>
              <Text style={s.notesSectionTitle}>Fragrance Notes</Text>
              <View style={s.notesWrap}>
                {fragranceNotes.map((note, i) => (
                  <View key={`note-${i}`} style={s.notePill}>
                    <Text style={s.notePillText}>{note}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* You May Also Like */}
        {relatedProducts.length > 0 && (
          <View style={s.relatedSection}>
            <Text style={s.relatedTitle}>You May Also Like</Text>
            <FlatList
              data={relatedProducts}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.relatedList}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <RelatedProductCard product={item} router={router} addToCart={addToCart} onToast={(msg) => setToast({ visible: true, message: msg })} />
              )}
            />
          </View>
        )}


        {/* Reviews */}
        {handle ? <ReviewsSection productHandle={handle} /> : null}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Sticky Add to Cart */}
      <View style={[s.footer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={s.footerPrice}>
          {hasDiscount && compareAtPrice !== null && (
            <Text style={s.footerOldPrice}>${compareAtPrice.toFixed(2)}</Text>
          )}
          <Text style={s.footerCurrentPrice}>${currentPrice.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[s.addBtn, (!selectedVariant?.availableForSale || addingToCart) && s.addBtnDisabled]}
          onPress={handleAddToCart}
          disabled={!selectedVariant?.availableForSale || addingToCart}
          accessibilityLabel={selectedVariant?.availableForSale ? 'Add to cart' : 'Sold out'}
          accessibilityRole="button"
        >
          {addingToCart ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={s.addBtnText}>
              {selectedVariant?.availableForSale ? 'ADD TO CART' : 'SOLD OUT'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <Toast
        visible={toast.visible}
        message={toast.message}
        actionLabel="View Cart"
        actionRoute="/(tabs)/cart"
        onHide={() => setToast({ visible: false, message: '' })}
      />
    </View>
  );
}

// ---- Reviews Section with real user reviews ----
interface Review {
  name: string;
  rating: number;
  text: string;
  date: string;
}

function ReviewsSection({ productHandle }: { productHandle: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const STORAGE_KEY = `@koa_reviews_${productHandle}`;

  useEffect(() => {
    loadReviews();
  }, [productHandle]);

  async function loadReviews() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) setReviews(JSON.parse(stored));
    } catch {}
  }

  async function submitReview() {
    if (!name.trim() || !text.trim()) {
      Alert.alert('Please fill in your name and review');
      return;
    }
    try {
      const newReview: Review = {
        name: name.trim(),
        rating,
        text: text.trim(),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      };
      const updated = [newReview, ...reviews];
      setReviews(updated);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setName('');
      setText('');
      setRating(5);
      setShowForm(false);
      Alert.alert('Thank you!', 'Your review has been submitted.');
    } catch (error) {
      console.error('Error saving review:', error);
    }
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <View style={s.reviewsSection}>
      <View style={s.reviewsHeader}>
        <Text style={s.reviewsTitle}>Your Reviews</Text>
        {avgRating && (
          <View style={s.avgRating}>
            <Text style={s.avgStars}>{'★'.repeat(Math.round(Number(avgRating)))}</Text>
            <Text style={s.avgText}>{avgRating} ({reviews.length})</Text>
          </View>
        )}
      </View>

      {!showForm && (
        <TouchableOpacity style={s.writeReviewBtn} onPress={() => setShowForm(true)}>
          <Text style={s.writeReviewText}>Write a Review</Text>
        </TouchableOpacity>
      )}

      {showForm && (
        <View style={s.reviewForm}>
          <TextInput style={s.reviewInput} placeholder="Your name" value={name} onChangeText={setName} placeholderTextColor="#999" />
          <View style={s.starPicker}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity key={n} onPress={() => setRating(n)}>
                <Text style={[s.starBtn, n <= rating && s.starBtnActive]}>{n <= rating ? '★' : '☆'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={[s.reviewInput, { height: 80, textAlignVertical: 'top' }]} placeholder="Write your review..." value={text} onChangeText={setText} multiline placeholderTextColor="#999" />
          <View style={s.formButtons}>
            <TouchableOpacity style={s.cancelBtn} onPress={() => setShowForm(false)}>
              <Text style={s.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.submitReviewBtn} onPress={submitReview}>
              <Text style={s.submitReviewText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {reviews.length === 0 && !showForm && (
        <Text style={s.noReviews}>Share your thoughts on this fragrance</Text>
      )}
      {reviews.map((review, idx) => (
        <View key={`review-${idx}`} style={s.reviewCard}>
          <View style={s.reviewCardHeader}>
            <Text style={s.reviewName}>{review.name}</Text>
            <Text style={s.reviewDate}>{review.date}</Text>
          </View>
          <Text style={s.reviewStars}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</Text>
          <Text style={s.reviewText}>{review.text}</Text>
        </View>
      ))}
    </View>
  );
}

// Quick-add related product card
function RelatedProductCard({ product, router, addToCart, onToast }: { product: ShopifyProduct; router: any; addToCart: (id: string, qty: number) => Promise<void>; onToast: (msg: string) => void }) {
  const [adding, setAdding] = useState(false);
  const image = product.images?.edges?.[0]?.node;
  const price = product.priceRange?.minVariantPrice;
  const comparePrice = product.compareAtPriceRange?.minVariantPrice;
  const firstVariant = product.variants?.edges?.[0]?.node;
  const hasDiscount = comparePrice && parseFloat(comparePrice.amount) > parseFloat(price?.amount || '0');

  async function quickAdd() {
    if (!firstVariant || adding) return;
    setAdding(true);
    try {
      await addToCart(firstVariant.id, 1);
      onToast(`${product.title} added to cart`);
    } catch {
      onToast('Could not add to cart');
    } finally {
      setAdding(false);
    }
  }

  return (
    <View style={s.relatedCard}>
      <TouchableOpacity activeOpacity={0.8} onPress={() => router.push(`/product/${product.handle}`)}>
        {image ? (
          <ExpoImage source={{ uri: optimizeImageUrl(image.url, 300) }} style={s.relatedImg} contentFit="cover" transition={200} cachePolicy="memory-disk" />
        ) : (
          <View style={[s.relatedImg, { backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' }]}><Text style={{ color: '#999' }}>No Image</Text></View>
        )}
      </TouchableOpacity>
      <Text style={s.relatedName} numberOfLines={2}>{product.title}</Text>
      <View style={s.relatedPriceRow}>
        <Text style={s.relatedPrice}>From ${parseFloat(price?.amount || '0').toFixed(2)}</Text>
        {hasDiscount && comparePrice && <Text style={s.relatedOldPrice}>${parseFloat(comparePrice.amount).toFixed(2)}</Text>}
      </View>
      <TouchableOpacity style={s.quickAddBtn} onPress={quickAdd} disabled={adding} activeOpacity={0.7}>
        {adding ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.quickAddText}>+ Add to Cart</Text>}
      </TouchableOpacity>
    </View>
  );
}

const CARD_GAP = 8;
const GRID_PADDING = 20;
const sizeCardWidth = (width - GRID_PADDING * 2 - CARD_GAP) / 2;


const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  errorText: { fontSize: 18, fontWeight: '600', color: '#000', fontFamily: HEADING_FONT },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 8, paddingBottom: 8, backgroundColor: '#fff',
    zIndex: 9999, borderBottomWidth: 1, borderBottomColor: '#e6e6e6',
  },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  headerBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 36, color: '#000', fontWeight: '300' },
  heartIcon: { fontSize: 24, color: '#000' },
  shareIcon: { fontSize: 22, color: '#000' },

  // Floating sticky bar (top)
  stickyTopBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9998,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e6e6e6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 5,
  },
  stickyBarImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  stickyBarInfo: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  stickyBarTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
  },
  stickyBarVariant: {
    fontSize: 11,
    color: '#777',
    marginTop: 1,
  },
  stickyBarPriceWrap: {
    alignItems: 'flex-end',
    marginRight: 10,
  },
  stickyBarOldPrice: {
    fontSize: 11,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  stickyBarPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  stickyBarBtn: {
    backgroundColor: BURGUNDY,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  stickyBarBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  // Gallery
  gallery: { position: 'relative', backgroundColor: '#f8f8f8', height: Math.round(width * 1.3) },
  productImage: { width, height: Math.round(width * 1.3), backgroundColor: '#f8f8f8' },
  placeholderWrap: { justifyContent: 'center', alignItems: 'center' },
  placeholderText: { fontSize: 14, color: '#999' },
  dots: {
    position: 'absolute', bottom: 16, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ccc' },
  dotActive: { backgroundColor: BURGUNDY, width: 20, borderRadius: 4 },
  discountBadge: {
    position: 'absolute', top: 12, left: 12,
    backgroundColor: BADGE_RED, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100,
  },
  discountText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  // Info
  info: { padding: 20 },
  vendor: { fontSize: 14, color: '#555', marginBottom: 4 },
  title: { fontSize: 24, fontWeight: '600', color: '#000', fontFamily: HEADING_FONT, lineHeight: 30, marginBottom: 6 },
  ratingRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, marginBottom: 12 },
  ratingText: { fontSize: 13, color: '#555' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  comparePrice: { fontSize: 18, color: '#000', textDecorationLine: 'line-through' },
  price: { fontSize: 20, fontWeight: '600', color: '#000' },
  salePrice: { color: BADGE_RED },
  saveBadge: { backgroundColor: BADGE_RED, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100 },
  saveText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  shippingNote: { fontSize: 13, color: '#555', marginBottom: 20 },

  // Payment Methods (Change 1)
  paymentSection: { marginBottom: 20 },
  paymentIconsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  paymentIconBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  paymentIconText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#333',
  },
  afterpayText: { fontSize: 13, color: '#555' },
  afterpayAmount: { fontWeight: '700', color: '#000' },
  afterpayBrand: { fontWeight: '700', color: '#000' },

  // Size selector (Change 4 -- 2-column grid)
  sizeSection: { marginBottom: 24 },
  sizeLabel: { fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 12 },
  sizeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  sizeCard: {
    width: sizeCardWidth,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sizeCardActive: {
    borderColor: '#000',
  },
  sizeCardDisabled: {
    opacity: 0.4,
  },
  sizeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 8,
  },
  sizeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sizeCardName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 2,
  },
  sizeCardNameActive: {
    color: '#000',
  },
  sizeCardSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#888',
    letterSpacing: 1,
    marginBottom: 10,
  },
  sizeCardPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sizeCardOldPrice: {
    fontSize: 13,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  sizeCardPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  sizeCardPriceActive: {
    color: BURGUNDY,
  },
  soldOut: { fontSize: 11, color: '#C41E3A', fontWeight: '500', marginTop: 4 },

  // Description (Change 2 -- collapsible)
  descSection: { marginBottom: 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#e6e6e6' },
  descHeading: { fontSize: 18, fontWeight: '600', color: '#000', fontFamily: HEADING_FONT, marginBottom: 12 },
  descText: { fontSize: 14, color: '#303030', lineHeight: 22 },
  readMoreBtn: {
    marginTop: 8,
    paddingVertical: 4,
  },
  readMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: BURGUNDY,
  },

  // Trust
  trustSection: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingVertical: 20, borderTopWidth: 1, borderTopColor: '#e6e6e6',
  },
  trustItem: { alignItems: 'center', gap: 4 },
  trustIcon: { fontSize: 20 },
  trustText: { fontSize: 11, color: '#555', fontWeight: '500' },

  // Authentic Guarantee
  authenticBox: {
    backgroundColor: '#f8f5f0',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    marginBottom: 24,
  },
  authenticHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  authenticCheck: { fontSize: 20, color: BURGUNDY },
  authenticTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    fontFamily: HEADING_FONT,
  },
  authenticText: { fontSize: 14, color: '#303030', lineHeight: 22 },

  // Fragrance Notes
  notesSection: { paddingBottom: 16 },
  notesSectionTitle: { fontSize: 16, fontWeight: '600', color: '#000', fontFamily: HEADING_FONT, marginBottom: 10 },
  notesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  notePill: {
    backgroundColor: '#f8f5f0',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#e6e6e6',
  },
  notePillText: { fontSize: 13, color: '#303030', fontWeight: '500' },

  // You May Also Like
  relatedSection: {
    borderTopWidth: 1,
    borderTopColor: '#e6e6e6',
    paddingTop: 24,
    paddingBottom: 8,
  },
  relatedTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
    fontFamily: HEADING_FONT,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  relatedList: { paddingHorizontal: 12 },
  relatedCard: { width: 170, marginHorizontal: 6 },
  relatedImg: { width: 170, height: 170, borderRadius: 12, backgroundColor: '#f8f8f8' },
  relatedName: { fontSize: 13, fontWeight: '400', color: '#000', marginTop: 8, lineHeight: 18 },
  relatedPriceRow: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4, marginTop: 4 },
  relatedPrice: { fontSize: 13, fontWeight: '600', color: '#000' },
  relatedOldPrice: { fontSize: 12, color: '#999', textDecorationLine: 'line-through' as const },
  quickAddBtn: { backgroundColor: BURGUNDY, borderRadius: 8, paddingVertical: 10, alignItems: 'center' as const, marginTop: 8, minHeight: 38, justifyContent: 'center' as const },
  quickAddText: { color: '#fff', fontSize: 12, fontWeight: '700' as const },

  // Reviews
  reviewsSection: { borderTopWidth: 1, borderTopColor: '#e6e6e6', paddingTop: 24, paddingHorizontal: 20, paddingBottom: 8 },
  reviewsHeader: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 12 },
  reviewsTitle: { fontSize: 22, fontWeight: '600', color: '#000', fontFamily: HEADING_FONT },
  avgRating: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 4 },
  avgStars: { fontSize: 16, color: '#f5a623' },
  avgText: { fontSize: 13, color: '#555' },
  writeReviewBtn: { backgroundColor: '#f5f5f5', borderRadius: 12, paddingVertical: 14, alignItems: 'center' as const, marginBottom: 16, borderWidth: 1, borderColor: '#e6e6e6' },
  writeReviewText: { fontSize: 14, fontWeight: '600', color: '#000' },
  reviewForm: { backgroundColor: '#f8f5f0', borderRadius: 12, padding: 16, marginBottom: 16 },
  reviewInput: { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#e6e6e6', paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#000', marginBottom: 10 },
  starPicker: { flexDirection: 'row' as const, gap: 8, marginBottom: 10, justifyContent: 'center' as const },
  starBtn: { fontSize: 28, color: '#ccc' },
  starBtnActive: { color: '#f5a623' },
  formButtons: { flexDirection: 'row' as const, gap: 10 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#e6e6e6', alignItems: 'center' as const },
  cancelBtnText: { fontSize: 14, color: '#666' },
  submitReviewBtn: { flex: 1, backgroundColor: BURGUNDY, paddingVertical: 12, borderRadius: 8, alignItems: 'center' as const },
  submitReviewText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  noReviews: { fontSize: 14, color: '#888', textAlign: 'center' as const, paddingVertical: 20 },
  reviewCard: { backgroundColor: '#f8f5f0', borderRadius: 12, padding: 16, marginBottom: 12 },
  reviewCardHeader: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 4 },
  reviewName: { fontSize: 14, fontWeight: '600', color: '#000' },
  reviewDate: { fontSize: 12, color: '#888' },
  reviewStars: { fontSize: 14, color: '#f5a623', marginBottom: 6 },
  reviewText: { fontSize: 14, color: '#303030', lineHeight: 20 },

  // Footer
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: '#e6e6e6',
    flexDirection: 'row', alignItems: 'center', gap: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 5,
  },
  footerPrice: { gap: 2 },
  footerOldPrice: { fontSize: 13, color: '#999', textDecorationLine: 'line-through' },
  footerCurrentPrice: { fontSize: 18, fontWeight: '700', color: '#000' },
  addBtn: {
    flex: 1, backgroundColor: BURGUNDY, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
  },
  addBtnDisabled: { backgroundColor: '#999' },
  addBtnText: { fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: 1 },
});
