import 'dart:async';

import '../../domain/models/voice_note.dart';
import '../../domain/repositories/voice_repository.dart';

class InMemoryVoiceRepository implements VoiceRepository {
  final _controller = StreamController<List<VoiceNote>>.broadcast();
  final List<VoiceNote> _notes = [];

  @override
  Future<void> addVoiceNote(VoiceNote note) async {
    _notes.add(note);
    _controller.add(List.unmodifiable(_notes));
  }

  @override
  Stream<List<VoiceNote>> watchNotes() => _controller.stream;
}
