// Turkish Cancer Care App Theme Configuration
// Based on provided design guidelines with exact color palette

export const theme = {
  colors: {
    // Primary Colors from Design Guide - EXACT COLORS
    primary: '#44A878',        // Main green from design
    secondary: '#78C8A4',      // Light green 
    accent: '#5AACB0',         // Teal accent
    surface: '#ADBDCD',        // Light gray for surfaces
    
    // Status Colors
    success: '#44A878',        // Green for success
    warning: '#FF9800',        // Orange for warnings
    error: '#F44336',          // Red for errors
    info: '#5AACB0',           // Teal for info
    
    // Background Colors
    background: '#FFFFFF',     // Pure white
    backgroundSecondary: '#F8F9FA', // Very light gray
    backgroundAccent: '#E8F5E8',    // Very light green
    
    // Text Colors
    text: '#2C3E50',           // Dark blue-gray for primary text
    textSecondary: '#7F8C8D',  // Medium gray for secondary text
    textLight: '#BDC3C7',      // Light gray for hints
    textInverse: '#FFFFFF',    // White text
    
    // Border Colors
    border: '#E1E8ED',         // Light border
    borderLight: '#F7F9FA',    // Very light border
    divider: '#ECEFF1',        // Divider lines
    
    // Card and Component Colors
    cardBackground: '#FFFFFF',
    cardShadow: 'rgba(0, 0, 0, 0.08)',
    
    // Specific Feature Colors
    health: '#44A878',         // Health/medical green
    appointment: '#5AACB0',    // Appointment teal
    medicine: '#78C8A4',       // Medicine light green
    ai: '#9B59B6',            // AI purple
    nutrition: '#E67E22',      // Nutrition orange
    exercise: '#E74C3C',       // Exercise red
  },
  
  typography: {
    // Font Family - System fonts with better Turkish support
    fontFamily: {
      regular: 'SF Pro Display',
      medium: 'SF Pro Display',
      bold: 'SF Pro Display',
    },
    
    // Font Sizes - Improved hierarchy
    fontSize: {
      xs: 11,
      sm: 13,
      base: 15,
      lg: 17,
      xl: 19,
      '2xl': 22,
      '3xl': 26,
      '4xl': 30,
    },
    
    // Font Weights
    fontWeight: {
      light: '300',
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      black: '800',
    },
    
    // Line Heights
    lineHeight: {
      tight: 1.25,
      normal: 1.4,
      relaxed: 1.6,
    },
    
    // Text Styles
    h1: {
      fontSize: 26,
      fontWeight: '700',
      lineHeight: 32,
      color: '#2C3E50',
    },
    h2: {
      fontSize: 22,
      fontWeight: '600',
      lineHeight: 28,
      color: '#2C3E50',
    },
    h3: {
      fontSize: 19,
      fontWeight: '600',
      lineHeight: 24,
      color: '#2C3E50',
    },
    h4: {
      fontSize: 17,
      fontWeight: '500',
      lineHeight: 22,
      color: '#2C3E50',
    },
    body: {
      fontSize: 15,
      fontWeight: '400',
      lineHeight: 22,
      color: '#2C3E50',
    },
    bodySecondary: {
      fontSize: 13,
      fontWeight: '400',
      lineHeight: 18,
      color: '#7F8C8D',
    },
    caption: {
      fontSize: 11,
      fontWeight: '400',
      lineHeight: 14,
      color: '#7F8C8D',
    },
    button: {
      fontSize: 15,
      fontWeight: '600',
      lineHeight: 18,
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
    sm: 6,
    base: 10,
    lg: 14,
    xl: 18,
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
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    base: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.16,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  
  // Component specific styles
  components: {
    button: {
      height: 50,
      borderRadius: 14,
      paddingHorizontal: 24,
      paddingVertical: 14,
    },
    input: {
      height: 50,
      borderRadius: 14,
      paddingHorizontal: 18,
      paddingVertical: 14,
      borderWidth: 1,
    },
    card: {
      borderRadius: 14,
      padding: 18,
      backgroundColor: '#FFFFFF',
    },
  },
};

export type Theme = typeof theme;