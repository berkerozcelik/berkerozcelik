import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

/// Basic settings page with theme toggle placeholder.
class SettingsPage extends StatefulWidget {
  const SettingsPage({super.key});

  static const routeName = '/settings';

  @override
  State<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends State<SettingsPage> {
  bool dark = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('settings.title'.tr())),
      body: SwitchListTile(
        title: Text('settings.dark'.tr()),
        value: dark,
        onChanged: (v) => setState(() => dark = v),
      ),
    );
  }
}
