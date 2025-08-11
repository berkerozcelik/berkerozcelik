import 'dart:async';

import '../../domain/models/mood_entry.dart';
import '../../domain/repositories/mood_repository.dart';

class InMemoryMoodRepository implements MoodRepository {
  final _controller = StreamController<List<MoodEntry>>.broadcast();
  final List<MoodEntry> _moods = [];

  @override
  Future<void> addEntry(MoodEntry entry) async {
    _moods.add(entry);
    _controller.add(List.unmodifiable(_moods));
  }

  @override
  Stream<List<MoodEntry>> watchMoods() => _controller.stream;
}
