import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../../domain/models/symptom_entry.dart';
import '../../domain/repositories/symptom_repository.dart';
import '../providers.dart';

class SymptomController extends StateNotifier<List<SymptomEntry>> {
  SymptomController(this._repo, this.type) : super([]) {
    _repo.watchEntries(type).listen((event) => state = event);
  }

  final SymptomRepository _repo;
  final String type;

  Future<void> addEntry(int level) => _repo.addEntry(SymptomEntry(
        id: DateTime.now().toIso8601String(),
        type: type,
        level: level,
        date: DateTime.now(),
      ));
}

final painSymptomProvider =
    StateNotifierProvider<SymptomController, List<SymptomEntry>>((ref) {
  final repo = ref.watch(symptomRepositoryProvider);
  return SymptomController(repo, 'pain');
});
