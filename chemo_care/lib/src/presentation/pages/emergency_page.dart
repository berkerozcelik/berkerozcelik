import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

/// Shows emergency instructions and a mock call button.
class EmergencyPage extends StatelessWidget {
  const EmergencyPage({super.key});

  static const routeName = '/emergency';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('emergency.title'.tr())),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('emergency.instructions'.tr()),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () {},
              child: Text('emergency.call'.tr()),
            )
          ],
        ),
      ),
    );
  }
}
