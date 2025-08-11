import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../data/repositories/in_memory_medication_repository.dart';
import '../data/repositories/in_memory_mood_repository.dart';
import '../data/repositories/in_memory_symptom_repository.dart';
import '../data/repositories/in_memory_voice_repository.dart';
import '../data/services/mock_doctor_notification_service.dart';
import '../data/services/mock_speech_service.dart';
import '../domain/repositories/medication_repository.dart';
import '../domain/repositories/mood_repository.dart';
import '../domain/repositories/symptom_repository.dart';
import '../domain/repositories/voice_repository.dart';
import '../domain/services/doctor_notification_service.dart';
import '../domain/services/speech_service.dart';

/// Dependency injection container using Riverpod.
final medicationRepositoryProvider = Provider<MedicationRepository>((ref) {
  return InMemoryMedicationRepository();
});

final symptomRepositoryProvider = Provider<SymptomRepository>((ref) {
  return InMemorySymptomRepository();
});

final moodRepositoryProvider = Provider<MoodRepository>((ref) {
  return InMemoryMoodRepository();
});

final voiceRepositoryProvider = Provider<VoiceRepository>((ref) {
  return InMemoryVoiceRepository();
});

final speechServiceProvider = Provider<SpeechToTextService>((ref) {
  return MockSpeechToTextService();
});

final sentimentServiceProvider = Provider<SentimentService>((ref) {
  return MockSentimentService();
});

final doctorNotificationProvider =
    Provider<DoctorNotificationService>((ref) {
  return MockDoctorNotificationService();
});
