/// Returns risk level string based on symptom thresholds.
String evaluateRisk(String type, int level) {
  if (type == 'fever' && level >= 38) return 'red';
  if (level >= 7) return 'red';
  if (level >= 4) return 'yellow';
  return 'green';
}

/// Computes medication adherence percentage.
double adherencePercent(int taken, int scheduled) {
  if (scheduled == 0) return 0;
  return taken / scheduled * 100;
}

/// Maps mood score to textual description.
String moodLabel(int mood) {
  if (mood > 2) return 'positive';
  if (mood < -2) return 'negative';
  return 'neutral';
}
