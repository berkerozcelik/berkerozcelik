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
import {
  LineChart,
  BarChart,
  PieChart,
  ProgressChart,
  ContributionGraph
} from 'react-native-chart-kit';
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
  const [selectedMetric, setSelectedMetric] = useState('weight');
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

  // Mock data for charts - last 7 days
  const mockHealthData = {
    weight: [68.2, 68.5, 68.3, 68.7, 68.5, 68.9, 68.5],
    temperature: [36.2, 36.5, 36.8, 36.4, 36.6, 36.3, 36.5],
    sleep: [6.5, 7.2, 6.8, 7.5, 7.0, 7.8, 7.3],
    steps: [4200, 5800, 6200, 5400, 6800, 7200, 6542]
  };

  const days = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

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

  const renderChart = (data: number[], label: string, unit: string, color: string) => {
    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const range = maxValue - minValue || 1;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{label}</Text>
        <View style={styles.chartArea}>
          <View style={styles.yAxis}>
            <Text style={styles.yAxisLabel}>{maxValue.toFixed(1)}</Text>
            <Text style={styles.yAxisLabel}>{((maxValue + minValue) / 2).toFixed(1)}</Text>
            <Text style={styles.yAxisLabel}>{minValue.toFixed(1)}</Text>
          </View>
          <View style={styles.chartContent}>
            <View style={styles.chartBars}>
              {data.map((value, index) => {
                const height = ((value - minValue) / range) * 80 + 20;
                return (
                  <View key={index} style={styles.barContainer}>
                    <View 
                      style={[
                        styles.bar, 
                        { height: height, backgroundColor: color }
                      ]} 
                    />
                    <Text style={styles.xAxisLabel}>{days[index]}</Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.currentValue}>
              <Text style={styles.currentValueText}>
                {data[data.length - 1]}{unit}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
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
      <StatusBar backgroundColor={theme.colors.backgroundLight} barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sağlık Verilerim</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <MaterialIcons name="add" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Chart Selection */}
        <View style={styles.chartSelection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity 
              style={[styles.metricButton, selectedMetric === 'weight' && styles.selectedMetric]}
              onPress={() => setSelectedMetric('weight')}
            >
              <MaterialIcons name="monitor-weight" size={20} color={selectedMetric === 'weight' ? '#FFFFFF' : theme.colors.strongTeal} />
              <Text style={[styles.metricText, selectedMetric === 'weight' && styles.selectedMetricText]}>Kilo</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.metricButton, selectedMetric === 'temperature' && styles.selectedMetric]}
              onPress={() => setSelectedMetric('temperature')}
            >
              <MaterialIcons name="thermostat" size={20} color={selectedMetric === 'temperature' ? '#FFFFFF' : theme.colors.strongTeal} />
              <Text style={[styles.metricText, selectedMetric === 'temperature' && styles.selectedMetricText]}>Ateş</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.metricButton, selectedMetric === 'sleep' && styles.selectedMetric]}
              onPress={() => setSelectedMetric('sleep')}
            >
              <MaterialIcons name="bedtime" size={20} color={selectedMetric === 'sleep' ? '#FFFFFF' : theme.colors.strongTeal} />
              <Text style={[styles.metricText, selectedMetric === 'sleep' && styles.selectedMetricText]}>Uyku</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.metricButton, selectedMetric === 'steps' && styles.selectedMetric]}
              onPress={() => setSelectedMetric('steps')}
            >
              <MaterialIcons name="directions-walk" size={20} color={selectedMetric === 'steps' ? '#FFFFFF' : theme.colors.strongTeal} />
              <Text style={[styles.metricText, selectedMetric === 'steps' && styles.selectedMetricText]}>Adım</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Chart Display */}
        <View style={styles.chartSection}>
          {selectedMetric === 'weight' && renderChart(mockHealthData.weight, 'Kilo Takibi', 'kg', theme.colors.info)}
          {selectedMetric === 'temperature' && renderChart(mockHealthData.temperature, 'Vücut Sıcaklığı', '°C', theme.colors.warning)}
          {selectedMetric === 'sleep' && renderChart(mockHealthData.sleep, 'Uyku Süresi', 's', theme.colors.strongTeal)}
          {selectedMetric === 'steps' && renderChart(mockHealthData.steps, 'Günlük Adım', '', theme.colors.success)}
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <MaterialIcons name="monitor-weight" size={32} color={theme.colors.info} />
            <Text style={styles.summaryValue}>68,5 kg</Text>
            <Text style={styles.summaryLabel}>Son Kilo</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <MaterialIcons name="thermostat" size={32} color={theme.colors.warning} />
            <Text style={styles.summaryValue}>36,5°C</Text>
            <Text style={styles.summaryLabel}>Son Ateş</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <MaterialIcons name="bedtime" size={32} color={theme.colors.strongTeal} />
            <Text style={styles.summaryValue}>7s 20dk</Text>
            <Text style={styles.summaryLabel}>Son Uyku</Text>
          </View>

          <View style={styles.summaryCard}>
            <MaterialIcons name="directions-walk" size={32} color={theme.colors.success} />
            <Text style={styles.summaryValue}>6.542</Text>
            <Text style={styles.summaryLabel}>Bugün Adım</Text>
          </View>
        </View>

        {/* Recent Records */}
        <Text style={styles.sectionTitle}>Son Kayıtlar</Text>
        
        {records.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="health-and-safety" size={64} color={theme.colors.textLight} />
            <Text style={styles.emptyTitle}>Henüz sağlık verisi yok</Text>
            <Text style={styles.emptyDescription}>
              İlk verilerinizi eklemek için yukarıdaki + butonunu kullanın
            </Text>
          </View>
        ) : (
          records.slice(0, 5).map((record) => (
            <View key={record.id} style={styles.recordCard}>
              <View style={styles.recordHeader}>
                <Text style={styles.recordDate}>{formatDate(record.recorded_at)}</Text>
                <MaterialIcons name="more-vert" size={20} color={theme.colors.textSecondary} />
              </View>
              
              <View style={styles.recordData}>
                {record.weight && (
                  <View style={styles.dataItem}>
                    <MaterialIcons name="monitor-weight" size={18} color={theme.colors.info} />
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
                    <MaterialIcons name="favorite-border" size={18} color={theme.colors.strongTeal} />
                    <Text style={styles.dataLabel}>Nabız:</Text>
                    <Text style={styles.dataValue}>{record.heart_rate} bpm</Text>
                  </View>
                )}

                {(record.sleep_hours || record.sleep_minutes) && (
                  <View style={styles.dataItem}>
                    <MaterialIcons name="bedtime" size={18} color={theme.colors.strongTeal} />
                    <Text style={styles.dataLabel}>Uyku:</Text>
                    <Text style={styles.dataValue}>
                      {record.sleep_hours || 0}s {record.sleep_minutes || 0}dk
                    </Text>
                  </View>
                )}

                {record.steps && (
                  <View style={styles.dataItem}>
                    <MaterialIcons name="directions-walk" size={18} color={theme.colors.success} />
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

        <TouchableOpacity style={[styles.navItem, styles.activeNavItem]}>
          <MaterialIcons name="favorite" size={24} color={theme.colors.strongTeal} />
          <Text style={[styles.navText, styles.activeNavText]}>Sağlık</Text>
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

  // Chart Selection
  chartSelection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  metricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: theme.colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: theme.colors.strongTeal,
  },
  selectedMetric: {
    backgroundColor: theme.colors.strongTeal,
  },
  metricText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.strongTeal,
    marginLeft: 8,
  },
  selectedMetricText: {
    color: '#FFFFFF',
  },

  // Chart Section
  chartSection: {
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
  chartContainer: {
    minHeight: 200,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  chartArea: {
    flexDirection: 'row',
    height: 150,
  },
  yAxis: {
    width: 40,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  yAxisLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  chartContent: {
    flex: 1,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  xAxisLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  currentValue: {
    alignItems: 'center',
    marginTop: 12,
  },
  currentValueText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.strongTeal,
  },

  // Summary Cards
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  summaryCard: {
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
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },

  // Records Section
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing['5xl'],
    marginHorizontal: 20,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
    color: theme.colors.strongTeal,
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
    backgroundColor: '#FFFFFF',
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