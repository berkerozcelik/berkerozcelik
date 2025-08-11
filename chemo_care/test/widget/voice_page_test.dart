import 'package:chemo_care/src/presentation/pages/voice_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'test_helpers.dart';

void main() {
  testWidgets('voice page has mic button', (tester) async {
    final widget = await buildTestable(const VoicePage());
    await tester.pumpWidget(widget);
    expect(find.byIcon(Icons.mic), findsOneWidget);
  });
}
