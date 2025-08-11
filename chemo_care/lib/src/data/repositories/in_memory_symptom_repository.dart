import 'dart:async';

import '../../domain/models/symptom_entry.dart';
import '../../domain/repositories/symptom_repository.dart';

class InMemorySymptomRepository implements SymptomRepository {
  final _controller = StreamController<List<SymptomEntry>>.broadcast();
  final List<SymptomEntry> _entries = [];

  @override
  Future<void> addEntry(SymptomEntry entry) async {
    _entries.add(entry);
    _controller.add(List.unmodifiable(_entries));
  }

  @override
  Stream<List<SymptomEntry>> watchEntries(String type) =>
      _controller.stream.map((e) => e.where((el) => el.type == type).toList());
}
