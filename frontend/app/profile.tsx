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
  Modal,
  TextInput
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from './theme';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface TestResult {
  id: string;
  name: string;
  date: string;
  result: string;
  type: string;
}

interface Device {
  id: string;
  name: string;
  type: string;
  status: 'connected' | 'disconnected' | 'pending';
  lastSync?: string;
}

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([
    {
      id: '1',
      name: 'Tam Kan Sayımı',
      date: '2024-01-20',
      result: 'Normal',
      type: 'Kan Tahlili'
    },
    {
      id: '2',
      name: 'Karaciğer Fonksiyonları',
      date: '2024-01-18',
      result: 'Yüksek',
      type: 'Biyokimya'
    }
  ]);
  
  const [devices, setDevices] = useState<Device[]>([
    {
      id: '1',
      name: 'Akıllı Terazi',
      type: 'weight',
      status: 'connected',
      lastSync: '2 dakika önce'
    },
    {
      id: '2',
      name: 'Nabız Sensörü',
      type: 'heart_rate',
      status: 'connected',
      lastSync: '5 dakika önce'
    },
    {
      id: '3',
      name: 'Adım Sayar',  
      type: 'steps',
      status: 'pending',
      lastSync: undefined
    },
    {
      id: '4',
      name: 'Kan Şekeri Ölçer',
      type: 'glucose',
      status: 'disconnected',
      lastSync: '2 gün önce'
    }
  ]);

  const [newTest, setNewTest] = useState({
    name: '',
    result: '',
    type: ''
  });

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('User check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Çıkış Yap',
      'Hesabınızdan çıkış yapmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Çıkış Yap', 
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove(['auth_token', 'user_data']);
              router.replace('/');
            } catch (error) {
              Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu');
            }
          }
        }
      ]
    );
  };

  const handleAddTest = () => {
    if (!newTest.name || !newTest.result || !newTest.type) {
      Alert.alert('Hata', 'Tüm alanları doldurunuz');
      return;
    }

    const test: TestResult = {
      id: Date.now().toString(),
      name: newTest.name,
      date: new Date().toISOString().split('T')[0],
      result: newTest.result,
      type: newTest.type
    };

    setTestResults([test, ...testResults]);
    setNewTest({ name: '', result: '', type: '' });
    setShowTestModal(false);
    Alert.alert('Başarılı', 'Test sonucu eklendi');
  };

  const connectDevice = (deviceId: string) => {
    setDevices(devices.map(device => 
      device.id === deviceId 
        ? { ...device, status: 'connected', lastSync: 'Şimdi' }
        : device
    ));
    Alert.alert('Başarılı', 'Cihaz bağlandı');
  };

  const disconnectDevice = (deviceId: string) => {
    setDevices(devices.map(device => 
      device.id === deviceId 
        ? { ...device, status: 'disconnected', lastSync: 'Bağlantı kesildi' }
        : device
    ));
    Alert.alert('Bilgi', 'Cihaz bağlantısı kesildi');
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'weight': return 'monitor-weight';
      case 'heart_rate': return 'favorite';
      case 'steps': return 'directions-walk';
      case 'glucose': return 'bloodtype';
      default: return 'device-unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return theme.colors.success;
      case 'disconnected': return theme.colors.error;
      case 'pending': return theme.colors.warning;
      default: return theme.colors.textLight;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Bağlı';
      case 'disconnected': return 'Bağlantısız';
      case 'pending': return 'Bağlanıyor...';
      default: return 'Bilinmiyor';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Profil yükleniyor...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={theme.colors.backgroundLight} barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil</Text>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => Alert.alert('Ayarlar', 'Ayarlar sayfası yakında eklenecek')}
        >
          <MaterialIcons name="settings" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={40} color={theme.colors.strongTeal} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'Ümit'}</Text>
            <Text style={styles.userRole}>
              {user?.role === 'hasta' ? 'Hasta' : 
               user?.role === 'doktor' ? 'Doktor' : 
               user?.role === 'bakici' ? 'Bakıcı' : 'Hasta'}
            </Text>
            <Text style={styles.userEmail}>{user?.email || 'hasta@demo.com'}</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={20} color={theme.colors.error} />
          </TouchableOpacity>
        </View>

        {/* Test Results Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Test Sonuçlarım</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowTestModal(true)}
            >
              <MaterialIcons name="add" size={24} color={theme.colors.strongTeal} />
            </TouchableOpacity>
          </View>

          {testResults.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="assignment" size={48} color={theme.colors.textLight} />
              <Text style={styles.emptyTitle}>Henüz test sonucu yok</Text>
              <Text style={styles.emptyDescription}>
                Test sonuçlarınızı buraya yükleyebilirsiniz
              </Text>
            </View>
          ) : (
            testResults.map((test) => (
              <View key={test.id} style={styles.testCard}>
                <View style={styles.testHeader}>
                  <View>
                    <Text style={styles.testName}>{test.name}</Text>
                    <Text style={styles.testType}>{test.type}</Text>
                  </View>
                  <View style={styles.testResult}>
                    <Text style={styles.testDate}>{test.date}</Text>
                    <Text style={[
                      styles.testResultText,
                      { color: test.result === 'Normal' ? theme.colors.success : theme.colors.warning }
                    ]}>
                      {test.result}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Device Integration Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Cihaz Entegrasyonları</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowDeviceModal(true)}
            >
              <MaterialIcons name="add" size={24} color={theme.colors.strongTeal} />
            </TouchableOpacity>
          </View>

          {devices.map((device) => (
            <View key={device.id} style={styles.deviceCard}>
              <View style={styles.deviceInfo}>
                <MaterialIcons 
                  name={getDeviceIcon(device.type)} 
                  size={24} 
                  color={getStatusColor(device.status)} 
                />
                <View style={styles.deviceDetails}>
                  <Text style={styles.deviceName}>{device.name}</Text>
                  <View style={styles.deviceStatus}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(device.status) }]} />
                    <Text style={styles.statusText}>{getStatusText(device.status)}</Text>
                  </View>
                  {device.lastSync && (
                    <Text style={styles.lastSync}>Son senkronizasyon: {device.lastSync}</Text>
                  )}
                </View>
              </View>
              <View style={styles.deviceActions}>
                {device.status === 'connected' ? (
                  <TouchableOpacity 
                    style={[styles.deviceButton, styles.disconnectButton]}
                    onPress={() => disconnectDevice(device.id)}
                  >
                    <Text style={styles.disconnectText}>Bağlantıyı Kes</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={[styles.deviceButton, styles.connectButton]}
                    onPress={() => connectDevice(device.id)}
                  >
                    <Text style={styles.connectText}>Bağlan</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hesap Ayarları</Text>
          
          <TouchableOpacity style={styles.settingsItem}>
            <MaterialIcons name="notifications" size={24} color={theme.colors.textSecondary} />
            <Text style={styles.settingsText}>Bildirimler</Text>
            <MaterialIcons name="chevron-right" size={24} color={theme.colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsItem}>
            <MaterialIcons name="security" size={24} color={theme.colors.textSecondary} />
            <Text style={styles.settingsText}>Gizlilik ve Güvenlik</Text>
            <MaterialIcons name="chevron-right" size={24} color={theme.colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsItem}>
            <MaterialIcons name="help" size={24} color={theme.colors.textSecondary} />
            <Text style={styles.settingsText}>Yardım ve Destek</Text>
            <MaterialIcons name="chevron-right" size={24} color={theme.colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsItem} onPress={handleLogout}>
            <MaterialIcons name="logout" size={24} color={theme.colors.error} />
            <Text style={[styles.settingsText, { color: theme.colors.error }]}>Çıkış Yap</Text>
            <MaterialIcons name="chevron-right" size={24} color={theme.colors.textLight} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Add Test Modal */}
      <Modal
        visible={showTestModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowTestModal(false)}>
              <Text style={styles.modalCancel}>İptal</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Test Sonucu Ekle</Text>
            <TouchableOpacity onPress={handleAddTest}>
              <Text style={styles.modalSave}>Kaydet</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Test Adı</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Örn: Tam Kan Sayımı"
                value={newTest.name}
                onChangeText={(text) => setNewTest({...newTest, name: text})}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Test Türü</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Örn: Kan Tahlili"
                value={newTest.type}
                onChangeText={(text) => setNewTest({...newTest, type: text})}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Sonuç</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Örn: Normal"
                value={newTest.result}
                onChangeText={(text) => setNewTest({...newTest, result: text})}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Device Modal */}
      <Modal
        visible={showDeviceModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDeviceModal(false)}>
              <Text style={styles.modalCancel}>İptal</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Yeni Cihaz Ekle</Text>
            <TouchableOpacity onPress={() => setShowDeviceModal(false)}>
              <Text style={styles.modalSave}>Kapat</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.deviceModalText}>
              Yakında yeni cihazlar ekleyebileceksiniz. Şu anda mevcut cihazları yönetebilirsiniz.
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/')}
        >
          <MaterialIcons name="home" size={24} color={theme.colors.textLight} />
          <Text style={styles.navText}>Ana Sayfa</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/medicines')}
        >
          <MaterialIcons name="medication" size={24} color={theme.colors.textLight} />
          <Text style={styles.navText}>İlaçlar</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/appointments')}
        >
          <MaterialIcons name="event" size={24} color={theme.colors.textLight} />
          <Text style={styles.navText}>Planım</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/health/records')}
        >
          <MaterialIcons name="favorite" size={24} color={theme.colors.textLight} />
          <Text style={styles.navText}>Sağlık</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/appointments')}
        >
          <MaterialIcons name="event" size={24} color={theme.colors.textLight} />
          <Text style={styles.navText}>Randevu</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.navItem, styles.activeNavItem]}>
          <MaterialIcons name="person" size={24} color={theme.colors.strongTeal} />
          <Text style={[styles.navText, styles.activeNavText]}>Profil</Text>
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
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 50,
    backgroundColor: theme.colors.backgroundLight,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.strongTeal,
  },
  settingsButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
  },

  // User Card
  userCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.lightBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: theme.colors.strongTeal,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  logoutButton: {
    padding: 8,
  },

  // Sections
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  addButton: {
    padding: 8,
  },

  // Test Results
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 12,
  },
  emptyDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  testCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  testHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  testName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  testType: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  testResult: {
    alignItems: 'flex-end',
  },
  testDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  testResultText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Device Integration
  deviceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deviceDetails: {
    marginLeft: 12,
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  deviceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  lastSync: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  deviceActions: {
    marginLeft: 12,
  },
  deviceButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  connectButton: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  disconnectButton: {
    backgroundColor: 'transparent',
    borderColor: theme.colors.error,
  },
  connectText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  disconnectText: {
    color: theme.colors.error,
    fontSize: 12,
    fontWeight: '600',
  },

  // Settings
  settingsItem: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  settingsText: {
    fontSize: 16,
    color: theme.colors.text,
    marginLeft: 16,
    flex: 1,
  },

  // Modal Styles
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
  modalSave: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    fontSize: 16,
  },
  deviceModalText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 40,
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
    // Active state styling
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