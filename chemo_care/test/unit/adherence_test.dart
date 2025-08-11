import 'package:chemo_care/src/domain/utils/thresholds.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('adherence percent calculated correctly', () {
    expect(adherencePercent(8, 10), 80);
  });
}
