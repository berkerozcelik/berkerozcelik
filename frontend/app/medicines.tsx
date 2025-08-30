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
  TextInput,
  Modal
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
  times: string[];
  start_date: string;
  end_date?: string;
  instructions?: string;
  is_active: boolean;
  created_at: string;
}

export default function Medicines() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMedicine, setNewMedicine] = useState({
    name: '',
    dosage: '',
    frequency: 'daily',
    times: ['08:00'],
    start_date: '',
    end_date: '',
    instructions: ''
  });

  const frequencies = [
    { label: 'Günde 1 kez', value: 'daily', times: ['08:00'] },
    { label: 'Günde 2 kez', value: 'twice_daily', times: ['08:00', '20:00'] },
    { label: 'Günde 3 kez', value: 'three_times_daily', times: ['08:00', '14:00', '20:00'] },
    { label: 'Haftada 1 kez', value: 'weekly', times: ['08:00'] },
    { label: 'Gerektiğinde', value: 'as_needed', times: [] }
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
    if (!newMedicine.name || !newMedicine.dosage || !newMedicine.start_date) {
      Alert.alert('Hata', 'Lütfen zorunlu alanları doldurun');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return;

      const medicineData = {
        name: newMedicine.name,
        dosage: newMedicine.dosage,
        frequency: newMedicine.frequency,
        times: newMedicine.times,
        start_date: new Date(newMedicine.start_date).toISOString(),
        end_date: newMedicine.end_date ? new Date(newMedicine.end_date).toISOString() : null,
        instructions: newMedicine.instructions
      };

      await axios.post(`${BACKEND_URL}/api/medicines`, medicineData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowAddModal(false);
      setNewMedicine({
        name: '',
        dosage: '',
        frequency: 'daily',
        times: ['08:00'],
        start_date: '',
        end_date: '',
        instructions: ''
      });
      
      Alert.alert('Başarılı', 'İlaç kaydedildi');
      fetchMedicines();
    } catch (error) {
      Alert.alert('Hata', 'İlaç kaydedilirken bir hata oluştu');
    }
  };

  const updateFrequency = (frequency: string) => {
    const freq = frequencies.find(f => f.value === frequency);
    setNewMedicine({
      ...newMedicine,
      frequency,
      times: freq ? freq.times : ['08:00']
    });
  };

  const getTodaysDoses = (medicine: Medicine) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    return medicine.times.map(time => {
      const [hours, minutes] = time.split(':').map(Number);
      const medicineTime = hours * 60 + minutes;
      
      return {
        time,
        taken: medicineTime < currentTime, // Simulate taken status
        upcoming: medicineTime > currentTime && medicineTime - currentTime < 120 // Next 2 hours
      };
    });
  };

  const getUpcomingMedicines = () => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    return medicines
      .filter(med => med.is_active)
      .flatMap(medicine => 
        medicine.times
          .map(time => {
            const [hours, minutes] = time.split(':').map(Number);
            const medicineTime = hours * 60 + minutes;
            
            if (medicineTime > currentTime && medicineTime - currentTime < 240) { // Next 4 hours
              return {
                medicine,
                time,
                minutesUntil: medicineTime - currentTime
              };
            }
            return null;
          })
          .filter(item => item !== null)
      )
      .sort((a, b) => a!.minutesUntil - b!.minutesUntil)
      .slice(0, 3);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.medicine} />
        <Text style={styles.loadingText}>İlaçlar yükleniyor...</Text>
      </View>
    );
  }

  const upcomingMedicines = getUpcomingMedicines();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={theme.colors.medicine} barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.textInverse} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>İlaç Takibi</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <MaterialIcons name="add" size={24} color={theme.colors.textInverse} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Today's Reminder */}
        {upcomingMedicines.length > 0 && (
          <View style={styles.reminderCard}>
            <View style={styles.reminderHeader}>
              <MaterialIcons name="notifications-active" size={24} color={theme.colors.warning} />
              <Text style={styles.reminderTitle}>Yaklaşan İlaçlar</Text>
            </View>
            {upcomingMedicines.map((item, index) => (
              <View key={index} style={styles.reminderItem}>
                <View style={styles.reminderInfo}>
                  <Text style={styles.reminderMedicine}>{item!.medicine.name}</Text>
                  <Text style={styles.reminderDosage}>{item!.medicine.dosage}</Text>
                </View>
                <View style={styles.reminderTime}>
                  <Text style={styles.reminderTimeText}>{item!.time}</Text>
                  <Text style={styles.reminderMinutes}>
                    {item!.minutesUntil < 60 
                      ? `${item!.minutesUntil} dk kaldı`
                      : `${Math.floor(item!.minutesUntil / 60)} saat kaldı`
                    }
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Medicine List */}
        <Text style={styles.sectionTitle}>Aktif İlaçlarım</Text>
        
        {medicines.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="medication" size={64} color={theme.colors.textLight} />
            <Text style={styles.emptyTitle}>Henüz ilaç kaydınız yok</Text>
            <Text style={styles.emptyDescription}>
              İlk ilacınızı eklemek için yukarıdaki + butonunu kullanın
            </Text>
          </View>
        ) : (
          medicines
            .filter(medicine => medicine.is_active)
            .map((medicine) => {
              const todaysDoses = getTodaysDoses(medicine);
              
              return (
                <View key={medicine.id} style={styles.medicineCard}>
                  <View style={styles.medicineHeader}>
                    <View style={styles.medicineInfo}>
                      <Text style={styles.medicineName}>{medicine.name}</Text>
                      <Text style={styles.medicineDosage}>{medicine.dosage}</Text>
                      <Text style={styles.medicineFrequency}>
                        {frequencies.find(f => f.value === medicine.frequency)?.label || medicine.frequency}
                      </Text>
                    </View>
                    <TouchableOpacity style={styles.medicineMoreButton}>
                      <MaterialIcons name="more-vert" size={20} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  
                  {/* Today's Schedule */}
                  <View style={styles.scheduleContainer}>
                    <Text style={styles.scheduleTitle}>Bugünkü Program:</Text>
                    <View style={styles.scheduleList}>
                      {todaysDoses.map((dose, index) => (
                        <View key={index} style={styles.doseItem}>
                          <View style={[
                            styles.doseIndicator,
                            dose.taken && styles.doseIndicatorTaken,
                            dose.upcoming && styles.doseIndicatorUpcoming
                          ]} />
                          <Text style={[
                            styles.doseTime,
                            dose.taken && styles.doseTimeTaken
                          ]}>
                            {dose.time}
                          </Text>
                          <TouchableOpacity
                            style={[
                              styles.doseButton,
                              dose.taken && styles.doseButtonTaken
                            ]}
                            onPress={() => {
                              // Toggle taken status
                              Alert.alert(
                                'İlaç Durumu',
                                dose.taken ? 'İlacı almadınız olarak işaretlensin mi?' : 'İlacı aldınız olarak işaretlensin mi?',
                                [
                                  { text: 'İptal', style: 'cancel' },
                                  { text: 'Evet', onPress: () => {
                                    // Here you would update the medicine status
                                    Alert.alert('Bilgi', dose.taken ? 'İlaç alınmadı olarak işaretlendi' : 'İlaç alındı olarak işaretlendi');
                                  }}
                                ]
                              );
                            }}
                          >
                            <MaterialIcons 
                              name={dose.taken ? "check-circle" : "radio-button-unchecked"} 
                              size={20} 
                              color={dose.taken ? theme.colors.success : theme.colors.textSecondary}
                            />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </View>
                  
                  {medicine.instructions && (
                    <View style={styles.instructionsContainer}>
                      <Text style={styles.instructionsTitle}>Kullanım Talimatı:</Text>
                      <Text style={styles.instructionsText}>{medicine.instructions}</Text>
                    </View>
                  )}
                </View>
              );
            })
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
            <Text style={styles.modalTitle}>Yeni İlaç</Text>
            <TouchableOpacity onPress={handleAddMedicine}>
              <Text style={styles.modalSave}>Kaydet</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>İlaç Adı *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Örn: Parol 500mg"
                value={newMedicine.name}
                onChangeText={(text) => setNewMedicine({...newMedicine, name: text})}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Doz *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Örn: 1 tablet, 5ml"
                value={newMedicine.dosage}
                onChangeText={(text) => setNewMedicine({...newMedicine, dosage: text})}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Kullanım Sıklığı *</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.frequencyScroll}
              >
                {frequencies.map((freq) => (
                  <TouchableOpacity
                    key={freq.value}
                    style={[
                      styles.frequencyChip,
                      newMedicine.frequency === freq.value && styles.frequencyChipSelected
                    ]}
                    onPress={() => updateFrequency(freq.value)}
                  >
                    <Text
                      style={[
                        styles.frequencyChipText,
                        newMedicine.frequency === freq.value && styles.frequencyChipTextSelected
                      ]}
                    >
                      {freq.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Başlangıç Tarihi *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Örn: 2024-09-01"
                value={newMedicine.start_date}
                onChangeText={(text) => setNewMedicine({...newMedicine, start_date: text})}
              />
              <Text style={styles.inputHint}>Format: YYYY-MM-DD</Text>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bitiş Tarihi (Opsiyonel)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Örn: 2024-09-30"
                value={newMedicine.end_date}
                onChangeText={(text) => setNewMedicine({...newMedicine, end_date: text})}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Kullanım Talimatı</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Örn: Yemekten sonra alınacak"
                value={newMedicine.instructions}
                onChangeText={(text) => setNewMedicine({...newMedicine, instructions: text})}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    backgroundColor: theme.colors.medicine,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.md,
    paddingTop: theme.spacing['4xl'],
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  headerTitle: {
    ...theme.typography.h2,
    color: theme.colors.textInverse,
  },
  addButton: {
    padding: theme.spacing.sm,
  },
  content: {
    flex: 1,
    padding: theme.spacing.base,
  },
  reminderCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning,
    ...theme.shadows.sm,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  reminderTitle: {
    ...theme.typography.h4,
    marginLeft: theme.spacing.sm,
  },
  reminderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderMedicine: {
    ...theme.typography.body,
    fontWeight: theme.typography.fontWeight.medium,
  },
  reminderDosage: {
    ...theme.typography.bodySecondary,
    marginTop: theme.spacing.xs,
  },
  reminderTime: {
    alignItems: 'flex-end',
  },
  reminderTimeText: {
    ...theme.typography.body,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.warning,
  },
  reminderMinutes: {
    ...theme.typography.caption,
    marginTop: theme.spacing.xs,
  },
  sectionTitle: {
    ...theme.typography.h3,
    marginBottom: theme.spacing.base,
    paddingHorizontal: theme.spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing['5xl'],
  },
  emptyTitle: {
    ...theme.typography.h3,
    marginTop: theme.spacing.base,
    textAlign: 'center',
  },
  emptyDescription: {
    ...theme.typography.bodySecondary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  medicineCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.base,
    ...theme.shadows.sm,
  },
  medicineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  medicineInfo: {
    flex: 1,
  },
  medicineName: {
    ...theme.typography.h4,
    marginBottom: theme.spacing.xs,
  },
  medicineDosage: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  medicineFrequency: {
    ...theme.typography.bodySecondary,
  },
  medicineMoreButton: {
    padding: theme.spacing.xs,
  },
  scheduleContainer: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.base,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  scheduleTitle: {
    ...theme.typography.body,
    fontWeight: theme.typography.fontWeight.medium,
    marginBottom: theme.spacing.sm,
  },
  scheduleList: {
    gap: theme.spacing.sm,
  },
  doseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  doseIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.textLight,
    marginRight: theme.spacing.md,
  },
  doseIndicatorTaken: {
    backgroundColor: theme.colors.success,
  },
  doseIndicatorUpcoming: {
    backgroundColor: theme.colors.warning,
  },
  doseTime: {
    ...theme.typography.body,
    flex: 1,
  },
  doseTimeTaken: {
    textDecorationLine: 'line-through',
    color: theme.colors.textSecondary,
  },
  doseButton: {
    padding: theme.spacing.xs,
  },
  doseButtonTaken: {
    // Additional styling for taken doses
  },
  instructionsContainer: {
    backgroundColor: theme.colors.backgroundAccent,
    borderRadius: theme.borderRadius.base,
    padding: theme.spacing.md,
  },
  instructionsTitle: {
    ...theme.typography.body,
    fontWeight: theme.typography.fontWeight.medium,
    marginBottom: theme.spacing.xs,
  },
  instructionsText: {
    ...theme.typography.bodySecondary,
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
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalCancel: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  modalTitle: {
    ...theme.typography.h3,
  },
  modalSave: {
    ...theme.typography.body,
    color: theme.colors.medicine,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  modalContent: {
    flex: 1,
    padding: theme.spacing.base,
  },
  inputGroup: {
    marginBottom: theme.spacing.base,
  },
  inputLabel: {
    ...theme.typography.body,
    fontWeight: theme.typography.fontWeight.medium,
    marginBottom: theme.spacing.sm,
  },
  textInput: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.typography.body,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputHint: {
    ...theme.typography.caption,
    marginTop: theme.spacing.xs,
    color: theme.colors.textSecondary,
  },
  frequencyScroll: {
    marginTop: theme.spacing.sm,
  },
  frequencyChip: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.base,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  frequencyChipSelected: {
    backgroundColor: theme.colors.medicine,
    borderColor: theme.colors.medicine,
  },
  frequencyChipText: {
    ...theme.typography.bodySecondary,
  },
  frequencyChipTextSelected: {
    color: theme.colors.textInverse,
    fontWeight: theme.typography.fontWeight.medium,
  },
});