import 'dart:async';

import '../../domain/models/medication.dart';
import '../../domain/repositories/medication_repository.dart';

/// Simple in-memory repository used for examples and tests.
class InMemoryMedicationRepository implements MedicationRepository {
  final _controller = StreamController<List<Medication>>.broadcast();
  final List<Medication> _meds = [
    Medication(id: '1', name: 'Antiemetic', times: ['08:00', '20:00']),
    Medication(id: '2', name: 'Painkiller', times: ['12:00']),
  ];
  final Map<String, int> _taken = {};

  InMemoryMedicationRepository() {
    _controller.add(_meds);
  }

  @override
  Stream<List<Medication>> watchMedications() => _controller.stream;

  @override
  Future<void> markTaken(String medicationId, DateTime time) async {
    // In a real implementation we would persist taken time and update adherence.
    // For demo purposes we simply print and emit the same list.
    // ignore: avoid_print
    print('Medication $medicationId taken at $time');
    _taken.update(medicationId, (value) => value + 1, ifAbsent: () => 1);
    _controller.add(_meds);
  }

  int takenFor(String id) => _taken[id] ?? 0;
}
