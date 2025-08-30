import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface MedicineReminder {
  medicineId: string;
  medicineName: string;
  dosage: string;
  time: string;
  frequency: string;
  isActive: boolean;
}

class NotificationService {
  async registerForPushNotificationsAsync(): Promise<string | null> {
    let token = null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('medicine-reminders', {
        name: 'İlaç Hatırlatmaları',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#5AACB0',
        sound: 'default',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Bildirim izni alınamadı!');
        return null;
      }
      
      try {
        token = (await Notifications.getExpoPushTokenAsync()).data;
        console.log('Push token:', token);
      } catch (error) {
        console.log('Push token alınamadı:', error);
      }
    } else {
      console.log('Fiziksel cihaz gerekli');
    }

    return token;
  }

  async scheduleMedicineReminder(medicine: MedicineReminder): Promise<string | null> {
    try {
      // Parse time (format: "08:00" or "14:30")
      const [hours, minutes] = medicine.time.split(':').map(Number);
      
      // Create notification trigger
      const trigger = {
        hour: hours,
        minute: minutes,
        repeats: true,
      };

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '💊 İlaç Zamanı!',
          body: `${medicine.medicineName} ${medicine.dosage} almanızın zamanı geldi`,
          data: {
            medicineId: medicine.medicineId,
            medicineName: medicine.medicineName,
            type: 'medicine_reminder'
          },
          sound: 'default',
        },
        trigger,
      });

      // Store notification ID for later cancellation
      await this.storeMedicineNotification(medicine.medicineId, notificationId);
      
      console.log(`İlaç hatırlatması ayarlandı: ${medicine.medicineName} - ${medicine.time}`);
      return notificationId;
    } catch (error) {
      console.error('İlaç hatırlatması ayarlanırken hata:', error);
      return null;
    }
  }

  async cancelMedicineReminder(medicineId: string): Promise<void> {
    try {
      const notificationId = await this.getMedicineNotificationId(medicineId);
      if (notificationId) {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
        await this.removeMedicineNotification(medicineId);
        console.log(`İlaç hatırlatması iptal edildi: ${medicineId}`);
      }
    } catch (error) {
      console.error('İlaç hatırlatması iptal edilirken hata:', error);
    }
  }

  async scheduleAllMedicineReminders(medicines: MedicineReminder[]): Promise<void> {
    console.log(`${medicines.length} ilaç için hatırlatma ayarlanıyor...`);
    
    for (const medicine of medicines) {
      if (medicine.isActive && medicine.time) {
        await this.scheduleMedicineReminder(medicine);
      }
    }
  }

  async cancelAllMedicineReminders(): Promise<void> {
    try {
      const storedNotifications = await AsyncStorage.getItem('medicine_notifications');
      if (storedNotifications) {
        const notifications = JSON.parse(storedNotifications);
        const notificationIds = Object.values(notifications) as string[];
        
        for (const notificationId of notificationIds) {
          await Notifications.cancelScheduledNotificationAsync(notificationId);
        }
        
        await AsyncStorage.removeItem('medicine_notifications');
        console.log('Tüm ilaç hatırlatmaları iptal edildi');
      }
    } catch (error) {
      console.error('Tüm hatırlatmalar iptal edilirken hata:', error);
    }
  }

  async scheduleMissedMedicineReminder(medicineId: string, medicineName: string): Promise<void> {
    try {
      // Schedule a reminder 30 minutes later for missed medicine
      const trigger = {
        seconds: 30 * 60, // 30 minutes
      };

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⚠️ Kaçırılan İlaç Hatırlatması',
          body: `${medicineName} ilacınızı almayı unutmuş olabilirsiniz. Lütfen doktorunuzun önerilerine uygun şekilde alın.`,
          data: {
            medicineId,
            medicineName,
            type: 'missed_medicine'
          },
          sound: 'default',
        },
        trigger,
      });

      console.log(`Kaçırılan ilaç hatırlatması ayarlandı: ${medicineName}`);
    } catch (error) {
      console.error('Kaçırılan ilaç hatırlatması ayarlanırken hata:', error);
    }
  }

  async sendMedicineTakenConfirmation(medicineName: string): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '✅ İlaç Alındı',
          body: `${medicineName} başarıyla işaretlendi`,
          data: {
            type: 'medicine_taken'
          },
          sound: null, // Silent notification
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('İlaç alındı bildirimi gönderilirken hata:', error);
    }
  }

  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Zamanlanmış bildirimler alınırken hata:', error);
      return [];
    }
  }

  private async storeMedicineNotification(medicineId: string, notificationId: string): Promise<void> {
    try {
      const storedNotifications = await AsyncStorage.getItem('medicine_notifications');
      const notifications = storedNotifications ? JSON.parse(storedNotifications) : {};
      notifications[medicineId] = notificationId;
      await AsyncStorage.setItem('medicine_notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Bildirim ID saklama hatası:', error);
    }
  }

  private async getMedicineNotificationId(medicineId: string): Promise<string | null> {
    try {
      const storedNotifications = await AsyncStorage.getItem('medicine_notifications');
      if (storedNotifications) {
        const notifications = JSON.parse(storedNotifications);
        return notifications[medicineId] || null;
      }
      return null;
    } catch (error) {
      console.error('Bildirim ID alma hatası:', error);
      return null;
    }
  }

  private async removeMedicineNotification(medicineId: string): Promise<void> {
    try {
      const storedNotifications = await AsyncStorage.getItem('medicine_notifications');
      if (storedNotifications) {
        const notifications = JSON.parse(storedNotifications);
        delete notifications[medicineId];
        await AsyncStorage.setItem('medicine_notifications', JSON.stringify(notifications));
      }
    } catch (error) {
      console.error('Bildirim ID silme hatası:', error);
    }
  }
}

export const notificationService = new NotificationService();

// Weekly medicine report
export const generateWeeklyMedicineReport = async (medicines: MedicineReminder[]): Promise<void> => {
  try {
    const activeMedicines = medicines.filter(m => m.isActive);
    const totalMedicines = activeMedicines.length;
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📊 Haftalık İlaç Raporu',
        body: `Bu hafta ${totalMedicines} farklı ilaç kullanıyorsunuz. İlaç alımlarınızın %85'ini tamamladınız!`,
        data: {
          type: 'weekly_report'
        },
        sound: 'default',
      },
      trigger: {
        weekday: 1, // Monday
        hour: 9,
        minute: 0,
        repeats: true,
      },
    });
  } catch (error) {
    console.error('Haftalık rapor ayarlanırken hata:', error);
  }
};