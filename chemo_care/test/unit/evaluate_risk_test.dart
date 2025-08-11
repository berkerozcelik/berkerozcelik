import 'package:chemo_care/src/domain/utils/thresholds.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('fever above 38 is red', () {
    expect(evaluateRisk('fever', 39), 'red');
  });

  test('pain 5 is yellow', () {
    expect(evaluateRisk('pain', 5), 'yellow');
  });
}
