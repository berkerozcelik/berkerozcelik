import 'package:equatable/equatable.dart';

/// Represents a sharing permission for doctor access.
class ShareLink extends Equatable {
  final String id;
  final String doctorId;
  final DateTime createdAt;

  const ShareLink({required this.id, required this.doctorId, required this.createdAt});

  factory ShareLink.fromMap(Map<String, dynamic> map, String id) => ShareLink(
        id: id,
        doctorId: map['doctorId'] ?? '',
        createdAt:
            DateTime.tryParse(map['createdAt'] ?? '') ?? DateTime.now(),
      );

  Map<String, dynamic> toMap() => {
        'doctorId': doctorId,
        'createdAt': createdAt.toIso8601String(),
      };

  @override
  List<Object?> get props => [id, doctorId, createdAt];
}
