import 'package:chemo_care/src/application/medication/medication_controller.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

/// Displays list of medications and allows marking them as taken.
class MedicationPage extends ConsumerWidget {
  const MedicationPage({super.key});

  static const routeName = '/medication';

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final meds = ref.watch(medicationControllerProvider);
    return Scaffold(
      appBar: AppBar(title: Text('medication.title'.tr())),
      body: meds.when(
        data: (list) => ListView.builder(
          itemCount: list.length,
          itemBuilder: (context, index) {
            final med = list[index];
            return ListTile(
              title: Text(med.name),
              subtitle: Text(med.times.join(', ')),
              trailing: IconButton(
                onPressed: () =>
                    ref.read(medicationControllerProvider.notifier).markTaken(med.id),
                icon: const Icon(Icons.check_circle_outline),
                tooltip: 'medication.mark'.tr(),
              ),
            );
          },
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
      ),
    );
  }
}
