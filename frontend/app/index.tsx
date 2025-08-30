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
  Dimensions,
  Linking,
  Modal
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

interface PredictiveAnalysis {
  id: string;
  prediction_type: string;
  title: string;
  description: string;
  probability: number;
  timeline: string;
  recommendations: string[];
  severity: 'low' | 'medium' | 'high';
  category: 'treatment' | 'nutrition' | 'lifestyle' | 'medication';
}

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [latestHealth, setLatestHealth] = useState<HealthRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMood, setCurrentMood] = useState(3); // Başlangıçta 'İyi' 
  const [activeTab, setActiveTab] = useState('home');
  const [showPredictionModal, setShowPredictionModal] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState<PredictiveAnalysis | null>(null);
  const [predictiveAnalysis, setPredictiveAnalysis] = useState<PredictiveAnalysis[]>([]);

  const moodEmojis = ['😰', '😟', '😐', '😊', '😁'];
  const moodTexts = ['Çok Kötü', 'Kötü', 'Normal', 'İyi', 'Çok İyi'];

  // AI Tahmine Dayalı Analiz - Mock Data (gerçek uygulamada AI'dan gelecek)
  const mockPredictiveData: PredictiveAnalysis[] = [
    {
      id: '1',
      prediction_type: 'treatment_response',
      title: 'Kemoterapi Yan Etkisi Tahmini',
      description: 'Kemoterapi seansından 2-3 gün sonra vücut sıcaklığınızda yükselme beklenmektedir.',
      probability: 85,
      timeline: '2-3 gün içinde',
      recommendations: [
        'Günde en az 2.5 litre sıvı tüketin',
        'C vitamini açısından zengin meyveleri tercih edin',
        'Vücut sıcaklığınızı günde 3 kez ölçün',
        'Ateş 38.5°C üzerine çıkarsa doktorunuza başvurun'
      ],
      severity: 'medium',
      category: 'treatment'
    },
    {
      id: '2',
      prediction_type: 'nutrition_need',
      title: 'Beslenme Gereksinimi Analizi',
      description: 'Mevcut kilo kaybı trendine göre protein ihtiyacınız artacak.',
      probability: 92,
      timeline: '1 hafta içinde',
      recommendations: [
        'Günlük protein alımını 1.2g/kg vücut ağırlığına çıkarın',
        'Omega-3 açısından zengin balık tüketin',
        'Probiyotik yoğurt ve kefir ekleyin',
        'Küçük ve sık öğünler tercih edin'
      ],
      severity: 'high',
      category: 'nutrition'
    },
    {
      id: '3',
      prediction_type: 'energy_level',
      title: 'Enerji Seviyesi Öngörüsü',
      description: 'Uyku kalitenizdeki iyileşme ile enerji seviyeniz %15 artacak.',
      probability: 78,
      timeline: '5-7 gün içinde',
      recommendations: [
        'Düzenli uyku saatlerini koruyun',
        '20 dakikalık hafif yürüyüş yapın',
        'Magnezyum açısından zengin yiyecekler tüketin',
        'Stres yönetimi teknikleri uygulayın'
      ],
      severity: 'low',
      category: 'lifestyle'
    }
  ];

  // Today's tasks
  const todayTasks = [
    { id: 1, text: 'Sabah ilaçlarını al', time: '09:00', completed: true, icon: 'medication' },
    { id: 2, text: 'Kan basıncını ölç', time: '10:00', completed: false, icon: 'favorite' },
    { id: 3, text: '20 dakika yürüyüş yap', time: '11:00', completed: false, icon: 'directions-walk' },
    { id: 4, text: 'Öğle ilaçlarını al', time: '14:00', completed: false, icon: 'medication' },
    { id: 5, text: 'Psikolog randevusu', time: '15:30', completed: false, icon: 'event' }
  ];

  // This week's agenda
  const weeklyAgenda = [
    { day: 'Pazartesi', tasks: ['Kan tahlili', 'Diyetisyen randevusu'], completed: 2, total: 2 },
    { day: 'Salı', tasks: ['İlaç takibi', 'Egzersiz programı'], completed: 1, total: 2 },
    { day: 'Çarşamba', tasks: ['Kontrol muayenesi', 'Beslenme planı'], completed: 0, total: 2 },
    { day: 'Perşembe', tasks: ['Fizik tedavi', 'Vitamin takviyesi'], completed: 0, total: 2 },
    { day: 'Cuma', tasks: ['Uyku analizi', 'Psikolojik destek'], completed: 0, total: 2 }
  ];

  useEffect(() => {
    checkAuthStatus();
    loadPredictiveAnalysis();
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

  const loadPredictiveAnalysis = async () => {
    try {
      // Gerçek uygulamada bu AI endpoint'inden gelecek
      // const response = await axios.get(`${BACKEND_URL}/api/predictive-analysis`);
      setPredictiveAnalysis(mockPredictiveData);
    } catch (error) {
      console.error('Predictive analysis error:', error);
      // Hata durumunda mock data kullan
      setPredictiveAnalysis(mockPredictiveData);
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
      '112 Acil Servisini arayacaksınız. Emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Ara', 
          onPress: () => {
            Linking.openURL('tel:112').catch(() => {
              Alert.alert('Hata', 'Telefon uygulaması açılamadı');
            });
          }
        }
      ]
    );
  };

  const toggleTaskCompletion = (taskId: number) => {
    // Task completion logic here
    Alert.alert('Görev', 'Görev durumu güncellendi!');
  };

  const getPredictionIcon = (category: string) => {
    switch (category) {
      case 'treatment': return 'medical-services';
      case 'nutrition': return 'restaurant';
      case 'lifestyle': return 'fitness-center';
      case 'medication': return 'medication';
      default: return 'psychology';
    }
  };

  const getPredictionColor = (severity: string) => {
    switch (severity) {
      case 'high': return theme.colors.error;
      case 'medium': return theme.colors.warning;
      case 'low': return theme.colors.success;
      default: return theme.colors.info;
    }
  };

  const openPredictionDetail = (prediction: PredictiveAnalysis) => {
    setSelectedPrediction(prediction);
    setShowPredictionModal(true);
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

  // Patient Dashboard - Based on Screenshots
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={theme.colors.backgroundLight} barStyle="dark-content" />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Merhaba</Text>
          <Text style={styles.userName}>Ümit</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <MaterialIcons name="logout" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Tahmine Dayalı Sağlık Analizi - YENİ MODÜL */}
        <View style={styles.predictiveAnalysisContainer}>
          <View style={styles.analysisHeader}>
            <MaterialIcons name="psychology" size={28} color={theme.colors.strongTeal} />
            <Text style={styles.analysisTitle}>AI Sağlık Öngörüleri</Text>
          </View>
          <Text style={styles.analysisSubtitle}>
            Sağlık verileriniz analiz edilerek kişiselleştirilmiş öngörüler oluşturuldu
          </Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.predictionsScroll}>
            {predictiveAnalysis.map((prediction) => (
              <TouchableOpacity 
                key={prediction.id} 
                style={styles.predictionCard}
                onPress={() => openPredictionDetail(prediction)}
              >
                <View style={styles.predictionHeader}>
                  <MaterialIcons 
                    name={getPredictionIcon(prediction.category)} 
                    size={20} 
                    color={getPredictionColor(prediction.severity)} 
                  />
                  <View style={[styles.probabilityBadge, { backgroundColor: getPredictionColor(prediction.severity) }]}>
                    <Text style={styles.probabilityText}>{prediction.probability}%</Text>
                  </View>
                </View>
                <Text style={styles.predictionTitle}>{prediction.title}</Text>
                <Text style={styles.predictionTimeline}>{prediction.timeline}</Text>
                <Text numberOfLines={2} style={styles.predictionDesc}>
                  {prediction.description}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Bugün Daha İyisin - Interaktif ve Büyük */}
        <TouchableOpacity style={styles.improvementCardLarge}>
          <View style={styles.improvementHeader}>
            <MaterialIcons name="trending-up" size={32} color={theme.colors.success} />
            <Text style={styles.improvementTitleLarge}>Bugün Daha İyisin! 🎉</Text>
          </View>
          <Text style={styles.improvementTextLarge}>
            ✅ Uyku kaliteniz %15 arttı (7s 20dk){'\n'}
            ✅ Adım sayınız hedefin üzerinde (6.542){'\n'}
            💡 Harika gidiyorsun! Su içmeyi unutma
          </Text>
          <View style={styles.improvementProgress}>
            <View style={styles.progressBarLarge} />
          </View>
        </TouchableOpacity>

        {/* Bugün Seni Neler Bekliyor */}
        <View style={styles.todayTasksContainer}>
          <Text style={styles.sectionTitle}>Bugün Seni Neler Bekliyor</Text>
          {todayTasks.map((task) => (
            <TouchableOpacity 
              key={task.id} 
              style={[styles.taskCard, task.completed && styles.taskCompleted]}
              onPress={() => toggleTaskCompletion(task.id)}
            >
              <View style={styles.taskContent}>
                <MaterialIcons 
                  name={task.icon as any} 
                  size={20} 
                  color={task.completed ? theme.colors.success : theme.colors.strongTeal} 
                />
                <View style={styles.taskInfo}>
                  <Text style={[styles.taskText, task.completed && styles.taskTextCompleted]}>
                    {task.text}
                  </Text>
                  <Text style={styles.taskTime}>{task.time}</Text>
                </View>
                <MaterialIcons 
                  name={task.completed ? "check-circle" : "radio-button-unchecked"} 
                  size={20} 
                  color={task.completed ? theme.colors.success : theme.colors.textLight} 
                />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bu Hafta Bizi Neler Bekliyor */}
        <View style={styles.weeklyAgendaContainer}>
          <Text style={styles.sectionTitle}>Bu Hafta Bizi Neler Bekliyor</Text>
          {weeklyAgenda.map((day, index) => (
            <View key={index} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayName}>{day.day}</Text>
                <View style={styles.progressIndicator}>
                  <Text style={styles.progressText}>{day.completed}/{day.total}</Text>
                  <View style={styles.progressBarSmall}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { width: `${(day.completed / day.total) * 100}%` }
                      ]} 
                    />
                  </View>
                </View>
              </View>
              <View style={styles.taskList}>
                {day.tasks.map((task, taskIndex) => (
                  <Text key={taskIndex} style={styles.dayTask}>• {task}</Text>
                ))}
              </View>
            </View>
          ))}
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

        {/* Health Stats Grid - 4 Cards */}
        <View style={styles.statsGrid}>
          {/* Sleep */}
          <View style={[styles.statCard, styles.sleepCard]}>
            <MaterialIcons name="bedtime" size={24} color={theme.colors.strongTeal} />
            <Text style={styles.statValue}>7s 20dk</Text>
            <Text style={styles.statLabel}>Uyku</Text>
            <View style={styles.sleepProgress}>
              <View style={[styles.progressBar, { width: '85%' }]} />
            </View>
          </View>

          {/* Steps */}
          <View style={[styles.statCard, styles.stepsCard]}>
            <MaterialIcons name="directions-walk" size={24} color={theme.colors.strongTeal} />
            <Text style={styles.statValue}>6.542</Text>
            <Text style={styles.statLabel}>Adım</Text>
            <View style={styles.stepsIndicator}>
              <Text style={styles.stepsText}>••••••••••</Text>
            </View>
          </View>

          {/* Heart Rate */}
          <View style={[styles.statCard, styles.heartCard]}>
            <MaterialIcons name="favorite" size={24} color={theme.colors.strongTeal} />
            <Text style={styles.statValue}>72 BPM</Text>
            <Text style={styles.statLabel}>Kalp</Text>
            <Text style={styles.statSubLabel}>781</Text>
          </View>

          {/* Weight */}
          <View style={[styles.statCard, styles.weightCard]}>
            <MaterialIcons name="monitor-weight" size={24} color={theme.colors.strongTeal} />
            <Text style={styles.statValue}>68,5 kg</Text>
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
          <MaterialIcons name="send" size={20} color={theme.colors.strongTeal} />
        </TouchableOpacity>

        {/* Emergency Button */}
        <TouchableOpacity style={styles.emergencyButton} onPress={handleEmergencyCall}>
          <Text style={styles.emergencyText}>ACİL ÇAĞRI</Text>
        </TouchableOpacity>

        {/* Quick Actions - 4 Cards */}
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity 
            style={[styles.quickAction, styles.medicineAction]}
            onPress={() => navigateToScreen('medicines')}
          >
            <MaterialIcons name="medication" size={24} color={theme.colors.strongTeal} />
            <Text style={styles.quickActionTitle}>Bugünkü</Text>
            <Text style={styles.quickActionSubtitle}>İlaçlarım</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.quickAction, styles.nutritionAction]}
            onPress={() => navigateToScreen('nutrition')}
          >
            <MaterialIcons name="restaurant" size={24} color={theme.colors.strongTeal} />
            <Text style={styles.quickActionTitle}>Beslenme</Text>
            <Text style={styles.quickActionSubtitle}>Planı</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.quickAction, styles.exerciseAction]}
            onPress={() => navigateToScreen('exercise')}
          >
            <MaterialIcons name="fitness-center" size={24} color={theme.colors.strongTeal} />
            <Text style={styles.quickActionTitle}>Egzersiz</Text>
            <Text style={styles.quickActionSubtitle}>Planı</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.quickAction, styles.appointmentAction]}
            onPress={() => navigateToScreen('appointments')}
          >
            <MaterialIcons name="calendar-today" size={24} color={theme.colors.strongTeal} />
            <Text style={styles.quickActionTitle}>Yaklaşan</Text>
            <Text style={styles.quickActionSubtitle}>Randevular</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Predictive Analysis Detail Modal */}
      <Modal
        visible={showPredictionModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPredictionModal(false)}>
              <Text style={styles.modalCancel}>Kapat</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>AI Sağlık Öngörüsü</Text>
            <View style={styles.placeholder} />
          </View>
          
          {selectedPrediction && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.predictionDetailHeader}>
                <MaterialIcons 
                  name={getPredictionIcon(selectedPrediction.category)} 
                  size={32} 
                  color={getPredictionColor(selectedPrediction.severity)} 
                />
                <Text style={styles.predictionDetailTitle}>{selectedPrediction.title}</Text>
                <View style={[styles.probabilityBadgeLarge, { backgroundColor: getPredictionColor(selectedPrediction.severity) }]}>
                  <Text style={styles.probabilityTextLarge}>{selectedPrediction.probability}% Olasılık</Text>
                </View>
              </View>

              <View style={styles.predictionDetailSection}>
                <Text style={styles.sectionLabel}>Zaman Çizelgesi</Text>
                <Text style={styles.sectionText}>{selectedPrediction.timeline}</Text>
              </View>

              <View style={styles.predictionDetailSection}>
                <Text style={styles.sectionLabel}>Detaylı Açıklama</Text>
                <Text style={styles.sectionText}>{selectedPrediction.description}</Text>
              </View>

              <View style={styles.predictionDetailSection}>
                <Text style={styles.sectionLabel}>Kişiselleştirilmiş Öneriler</Text>
                {selectedPrediction.recommendations.map((recommendation, index) => (
                  <View key={index} style={styles.recommendationItem}>
                    <MaterialIcons name="check-circle" size={16} color={theme.colors.success} />
                    <Text style={styles.recommendationText}>{recommendation}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.aiDisclaimer}>
                <MaterialIcons name="info" size={16} color={theme.colors.info} />
                <Text style={styles.disclaimerText}>
                  Bu öngörüler AI analizi ile oluşturulmuştur. Tıbbi kararlarda mutlaka doktorunuzla görüşün.
                </Text>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'home' && styles.activeNavItem]}
          onPress={() => setActiveTab('home')}
        >
          <MaterialIcons name="home" size={24} color={activeTab === 'home' ? theme.colors.strongTeal : theme.colors.textLight} />
          <Text style={[styles.navText, activeTab === 'home' && styles.activeNavText]}>Ana Sayfa</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'medicines' && styles.activeNavItem]}
          onPress={() => navigateToScreen('medicines')}
        >
          <MaterialIcons name="medication" size={24} color={activeTab === 'medicines' ? theme.colors.strongTeal : theme.colors.textLight} />
          <Text style={[styles.navText, activeTab === 'medicines' && styles.activeNavText]}>İlaçlar</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'appointments' && styles.activeNavItem]}
          onPress={() => navigateToScreen('appointments')}
        >
          <MaterialIcons name="event" size={24} color={activeTab === 'appointments' ? theme.colors.strongTeal : theme.colors.textLight} />
          <Text style={[styles.navText, activeTab === 'appointments' && styles.activeNavText]}>Planım</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'health' && styles.activeNavItem]}
          onPress={() => navigateToScreen('health/records')}
        >
          <MaterialIcons name="favorite" size={24} color={activeTab === 'health' ? theme.colors.strongTeal : theme.colors.textLight} />
          <Text style={[styles.navText, activeTab === 'health' && styles.activeNavText]}>Sağlık</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'appointments' && styles.activeNavItem]}
          onPress={() => navigateToScreen('appointments')}
        >
          <MaterialIcons name="event" size={24} color={activeTab === 'appointments' ? theme.colors.strongTeal : theme.colors.textLight} />
          <Text style={[styles.navText, activeTab === 'appointments' && styles.activeNavText]}>Randevu</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.navItem, activeTab === 'profile' && styles.activeNavItem]}
          onPress={() => navigateToScreen('profile')}
        >
          <MaterialIcons name="person" size={24} color={activeTab === 'profile' ? theme.colors.strongTeal : theme.colors.textLight} />
          <Text style={[styles.navText, activeTab === 'profile' && styles.activeNavText]}>Profil</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundLight,
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
    borderRadius: 25,
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
    borderRadius: 25,
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
    backgroundColor: theme.colors.backgroundLight,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 50,
  },
  greeting: {
    fontSize: 18,
    color: theme.colors.strongTeal,
    fontWeight: '500',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.strongTeal,
    marginLeft: 8,
    flex: 1,
  },
  logoutButton: {
    padding: 8,
  },

  // Tahmine Dayalı Sağlık Analizi - YENİ MODÜL
  predictiveAnalysisContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  analysisTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginLeft: 12,
  },
  analysisSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  predictionsScroll: {
    marginHorizontal: -4,
  },
  predictionCard: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    width: 240,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.strongTeal,
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  probabilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  probabilityText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  predictionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 6,
  },
  predictionTimeline: {
    fontSize: 12,
    color: theme.colors.strongTeal,
    fontWeight: '500',
    marginBottom: 8,
  },
  predictionDesc: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },

  // İyileştirme kartı - Büyük ve Interaktif
  improvementCardLarge: {
    backgroundColor: theme.colors.lightBlue,
    margin: 16,
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  improvementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  improvementTitleLarge: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginLeft: 12,
    flex: 1,
  },
  improvementTextLarge: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  improvementProgress: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
  },
  progressBarLarge: {
    width: '78%',
    height: '100%',
    backgroundColor: theme.colors.success,
    borderRadius: 3,
  },

  // Today's Tasks
  todayTasksContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  taskCard: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  taskCompleted: {
    backgroundColor: theme.colors.lightBlue,
    opacity: 0.7,
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskInfo: {
    flex: 1,
    marginLeft: 12,
  },
  taskText: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  taskTime: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },

  // Weekly Agenda
  weeklyAgendaContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dayCard: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  progressIndicator: {
    alignItems: 'flex-end',
  },
  progressText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  progressBarSmall: {
    width: 60,
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.strongTeal,
    borderRadius: 2,
  },
  taskList: {
    marginTop: 8,
  },
  dayTask: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },

  // Mood Check
  moodCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
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
  },
  moodEmoji: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
  },
  selectedMood: {
    backgroundColor: theme.colors.lightBlue,
    borderWidth: 2,
    borderColor: theme.colors.strongTeal,
  },
  emojiText: {
    fontSize: 24,
  },
  
  // Health Stats Grid - 4 Cards
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  statCard: {
    width: (width - 48) / 2,
    margin: 4,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    minHeight: 100,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sleepCard: {
    backgroundColor: theme.colors.lightBlue,
  },
  stepsCard: {
    backgroundColor: '#FFFFFF',
  },
  heartCard: {
    backgroundColor: '#FFFFFF',
  },
  weightCard: {
    backgroundColor: '#FFFFFF',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  statSubLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  sleepProgress: {
    width: '80%',
    height: 4,
    backgroundColor: 'rgba(90, 172, 176, 0.3)',
    borderRadius: 2,
    marginTop: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.strongTeal,
    borderRadius: 2,
  },
  stepsIndicator: {
    marginTop: 8,
  },
  stepsText: {
    color: theme.colors.strongTeal,
    fontSize: 16,
  },
  
  // AI Chat Input
  aiChatInput: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
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
    color: theme.colors.textMuted,
    fontSize: 16,
  },
  
  // Emergency Button
  emergencyButton: {
    backgroundColor: '#FF6B6B',
    marginHorizontal: 16,
    paddingVertical: 18,
    borderRadius: 25,
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
  
  // Quick Actions - 4 Cards
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 100,
  },
  quickAction: {
    width: (width - 48) / 2,
    margin: 4,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    minHeight: 90,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  medicineAction: {
    backgroundColor: theme.colors.lightBlue,
  },
  nutritionAction: {
    backgroundColor: '#FFFFFF',
  },
  exerciseAction: {
    backgroundColor: '#FFFFFF',
  },
  appointmentAction: {
    backgroundColor: '#FFFFFF',
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 8,
    textAlign: 'center',
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },

  // Prediction Detail Modal
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalCancel: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  placeholder: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  predictionDetailHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  predictionDetailTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginVertical: 12,
  },
  probabilityBadgeLarge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  probabilityTextLarge: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  predictionDetailSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingLeft: 8,
  },
  recommendationText: {
    fontSize: 15,
    color: theme.colors.text,
    marginLeft: 12,
    flex: 1,
    lineHeight: 22,
  },
  aiDisclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.backgroundSecondary,
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  disclaimerText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
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
    color: theme.colors.strongTeal,
    fontWeight: '600',
  },
});