import 'package:chemo_care/src/presentation/pages/settings_page.dart';
import 'package:flutter_test/flutter_test.dart';

import 'test_helpers.dart';

void main() {
  testWidgets('settings shows dark theme switch', (tester) async {
    final widget = await buildTestable(const SettingsPage());
    await tester.pumpWidget(widget);
    expect(find.byType(SwitchListTile), findsOneWidget);
  });
}
