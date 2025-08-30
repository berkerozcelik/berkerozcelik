// Turkish Cancer Care App Theme Configuration
// Updated based on provided design guidelines with exact color palette

export const theme = {
  colors: {
    // Primary Colors from New Design Guide - EXACT COLORS
    primary: '#44A878',        // Ana yeşil renk
    secondary: '#78C8A4',      // Açık yeşil 
    accent: '#5AACB0',         // Teal vurgu
    surface: '#ADBDCD',        // Açık gri yüzeyler için
    
    // Pastel tonlar - yeni palet
    pastel1: '#ADBDCD',        // En açık gri-mavi
    pastel2: '#78C8A4',        // Orta yeşil
    pastel3: '#5AACB0',        // Teal
    pastel4: '#44A878',        // Koyu yeşil
    
    // Status Colors
    success: '#44A878',        // Başarı için yeşil
    warning: '#FF9800',        // Uyarı için turuncu
    error: '#F44336',          // Hata için kırmızı
    info: '#5AACB0',           // Bilgi için teal
    
    // Background Colors - Modern ve şık
    background: '#FFFFFF',     // Saf beyaz
    backgroundSecondary: '#F8F9FA', // Çok açık gri
    backgroundAccent: '#E8F5E8',    // Çok açık yeşil
    backgroundPastel: '#F0F8F5',    // Pastel arka plan
    
    // Text Colors - Okunabilirlik odaklı
    text: '#2C3E50',           // Ana metin için koyu mavi-gri
    textSecondary: '#7F8C8D',  // İkincil metin için orta gri
    textLight: '#BDC3C7',      // İpuçları için açık gri
    textInverse: '#FFFFFF',    // Beyaz metin
    textMuted: '#95A5A6',      // Soluk metin
    
    // Border Colors
    border: '#E1E8ED',         // Açık kenarlık
    borderLight: '#F7F9FA',    // Çok açık kenarlık
    divider: '#ECEFF1',        // Ayırıcı çizgiler
    
    // Card and Component Colors
    cardBackground: '#FFFFFF',
    cardShadow: 'rgba(0, 0, 0, 0.08)',
    
    // Device Integration Colors
    deviceConnected: '#44A878',    // Bağlı cihaz
    deviceDisconnected: '#F44336', // Bağlantısız cihaz
    devicePending: '#FF9800',      // Beklemede
    
    // Specific Feature Colors
    health: '#44A878',         // Sağlık yeşili
    appointment: '#5AACB0',    // Randevu teal
    medicine: '#78C8A4',       // İlaç açık yeşil
    ai: '#6366F1',            // AI indigo
    nutrition: '#F59E0B',      // Beslenme amber
    exercise: '#EF4444',       // Egzersiz kırmızı
    sleep: '#8B5CF6',         // Uyku mor
    steps: '#10B981',         // Adım yeşil
  },
  
  typography: {
    // Font Family - Türkçe desteği ile sistem fontları
    fontFamily: {
      regular: 'System',
      medium: 'System',
      bold: 'System',
    },
    
    // Font Sizes - İyileştirilmiş hiyerarşi
    fontSize: {
      xs: 11,
      sm: 13,
      base: 15,
      lg: 17,
      xl: 19,
      '2xl': 22,
      '3xl': 26,
      '4xl': 30,
      '5xl': 36,
    },
    
    // Font Weights - Tasarım rehberinde belirtilen
    fontWeight: {
      light: '300',
      regular: '400',      // Normal Metin Yazı Tipi (Regular)
      medium: '500',       // Alt Başlık Yazı Tipi (Medium)
      semibold: '600',
      bold: '700',         // Başlık Yazı Tipi (Bold)
      black: '800',
    },
    
    // Line Heights
    lineHeight: {
      tight: 1.25,
      normal: 1.4,
      relaxed: 1.6,
    },
    
    // Text Styles - Tasarım rehberine uygun
    h1: {
      fontSize: 30,
      fontWeight: '700',    // Bold
      lineHeight: 36,
      color: '#2C3E50',
    },
    h2: {
      fontSize: 26,
      fontWeight: '700',    // Bold
      lineHeight: 32,
      color: '#2C3E50',
    },
    h3: {
      fontSize: 22,
      fontWeight: '600',    // Medium
      lineHeight: 28,
      color: '#2C3E50',
    },
    h4: {
      fontSize: 19,
      fontWeight: '500',    // Medium
      lineHeight: 24,
      color: '#2C3E50',
    },
    body: {
      fontSize: 15,
      fontWeight: '400',    // Regular
      lineHeight: 22,
      color: '#2C3E50',
    },
    bodySecondary: {
      fontSize: 13,
      fontWeight: '400',    // Regular
      lineHeight: 18,
      color: '#7F8C8D',
    },
    caption: {
      fontSize: 11,
      fontWeight: '400',    // Regular
      lineHeight: 14,
      color: '#7F8C8D',
    },
    button: {
      fontSize: 15,
      fontWeight: '600',    // Semibold
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
    '2xl': 22,
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
  
  // Component specific styles - Güncellenmiş
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
      borderRadius: 16,
      padding: 20,
      backgroundColor: '#FFFFFF',
    },
    deviceCard: {
      borderRadius: 12,
      padding: 16,
      backgroundColor: '#F8F9FA',
      borderWidth: 1,
      borderColor: '#E1E8ED',
    },
  },
};

export type Theme = typeof theme;