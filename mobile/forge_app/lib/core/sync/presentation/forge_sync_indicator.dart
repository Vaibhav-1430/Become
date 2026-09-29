import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/forge_colors.dart';
import '../engine/sync_engine.dart';
import '../hydration/cloud_hydration_service.dart';
import '../realtime/realtime_sync_service.dart';
import '../refresh/refresh_coordinator.dart';

/// Kinetic, non-intrusive sync status badge and banner for FORGE Mobile.
/// Strictly distinguishes between Offline, Realtime disconnect, Partial hydration, and Sync failure.
class ForgeSyncIndicator extends StatelessWidget {
  static const Color _amber = Color(0xFFF59E0B);

  final SyncEngine? engine;
  final bool compact;
  final VoidCallback? onSyncTap;

  const ForgeSyncIndicator({
    super.key,
    this.engine,
    this.compact = false,
    this.onSyncTap,
  });

  @override
  Widget build(BuildContext context) {
    final syncEngine = engine ?? SyncEngine.instance;

    return AnimatedBuilder(
      animation: Listenable.merge([
        syncEngine,
        RealtimeSyncService.instance,
        CloudHydrationService.instance,
        RefreshCoordinator.instance,
      ]),
      builder: (context, _) {
        final data = syncEngine.statusData;
        final state = data.state;
        final isHydrating = CloudHydrationService.instance.isHydrating;
        final isPartial = CloudHydrationService.instance.isPartialFailure;
        final isRefreshing = RefreshCoordinator.instance.isRefreshing();

        Color borderColor;
        Color bgColor;
        Color textColor;
        IconData iconData;
        String text;
        String? actionButtonText;

        if (isHydrating) {
          borderColor = _amber;
          bgColor = const Color(0xFF261E05).withValues(alpha: 0.9);
          textColor = _amber;
          iconData = Icons.cloud_download_outlined;
          text = 'HYDRATING CLOUD STATE...';
          actionButtonText = 'SYNCING...';
        } else if (isRefreshing) {
          borderColor = _amber;
          bgColor = const Color(0xFF261E05).withValues(alpha: 0.9);
          textColor = _amber;
          iconData = Icons.sync;
          text = 'REFRESHING...';
          actionButtonText = 'SYNCING...';
        } else {
          switch (state) {
            case SyncState.offline:
              borderColor = const Color(0xFF4A5568);
              bgColor = const Color(0xFF1A202C).withValues(alpha: 0.85);
              textColor = const Color(0xFFA0AEC0);
              iconData = Icons.wifi_off_rounded;
              text = data.pendingCount > 0
                  ? 'OFFLINE // ${data.pendingCount} QUEUED'
                  : 'OFFLINE MODE';
              break;

            case SyncState.pendingSync:
              borderColor = _amber.withValues(alpha: 0.5);
              bgColor = const Color(0xFF261E05).withValues(alpha: 0.85);
              textColor = _amber;
              iconData = Icons.cloud_upload_outlined;
              text = '${data.pendingCount} PENDING SYNC';
              actionButtonText = 'SYNC NOW';
              break;

            case SyncState.syncing:
              borderColor = _amber;
              bgColor = const Color(0xFF261E05).withValues(alpha: 0.9);
              textColor = _amber;
              iconData = Icons.sync_rounded;
              text = 'SYNCING PROTOCOL...';
              actionButtonText = 'SYNCING...';
              break;

            case SyncState.partialFailure:
              borderColor = _amber.withValues(alpha: 0.8);
              bgColor = const Color(0xFF261E05).withValues(alpha: 0.9);
              textColor = _amber;
              iconData = Icons.warning_amber_rounded;
              text = 'SYNC PARTIAL // TAP TO REVIEW';
              actionButtonText = 'RETRY SYNC';
              break;

            case SyncState.syncError:
              borderColor = ForgeColors.error.withValues(alpha: 0.6);
              bgColor = const Color(0xFF2A0D0D).withValues(alpha: 0.85);
              textColor = ForgeColors.error;
              iconData = Icons.sync_problem_rounded;
              text = data.userFriendlyMessage ?? 'SYNC FAILED // TAP TO RETRY';
              actionButtonText = 'SYNC NOW';
              break;

            case SyncState.synced:
              if (isPartial) {
                borderColor = _amber.withValues(alpha: 0.8);
                bgColor = const Color(0xFF261E05).withValues(alpha: 0.9);
                textColor = _amber;
                iconData = Icons.warning_amber_rounded;
                text = 'SYNC PARTIAL // TAP TO REVIEW';
                actionButtonText = 'RETRY SYNC';
              } else {
                final isLive = RealtimeSyncService.instance.isConnected;
                final isReconnecting = RealtimeSyncService.instance.status == RealtimeStatus.reconnecting;
                final isDisconnected = RealtimeSyncService.instance.status == RealtimeStatus.disconnected;

                if (isReconnecting) {
                  borderColor = _amber.withValues(alpha: 0.5);
                  bgColor = const Color(0xFF261E05).withValues(alpha: 0.85);
                  textColor = _amber;
                  iconData = Icons.sync;
                  text = 'CLOUD SYNCED // LIVE RECONNECTING';
                } else if (isDisconnected) {
                  borderColor = ForgeColors.success.withValues(alpha: 0.3);
                  bgColor = const Color(0xFF0C1F15).withValues(alpha: 0.6);
                  textColor = ForgeColors.success;
                  iconData = Icons.cloud_done_outlined;
                  text = 'ALL PROTOCOLS SYNCED';
                } else {
                  borderColor = ForgeColors.success.withValues(alpha: 0.3);
                  bgColor = const Color(0xFF0C1F15).withValues(alpha: 0.6);
                  textColor = ForgeColors.success;
                  iconData = isLive ? Icons.sensors_rounded : Icons.cloud_done_outlined;
                  text = isLive ? 'LIVE // ALL PROTOCOLS SYNCED' : 'ALL PROTOCOLS SYNCED';
                }
              }
              break;
          }
        }

        if (compact) {
          return InkWell(
            onTap: onSyncTap ?? () => syncEngine.syncNow(),
            borderRadius: BorderRadius.circular(4),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: bgColor,
                borderRadius: BorderRadius.circular(4),
                border: Border.all(color: borderColor, width: 1),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (state == SyncState.syncing || isHydrating || isRefreshing)
                    const SizedBox(
                      width: 10,
                      height: 10,
                      child: CircularProgressIndicator(
                        strokeWidth: 1.5,
                        valueColor: AlwaysStoppedAnimation<Color>(_amber),
                      ),
                    )
                  else
                    Icon(iconData, size: 12, color: textColor),
                  const SizedBox(width: 5),
                  Text(
                    text,
                    style: GoogleFonts.jetBrainsMono(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0.5,
                      color: textColor,
                    ),
                  ),
                ],
              ),
            ),
          );
        }

        return InkWell(
          onTap: onSyncTap ?? () => syncEngine.syncNow(),
          borderRadius: BorderRadius.circular(6),
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: bgColor,
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: borderColor, width: 1),
            ),
            child: Row(
              children: [
                if (state == SyncState.syncing || isHydrating || isRefreshing)
                  const SizedBox(
                    width: 14,
                    height: 14,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(_amber),
                    ),
                  )
                else
                  Icon(iconData, size: 14, color: textColor),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    text,
                    style: GoogleFonts.jetBrainsMono(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0.8,
                      color: textColor,
                    ),
                  ),
                ),
                if (actionButtonText != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: _amber.withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(3),
                    ),
                    child: Text(
                      actionButtonText,
                      style: GoogleFonts.jetBrainsMono(
                        fontSize: 9,
                        fontWeight: FontWeight.w700,
                        color: _amber,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }
}
