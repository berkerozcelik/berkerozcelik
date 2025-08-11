import 'package:chemo_care/src/presentation/pages/home_page.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

/// Displays basic consent text and navigates to home when accepted.
class OnboardingPage extends StatelessWidget {
  const OnboardingPage({super.key});

  static const routeName = '/onboarding';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('onboarding.title'.tr())),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                child: Text('onboarding.consent'.tr(),
                    style: Theme.of(context).textTheme.bodyLarge),
              ),
            ),
            Semantics(
              button: true,
              label: 'accept_consent'.tr(),
              child: ElevatedButton(
                onPressed: () => Navigator.pushReplacementNamed(
                    context, HomePage.routeName),
                child: Text('onboarding.accept'.tr()),
              ),
            )
          ],
        ),
      ),
    );
  }
}
