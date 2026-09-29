import 'package:flutter/material.dart';
import '../../../../core/theme/forge_colors.dart';
import '../../../../core/theme/forge_spacing.dart';
import '../../../../core/theme/forge_typography.dart';
import '../../../../shared/widgets/forge_button.dart';
import '../../domain/mistake.dart';

/// Modal bottom sheet for logging or editing an error entry in Mistake Bank.
class AddEditMistakeSheet extends StatefulWidget {
  final Mistake? initialMistake;
  final Future<void> Function(Mistake mistake) onSave;

  const AddEditMistakeSheet({
    super.key,
    this.initialMistake,
    required this.onSave,
  });

  static Future<void> show(
    BuildContext context, {
    Mistake? initialMistake,
    required Future<void> Function(Mistake mistake) onSave,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: ForgeColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => AddEditMistakeSheet(
        initialMistake: initialMistake,
        onSave: onSave,
      ),
    );
  }

  @override
  State<AddEditMistakeSheet> createState() => _AddEditMistakeSheetState();
}

class _AddEditMistakeSheetState extends State<AddEditMistakeSheet> {
  final _formKey = GlobalKey<FormState>();

  late final TextEditingController _questionCtrl;
  late final TextEditingController _topicCtrl;
  late final TextEditingController _sourceCtrl;
  late final TextEditingController _userAnsCtrl;
  late final TextEditingController _correctAnsCtrl;
  late final TextEditingController _explanationCtrl;
  late final TextEditingController _personalNoteCtrl;

  late String _selectedSubject;
  late String _selectedType;
  late String _revisitDate;
  bool _isSaving = false;

  final List<String> _subjects = ['DSA', 'Development', 'Core CS', 'College', 'Other'];
  final List<String> _types = [
    'Conceptual mistake',
    'Logic mistake',
    'Syntax mistake',
    'Calculation mistake',
    'Misread question',
    'Time pressure',
    'Edge case',
    'Careless mistake',
    'Unknown',
  ];

  @override
  void initState() {
    super.initState();
    final m = widget.initialMistake;
    _questionCtrl = TextEditingController(text: m?.question ?? '');
    _topicCtrl = TextEditingController(text: m?.topic ?? '');
    _sourceCtrl = TextEditingController(text: m?.source ?? 'FORGE Question');
    _userAnsCtrl = TextEditingController(text: m?.userAnswer ?? '');
    _correctAnsCtrl = TextEditingController(text: m?.correctAnswer ?? '');
    _explanationCtrl = TextEditingController(text: m?.explanation ?? '');
    _personalNoteCtrl = TextEditingController(text: m?.personalNote ?? '');

    _selectedSubject = m?.subject ?? 'DSA';
    if (!_subjects.contains(_selectedSubject)) _selectedSubject = 'DSA';

    _selectedType = m?.mistakeType ?? 'Conceptual mistake';
    if (!_types.contains(_selectedType)) _selectedType = 'Conceptual mistake';

    final todayStr = DateTime.now().toIso8601String().substring(0, 10);
    _revisitDate = m?.revisitDate ?? todayStr;
  }

  @override
  void dispose() {
    _questionCtrl.dispose();
    _topicCtrl.dispose();
    _sourceCtrl.dispose();
    _userAnsCtrl.dispose();
    _correctAnsCtrl.dispose();
    _explanationCtrl.dispose();
    _personalNoteCtrl.dispose();
    super.dispose();
  }

