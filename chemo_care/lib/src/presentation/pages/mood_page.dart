import 'package:chemo_care/src/application/mood/mood_controller.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

/// Page for entering daily mood.
class MoodPage extends ConsumerWidget {
  const MoodPage({super.key});

  static const routeName = '/mood';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final moods = ref.watch(moodControllerProvider);
    int current = 0;
    return Scaffold(
      appBar: AppBar(title: Text('mood.title'.tr())),
      body: Column(
        children: [
          Slider(
            min: -5,
            max: 5,
            divisions: 10,
            value: current.toDouble(),
            label: current.toString(),
            onChanged: (v) => current = v.toInt(),
          ),
          ElevatedButton(
              onPressed: () =>
                  ref.read(moodControllerProvider.notifier).addMood(current),
              child: Text('mood.save'.tr())),
          Expanded(
            child: ListView.builder(
              itemCount: moods.length,
              itemBuilder: (_, i) {
                final m = moods[i];
                return ListTile(
                  title: Text('${m.mood}'),
                  subtitle: Text(m.date.toIso8601String()),
                );
              },
            ),
          )
        ],
      ),
    );
  }
}
