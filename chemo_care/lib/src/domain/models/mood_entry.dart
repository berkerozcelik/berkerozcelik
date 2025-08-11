import 'package:equatable/equatable.dart';

/// Mood entry recorded with an optional note.
class MoodEntry extends Equatable {
  final String id;
  final int mood; // -5 sad to +5 happy
  final DateTime date;

  const MoodEntry({required this.id, required this.mood, required this.date});

  factory MoodEntry.fromMap(Map<String, dynamic> map, String id) => MoodEntry(
        id: id,
        mood: (map['mood'] ?? 0) as int,
        date: DateTime.tryParse(map['date'] ?? '') ?? DateTime.now(),
      );

  Map<String, dynamic> toMap() => {
        'mood': mood,
        'date': date.toIso8601String(),
      };

  @override
  List<Object?> get props => [id, mood, date];
}
