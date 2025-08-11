import 'package:chemo_care/src/domain/services/speech_service.dart';

/// Mock implementation that simulates recording by returning a fixed string.
class MockSpeechToTextService implements SpeechToTextService {
  @override
  Future<String> recordAndTranscribe() async {
    await Future.delayed(const Duration(milliseconds: 300));
    return 'I feel a bit tired but overall fine';
  }
}

class MockSentimentService implements SentimentService {
  @override
  Future<double> analyze(String text) async {
    await Future.delayed(const Duration(milliseconds: 200));
    // naive sentiment: positive if contains 'fine'
    return text.contains('fine') ? 0.5 : -0.2;
  }
}
