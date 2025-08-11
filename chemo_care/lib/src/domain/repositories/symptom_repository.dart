import '../models/symptom_entry.dart';

abstract class SymptomRepository {
  Future<void> addEntry(SymptomEntry entry);
  Stream<List<SymptomEntry>> watchEntries(String type);
}
