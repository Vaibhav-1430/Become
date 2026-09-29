import 'package:flutter/material.dart';
import '../../../../core/theme/forge_colors.dart';
import '../../../../core/theme/forge_spacing.dart';
import '../../../../core/theme/forge_typography.dart';
import '../../../../shared/widgets/forge_button.dart';
import '../../../../shared/widgets/forge_text_field.dart';
import '../../domain/study_task.dart';

/// Modal dialog for quickly adding a study directive to a date.
class AddDirectiveDialog extends StatefulWidget {
  final String dateStr;
  final Function(StudyTask task) onTaskCreated;

  const AddDirectiveDialog({
    super.key,
    required this.dateStr,
    required this.onTaskCreated,
  });

  @override
  State<AddDirectiveDialog> createState() => _AddDirectiveDialogState();
}

class _AddDirectiveDialogState extends State<AddDirectiveDialog> {
  final _titleController = TextEditingController();
  final _startTimeController = TextEditingController(text: '16:00');
  String _category = 'DSA';

  final List<String> _categories = ['DSA', 'DEV', 'GYM', 'CORE CS'];

  @override
  void dispose() {
    _titleController.dispose();
    _startTimeController.dispose();
    super.dispose();
  }

  void _submit() {
    final title = _titleController.text.trim();
    if (title.isEmpty) return;

    final newTask = StudyTask(
      id: 'task_${DateTime.now().millisecondsSinceEpoch}',
      userId: '',
      date: widget.dateStr,
      taskId: 'dir_${DateTime.now().millisecondsSinceEpoch}',
      title: title,
      category: _category,
      startTime: _startTimeController.text.trim(),
      status: 'NOT_STARTED',
      isStudy: _category != 'GYM',
    );

    widget.onTaskCreated(newTask);
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: ForgeColors.surface,
      shape: RoundedRectangleBorder(
        borderRadius: ForgeSpacing.borderRadiusMd,
        side: const BorderSide(color: ForgeColors.surfaceContainerHigh, width: 1),
      ),
      child: Padding(
        padding: const EdgeInsets.all(ForgeSpacing.spaceLg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'SLOT NEW DIRECTIVE',
                  style: ForgeTypography.labelMd.copyWith(
                    color: ForgeColors.primary,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1.0,
                  ),
                ),
                Text(
                  widget.dateStr,
                  style: ForgeTypography.labelSm.copyWith(
                    color: ForgeColors.outline,
                  ),
                ),
              ],
            ),
            const SizedBox(height: ForgeSpacing.spaceMd),
            ForgeTextField(
              label: 'DIRECTIVE TITLE',
              controller: _titleController,
              hintText: 'e.g. Graph BFS Traversal',
              isRequired: true,
            ),
            const SizedBox(height: ForgeSpacing.spaceMd),
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'PILLAR / TRACK',
                        style: ForgeTypography.labelSm.copyWith(
                          color: ForgeColors.onSurfaceVariant,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        decoration: BoxDecoration(
                          color: ForgeColors.surfaceContainerLow,
                          borderRadius: ForgeSpacing.borderRadiusXs,
                          border: Border.all(color: ForgeColors.surfaceContainer),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButton<String>(
                            value: _category,
                            isExpanded: true,
                            dropdownColor: ForgeColors.surfaceContainerHigh,
                            items: _categories.map((c) {
                              return DropdownMenuItem(
                                value: c,
                                child: Text(c, style: ForgeTypography.labelSm),
                              );
                            }).toList(),
                            onChanged: (val) {
                              if (val != null) setState(() => _category = val);
                            },
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: ForgeSpacing.spaceSm),
                Expanded(
                  child: ForgeTextField(
                    label: 'SCHEDULED TIME',
                    controller: _startTimeController,
                    hintText: '16:00',
                  ),
                ),
              ],
            ),
            const SizedBox(height: ForgeSpacing.spaceLg),
            ForgePrimaryButton(
              label: 'CONFIRM DIRECTIVE',
              onPressed: _submit,
            ),
          ],
        ),
      ),
    );
  }
}
