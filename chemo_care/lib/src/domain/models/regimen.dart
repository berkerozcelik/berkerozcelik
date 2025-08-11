import 'package:equatable/equatable.dart';

/// Represents a chemotherapy regimen with cycles and drugs.
class Regimen extends Equatable {
  final String id;
  final String name;
  final List<String> medications; // medication ids
  final DateTime startDate;

  const Regimen({
    required this.id,
    required this.name,
    required this.medications,
    required this.startDate,
  });

  factory Regimen.fromMap(Map<String, dynamic> map, String id) => Regimen(
        id: id,
        name: map['name'] ?? '',
        medications: List<String>.from(map['medications'] ?? []),
        startDate:
            DateTime.tryParse(map['startDate'] ?? '') ?? DateTime.now(),
      );

  Map<String, dynamic> toMap() => {
        'name': name,
        'medications': medications,
        'startDate': startDate.toIso8601String(),
      };

  @override
  List<Object?> get props => [id, name, medications, startDate];
}
