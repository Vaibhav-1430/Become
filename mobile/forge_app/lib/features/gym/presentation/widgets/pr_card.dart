import 'package:flutter/material.dart';
import '../../domain/personal_record.dart';

/// Card presenting an authentic Personal Record achieved by the athlete.
class PersonalRecordCard extends StatelessWidget {
  const PersonalRecordCard({
    super.key,
    required this.pr,
  });

  final PersonalRecord pr;

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

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF13171F),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFF1F2430)),
      ),
      child: Row(
        children: [
          // Trophy Badge
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: const Color(0xFFE5A93C).withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: const Color(0xFFE5A93C).withValues(alpha: 0.35),
              ),
            ),
            child: const Center(
              child: Icon(
                Icons.emoji_events_outlined,
                color: Color(0xFFE5A93C),
                size: 20,
              ),
            ),
          ),
          const SizedBox(width: 14),

          // Exercise & Date
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  pr.exerciseName,
                  style: const TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFFF0F6FC),
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 3),
                Text(
                  'ACHIEVED ${_formatDate(pr.achievedAt).toUpperCase()}',
                  style: const TextStyle(
                    fontFamily: 'JetBrains Mono',
                    fontSize: 10,
                    color: Color(0xFF8B949E),
                    letterSpacing: 0.8,
                  ),
                ),
              ],
            ),
          ),

          // PR Metric Values
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${pr.maxWeightKg.toStringAsFixed(pr.maxWeightKg % 1 == 0 ? 0 : 1)} KG',
                style: const TextStyle(
                  fontFamily: 'JetBrains Mono',
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFFE5A93C),
                ),
              ),
              const SizedBox(height: 2),
              Text(
                '${pr.maxReps} REPS',
                style: const TextStyle(
                  fontFamily: 'JetBrains Mono',
                  fontSize: 10,
                  color: Color(0xFF8B949E),
                  fontWeight: FontWeight.w600,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
