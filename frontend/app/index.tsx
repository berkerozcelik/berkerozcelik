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
  const [currentMood, setCurrentMood] = useState(2); // 0-4 (very sad to very happy)
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
        <ActivityIndicator size="large" color="#5AACB0" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#5AACB0" barStyle="light-content" />
        
        <View style={styles.welcomeHeader}>
          <MaterialIcons name="healing" size={80} color="#FFFFFF" />
          <Text style={styles.welcomeTitle}>Onkom</Text>
          <Text style={styles.welcomeSubtitle}>Sağlığınız bizim önceliğimiz</Text>
        </View>

        <View style={styles.welcomeContent}>
          <Text style={styles.welcomeDescription}>
            Kanser bakım sürecinizde size yardımcı olmak için buradayız. 
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
      <StatusBar backgroundColor="#5AACB0" barStyle="light-content" />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.patientHeader}>
          <View>
            <Text style={styles.greetingText}>Merhaba</Text>
            <Text style={styles.nameText}>{user.name.split(' ')[0]}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout}>
            <MaterialIcons name="logout" size={24} color="#FFF" />
          </TouchableOpacity>
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
        </View>

        {/* Health Stats Grid */}
        <View style={styles.statsGrid}>
          {/* Sleep */}
          <View style={[styles.statCard, { backgroundColor: '#4A90E2' }]}>
            <MaterialIcons name="bedtime" size={24} color="#FFF" />
            <Text style={styles.statLabel}>Uyku: {latestHealth?.sleep_hours || 7}s {latestHealth?.sleep_minutes || 20}dk</Text>
            <View style={styles.sleepProgress}>
              <View style={[styles.progressBar, { width: '75%' }]} />
            </View>
          </View>

          {/* Steps */}
          <View style={[styles.statCard, { backgroundColor: '#7ED321' }]}>
            <MaterialIcons name="directions-walk" size={24} color="#FFF" />
            <Text style={styles.statValue}>{latestHealth?.steps || 6542}</Text>
            <Text style={styles.statLabel}>Adım</Text>
          </View>

          {/* Heart Rate */}
          <View style={[styles.statCard, { backgroundColor: '#F5A623' }]}>
            <MaterialIcons name="favorite" size={24} color="#FFF" />
            <Text style={styles.statValue}>{latestHealth?.heart_rate || 72} BPM</Text>
            <Text style={styles.statLabel}>Kalp</Text>
            <Text style={styles.statSubLabel}>781</Text>
          </View>

          {/* Weight */}
          <View style={[styles.statCard, { backgroundColor: '#50E3C2' }]}>
            <MaterialIcons name="monitor-weight" size={24} color="#FFF" />
            <Text style={styles.statValue}>{latestHealth?.weight || 68.5} kg</Text>
            <Text style={styles.statLabel}>Kilo</Text>
            <Text style={styles.statSubLabel}>BMI</Text>
          </View>
        </View>

        {/* AI Chat Input */}
        <TouchableOpacity 
          style={styles.aiChatInput}
          onPress={() => navigateToScreen('ai-chat')}
        >
          <Text style={styles.aiChatPlaceholder}>Yapay zekaya soru sor...</Text>
          <MaterialIcons name="send" size={20} color="#5AACB0" />
        </TouchableOpacity>

        {/* Emergency Button */}
        <TouchableOpacity style={styles.emergencyButton} onPress={handleEmergencyCall}>
          <Text style={styles.emergencyText}>ACİL ÇAĞRI</Text>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity 
            style={[styles.quickAction, { backgroundColor: '#4A90E2' }]}
            onPress={() => navigateToScreen('medicines')}
          >
            <MaterialIcons name="medication" size={24} color="#FFF" />
            <Text style={styles.quickActionText}>Bugünkü{'\n'}İlaçlarım</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.quickAction, { backgroundColor: '#7ED321' }]}
            onPress={() => navigateToScreen('nutrition')}
          >
            <MaterialIcons name="restaurant" size={24} color="#FFF" />
            <Text style={styles.quickActionText}>Beslenme{'\n'}Planı</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.quickAction, { backgroundColor: '#F5A623' }]}
            onPress={() => navigateToScreen('exercise')}
          >
            <MaterialIcons name="fitness-center" size={24} color="#FFF" />
            <Text style={styles.quickActionText}>Egzersiz{'\n'}Planı</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.quickAction, { backgroundColor: '#50E3C2' }]}
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
          <MaterialIcons name="home" size={24} color={activeTab === 'home' ? '#5AACB0' : '#B0BEC5'} />
          <Text style={[styles.navText, activeTab === 'home' && styles.activeNavText]}>Ana Sayfa</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'medicines' && styles.activeNavItem]}
          onPress={() => navigateToScreen('medicines')}
        >
          <MaterialIcons name="medication" size={24} color={activeTab === 'medicines' ? '#5AACB0' : '#B0BEC5'} />
          <Text style={[styles.navText, activeTab === 'medicines' && styles.activeNavText]}>İlaçlar</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'appointments' && styles.activeNavItem]}
          onPress={() => navigateToScreen('appointments')}
        >
          <MaterialIcons name="calendar-today" size={24} color={activeTab === 'appointments' ? '#5AACB0' : '#B0BEC5'} />
          <Text style={[styles.navText, activeTab === 'appointments' && styles.activeNavText]}>Planlım</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'health' && styles.activeNavItem]}
          onPress={() => navigateToScreen('health/records')}
        >
          <MaterialIcons name="favorite" size={24} color={activeTab === 'health' ? '#5AACB0' : '#B0BEC5'} />
          <Text style={[styles.navText, activeTab === 'health' && styles.activeNavText]}>Sağlık</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'appointments' && styles.activeNavItem]}
          onPress={() => navigateToScreen('appointments')}
        >
          <MaterialIcons name="event" size={24} color={activeTab === 'appointments' ? '#5AACB0' : '#B0BEC5'} />
          <Text style={[styles.navText, activeTab === 'appointments' && styles.activeNavText]}>Randevu</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'profile' && styles.activeNavItem]}
          onPress={() => setActiveTab('profile')}
        >
          <MaterialIcons name="person" size={24} color={activeTab === 'profile' ? '#5AACB0' : '#B0BEC5'} />
          <Text style={[styles.navText, activeTab === 'profile' && styles.activeNavText]}>Profil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  const renderDoctorDashboard = () => (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#5AACB0" barStyle="light-content" />
      
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

        {/* Patient Alerts */}
        <View style={styles.alertsCard}>
          <Text style={styles.alertsTitle}>Hasta Uyarıları</Text>
          <View style={styles.alertItem}>
            <MaterialIcons name="warning" size={20} color="#F44336" />
            <Text style={styles.alertText}>Ahmet Y. - Yüksek ateş (38.5°C)</Text>
          </View>
          <View style={styles.alertItem}>
            <MaterialIcons name="info" size={20} color="#FF9800" />
            <Text style={styles.alertText}>Fatma K. - İlaç uyumu düşük (%60)</Text>
          </View>
        </View>

        {/* Today's Appointments */}
        <View style={styles.appointmentsCard}>
          <Text style={styles.cardTitle}>Bugünkü Randevular</Text>
          <View style={styles.appointmentItem}>
            <Text style={styles.appointmentTime}>09:00</Text>
            <Text style={styles.appointmentPatient}>Ahmet Y.</Text>
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
          <View style={[styles.overviewCard, { backgroundColor: '#4A90E2' }]}>
            <Text style={styles.overviewNumber}>23</Text>
            <Text style={styles.overviewLabel}>Aktif Hasta</Text>
          </View>
          <View style={[styles.overviewCard, { backgroundColor: '#F44336' }]}>
            <Text style={styles.overviewNumber}>3</Text>
            <Text style={styles.overviewLabel}>Kritik Durum</Text>
          </View>
          <View style={[styles.overviewCard, { backgroundColor: '#4CAF50' }]}>
            <Text style={styles.overviewNumber}>87%</Text>
            <Text style={styles.overviewLabel}>İlaç Uyumu</Text>
          </View>
        </View>
      </ScrollView>

      {/* Doctor Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <MaterialIcons name="dashboard" size={24} color="#5AACB0" />
          <Text style={[styles.navText, styles.activeNavText]}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MaterialIcons name="people" size={24} color="#B0BEC5" />
          <Text style={styles.navText}>Hastalar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MaterialIcons name="calendar-today" size={24} color="#B0BEC5" />
          <Text style={styles.navText}>Randevular</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MaterialIcons name="assessment" size={24} color="#B0BEC5" />
          <Text style={styles.navText}>Raporlar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  const renderCaregiverDashboard = () => (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#5AACB0" barStyle="light-content" />
      
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

        {/* Patient Status */}
        <View style={styles.patientStatusCard}>
          <Text style={styles.cardTitle}>Hasta Durumu</Text>
          <View style={styles.statusRow}>
            <MaterialIcons name="favorite" size={20} color="#4CAF50" />
            <Text style={styles.statusText}>Genel durum: İyi</Text>
          </View>
          <View style={styles.statusRow}>
            <MaterialIcons name="medication" size={20} color="#FF9800" />
            <Text style={styles.statusText}>İlaç hatırlatması: 2 adet</Text>
          </View>
          <View style={styles.statusRow}>
            <MaterialIcons name="schedule" size={20} color="#2196F3" />
            <Text style={styles.statusText}>Sonraki randevu: Yarın 14:00</Text>
          </View>
        </View>

        {/* Care Tasks */}
        <View style={styles.careTasksCard}>
          <Text style={styles.cardTitle}>Bugünkü Görevler</Text>
          <View style={styles.taskItem}>
            <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
            <Text style={styles.taskText}>Sabah ilaçları verildi</Text>
          </View>
          <View style={styles.taskItem}>
            <MaterialIcons name="radio-button-unchecked" size={20} color="#B0BEC5" />
            <Text style={styles.taskText}>Öğle yemeği</Text>
          </View>
          <View style={styles.taskItem}>
            <MaterialIcons name="radio-button-unchecked" size={20} color="#B0BEC5" />
            <Text style={styles.taskText}>Akşam ilaçları</Text>
          </View>
        </View>

        {/* Quick Actions for Caregiver */}
        <View style={styles.careActionsGrid}>
          <TouchableOpacity style={[styles.careAction, { backgroundColor: '#4A90E2' }]}>
            <MaterialIcons name="medication" size={32} color="#FFF" />
            <Text style={styles.careActionText}>İlaç{'\n'}Hatırlatması</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.careAction, { backgroundColor: '#F44336' }]}>
            <MaterialIcons name="emergency" size={32} color="#FFF" />
            <Text style={styles.careActionText}>Acil{'\n'}Durum</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.careAction, { backgroundColor: '#4CAF50' }]}>
            <MaterialIcons name="note-add" size={32} color="#FFF" />
            <Text style={styles.careActionText}>Günlük{'\n'}Rapor</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.careAction, { backgroundColor: '#FF9800' }]}>
            <MaterialIcons name="call" size={32} color="#FFF" />
            <Text style={styles.careActionText}>Doktor{'\n'}Ara</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Caregiver Bottom Nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <MaterialIcons name="home" size={24} color="#5AACB0" />
          <Text style={[styles.navText, styles.activeNavText]}>Ana Sayfa</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MaterialIcons name="assignment" size={24} color="#B0BEC5" />
          <Text style={styles.navText}>Görevler</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MaterialIcons name="health-and-safety" size={24} color="#B0BEC5" />
          <Text style={styles.navText}>Sağlık</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MaterialIcons name="person" size={24} color="#B0BEC5" />
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
    backgroundColor: '#F0F4F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F4F7',
  },
  loadingText: {
    fontSize: 16,
    color: '#5AACB0',
    marginTop: 10,
  },
  
  // Welcome Screen Styles
  welcomeHeader: {
    backgroundColor: '#5AACB0',
    alignItems: 'center',
    paddingVertical: 60,
    paddingTop: 100,
  },
  welcomeTitle: {
    fontSize: 32,
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
    backgroundColor: '#5AACB0',
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
    borderColor: '#5AACB0',
  },
  registerButtonText: {
    color: '#5AACB0',
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
    backgroundColor: '#5AACB0',
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
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  moodEmojis: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
    borderColor: '#5AACB0',
  },
  emojiText: {
    fontSize: 24,
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
    backgroundColor: '#F44336',
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
    backgroundColor: '#5AACB0',
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
    color: '#333',
    marginBottom: 15,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  alertText: {
    fontSize: 14,
    color: '#333',
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
    color: '#333',
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
    color: '#5AACB0',
    width: 60,
  },
  appointmentPatient: {
    fontSize: 16,
    color: '#333',
    flex: 1,
    marginLeft: 15,
  },
  appointmentType: {
    fontSize: 14,
    color: '#666',
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
    backgroundColor: '#5AACB0',
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
    color: '#333',
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
    color: '#333',
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
    color: '#B0BEC5',
    marginTop: 4,
  },
  activeNavText: {
    color: '#5AACB0',
    fontWeight: '600',
  },
});