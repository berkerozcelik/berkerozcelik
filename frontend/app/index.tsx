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
import { theme } from './theme';

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
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />
        
        <View style={styles.header}>
          <MaterialIcons name="health-and-safety" size={60} color={theme.colors.textInverse} />
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
              <MaterialIcons name="login" size={20} color={theme.colors.textInverse} />
              <Text style={styles.primaryButtonText}>Giriş Yap</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => navigateToScreen('auth/register')}
            >
              <MaterialIcons name="person-add" size={20} color={theme.colors.primary} />
              <Text style={styles.secondaryButtonText}>Kayıt Ol</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>Özellikler</Text>
            
            <View style={styles.featureItem}>
              <MaterialIcons name="monitor-heart" size={28} color={theme.colors.primary} />
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Sağlık Takibi</Text>
                <Text style={styles.featureDescription}>
                  Kilo, ateş, tansiyon gibi vital verilerinizi kaydedin
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <MaterialIcons name="calendar-today" size={28} color={theme.colors.secondary} />
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>Randevu Yönetimi</Text>
                <Text style={styles.featureDescription}>
                  Doktor randevularınızı kolayca planlayın ve takip edin
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <MaterialIcons name="medication" size={28} color={theme.colors.accent} />
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>İlaç Takibi</Text>
                <Text style={styles.featureDescription}>
                  İlaç saatlerinizi unutmayın, hatırlatma alın
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <MaterialIcons name="psychology" size={28} color={theme.colors.info} />
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
      <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Merhaba, {user.name}</Text>
          <Text style={styles.roleText}>
            {user.role === 'hasta' ? '👤 Hasta' : 
             user.role === 'doktor' ? '⚕️ Doktor' : '👨‍⚕️ Bakıcı'}
          </Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <MaterialIcons name="logout" size={24} color={theme.colors.textInverse} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Health Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Son Sağlık Verileri</Text>
          {latestHealth ? (
            <View style={styles.healthData}>
              <View style={styles.healthItem}>
                <MaterialIcons name="monitor-weight" size={20} color={theme.colors.primary} />
                <Text style={styles.healthValue}>
                  {latestHealth.weight ? `${latestHealth.weight} kg` : 'Kayıt yok'}
                </Text>
              </View>
              <View style={styles.healthItem}>
                <MaterialIcons name="thermostat" size={20} color={theme.colors.warning} />
                <Text style={styles.healthValue}>
                  {latestHealth.temperature ? `${latestHealth.temperature}°C` : 'Kayıt yok'}
                </Text>
              </View>
              <View style={styles.healthItem}>
                <MaterialIcons name="favorite" size={20} color={theme.colors.error} />
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
              <MaterialIcons name="monitor-heart" size={28} color={theme.colors.primary} />
              <Text style={styles.actionText}>Sağlık Verileri</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigateToScreen('appointments')}
            >
              <MaterialIcons name="calendar-today" size={28} color={theme.colors.info} />
              <Text style={styles.actionText}>Randevular</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigateToScreen('medicines')}
            >
              <MaterialIcons name="medication" size={28} color={theme.colors.warning} />
              <Text style={styles.actionText}>İlaçlar</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigateToScreen('ai-chat')}
            >
              <MaterialIcons name="psychology" size={28} color={theme.colors.secondary} />
              <Text style={styles.actionText}>AI Asistan</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigateToScreen('nutrition')}
            >
              <MaterialIcons name="restaurant" size={28} color={theme.colors.accent} />
              <Text style={styles.actionText}>Beslenme</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigateToScreen('exercise')}
            >
              <MaterialIcons name="fitness-center" size={28} color={theme.colors.success} />
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
    backgroundColor: theme.colors.backgroundSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
  },
  loadingText: {
    marginTop: theme.spacing.base,
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  header: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.xl,
    paddingTop: theme.spacing['4xl'],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appTitle: {
    ...theme.typography.h1,
    color: theme.colors.textInverse,
    marginTop: theme.spacing.sm,
  },
  appSubtitle: {
    ...theme.typography.bodySecondary,
    color: theme.colors.textInverse,
    opacity: 0.9,
    marginTop: theme.spacing.xs,
  },
  greeting: {
    ...theme.typography.h3,
    color: theme.colors.textInverse,
  },
  roleText: {
    ...theme.typography.bodySecondary,
    color: theme.colors.textInverse,
    opacity: 0.9,
    marginTop: theme.spacing.xs,
  },
  logoutButton: {
    padding: theme.spacing.sm,
  },
  content: {
    flex: 1,
    padding: theme.spacing.base,
  },
  welcomeSection: {
    backgroundColor: theme.colors.cardBackground,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.xl,
    ...theme.shadows.base,
  },
  welcomeTitle: {
    ...theme.typography.h2,
    marginBottom: theme.spacing.md,
  },
  welcomeText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    lineHeight: 24,
  },
  authButtons: {
    marginBottom: theme.spacing['2xl'],
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.base,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.base,
  },
  primaryButtonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
    marginLeft: theme.spacing.sm,
  },
  secondaryButton: {
    backgroundColor: theme.colors.cardBackground,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.base,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    ...theme.shadows.sm,
  },
  secondaryButtonText: {
    ...theme.typography.button,
    color: theme.colors.primary,
    marginLeft: theme.spacing.sm,
  },
  featuresSection: {
    backgroundColor: theme.colors.cardBackground,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.base,
  },
  featuresTitle: {
    ...theme.typography.h3,
    marginBottom: theme.spacing.base,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.base,
  },
  featureText: {
    marginLeft: theme.spacing.base,
    flex: 1,
  },
  featureTitle: {
    ...theme.typography.h4,
  },
  featureDescription: {
    ...theme.typography.bodySecondary,
    marginTop: theme.spacing.xs,
  },
  summaryCard: {
    backgroundColor: theme.colors.cardBackground,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.base,
  },
  cardTitle: {
    ...theme.typography.h4,
    marginBottom: theme.spacing.md,
  },
  healthData: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  healthItem: {
    alignItems: 'center',
  },
  healthValue: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  noDataText: {
    ...theme.typography.bodySecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  quickActions: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    ...theme.typography.h3,
    marginBottom: theme.spacing.base,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: theme.colors.cardBackground,
    width: '48%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.base,
  },
  actionText: {
    ...theme.typography.caption,
    fontWeight: theme.typography.fontWeight.medium,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
});