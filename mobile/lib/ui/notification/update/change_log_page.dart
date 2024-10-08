import "dart:async";

import 'package:flutter/material.dart';
import "package:photos/generated/l10n.dart";
import 'package:photos/services/update_service.dart';
import 'package:photos/theme/ente_theme.dart';
import 'package:photos/ui/components/buttons/button_widget.dart';
import 'package:photos/ui/components/divider_widget.dart';
import 'package:photos/ui/components/models/button_type.dart';
import 'package:photos/ui/components/title_bar_title_widget.dart';
import "package:photos/ui/growth/referral_screen.dart";
import 'package:photos/ui/notification/update/change_log_entry.dart';
import "package:photos/utils/navigation_util.dart";

class ChangeLogPage extends StatefulWidget {
  const ChangeLogPage({
    Key? key,
  }) : super(key: key);

  @override
  State<ChangeLogPage> createState() => _ChangeLogPageState();
}

class _ChangeLogPageState extends State<ChangeLogPage> {
  @override
  Widget build(BuildContext context) {
    final enteColorScheme = getEnteColorScheme(context);
    return Scaffold(
      appBar: null,
      body: Container(
        color: enteColorScheme.backgroundElevated,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const SizedBox(
              height: 36,
            ),
            Container(
              alignment: Alignment.centerLeft,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: TitleBarTitleWidget(
                  title: S.of(context).whatsNew,
                ),
              ),
            ),
            const SizedBox(
              height: 24,
            ),
            Expanded(child: _getChangeLog(context)),
            const DividerWidget(
              dividerType: DividerType.solid,
            ),
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.only(
                  left: 16.0,
                  right: 16,
                  top: 16,
                  bottom: 8,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ButtonWidget(
                      buttonType: ButtonType.trailingIconPrimary,
                      buttonSize: ButtonSize.large,
                      labelText: S.of(context).continueLabel,
                      icon: Icons.arrow_forward_outlined,
                      onTap: () async {
                        await UpdateService.instance.hideChangeLog();
                        if (mounted && Navigator.of(context).canPop()) {
                          Navigator.of(context).pop();
                        }
                      },
                    ),
                    const SizedBox(
                      height: 8,
                    ),
                    // ButtonWidget(
                    //   buttonType: ButtonType.trailingIconSecondary,
                    //   buttonSize: ButtonSize.large,
                    //   labelText: S.of(context).joinDiscord,
                    //   icon: Icons.discord_outlined,
                    //   iconColor: enteColorScheme.primary500,
                    //   onTap: () async {
                    //     unawaited(
                    //       launchUrlString(
                    //         "https://discord.com/invite/z2YVKkycX3",
                    //         mode: LaunchMode.externalApplication,
                    //       ),
                    //     );
                    //   },
                    // ),
                    ButtonWidget(
                      buttonType: ButtonType.trailingIconSecondary,
                      buttonSize: ButtonSize.large,
                      labelText: 'Claim referral code',
                      icon: Icons.arrow_forward_outlined,
                      iconColor: enteColorScheme.primary500,
                      onTap: () async {
                        unawaited(
                          routeToPage(
                            context,
                            const ReferralScreen(),
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: 8),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _getChangeLog(BuildContext ctx) {
    final scrollController = ScrollController();
    final List<ChangeLogEntry> items = [];
    items.addAll([
      ChangeLogEntry(
        'Personal referral codes',
        'Claim your personal code to invite friends now. Earn 10GB free for every successful referral.',
      ),
      ChangeLogEntry(
        'Resumable uploads',
        'We\'ve added support for resuming uploads across app sessions. Please enable this from Backup settings.',
      ),
      ChangeLogEntry(
        'Quick links',
        'Created too many links to share? You can select and clear multiple in one go now.',
      ),
      ChangeLogEntry(
        'App lock',
        'We\'ve introduced an option to hide Ente from your app switcher. Check out Security > App lock.',
      ),
    ]);

    return Container(
      padding: const EdgeInsets.only(left: 16),
      child: Scrollbar(
        controller: scrollController,
        thumbVisibility: true,
        thickness: 2.0,
        child: ListView.builder(
          physics: const BouncingScrollPhysics(),
          itemBuilder: (context, index) {
            return Padding(
              padding: const EdgeInsets.only(right: 16.0),
              child: ChangeLogEntryWidget(entry: items[index]),
            );
          },
          itemCount: items.length,
        ),
      ),
    );
  }
}
