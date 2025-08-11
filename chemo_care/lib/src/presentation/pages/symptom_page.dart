import 'package:chemo_care/src/application/symptom/symptom_controller.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

/// Page allowing the patient to enter symptom levels.
class SymptomPage extends ConsumerWidget {
  const SymptomPage({super.key});

  static const routeName = '/symptom';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final entries = ref.watch(painSymptomProvider);
    int level = 0;
    return Scaffold(
      appBar: AppBar(title: Text('symptom.title'.tr())),
      body: Column(
        children: [
          Slider(
            min: 0,
            max: 10,
            divisions: 10,
            label: level.toString(),
            value: level.toDouble(),
            onChanged: (v) {
              level = v.toInt();
            },
          ),
          ElevatedButton(
              onPressed: () =>
                  ref.read(painSymptomProvider.notifier).addEntry(level),
              child: Text('symptom.save'.tr())),
          Expanded(
            child: ListView.builder(
              itemCount: entries.length,
              itemBuilder: (_, i) {
                final e = entries[i];
                return ListTile(
                  title: Text('${e.date.hour}:${e.date.minute}'),
                  subtitle: Text('level: ${e.level}'),
                );
              },
            ),
          )
        ],
      ),
    );
  }
}
