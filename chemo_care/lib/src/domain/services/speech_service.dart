/// Abstract service for recording speech and converting to text.
abstract class SpeechToTextService {
  Future<String> recordAndTranscribe();
}

/// Abstract service for performing sentiment analysis.
abstract class SentimentService {
  /// Returns value between -1 (negative) and 1 (positive)
  Future<double> analyze(String text);
}
