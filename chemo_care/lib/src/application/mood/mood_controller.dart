import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../../domain/models/mood_entry.dart';
import '../../domain/repositories/mood_repository.dart';
import '../providers.dart';

class MoodController extends StateNotifier<List<MoodEntry>> {
  MoodController(this._repo) : super([]) {
    _repo.watchMoods().listen((event) => state = event);
  }

  final MoodRepository _repo;

  Future<void> addMood(int mood) =>
      _repo.addEntry(MoodEntry(id: DateTime.now().toIso8601String(), mood: mood, date: DateTime.now()));
}

final moodControllerProvider =
    StateNotifierProvider<MoodController, List<MoodEntry>>((ref) {
  final repo = ref.watch(moodRepositoryProvider);
  return MoodController(repo);
});
