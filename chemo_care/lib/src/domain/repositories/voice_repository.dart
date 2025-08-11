import '../models/voice_note.dart';

abstract class VoiceRepository {
  Future<void> addVoiceNote(VoiceNote note);
  Stream<List<VoiceNote>> watchNotes();
}
