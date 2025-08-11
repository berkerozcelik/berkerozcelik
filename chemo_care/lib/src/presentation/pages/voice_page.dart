import 'package:chemo_care/src/application/voice/voice_controller.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

/// Page for recording voice notes.
class VoicePage extends ConsumerWidget {
  const VoicePage({super.key});

  static const routeName = '/voice';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notes = ref.watch(voiceControllerProvider);
    return Scaffold(
      appBar: AppBar(title: Text('voice.title'.tr())),
      floatingActionButton: FloatingActionButton(
        onPressed: () => ref.read(voiceControllerProvider.notifier).record(),
        tooltip: 'voice.record'.tr(),
        child: const Icon(Icons.mic),
      ),
      body: ListView.builder(
        itemCount: notes.length,
        itemBuilder: (_, i) {
          final n = notes[i];
          return ListTile(
            title: Text(n.text),
            subtitle: Text('sentiment: ${n.sentiment.toStringAsFixed(2)}'),
          );
        },
      ),
    );
  }
}
