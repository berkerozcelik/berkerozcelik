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
  Modal
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from './theme';

interface ExerciseProgram {
  id: string;
  name: string;
  description: string;
  duration: number; // minutes
  difficulty: 'kolay' | 'orta' | 'zor';
  exercises: Exercise[];
  completed: boolean;
}

interface Exercise {
  name: string;
  duration: number; // seconds
  description: string;
  icon: string;
}

export default function ExerciseApp() {
  const [programs, setPrograms] = useState<ExerciseProgram[]>([]);
  const [activeProgram, setActiveProgram] = useState<ExerciseProgram | null>(null);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showTipsModal, setShowTipsModal] = useState(false);

  const exercisePrograms: ExerciseProgram[] = [
    {
      id: '1',
      name: 'Sabah Başlangıç',
      description: 'Güne enerjik başlamak için hafif egzersizler',
      duration: 15,
      difficulty: 'kolay',
      completed: false,
      exercises: [
        {
          name: 'Derin Nefes Alma',
          duration: 60,
          description: 'Burnunuzdan derin nefes alın, ağzınızdan yavaşça verin',
          icon: 'air'
        },
        {
          name: 'Boyun Çevirme',
          duration: 45,
          description: 'Başınızı yavaşça sağa sola çevirin',
          icon: 'rotate-right'
        },
        {
          name: 'Kol Germe',
          duration: 60,
          description: 'Kollarınızı yukarı kaldırıp germe hareketi yapın',
          icon: 'accessibility'
        },
        {
          name: 'Hafif Yürüyüş',
          duration: 300,
          description: 'Yerinde ya da kısa mesafe yavaş tempoda yürüyün',
          icon: 'directions-walk'
        }
      ]
    },
    {
      id: '2',
      name: 'Güçlendirme',
      description: 'Kas gücünü artırmaya yönelik orta seviye egzersizler',
      duration: 25,
      difficulty: 'orta',
      completed: false,
      exercises: [
        {
          name: 'Duvar İtme',
          duration: 90,
          description: 'Duvara dayanıp yavaş şınav hareketleri yapın',
          icon: 'fitness-center'
        },
        {
          name: 'Sandalye Squat',
          duration: 120,
          description: 'Sandalyeye oturur gibi çömelme hareketi',
          icon: 'event-seat'
        },
        {
          name: 'Kol Kaldırma',
          duration: 90,
          description: 'Yan yatarak kollarınızı yukarı kaldırın',
          icon: 'trending-up'
        },
        {
          name: 'Denge Egzersizi',
          duration: 180,
          description: 'Tek ayak üzerinde durma egzersizi',
          icon: 'balance'
        }
      ]
    },
    {
      id: '3',
      name: 'Rahatlama',
      description: 'Kasları gevşetmek ve stresi azaltmak için',
      duration: 20,
      difficulty: 'kolay',
      completed: false,
      exercises: [
        {
          name: 'Yoga Nefes',
          duration: 180,
          description: 'Lotus pozisyonunda derin nefes egzersizleri',
          icon: 'self-improvement'
        },
        {
          name: 'Boyun Masajı',
          duration: 120,
          description: 'Parmaklarınızla boyun kaslarınızı masaj yapın',
          icon: 'spa'
        },
        {
          name: 'Bacak Germe',
          duration: 150,
          description: 'Oturarak bacak kaslarınızı gerin',
          icon: 'airline-seat-legroom-extra'
        },
        {
          name: 'Meditasyon',
          duration: 300,
          description: 'Gözlerinizi kapatıp nefes odaklı meditasyon',
          icon: 'psychology'
        }
      ]
    }
  ];

  const exerciseTips = [
    {
      title: 'Doktor Onayı',
      content: 'Egzersize başlamadan önce mutlaka doktorunuzla görüşün. Tedavi durumunuza göre uygun egzersiz programı belirleyin.',
      icon: 'medical-services'
    },
    {
      title: 'Yavaş Başlayın',
      content: 'Kademeli olarak artırın. Vücudunuzu zorlamamaya özen gösterin. Yorgunluk hissettiğinizde durun.',
      icon: 'speed'
    },
    {
      title: 'Hidrasyon',
      content: 'Egzersiz öncesi, sırası ve sonrasında bol su için. Dehidrasyondan kaçının.',
      icon: 'water-drop'
    },
    {
      title: 'Dinlenme',
      content: 'Egzersizler arasında yeterli dinlenme yapın. Vücudunuza zaman tanıyın.',
      icon: 'hotel'
    }
  ];

  useEffect(() => {
    setPrograms(exercisePrograms);
  }, []);

  useEffect(() => {
    let interval: any = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      handleExerciseComplete();
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const startProgram = (program: ExerciseProgram) => {
    setActiveProgram(program);
    setCurrentExercise(0);
    setTimeLeft(program.exercises[0].duration);
    setIsRunning(true);
  };

  const handleExerciseComplete = () => {
    if (!activeProgram) return;

    if (currentExercise < activeProgram.exercises.length - 1) {
      // Next exercise
      const nextExercise = currentExercise + 1;
      setCurrentExercise(nextExercise);
      setTimeLeft(activeProgram.exercises[nextExercise].duration);
    } else {
      // Program complete
      setIsRunning(false);
      const updatedPrograms = programs.map(p => 
        p.id === activeProgram.id 
          ? { ...p, completed: true }
          : p
      );
      setPrograms(updatedPrograms);
      
      Alert.alert(
        'Tebrikler! 🎉',
        'Egzersiz programını tamamladınız!',
        [
          {
            text: 'Tamam',
            onPress: () => {
              setActiveProgram(null);
              setCurrentExercise(0);
            }
          }
        ]
      );
    }
  };

  const pauseResume = () => {
    setIsRunning(!isRunning);
  };

  const stopProgram = () => {
    Alert.alert(
      'Egzersizi Durdur',
      'Egzersiz programını durdurmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Durdur',
          onPress: () => {
            setIsRunning(false);
            setActiveProgram(null);
            setCurrentExercise(0);
            setTimeLeft(0);
          }
        }
      ]
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'kolay': return theme.colors.success;
      case 'orta': return theme.colors.warning;
      case 'zor': return theme.colors.error;
      default: return theme.colors.textSecondary;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTodaysStats = () => {
    const completed = programs.filter(p => p.completed).length;
    const totalTime = programs
      .filter(p => p.completed)
      .reduce((sum, p) => sum + p.duration, 0);
    
    return { completed, totalTime };
  };

  const stats = getTodaysStats();

  if (activeProgram) {
    const currentEx = activeProgram.exercises[currentExercise];
    const progress = ((activeProgram.exercises[currentExercise].duration - timeLeft) / activeProgram.exercises[currentExercise].duration) * 100;

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor={theme.colors.exercise} barStyle="light-content" />
        
        <View style={styles.exerciseHeader}>
          <TouchableOpacity 
            style={styles.stopButton}
            onPress={stopProgram}
          >
            <MaterialIcons name="close" size={24} color={theme.colors.textInverse} />
          </TouchableOpacity>
          <Text style={styles.exerciseTitle}>{activeProgram.name}</Text>
          <View style={styles.exerciseProgress}>
            <Text style={styles.progressText}>
              {currentExercise + 1}/{activeProgram.exercises.length}
            </Text>
          </View>
        </View>

        <View style={styles.exerciseContent}>
          <View style={styles.exerciseIcon}>
            <MaterialIcons name={currentEx.icon as any} size={80} color={theme.colors.exercise} />
          </View>
          
          <Text style={styles.exerciseName}>{currentEx.name}</Text>
          <Text style={styles.exerciseDescription}>{currentEx.description}</Text>
          
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </View>
          
          <View style={styles.exerciseControls}>
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={pauseResume}
            >
              <MaterialIcons 
                name={isRunning ? 'pause' : 'play-arrow'} 
                size={32} 
                color={theme.colors.textInverse}
              />
            </TouchableOpacity>
            
            {currentExercise < activeProgram.exercises.length - 1 && (
              <TouchableOpacity 
                style={styles.skipButton}
                onPress={handleExerciseComplete}
              >
                <MaterialIcons name="skip-next" size={24} color={theme.colors.exercise} />
                <Text style={styles.skipText}>Geç</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={theme.colors.exercise} barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color={theme.colors.textInverse} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Egzersiz Programı</Text>
        <TouchableOpacity 
          style={styles.tipsButton}
          onPress={() => setShowTipsModal(true)}
        >
          <MaterialIcons name="info" size={24} color={theme.colors.textInverse} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Bugünkü İlerleme</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <MaterialIcons name="check-circle" size={32} color={theme.colors.success} />
              <Text style={styles.statValue}>{stats.completed}</Text>
              <Text style={styles.statLabel}>Tamamlanan</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name="timer" size={32} color={theme.colors.exercise} />
              <Text style={styles.statValue}>{stats.totalTime}</Text>
              <Text style={styles.statLabel}>Dakika</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name="local-fire-department" size={32} color={theme.colors.warning} />
              <Text style={styles.statValue}>{Math.round(stats.totalTime * 3.5)}</Text>
              <Text style={styles.statLabel}>Kalori</Text>
            </View>
          </View>
        </View>

        {/* Exercise Programs */}
        <Text style={styles.sectionTitle}>Egzersiz Programları</Text>
        
        {programs.map((program) => (
          <View key={program.id} style={styles.programCard}>
            <View style={styles.programHeader}>
              <View style={styles.programInfo}>
                <Text style={styles.programName}>{program.name}</Text>
                <Text style={styles.programDescription}>{program.description}</Text>
                
                <View style={styles.programMeta}>
                  <View style={styles.metaItem}>
                    <MaterialIcons name="schedule" size={16} color={theme.colors.textSecondary} />
                    <Text style={styles.metaText}>{program.duration} dk</Text>
                  </View>
                  
                  <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(program.difficulty) + '20' }]}>
                    <Text style={[styles.difficultyText, { color: getDifficultyColor(program.difficulty) }]}>
                      {program.difficulty.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
              
              {program.completed && (
                <MaterialIcons name="check-circle" size={24} color={theme.colors.success} />
              )}
            </View>
            
            <View style={styles.exerciseList}>
              {program.exercises.map((exercise, index) => (
                <View key={index} style={styles.exercisePreview}>
                  <MaterialIcons name={exercise.icon as any} size={20} color={theme.colors.textSecondary} />
                  <Text style={styles.exercisePreviewName}>{exercise.name}</Text>
                  <Text style={styles.exercisePreviewTime}>{formatTime(exercise.duration)}</Text>
                </View>
              ))}
            </View>
            
            <TouchableOpacity 
              style={[
                styles.startButton,
                program.completed && styles.startButtonCompleted
              ]}
              onPress={() => startProgram(program)}
            >
              <MaterialIcons 
                name={program.completed ? "replay" : "play-arrow"} 
                size={20} 
                color={theme.colors.textInverse}
              />
              <Text style={styles.startButtonText}>
                {program.completed ? 'Tekrar Yap' : 'Başla'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Motivation Card */}
        <View style={styles.motivationCard}>
          <MaterialIcons name="emoji-events" size={32} color={theme.colors.warning} />
          <View style={styles.motivationContent}>
            <Text style={styles.motivationTitle}>Harika gidiyorsun! 💪</Text>
            <Text style={styles.motivationText}>
              Düzenli egzersiz yapmak, tedavi sürecinde size güç verecek ve 
              iyileşmenizi hızlandıracaktır. Küçük adımlar büyük değişimler yaratır.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Tips Modal */}
      <Modal
        visible={showTipsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View />
            <Text style={styles.modalTitle}>Egzersiz Önerileri</Text>
            <TouchableOpacity onPress={() => setShowTipsModal(false)}>
              <Text style={styles.modalCancel}>Kapat</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            {exerciseTips.map((tip, index) => (
              <View key={index} style={styles.tipCard}>
                <View style={styles.tipHeader}>
                  <MaterialIcons name={tip.icon as any} size={24} color={theme.colors.exercise} />
                  <Text style={styles.tipTitle}>{tip.title}</Text>
                </View>
                <Text style={styles.tipContent}>{tip.content}</Text>
              </View>
            ))}
            
            <View style={styles.warningCard}>
              <MaterialIcons name="warning" size={24} color={theme.colors.warning} />
              <View style={styles.warningContent}>
                <Text style={styles.warningTitle}>Önemli Uyarı</Text>
                <Text style={styles.warningText}>
                  Kemoterapi veya radyoterapi aldığınız dönemlerde egzersiz yapmadan 
                  önce mutlaka onkoloji ekibinizle görüşün. Bazı durumlarda egzersiz 
                  kısıtlaması olabilir.
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
    backgroundColor: theme.colors.exercise,
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
    ...theme.typography.h2,
    marginTop: theme.spacing.sm,
  },
  statLabel: {
    ...theme.typography.caption,
    marginTop: theme.spacing.xs,
  },
  sectionTitle: {
    ...theme.typography.h3,
    marginBottom: theme.spacing.base,
    paddingHorizontal: theme.spacing.xs,
  },
  programCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.base,
    ...theme.shadows.sm,
  },
  programHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  programInfo: {
    flex: 1,
  },
  programName: {
    ...theme.typography.h4,
    marginBottom: theme.spacing.xs,
  },
  programDescription: {
    ...theme.typography.bodySecondary,
    marginBottom: theme.spacing.sm,
  },
  programMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    ...theme.typography.bodySecondary,
    marginLeft: theme.spacing.xs,
  },
  difficultyBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  difficultyText: {
    ...theme.typography.caption,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  exerciseList: {
    backgroundColor: theme.colors.backgroundSecondary,
    borderRadius: theme.borderRadius.base,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  exercisePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderLight,
  },
  exercisePreviewName: {
    ...theme.typography.body,
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  exercisePreviewTime: {
    ...theme.typography.bodySecondary,
  },
  startButton: {
    backgroundColor: theme.colors.exercise,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.base,
    borderRadius: theme.borderRadius.lg,
  },
  startButtonCompleted: {
    backgroundColor: theme.colors.success,
  },
  startButtonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
    marginLeft: theme.spacing.sm,
  },
  motivationCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.base,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning,
    ...theme.shadows.sm,
  },
  motivationContent: {
    flex: 1,
    marginLeft: theme.spacing.base,
  },
  motivationTitle: {
    ...theme.typography.h4,
    marginBottom: theme.spacing.xs,
  },
  motivationText: {
    ...theme.typography.bodySecondary,
  },
  
  // Exercise Screen Styles
  exerciseHeader: {
    backgroundColor: theme.colors.exercise,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.md,
    paddingTop: theme.spacing['4xl'],
  },
  stopButton: {
    padding: theme.spacing.sm,
  },
  exerciseTitle: {
    ...theme.typography.h3,
    color: theme.colors.textInverse,
  },
  exerciseProgress: {
    padding: theme.spacing.sm,
  },
  progressText: {
    ...theme.typography.bodySecondary,
    color: theme.colors.textInverse,
  },
  exerciseContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  exerciseIcon: {
    marginBottom: theme.spacing.xl,
  },
  exerciseName: {
    ...theme.typography.h2,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  exerciseDescription: {
    ...theme.typography.body,
    textAlign: 'center',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing['2xl'],
    paddingHorizontal: theme.spacing.xl,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing['2xl'],
  },
  timerText: {
    fontSize: 48,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.exercise,
    marginBottom: theme.spacing.lg,
  },
  progressBar: {
    width: 200,
    height: 6,
    backgroundColor: theme.colors.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.exercise,
  },
  exerciseControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xl,
  },
  controlButton: {
    backgroundColor: theme.colors.exercise,
    borderRadius: 40,
    padding: theme.spacing.lg,
    ...theme.shadows.base,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.sm,
  },
  skipText: {
    ...theme.typography.body,
    color: theme.colors.exercise,
    marginLeft: theme.spacing.xs,
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
  modalContent: {
    flex: 1,
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