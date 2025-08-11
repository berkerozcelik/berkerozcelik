import 'package:chemo_care/src/application/providers.dart';
import 'package:chemo_care/src/data/repositories/in_memory_medication_repository.dart';
import 'package:chemo_care/src/presentation/pages/medication_page.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:integration_test/integration_test.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('mark medication as taken updates repository', (tester) async {
    await EasyLocalization.ensureInitialized();
    final container = ProviderContainer();
    final widget = EasyLocalization(
      path: 'assets/translations',
      supportedLocales: const [Locale('en', 'US')],
      fallbackLocale: const Locale('en', 'US'),
      child: UncontrolledProviderScope(
        container: container,
        child: const MaterialApp(home: MedicationPage()),
      ),
    );

    await tester.pumpWidget(widget);
    await tester.pumpAndSettle();

    // Tap first medication mark button
    await tester.tap(find.byIcon(Icons.check_circle_outline).first);
    await tester.pumpAndSettle();

    final repo = container.read(medicationRepositoryProvider)
        as InMemoryMedicationRepository;
    expect(repo.takenFor('1'), 1);
  });
}
