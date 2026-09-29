import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../../core/theme/forge_colors.dart';
import '../../../../core/theme/forge_typography.dart';

/// Technical C++ code editor widget for mobile screens.
/// Features synchronized line numbers, monospace styling, and code reset controls.
class CodeEditorWidget extends StatefulWidget {
  final String initialCode;
  final String? starterCode;
  final ValueChanged<String> onCodeChanged;

  const CodeEditorWidget({
    super.key,
    required this.initialCode,
    this.starterCode,
    required this.onCodeChanged,
  });

  @override
  State<CodeEditorWidget> createState() => _CodeEditorWidgetState();
}

class _CodeEditorWidgetState extends State<CodeEditorWidget> {
  late final TextEditingController _controller;
  int _lineCount = 1;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.initialCode);
    _lineCount = _countLines(widget.initialCode);
    _controller.addListener(_handleTextChange);
  }

  @override
  void didUpdateWidget(covariant CodeEditorWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.initialCode != oldWidget.initialCode && widget.initialCode != _controller.text) {
      _controller.text = widget.initialCode;
      _lineCount = _countLines(widget.initialCode);
    }
  }

  @override
  void dispose() {
    _controller.removeListener(_handleTextChange);
    _controller.dispose();
    super.dispose();
  }

  int _countLines(String text) {
    if (text.isEmpty) return 1;
    return '\n'.allMatches(text).length + 1;
  }

  void _handleTextChange() {
    final text = _controller.text;
    final lines = _countLines(text);
    if (lines != _lineCount) {
      setState(() => _lineCount = lines);
    }
    widget.onCodeChanged(text);
  }

  void _resetCode() {
    if (widget.starterCode != null) {
      _controller.text = widget.starterCode!;
      widget.onCodeChanged(widget.starterCode!);
    }
  }

  @override
  Widget build(BuildContext context) {
    final monoStyle = GoogleFonts.jetBrainsMono(
      fontSize: 13,
      height: 1.45,
      color: ForgeColors.textPrimary,
    );

    final lineNumStyle = GoogleFonts.jetBrainsMono(
      fontSize: 12,
      height: 1.45,
      color: ForgeColors.textSecondary.withValues(alpha: 0.5),
    );

    return Container(
      decoration: BoxDecoration(
        color: ForgeColors.canvas,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: ForgeColors.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Editor Toolbar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: const BoxDecoration(
              color: ForgeColors.surfaceLevel1,
              borderRadius: BorderRadius.vertical(top: Radius.circular(7)),
              border: Border(bottom: BorderSide(color: ForgeColors.borderSubtle)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Row(
                    children: [
                      const Icon(
                        Icons.code,
                        size: 14,
                        color: ForgeColors.accentAmber,
                      ),
                      const SizedBox(width: 6),
                      Flexible(
                        child: Text(
                          'C++17 (GCC)',
                          overflow: TextOverflow.ellipsis,
                          style: ForgeTypography.labelSm.copyWith(
                            color: ForgeColors.textPrimary,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                if (widget.starterCode != null)
                  InkWell(
                    onTap: _resetCode,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.restart_alt,
                            size: 13,
                            color: ForgeColors.textSecondary,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            'Reset',
                            style: ForgeTypography.labelSm.copyWith(
                              color: ForgeColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ),
          // Code Area with Line Numbers
          Container(
            constraints: const BoxConstraints(minHeight: 180, maxHeight: 320),
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: SingleChildScrollView(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Line Number Gutter
                  Container(
                    width: 38,
                    padding: const EdgeInsets.only(right: 8),
                    alignment: Alignment.topRight,
                    child: Text(
                      List.generate(_lineCount, (i) => '${i + 1}').join('\n'),
                      style: lineNumStyle,
                      textAlign: TextAlign.right,
                    ),
                  ),
                  Container(
                    width: 1,
                    height: _lineCount * 18.8,
                    color: ForgeColors.borderSubtle,
                  ),
                  // Code Input Area
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 10),
                      child: TextField(
                        controller: _controller,
                        maxLines: null,
                        keyboardType: TextInputType.multiline,
                        autocorrect: false,
                        enableSuggestions: false,
                        style: monoStyle,
                        decoration: const InputDecoration(
                          border: InputBorder.none,
                          isDense: true,
                          contentPadding: EdgeInsets.zero,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
