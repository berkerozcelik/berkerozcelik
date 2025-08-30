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

interface NutritionEntry {
  id: string;
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portion: string;
  meal_type: string;
  date: string;
}

export default function Nutrition() {
  const [entries, setEntries] = useState<NutritionEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [newEntry, setNewEntry] = useState({
    food_name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    portion: '',
    meal_type: 'breakfast'
  });

  const mealTypes = [
    { label: 'Kahvaltı', value: 'breakfast', icon: 'free-breakfast' },
    { label: 'Öğle Yemeği', value: 'lunch', icon: 'lunch-dining' },
    { label: 'Akşam Yemeği', value: 'dinner', icon: 'dinner-dining' },
    { label: 'Atıştırmalık', value: 'snack', icon: 'local-cafe' }
  ];

  const nutritionTips = [
    {
      title: 'Protein Alımı',
      content: 'Günde vücut ağırlığınızın kg başına 1.2-1.5g protein almaya özen gösterin. Balık, tavuk, yumurta, baklagiller tercih edin.',
      icon: 'restaurant'
    },
    {
      title: 'Antioksidan Besinler',
      content: 'Renkli sebze ve meyveler tüketin. Brokoli, ıspanak, havuç, böğürtlen, nar gibi besinler bağışıklığı güçlendirir.',
      icon: 'eco'
    },
    {
      title: 'Hidrasyon',
      content: 'Günde en az 8-10 bardak su için. Mide bulantısı varsa küçük yudumlarda ve sık sık su alın.',
      icon: 'water-drop'
    },
    {
      title: 'Kaçınılacaklar',
      content: 'İşlenmiş gıdalar, aşırı yağlı ve şekerli besinlerden kaçının. Alkol tüketimini sınırlayın.',
      icon: 'do-not-disturb'
    }
  ];

  const commonFoods = [
    { name: 'Tavuk Göğsü (100g)', calories: 165, protein: 31, carbs: 0, fat: 3.6 },
    { name: 'Somon (100g)', calories: 208, protein: 20, carbs: 0, fat: 13 },
    { name: 'Yumurta (1 adet)', calories: 70, protein: 6, carbs: 0.6, fat: 5 },
    { name: 'Pirinç (1 porsiyon)', calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
    { name: 'Brokoli (100g)', calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
    { name: 'Avokado (1/2 adet)', calories: 160, protein: 2, carbs: 9, fat: 15 },
    { name: 'Badem (30g)', calories: 170, protein: 6, carbs: 6, fat: 15 },
    { name: 'Yoğurt (1 kase)', calories: 100, protein: 10, carbs: 12, fat: 0 }
  ];

  useEffect(() => {
    // Since we don't have a nutrition API endpoint, we'll use sample data
    setSampleData();
  }, []);

  const setSampleData = () => {
    const today = new Date().toISOString().split('T')[0];
    const sampleEntries: NutritionEntry[] = [
      {
        id: '1',
        food_name: 'Yulaf Ezmesi',
        calories: 150,
        protein: 5,
        carbs: 27,
        fat: 3,
        portion: '1 kase',
        meal_type: 'breakfast',
        date: today
      },
      {
        id: '2',
        food_name: 'Tavuk Salatası',
        calories: 300,
        protein: 25,
        carbs: 10,
        fat: 18,
        portion: '1 porsiyon',
        meal_type: 'lunch',
        date: today
      }
    ];
    setEntries(sampleEntries);
  };

  const handleAddEntry = async () => {
    if (!newEntry.food_name || !newEntry.calories) {
      Alert.alert('Hata', 'En az besin adı ve kalori bilgisi girilmelidir');
      return;
    }

    const entry: NutritionEntry = {
      id: Date.now().toString(),
      food_name: newEntry.food_name,
      calories: parseFloat(newEntry.calories) || 0,
      protein: parseFloat(newEntry.protein) || 0,
      carbs: parseFloat(newEntry.carbs) || 0,
      fat: parseFloat(newEntry.fat) || 0,
      portion: newEntry.portion || '1 porsiyon',
      meal_type: newEntry.meal_type,
      date: new Date().toISOString().split('T')[0]
    };

    setEntries(prev => [...prev, entry]);
    setShowAddModal(false);
    setNewEntry({
      food_name: '',
      calories: '',
      protein: '',
      carbs: '',
      fat: '',
      portion: '',
      meal_type: 'breakfast'
    });
    
    Alert.alert('Başarılı', 'Besin kaydı eklendi');
  };

  const selectCommonFood = (food: any) => {
    setNewEntry({
      ...newEntry,
      food_name: food.name,
      calories: food.calories.toString(),
      protein: food.protein.toString(),
      carbs: food.carbs.toString(),
      fat: food.fat.toString(),
      portion: '1 porsiyon'
    });
  };

  const getTodaysStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaysEntries = entries.filter(entry => entry.date === today);
    
    return todaysEntries.reduce((stats, entry) => ({
      calories: stats.calories + entry.calories,
      protein: stats.protein + entry.protein,
      carbs: stats.carbs + entry.carbs,
      fat: stats.fat + entry.fat
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  const getEntriesByMeal = (mealType: string) => {
    const today = new Date().toISOString().split('T')[0];
    return entries.filter(entry => entry.date === today && entry.meal_type === mealType);
  };

  const stats = getTodaysStats();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={theme.colors.nutrition} barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.textInverse} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Beslenme Takibi</Text>
        <TouchableOpacity 
          style={styles.tipsButton}
          onPress={() => setShowTipsModal(true)}
        >
          <MaterialIcons name="lightbulb" size={24} color={theme.colors.textInverse} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Daily Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Bugünkü Beslenme</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{Math.round(stats.calories)}</Text>
              <Text style={styles.statLabel}>Kalori</Text>
              <MaterialIcons name="local-fire-department" size={20} color={theme.colors.nutrition} />
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{Math.round(stats.protein)}g</Text>
              <Text style={styles.statLabel}>Protein</Text>
              <MaterialIcons name="fitness-center" size={20} color={theme.colors.info} />
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{Math.round(stats.carbs)}g</Text>
              <Text style={styles.statLabel}>Karbonhidrat</Text>
              <MaterialIcons name="grain" size={20} color={theme.colors.warning} />
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{Math.round(stats.fat)}g</Text>
              <Text style={styles.statLabel}>Yağ</Text>
              <MaterialIcons name="opacity" size={20} color={theme.colors.success} />
            </View>
          </View>
        </View>

        {/* Add Food Button */}
        <TouchableOpacity 
          style={styles.addFoodButton}
          onPress={() => setShowAddModal(true)}
        >
          <MaterialIcons name="create" size={24} color={theme.colors.nutrition} />
          <Text style={styles.addFoodText}>Besin Ekle</Text>
        </TouchableOpacity>

        {/* Meals */}
        {mealTypes.map((mealType) => {
          const mealEntries = getEntriesByMeal(mealType.value);
          const mealCalories = mealEntries.reduce((sum, entry) => sum + entry.calories, 0);
          
          return (
            <View key={mealType.value} style={styles.mealCard}>
              <View style={styles.mealHeader}>
                <View style={styles.mealInfo}>
                  <MaterialIcons name={mealType.icon as any} size={24} color={theme.colors.nutrition} />
                  <Text style={styles.mealTitle}>{mealType.label}</Text>
                </View>
                <Text style={styles.mealCalories}>{Math.round(mealCalories)} kcal</Text>
              </View>
              
              {mealEntries.length === 0 ? (
                <Text style={styles.emptyMealText}>Henüz besin eklenmemiş</Text>
              ) : (
                mealEntries.map((entry) => (
                  <View key={entry.id} style={styles.foodEntry}>
                    <View style={styles.foodInfo}>
                      <Text style={styles.foodName}>{entry.food_name}</Text>
                      <Text style={styles.foodPortion}>{entry.portion}</Text>
                    </View>
                    <View style={styles.foodStats}>
                      <Text style={styles.foodCalories}>{entry.calories} kcal</Text>
                      <View style={styles.macros}>
                        <Text style={styles.macroText}>P: {entry.protein}g</Text>
                        <Text style={styles.macroText}>K: {entry.carbs}g</Text>
                        <Text style={styles.macroText}>Y: {entry.fat}g</Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          );
        })}

        {/* Hydration Reminder */}
        <View style={styles.hydrationCard}>
          <MaterialIcons name="water-drop" size={32} color={theme.colors.info} />
          <View style={styles.hydrationContent}>
            <Text style={styles.hydrationTitle}>Su Takibi</Text>
            <Text style={styles.hydrationText}>
              Günde en az 8-10 bardak su içmeyi unutmayın. 
              Kemoterapi sırasında hidrasyon çok önemlidir.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Add Food Modal */}
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
            <Text style={styles.modalTitle}>Besin Ekle</Text>
            <TouchableOpacity onPress={handleAddEntry}>
              <Text style={styles.modalSave}>Kaydet</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {/* Common Foods */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Hızlı Seçim</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {commonFoods.map((food, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.commonFoodChip}
                    onPress={() => selectCommonFood(food)}
                  >
                    <Text style={styles.commonFoodText}>{food.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Besin Adı *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Örn: Tavuk Göğsü"
                value={newEntry.food_name}
                onChangeText={(text) => setNewEntry({...newEntry, food_name: text})}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Porsiyon</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Örn: 100g, 1 adet, 1 kase"
                value={newEntry.portion}
                onChangeText={(text) => setNewEntry({...newEntry, portion: text})}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Öğün</Text>
              <View style={styles.mealTypeGrid}>
                {mealTypes.map((meal) => (
                  <TouchableOpacity
                    key={meal.value}
                    style={[
                      styles.mealTypeChip,
                      newEntry.meal_type === meal.value && styles.mealTypeChipSelected
                    ]}
                    onPress={() => setNewEntry({...newEntry, meal_type: meal.value})}
                  >
                    <MaterialIcons 
                      name={meal.icon as any} 
                      size={20} 
                      color={newEntry.meal_type === meal.value ? theme.colors.textInverse : theme.colors.nutrition}
                    />
                    <Text
                      style={[
                        styles.mealTypeText,
                        newEntry.meal_type === meal.value && styles.mealTypeTextSelected
                      ]}
                    >
                      {meal.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.nutritionInputs}>
              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, {flex: 1, marginRight: 8}]}>
                  <Text style={styles.inputLabel}>Kalori *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="150"
                    value={newEntry.calories}
                    onChangeText={(text) => setNewEntry({...newEntry, calories: text})}
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={[styles.inputGroup, {flex: 1, marginLeft: 8}]}>
                  <Text style={styles.inputLabel}>Protein (g)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="20"
                    value={newEntry.protein}
                    onChangeText={(text) => setNewEntry({...newEntry, protein: text})}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              
              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, {flex: 1, marginRight: 8}]}>
                  <Text style={styles.inputLabel}>Karbonhidrat (g)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="30"
                    value={newEntry.carbs}
                    onChangeText={(text) => setNewEntry({...newEntry, carbs: text})}
                    keyboardType="numeric"
                  />
                </View>
                
                <View style={[styles.inputGroup, {flex: 1, marginLeft: 8}]}>
                  <Text style={styles.inputLabel}>Yağ (g)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="10"
                    value={newEntry.fat}
                    onChangeText={(text) => setNewEntry({...newEntry, fat: text})}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Nutrition Tips Modal */}
      <Modal
        visible={showTipsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View />
            <Text style={styles.modalTitle}>Beslenme Önerileri</Text>
            <TouchableOpacity onPress={() => setShowTipsModal(false)}>
              <Text style={styles.modalCancel}>Kapat</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {nutritionTips.map((tip, index) => (
              <View key={index} style={styles.tipCard}>
                <View style={styles.tipHeader}>
                  <MaterialIcons name={tip.icon as any} size={24} color={theme.colors.nutrition} />
                  <Text style={styles.tipTitle}>{tip.title}</Text>
                </View>
                <Text style={styles.tipContent}>{tip.content}</Text>
              </View>
            ))}
            
            <View style={styles.warningCard}>
              <MaterialIcons name="warning" size={24} color={theme.colors.warning} />
              <View style={styles.warningContent}>
                <Text style={styles.warningTitle}>Önemli Not</Text>
                <Text style={styles.warningText}>
                  Bu öneriler genel sağlık önerileridir. Kemoterapi veya radyoterapi 
                  sürecinde mutlaka doktorunuz ve diyetisyeninizle görüşerek 
                  kişiselleştirilmiş beslenme planı oluşturun.
                </Text>
              </View>
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
  header: {
    backgroundColor: theme.colors.nutrition,
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
  tipsButton: {
    padding: theme.spacing.sm,
  },
  content: {
    flex: 1,
    padding: theme.spacing.base,
  },
  statsCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.base,
    ...theme.shadows.sm,
  },
  statsTitle: {
    ...theme.typography.h4,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...theme.typography.h3,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    ...theme.typography.caption,
    marginBottom: theme.spacing.xs,
  },
  addFoodButton: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.base,
    marginBottom: theme.spacing.base,
    borderWidth: 2,
    borderColor: theme.colors.nutrition,
    borderStyle: 'dashed',
  },
  addFoodText: {
    ...theme.typography.body,
    marginLeft: theme.spacing.sm,
    color: theme.colors.nutrition,
    fontWeight: theme.typography.fontWeight.medium,
  },
  mealCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.base,
    ...theme.shadows.sm,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  mealInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mealTitle: {
    ...theme.typography.h4,
    marginLeft: theme.spacing.sm,
  },
  mealCalories: {
    ...theme.typography.body,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.nutrition,
  },
  emptyMealText: {
    ...theme.typography.bodySecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: theme.spacing.md,
  },
  foodEntry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    ...theme.typography.body,
    fontWeight: theme.typography.fontWeight.medium,
  },
  foodPortion: {
    ...theme.typography.bodySecondary,
    marginTop: theme.spacing.xs,
  },
  foodStats: {
    alignItems: 'flex-end',
  },
  foodCalories: {
    ...theme.typography.body,
    fontWeight: theme.typography.fontWeight.medium,
  },
  macros: {
    flexDirection: 'row',
    marginTop: theme.spacing.xs,
  },
  macroText: {
    ...theme.typography.caption,
    marginLeft: theme.spacing.sm,
  },
  hydrationCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.base,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.info,
    ...theme.shadows.sm,
  },
  hydrationContent: {
    flex: 1,
    marginLeft: theme.spacing.base,
  },
  hydrationTitle: {
    ...theme.typography.h4,
    marginBottom: theme.spacing.xs,
  },
  hydrationText: {
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
    color: theme.colors.nutrition,
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
  commonFoodChip: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.base,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  commonFoodText: {
    ...theme.typography.bodySecondary,
    fontSize: theme.typography.fontSize.sm,
  },
  mealTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  mealTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.base,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minWidth: '48%',
  },
  mealTypeChipSelected: {
    backgroundColor: theme.colors.nutrition,
    borderColor: theme.colors.nutrition,
  },
  mealTypeText: {
    ...theme.typography.bodySecondary,
    marginLeft: theme.spacing.sm,
  },
  mealTypeTextSelected: {
    color: theme.colors.textInverse,
    fontWeight: theme.typography.fontWeight.medium,
  },
  nutritionInputs: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.base,
  },
  tipCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.base,
    ...theme.shadows.sm,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  tipTitle: {
    ...theme.typography.h4,
    marginLeft: theme.spacing.sm,
  },
  tipContent: {
    ...theme.typography.body,
  },
  warningCard: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning,
  },
  warningContent: {
    flex: 1,
    marginLeft: theme.spacing.base,
  },
  warningTitle: {
    ...theme.typography.body,
    fontWeight: theme.typography.fontWeight.semibold,
    marginBottom: theme.spacing.xs,
  },
  warningText: {
    ...theme.typography.bodySecondary,
  },
});