import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../../core/theme/forge_colors.dart';
import '../../../../core/theme/forge_spacing.dart';
import '../../../../core/theme/forge_typography.dart';
import '../../data/career_repository.dart';
import '../../domain/internship.dart';
import '../widgets/add_edit_internship_sheet.dart';

/// Screen displaying deep inspection, status progression, and debrief notes for an internship.
class InternshipDetailScreen extends StatefulWidget {
  final Internship initialInternship;
  final CareerRepository repository;

  const InternshipDetailScreen({
    super.key,
    required this.initialInternship,
    required this.repository,
  });

  @override
  State<InternshipDetailScreen> createState() => _InternshipDetailScreenState();
}

class _InternshipDetailScreenState extends State<InternshipDetailScreen> {
  late Internship _internship;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _internship = widget.initialInternship;
  }

  Future<void> _refresh() async {
    final updated = await widget.repository.getInternshipById(_internship.id);
    if (updated != null && mounted) {
      setState(() => _internship = updated);
    }
  }

  Future<void> _updateStatus(String newStatus) async {
    setState(() => _isLoading = true);
    try {
      final updated = _internship.copyWith(status: newStatus);
      final saved = await widget.repository.updateInternship(updated);
      if (mounted) {
        setState(() {
          _internship = saved;
          _isLoading = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Status transitioned to ${InternshipStatus.displayName(newStatus)}'),
            backgroundColor: ForgeColors.surfaceContainerHigh,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = e.toString();
        });
      }
    }
  }

  Future<void> _openEditSheet() async {
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => AddEditInternshipSheet(
        existingInternship: _internship,
        onSave: (updated) async {
          final saved = await widget.repository.updateInternship(updated);
          if (mounted) {
            setState(() => _internship = saved);
          }
        },
      ),
    );
  }

  Future<void> _confirmDelete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: ForgeColors.surface,
        title: Text(
          'DELETE APPLICATION?',
          style: ForgeTypography.headlineSm.copyWith(color: ForgeColors.error, fontWeight: FontWeight.bold),
        ),
        content: Text(
          'Permanently purge application record for ${_internship.company} (${_internship.role})? This cannot be undone.',
          style: ForgeTypography.bodyMd.copyWith(color: ForgeColors.onSurfaceVariant),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('CANCEL', style: TextStyle(color: ForgeColors.outline)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: ForgeColors.error,
              foregroundColor: ForgeColors.canvas,
            ),
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('PURGE RECORD'),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      try {
        await widget.repository.deleteInternship(_internship.id);
        if (mounted) {
          Navigator.of(context).pop(true);
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Delete failed: $e'), backgroundColor: ForgeColors.error),
          );
        }
      }
    }
  }

  Future<void> _launchUrl(String url) async {
    final uri = Uri.tryParse(url);
    if (uri != null && await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open external link'), backgroundColor: ForgeColors.error),
      );
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toUpperCase()) {
      case InternshipStatus.selected:
        return ForgeColors.tertiary;
      case InternshipStatus.interview:
        return ForgeColors.secondary;
      case InternshipStatus.oa:
        return ForgeColors.primaryContainer;
      case InternshipStatus.rejected:
        return ForgeColors.error;
      case InternshipStatus.saved:
        return ForgeColors.outline;
      case InternshipStatus.applied:
      default:
        return ForgeColors.primary;
    }
  }

  @override
  Widget build(BuildContext context) {
    final statusColor = _getStatusColor(_internship.status);

    return Scaffold(
      backgroundColor: ForgeColors.canvas,
      appBar: AppBar(
        backgroundColor: ForgeColors.canvas,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: ForgeColors.primary),
          onPressed: () => Navigator.of(context).pop(),
        ),
        titleSpacing: 0,
        title: FittedBox(
          fit: BoxFit.scaleDown,
          alignment: Alignment.centerLeft,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.work, size: 18, color: ForgeColors.primary),
              const SizedBox(width: 8),
              Text(
                'FORGE // APPLICATION',
                style: ForgeTypography.headlineSm.copyWith(
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.2,
                ),
              ),
            ],
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined, color: ForgeColors.outline, size: 20),
            onPressed: _openEditSheet,
          ),
          IconButton(
            icon: const Icon(Icons.delete_outline, color: ForgeColors.error, size: 20),
            onPressed: _confirmDelete,
          ),
        ],
      ),
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: _refresh,
          color: ForgeColors.primaryContainer,
          backgroundColor: ForgeColors.surfaceContainer,
          child: ListView(
            padding: const EdgeInsets.all(ForgeSpacing.margin),
            children: [
              if (_errorMessage != null) ...[
                Container(
                  padding: const EdgeInsets.all(ForgeSpacing.spaceSm),
                  decoration: BoxDecoration(
                    color: ForgeColors.error.withValues(alpha: 0.1),
                    borderRadius: ForgeSpacing.borderRadiusXs,
                    border: Border.all(color: ForgeColors.error),
                  ),
                  child: Text(_errorMessage!, style: const TextStyle(color: ForgeColors.error)),
                ),
                const SizedBox(height: 12),
              ],

              // Main Application Card
              Container(
                padding: const EdgeInsets.all(ForgeSpacing.spaceMd),
                decoration: BoxDecoration(
                  color: ForgeColors.surfaceContainerLow,
                  borderRadius: ForgeSpacing.borderRadiusSm,
                  border: Border.all(color: ForgeColors.outlineVariant),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Status Badge & Date
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: statusColor.withValues(alpha: 0.15),
                            borderRadius: ForgeSpacing.borderRadiusXs,
                            border: Border.all(color: statusColor.withValues(alpha: 0.4)),
                          ),
                          child: Text(
                            InternshipStatus.badgeLabel(_internship.status),
                            style: ForgeTypography.labelSm.copyWith(
                              color: statusColor,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 0.8,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        if (_internship.dateApplied != null)
                          Flexible(
                            child: Text(
                              'Applied: ${_internship.dateApplied}',
                              style: ForgeTypography.labelSm.copyWith(color: ForgeColors.outline),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Company Name
                    Text(
                      _internship.company,
                      style: ForgeTypography.headlineLg.copyWith(
                        fontWeight: FontWeight.bold,
                        color: ForgeColors.onSurface,
                      ),
                    ),
                    const SizedBox(height: 4),

                    // Role
                    Text(
                      _internship.role,
                      style: ForgeTypography.bodyLg.copyWith(
                        color: ForgeColors.onSurfaceVariant,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 14),

                    // External Job Link Button
                    if (_internship.link?.isNotEmpty == true) ...[
                      InkWell(
                        onTap: () => _launchUrl(_internship.link!),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: ForgeColors.surfaceContainer,
                            borderRadius: ForgeSpacing.borderRadiusXs,
                            border: Border.all(color: ForgeColors.primary.withValues(alpha: 0.3)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.open_in_new, size: 14, color: ForgeColors.primary),
                              const SizedBox(width: 6),
                              Flexible(
                                child: Text(
                                  _internship.link!,
                                  style: ForgeTypography.labelSm.copyWith(
                                    color: ForgeColors.primary,
                                    fontWeight: FontWeight.bold,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),
                    ],

                    // Quick Stage Transitions
                    Text(
                      'TRANSITION PIPELINE STAGE',
                      style: ForgeTypography.labelSm.copyWith(
                        color: ForgeColors.outline,
                        letterSpacing: 0.8,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 6,
                      runSpacing: 6,
                      children: InternshipStatus.all.map((s) {
                        final isCurrent = _internship.status.toUpperCase() == s.toUpperCase();
                        final color = _getStatusColor(s);

                        return ChoiceChip(
                          label: Text(
                            InternshipStatus.displayName(s),
                            style: ForgeTypography.labelSm.copyWith(
                              color: isCurrent ? ForgeColors.canvas : ForgeColors.onSurfaceVariant,
                              fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
                            ),
                          ),
                          selected: isCurrent,
                          selectedColor: color,
                          backgroundColor: ForgeColors.surfaceContainerLowest,
                          padding: const EdgeInsets.symmetric(horizontal: 8),
                          shape: RoundedRectangleBorder(
                            borderRadius: ForgeSpacing.borderRadiusXs,
                            side: BorderSide(
                              color: isCurrent ? color : ForgeColors.outlineVariant,
                              width: 0.8,
                            ),
                          ),
                          onSelected: _isLoading ? null : (selected) {
                            if (selected && !isCurrent) {
                              _updateStatus(s);
                            }
                          },
                        );
                      }).toList(),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Tactical Notes Section
              Container(
                padding: const EdgeInsets.all(ForgeSpacing.spaceMd),
                decoration: BoxDecoration(
                  color: ForgeColors.surfaceContainerLow,
                  borderRadius: ForgeSpacing.borderRadiusSm,
                  border: Border.all(color: ForgeColors.outlineVariant),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.notes, size: 16, color: ForgeColors.primary),
                        const SizedBox(width: 6),
                        Flexible(
                          child: Text(
                            'TACTICAL DEBRIEF & NOTES',
                            style: ForgeTypography.labelSm.copyWith(
                              color: ForgeColors.outline,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.0,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    if (_internship.notes?.isNotEmpty == true)
                      Text(
                        _internship.notes!,
                        style: ForgeTypography.bodyMd.copyWith(
                          color: ForgeColors.onSurface,
                          height: 1.5,
                        ),
                      )
                    else
                      Text(
                        'No tactical debrief captured for this application. Tap Edit to add round notes, referral context, or technical question details.',
                        style: ForgeTypography.bodySm.copyWith(
                          color: ForgeColors.outline,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
