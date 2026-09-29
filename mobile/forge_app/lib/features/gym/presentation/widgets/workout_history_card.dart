import 'package:flutter/material.dart';
import '../../domain/workout_session.dart';

/// Card displaying past workout session telemetry and verification state.
class WorkoutHistoryCard extends StatelessWidget {
  const WorkoutHistoryCard({
    super.key,
    required this.session,
    this.onTap,
    this.onViewPhoto,
    this.onDelete,
  });

  final WorkoutSession session;
  final VoidCallback? onTap;
  final VoidCallback? onViewPhoto;
  final VoidCallback? onDelete;

  String _formatDate(DateTime dt) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    final m = months[dt.month - 1];
    final d = dt.day.toString().padLeft(2, '0');
    final y = dt.year;
    return '$m $d, $y';
  }

  String _formatDuration(int seconds) {
    if (seconds <= 0) return '—';
    final mins = seconds ~/ 60;
    final hrs = mins ~/ 60;
    final remMins = mins % 60;
    if (hrs > 0) {
      return '${hrs}h ${remMins}m';
    }
    return '${mins}m';
  }

  @override
  Widget build(BuildContext context) {
    final hasPhoto = session.gymPhotoPath.isNotEmpty;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF13171F),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFF1F2430)),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(10),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Row: Date & Status Badge + Delete Action
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      _formatDate(session.parsedDate).toUpperCase(),
                      style: const TextStyle(
                        fontFamily: 'JetBrains Mono',
                        fontSize: 11,
                        color: Color(0xFF8B949E),
                        fontWeight: FontWeight.w600,
                        letterSpacing: 1.0,
                      ),
                    ),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: session.isCompleted
                                ? const Color(0xFF10B981).withValues(alpha: 0.15)
                                : const Color(0xFFF59E0B).withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(4),
                            border: Border.all(
                              color: session.isCompleted
                                  ? const Color(0xFF10B981).withValues(alpha: 0.4)
                                  : const Color(0xFFF59E0B).withValues(alpha: 0.4),
                            ),
                          ),
                          child: Text(
                            session.status.toUpperCase(),
                            style: TextStyle(
                              fontFamily: 'JetBrains Mono',
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: session.isCompleted
                                  ? const Color(0xFF10B981)
                                  : const Color(0xFFF59E0B),
                              letterSpacing: 0.8,
                            ),
                          ),
                        ),
                        if (onDelete != null) ...[
                          const SizedBox(width: 8),
                          InkWell(
                            key: Key('btn_delete_session_${session.id}'),
                            onTap: onDelete,
                            borderRadius: BorderRadius.circular(4),
                            child: const Padding(
                              padding: EdgeInsets.all(3),
                              child: Icon(
                                Icons.delete_outline,
                                size: 16,
                                color: Color(0xFFEF4444),
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 8),

                // Routine Title
                Text(
                  session.routineName.isNotEmpty ? session.routineName : 'General Training',
                  style: const TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFFF0F6FC),
                  ),
                ),
                const SizedBox(height: 12),

                // Telemetry metrics row
                Row(
                  children: [
                    _MetricChip(
                      label: 'DURATION',
                      value: _formatDuration(session.durationSeconds),
                    ),
                    const SizedBox(width: 12),
                    _MetricChip(
                      label: 'VOLUME',
                      value: session.totalVolumeKg > 0 ? '${session.totalVolumeKg.toInt()} kg' : '—',
                    ),
                    const SizedBox(width: 12),
                    _MetricChip(
                      label: 'SETS',
                      value: session.totalSets > 0 ? '${session.totalSets}' : '—',
                    ),
                  ],
                ),

                if (hasPhoto) ...[
                  const SizedBox(height: 12),
                  const Divider(color: Color(0xFF1F2430), height: 1),
                  const SizedBox(height: 10),
                  // Photo Check-in status
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: const [
                          Icon(
                            Icons.verified,
                            color: Color(0xFFE5A93C),
                            size: 14,
                          ),
                          SizedBox(width: 6),
                          Text(
                            'PHOTO VERIFIED',
                            style: TextStyle(
                              fontFamily: 'JetBrains Mono',
                              fontSize: 11,
                              color: Color(0xFFE5A93C),
                              fontWeight: FontWeight.w600,
                              letterSpacing: 0.8,
                            ),
                          ),
                        ],
                      ),
                      if (onViewPhoto != null)
                        InkWell(
                          onTap: onViewPhoto,
                          borderRadius: BorderRadius.circular(4),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            child: Row(
                              children: const [
                                Icon(
                                  Icons.image_outlined,
                                  size: 13,
                                  color: Color(0xFF8B949E),
                                ),
                                SizedBox(width: 4),
                                Text(
                                  'VIEW',
                                  style: TextStyle(
                                    fontFamily: 'JetBrains Mono',
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: Color(0xFF8B949E),
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _MetricChip extends StatelessWidget {
  const _MetricChip({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 8),
        decoration: BoxDecoration(
          color: const Color(0xFF0C0E12),
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: const Color(0xFF1A1F2B)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: const TextStyle(
                fontFamily: 'JetBrains Mono',
                fontSize: 9,
                color: Color(0xFF6E7681),
                fontWeight: FontWeight.w600,
                letterSpacing: 0.8,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              value,
              style: const TextStyle(
                fontFamily: 'JetBrains Mono',
                fontSize: 12,
                color: Color(0xFFC9D1D9),
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
