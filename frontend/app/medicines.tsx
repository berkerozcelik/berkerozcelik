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
import axios from 'axios';
import Constants from 'expo-constants';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from './theme';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

interface Medicine {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  time: string;
  taken: boolean;
  interaction_warning?: boolean;
}

export default function Medicines() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMedicine, setNewMedicine] = useState({
    name: '',
    dosage: '',
    frequency: 'Günde 1 kez',
    time: ''
  });

  // Günlük ilaç listesi - screenshot'tan
  const dailyMedicines = [
    {
      id: '1',
      name: 'Metformin 500mg',
      time: '09:00',
      taken: false,
      interaction_warning: false
    },
    {
      id: '2',
      name: 'Ondansetron 8mg',
      time: '14:00',
      taken: false,
      interaction_warning: false
    },
    {
      id: '3',
      name: 'Etkileşim Uyarısı',
      time: '',
      taken: false,
      interaction_warning: true
    },
    {
      id: '4',
      name: 'Tramadol 50mg',
      time: '19:00',
      taken: true,
      interaction_warning: false
    },
    {
      id: '5',
      name: 'Letrozol 2,5mg',
      time: '22:00',
      taken: false,
      interaction_warning: false
    }
  ];

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      const response = await axios.get(`${BACKEND_URL}/api/medicines`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMedicines(response.data);
    } catch (error) {
      console.error('Medicines fetch error:', error);
      Alert.alert('Hata', 'İlaçlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedicine = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return;

      if (!newMedicine.name || !newMedicine.dosage) {
        Alert.alert('Hata', 'İlaç adı ve dozaj gereklidir');
        return;
      }

      const medicineData = {
        name: newMedicine.name,
        dosage: newMedicine.dosage,
        frequency: newMedicine.frequency,
        time: newMedicine.time,
        instructions: `${newMedicine.frequency} ${newMedicine.time ? newMedicine.time + ' saatinde' : ''} alınacak`
      };

      await axios.post(`${BACKEND_URL}/api/medicines`, medicineData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowAddModal(false);
      setNewMedicine({
        name: '',
        dosage: '',
        frequency: 'Günde 1 kez',
        time: ''
      });
      
      Alert.alert('Başarılı', 'İlaç başarıyla eklendi');
      fetchMedicines();
    } catch (error) {
      console.error('Add medicine error:', error);
      Alert.alert('Hata', 'İlaç eklenirken bir hata oluştu');
    }
  };

  const toggleMedicineTaken = (medicineId: string) => {
    // Toggle taken status for daily medicines
    Alert.alert(
      'İlaç Alındı',
      'İlacınızı aldığınızı onaylıyor musunuz?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Evet', onPress: () => console.log('Medicine taken:', medicineId) }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>İlaçlar yükleniyor...</Text>
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
        <Text style={styles.headerTitle}>İlaçlarım</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <MaterialIcons name="add" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Today's Medicines */}
        <View style={styles.todaySection}>
          <Text style={styles.sectionTitle}>Bugün</Text>
          
          {dailyMedicines.map((medicine) => (
            <View key={medicine.id} style={[
              styles.medicineCard,
              medicine.interaction_warning && styles.warningCard
            ]}>
              {medicine.interaction_warning ? (
                <View style={styles.warningContent}>
                  <MaterialIcons name="warning" size={20} color={theme.colors.warning} />
                  <Text style={styles.warningText}>Etkileşim Uyarısı</Text>
                  <TouchableOpacity style={styles.checkboxEmpty}>
                    <MaterialIcons name="check-box-outline-blank" size={20} color={theme.colors.strongTeal} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.medicineContent}>
                  <View style={styles.medicineInfo}>
                    <Text style={styles.medicineName}>{medicine.name}</Text>
                    {medicine.time && (
                      <Text style={styles.medicineTime}>{medicine.time}</Text>
                    )}
                  </View>
                  <TouchableOpacity 
                    style={medicine.taken ? styles.checkboxChecked : styles.checkboxEmpty}
                    onPress={() => toggleMedicineTaken(medicine.id)}
                  >
                    <MaterialIcons 
                      name={medicine.taken ? "check-box" : "check-box-outline-blank"} 
                      size={20} 
                      color={medicine.taken ? theme.colors.strongTeal : theme.colors.textLight} 
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Drug Interactions */}
        <View style={styles.interactionsSection}>
          <Text style={styles.sectionTitle}>İlaç Etkileşimleri</Text>
          <Text style={styles.interactionDescription}>
            Bazı ilaçlar arasında potansiyel etkileşimler olabilir.
          </Text>
          
          <TouchableOpacity style={styles.addMedicineButton} onPress={() => setShowAddModal(true)}>
            <Text style={styles.addMedicineText}>İlaç Ekle</Text>
          </TouchableOpacity>
        </View>

        {/* Medicine List */}
        {medicines.length > 0 && (
          <View style={styles.medicinesList}>
            <Text style={styles.sectionTitle}>Tüm İlaçlarım</Text>
            {medicines.map((medicine) => (
              <View key={medicine.id} style={styles.medicineListCard}>
                <View style={styles.medicineHeader}>
                  <Text style={styles.medicineListName}>{medicine.name}</Text>
                  <Text style={styles.medicineListDosage}>{medicine.dosage}</Text>
                </View>
                <Text style={styles.medicineListFrequency}>{medicine.frequency}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add Medicine Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.modalCancel}>İptal</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Yeni İlaç Ekle</Text>
            <TouchableOpacity onPress={handleAddMedicine}>
              <Text style={styles.modalSave}>Kaydet</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>İlaç Adı</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Örn: Paracetamol"
                value={newMedicine.name}
                onChangeText={(text) => setNewMedicine({...newMedicine, name: text})}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Dozaj</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Örn: 500mg"
                value={newMedicine.dosage}
                onChangeText={(text) => setNewMedicine({...newMedicine, dosage: text})}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Kullanım Sıklığı</Text>
              <View style={styles.frequencyButtons}>
                {['Günde 1 kez', 'Günde 2 kez', 'Günde 3 kez', 'Gerektiğinde'].map((freq) => (
                  <TouchableOpacity
                    key={freq}
                    style={[
                      styles.frequencyButton,
                      newMedicine.frequency === freq && styles.selectedFrequency
                    ]}
                    onPress={() => setNewMedicine({...newMedicine, frequency: freq})}
                  >
                    <Text style={[
                      styles.frequencyText,
                      newMedicine.frequency === freq && styles.selectedFrequencyText
                    ]}>
                      {freq}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Saat (Opsiyonel)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Örn: 08:00"
                value={newMedicine.time}
                onChangeText={(text) => setNewMedicine({...newMedicine, time: text})}
              />
            </View>
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

        <TouchableOpacity style={[styles.navItem, styles.activeNavItem]}>
          <MaterialIcons name="medication" size={24} color={theme.colors.strongTeal} />
          <Text style={[styles.navText, styles.activeNavText]}>İlaçlar</Text>
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

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/profile')}
        >
          <MaterialIcons name="person" size={24} color={theme.colors.textLight} />
          <Text style={styles.navText}>Profil</Text>
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
    marginTop: theme.spacing.base,
    ...theme.typography.body,
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
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
  },

  // Today Section
  todaySection: {
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
  medicineCard: {
    backgroundColor: theme.colors.lightBlue,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  warningCard: {
    backgroundColor: '#FFF4E6',
    borderWidth: 1,
    borderColor: theme.colors.warning,
  },
  medicineContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  medicineInfo: {
    flex: 1,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  medicineTime: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  warningContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  warningText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.warning,
    marginLeft: 8,
    flex: 1,
  },
  checkboxEmpty: {
    padding: 4,
  },
  checkboxChecked: {
    padding: 4,
  },

  // Interactions Section
  interactionsSection: {
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
  interactionDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  addMedicineButton: {
    backgroundColor: theme.colors.strongTeal,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
  },
  addMedicineText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Medicine List
  medicinesList: {
    marginHorizontal: 16,
    marginBottom: 100,
  },
  medicineListCard: {
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
  medicineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  medicineListName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  medicineListDosage: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  medicineListFrequency: {
    fontSize: 14,
    color: theme.colors.textSecondary,
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
  frequencyButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  frequencyButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  selectedFrequency: {
    backgroundColor: theme.colors.strongTeal,
    borderColor: theme.colors.strongTeal,
  },
  frequencyText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  selectedFrequencyText: {
    color: '#FFFFFF',
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