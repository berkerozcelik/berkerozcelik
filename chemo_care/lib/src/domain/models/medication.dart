import 'package:equatable/equatable.dart';

/// Represents a medication with schedule for reminders.
class Medication extends Equatable {
  final String id;
  final String name;
  final List<String> times; // HH:mm strings

  const Medication({required this.id, required this.name, required this.times});

  factory Medication.fromMap(Map<String, dynamic> map, String id) => Medication(
        id: id,
        name: map['name'] ?? '',
        times: List<String>.from(map['times'] ?? []),
      );

  Map<String, dynamic> toMap() => {
        'name': name,
        'times': times,
      };

  @override
  List<Object?> get props => [id, name, times];
}
