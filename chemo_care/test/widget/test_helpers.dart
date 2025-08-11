import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

/// Wraps a widget with [EasyLocalization], [ProviderScope] and [MaterialApp]
/// for widget testing.
Future<Widget> buildTestable(Widget child) async {
  await EasyLocalization.ensureInitialized();
  return EasyLocalization(
    path: 'assets/translations',
    supportedLocales: const [Locale('en', 'US')],
    fallbackLocale: const Locale('en', 'US'),
    child: ProviderScope(child: MaterialApp(home: child)),
  );
}
