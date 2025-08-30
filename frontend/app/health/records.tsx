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
  Modal,
  TextInput
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../theme';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;
const { width } = Dimensions.get('window');

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface HealthRecord {
  id: string;
  weight?: number;
  temperature?: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  heart_rate?: number;
  sleep_hours?: number;
  sleep_minutes?: number;
  steps?: number;
  symptoms?: string[];
  notes?: string;
  recorded_at: string;
}

export default function HealthRecords() {
  const [user, setUser] = useState<User | null>(null);
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRecord, setNewRecord] = useState({
    weight: '',
    temperature: '',
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    heart_rate: '',
    sleep_hours: '',
    sleep_minutes: '',
    steps: '',
    symptoms: '',
    notes: ''
  });

  useEffect(() => {
    checkUser();
    fetchHealthRecords();
  }, []);

  const checkUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('User check error:', error);
    }
  };

  const fetchHealthRecords = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      const response = await axios.get(`${BACKEND_URL}/api/health/records`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setRecords(response.data);
    } catch (error) {
      console.error('Health records fetch error:', error);
      Alert.alert('Hata', 'Sağlık verileri yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecord = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return;

      const recordData: any = {};
      
      if (newRecord.weight) recordData.weight = parseFloat(newRecord.weight);
      if (newRecord.temperature) recordData.temperature = parseFloat(newRecord.temperature);
      if (newRecord.blood_pressure_systolic) recordData.blood_pressure_systolic = parseInt(newRecord.blood_pressure_systolic);
      if (newRecord.blood_pressure_diastolic) recordData.blood_pressure_diastolic = parseInt(newRecord.blood_pressure_diastolic);
      if (newRecord.heart_rate) recordData.heart_rate = parseInt(newRecord.heart_rate);
      if (newRecord.sleep_hours) recordData.sleep_hours = parseInt(newRecord.sleep_hours);
      if (newRecord.sleep_minutes) recordData.sleep_minutes = parseInt(newRecord.sleep_minutes);
      if (newRecord.steps) recordData.steps = parseInt(newRecord.steps);
      if (newRecord.symptoms) recordData.symptoms = newRecord.symptoms.split(',').map(s => s.trim());
      if (newRecord.notes) recordData.notes = newRecord.notes;

      await axios.post(`${BACKEND_URL}/api/health/records`, recordData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setShowAddModal(false);
      setNewRecord({
        weight: '',
        temperature: '',
        blood_pressure_systolic: '',
        blood_pressure_diastolic: '',
        heart_rate: '',
        sleep_hours: '',
        sleep_minutes: '',
        steps: '',
        symptoms: '',
        notes: ''
      });
      
      Alert.alert('Başarılı', 'Sağlık veriniz kaydedildi');
      fetchHealthRecords();
    } catch (error) {
      Alert.alert('Hata', 'Sağlık verisi kaydedilirken bir hata oluştu');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderPatientView = () => (
    <>
      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <MaterialIcons name="monitor-weight" size={32} color={theme.colors.health} />
          <Text style={styles.summaryValue}>
            {records.length > 0 && records[0].weight ? `${records[0].weight} kg` : 'Kayıt yok'}
          </Text>
          <Text style={styles.summaryLabel}>Son Kilo</Text>
        </View>
        
        <View style={styles.summaryCard}>
          <MaterialIcons name="thermostat" size={32} color={theme.colors.warning} />
          <Text style={styles.summaryValue}>
            {records.length > 0 && records[0].temperature ? `${records[0].temperature}°C` : 'Kayıt yok'}
          </Text>
          <Text style={styles.summaryLabel}>Son Ateş</Text>
        </View>
        
        <View style={styles.summaryCard}>
          <MaterialIcons name="bedtime" size={32} color={theme.colors.info} />
          <Text style={styles.summaryValue}>
            {records.length > 0 && records[0].sleep_hours ? 
              `${records[0].sleep_hours}s ${records[0].sleep_minutes || 0}dk` : 
              'Kayıt yok'}
          </Text>
          <Text style={styles.summaryLabel}>Son Uyku</Text>
        </View>
      </View>

      {/* Records List */}
      <Text style={styles.sectionTitle}>Geçmiş Kayıtlar</Text>
      
      {records.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="health-and-safety" size={64} color={theme.colors.textLight} />
          <Text style={styles.emptyTitle}>Henüz sağlık verisi yok</Text>
          <Text style={styles.emptyDescription}>
            İlk verilerinizi eklemek için yukarıdaki ✓ butonunu kullanın
          </Text>
        </View>
      ) : (
        records.map((record) => (
          <View key={record.id} style={styles.recordCard}>
            <View style={styles.recordHeader}>
              <Text style={styles.recordDate}>{formatDate(record.recorded_at)}</Text>
              <MaterialIcons name="more-vert" size={20} color={theme.colors.textSecondary} />
            </View>
            
            <View style={styles.recordData}>
              {record.weight && (
                <View style={styles.dataItem}>
                  <MaterialIcons name="monitor-weight" size={18} color={theme.colors.health} />
                  <Text style={styles.dataLabel}>Kilo:</Text>
                  <Text style={styles.dataValue}>{record.weight} kg</Text>
                </View>
              )}
              
              {record.temperature && (
                <View style={styles.dataItem}>
                  <MaterialIcons name="thermostat" size={18} color={theme.colors.warning} />
                  <Text style={styles.dataLabel}>Ateş:</Text>
                  <Text style={styles.dataValue}>{record.temperature}°C</Text>
                </View>
              )}
              
              {record.blood_pressure_systolic && (
                <View style={styles.dataItem}>
                  <MaterialIcons name="favorite" size={18} color={theme.colors.error} />
                  <Text style={styles.dataLabel}>Tansiyon:</Text>
                  <Text style={styles.dataValue}>
                    {record.blood_pressure_systolic}/{record.blood_pressure_diastolic} mmHg
                  </Text>
                </View>
              )}
              
              {record.heart_rate && (
                <View style={styles.dataItem}>
                  <MaterialIcons name="favorite-border" size={18} color={theme.colors.info} />
                  <Text style={styles.dataLabel}>Nabız:</Text>
                  <Text style={styles.dataValue}>{record.heart_rate} bpm</Text>
                </View>
              )}

              {(record.sleep_hours || record.sleep_minutes) && (
                <View style={styles.dataItem}>
                  <MaterialIcons name="bedtime" size={18} color={theme.colors.info} />
                  <Text style={styles.dataLabel}>Uyku:</Text>
                  <Text style={styles.dataValue}>
                    {record.sleep_hours || 0}s {record.sleep_minutes || 0}dk
                  </Text>
                </View>
              )}

              {record.steps && (
                <View style={styles.dataItem}>
                  <MaterialIcons name="directions-walk" size={18} color={theme.colors.accent} />
                  <Text style={styles.dataLabel}>Adım:</Text>
                  <Text style={styles.dataValue}>{record.steps} adım</Text>
                </View>
              )}
            </View>
            
            {record.symptoms && record.symptoms.length > 0 && (
              <View style={styles.symptomsContainer}>
                <Text style={styles.symptomsTitle}>Semptomlar:</Text>
                <View style={styles.symptomsWrapper}>
                  {record.symptoms.map((symptom, index) => (
                    <View key={index} style={styles.symptomTag}>
                      <Text style={styles.symptomText}>{symptom}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            
            {record.notes && (
              <View style={styles.notesContainer}>
                <Text style={styles.notesTitle}>Notlar:</Text>
                <Text style={styles.notesText}>{record.notes}</Text>
              </View>
            )}
          </View>
        ))
      )}
    </>
  );

  const renderDoctorView = () => (
    <>
      {/* Doctor Overview Cards */}
      <View style={styles.doctorOverviewContainer}>
        <View style={[styles.overviewCard, { backgroundColor: theme.colors.health }]}>
          <MaterialIcons name="people" size={28} color="#FFF" />
          <Text style={styles.overviewNumber}>23</Text>
          <Text style={styles.overviewLabel}>Aktif Hasta</Text>
        </View>
        
        <View style={[styles.overviewCard, { backgroundColor: theme.colors.warning }]}>
          <MaterialIcons name="warning" size={28} color="#FFF" />
          <Text style={styles.overviewNumber}>3</Text>
          <Text style={styles.overviewLabel}>Kritik Durum</Text>
        </View>
        
        <View style={[styles.overviewCard, { backgroundColor: theme.colors.info }]}>
          <MaterialIcons name="trending-up" size={28} color="#FFF" />
          <Text style={styles.overviewNumber}>87%</Text>
          <Text style={styles.overviewLabel}>İyileşme Oranı</Text>
        </View>
      </View>

      {/* Recent Patient Records */}
      <Text style={styles.sectionTitle}>Son Hasta Kayıtları</Text>
      
      {records.slice(0, 5).map((record) => (
        <View key={record.id} style={styles.patientRecordCard}>
          <View style={styles.patientHeader}>
            <View style={styles.patientAvatar}>
              <MaterialIcons name="person" size={24} color={theme.colors.health} />
            </View>
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>Hasta #{record.id.slice(-4)}</Text>
              <Text style={styles.recordTime}>{formatDate(record.recorded_at)}</Text>
            </View>
            <View style={styles.statusIndicator}>
              <View style={[styles.statusDot, { 
                backgroundColor: record.temperature && record.temperature > 37.5 ? theme.colors.error : theme.colors.success 
              }]} />
            </View>
          </View>
          
          <View style={styles.vitalSigns}>
            {record.temperature && (
              <View style={styles.vitalItem}>
                <Text style={styles.vitalLabel}>Ateş</Text>
                <Text style={[styles.vitalValue, { 
                  color: record.temperature > 37.5 ? theme.colors.error : theme.colors.text 
                }]}>
                  {record.temperature}°C
                </Text>
              </View>
            )}
            {record.blood_pressure_systolic && (
              <View style={styles.vitalItem}>
                <Text style={styles.vitalLabel}>Tansiyon</Text>
                <Text style={styles.vitalValue}>
                  {record.blood_pressure_systolic}/{record.blood_pressure_diastolic}
                </Text>
              </View>
            )}
            {record.heart_rate && (
              <View style={styles.vitalItem}>
                <Text style={styles.vitalLabel}>Nabız</Text>
                <Text style={styles.vitalValue}>{record.heart_rate} bpm</Text>
              </View>
            )}
          </View>
        </View>
      ))}
    </>
  );

  const renderCaregiverView = () => (
    <>
      {/* Patient Status Summary */}
      <View style={styles.caregiverSummary}>
        <Text style={styles.summaryTitle}>Hasta Durumu Özeti</Text>
        
        <View style={styles.statusRows}>
          <View style={styles.statusRow}>
            <MaterialIcons name="favorite" size={20} color={theme.colors.success} />
            <Text style={styles.statusText}>Genel durum: İyi</Text>
            <MaterialIcons name="check-circle" size={16} color={theme.colors.success} />
          </View>
          
          <View style={styles.statusRow}>
            <MaterialIcons name="thermostat" size={20} color={theme.colors.warning} />
            <Text style={styles.statusText}>
              Son ateş: {records.length > 0 && records[0].temperature ? `${records[0].temperature}°C` : 'Kayıt yok'}
            </Text>
          </View>
          
          <View style={styles.statusRow}>
            <MaterialIcons name="bedtime" size={20} color={theme.colors.info} />
            <Text style={styles.statusText}>
              Son uyku: {records.length > 0 && records[0].sleep_hours ? 
                `${records[0].sleep_hours}s ${records[0].sleep_minutes || 0}dk` : 
                'Kayıt yok'}
            </Text>
          </View>
        </View>
      </View>

      {/* Care Tasks */}
      <View style={styles.careTasksContainer}>
        <Text style={styles.sectionTitle}>Bugünkü Bakım Görevleri</Text>
        
        <View style={styles.taskItem}>
          <MaterialIcons name="check-circle" size={20} color={theme.colors.success} />
          <Text style={styles.taskText}>Sabah vital verileri alındı</Text>
        </View>
        
        <View style={styles.taskItem}>
          <MaterialIcons name="radio-button-unchecked" size={20} color={theme.colors.textLight} />
          <Text style={styles.taskTextPending}>Öğle ilaç hatırlatması</Text>
        </View>
        
        <View style={styles.taskItem}>
          <MaterialIcons name="radio-button-unchecked" size={20} color={theme.colors.textLight} />
          <Text style={styles.taskTextPending}>Akşam sağlık kontrolü</Text>
        </View>
      </View>

      {/* Recent Records for Caregiver */}
      <Text style={styles.sectionTitle}>Son Kayıtlar</Text>
      
      {records.slice(0, 3).map((record) => (
        <View key={record.id} style={styles.caregiverRecordCard}>
          <Text style={styles.recordTime}>{formatDate(record.recorded_at)}</Text>
          <View style={styles.quickStats}>
            {record.temperature && (
              <Text style={styles.quickStat}>Ateş: {record.temperature}°C</Text>
            )}
            {record.weight && (
              <Text style={styles.quickStat}>Kilo: {record.weight}kg</Text>
            )}
            {record.sleep_hours && (
              <Text style={styles.quickStat}>
                Uyku: {record.sleep_hours}s {record.sleep_minutes || 0}dk
              </Text>
            )}
          </View>
        </View>
      ))}
    </>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Sağlık verileri yükleniyor...</Text>
      </View>
    );
  }

  const renderContent = () => {
    if (user?.role === 'doktor') {
      return renderDoctorView();
    } else if (user?.role === 'bakici') {
      return renderCaregiverView();
    } else {
      return renderPatientView();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={theme.colors.health} barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.textInverse} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {user?.role === 'doktor' ? 'Hasta Verileri' : 
           user?.role === 'bakici' ? 'Bakım Takibi' : 
           'Sağlık Verilerim'}
        </Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <MaterialIcons name="create" size={24} color={theme.colors.textInverse} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {renderContent()}
      </ScrollView>

      {/* Add Record Modal */}
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
            <Text style={styles.modalTitle}>Yeni Sağlık Verisi</Text>
            <TouchableOpacity onPress={handleAddRecord}>
              <Text style={styles.modalSave}>Kaydet</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Kilo (kg)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Örn: 70.5"
                value={newRecord.weight}
                onChangeText={(text) => setNewRecord({...newRecord, weight: text})}
                keyboardType="decimal-pad"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Vücut Sıcaklığı (°C)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Örn: 36.5"
                value={newRecord.temperature}
                onChangeText={(text) => setNewRecord({...newRecord, temperature: text})}
                keyboardType="decimal-pad"
              />
            </View>
            
            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, {flex: 1, marginRight: 8}]}>
                <Text style={styles.inputLabel}>Sistolik Tansiyon</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="120"
                  value={newRecord.blood_pressure_systolic}
                  onChangeText={(text) => setNewRecord({...newRecord, blood_pressure_systolic: text})}
                  keyboardType="number-pad"
                />
              </View>
              
              <View style={[styles.inputGroup, {flex: 1, marginLeft: 8}]}>
                <Text style={styles.inputLabel}>Diastolik Tansiyon</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="80"
                  value={newRecord.blood_pressure_diastolic}
                  onChangeText={(text) => setNewRecord({...newRecord, blood_pressure_diastolic: text})}
                  keyboardType="number-pad"
                />
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Kalp Atış Hızı (bpm)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Örn: 72"
                value={newRecord.heart_rate}
                onChangeText={(text) => setNewRecord({...newRecord, heart_rate: text})}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, {flex: 1, marginRight: 8}]}>
                <Text style={styles.inputLabel}>Uyku Saati</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="8"
                  value={newRecord.sleep_hours}
                  onChangeText={(text) => setNewRecord({...newRecord, sleep_hours: text})}
                  keyboardType="number-pad"
                />
              </View>
              
              <View style={[styles.inputGroup, {flex: 1, marginLeft: 8}]}>
                <Text style={styles.inputLabel}>Uyku Dakikası</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="30"
                  value={newRecord.sleep_minutes}
                  onChangeText={(text) => setNewRecord({...newRecord, sleep_minutes: text})}
                  keyboardType="number-pad"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Günlük Adım Sayısı</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Örn: 5000"
                value={newRecord.steps}
                onChangeText={(text) => setNewRecord({...newRecord, steps: text})}
                keyboardType="number-pad"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Semptomlar (virgülle ayırın)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Örn: baş ağrısı, yorgunluk"
                value={newRecord.symptoms}
                onChangeText={(text) => setNewRecord({...newRecord, symptoms: text})}
                multiline
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notlar</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Ek notlarınızı buraya yazın..."
                value={newRecord.notes}
                onChangeText={(text) => setNewRecord({...newRecord, notes: text})}
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
    backgroundColor: theme.colors.health,
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
  
  // Patient View Styles
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
  },
  summaryCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.base,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    ...theme.shadows.sm,
  },
  summaryValue: {
    ...theme.typography.h4,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  summaryLabel: {
    ...theme.typography.caption,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
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
  recordCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.base,
    ...theme.shadows.sm,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  recordDate: {
    ...theme.typography.h4,
  },
  recordData: {
    marginBottom: theme.spacing.md,
  },
  dataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  dataLabel: {
    ...theme.typography.body,
    marginLeft: theme.spacing.sm,
    minWidth: 80,
  },
  dataValue: {
    ...theme.typography.body,
    fontWeight: theme.typography.fontWeight.medium,
    marginLeft: theme.spacing.sm,
  },
  symptomsContainer: {
    marginBottom: theme.spacing.md,
  },
  symptomsTitle: {
    ...theme.typography.body,
    fontWeight: theme.typography.fontWeight.medium,
    marginBottom: theme.spacing.sm,
  },
  symptomsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  symptomTag: {
    backgroundColor: theme.colors.backgroundAccent,
    borderRadius: theme.borderRadius.base,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  symptomText: {
    ...theme.typography.bodySecondary,
    color: theme.colors.health,
  },
  notesContainer: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.base,
    padding: theme.spacing.md,
  },
  notesTitle: {
    ...theme.typography.body,
    fontWeight: theme.typography.fontWeight.medium,
    marginBottom: theme.spacing.xs,
  },
  notesText: {
    ...theme.typography.bodySecondary,
  },

  // Doctor View Styles
  doctorOverviewContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
  },
  overviewCard: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    ...theme.shadows.sm,
  },
  overviewNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: theme.spacing.sm,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  patientRecordCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.base,
    ...theme.shadows.sm,
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  patientAvatar: {
    width: 40,
    height: 40,
    backgroundColor: theme.colors.backgroundAccent,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    ...theme.typography.h4,
  },
  recordTime: {
    ...theme.typography.bodySecondary,
    marginTop: 2,
  },
  statusIndicator: {
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  vitalSigns: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  vitalItem: {
    alignItems: 'center',
  },
  vitalLabel: {
    ...theme.typography.caption,
    marginBottom: 4,
  },
  vitalValue: {
    ...theme.typography.body,
    fontWeight: theme.typography.fontWeight.medium,
  },

  // Caregiver View Styles
  caregiverSummary: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    ...theme.shadows.sm,
  },
  summaryTitle: {
    ...theme.typography.h3,
    marginBottom: theme.spacing.md,
  },
  statusRows: {
    marginTop: theme.spacing.sm,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  statusText: {
    ...theme.typography.body,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  careTasksContainer: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    ...theme.shadows.sm,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  taskText: {
    ...theme.typography.body,
    marginLeft: theme.spacing.sm,
    color: theme.colors.success,
  },
  taskTextPending: {
    ...theme.typography.body,
    marginLeft: theme.spacing.sm,
    color: theme.colors.textSecondary,
  },
  caregiverRecordCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.base,
    ...theme.shadows.sm,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: theme.spacing.sm,
  },
  quickStat: {
    ...theme.typography.bodySecondary,
    textAlign: 'center',
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
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  modalContent: {
    flex: 1,
    padding: theme.spacing.base,
  },
  inputGroup: {
    marginBottom: theme.spacing.base,
  },
  inputRow: {
    flexDirection: 'row',
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
});
</absolute_file_name>
    </file>