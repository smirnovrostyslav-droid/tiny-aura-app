# Quick Start Guide

## Start Development Server

```bash
cd ~/Projects/tiny-aura-app
npm start
```

Then:
- Press `i` to open iOS Simulator (Mac only)
- Press `a` to open Android Emulator
- Scan QR code with Expo Go app on your phone

## Test the App Features

### Home Screen
- Browse categories
- Scroll through new arrivals
- Tap any product to view details

### Search
- Tap search tab
- Enter "perfume" or "cologne"
- Results appear in grid

### Product Details
- Swipe through images
- Select size variant
- Add to cart

### Shopping Cart
- View cart items
- Adjust quantities (+/-)
- Tap checkout to open Shopify web checkout

## Troubleshooting

### Clear Cache
```bash
npm start -- --clear
```

### Reinstall Dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors
```bash
npx tsc --noEmit
```

## Next Steps

1. **Test on Device:** Install Expo Go and scan QR code
2. **Customize Colors:** Edit `constants/theme.ts`
3. **Add Collections:** Update home screen categories
4. **Build for Production:** Follow README.md instructions

## Key Features Implemented ✅

- ✅ Home screen with hero banner
- ✅ Category navigation (Women's, Men's, Gift Sets, New Arrivals)
- ✅ Product search functionality
- ✅ Product detail page with image gallery
- ✅ Variant selector (sizes)
- ✅ Shopping cart with quantity management
- ✅ Persistent cart using AsyncStorage
- ✅ Shopify Storefront API integration
- ✅ Dark luxury theme
- ✅ Bottom tab navigation with cart badge
- ✅ Collection/category pages
- ✅ Responsive product grid layout

## Project Files

```
app/
├── (tabs)/
│   ├── index.tsx     → Home screen
│   ├── search.tsx    → Search functionality
│   ├── cart.tsx      → Shopping cart
│   └── account.tsx   → Account placeholder
├── collection/
│   └── [handle].tsx  → Dynamic collection page
└── product/
    └── [handle].tsx  → Product detail page

services/
├── shopify.ts        → API queries & mutations
└── cartContext.tsx   → Global cart state

constants/theme.ts    → Design system (colors, fonts)
types/shopify.ts      → TypeScript types
```

---

**Ready to launch!** 🚀
