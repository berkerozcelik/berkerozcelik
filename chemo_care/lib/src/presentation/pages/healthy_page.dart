import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

/// Placeholder for healthy living tracking: hydration and steps.
class HealthyPage extends StatefulWidget {
  const HealthyPage({super.key});

  static const routeName = '/healthy';

  @override
  State<HealthyPage> createState() => _HealthyPageState();
}

class _HealthyPageState extends State<HealthyPage> {
  int water = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('healthy.title'.tr())),
      body: Column(
        children: [
          Text('healthy.water'.tr(args: [water.toString()])),
          ElevatedButton(
              onPressed: () => setState(() => water++),
              child: Text('healthy.addWater'.tr())),
          const Spacer(),
        ],
      ),
    );
  }
}
