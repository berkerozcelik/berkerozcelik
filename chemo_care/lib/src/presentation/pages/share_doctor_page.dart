import 'package:chemo_care/src/application/providers.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

/// Page for sending question to doctor via mock notification service.
class ShareDoctorPage extends ConsumerWidget {
  const ShareDoctorPage({super.key});

  static const routeName = '/share';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final controller = TextEditingController();
    return Scaffold(
      appBar: AppBar(title: Text('share.title'.tr())),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(
              controller: controller,
              decoration: InputDecoration(labelText: 'share.question'.tr()),
            ),
            ElevatedButton(
                onPressed: () {
                  ref
                      .read(doctorNotificationProvider)
                      .sendMessage('doctor1', controller.text);
                },
                child: Text('share.send'.tr()))
          ],
        ),
      ),
    );
  }
}
