import 'package:equatable/equatable.dart';

/// Symptom entry recorded by the patient with severity 0-10.
class SymptomEntry extends Equatable {
  final String id;
  final String type; // pain, fever, etc.
  final int level; // 0-10
  final DateTime date;

  const SymptomEntry(
      {required this.id, required this.type, required this.level, required this.date});

  factory SymptomEntry.fromMap(Map<String, dynamic> map, String id) =>
      SymptomEntry(
        id: id,
        type: map['type'] ?? '',
        level: (map['level'] ?? 0) as int,
        date: DateTime.tryParse(map['date'] ?? '') ?? DateTime.now(),
      );

  Map<String, dynamic> toMap() => {
        'type': type,
        'level': level,
        'date': date.toIso8601String(),
      };

  @override
  List<Object?> get props => [id, type, level, date];
}
