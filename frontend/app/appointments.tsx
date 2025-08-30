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
  Dimensions
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from './theme';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;
const { width } = Dimensions.get('window');

interface Appointment {
  id: string;
  doctor_name: string;
  specialty: string;
  date: string;
  time: string;
  status: string;
  notes?: string;
}

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(25); // Çarşamba seçili
  const [selectedSpecialty, setSelectedSpecialty] = useState('Psikolog');

  const weekDays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  const weekDates = [27, 24, 25, 22, 6, 5, 9];

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

  const handleCreateAppointment = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return;

      const appointmentData = {
        doctor_name: selectedSpecialty === 'Psikolog' ? 'Dr. Ayşe Yılmaz' : 'Dr. Mehmet Kaya',
        specialty: selectedSpecialty,
        date: '2024-01-25',
        time: '09:00',
        notes: `${selectedSpecialty} randevusu onaylandı`
      };

      await axios.post(`${BACKEND_URL}/api/appointments`, appointmentData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Alert.alert('Başarılı', 'Randevunuz onaylandı!');
      fetchAppointments();
    } catch (error) {
      console.error('Create appointment error:', error);
      Alert.alert('Hata', 'Randevu oluşturulurken bir hata oluştu');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Randevular yükleniyor...</Text>
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
        <Text style={styles.headerTitle}>Randevu Al</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Calendar Week View */}
        <View style={styles.calendarContainer}>
          <View style={styles.weekDays}>
            {weekDays.map((day, index) => (
              <View key={index} style={styles.dayContainer}>
                <Text style={styles.dayLabel}>{day}</Text>
                <TouchableOpacity
                  style={[
                    styles.dateButton,
                    selectedDate === weekDates[index] && styles.selectedDate
                  ]}
                  onPress={() => setSelectedDate(weekDates[index])}
                >
                  <Text style={[
                    styles.dateText,
                    selectedDate === weekDates[index] && styles.selectedDateText
                  ]}>
                    {weekDates[index]}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Specialty Selection */}
        <View style={styles.specialtyContainer}>
          <TouchableOpacity
            style={[
              styles.specialtyButton,
              selectedSpecialty === 'Psikolog' && styles.selectedSpecialty
            ]}
            onPress={() => setSelectedSpecialty('Psikolog')}
          >
            <Text style={[
              styles.specialtyText,
              selectedSpecialty === 'Psikolog' && styles.selectedSpecialtyText
            ]}>
              Psikolog
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.specialtyButton,
              selectedSpecialty === 'Diyetisyen' && styles.selectedSpecialty
            ]}
            onPress={() => setSelectedSpecialty('Diyetisyen')}
          >
            <Text style={[
              styles.specialtyText,
              selectedSpecialty === 'Diyetisyen' && styles.selectedSpecialtyText
            ]}>
              Diyetisyen
            </Text>
          </TouchableOpacity>
        </View>

        {/* Available Time Slots */}
        <View style={styles.timeSlotsContainer}>
          <View style={styles.timeSlotRow}>
            <View style={styles.timeSlot}>
              <Text style={styles.timeText}>09:00</Text>
              <Text style={styles.doctorText}>Dr. Ayşe Yılmaz</Text>
            </View>
            <View style={styles.timeSlot}>
              <Text style={styles.timeText}>10:30</Text>
              <Text style={styles.doctorText}>Dr. Ayşe Yılmaz</Text>
            </View>
          </View>

          <View style={styles.timeSlotRow}>
            <View style={styles.timeSlot}>
              <Text style={styles.timeText}>11:30</Text>
              <Text style={styles.doctorText}>Dr. Ayşe Yılmaz</Text>
            </View>
            <View style={styles.timeSlot}>
              <Text style={styles.timeText}>14:00</Text>
              <Text style={styles.doctorText}>Dr. Ayşe Yılmaz</Text>
            </View>
          </View>
        </View>

        {/* Confirm Button */}
        <TouchableOpacity 
          style={styles.confirmButton}
          onPress={handleCreateAppointment}
        >
          <Text style={styles.confirmButtonText}>Randevu Onayla</Text>
        </TouchableOpacity>

        {/* Existing Appointments */}
        <View style={styles.existingAppointments}>
          <Text style={styles.sectionTitle}>Mevcut Randevularım</Text>
          {appointments.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="event-available" size={64} color={theme.colors.textLight} />
              <Text style={styles.emptyTitle}>Henüz randevunuz yok</Text>
              <Text style={styles.emptyDescription}>
                Yukarıdan yeni randevu oluşturabilirsiniz
              </Text>
            </View>
          ) : (
            appointments.map((appointment) => (
              <View key={appointment.id} style={styles.appointmentCard}>
                <View style={styles.appointmentHeader}>
                  <View>
                    <Text style={styles.appointmentDoctor}>{appointment.doctor_name}</Text>
                    <Text style={styles.appointmentSpecialty}>{appointment.specialty}</Text>
                  </View>
                  <View style={styles.appointmentTime}>
                    <Text style={styles.appointmentDate}>{appointment.date}</Text>
                    <Text style={styles.appointmentTimeText}>{appointment.time}</Text>
                  </View>
                </View>
                {appointment.notes && (
                  <Text style={styles.appointmentNotes}>{appointment.notes}</Text>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>

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

        <TouchableOpacity style={styles.navItem}>
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

        <TouchableOpacity style={[styles.navItem, styles.activeNavItem]}>
          <MaterialIcons name="event" size={24} color={theme.colors.strongTeal} />
          <Text style={[styles.navText, styles.activeNavText]}>Randevu</Text>
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
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
  },

  // Calendar
  calendarContainer: {
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
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dayContainer: {
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  dateButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
  },
  selectedDate: {
    backgroundColor: theme.colors.strongTeal,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  selectedDateText: {
    color: '#FFFFFF',
  },

  // Specialty Selection
  specialtyContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 20,
  },
  specialtyButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginHorizontal: 8,
    backgroundColor: theme.colors.lightBlue,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedSpecialty: {
    backgroundColor: theme.colors.strongTeal,
  },
  specialtyText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  selectedSpecialtyText: {
    color: '#FFFFFF',
  },

  // Time Slots
  timeSlotsContainer: {
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
  timeSlotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  timeSlot: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  timeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.strongTeal,
    marginBottom: 4,
  },
  doctorText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },

  // Confirm Button
  confirmButton: {
    backgroundColor: theme.colors.strongTeal,
    marginHorizontal: 16,
    paddingVertical: 18,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Existing Appointments
  existingAppointments: {
    marginHorizontal: 16,
    marginBottom: 100,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appointmentDoctor: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  appointmentSpecialty: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  appointmentTime: {
    alignItems: 'flex-end',
  },
  appointmentDate: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  appointmentTimeText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.strongTeal,
    marginTop: 2,
  },
  appointmentNotes: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 12,
    fontStyle: 'italic',
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