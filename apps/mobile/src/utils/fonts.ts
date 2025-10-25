// Font configuration for the app
export const Fonts = {
  // Primary fonts
  primary: {
    regular: 'OpenSans-Regular',
    bold: 'OpenSans-Bold',
  },
  
  // Secondary fonts
  secondary: {
    regular: 'Roboto-Regular',
    bold: 'Roboto-Bold',
  },
  
  // Display fonts
  display: {
    regular: 'Poppins-Regular',
    bold: 'Poppins-Bold',
  },
  
  // Accent fonts
  accent: {
    regular: 'Montserrat-Regular',
    bold: 'Montserrat-Bold',
  },
  
  // System fonts (fallbacks)
  system: {
    regular: 'System',
    bold: 'System',
  },
};

// Font weight constants
export const FontWeights = {
  light: '300',
  regular: '400',
  medium: '500',
  semiBold: '600',
  bold: '700',
  extraBold: '800',
};

// Font size constants
export const FontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
};

// Predefined text styles
export const TextStyles = {
  // Headers
  h1: {
    fontFamily: Fonts.display.bold,
    fontSize: FontSizes['4xl'],
    fontWeight: FontWeights.bold,
  },
  h2: {
    fontFamily: Fonts.display.bold,
    fontSize: FontSizes['3xl'],
    fontWeight: FontWeights.bold,
  },
  h3: {
    fontFamily: Fonts.display.bold,
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
  },
  
  // Body text
  body: {
    fontFamily: Fonts.primary.regular,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.regular,
  },
  bodyBold: {
    fontFamily: Fonts.primary.bold,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
  },
  
  // Captions
  caption: {
    fontFamily: Fonts.primary.regular,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.regular,
  },
  captionBold: {
    fontFamily: Fonts.primary.bold,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
  
  // Labels
  label: {
    fontFamily: Fonts.secondary.regular,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
  },
  labelBold: {
    fontFamily: Fonts.secondary.bold,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
  
  // Buttons
  button: {
    fontFamily: Fonts.primary.bold,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
  },
  buttonSmall: {
    fontFamily: Fonts.primary.bold,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
};
