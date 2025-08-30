// Turkish Cancer Care App Theme Configuration
// Based on provided design guidelines

export const theme = {
  colors: {
    // Primary Colors from Design Guide
    primary: '#5AACB0',      // Teal - main brand color
    secondary: '#78C8A4',    // Light green - secondary actions
    accent: '#44A878',       // Dark green - accent elements
    surface: '#ADBDCD',      // Light gray - backgrounds
    
    // Status Colors
    success: '#4CAF50',      // Success states
    warning: '#FF9800',      // Warning states
    error: '#F44336',        // Error states
    info: '#2196F3',         // Info states
    
    // Background Colors
    background: '#FFFFFF',   // Main background
    backgroundSecondary: '#F5F5F5', // Secondary background
    backgroundAccent: '#E8F5E8',    // Accent background
    
    // Text Colors
    text: '#212121',         // Primary text
    textSecondary: '#757575', // Secondary text
    textLight: '#999999',    // Light text
    textInverse: '#FFFFFF',  // White text for dark backgrounds
    
    // Border Colors
    border: '#E0E0E0',       // Default borders
    borderLight: '#F0F0F0',  // Light borders
    divider: '#EEEEEE',      // Divider lines
    
    // Card Colors
    cardBackground: '#FFFFFF',
    cardShadow: 'rgba(0, 0, 0, 0.1)',
  },
  
  typography: {
    // Font Family (Turkish character support)
    fontFamily: {
      regular: 'System',
      medium: 'System',
      bold: 'System',
    },
    
    // Font Sizes
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 28,
      '4xl': 32,
    },
    
    // Font Weights
    fontWeight: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    
    // Line Heights
    lineHeight: {
      tight: 1.2,
      normal: 1.4,
      relaxed: 1.6,
    },
    
    // Text Styles
    h1: {
      fontSize: 28,
      fontWeight: '700',
      lineHeight: 32,
      color: '#212121',
    },
    h2: {
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 28,
      color: '#212121',
    },
    h3: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 24,
      color: '#212121',
    },
    h4: {
      fontSize: 18,
      fontWeight: '500',
      lineHeight: 22,
      color: '#212121',
    },
    body: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
      color: '#212121',
    },
    bodySecondary: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 20,
      color: '#757575',
    },
    caption: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 16,
      color: '#757575',
    },
    button: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 20,
    },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
    '4xl': 48,
    '5xl': 64,
  },
  
  borderRadius: {
    none: 0,
    sm: 4,
    base: 8,
    lg: 12,
    xl: 16,
    full: 999,
  },
  
  shadows: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    base: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
  },
  
  // Component specific styles
  components: {
    button: {
      height: 48,
      borderRadius: 12,
      paddingHorizontal: 24,
      paddingVertical: 12,
    },
    input: {
      height: 48,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
    },
    card: {
      borderRadius: 12,
      padding: 16,
      backgroundColor: '#FFFFFF',
    },
  },
};

export type Theme = typeof theme;