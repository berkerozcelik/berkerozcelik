import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';

/// Simple information bank with static entries.
class InfoBankPage extends StatelessWidget {
  const InfoBankPage({super.key});

  static const routeName = '/info';

  @override
  Widget build(BuildContext context) {
    final articles = [
      'Managing nausea during chemo',
      'When to contact your doctor',
    ];
    return Scaffold(
      appBar: AppBar(title: Text('info.title'.tr())),
      body: ListView.builder(
        itemCount: articles.length,
        itemBuilder: (_, i) => ListTile(
          title: Text(articles[i]),
        ),
      ),
    );
  }
}
