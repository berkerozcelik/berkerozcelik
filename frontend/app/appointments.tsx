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

interface Doctor {
  name: string;
  specialty: string;
  times: string[];
}

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(25); // Çarşamba seçili
  const [selectedSpecialty, setSelectedSpecialty] = useState('Psikolog');
  const [selectedTime, setSelectedTime] = useState('');

  const weekDays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  const weekDates = [27, 24, 25, 22, 6, 5, 9];

  // Doktor listesi - farklı isimler
  const doctors: { [key: string]: Doctor } = {
    'Psikolog': {
      name: 'Dr. Ayşe Kılıç',
      specialty: 'Psikolog',
      times: ['09:00', '10:30', '11:30', '14:00']
    },
    'Diyetisyen': {
      name: 'Dyt. Mehmet Öztürk',
      specialty: 'Diyetisyen', 
      times: ['08:30', '10:00', '13:30', '15:00']
    },
    'Onkolog': {
      name: 'Prof. Dr. Zeynep Arslan',
      specialty: 'Onkolog',
      times: ['09:30', '11:00', '14:30', '16:00']
    }
  };

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
      if (!selectedTime) {
        Alert.alert('Uyarı', 'Lütfen bir saat seçin');
        return;
      }

      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return;

      const selectedDoctor = doctors[selectedSpecialty];
      const appointmentData = {
        doctor_name: selectedDoctor.name,
        specialty: selectedSpecialty,
        date: `2024-01-${selectedDate}`,
        time: selectedTime,
        notes: `${selectedSpecialty} randevusu onaylandı - ${selectedDoctor.name}`
      };

      await axios.post(`${BACKEND_URL}/api/appointments`, appointmentData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Alert.alert('Başarılı', `${selectedDoctor.name} ile randevunuz ${selectedTime} saatinde onaylandı!`);
      setSelectedTime(''); // Seçimi temizle
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

        {/* Specialty Selection - 3 seçenek */}
        <View style={styles.specialtyContainer}>
          {Object.keys(doctors).map((specialty) => (
            <TouchableOpacity
              key={specialty}
              style={[
                styles.specialtyButton,
                selectedSpecialty === specialty && styles.selectedSpecialty
              ]}
              onPress={() => {
                setSelectedSpecialty(specialty);
                setSelectedTime(''); // Saat seçimini sıfırla
              }}
            >
              <Text style={[
                styles.specialtyText,
                selectedSpecialty === specialty && styles.selectedSpecialtyText
              ]}>
                {specialty}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Doctor Info */}
        <View style={styles.doctorInfoContainer}>
          <Text style={styles.doctorInfoTitle}>Seçili Doktor</Text>
          <Text style={styles.doctorName}>{doctors[selectedSpecialty].name}</Text>
          <Text style={styles.doctorSpecialty}>{doctors[selectedSpecialty].specialty}</Text>
        </View>

        {/* Available Time Slots */}
        <View style={styles.timeSlotsContainer}>
          <Text style={styles.timeSlotsTitle}>Müsait Saatler</Text>
          <View style={styles.timeSlotGrid}>
            {doctors[selectedSpecialty].times.map((time, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.timeSlot,
                  selectedTime === time && styles.selectedTimeSlot
                ]}
                onPress={() => setSelectedTime(time)}
              >
                <Text style={[
                  styles.timeText,
                  selectedTime === time && styles.selectedTimeText
                ]}>
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Confirm Button */}
        <TouchableOpacity 
          style={[
            styles.confirmButton,
            !selectedTime && styles.confirmButtonDisabled
          ]}
          onPress={handleCreateAppointment}
          disabled={!selectedTime}
        >
          <Text style={[
            styles.confirmButtonText,
            !selectedTime && styles.confirmButtonTextDisabled
          ]}>
            {selectedTime ? `${selectedTime} Saatinde Randevu Onayla` : 'Lütfen Saat Seçin'}
          </Text>
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

      {/* Bottom Navigation - Standart */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/')}
          activeOpacity={0.7}
        >
          <MaterialIcons name="home" size={24} color={theme.colors.textLight} />
          <Text style={styles.navText}>Ana Sayfa</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/medicines')}
          activeOpacity={0.7}
        >
          <MaterialIcons name="medication" size={24} color={theme.colors.textLight} />
          <Text style={styles.navText}>İlaçlar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.navItem, styles.activeNavItem]}>
          <MaterialIcons name="event" size={24} color={theme.colors.strongTeal} />
          <Text style={[styles.navText, styles.activeNavText]}>Planlarım</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/health/records')}
          activeOpacity={0.7}
        >
          <MaterialIcons name="favorite" size={24} color={theme.colors.textLight} />
          <Text style={styles.navText}>Sağlık</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/ai-chat')}
          activeOpacity={0.7}
        >
          <MaterialIcons name="chat" size={24} color={theme.colors.textLight} />
          <Text style={styles.navText}>AI Chat</Text>
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

  // Specialty Selection - 3 seçenek
  specialtyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginBottom: 20,
  },
  specialtyButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    marginHorizontal: 4,
    backgroundColor: theme.colors.lightBlue,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedSpecialty: {
    backgroundColor: theme.colors.strongTeal,
  },
  specialtyText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
  },
  selectedSpecialtyText: {
    color: '#FFFFFF',
  },

  // Doctor Info
  doctorInfoContainer: {
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
  doctorInfoTitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  doctorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 16,
    color: theme.colors.strongTeal,
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
  timeSlotsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  timeSlotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  timeSlot: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedTimeSlot: {
    backgroundColor: theme.colors.lightBlue,
    borderColor: theme.colors.strongTeal,
  },
  timeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  selectedTimeText: {
    color: theme.colors.strongTeal,
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
  confirmButtonDisabled: {
    backgroundColor: theme.colors.textLight,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButtonTextDisabled: {
    color: theme.colors.textSecondary,
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