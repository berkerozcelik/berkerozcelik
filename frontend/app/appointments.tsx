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

interface Appointment {
  id: string;
  doctor_name: string;
  specialty: string;
  appointment_date: string;
  status: string;
  notes?: string;
  created_at: string;
}

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    doctor_name: '',
    specialty: '',
    appointment_date: '',
    notes: ''
  });

  const specialties = [
    'Onkolog', 'Dahiliye', 'Kardiyolog', 'Nöroloji', 'Radyoloji', 
    'Genel Cerrahi', 'Psikiyatri', 'Fizik Tedavi'
  ];

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      const response = await axios.get(`${BACKEND_URL}/api/appointments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAppointments(response.data);
    } catch (error) {
      console.error('Appointments fetch error:', error);
      Alert.alert('Hata', 'Randevular yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!newAppointment.doctor_name.trim()) {
      Alert.alert('Hata', 'Doktor adı zorunludur');
      return false;
    }
    if (!newAppointment.specialty) {
      Alert.alert('Hata', 'Uzmanlık alanı seçiniz');
      return false;
    }
    if (!newAppointment.appointment_date.trim()) {
      Alert.alert('Hata', 'Randevu tarihi ve saati zorunludur');
      return false;
    }
    
    // Basic date format validation
    const dateRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;
    if (!dateRegex.test(newAppointment.appointment_date)) {
      Alert.alert('Hata', 'Tarih formatı: YYYY-MM-DD HH:MM (örn: 2024-09-15 10:30)');
      return false;
    }
    
    return true;
  };

  const handleAddAppointment = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        Alert.alert('Hata', 'Oturum süresi dolmuş, lütfen tekrar giriş yapın');
        router.replace('/auth/login');
        return;
      }

      // Parse the date string and create ISO date
      const [datePart, timePart] = newAppointment.appointment_date.split(' ');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hour, minute] = timePart.split(':').map(Number);
      
      const appointmentDate = new Date(year, month - 1, day, hour, minute);
      
      if (isNaN(appointmentDate.getTime())) {
        Alert.alert('Hata', 'Geçersiz tarih formatı');
        return;
      }

      const appointmentData = {
        doctor_name: newAppointment.doctor_name.trim(),
        specialty: newAppointment.specialty,
        appointment_date: appointmentDate.toISOString(),
        notes: newAppointment.notes.trim() || null
      };

      console.log('Sending appointment data:', appointmentData);

      const response = await axios.post(`${BACKEND_URL}/api/appointments`, appointmentData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Appointment created:', response.data);

      setShowAddModal(false);
      setNewAppointment({
        doctor_name: '',
        specialty: '',
        appointment_date: '',
        notes: ''
      });
      
      Alert.alert('Başarılı', 'Randevunuz kaydedildi', [
        { text: 'Tamam', onPress: () => fetchAppointments() }
      ]);

    } catch (error: any) {
      console.error('Appointment save error:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          'Randevu kaydedilirken bir hata oluştu';
      Alert.alert('Hata', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return theme.colors.appointment;
      case 'completed': return theme.colors.success;
      case 'cancelled': return theme.colors.error;
      default: return theme.colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Planlandı';
      case 'completed': return 'Tamamlandı';
      case 'cancelled': return 'İptal Edildi';
      default: return status;
    }
  };

  const generateSampleDateTime = () => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)); // 1 week from now
    const year = futureDate.getFullYear();
    const month = String(futureDate.getMonth() + 1).padStart(2, '0');
    const day = String(futureDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day} 10:30`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.appointment} />
        <Text style={styles.loadingText}>Randevular yükleniyor...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={theme.colors.appointment} barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.textInverse} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Randevularım</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <MaterialIcons name="create" size={24} color={theme.colors.textInverse} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <MaterialIcons name="schedule" size={32} color={theme.colors.appointment} />
            <Text style={styles.statValue}>
              {appointments.filter(a => a.status === 'scheduled').length}
            </Text>
            <Text style={styles.statLabel}>Planlanmış</Text>
          </View>
          
          <View style={styles.statCard}>
            <MaterialIcons name="check-circle" size={32} color={theme.colors.success} />
            <Text style={styles.statValue}>
              {appointments.filter(a => a.status === 'completed').length}
            </Text>
            <Text style={styles.statLabel}>Tamamlanmış</Text>
          </View>
        </View>

        {/* Next Appointment */}
        {appointments.filter(a => a.status === 'scheduled').length > 0 && (
          <View style={styles.nextAppointmentCard}>
            <View style={styles.nextAppointmentHeader}>
              <MaterialIcons name="schedule" size={24} color={theme.colors.appointment} />
              <Text style={styles.nextAppointmentTitle}>Bir Sonraki Randevu</Text>
            </View>
            {(() => {
              const nextAppt = appointments
                .filter(a => a.status === 'scheduled')
                .sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime())[0];
              
              return (
                <View style={styles.nextAppointmentContent}>
                  <Text style={styles.nextAppointmentDoctor}>{nextAppt.doctor_name}</Text>
                  <Text style={styles.nextAppointmentSpecialty}>{nextAppt.specialty}</Text>
                  <Text style={styles.nextAppointmentDate}>{formatDate(nextAppt.appointment_date)}</Text>
                </View>
              );
            })()}
          </View>
        )}

        {/* Appointments List */}
        <Text style={styles.sectionTitle}>Tüm Randevular</Text>
        
        {appointments.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="calendar-today" size={64} color={theme.colors.textLight} />
            <Text style={styles.emptyTitle}>Henüz randevunuz yok</Text>
            <Text style={styles.emptyDescription}>
              İlk randevunuzu oluşturmak için yukarıdaki kalem simgesini kullanın
            </Text>
          </View>
        ) : (
          appointments
            .sort((a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime())
            .map((appointment) => (
              <View key={appointment.id} style={styles.appointmentCard}>
                <View style={styles.appointmentHeader}>
                  <View style={styles.appointmentInfo}>
                    <Text style={styles.appointmentDoctor}>{appointment.doctor_name}</Text>
                    <Text style={styles.appointmentSpecialty}>{appointment.specialty}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(appointment.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(appointment.status) }]}>
                      {getStatusText(appointment.status)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.appointmentDetails}>
                  <View style={styles.detailItem}>
                    <MaterialIcons name="access-time" size={18} color={theme.colors.textSecondary} />
                    <Text style={styles.detailText}>{formatDate(appointment.appointment_date)}</Text>
                  </View>
                  
                  {appointment.notes && (
                    <View style={styles.detailItem}>
                      <MaterialIcons name="note" size={18} color={theme.colors.textSecondary} />
                      <Text style={styles.detailText}>{appointment.notes}</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.appointmentActions}>
                  {appointment.status === 'scheduled' && (
                    <>
                      <TouchableOpacity style={[styles.actionButton, styles.editButton]}>
                        <MaterialIcons name="edit" size={16} color={theme.colors.appointment} />
                        <Text style={[styles.actionButtonText, { color: theme.colors.appointment }]}>
                          Düzenle
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity style={[styles.actionButton, styles.cancelButton]}>
                        <MaterialIcons name="cancel" size={16} color={theme.colors.error} />
                        <Text style={[styles.actionButtonText, { color: theme.colors.error }]}>
                          İptal Et
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            ))
        )}
      </ScrollView>

      {/* Add Appointment Modal */}
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
            <Text style={styles.modalTitle}>Yeni Randevu</Text>
            <TouchableOpacity 
              onPress={handleAddAppointment}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={theme.colors.appointment} />
              ) : (
                <Text style={styles.modalSave}>Kaydet</Text>
              )}
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Doktor Adı *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Örn: Dr. Ahmet Yılmaz"
                value={newAppointment.doctor_name}
                onChangeText={(text) => setNewAppointment({...newAppointment, doctor_name: text})}
                editable={!saving}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Uzmanlık Alanı *</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.specialtyScroll}
              >
                {specialties.map((specialty) => (
                  <TouchableOpacity
                    key={specialty}
                    style={[
                      styles.specialtyChip,
                      newAppointment.specialty === specialty && styles.specialtyChipSelected
                    ]}
                    onPress={() => setNewAppointment({...newAppointment, specialty})}
                    disabled={saving}
                  >
                    <Text
                      style={[
                        styles.specialtyChipText,
                        newAppointment.specialty === specialty && styles.specialtyChipTextSelected
                      ]}
                    >
                      {specialty}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Randevu Tarihi ve Saati *</Text>
              <TextInput
                style={styles.textInput}
                placeholder={generateSampleDateTime()}
                value={newAppointment.appointment_date}
                onChangeText={(text) => setNewAppointment({...newAppointment, appointment_date: text})}
                editable={!saving}
              />
              <Text style={styles.inputHint}>Format: YYYY-MM-DD HH:MM (örn: 2024-09-15 10:30)</Text>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notlar</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Ek notlar veya hatırlatmalar..."
                value={newAppointment.notes}
                onChangeText={(text) => setNewAppointment({...newAppointment, notes: text})}
                multiline
                numberOfLines={3}
                editable={!saving}
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
    backgroundColor: theme.colors.appointment,
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xl,
  },
  statCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 6,
    ...theme.shadows.sm,
  },
  statValue: {
    ...theme.typography.h2,
    marginTop: theme.spacing.sm,
  },
  statLabel: {
    ...theme.typography.caption,
    marginTop: theme.spacing.xs,
  },
  nextAppointmentCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.appointment,
    ...theme.shadows.sm,
  },
  nextAppointmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  nextAppointmentTitle: {
    ...theme.typography.h4,
    marginLeft: theme.spacing.sm,
  },
  nextAppointmentContent: {
    paddingLeft: theme.spacing['2xl'],
  },
  nextAppointmentDoctor: {
    ...theme.typography.h3,
    marginBottom: theme.spacing.xs,
  },
  nextAppointmentSpecialty: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  nextAppointmentDate: {
    ...theme.typography.body,
    color: theme.colors.appointment,
    fontWeight: theme.typography.fontWeight.medium,
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
  appointmentCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.base,
    ...theme.shadows.sm,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  appointmentInfo: {
    flex: 1,
  },
  appointmentDoctor: {
    ...theme.typography.h4,
    marginBottom: theme.spacing.xs,
  },
  appointmentSpecialty: {
    ...theme.typography.bodySecondary,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.base,
  },
  statusText: {
    ...theme.typography.caption,
    fontWeight: theme.typography.fontWeight.medium,
  },
  appointmentDetails: {
    marginBottom: theme.spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  detailText: {
    ...theme.typography.body,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  appointmentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.base,
    marginLeft: theme.spacing.sm,
  },
  editButton: {
    backgroundColor: theme.colors.appointment + '20',
  },
  cancelButton: {
    backgroundColor: theme.colors.error + '20',
  },
  actionButtonText: {
    ...theme.typography.bodySecondary,
    marginLeft: theme.spacing.xs,
    fontWeight: theme.typography.fontWeight.medium,
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
    color: theme.colors.appointment,
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
  specialtyScroll: {
    marginTop: theme.spacing.sm,
  },
  specialtyChip: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.base,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  specialtyChipSelected: {
    backgroundColor: theme.colors.appointment,
    borderColor: theme.colors.appointment,
  },
  specialtyChipText: {
    ...theme.typography.bodySecondary,
  },
  specialtyChipTextSelected: {
    color: theme.colors.textInverse,
    fontWeight: theme.typography.fontWeight.medium,
  },
});