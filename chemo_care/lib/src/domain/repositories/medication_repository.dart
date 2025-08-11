import '../models/medication.dart';

/// Contract for medication data access.
abstract class MedicationRepository {
  Stream<List<Medication>> watchMedications();
  Future<void> markTaken(String medicationId, DateTime time);
}
