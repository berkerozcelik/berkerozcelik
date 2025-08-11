import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../../domain/models/medication.dart';
import '../../domain/repositories/medication_repository.dart';
import '../providers.dart';

/// Exposes medications and actions to mark them as taken.
class MedicationController extends StateNotifier<AsyncValue<List<Medication>>> {
  MedicationController(this._repo) : super(const AsyncValue.loading()) {
    _subscription = _repo.watchMedications().listen((event) {
      state = AsyncValue.data(event);
    });
  }

  final MedicationRepository _repo;
  late final StreamSubscription _subscription;

  Future<void> markTaken(String id) =>
      _repo.markTaken(id, DateTime.now());

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }
}

final medicationControllerProvider = StateNotifierProvider<MedicationController,
    AsyncValue<List<Medication>>>((ref) {
  final repo = ref.watch(medicationRepositoryProvider);
  return MedicationController(repo);
});
