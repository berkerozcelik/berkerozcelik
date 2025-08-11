import 'package:equatable/equatable.dart';

/// Stores consent flags for KVKK/GDPR.
class Consent extends Equatable {
  final bool privacyAccepted;
  final bool dataShareAccepted;

  const Consent({required this.privacyAccepted, required this.dataShareAccepted});

  factory Consent.fromMap(Map<String, dynamic> map) => Consent(
        privacyAccepted: map['privacyAccepted'] ?? false,
        dataShareAccepted: map['dataShareAccepted'] ?? false,
      );

  Map<String, dynamic> toMap() => {
        'privacyAccepted': privacyAccepted,
        'dataShareAccepted': dataShareAccepted,
      };

  @override
  List<Object?> get props => [privacyAccepted, dataShareAccepted];
}
