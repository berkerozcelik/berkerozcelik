/// Sends notifications to doctor when patient asks a question.
abstract class DoctorNotificationService {
  Future<void> sendMessage(String doctorId, String message);
}
