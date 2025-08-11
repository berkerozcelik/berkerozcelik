import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

import '../../application/medication/medication_controller.dart';
import 'medication_page.dart';
import 'symptom_page.dart';
import 'voice_page.dart';

/// Home dashboard showing quick summary cards.
class HomePage extends StatelessWidget {
  const HomePage({super.key});

  static const routeName = '/home';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('home.title'.tr())),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: ListTile(
              title: Text('home.medications'.tr()),
              onTap: () => Navigator.pushNamed(context, MedicationPage.routeName),
            ),
          ),
          Card(
            child: ListTile(
              title: Text('home.symptoms'.tr()),
              onTap: () => Navigator.pushNamed(context, SymptomPage.routeName),
            ),
          ),
          Card(
            child: ListTile(
              title: Text('home.voice'.tr()),
              onTap: () => Navigator.pushNamed(context, VoicePage.routeName),
            ),
          ),
        ],
      ),
    );
  }
}
