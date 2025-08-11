import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

/// Displays upcoming appointments (placeholder list).
class AppointmentsPage extends StatelessWidget {
  const AppointmentsPage({super.key});

  static const routeName = '/appointments';

  @override
  Widget build(BuildContext context) {
    final appointments = [
      DateTime.now().add(const Duration(days: 1)),
      DateTime.now().add(const Duration(days: 7)),
    ];
    return Scaffold(
      appBar: AppBar(title: Text('appointments.title'.tr())),
      body: ListView.builder(
        itemCount: appointments.length,
        itemBuilder: (_, i) => ListTile(
          title: Text(DateFormat.yMMMEd().format(appointments[i])),
        ),
      ),
    );
  }
}
