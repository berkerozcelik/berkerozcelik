import 'package:equatable/equatable.dart';

/// Represents a recorded voice note with transcription and sentiment.
class VoiceNote extends Equatable {
  final String id;
  final String text;
  final double sentiment; // -1 to 1
  final DateTime date;

  const VoiceNote(
      {required this.id, required this.text, required this.sentiment, required this.date});

  factory VoiceNote.fromMap(Map<String, dynamic> map, String id) => VoiceNote(
        id: id,
        text: map['text'] ?? '',
        sentiment: (map['sentiment'] ?? 0.0).toDouble(),
        date: DateTime.tryParse(map['date'] ?? '') ?? DateTime.now(),
      );

  Map<String, dynamic> toMap() => {
        'text': text,
        'sentiment': sentiment,
        'date': date.toIso8601String(),
      };

  @override
  List<Object?> get props => [id, text, sentiment, date];
}
