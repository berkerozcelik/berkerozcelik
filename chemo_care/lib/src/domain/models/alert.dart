import 'package:equatable/equatable.dart';

/// Alert generated when symptoms exceed thresholds.
class Alert extends Equatable {
  final String id;
  final String message;
  final String level; // red, yellow, green
  final DateTime date;

  const Alert(
      {required this.id, required this.message, required this.level, required this.date});

  factory Alert.fromMap(Map<String, dynamic> map, String id) => Alert(
        id: id,
        message: map['message'] ?? '',
        level: map['level'] ?? 'green',
        date: DateTime.tryParse(map['date'] ?? '') ?? DateTime.now(),
      );

  Map<String, dynamic> toMap() => {
        'message': message,
        'level': level,
        'date': date.toIso8601String(),
      };

  @override
  List<Object?> get props => [id, message, level, date];
}
