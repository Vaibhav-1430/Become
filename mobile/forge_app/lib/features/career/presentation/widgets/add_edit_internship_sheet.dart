import 'package:flutter/material.dart';
import '../../../../core/theme/forge_colors.dart';
import '../../../../core/theme/forge_spacing.dart';
import '../../../../core/theme/forge_typography.dart';
import '../../../../shared/widgets/forge_button.dart';
import '../../domain/internship.dart';

/// Bottom modal sheet for logging a new internship or editing an existing application.
class AddEditInternshipSheet extends StatefulWidget {
  final Internship? existingInternship;
  final Future<void> Function(Internship internship) onSave;

  const AddEditInternshipSheet({
    super.key,
    this.existingInternship,
    required this.onSave,
  });

  @override
  State<AddEditInternshipSheet> createState() => _AddEditInternshipSheetState();
}

class _AddEditInternshipSheetState extends State<AddEditInternshipSheet> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _companyController;
  late TextEditingController _roleController;
  late TextEditingController _dateController;
  late TextEditingController _linkController;
  late TextEditingController _notesController;

  late String _status;
  bool _isSaving = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    final item = widget.existingInternship;
    _companyController = TextEditingController(text: item?.company ?? '');
    _roleController = TextEditingController(text: item?.role ?? 'SDE Intern');

    final now = DateTime.now();
    final defaultDate = '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
    _dateController = TextEditingController(text: item?.dateApplied ?? defaultDate);

    _linkController = TextEditingController(text: item?.link ?? '');
    _notesController = TextEditingController(text: item?.notes ?? '');
    _status = item?.status ?? InternshipStatus.applied;
  }

  @override
  void dispose() {
    _companyController.dispose();
    _roleController.dispose();
    _dateController.dispose();
    _linkController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _handleSave() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isSaving = true;
      _errorMessage = null;
    });

    try {
      final now = DateTime.now();
      final item = Internship(
        id: widget.existingInternship?.id ?? '',
        userId: widget.existingInternship?.userId ?? '',
        company: _companyController.text.trim(),
        role: _roleController.text.trim(),
        dateApplied: _dateController.text.trim().isNotEmpty ? _dateController.text.trim() : null,
        status: _status,
        link: _linkController.text.trim().isNotEmpty ? _linkController.text.trim() : null,
        notes: _notesController.text.trim().isNotEmpty ? _notesController.text.trim() : null,
        createdAt: widget.existingInternship?.createdAt ?? now,
        updatedAt: now,
      );

      await widget.onSave(item);
      if (mounted) {
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isSaving = false;
          _errorMessage = e.toString();
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.existingInternship != null;
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      padding: EdgeInsets.only(
        left: ForgeSpacing.margin,
        right: ForgeSpacing.margin,
        top: 20,
        bottom: bottomInset + 20,
      ),
      decoration: const BoxDecoration(
        color: ForgeColors.surface,
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
        border: Border(
          top: BorderSide(color: ForgeColors.outlineVariant),
          left: BorderSide(color: ForgeColors.outlineVariant),
          right: BorderSide(color: ForgeColors.outlineVariant),
        ),
      ),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Row(
                      children: [
                        const Icon(Icons.work, color: ForgeColors.primary, size: 20),
                        const SizedBox(width: 8),
                        Flexible(
                          child: Text(
                            isEditing ? 'EDIT APPLICATION' : 'LOG APPLICATION',
                            style: ForgeTypography.headlineSm.copyWith(
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.0,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: ForgeColors.outline, size: 20),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              if (_errorMessage != null) ...[
                Container(
                  padding: const EdgeInsets.all(ForgeSpacing.spaceSm),
                  decoration: BoxDecoration(
                    color: ForgeColors.error.withValues(alpha: 0.1),
                    borderRadius: ForgeSpacing.borderRadiusXs,
                    border: Border.all(color: ForgeColors.error),
                  ),
                  child: Text(
                    _errorMessage!,
                    style: ForgeTypography.labelSm.copyWith(color: ForgeColors.error),
                  ),
                ),
                const SizedBox(height: 12),
              ],

              // Company field
              Text(
                'COMPANY NAME *',
                style: ForgeTypography.labelSm.copyWith(color: ForgeColors.outline),
              ),
              const SizedBox(height: 4),
              TextFormField(
                controller: _companyController,
                style: ForgeTypography.bodyMd.copyWith(color: ForgeColors.onSurface),
                decoration: _inputDecoration('e.g. Stripe, Google, Datadog'),
                validator: (val) {
                  if (val == null || val.trim().isEmpty) {
                    return 'Company name is required';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 12),

              // Role field
              Text(
                'ROLE / POSITION *',
                style: ForgeTypography.labelSm.copyWith(color: ForgeColors.outline),
              ),
              const SizedBox(height: 4),
              TextFormField(
                controller: _roleController,
                style: ForgeTypography.bodyMd.copyWith(color: ForgeColors.onSurface),
                decoration: _inputDecoration('e.g. Backend Engineering Intern'),
                validator: (val) {
                  if (val == null || val.trim().isEmpty) {
                    return 'Role is required';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 12),

              // Status Dropdown
              Text(
                'PIPELINE STATUS',
                style: ForgeTypography.labelSm.copyWith(color: ForgeColors.outline),
              ),
              const SizedBox(height: 4),
              DropdownButtonFormField<String>(
                initialValue: _status,
                isExpanded: true,
                dropdownColor: ForgeColors.surfaceContainerHigh,
                style: ForgeTypography.labelSm.copyWith(color: ForgeColors.onSurface, fontWeight: FontWeight.bold),
                decoration: _inputDecoration('Status'),
                items: InternshipStatus.all.map((s) {
                  return DropdownMenuItem(
                    value: s,
                    child: Text(
                      InternshipStatus.displayName(s),
                      style: const TextStyle(fontSize: 12),
                    ),
                  );
                }).toList(),
                onChanged: (val) {
                  if (val != null) setState(() => _status = val);
                },
              ),
              const SizedBox(height: 12),

              // Date Applied
              Text(
                'DATE APPLIED',
                style: ForgeTypography.labelSm.copyWith(color: ForgeColors.outline),
              ),
              const SizedBox(height: 4),
              TextFormField(
                controller: _dateController,
                style: ForgeTypography.labelSm.copyWith(color: ForgeColors.onSurface),
                decoration: _inputDecoration('YYYY-MM-DD'),
              ),
              const SizedBox(height: 12),

              // Job Link
              Text(
                'APPLICATION / JOB URL',
                style: ForgeTypography.labelSm.copyWith(color: ForgeColors.outline),
              ),
              const SizedBox(height: 4),
              TextFormField(
                controller: _linkController,
                style: ForgeTypography.bodyMd.copyWith(color: ForgeColors.onSurface),
                decoration: _inputDecoration('https://careers.company.com/job/...'),
                keyboardType: TextInputType.url,
              ),
              const SizedBox(height: 12),

              // Notes
              Text(
                'TACTICAL NOTES / REFERRAL / ROUND DEBRIEF',
                style: ForgeTypography.labelSm.copyWith(color: ForgeColors.outline),
              ),
              const SizedBox(height: 4),
              TextFormField(
                controller: _notesController,
                style: ForgeTypography.bodyMd.copyWith(color: ForgeColors.onSurface),
                decoration: _inputDecoration('e.g. Referral by Jane Doe, OA scheduled for Thursday...'),
                maxLines: 3,
              ),
              const SizedBox(height: 18),

              // Submit Button
              ForgePrimaryButton(
                label: isEditing ? 'UPDATE APPLICATION' : 'SAVE APPLICATION',
                isLoading: _isSaving,
                onPressed: _handleSave,
              ),
            ],
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: ForgeTypography.labelSm.copyWith(color: ForgeColors.outlineVariant),
      filled: true,
      fillColor: ForgeColors.surfaceContainerLowest,
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      enabledBorder: OutlineInputBorder(
        borderRadius: ForgeSpacing.borderRadiusXs,
        borderSide: const BorderSide(color: ForgeColors.outlineVariant),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: ForgeSpacing.borderRadiusXs,
        borderSide: const BorderSide(color: ForgeColors.primary),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: ForgeSpacing.borderRadiusXs,
        borderSide: const BorderSide(color: ForgeColors.error),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: ForgeSpacing.borderRadiusXs,
        borderSide: const BorderSide(color: ForgeColors.error),
      ),
    );
  }
}
