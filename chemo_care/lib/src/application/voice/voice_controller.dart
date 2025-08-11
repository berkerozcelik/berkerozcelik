import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../../domain/models/voice_note.dart';
import '../../domain/repositories/voice_repository.dart';
import '../../domain/services/speech_service.dart';
import '../providers.dart';

class VoiceController extends StateNotifier<List<VoiceNote>> {
  VoiceController(this._repo, this._speech, this._sentiment) : super([]) {
    _repo.watchNotes().listen((event) => state = event);
  }

  final VoiceRepository _repo;
  final SpeechToTextService _speech;
  final SentimentService _sentiment;

  Future<void> record() async {
    final text = await _speech.recordAndTranscribe();
    final sentiment = await _sentiment.analyze(text);
    final note = VoiceNote(
        id: DateTime.now().toIso8601String(),
        text: text,
        sentiment: sentiment,
        date: DateTime.now());
    await _repo.addVoiceNote(note);
  }
}

final voiceControllerProvider =
    StateNotifierProvider<VoiceController, List<VoiceNote>>((ref) {
  final repo = ref.watch(voiceRepositoryProvider);
  final speech = ref.watch(speechServiceProvider);
  final sentiment = ref.watch(sentimentServiceProvider);
  return VoiceController(repo, speech, sentiment);
});
