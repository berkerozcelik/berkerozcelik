import '../../domain/services/doctor_notification_service.dart';

/// Mock implementation that simply prints the message.
class MockDoctorNotificationService implements DoctorNotificationService {
  @override
  Future<void> sendMessage(String doctorId, String message) async {
    // ignore: avoid_print
    print('Notify doctor $doctorId: $message');
  }
}
