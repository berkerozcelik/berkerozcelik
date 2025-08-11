import 'package:chemo_care/src/presentation/pages/symptom_page.dart';
import 'package:flutter_test/flutter_test.dart';

import 'test_helpers.dart';

void main() {
  testWidgets('symptom page has save button', (tester) async {
    final widget = await buildTestable(const SymptomPage());
    await tester.pumpWidget(widget);
    expect(find.text('Save'), findsOneWidget);
  });
}
