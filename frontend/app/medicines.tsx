import React, { useState, useEffect, useRef } from 'react';
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
  TextInput,
  Switch
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import { MaterialIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutDown,
  BounceIn,
  Layout,
} from 'react-native-reanimated';
import { theme } from './theme';
import { notificationService, MedicineReminder, generateWeeklyMedicineReport } from '../utils/notifications';
import {
  useSlideUpAnimation,
  useFadeAnimation,
  useScaleAnimation,
  useModalAnimation,
  useStaggeredAnimation,
} from '../utils/animations';

const BACKEND_URL = Constants.expoConfig?.extra?.EXPO_BACKEND_URL || process.env.EXPO_PUBLIC_BACKEND_URL;

interface Medicine {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  time: string;
  taken: boolean;
  interaction_warning?: boolean;
  notifications_enabled?: boolean;
  last_taken?: string;
  missed_count?: number;
}

export default function Medicines() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationToken, setNotificationToken] = useState<string | null>(null);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const [newMedicine, setNewMedicine] = useState({
    name: '',
    dosage: '',
    frequency: 'Günde 1 kez',
    time: '',
    notifications_enabled: true
  });

  // Animation Hooks
  const headerAnimation = useFadeAnimation(false);
  const contentAnimation = useSlideUpAnimation(false);
  const { animatedStyles: medicineCardsAnimation, startStaggered: startMedicineStagger } = useStaggeredAnimation(dailyMedicines.length, 150);
  const { animatedStyle: modalStyle, showModal, hideModal } = useModalAnimation(showAddModal);
  const { animatedStyle: aiModalStyle, showModal: showAIModalAnim, hideModal: hideAIModalAnim } = useModalAnimation(showAIModal);
  const { animatedStyle: notificationModalStyle, showModal: showNotificationModalAnim, hideModal: hideNotificationModalAnim } = useModalAnimation(showNotificationModal);

  // Animation state
  const pulseScale = useSharedValue(1);
  const successAnimation = useSharedValue(0);

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const animatedSuccessStyle = useAnimatedStyle(() => ({
    opacity: successAnimation.value,
    transform: [{ scale: successAnimation.value }],
  }));

  // Günlük ilaç listesi - güncellendi
  const [dailyMedicines, setDailyMedicines] = useState([
    {
      id: '1',
      name: 'Metformin 500mg',
      time: '09:00',
      taken: false,
      interaction_warning: false,
      notifications_enabled: true,
      last_taken: null,
      missed_count: 0
    },
    {
      id: '2',
      name: 'Ondansetron 8mg',
      time: '14:00',
      taken: false,
      interaction_warning: false,
      notifications_enabled: true,
      last_taken: null,
      missed_count: 1
    },
    {
      id: '3',
      name: 'Tramadol 50mg',
      time: '19:00',
      taken: true,
      interaction_warning: false,
      notifications_enabled: true,
      last_taken: new Date().toISOString(),
      missed_count: 0
    },
    {
      id: '4',
      name: 'Letrozol 2,5mg',
      time: '22:00',
      taken: false,
      interaction_warning: false,
      notifications_enabled: true,
      last_taken: null,
      missed_count: 0
    }
  ]);

  // İlaç etkileşim kontrolü
  const checkDrugInteractions = () => {
    const currentMedicines = dailyMedicines.map(med => med.name).join(', ');
    return currentMedicines.includes('Tramadol') && currentMedicines.includes('Ondansetron');
  };

  useEffect(() => {
    fetchMedicines();
    initializeNotifications();
    
    // Start entrance animations
    setTimeout(() => {
      headerAnimation.fadeIn();
      contentAnimation.animate(true);
      startMedicineStagger();
    }, 100);
    
    // Notification listeners
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Bildirim alındı:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      if (data.type === 'medicine_reminder') {
        handleNotificationResponse(data.medicineId, data.medicineName);
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const initializeNotifications = async () => {
    try {
      const token = await notificationService.registerForPushNotificationsAsync();
      if (token) {
        setNotificationToken(token);
        setNotificationsEnabled(true);
        
        // Load existing notification settings
        const savedSettings = await AsyncStorage.getItem('notification_settings');
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          setNotificationsEnabled(settings.enabled || false);
        }
        
        // Setup existing medicine reminders
        await setupMedicineReminders();
      }
    } catch (error) {
      console.error('Bildirim başlatma hatası:', error);
    }
  };

  const setupMedicineReminders = async () => {
    try {
      const medicineReminders: MedicineReminder[] = dailyMedicines
        .filter(medicine => medicine.notifications_enabled && medicine.time)
        .map(medicine => ({
          medicineId: medicine.id,
          medicineName: medicine.name,
          dosage: '',
          time: medicine.time,
          frequency: 'daily',
          isActive: true
        }));

      await notificationService.scheduleAllMedicineReminders(medicineReminders);
      
      // Setup weekly report
      await generateWeeklyMedicineReport(medicineReminders);
    } catch (error) {
      console.error('İlaç hatırlatmaları ayarlanırken hata:', error);
    }
  };

  const handleNotificationResponse = (medicineId: string, medicineName: string) => {
    Alert.alert(
      '💊 İlaç Hatırlatması',
      `${medicineName} almanızın zamanı geldi. İlacınızı aldınız mı?`,
      [
        {
          text: 'Daha Sonra',
          onPress: () => scheduleRemindLater(medicineId, medicineName),
          style: 'cancel'
        },
        {
          text: 'Aldım',
          onPress: () => markMedicineAsTaken(medicineId, medicineName)
        }
      ]
    );
  };

  const scheduleRemindLater = async (medicineId: string, medicineName: string) => {
    try {
      await notificationService.scheduleMissedMedicineReminder(medicineId, medicineName);
      
      // Update missed count
      setDailyMedicines(prev => 
        prev.map(medicine => 
          medicine.id === medicineId 
            ? { ...medicine, missed_count: (medicine.missed_count || 0) + 1 }
            : medicine
        )
      );
      
      Alert.alert('Bilgi', '30 dakika sonra tekrar hatırlatılacaksınız.');
    } catch (error) {
      console.error('Erteleme hatırlatması ayarlanırken hata:', error);
    }
  };

  const markMedicineAsTaken = async (medicineId: string, medicineName: string) => {
    try {
      await notificationService.sendMedicineTakenConfirmation(medicineName);
      
      setDailyMedicines(prev => 
        prev.map(medicine => 
          medicine.id === medicineId 
            ? { 
                ...medicine, 
                taken: true, 
                last_taken: new Date().toISOString(),
                missed_count: 0
              }
            : medicine
        )
      );
    } catch (error) {
      console.error('İlaç alındı işareti konulurken hata:', error);
    }
  };

  // Modal handlers with animations
  const handleShowAddModal = () => {
    setShowAddModal(true);
    setTimeout(() => showModal(), 50);
  };

  const handleHideAddModal = () => {
    hideModal(() => setShowAddModal(false));
  };

  const handleShowAIModal = () => {
    setShowAIModal(true);
    setTimeout(() => showAIModalAnim(), 50);
  };

  const handleHideAIModal = () => {
    hideAIModalAnim(() => setShowAIModal(false));
  };

  const handleShowNotificationModal = () => {
    setShowNotificationModal(true);
    setTimeout(() => showNotificationModalAnim(), 50);
  };

  const handleHideNotificationModal = () => {
    hideNotificationModalAnim(() => setShowNotificationModal(false));
  };

  const toggleNotifications = async (enabled: boolean) => {
    try {
      setNotificationsEnabled(enabled);
      
      await AsyncStorage.setItem('notification_settings', JSON.stringify({
        enabled: enabled
      }));

      if (enabled) {
        await setupMedicineReminders();
        Alert.alert('Başarılı', 'İlaç hatırlatmaları açıldı');
      } else {
        await notificationService.cancelAllMedicineReminders();
        Alert.alert('Başarılı', 'İlaç hatırlatmaları kapatıldı');
      }
    } catch (error) {
      console.error('Bildirim ayarı değiştirilirken hata:', error);
      Alert.alert('Hata', 'Bildirim ayarı değiştirilemedi');
    }
  };

  const fetchMedicines = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        // Web için geçici bypass - sadece demo amaçlı
        console.log('No token found, using demo mode');
        setMedicines([]);
        setLoading(false);
        return;
      }

      const response = await axios.get(`${BACKEND_URL}/api/medicines`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMedicines(response.data);
    } catch (error) {
      console.error('Medicines fetch error:', error);
      // Don't show alert in demo mode, just use local data
      setMedicines([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedicine = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        Alert.alert('Hata', 'Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
        return;
      }

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

      const response = await axios.post(`${BACKEND_URL}/api/medicines`, medicineData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Backend'den gelen veriyi medicines listesine ekle
      setMedicines(prevMedicines => [...prevMedicines, response.data]);

      // Günlük ilaçlara da ekle
      const newDailyMedicine = {
        id: response.data.id || Date.now().toString(),
        name: `${newMedicine.name} ${newMedicine.dosage}`,
        time: newMedicine.time || '08:00',
        taken: false,
        interaction_warning: false,
        notifications_enabled: newMedicine.notifications_enabled,
        last_taken: null,
        missed_count: 0
      };
      setDailyMedicines(prev => [...prev, newDailyMedicine]);

      // Setup notification for new medicine if enabled
      if (newMedicine.notifications_enabled && newMedicine.time && notificationsEnabled) {
        const medicineReminder: MedicineReminder = {
          medicineId: newDailyMedicine.id,
          medicineName: newDailyMedicine.name,
          dosage: newMedicine.dosage,
          time: newMedicine.time,
          frequency: newMedicine.frequency,
          isActive: true
        };
        
        await notificationService.scheduleMedicineReminder(medicineReminder);
      }

      setShowAddModal(false);
      setNewMedicine({
        name: '',
        dosage: '',
        frequency: 'Günde 1 kez',
        time: '',
        notifications_enabled: true
      });
      
      Alert.alert('Başarılı', 'İlaç başarıyla eklendi ve hatırlatma ayarlandı');
    } catch (error) {
      console.error('Add medicine error:', error);
      Alert.alert('Hata', 'İlaç eklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const toggleMedicineTaken = async (medicineId: string) => {
    const medicine = dailyMedicines.find(m => m.id === medicineId);
    if (!medicine) return;

    const newTakenStatus = !medicine.taken;
    
    // Animate success feedback
    if (newTakenStatus) {
      pulseScale.value = withSequence(
        withTiming(1.2, { duration: 200 }),
        withSpring(1, theme.animations.spring.bouncy)
      );
      
      successAnimation.value = withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0, { duration: 1000 })
      );
    }
    
    setDailyMedicines(prev => 
      prev.map(med => 
        med.id === medicineId 
          ? { 
              ...med, 
              taken: newTakenStatus, 
              last_taken: newTakenStatus ? new Date().toISOString() : null,
              missed_count: newTakenStatus ? 0 : med.missed_count
            }
          : med
      )
    );
    
    if (newTakenStatus) {
      // Send confirmation notification
      await notificationService.sendMedicineTakenConfirmation(medicine.name);
      
      Alert.alert(
        '✅ İlaç Alındı',
        `${medicine.name} başarıyla işaretlendi.`,
        [{ text: 'Tamam' }]
      );
    } else {
      Alert.alert(
        'İlaç Durumu Güncellendi',
        'İlacınızın alınma durumu güncellendi.',
        [{ text: 'Tamam' }]
      );
    }
  };

  const checkAIInteraction = async () => {
    setAiLoading(true);
    setShowAIModal(true);
    
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const medicineList = dailyMedicines.map(med => med.name).join(', ');
      
      const response = await axios.post(`${BACKEND_URL}/api/chat`, {
        message: `Bu ilaçlar arasında etkileşim var mı? Lütfen detaylı açıkla: ${medicineList}`
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAiResponse(response.data.response || 'AI yanıtı alınamadı.');
    } catch (error) {
      console.error('AI interaction check error:', error);
      setAiResponse('İlaç etkileşimi kontrolü yapılırken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setAiLoading(false);
    }
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
      
      {/* Animated Header */}
      <Animated.View style={[styles.header, headerAnimation.animatedStyle]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>İlaçlarım</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={handleShowNotificationModal}
          >
            <MaterialIcons 
              name={notificationsEnabled ? "notifications" : "notifications-off"} 
              size={24} 
              color={notificationsEnabled ? theme.colors.strongTeal : theme.colors.textLight} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={handleShowAddModal}
          >
            <MaterialIcons name="add" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Animated Content */}
      <Animated.View style={[styles.contentContainer, contentAnimation.animatedStyle]}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Today's Medicines - Animated */}
        <View style={styles.todaySection}>
          <Text style={styles.sectionTitle}>Bugün</Text>
          
          {dailyMedicines.map((medicine, index) => (
            <Animated.View 
              key={medicine.id} 
              style={[styles.medicineCard, medicineCardsAnimation[index]]}
              entering={BounceIn.delay(index * 150)}
              layout={Layout.springify()}
            >
              <TouchableOpacity
                style={styles.medicineContent}
                onPress={() => toggleMedicineTaken(medicine.id)}
                activeOpacity={0.7}
              >
                <View style={styles.medicineInfo}>
                  <View style={styles.medicineNameRow}>
                    <Text style={styles.medicineName}>{medicine.name}</Text>
                    {medicine.notifications_enabled && notificationsEnabled && (
                      <Animated.View entering={FadeIn.delay(500)}>
                        <MaterialIcons name="notifications" size={16} color={theme.colors.strongTeal} />
                      </Animated.View>
                    )}
                  </View>
                  <View style={styles.medicineDetails}>
                    {medicine.time && (
                      <Text style={styles.medicineTime}>⏰ {medicine.time}</Text>
                    )}
                    {medicine.missed_count > 0 && (
                      <Animated.Text 
                        style={styles.missedCount}
                        entering={SlideInUp}
                      >
                        ❌ {medicine.missed_count} kaçırıldı
                      </Animated.Text>
                    )}
                    {medicine.last_taken && (
                      <Animated.Text 
                        style={styles.lastTaken}
                        entering={FadeIn.delay(300)}
                      >
                        ✅ Son: {new Date(medicine.last_taken).toLocaleTimeString('tr-TR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </Animated.Text>
                    )}
                  </View>
                </View>
                <Animated.View style={animatedPulseStyle}>
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
                </Animated.View>
              </TouchableOpacity>
              
              {/* Success Animation Overlay */}
              <Animated.View style={[styles.successOverlay, animatedSuccessStyle]}>
                <MaterialIcons name="check-circle" size={60} color={theme.colors.success} />
              </Animated.View>
            </Animated.View>
          ))}
        </View>

        {/* Drug Interactions Information */}
        <View style={styles.interactionsSection}>
          <Text style={styles.sectionTitle}>İlaç Etkileşimleri</Text>
          
          <View style={styles.interactionInfo}>
            <MaterialIcons 
              name={checkDrugInteractions() ? "warning" : "check-circle"} 
              size={24} 
              color={checkDrugInteractions() ? theme.colors.warning : theme.colors.success} 
            />
            <Text style={styles.interactionText}>
              {checkDrugInteractions() 
                ? "Dikkat: Mevcut ilaçlarınız arasında potansiyel etkileşim tespit edildi."
                : "Mevcut ilaçlarınız arasında bilinen etkileşim bulunmuyor."
              }
            </Text>
          </View>

          <TouchableOpacity style={styles.aiCheckButton} onPress={checkAIInteraction}>
            <MaterialIcons name="psychology" size={20} color="#FFFFFF" />
            <Text style={styles.aiCheckText}>Yapay Zekaya Sor</Text>
          </TouchableOpacity>
        </View>

        {/* Etkileşim Uyarısı - Alt tarafa taşındı */}
        {checkDrugInteractions() && (
          <View style={styles.warningSection}>
            <View style={styles.warningCard}>
              <MaterialIcons name="warning" size={20} color={theme.colors.warning} />
              <Text style={styles.warningText}>Etkileşim Uyarısı</Text>
            </View>
            <Text style={styles.warningDescription}>
              Tramadol ve Ondansetron birlikte kullanılırken dikkatli olunmalıdır. 
              Doktorunuzla görüşmeniz önerilir.
            </Text>
          </View>
        )}

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
      </Animated.View>

      {/* Add Medicine Modal - Animated */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="none"
      >
        <Animated.View style={[styles.modalBackdrop, modalStyle]}>
          <Animated.View style={[styles.modalContainer, modalStyle]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleHideAddModal}>
                <Text style={styles.modalCancel}>İptal</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Yeni İlaç Ekle</Text>
              <TouchableOpacity onPress={handleAddMedicine}>
                <Text style={styles.modalSave}>Kaydet</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>İlaç Adı *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Örn: Paracetamol"
                value={newMedicine.name}
                onChangeText={(text) => setNewMedicine({...newMedicine, name: text})}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Dozaj *</Text>
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

            <View style={styles.inputGroup}>
              <View style={styles.switchRow}>
                <Text style={styles.inputLabel}>Hatırlatma Bildirimleri</Text>
                <Switch
                  value={newMedicine.notifications_enabled}
                  onValueChange={(value) => setNewMedicine({...newMedicine, notifications_enabled: value})}
                  trackColor={{ false: theme.colors.border, true: theme.colors.strongTeal }}
                  thumbColor={newMedicine.notifications_enabled ? '#FFFFFF' : theme.colors.textLight}
                />
              </View>
              <Text style={styles.switchDescription}>
                Bu ilaç için belirtilen saatte bildirim alın
              </Text>
            </View>
          </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* AI Interaction Modal - Animated */}
      <Modal
        visible={showAIModal}
        transparent={true}
        animationType="none"
      >
        <Animated.View style={[styles.modalBackdrop, aiModalStyle]}>
          <Animated.View style={[styles.modalContainer, aiModalStyle]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleHideAIModal}>
                <Text style={styles.modalCancel}>Kapat</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>İlaç Etkileşim Analizi</Text>
              <View style={styles.placeholder} />
            </View>
            
            <ScrollView style={styles.modalContent}>
              {aiLoading ? (
                <Animated.View style={styles.loadingContainer} entering={FadeIn}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={styles.loadingText}>AI analiz yapıyor...</Text>
                </Animated.View>
              ) : (
                <Animated.Text style={styles.aiResponseText} entering={SlideInUp.delay(300)}>
                  {aiResponse}
                </Animated.Text>
              )}
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Notification Settings Modal - Animated */}
      <Modal
        visible={showNotificationModal}
        transparent={true}
        animationType="none"
      >
        <Animated.View style={[styles.modalBackdrop, notificationModalStyle]}>
          <Animated.View style={[styles.modalContainer, notificationModalStyle]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleHideNotificationModal}>
              <Text style={styles.modalCancel}>Kapat</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Bildirim Ayarları</Text>
            <View style={styles.placeholder} />
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.notificationSettingsCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <MaterialIcons name="notifications" size={24} color={theme.colors.strongTeal} />
                  <View style={styles.settingTextContainer}>
                    <Text style={styles.settingTitle}>İlaç Hatırlatmaları</Text>
                    <Text style={styles.settingDescription}>
                      İlaç alma saatlerinizde bildirim alın
                    </Text>
                  </View>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={toggleNotifications}
                  trackColor={{ false: theme.colors.border, true: theme.colors.strongTeal }}
                  thumbColor={notificationsEnabled ? '#FFFFFF' : theme.colors.textLight}
                />
              </View>
            </View>

            {notificationsEnabled && (
              <>
                <View style={styles.statisticsCard}>
                  <Text style={styles.statisticsTitle}>📊 Bildirim İstatistikleri</Text>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Aktif Hatırlatmalar:</Text>
                    <Text style={styles.statValue}>
                      {dailyMedicines.filter(m => m.notifications_enabled).length}
                    </Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Bugün Alınan İlaçlar:</Text>
                    <Text style={styles.statValue}>
                      {dailyMedicines.filter(m => m.taken).length}/{dailyMedicines.length}
                    </Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Kaçırılan İlaçlar:</Text>
                    <Text style={styles.statValue}>
                      {dailyMedicines.reduce((sum, m) => sum + (m.missed_count || 0), 0)}
                    </Text>
                  </View>
                </View>

                <View style={styles.tipsCard}>
                  <Text style={styles.tipsTitle}>💡 İpuçları</Text>
                  <Text style={styles.tipText}>• Hatırlatmaları kaçırmamak için telefonunuzun sesini açık tutun</Text>
                  <Text style={styles.tipText}>• İlaç aldığınızda bildirimi işaretlemeyi unutmayın</Text>
                  <Text style={styles.tipText}>• Kaçırılan ilaçlar için 30 dakika sonra tekrar hatırlatma alırsınız</Text>
                  <Text style={styles.tipText}>• Haftalık ilaç raporunu Pazartesi sabahları alırsınız</Text>
                </View>
              </>
            )}
          </ScrollView>
          </Animated.View>
        </Animated.View>
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
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    padding: 8,
    marginRight: 8,
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
  },
  contentContainer: {
    flex: 1,
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
  medicineContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  medicineInfo: {
    flex: 1,
  },
  medicineNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  medicineDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  medicineTime: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginRight: 12,
  },
  missedCount: {
    fontSize: 12,
    color: theme.colors.error,
    marginRight: 12,
  },
  lastTaken: {
    fontSize: 12,
    color: theme.colors.success,
  },
  checkboxEmpty: {
    padding: 4,
  },
  checkboxChecked: {
    padding: 4,
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
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
  interactionInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    padding: 12,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 12,
  },
  interactionText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  aiCheckButton: {
    backgroundColor: theme.colors.strongTeal,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  aiCheckText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Warning Section - Alt tarafa taşındı
  warningSection: {
    backgroundColor: '#FFF4E6',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.warning,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  warningText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.warning,
    marginLeft: 8,
  },
  warningDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  placeholder: {
    width: 40,
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  switchDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  aiResponseText: {
    fontSize: 16,
    color: theme.colors.text,
    lineHeight: 24,
    padding: 16,
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: 12,
  },

  // Notification Settings Modal Styles
  notificationSettingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  statisticsCard: {
    backgroundColor: theme.colors.lightBlue,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  statisticsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.strongTeal,
  },
  tipsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.info,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
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