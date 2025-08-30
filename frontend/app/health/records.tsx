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
import { theme } from '../theme';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

interface HealthRecord {
  id: string;
  weight?: number;
  temperature?: number;
  blood_pressure_systolic?: number;
  blood_pressure_diastolic?: number;
  heart_rate?: number;
  symptoms?: string[];
  notes?: string;
  recorded_at: string;
}

export default function HealthRecords() {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRecord, setNewRecord] = useState({
    weight: '',
    temperature: '',
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    heart_rate: '',
    symptoms: '',
    notes: ''
  });

  useEffect(() => {
    fetchHealthRecords();
  }, []);

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Sağlık verileri yükleniyor...</Text>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>Sağlık Verileri</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <MaterialIcons name="add" size={24} color={theme.colors.textInverse} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
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
            <MaterialIcons name="favorite" size={32} color={theme.colors.error} />
            <Text style={styles.summaryValue}>
              {records.length > 0 && records[0].blood_pressure_systolic ? 
                `${records[0].blood_pressure_systolic}/${records[0].blood_pressure_diastolic}` : 
                'Kayıt yok'}
            </Text>
            <Text style={styles.summaryLabel}>Son Tansiyon</Text>
          </View>
        </View>

        {/* Records List */}
        <Text style={styles.sectionTitle}>Geçmiş Kayıtlar</Text>
        
        {records.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="health-and-safety" size={64} color={theme.colors.textLight} />
            <Text style={styles.emptyTitle}>Henüz sağlık verisi yok</Text>
            <Text style={styles.emptyDescription}>
              İlk verilerinizi eklemek için yukarıdaki + butonunu kullanın
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