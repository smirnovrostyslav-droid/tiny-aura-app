# Tiny Aura - Luxury Fragrance Mobile App

A React Native e-commerce mobile application for Tiny Aura, a luxury fragrance store powered by Shopify Storefront API.

## Features

✨ **Home Screen**
- Hero banner with brand identity
- Shop by category (Women's Perfume, Men's Cologne, Gift Sets, New Arrivals)
- New arrivals carousel
- All collections display

🔍 **Search**
- Real-time product search
- Grid view of search results
- Seamless navigation to product details

🛍️ **Product Details**
- Swipeable image gallery
- Product title, price, and description
- Variant selector (size options)
- Add to cart functionality
- Stock availability indicator

🛒 **Shopping Cart**
- View all cart items with images
- Adjust quantities
- Remove items
- Live total calculation
- Direct checkout link to Shopify web checkout

🎨 **Design**
- Dark luxury theme (black #0a0a0a background)
- Gold (#d4af37) and cream accents
- Clean, minimalist aesthetic
- Elegant typography
- Bottom tab navigation

## Tech Stack

- **React Native** with **Expo** (managed workflow)
- **TypeScript** for type safety
- **Expo Router** for file-based navigation
- **Shopify Storefront API** (GraphQL) for e-commerce backend
- **React Native Paper** for UI components
- **AsyncStorage** for cart persistence

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Expo CLI (will be installed automatically)
- iOS Simulator (Mac) or Android Emulator or physical device with Expo Go app

## Installation

1. **Clone/Navigate to the project:**
   ```bash
   cd ~/Projects/tiny-aura-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Run on your preferred platform:**
   - Press `i` for iOS Simulator (Mac only)
   - Press `a` for Android Emulator
   - Scan the QR code with Expo Go app on your phone

## Shopify Configuration

The app is pre-configured with the following Shopify store:

- **Store URL:** `tiny-aura-3.myshopify.com`
- **Storefront Access Token:** `e1b0147977e1518d2a41e708ac7f72d9`
- **API Version:** `2024-01`

These credentials are stored in `services/shopify.ts`. If you need to change them, edit that file.

## Project Structure

```
tiny-aura-app/
├── app/                          # Expo Router screens
│   ├── (tabs)/                   # Tab navigation screens
│   │   ├── _layout.tsx           # Tab layout with bottom navigation
│   │   ├── index.tsx             # Home screen
│   │   ├── search.tsx            # Search screen
│   │   ├── cart.tsx              # Shopping cart screen
│   │   └── account.tsx           # Account screen (placeholder)
│   ├── collection/               # Collection screens
│   │   └── [handle].tsx          # Dynamic collection route
│   ├── product/                  # Product screens
│   │   └── [handle].tsx          # Dynamic product detail route
│   └── _layout.tsx               # Root layout with cart provider
├── components/
│   └── ProductCard.tsx           # Reusable product card component
├── constants/
│   └── theme.ts                  # Colors, spacing, typography
├── services/
│   ├── shopify.ts                # Shopify API service layer
│   └── cartContext.tsx           # Global cart state management
├── types/
│   └── shopify.ts                # TypeScript type definitions
├── app.json                      # Expo configuration
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # This file
```

## Key Files Explained

### `services/shopify.ts`
Contains all GraphQL queries and mutations for:
- Fetching collections and products
- Searching products
- Creating and managing shopping carts
- Product detail queries

### `services/cartContext.tsx`
React Context provider that manages global cart state:
- Cart creation and persistence
- Add/update/remove cart items
- Cart item count for badge display

### `constants/theme.ts`
Design system constants:
- Brand colors (black, gold, cream)
- Typography styles
- Spacing values

### `app/_layout.tsx`
Root layout that wraps the app with:
- CartProvider for global state
- Stack navigation configuration
- Dark theme styling

### `app/(tabs)/_layout.tsx`
Bottom tab navigation with:
- Home, Search, Cart, Account tabs
- Cart badge showing item count
- Custom styling for dark theme

## Available Scripts

- `npm start` - Start Expo development server
- `npm run android` - Run on Android emulator/device
- `npm run ios` - Run on iOS simulator (Mac only)
- `npm run web` - Run in web browser

## API Integration

The app uses Shopify's Storefront API with the following main queries:

**Collections:**
```graphql
query GetCollections {
  collections(first: 10) { ... }
}
```

**Products:**
```graphql
query GetProduct($handle: String!) {
  product(handle: $handle) { ... }
}
```

**Cart Operations:**
```graphql
mutation CreateCart { cartCreate { ... } }
mutation AddToCart($cartId: ID!, $lines: [CartLineInput!]!) { ... }
```

See `services/shopify.ts` for complete implementation.

## Customization

### Change Brand Colors
Edit `constants/theme.ts`:
```typescript
export const Colors = {
  black: '#0a0a0a',      // Background
  gold: '#d4af37',       // Accents
  cream: '#f5f5dc',      // Secondary accent
  // ... other colors
};
```

### Add New Collections
The app automatically fetches collections from Shopify. To add a category tile on the home screen, edit `app/(tabs)/index.tsx`:
```typescript
const CATEGORIES = [
  { title: 'Your Category', handle: 'category-handle', emoji: '🎯' },
  // ...
];
```

### Modify Navigation
Navigation is file-based with Expo Router:
- Add new screens by creating files in `app/` directory
- Nested routes use folder structure
- Dynamic routes use `[param]` syntax

## Troubleshooting

### Port Already in Use
```bash
pkill -f "expo start"
npm start
```

### Cache Issues
```bash
npm start -- --clear
```

### iOS Simulator Not Opening
```bash
npx expo start --ios
```

### Android Build Errors
```bash
cd android && ./gradlew clean && cd ..
npm start
```

## Production Build

### iOS (requires Mac + Xcode)
```bash
npm install -g eas-cli
eas build --platform ios
```

### Android
```bash
npm install -g eas-cli
eas build --platform android
```

Refer to [Expo's build documentation](https://docs.expo.dev/build/setup/) for detailed instructions.

## Future Enhancements

- [ ] User authentication
- [ ] Order history
- [ ] Wishlist/favorites
- [ ] Product reviews
- [ ] Push notifications for new arrivals
- [ ] Social sharing
- [ ] Multiple payment options
- [ ] Gift wrapping options
- [ ] Loyalty program integration

## Dependencies

Main dependencies:
- `expo` - Expo framework
- `expo-router` - File-based routing
- `react-native-paper` - Material Design components
- `@react-native-async-storage/async-storage` - Local storage

See `package.json` for complete list.

## License

This project is proprietary and confidential.

## Support

For issues or questions about the Shopify integration, refer to:
- [Shopify Storefront API Docs](https://shopify.dev/docs/api/storefront)
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)

---

**Built with ❤️ for Tiny Aura**
