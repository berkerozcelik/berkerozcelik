import 'package:chemo_care/src/presentation/pages/onboarding_page.dart';
import 'package:flutter_test/flutter_test.dart';

import 'test_helpers.dart';

void main() {
  testWidgets('shows consent text', (tester) async {
    final widget = await buildTestable(const OnboardingPage());
    await tester.pumpWidget(widget);
    expect(find.textContaining('privacy'), findsOneWidget);
  });
}
