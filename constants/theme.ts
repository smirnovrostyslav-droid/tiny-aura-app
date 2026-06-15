// Kiss of Aroma — Design System from kissofaroma.shop
import { Platform } from 'react-native';

export const Colors = {
  // Primary
  white: '#FFFFFF',
  black: '#000000',
  darkGray: '#303030',
  mediumGray: '#6B6B6B',
  lightGray: '#F5F5F5',
  mutedGray: '#999999',

  // Brand
  burgundy: '#780b0c',

  // Announcement / sale bar
  announcementBg: '#3a2313',

  // Card / surface
  cardBg: '#f5f5f5',
  border: '#e6e6e6',

  // Accent
  accent: '#303030',

  // Legacy compat
  maroon: '#780b0c',
  badgeRed: '#780b0c',
  warmBeige: '#F8E8E0',
  lightBeige: '#FAF5F0',
  heroBeige: '#F5E6D8',
  heroBeigeDark: '#EDD5C5',
  saleBrown: '#3a2313',

  // Category circle colors
  catDeals: '#F5E0D0',
  catWomen: '#F8E8E0',
  catMen: '#F0E0E8',
  catTravel: '#F0E4F0',
  catGifts: '#F5E8E0',
};

export const Fonts = {
  heading: Platform.OS === 'web' ? 'Cormorant, serif' : 'serif',
  body: Platform.OS === 'web' ? 'Inter, system-ui, sans-serif' : undefined,
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
    fontFamily: Fonts.heading,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.black,
    fontFamily: Fonts.heading,
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
