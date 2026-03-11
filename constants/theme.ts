// Tiny Aura — Anyuta Figma design
export const Colors = {
  // Primary
  white: '#FFFFFF',
  black: '#1A1A1A',
  darkGray: '#4A4A4A',
  mediumGray: '#6B6B6B',
  lightGray: '#F5F5F5',
  mutedGray: '#999999',
  
  // Accent — from Figma
  maroon: '#770a0c',
  badgeRed: '#770a0c',
  
  // Warm tones
  warmBeige: '#F8E8E0',
  lightBeige: '#FAF5F0',
  heroBeige: '#F5E6D8',
  heroBeigeDark: '#EDD5C5',
  
  // Sale strip (brown from Figma)
  saleBrown: '#3a2313',
  
  // Promo 60% off (dark red with pink accent)
  promoDark1: '#5C1A1A',
  promoDark2: '#8B2828',
  promoAccent: '#b8374a',
  promoDark3: '#4A1515',
  
  // Category circle colors
  catDeals: '#F5E0D0',
  catWomen: '#F8E8E0',
  catMen: '#F0E0E8',
  catTravel: '#F0E4F0',
  catGifts: '#F5E8E0',
  
  // Legacy
  yellow: '#FFD700',
  red: '#FF0000',
  gold: '#FFD700',
  cream: '#f5f5dc',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const Typography = {
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.black,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.black,
  },
  subheading: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.black,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: Colors.darkGray,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    color: Colors.mediumGray,
  },
  price: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.black,
  },
};
