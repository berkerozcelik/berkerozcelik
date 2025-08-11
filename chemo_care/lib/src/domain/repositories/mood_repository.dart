import '../models/mood_entry.dart';

abstract class MoodRepository {
  Future<void> addEntry(MoodEntry entry);
  Stream<List<MoodEntry>> watchMoods();
}
