import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from './theme';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;
const { width } = Dimensions.get('window');

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface HealthRecord {
  weight?: number;
  temperature?: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  heart_rate?: number;
  sleep_hours?: number;
  sleep_minutes?: number;
  steps?: number;
  recorded_at: string;
}

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [latestHealth, setLatestHealth] = useState<HealthRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMood, setCurrentMood] = useState(3); // Başlangıçta 'İyi' (index 3)
  const [activeTab, setActiveTab] = useState('home');

  const moodEmojis = ['😰', '😟', '😐', '😊', '😁'];
  const moodTexts = ['Çok Kötü', 'Kötü', 'Normal', 'İyi', 'Çok İyi'];

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const userData = await AsyncStorage.getItem('user_data');
      
      if (token && userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        await fetchLatestHealthData(token);
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestHealthData = async (token: string) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/health/records/latest`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data) {
        setLatestHealth(response.data);
      }
    } catch (error) {
      console.error('Health data fetch error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['auth_token', 'user_data']);
      setUser(null);
      setLatestHealth(null);
    } catch (error) {
      Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu');
    }
  };

  const navigateToScreen = (screenName: string) => {
    setActiveTab(screenName);
    if (screenName !== 'home') {
      router.push(`/${screenName}` as any);
    }
  };

  const handleEmergencyCall = () => {
    Alert.alert(
      'Acil Çağrı',
      'Acil servisi arayacaksınız. Emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Ara', onPress: () => Alert.alert('112 Aranıyor...') }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />
        
        <View style={styles.welcomeHeader}>
          <MaterialIcons name="healing" size={80} color="#FFFFFF" />
          <Text style={styles.welcomeTitle}>Onkom</Text>
          <Text style={styles.welcomeSubtitle}>Sağlığınız bizim önceliğimiz</Text>
          <Text style={styles.welcomeImprovement}>
            💡 Dün bugünden %15 daha az uyudunuz - bugün daha iyi hissetmek için 8 saat uyumayı hedefleyin!
          </Text>
        </View>

        <View style={styles.welcomeContent}>
          <Text style={styles.welcomeDescription}>
            Kanser bakım sürecinizde size yardımcı olmak için buradayız. 
            Sağlık verilerinizi takip edin, uzmanlarınızla iletişim kurun.
          </Text>

          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => router.push('/auth/login')}
          >
            <Text style={styles.loginButtonText}>Giriş Yap</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.registerButton}
            onPress={() => router.push('/auth/register')}
          >
            <Text style={styles.registerButtonText}>Kayıt Ol</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Role-based Dashboard Rendering
  const renderPatientDashboard = () => (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.patientHeader}>
          <View>
            <Text style={styles.greetingText}>Merhaba</Text>
            <Text style={styles.nameText}>Ümit</Text>
          </View>
          <TouchableOpacity onPress={handleLogout}>
            <MaterialIcons name="logout" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* İyileştirme Önerileri */}
        <View style={styles.improvementCard}>
          <MaterialIcons name="trending-up" size={24} color={theme.colors.success} />
          <Text style={styles.improvementTitle}>Bugün Daha İyi!</Text>
          <Text style={styles.improvementText}>
            ✅ Dünden %8 daha fazla yürüdünüz (9,200 adım){'\n'}
            ✅ Uyku kaliteniz %12 arttı (7s 45dk){'\n'}
            💡 Su tüketiminizi artırırsanız enerji seviyeniz daha da yükselir!
          </Text>
        </View>

        {/* Mood Check */}
        <View style={styles.moodCard}>
          <Text style={styles.moodTitle}>Bugün nasıl hissediyorsun?</Text>
          <View style={styles.moodEmojis}>
            {moodEmojis.map((emoji, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.moodEmoji, currentMood === index && styles.selectedMood]}
                onPress={() => setCurrentMood(index)}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.moodLabel}>{moodTexts[currentMood]}</Text>
        </View>

        {/* Device Integration Panel */}
        <View style={styles.devicePanel}>
          <Text style={styles.deviceTitle}>Cihaz Entegrasyonları</Text>
          <View style={styles.deviceRow}>
            <View style={[styles.deviceCard, styles.deviceConnected]}>
              <MaterialIcons name="monitor-weight" size={20} color={theme.colors.deviceConnected} />
              <Text style={styles.deviceName}>Akıllı Terazi</Text>
              <Text style={styles.deviceStatus}>Bağlı</Text>
            </View>
            <View style={[styles.deviceCard, styles.deviceConnected]}>
              <MaterialIcons name="favorite" size={20} color={theme.colors.deviceConnected} />
              <Text style={styles.deviceName}>Nabız Sensörü</Text>
              <Text style={styles.deviceStatus}>Bağlı</Text>
            </View>
            <View style={[styles.deviceCard, styles.devicePending]}>
              <MaterialIcons name="directions-walk" size={20} color={theme.colors.devicePending} />
              <Text style={styles.deviceName}>Adım Sayar</Text>
              <Text style={styles.deviceStatus}>Senkronize ediliyor...</Text>
            </View>
          </View>
        </View>

        {/* Health Stats Grid - Güncellenmiş verilerle */}
        <View style={styles.statsGrid}>
          {/* Sleep */}
          <View style={[styles.statCard, { backgroundColor: theme.colors.sleep }]}>
            <MaterialIcons name="bedtime" size={24} color="#FFF" />
            <Text style={styles.statValue}>7s 45dk</Text>
            <Text style={styles.statLabel}>Uyku (+12%)</Text>
            <View style={styles.sleepProgress}>
              <View style={[styles.progressBar, { width: '85%' }]} />
            </View>
          </View>

          {/* Steps */}
          <View style={[styles.statCard, { backgroundColor: theme.colors.steps }]}>
            <MaterialIcons name="directions-walk" size={24} color="#FFF" />
            <Text style={styles.statValue}>9,200</Text>
            <Text style={styles.statLabel}>Adım (+8%)</Text>
            <Text style={styles.statSubLabel}>Hedef: 10,000</Text>
          </View>

          {/* Heart Rate */}
          <View style={[styles.statCard, { backgroundColor: theme.colors.error }]}>
            <MaterialIcons name="favorite" size={24} color="#FFF" />
            <Text style={styles.statValue}>68 BPM</Text>
            <Text style={styles.statLabel}>Kalp (-6%)</Text>
            <Text style={styles.statSubLabel}>Normal aralık</Text>
          </View>

          {/* Weight */}
          <View style={[styles.statCard, { backgroundColor: theme.colors.info }]}>
            <MaterialIcons name="monitor-weight" size={24} color="#FFF" />
            <Text style={styles.statValue}>71.2 kg</Text>
            <Text style={styles.statLabel}>Kilo (+0.3kg)</Text>
            <Text style={styles.statSubLabel}>BMI: 22.8</Text>
          </View>
        </View>

        {/* AI Chat Input */}
        <TouchableOpacity 
          style={styles.aiChatInput}
          onPress={() => navigateToScreen('ai-chat')}
        >
          <Text style={styles.aiChatPlaceholder}>AI'ya soru sor: "Bugünkü iyileşmelerim nasıl?"</Text>
          <MaterialIcons name="send" size={20} color={theme.colors.primary} />
        </TouchableOpacity>

        {/* Emergency Button */}
        <TouchableOpacity style={styles.emergencyButton} onPress={handleEmergencyCall}>
          <Text style={styles.emergencyText}>ACİL ÇAĞRI</Text>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity 
            style={[styles.quickAction, { backgroundColor: theme.colors.medicine }]}
            onPress={() => navigateToScreen('medicines')}
          >
            <MaterialIcons name="medication" size={24} color="#FFF" />
            <Text style={styles.quickActionText}>Bugünkü{'\n'}İlaçlarım</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.quickAction, { backgroundColor: theme.colors.nutrition }]}
            onPress={() => navigateToScreen('nutrition')}
          >
            <MaterialIcons name="restaurant" size={24} color="#FFF" />
            <Text style={styles.quickActionText}>Beslenme{'\n'}Planı</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.quickAction, { backgroundColor: theme.colors.exercise }]}
            onPress={() => navigateToScreen('exercise')}
          >
            <MaterialIcons name="fitness-center" size={24} color="#FFF" />
            <Text style={styles.quickActionText}>Egzersiz{'\n'}Planı</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.quickAction, { backgroundColor: theme.colors.appointment }]}
            onPress={() => navigateToScreen('appointments')}
          >
            <MaterialIcons name="calendar-today" size={24} color="#FFF" />
            <Text style={styles.quickActionText}>Yaklaşan{'\n'}Randevular</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'home' && styles.activeNavItem]}
          onPress={() => setActiveTab('home')}
        >
          <MaterialIcons name="home" size={24} color={activeTab === 'home' ? theme.colors.primary : theme.colors.textLight} />
          <Text style={[styles.navText, activeTab === 'home' && styles.activeNavText]}>Ana Sayfa</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'medicines' && styles.activeNavItem]}
          onPress={() => navigateToScreen('medicines')}
        >
          <MaterialIcons name="medication" size={24} color={activeTab === 'medicines' ? theme.colors.primary : theme.colors.textLight} />
          <Text style={[styles.navText, activeTab === 'medicines' && styles.activeNavText]}>İlaçlar</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'health' && styles.activeNavItem]}
          onPress={() => navigateToScreen('health/records')}
        >
          <MaterialIcons name="favorite" size={24} color={activeTab === 'health' ? theme.colors.primary : theme.colors.textLight} />
          <Text style={[styles.navText, activeTab === 'health' && styles.activeNavText]}>Sağlık</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'appointments' && styles.activeNavItem]}
          onPress={() => navigateToScreen('appointments')}
        >
          <MaterialIcons name="event" size={24} color={activeTab === 'appointments' ? theme.colors.primary : theme.colors.textLight} />
          <Text style={[styles.navText, activeTab === 'appointments' && styles.activeNavText]}>Randevu</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'profile' && styles.activeNavItem]}
          onPress={() => setActiveTab('profile')}
        >
          <MaterialIcons name="person" size={24} color={activeTab === 'profile' ? theme.colors.primary : theme.colors.textLight} />
          <Text style={[styles.navText, activeTab === 'profile' && styles.activeNavText]}>Profil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  const renderDoctorDashboard = () => (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Doctor Header */}
        <View style={styles.doctorHeader}>
          <View>
            <Text style={styles.greetingText}>Dr. {user.name.split(' ')[1] || user.name}</Text>
            <Text style={styles.roleText}>Onkoloji Uzmanı</Text>
          </View>
          <TouchableOpacity onPress={handleLogout}>
            <MaterialIcons name="logout" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* İyileştirme Önerileri - Doktor */}
        <View style={styles.doctorImprovementCard}>
          <MaterialIcons name="analytics" size={24} color={theme.colors.info} />
          <Text style={styles.improvementTitle}>Hasta İyileştirme Analizi</Text>
          <Text style={styles.improvementText}>
            📈 Ümit'in uyku kalitesi %12 arttı{'\n'}
            🚶‍♂️ Aktivite seviyesi %8 yükseldi{'\n'}
            💡 Öneriler: Su tüketimi artırılmalı, meditasyon desteği verilebilir
          </Text>
        </View>

        {/* Patient Alerts */}
        <View style={styles.alertsCard}>
          <Text style={styles.alertsTitle}>Hasta Uyarıları</Text>
          <View style={styles.alertItem}>
            <MaterialIcons name="warning" size={20} color={theme.colors.warning} />
            <Text style={styles.alertText}>Ümit B. - Uyku düzeni değişti (+12%)</Text>
          </View>
          <View style={styles.alertItem}>
            <MaterialIcons name="info" size={20} color={theme.colors.info} />
            <Text style={styles.alertText}>Fatma K. - İlaç uyumu arttı (%85)</Text>
          </View>
        </View>

        {/* Today's Appointments */}
        <View style={styles.appointmentsCard}>
          <Text style={styles.cardTitle}>Bugünkü Randevular</Text>
          <View style={styles.appointmentItem}>
            <Text style={styles.appointmentTime}>09:00</Text>
            <Text style={styles.appointmentPatient}>Ümit B.</Text>
            <Text style={styles.appointmentType}>Kontrol</Text>
          </View>
          <View style={styles.appointmentItem}>
            <Text style={styles.appointmentTime}>10:30</Text>
            <Text style={styles.appointmentPatient}>Fatma K.</Text>
            <Text style={styles.appointmentType}>Tedavi Planı</Text>
          </View>
        </View>

        {/* Patient Stats Overview */}
        <View style={styles.overviewGrid}>
          <View style={[styles.overviewCard, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.overviewNumber}>23</Text>
            <Text style={styles.overviewLabel}>Aktif Hasta</Text>
          </View>
          <View style={[styles.overviewCard, { backgroundColor: theme.colors.warning }]}>
            <Text style={styles.overviewNumber}>2</Text>
            <Text style={styles.overviewLabel}>Dikkat Gerekli</Text>
          </View>
          <View style={[styles.overviewCard, { backgroundColor: theme.colors.success }]}>
            <Text style={styles.overviewNumber}>92%</Text>
            <Text style={styles.overviewLabel}>İyileşme Oranı</Text>
          </View>
        </View>
      </ScrollView>

      {/* Doctor Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <MaterialIcons name="dashboard" size={24} color={theme.colors.primary} />
          <Text style={[styles.navText, styles.activeNavText]}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MaterialIcons name="people" size={24} color={theme.colors.textLight} />
          <Text style={styles.navText}>Hastalar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MaterialIcons name="calendar-today" size={24} color={theme.colors.textLight} />
          <Text style={styles.navText}>Randevular</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MaterialIcons name="assessment" size={24} color={theme.colors.textLight} />
          <Text style={styles.navText}>Raporlar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  const renderCaregiverDashboard = () => (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Caregiver Header */}
        <View style={styles.caregiverHeader}>
          <View>
            <Text style={styles.greetingText}>{user.name}</Text>
            <Text style={styles.roleText}>Hasta Bakıcısı</Text>
          </View>
          <TouchableOpacity onPress={handleLogout}>
            <MaterialIcons name="logout" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* İyileştirme Takibi - Bakıcı */}
        <View style={styles.caregiverImprovementCard}>
          <MaterialIcons name="track-changes" size={24} color={theme.colors.accent} />
          <Text style={styles.improvementTitle}>Ümit'in İyileşme Süreci</Text>
          <Text style={styles.improvementText}>
            😴 Uyku kalitesi: Mükemmel (+12%){'\n'}
            🚶 Günlük aktivite: Çok iyi (+8%){'\n'}
            💡 Yapılacaklar: Su hatırlatması, öğle istirahat
          </Text>
        </View>

        {/* Patient Status */}
        <View style={styles.patientStatusCard}>
          <Text style={styles.cardTitle}>Hasta Durumu</Text>
          <View style={styles.statusRow}>
            <MaterialIcons name="favorite" size={20} color={theme.colors.success} />
            <Text style={styles.statusText}>Genel durum: Çok İyi (+15%)</Text>
          </View>
          <View style={styles.statusRow}>
            <MaterialIcons name="medication" size={20} color={theme.colors.success} />
            <Text style={styles.statusText}>İlaç uyumu: %95 (artış)</Text>
          </View>
          <View style={styles.statusRow}>
            <MaterialIcons name="schedule" size={20} color={theme.colors.info} />
            <Text style={styles.statusText}>Sonraki randevu: Yarın 14:00</Text>
          </View>
        </View>

        {/* Care Tasks */}
        <View style={styles.careTasksCard}>
          <Text style={styles.cardTitle}>Bugünkü Görevler</Text>
          <View style={styles.taskItem}>
            <MaterialIcons name="check-circle" size={20} color={theme.colors.success} />
            <Text style={styles.taskText}>Sabah ilaçları verildi ✓</Text>
          </View>
          <View style={styles.taskItem}>
            <MaterialIcons name="check-circle" size={20} color={theme.colors.success} />
            <Text style={styles.taskText}>Uyku takibi yapıldı ✓</Text>
          </View>
          <View style={styles.taskItem}>
            <MaterialIcons name="radio-button-unchecked" size={20} color={theme.colors.textLight} />
            <Text style={styles.taskText}>Akşam ilaçları (17:00)</Text>
          </View>
        </View>

        {/* Quick Actions for Caregiver */}
        <View style={styles.careActionsGrid}>
          <TouchableOpacity style={[styles.careAction, { backgroundColor: theme.colors.medicine }]}>
            <MaterialIcons name="medication" size={32} color="#FFF" />
            <Text style={styles.careActionText}>İlaç{'\n'}Hatırlatması</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.careAction, { backgroundColor: theme.colors.error }]}>
            <MaterialIcons name="emergency" size={32} color="#FFF" />
            <Text style={styles.careActionText}>Acil{'\n'}Durum</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.careAction, { backgroundColor: theme.colors.success }]}>
            <MaterialIcons name="note-add" size={32} color="#FFF" />
            <Text style={styles.careActionText}>Günlük{'\n'}Rapor</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.careAction, { backgroundColor: theme.colors.warning }]}>
            <MaterialIcons name="call" size={32} color="#FFF" />
            <Text style={styles.careActionText}>Doktor{'\n'}Ara</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Caregiver Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <MaterialIcons name="home" size={24} color={theme.colors.primary} />
          <Text style={[styles.navText, styles.activeNavText]}>Ana Sayfa</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MaterialIcons name="assignment" size={24} color={theme.colors.textLight} />
          <Text style={styles.navText}>Görevler</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MaterialIcons name="health-and-safety" size={24} color={theme.colors.textLight} />
          <Text style={styles.navText}>Sağlık</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MaterialIcons name="person" size={24} color={theme.colors.textLight} />
          <Text style={styles.navText}>Profil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  // Return appropriate dashboard based on user role
  if (user.role === 'doktor') {
    return renderDoctorDashboard();
  } else if (user.role === 'bakici') {
    return renderCaregiverDashboard();
  } else {
    return renderPatientDashboard();
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.primary,
    marginTop: 10,
  },
  
  // Welcome Screen Styles
  welcomeHeader: {
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    paddingVertical: 60,
    paddingTop: 100,
  },
  welcomeTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 5,
  },
  welcomeImprovement: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.95,
    marginTop: 15,
    paddingHorizontal: 20,
    textAlign: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 12,
  },
  welcomeContent: {
    flex: 1,
    padding: 30,
    justifyContent: 'center',
  },
  welcomeDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  loginButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  registerButton: {
    backgroundColor: 'transparent',
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  registerButtonText: {
    color: theme.colors.primary,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Dashboard Styles
  content: {
    flex: 1,
  },
  
  // Patient Dashboard
  patientHeader: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 50,
  },
  greetingText: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',    
    color: '#FFFFFF',
  },

  // İyileştirme kartları
  improvementCard: {
    backgroundColor: theme.colors.backgroundAccent,
    margin: 16,
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.success,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  doctorImprovementCard: {
    backgroundColor: '#E3F2FD',
    margin: 16,
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.info,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  caregiverImprovementCard: {
    backgroundColor: '#F3E5F5',
    margin: 16,
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.accent,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  improvementTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
    marginLeft: 32,
  },
  improvementText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginLeft: 32,
  },

  // Device Integration
  devicePanel: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  deviceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  deviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deviceCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  deviceConnected: {
    backgroundColor: '#E8F5E8',
    borderColor: theme.colors.deviceConnected,
  },
  devicePending: {
    backgroundColor: '#FFF4E6',
    borderColor: theme.colors.devicePending,
  },
  deviceName: {
    fontSize: 12,
    color: theme.colors.text,
    marginTop: 4,
    textAlign: 'center',
  },
  deviceStatus: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  
  moodCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  moodTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 15,
    textAlign: 'center',
  },
  moodEmojis: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  moodEmoji: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  selectedMood: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  emojiText: {
    fontSize: 24,
  },
  moodLabel: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
  },
  
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    width: (width - 60) / 2,
    margin: 5,
    padding: 15,
    borderRadius: 16,
    alignItems: 'center',
    minHeight: 100,
  },
  statLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 5,
  },
  statSubLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    opacity: 0.8,
  },
  sleepProgress: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginTop: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  
  aiChatInput: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  aiChatPlaceholder: {
    color: '#999',
    fontSize: 16,
  },
  
  emergencyButton: {
    backgroundColor: theme.colors.error,
    marginHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  emergencyText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 100,
  },
  quickAction: {
    width: (width - 60) / 2,
    margin: 5,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    minHeight: 90,
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
  
  // Doctor Dashboard
  doctorHeader: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 50,
  },
  roleText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  
  alertsCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  alertsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 15,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  alertText: {
    fontSize: 14,
    color: theme.colors.text,
    marginLeft: 10,
  },
  
  appointmentsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 15,
  },
  appointmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  appointmentTime: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    width: 60,
  },
  appointmentPatient: {
    fontSize: 16,
    color: theme.colors.text,
    flex: 1,
    marginLeft: 15,
  },
  appointmentType: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  
  overviewGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 100,
  },
  overviewCard: {
    flex: 1,
    margin: 5,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  overviewNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  overviewLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 5,
    textAlign: 'center',
  },
  
  // Caregiver Dashboard
  caregiverHeader: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 50,
  },
  
  patientStatusCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusText: {
    fontSize: 14,
    color: theme.colors.text,
    marginLeft: 10,
  },
  
  careTasksCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  taskText: {
    fontSize: 14,
    color: theme.colors.text,
    marginLeft: 10,
  },
  
  careActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 100,
  },
  careAction: {
    width: (width - 60) / 2,
    margin: 5,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    minHeight: 100,
  },
  careActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
  
  // Bottom Navigation
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 5,
  },
  activeNavItem: {
    // Add active state styling if needed
  },
  navText: {
    fontSize: 10,
    color: theme.colors.textLight,
    marginTop: 4,
  },
  activeNavText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});