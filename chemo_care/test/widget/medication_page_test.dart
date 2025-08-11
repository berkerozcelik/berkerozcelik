import 'package:chemo_care/src/presentation/pages/medication_page.dart';
import 'package:flutter_test/flutter_test.dart';

import 'test_helpers.dart';

void main() {
  testWidgets('medication list appears', (tester) async {
    final widget = await buildTestable(const MedicationPage());
    await tester.pumpWidget(widget);
    await tester.pump();
    expect(find.text('Antiemetic'), findsOneWidget);
  });
}
