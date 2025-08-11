import 'package:chemo_care/src/domain/utils/thresholds.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('mood label positive', () {
    expect(moodLabel(4), 'positive');
  });

  test('mood label neutral', () {
    expect(moodLabel(0), 'neutral');
  });
}