  Future<void> _handleSave() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);

    try {
      final todayStr = DateTime.now().toIso8601String().substring(0, 10);
      final m = widget.initialMistake;

      final updated = Mistake(
        id: m?.id ?? '',
        userId: m?.userId ?? '',
        question: _questionCtrl.text.trim(),
        subject: _selectedSubject,
        topic: _topicCtrl.text.trim().isNotEmpty ? _topicCtrl.text.trim() : 'General',
        source: _sourceCtrl.text.trim().isNotEmpty ? _sourceCtrl.text.trim() : 'FORGE Question',
        date: m?.date ?? todayStr,
        userAnswer: _userAnsCtrl.text.trim().isNotEmpty ? _userAnsCtrl.text.trim() : null,
        correctAnswer: _correctAnsCtrl.text.trim().isNotEmpty ? _correctAnsCtrl.text.trim() : null,
        explanation: _explanationCtrl.text.trim().isNotEmpty ? _explanationCtrl.text.trim() : null,
        mistakeType: _selectedType,
        personalNote: _personalNoteCtrl.text.trim().isNotEmpty ? _personalNoteCtrl.text.trim() : null,
        revisitDate: _revisitDate,
        repeatCount: m?.repeatCount ?? 1,
        resolved: m?.resolved ?? false,
      );

      await widget.onSave(updated);
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save mistake: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset),
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.88,
        ),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(ForgeSpacing.margin),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              mainAxisSize: MainAxisSize.min,
              children: [
                // Drag handle
                Center(
                  child: Container(
                    width: 36,
                    height: 4,
                    decoration: BoxDecoration(
                      color: ForgeColors.outlineVariant,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 12),

                // Title
                Row(
                  children: [
                    const Icon(Icons.shield_outlined, color: ForgeColors.primaryContainer, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      widget.initialMistake != null
                          ? 'EDIT MISTAKE DEFENSE'
                          : 'LOG NEW MISTAKE',
                      style: ForgeTypography.headlineSm.copyWith(
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.0,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Question Title
                Text('QUESTION / PROBLEM TITLE *', style: ForgeTypography.labelSm.copyWith(color: ForgeColors.outline)),
                const SizedBox(height: 6),
                TextFormField(
                  controller: _questionCtrl,
                  style: ForgeTypography.bodyMd,
                  decoration: const InputDecoration(
                    hintText: 'e.g. Longest Repeating Character Replacement',
                  ),
                  validator: (v) => (v == null || v.trim().isEmpty) ? 'Question title is required' : null,
                ),
                const SizedBox(height: 14),

                // Subject & Topic row
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('SUBJECT *', style: ForgeTypography.labelSm.copyWith(color: ForgeColors.outline)),
                          const SizedBox(height: 6),
                          DropdownButtonFormField<String>(
                            initialValue: _selectedSubject,
                            items: _subjects
                                .map((s) => DropdownMenuItem(value: s, child: Text(s, style: ForgeTypography.bodyMd)))
                                .toList(),
                            onChanged: (v) => setState(() => _selectedSubject = v ?? 'DSA'),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('TOPIC / VECTOR', style: ForgeTypography.labelSm.copyWith(color: ForgeColors.outline)),
                          const SizedBox(height: 6),
                          TextFormField(
                            controller: _topicCtrl,
                            style: ForgeTypography.bodyMd,
                            decoration: const InputDecoration(
                              hintText: 'e.g. Sliding Window',
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),

                // Mistake Type & Source
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('MISTAKE TYPE', style: ForgeTypography.labelSm.copyWith(color: ForgeColors.outline)),
                          const SizedBox(height: 6),
                          DropdownButtonFormField<String>(
                            initialValue: _selectedType,
                            isExpanded: true,
                            items: _types
                                .map((t) => DropdownMenuItem(value: t, child: Text(t, style: ForgeTypography.bodySm)))
                                .toList(),
                            onChanged: (v) => setState(() => _selectedType = v ?? 'Conceptual mistake'),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('SOURCE / EXAM', style: ForgeTypography.labelSm.copyWith(color: ForgeColors.outline)),
                          const SizedBox(height: 6),
                          TextFormField(
                            controller: _sourceCtrl,
                            style: ForgeTypography.bodyMd,
                            decoration: const InputDecoration(
                              hintText: 'e.g. LeetCode 424',
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),

                // User Answer & Correct Answer
                Text('YOUR ANSWER (DEFICIT)', style: ForgeTypography.labelSm.copyWith(color: ForgeColors.error)),
                const SizedBox(height: 6),
                TextFormField(
                  controller: _userAnsCtrl,
                  style: ForgeTypography.bodySm,
                  maxLines: 2,
                  decoration: const InputDecoration(
                    hintText: 'What was submitted or attempted incorrectly?',
                  ),
                ),
                const SizedBox(height: 14),

                Text('CORRECT ANSWER (DEFENSE PROTOCOL)', style: ForgeTypography.labelSm.copyWith(color: ForgeColors.tertiary)),
                const SizedBox(height: 6),
                TextFormField(
                  controller: _correctAnsCtrl,
                  style: ForgeTypography.bodySm,
                  maxLines: 2,
                  decoration: const InputDecoration(
                    hintText: 'What is the correct solution or algorithmic invariant?',
                  ),
                ),
                const SizedBox(height: 14),

                // Explanation & Personal Note
                Text('CONCEPT EXPLANATION', style: ForgeTypography.labelSm.copyWith(color: ForgeColors.secondary)),
                const SizedBox(height: 6),
                TextFormField(
                  controller: _explanationCtrl,
                  style: ForgeTypography.bodySm,
                  maxLines: 2,
                  decoration: const InputDecoration(
                    hintText: 'Why does the correct solution hold?',
                  ),
                ),
                const SizedBox(height: 14),

                Text('PERSONAL NOTE / WHY I FAILED', style: ForgeTypography.labelSm.copyWith(color: ForgeColors.primaryContainer)),
                const SizedBox(height: 6),
                TextFormField(
                  controller: _personalNoteCtrl,
                  style: ForgeTypography.bodySm,
                  decoration: const InputDecoration(
                    hintText: 'e.g. Forgot edge case where k == 0',
                  ),
                ),
                const SizedBox(height: 14),

                // Revisit Date picker
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('REVISIT DATE (SRS):', style: ForgeTypography.labelSm.copyWith(color: ForgeColors.outline)),
                    TextButton.icon(
                      onPressed: () async {
                        final picked = await showDatePicker(
                          context: context,
                          initialDate: DateTime.tryParse(_revisitDate) ?? DateTime.now(),
                          firstDate: DateTime.now().subtract(const Duration(days: 30)),
                          lastDate: DateTime.now().add(const Duration(days: 365)),
                          builder: (context, child) {
                            return Theme(
                              data: ThemeData.dark().copyWith(
                                colorScheme: const ColorScheme.dark(
                                  primary: ForgeColors.primaryContainer,
                                  surface: ForgeColors.surfaceContainer,
                                ),
                              ),
                              child: child!,
                            );
                          },
                        );
                        if (picked != null) {
                          setState(() {
                            _revisitDate = picked.toIso8601String().substring(0, 10);
                          });
                        }
                      },
                      icon: const Icon(Icons.calendar_today, size: 16, color: ForgeColors.primaryContainer),
                      label: Text(
                        _revisitDate,
                        style: ForgeTypography.labelMd.copyWith(color: ForgeColors.primaryContainer, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                ForgePrimaryButton(
                  label: widget.initialMistake != null ? 'SAVE CHANGES' : 'LOG MISTAKE TO DEFENSE BANK',
                  isLoading: _isSaving,
                  leading: const Icon(Icons.check, size: 18, color: ForgeColors.canvas),
                  onPressed: _handleSave,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
