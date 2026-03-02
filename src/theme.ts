/**
 * Theme colors and spacing matching the web app (Tailwind config from index.html).
 * Use these so layout stays identical across web and native.
 */
export const colors = {
  primary: '#6B8E7B',
  sage: '#6B8E7B',
  sageLight: '#F0F4F1',
  morandiMustard: '#B5A642',
  morandiSage: '#8A9A5B',
  morandiOlive: '#708238',
  iosGray: '#F2F2F7',
  iosTextSecondary: '#8E8E93',
  white: '#FFFFFF',
  black: '#000000',
  slate: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },
  rose: {
    50: '#FFF1F2',
    500: '#F43F5E',
  },
  amber: {
    500: '#F59E0B',
  },
} as const;

export const spacing = {
  px: 1,
  py2: 8,
  py3: 12,
  p4: 16,
  p5: 20,
  p6: 24,
  p8: 32,
  pt8: 32,
  pb3: 12,
  gap1: 4,
  gap2: 8,
  gap3: 12,
  gap4: 16,
} as const;

export const borderRadius = {
  ios: 12,
  button: 28,
  card: 24,
  full: 9999,
} as const;

export const fontSize = {
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  '11': 11,
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '6xl': 60,
} as const;
