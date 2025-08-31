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
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from './theme';

const BACKEND_URL = 'https://onkom-health-ai.preview.emergentagent.com';

export default function Medicines() {
  const [loading, setLoading] = useState(false);

  // Sample medicine data
  const dailyMedicines = [
    {
      id: '1',
      name: 'Metformin 500mg',
      time: '09:00',
      taken: false,
    },
    {
      id: '2',
      name: 'Ondansetron 8mg',
      time: '14:00',
      taken: false,
    },
    {
      id: '3',
      name: 'Tramadol 50mg',
      time: '19:00',
      taken: true,
    },
    {
      id: '4',
      name: 'Letrozol 2,5mg',
      time: '22:00',
      taken: false,
    }
  ];

  const toggleMedicineTaken = (medicineId: string) => {
    Alert.alert('İlaç Durumu', 'İlaç durumu güncellendi');
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
      
      {/* Header */}
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
          onPress={() => Alert.alert('Özellik', 'Bu özellik yakında eklenecek')}
        >
          <MaterialIcons name="notifications" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Today's Medicines */}
        <View style={styles.todaySection}>
          <Text style={styles.sectionTitle}>Bugün</Text>
          
          {dailyMedicines.map((medicine) => (
            <View key={medicine.id} style={styles.medicineCard}>
              <View style={styles.medicineContent}>
                <View style={styles.medicineInfo}>
                  <Text style={styles.medicineName}>{medicine.name}</Text>
                  <Text style={styles.medicineTime}>⏰ {medicine.time}</Text>
                </View>
                <TouchableOpacity 
                  style={medicine.taken ? styles.checkboxChecked : styles.checkboxEmpty}
                  onPress={() => toggleMedicineTaken(medicine.id)}
                >
                  <MaterialIcons 
                    name={medicine.taken ? "check-box" : "check-box-outline-blank"} 
                    size={24} 
                    color={medicine.taken ? theme.colors.success : theme.colors.textLight} 
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/')}
          activeOpacity={0.7}
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
          activeOpacity={0.7}
        >
          <MaterialIcons name="event" size={24} color={theme.colors.textLight} />
          <Text style={styles.navText}>Planlarım</Text>
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
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
  },
  todaySection: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  medicineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  medicineContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  checkboxChecked: {
    padding: 4,
  },
  checkboxEmpty: {
    padding: 4,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  activeNavItem: {
    backgroundColor: theme.colors.lightBlue,
    borderRadius: 8,
    marginHorizontal: 2,
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