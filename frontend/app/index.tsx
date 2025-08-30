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
  ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import { MaterialIcons } from '@expo/vector-icons';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

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
  recorded_at: string;
}

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [latestHealth, setLatestHealth] = useState<HealthRecord | null>(null);
  const [loading, setLoading] = useState(true);

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
    router.push(`/${screenName}` as any);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#4CAF50" barStyle="light-content" />
        
        <View style={styles.header}>
          <MaterialIcons name="health-and-safety" size={60} color="#fff" />
          <Text style={styles.appTitle}>Kanser Bakım</Text>
          <Text style={styles.appSubtitle}>Sağlığınız bizim önceliğimiz</Text>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Hoş Geldiniz</Text>
            <Text style={styles.welcomeText}>
              Kanser bakım sürecinizde size yardımcı olmak için buradayız. 
              Sağlık verilerinizi takip edin, randevularınızı yönetin ve 
              kişiselleştirilmiş tavsiyelere erişin.
            </Text>
          </View>

          <View style={styles.authButtons}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => navigateToScreen('auth/login')}
            >
              <MaterialIcons name="login" size={24} color="#fff" />
              <Text style={styles.primaryButtonText}>Giriş Yap</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => navigateToScreen('auth/register')}
            >
              <MaterialIcons name="person-add" size={24} color="#4CAF50" />
              <Text style={styles.secondaryButtonText}>Kayıt Ol</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>Özellikler</Text>
            
            <View style={styles.featureItem}>
              <MaterialIcons name="monitor-heart" size={32} color="#4CAF50" />
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Sağlık Takibi</Text>
                <Text style={styles.featureDescription}>
                  Kilo, ateş, tansiyon gibi vital verilerinizi kaydedin
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <MaterialIcons name="calendar-today" size={32} color="#4CAF50" />
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Randevu Yönetimi</Text>
                <Text style={styles.featureDescription}>
                  Doktor randevularınızı kolayca planlayın ve takip edin
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <MaterialIcons name="medication" size={32} color="#4CAF50" />
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>İlaç Takibi</Text>
                <Text style={styles.featureDescription}>
                  İlaç saatlerinizi unutmayın, hatırlatma alın
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <MaterialIcons name="psychology" size={32} color="#4CAF50" />
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>AI Asistan</Text>
                <Text style={styles.featureDescription}>
                  Kişiselleştirilmiş sağlık tavsiyeleri ve destek
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Dashboard for logged-in users
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#4CAF50" barStyle="light-content" />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Merhaba, {user.name}</Text>
          <Text style={styles.roleText}>
            {user.role === 'hasta' ? '👤 Hasta' : 
             user.role === 'doktor' ? '⚕️ Doktor' : '👨‍⚕️ Bakıcı'}
          </Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <MaterialIcons name="logout" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Health Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Son Sağlık Verileri</Text>
          {latestHealth ? (
            <View style={styles.healthData}>
              <View style={styles.healthItem}>
                <MaterialIcons name="monitor-weight" size={20} color="#4CAF50" />
                <Text style={styles.healthValue}>
                  {latestHealth.weight ? `${latestHealth.weight} kg` : 'Kayıt yok'}
                </Text>
              </View>
              <View style={styles.healthItem}>
                <MaterialIcons name="thermostat" size={20} color="#FF5722" />
                <Text style={styles.healthValue}>
                  {latestHealth.temperature ? `${latestHealth.temperature}°C` : 'Kayıt yok'}
                </Text>
              </View>
              <View style={styles.healthItem}>
                <MaterialIcons name="favorite" size={20} color="#E91E63" />
                <Text style={styles.healthValue}>
                  {latestHealth.blood_pressure_systolic ? 
                    `${latestHealth.blood_pressure_systolic}/${latestHealth.blood_pressure_diastolic}` : 
                    'Kayıt yok'}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.noDataText}>Henüz sağlık verisi kaydedilmemiş</Text>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Hızlı Erişim</Text>
          
          <View style={styles.actionGrid}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigateToScreen('health/records')}
            >
              <MaterialIcons name="monitor-heart" size={32} color="#4CAF50" />
              <Text style={styles.actionText}>Sağlık Verileri</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigateToScreen('appointments')}
            >
              <MaterialIcons name="calendar-today" size={32} color="#2196F3" />
              <Text style={styles.actionText}>Randevular</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigateToScreen('medicines')}
            >
              <MaterialIcons name="medication" size={32} color="#FF9800" />
              <Text style={styles.actionText}>İlaçlar</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigateToScreen('ai-chat')}
            >
              <MaterialIcons name="psychology" size={32} color="#9C27B0" />
              <Text style={styles.actionText}>AI Asistan</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigateToScreen('nutrition')}
            >
              <MaterialIcons name="restaurant" size={32} color="#4CAF50" />
              <Text style={styles.actionText}>Beslenme</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigateToScreen('exercise')}
            >
              <MaterialIcons name="fitness-center" size={32} color="#FF5722" />
              <Text style={styles.actionText}>Egzersiz</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    paddingTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  appSubtitle: {
    fontSize: 14,
    color: '#E8F5E8',
    marginTop: 4,
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  roleText: {
    fontSize: 14,
    color: '#E8F5E8',
    marginTop: 2,
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  welcomeSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  authButtons: {
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  secondaryButtonText: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  featuresSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featuresTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureText: {
    marginLeft: 16,
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  healthData: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  healthItem: {
    alignItems: 'center',
  },
  healthValue: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  quickActions: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#fff',
    width: '48%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
});