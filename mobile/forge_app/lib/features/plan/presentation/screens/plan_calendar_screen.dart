import 'package:flutter/material.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/theme/forge_colors.dart';
import '../../../../core/theme/forge_spacing.dart';
import '../../../../core/theme/forge_typography.dart';
import '../../../../core/utils/forge_date_utils.dart';
import '../../../../core/utils/responsive_layout.dart';
import '../../../../core/sync/refresh/refresh_coordinator.dart';
import '../../data/plan_repository.dart';
import '../../data/supabase_plan_repository.dart';
import '../../domain/study_task.dart';
import '../widgets/add_directive_dialog.dart';

/// Screen: Plan & Calendar (Stitch Screen ID: 7124d4908fa546d7a4e6998e8f7c6d02)
/// Faithfully reproduces the Stitch Protocol Calendar with real data integration.
class PlanCalendarScreen extends StatefulWidget {
  final PlanRepository? repository;

  const PlanCalendarScreen({
    super.key,
    this.repository,
  });

  @override
  State<PlanCalendarScreen> createState() => _PlanCalendarScreenState();
}

class _PlanCalendarScreenState extends State<PlanCalendarScreen> {
  late final PlanRepository _repository;

  late DateTime _displayedMonth;
  late String _selectedDateStr;

  bool _isLoading = true;
  String? _errorMessage;

  Map<String, List<StudyTask>> _monthTasks = {};
  List<StudyTask> _selectedDayTasks = [];

  String _viewMode = 'Month'; // 'Month', 'Week', 'Timeline'

