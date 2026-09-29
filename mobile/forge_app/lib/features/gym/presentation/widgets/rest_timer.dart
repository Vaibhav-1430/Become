import 'dart:async';
import 'package:flutter/material.dart';
import '../../../../core/theme/forge_colors.dart';
import '../../../../core/theme/forge_typography.dart';

class RestTimerWidget extends StatefulWidget {
  final int initialSeconds;
  final VoidCallback? onTimerComplete;

  const RestTimerWidget({
    super.key,
    this.initialSeconds = 90,
    this.onTimerComplete,
  });

  @override
  State<RestTimerWidget> createState() => RestTimerWidgetState();
}

class RestTimerWidgetState extends State<RestTimerWidget> {
  late int _remainingSeconds;
  Timer? _timer;
  bool _isRunning = false;

  @override
  void initState() {
    super.initState();
    _remainingSeconds = widget.initialSeconds;
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void startTimer([int? seconds]) {
    _timer?.cancel();
    if (seconds != null) {
      _remainingSeconds = seconds;
    }
    _isRunning = true;
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) {
        timer.cancel();
        return;
      }
      if (_remainingSeconds > 0) {
        setState(() {
          _remainingSeconds--;
        });
      } else {
        timer.cancel();
        setState(() {
          _isRunning = false;
        });
        widget.onTimerComplete?.call();
      }
    });
    setState(() {});
  }

  void pauseTimer() {
    _timer?.cancel();
    if (mounted) {
      setState(() {
        _isRunning = false;
      });
    }
  }

  void resetTimer([int? seconds]) {
    _timer?.cancel();
    if (mounted) {
      setState(() {
        _remainingSeconds = seconds ?? widget.initialSeconds;
        _isRunning = false;
      });
    }
  }

  void adjustSeconds(int delta) {
    if (mounted) {
      setState(() {
        _remainingSeconds = (_remainingSeconds + delta).clamp(0, 600);
      });
    }
  }

  String _formatTime(int totalSec) {
    final mins = totalSec ~/ 60;
    final secs = totalSec % 60;
    return '${mins.toString().padLeft(2, '0')}:${secs.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: ForgeColors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: _isRunning
              ? ForgeColors.primaryContainer.withValues(alpha: 0.6)
              : ForgeColors.borderSubtle,
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              GestureDetector(
                onTap: () {
                  if (_isRunning) {
                    pauseTimer();
                  } else {
                    startTimer();
                  }
                },
                child: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: ForgeColors.primaryContainer.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(
                      color: ForgeColors.primaryContainer.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Icon(
                    _isRunning ? Icons.pause : Icons.timer,
                    color: ForgeColors.primaryContainer,
                    size: 22,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'RECOVERY TIMER',
                    style: ForgeTypography.labelSm.copyWith(
                      color: ForgeColors.onSurfaceVariant,
                      fontSize: 9,
                      letterSpacing: 0.8,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    _formatTime(_remainingSeconds),
                    key: const Key('rest_timer_countdown'),
                    style: ForgeTypography.headlineMd.copyWith(
                      color: _remainingSeconds == 0
                          ? ForgeColors.tertiary
                          : ForgeColors.primary,
                      fontWeight: FontWeight.w700,
                      fontFeatures: [const FontFeature.tabularFigures()],
                    ),
                  ),
                ],
              ),
            ],
          ),
          Row(
            children: [
              OutlinedButton(
                key: const Key('btn_timer_minus_30'),
                onPressed: () => adjustSeconds(-30),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(44, 36),
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  side: const BorderSide(color: ForgeColors.borderSubtle),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                ),
                child: Text(
                  '-30s',
                  style: ForgeTypography.labelSm.copyWith(
                    color: ForgeColors.onSurface,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const SizedBox(width: 6),
              OutlinedButton(
                key: const Key('btn_timer_plus_30'),
                onPressed: () => adjustSeconds(30),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(44, 36),
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  side: const BorderSide(color: ForgeColors.borderSubtle),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                ),
                child: Text(
                  '+30s',
                  style: ForgeTypography.labelSm.copyWith(
                    color: ForgeColors.onSurface,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
