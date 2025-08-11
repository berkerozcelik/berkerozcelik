import 'package:chemo_care/src/presentation/pages/home_page.dart';
import 'package:flutter_test/flutter_test.dart';

import 'test_helpers.dart';

void main() {
  testWidgets('home shows medication card', (tester) async {
    final widget = await buildTestable(const HomePage());
    await tester.pumpWidget(widget);
    expect(find.text('Medications'), findsOneWidget);
  });
}
