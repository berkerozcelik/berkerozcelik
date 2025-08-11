import 'package:chemo_care/src/presentation/pages/appointments_page.dart';
import 'package:chemo_care/src/presentation/pages/emergency_page.dart';
import 'package:chemo_care/src/presentation/pages/healthy_page.dart';
import 'package:chemo_care/src/presentation/pages/home_page.dart';
import 'package:chemo_care/src/presentation/pages/info_bank_page.dart';
import 'package:chemo_care/src/presentation/pages/medication_page.dart';
import 'package:chemo_care/src/presentation/pages/mood_page.dart';
import 'package:chemo_care/src/presentation/pages/onboarding_page.dart';
import 'package:chemo_care/src/presentation/pages/settings_page.dart';
import 'package:chemo_care/src/presentation/pages/share_doctor_page.dart';
import 'package:chemo_care/src/presentation/pages/symptom_page.dart';
import 'package:chemo_care/src/presentation/pages/voice_page.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

/// Root widget providing [ProviderScope] for Riverpod and configuring
/// [MaterialApp] with localization and theming.
class ChemoCareApp extends StatelessWidget {
  const ChemoCareApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ProviderScope(
      child: MaterialApp(
        title: 'ChemoCare',
        debugShowCheckedModeBanner: false,
        localizationsDelegates: context.localizationDelegates,
        supportedLocales: context.supportedLocales,
        locale: context.locale,
        theme: ThemeData(useMaterial3: true),
        initialRoute: OnboardingPage.routeName,
        routes: {
          OnboardingPage.routeName: (_) => const OnboardingPage(),
          HomePage.routeName: (_) => const HomePage(),
          MedicationPage.routeName: (_) => const MedicationPage(),
          SymptomPage.routeName: (_) => const SymptomPage(),
          VoicePage.routeName: (_) => const VoicePage(),
          MoodPage.routeName: (_) => const MoodPage(),
          HealthyPage.routeName: (_) => const HealthyPage(),
          AppointmentsPage.routeName: (_) => const AppointmentsPage(),
          InfoBankPage.routeName: (_) => const InfoBankPage(),
          ShareDoctorPage.routeName: (_) => const ShareDoctorPage(),
          EmergencyPage.routeName: (_) => const EmergencyPage(),
          SettingsPage.routeName: (_) => const SettingsPage(),
        },
      ),
    );
  }
}