  @override
  void initState() {
    super.initState();
    _repository = widget.repository ?? SupabasePlanRepository();

    final now = DateTime.now();
    _displayedMonth = DateTime(now.year, now.month, 1);
    _selectedDateStr = ForgeDateUtils.todayDateString();

    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final monthMap = await _repository.getTasksForMonth(
        _displayedMonth.year,
        _displayedMonth.month,
      );
      final dayTasks = await _repository.getTasksForDate(_selectedDateStr);

      if (!mounted) return;
      setState(() {
        _monthTasks = monthMap;
        _selectedDayTasks = dayTasks;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _errorMessage = 'FAILED TO SYNC DIRECTIVES // OFFLINE';
      });
    }
  }

  Future<void> _onDateSelected(String dateStr) async {
    setState(() {
      _selectedDateStr = dateStr;
      _isLoading = true;
    });

    final tasks = await _repository.getTasksForDate(dateStr);
    if (!mounted) return;
    setState(() {
      _selectedDayTasks = tasks;
      _isLoading = false;
    });
  }

  void _previousMonth() {
    setState(() {
      _displayedMonth = DateTime(_displayedMonth.year, _displayedMonth.month - 1, 1);
    });
    _loadData();
  }

  void _nextMonth() {
    setState(() {
      _displayedMonth = DateTime(_displayedMonth.year, _displayedMonth.month + 1, 1);
    });
    _loadData();
  }

  void _goToToday() {
    final now = DateTime.now();
    setState(() {
      _displayedMonth = DateTime(now.year, now.month, 1);
      _selectedDateStr = ForgeDateUtils.todayDateString();
    });
    _loadData();
  }

  Future<void> _toggleTask(StudyTask task) async {
    final newStatus = task.isCompleted ? 'NOT_STARTED' : 'COMPLETED';
    final updated = task.copyWith(status: newStatus);

    // Optimistic UI update
    setState(() {
      final index = _selectedDayTasks.indexWhere((t) => t.id == task.id);
      if (index != -1) {
        _selectedDayTasks[index] = updated;
      }
    });

    final success = await _repository.updateTaskStatus(task.id, newStatus);
    if (!success && mounted) {
      // Revert if failed
      setState(() {
        final index = _selectedDayTasks.indexWhere((t) => t.id == task.id);
        if (index != -1) {
          _selectedDayTasks[index] = task;
        }
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: ForgeColors.errorContainer,
          content: Text(
            'CLOUD PERSISTENCE FAILED // RETRYING',
            style: ForgeTypography.labelSm.copyWith(color: ForgeColors.error),
          ),
        ),
      );
    }
  }

  void _openAddDirectiveDialog() {
    showDialog(
      context: context,
      builder: (context) {
        return AddDirectiveDialog(
          dateStr: _selectedDateStr,
          onTaskCreated: (newTask) async {
            final created = await _repository.createDirective(newTask);
            if (created != null && mounted) {
              setState(() {
                _selectedDayTasks.add(created);
                _monthTasks.putIfAbsent(created.date, () => []).add(created);
              });
            }
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return ResponsiveContentWrapper(
      maxWidth: AppConstants.maxContentWidth,
      padding: EdgeInsets.zero,
      child: RefreshIndicator(
        color: ForgeColors.primary,
        backgroundColor: ForgeColors.surfaceContainerHigh,
        onRefresh: () async {
          await RefreshCoordinator.instance.refreshPlan();
          await _loadData();
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.only(bottom: ForgeSpacing.space2Xl),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (_errorMessage != null)
                Container(
                  margin: const EdgeInsets.all(ForgeSpacing.margin),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: ForgeColors.errorContainer.withValues(alpha: 0.3),
                    borderRadius: ForgeSpacing.borderRadiusXs,
                    border: Border.all(color: ForgeColors.error.withValues(alpha: 0.5)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, size: 16, color: ForgeColors.error),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          _errorMessage!,
                          style: ForgeTypography.labelSm.copyWith(color: ForgeColors.error),
                        ),
                      ),
                    ],
                  ),
                ),

              // 1. Navigation Ribbon & Segmented Controls
              _buildRibbon(),

              // 2. 7-Column Calendar Grid Section
              _buildCalendarSection(),

              const SizedBox(height: ForgeSpacing.spaceSm),

              // 3. Selected Day Detailed Inspection Section
              _buildDayInspectionSection(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRibbon() {
    final monthTitle = ForgeDateUtils.formatMonthYear(_displayedMonth);

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: ForgeSpacing.margin,
        vertical: ForgeSpacing.spaceSm,
      ),
      decoration: const BoxDecoration(
        color: Color(0x80111317),
        border: Border(
          bottom: BorderSide(color: Color(0x35504535), width: 1.0),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Row: Label & Segmented Controls
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Flexible(
                child: Text(
                  'PROTOCOL // CALENDAR',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: ForgeTypography.labelSm.copyWith(
                    color: ForgeColors.onSurfaceVariant,
                    letterSpacing: 1.5,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              // Switcher Pills
              Container(
                padding: const EdgeInsets.all(2),
                decoration: BoxDecoration(
                  color: ForgeColors.surfaceContainer,
                  borderRadius: ForgeSpacing.borderRadiusSm,
                  border: Border.all(
                    color: ForgeColors.outlineVariant.withValues(alpha: 0.4),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: ['Month', 'Week', 'Timeline'].map((mode) {
                    final isActive = _viewMode == mode;
                    return InkWell(
                      onTap: () => setState(() => _viewMode = mode),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: isActive ? ForgeColors.surfaceContainerHigh : Colors.transparent,
                          borderRadius: ForgeSpacing.borderRadiusXs,
                          border: isActive
                              ? Border.all(color: ForgeColors.primary.withValues(alpha: 0.3))
                              : null,
                        ),
                        child: Text(
                          mode,
                          style: ForgeTypography.labelSm.copyWith(
                            color: isActive ? ForgeColors.primary : ForgeColors.onSurfaceVariant,
                            fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ],
          ),

          const SizedBox(height: 10),

          // Month Navigation Row
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    Flexible(
                      child: Text(
                        monthTitle,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: ForgeTypography.headlineMd.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '[SYNCED]',
                      style: ForgeTypography.labelSm.copyWith(
                        color: ForgeColors.tertiary,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Row(
                children: [
                  InkWell(
                    onTap: _previousMonth,
                    borderRadius: ForgeSpacing.borderRadiusXs,
                    child: Container(
                      width: 28,
                      height: 28,
                      decoration: BoxDecoration(
                        color: ForgeColors.surfaceContainerLow,
                        borderRadius: ForgeSpacing.borderRadiusXs,
                        border: Border.all(
                          color: ForgeColors.outlineVariant.withValues(alpha: 0.4),
                        ),
                      ),
                      child: const Icon(
                        Icons.chevron_left,
                        size: 18,
                        color: ForgeColors.onSurfaceVariant,
                      ),
                    ),
                  ),
                  const SizedBox(width: 4),
                  InkWell(
                    onTap: _goToToday,
                    borderRadius: ForgeSpacing.borderRadiusXs,
                    child: Container(
                      height: 28,
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: ForgeColors.surfaceContainerLow,
                        borderRadius: ForgeSpacing.borderRadiusXs,
                        border: Border.all(
                          color: ForgeColors.outlineVariant.withValues(alpha: 0.4),
                        ),
                      ),
                      child: Text(
                        'TODAY',
                        style: ForgeTypography.labelSm.copyWith(
                          color: ForgeColors.onSurfaceVariant,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 4),
                  InkWell(
                    onTap: _nextMonth,
                    borderRadius: ForgeSpacing.borderRadiusXs,
                    child: Container(
                      width: 28,
                      height: 28,
                      decoration: BoxDecoration(
                        color: ForgeColors.surfaceContainerLow,
                        borderRadius: ForgeSpacing.borderRadiusXs,
                        border: Border.all(
                          color: ForgeColors.outlineVariant.withValues(alpha: 0.4),
                        ),
                      ),
                      child: const Icon(
                        Icons.chevron_right,
                        size: 18,
                        color: ForgeColors.onSurfaceVariant,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),

          const SizedBox(height: 8),

          // Habit Quadrant Legend matching Stitch
          Container(
            padding: const EdgeInsets.only(top: 8),
            decoration: const BoxDecoration(
              border: Border(
                top: BorderSide(color: Color(0x20504535), width: 1.0),
              ),
            ),
            child: FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerLeft,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildLegendItem(ForgeColors.primaryContainer, 'DSA'),
                  const SizedBox(width: 12),
                  _buildLegendItem(ForgeColors.secondary, 'Dev Commits'),
                  const SizedBox(width: 12),
                  _buildLegendItem(ForgeColors.tertiary, 'Gym Log'),
                  const SizedBox(width: 12),
                  _buildLegendItem(const Color(0xFFA855F7), 'Core CS'),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLegendItem(Color dotColor, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 6,
          height: 6,
          decoration: BoxDecoration(
            color: dotColor,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: ForgeTypography.labelSm.copyWith(
            color: ForgeColors.onSurfaceVariant,
            fontSize: 9,
          ),
        ),
      ],
    );
  }

  Widget _buildCalendarSection() {
    final year = _displayedMonth.year;
    final month = _displayedMonth.month;
    final totalDays = ForgeDateUtils.daysInMonth(year, month);
    final firstWeekday = ForgeDateUtils.firstWeekdayOfMonth(year, month); // 0 = Mon, 6 = Sun

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: ForgeSpacing.margin, vertical: 8),
      child: Column(
        children: [
          // Weekday Labels
          const Row(
            children: [
              Expanded(child: Center(child: Text('M', style: _weekdayStyle))),
              Expanded(child: Center(child: Text('T', style: _weekdayStyle))),
              Expanded(child: Center(child: Text('W', style: _weekdayStyle))),
              Expanded(child: Center(child: Text('T', style: _weekdayStyle))),
              Expanded(child: Center(child: Text('F', style: _weekdayStyle))),
              Expanded(child: Center(child: Text('S', style: _weekdayStyle))),
              Expanded(child: Center(child: Text('S', style: _weekdayStyle))),
            ],
          ),

          const SizedBox(height: 6),

          // Calendar Grid Builder
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: 35, // 5 weeks x 7 days
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 7,
              crossAxisSpacing: 4,
              mainAxisSpacing: 4,
              childAspectRatio: 1.0,
            ),
            itemBuilder: (context, index) {
              final dayNumber = index - firstWeekday + 1;

              if (dayNumber < 1 || dayNumber > totalDays) {
                // Inactive padding days
                final displayDay = dayNumber < 1 ? (30 + dayNumber) : (dayNumber - totalDays);
                return Container(
                  padding: const EdgeInsets.all(2),
                  decoration: BoxDecoration(
                    color: ForgeColors.surface.withValues(alpha: 0.2),
                    borderRadius: ForgeSpacing.borderRadiusXs,
                    border: Border.all(color: ForgeColors.outlineVariant.withValues(alpha: 0.1)),
                  ),
                  child: Center(
                    child: Text(
                      displayDay.toString().padLeft(2, '0'),
                      style: ForgeTypography.labelSm.copyWith(
                        color: ForgeColors.outline.withValues(alpha: 0.3),
                      ),
                    ),
                  ),
                );
              }

              final dateStr = '${year.toString().padLeft(4, '0')}-${month.toString().padLeft(2, '0')}-${dayNumber.toString().padLeft(2, '0')}';
              final isToday = ForgeDateUtils.isToday(dateStr);
              final isSelected = dateStr == _selectedDateStr;
              final dayTasks = _monthTasks[dateStr] ?? [];

              // Check pillar presence
              final hasDsa = dayTasks.any((t) => t.isDsa);
              final hasDev = dayTasks.any((t) => t.isDev);
              final hasGym = dayTasks.any((t) => t.isGym);
              final hasCs = dayTasks.any((t) => t.isCoreCs);

              return InkWell(
                onTap: () => _onDateSelected(dateStr),
                borderRadius: ForgeSpacing.borderRadiusXs,
                child: Container(
                  padding: const EdgeInsets.all(2),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? ForgeColors.surfaceContainerHigh
                        : ForgeColors.surfaceContainerLow,
                    borderRadius: ForgeSpacing.borderRadiusXs,
                    border: Border.all(
                      color: isToday
                          ? ForgeColors.primary
                          : (isSelected
                              ? ForgeColors.primary.withValues(alpha: 0.6)
                              : ForgeColors.outlineVariant.withValues(alpha: 0.3)),
                      width: isToday ? 2.0 : 1.0,
                    ),
                    boxShadow: isToday
                        ? [
                            BoxShadow(
                              color: ForgeColors.primary.withValues(alpha: 0.25),
                              blurRadius: 6,
                            ),
                          ]
                        : null,
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            dayNumber.toString().padLeft(2, '0'),
                            style: ForgeTypography.labelSm.copyWith(
                              color: isToday
                                  ? ForgeColors.primary
                                  : (isSelected ? ForgeColors.onSurface : ForgeColors.onSurfaceVariant),
                              fontWeight: isToday || isSelected ? FontWeight.bold : FontWeight.w500,
                              fontSize: 10,
                            ),
                          ),
                          if (isToday)
                            Container(
                              width: 4,
                              height: 4,
                              decoration: const BoxDecoration(
                                color: ForgeColors.primary,
                                shape: BoxShape.circle,
                              ),
                            ),
                        ],
                      ),
                      // 2x2 Mini Habit Quadrants
                      Padding(
                        padding: const EdgeInsets.only(bottom: 2),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            _buildMiniDot(hasDsa, ForgeColors.primaryContainer),
                            const SizedBox(width: 2),
                            _buildMiniDot(hasDev, ForgeColors.secondary),
                            const SizedBox(width: 2),
                            _buildMiniDot(hasGym, ForgeColors.tertiary),
                            const SizedBox(width: 2),
                            _buildMiniDot(hasCs, const Color(0xFFA855F7)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildMiniDot(bool active, Color color) {
    return Container(
      width: 4,
      height: 4,
      decoration: BoxDecoration(
        color: active ? color : Colors.transparent,
        shape: BoxShape.circle,
      ),
    );
  }

  Widget _buildDayInspectionSection() {
    final isToday = ForgeDateUtils.isToday(_selectedDateStr);
    final headerDate = ForgeDateUtils.formatHeaderDate(_selectedDateStr);

    final completedCount = _selectedDayTasks.where((t) => t.isCompleted).length;
    final totalCount = _selectedDayTasks.length;
    final efficiency = totalCount > 0 ? ((completedCount / totalCount) * 100).round() : 0;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: ForgeSpacing.margin),
      decoration: BoxDecoration(
        color: ForgeColors.surfaceContainerLow,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: ForgeColors.outlineVariant.withValues(alpha: 0.6),
          width: 1.0,
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x60000000),
            offset: Offset(0, -6),
            blurRadius: 18,
          ),
        ],
      ),
      padding: const EdgeInsets.all(ForgeSpacing.spaceMd),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Drag Handle Pill
          Center(
            child: Container(
              width: 32,
              height: 4,
              decoration: BoxDecoration(
                color: ForgeColors.outlineVariant,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          const SizedBox(height: 12),

          // Sheet Header Bar
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            headerDate,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: ForgeTypography.headlineSm.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        if (isToday) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                            decoration: BoxDecoration(
                              color: ForgeColors.primary.withValues(alpha: 0.12),
                              borderRadius: ForgeSpacing.borderRadiusXs,
                              border: Border.all(color: ForgeColors.primary.withValues(alpha: 0.4)),
                            ),
                            child: Text(
                              'TODAY',
                              style: ForgeTypography.labelSm.copyWith(
                                color: ForgeColors.primary,
                                fontWeight: FontWeight.bold,
                                fontSize: 9,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Execution Protocol // $totalCount Directives Scheduled',
                      style: ForgeTypography.labelSm.copyWith(
                        color: ForgeColors.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Flexible(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Text(
                        '$completedCount/$totalCount COMPLETED',
                        style: ForgeTypography.labelSm.copyWith(
                          color: ForgeColors.tertiary,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(height: 2),
                    FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'EFFICIENCY: ',
                            style: ForgeTypography.labelSm.copyWith(
                              color: ForgeColors.onSurfaceVariant,
                              fontSize: 10,
                            ),
                          ),
                          Text(
                            '$efficiency%',
                            style: ForgeTypography.labelSm.copyWith(
                              color: ForgeColors.primary,
                              fontWeight: FontWeight.bold,
                              fontSize: 10,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Structured Checklist Timeline Blocks
          if (_isLoading) ...[
            _buildLoadingSkeleton(),
          ] else if (_selectedDayTasks.isEmpty) ...[
            _buildEmptyState(),
          ] else ...[
            ..._selectedDayTasks.map((task) => _buildDirectiveCard(task)),
          ],

          const SizedBox(height: 12),

          // Quick Action Trigger Button inside Sheet
          InkWell(
            onTap: _openAddDirectiveDialog,
            borderRadius: ForgeSpacing.borderRadiusSm,
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
              decoration: BoxDecoration(
                color: ForgeColors.surfaceContainer,
                borderRadius: ForgeSpacing.borderRadiusSm,
                border: Border.all(
                  color: ForgeColors.outlineVariant.withValues(alpha: 0.6),
                ),
              ),
              child: FittedBox(
                fit: BoxFit.scaleDown,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.add, size: 16, color: ForgeColors.primary),
                    const SizedBox(width: 8),
                    Text(
                      '+ Add Directive / Adjust Session',
                      style: ForgeTypography.labelMd.copyWith(
                        color: ForgeColors.onSurface,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDirectiveCard(StudyTask task) {
    Color badgeColor = ForgeColors.primaryContainer;
    if (task.isDev) badgeColor = ForgeColors.secondary;
    if (task.isGym) badgeColor = ForgeColors.tertiary;
    if (task.isCoreCs) badgeColor = const Color(0xFFA855F7);

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: ForgeColors.surface,
        borderRadius: ForgeSpacing.borderRadiusSm,
        border: Border.all(
          color: task.isCompleted
              ? ForgeColors.tertiary.withValues(alpha: 0.4)
              : ForgeColors.outlineVariant.withValues(alpha: 0.4),
        ),
      ),
      child: Row(
        children: [
          // Interactive Checkmark Action
          InkWell(
            onTap: () => _toggleTask(task),
            child: Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(
                color: task.isCompleted
                    ? ForgeColors.tertiary.withValues(alpha: 0.15)
                    : ForgeColors.surfaceContainer,
                borderRadius: ForgeSpacing.borderRadiusXs,
                border: Border.all(
                  color: task.isCompleted
                      ? ForgeColors.tertiary
                      : ForgeColors.outlineVariant,
                ),
              ),
              child: task.isCompleted
                  ? const Icon(Icons.check, size: 16, color: ForgeColors.tertiary)
                  : null,
            ),
          ),

          const SizedBox(width: 10),

          // Directive Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      task.category.toUpperCase(),
                      style: ForgeTypography.labelSm.copyWith(
                        color: badgeColor,
                        fontWeight: FontWeight.bold,
                        fontSize: 10,
                      ),
                    ),
                    const SizedBox(width: 5),
                    const Text('•', style: TextStyle(color: ForgeColors.outline, fontSize: 10)),
                    const SizedBox(width: 5),
                    Flexible(
                      child: Text(
                        task.startTime != null ? '${task.startTime} Scheduled' : 'Daily Routine',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: ForgeTypography.labelSm.copyWith(
                          color: ForgeColors.onSurfaceVariant,
                          fontSize: 10,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 2),
                Text(
                  task.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: ForgeTypography.bodySm.copyWith(
                    color: ForgeColors.onSurface,
                    fontWeight: FontWeight.w500,
                    decoration: task.isCompleted ? TextDecoration.lineThrough : null,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(width: 8),

          // Trailing Status Pill
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: task.isCompleted
                  ? ForgeColors.tertiary.withValues(alpha: 0.12)
                  : ForgeColors.surfaceContainer,
              borderRadius: ForgeSpacing.borderRadiusXs,
              border: Border.all(
                color: task.isCompleted
                    ? ForgeColors.tertiary.withValues(alpha: 0.4)
                    : ForgeColors.outlineVariant.withValues(alpha: 0.4),
              ),
            ),
            child: Text(
              task.isCompleted ? 'DONE' : 'SLOTTED',
              style: ForgeTypography.labelSm.copyWith(
                color: task.isCompleted ? ForgeColors.tertiary : ForgeColors.onSurfaceVariant,
                fontWeight: FontWeight.bold,
                fontSize: 9,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingSkeleton() {
    return Column(
      children: List.generate(3, (index) {
        return Container(
          margin: const EdgeInsets.only(bottom: 8),
          height: 52,
          decoration: BoxDecoration(
            color: ForgeColors.surface.withValues(alpha: 0.5),
            borderRadius: ForgeSpacing.borderRadiusSm,
            border: Border.all(color: ForgeColors.outlineVariant.withValues(alpha: 0.2)),
          ),
          child: Center(
            child: Text(
              'TELEMETRY SYNCING // [FETCHING]',
              style: ForgeTypography.labelSm.copyWith(
                color: ForgeColors.outline,
                letterSpacing: 1.0,
              ),
            ),
          ),
        );
      }),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
      alignment: Alignment.center,
      child: Column(
        children: [
          const Icon(Icons.event_available, size: 28, color: ForgeColors.outline),
          const SizedBox(height: 8),
          Text(
            'NO DIRECTIVES SLOTTED // REST PROTOCOL',
            style: ForgeTypography.labelSm.copyWith(
              color: ForgeColors.outline,
              letterSpacing: 1.0,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Slot a technical problem, project commit, or gym session.',
            textAlign: TextAlign.center,
            style: ForgeTypography.bodySm.copyWith(
              color: ForgeColors.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

const TextStyle _weekdayStyle = TextStyle(
  fontFamily: 'JetBrains Mono',
  fontSize: 11,
  fontWeight: FontWeight.w600,
  color: ForgeColors.outline,
);
