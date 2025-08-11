import 'package:equatable/equatable.dart';

/// Represents a user of the app: patient, caregiver or doctor.
class User extends Equatable {
  final String id;
  final String email;
  final String role; // patient, caregiver, doctor

  const User({required this.id, required this.email, required this.role});

  factory User.fromMap(Map<String, dynamic> map, String id) =>
      User(id: id, email: map['email'] ?? '', role: map['role'] ?? 'patient');

  Map<String, dynamic> toMap() => {
        'email': email,
        'role': role,
      };

  @override
  List<Object?> get props => [id, email, role];
}
