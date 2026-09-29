import 'package:flutter/material.dart';
import '../../../../core/supabase/supabase_client.dart';
import '../../../../core/sync/refresh/refresh_coordinator.dart';
import '../../../../core/utils/uuid_generator.dart';
import '../../../auth/data/auth_service.dart';
import '../../data/canonical_workout_data.dart';
import '../../data/gym_repository.dart';
import '../../data/gym_storage_service.dart';
import '../../data/mock_gym_repository.dart';
import '../../data/supabase_gym_repository.dart';
import '../../domain/exercise.dart';
import '../../domain/workout_session.dart';
import '../../domain/workout_template.dart';
import '../../domain/workout_plan.dart';
import '../../domain/personal_record.dart';
import '../widgets/workout_history_card.dart';
import '../widgets/pr_card.dart';
import 'gym_checkin_screen.dart';
import 'workout_session_screen.dart';

/// Screen implementing Stitch Screen 09d7f82984264f08ade0b06b04e56d8e
/// FORGE TRAIN / Gym Tracker dashboard.
class GymScreen extends StatefulWidget {
  const GymScreen({
    super.key,
    this.userId,
    this.repository,
    this.storageService,
  });

  final String? userId;
  final GymRepository? repository;
  final GymStorageService? storageService;

  @override
  State<GymScreen> createState() => _GymScreenState();
}

class _GymScreenState extends State<GymScreen> {
  bool _isLoading = true;
  bool _isRefreshing = false;
  String? _errorMessage;
  WorkoutTemplate? _todayTemplate;
  WorkoutSession? _todaySession;
  List<WorkoutSession> _history = [];
  List<PersonalRecord> _prs = [];

  // Tab view within gym screen: 0: Overview / Today, 1: History, 2: PRs
  int _selectedTab = 0;

  String get _effectiveUserId =>
      widget.userId ?? AuthService.current.currentUser?.id ?? ForgeSupabase.instance.client?.auth.currentUser?.id ?? '';

  GymRepository get _effectiveRepository {
    if (widget.repository != null) return widget.repository!;
    final userId = _effectiveUserId;
    final client = ForgeSupabase.instance.client;
    if (ForgeSupabase.instance.isInitialized && userId.isNotEmpty) {
      return SupabaseGymRepository(
        client: client,
        currentUserId: userId,
      );
    }
    return MockGymRepository(userId: userId.isNotEmpty ? userId : 'mock-athlete-1430');
  }

  GymStorageService get _effectiveStorageService {
    if (widget.storageService != null) return widget.storageService!;
    if (ForgeSupabase.instance.isInitialized) {
      return GymStorageService(client: ForgeSupabase.instance.client);
    }
    return GymStorageService();
  }

  @override
  void initState() {
    super.initState();
    _loadGymData();
  }

  @override
  void didUpdateWidget(covariant GymScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.userId != widget.userId) {
      _loadGymData();
    }
  }

  Future<void> _loadGymData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final now = DateTime.now();
      final template = await _effectiveRepository.getWorkoutPlanForDate(
        userId: _effectiveUserId,
        date: now,
      );
      final todaySess = await _effectiveRepository.getTodaySession(
        userId: _effectiveUserId,
        date: now,
      );
      final history = await _effectiveRepository.getWorkoutHistory(
        userId: _effectiveUserId,
        limit: 20,
      );
      final prs = await _effectiveRepository.getPersonalRecords(
        userId: _effectiveUserId,
      );

      if (mounted) {
        setState(() {
          _todayTemplate = template;
          _todaySession = todaySess;
          _history = history;
          _prs = prs;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString().replaceAll('Exception: ', '');
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _startWorkoutFlow() async {
    if (_todayTemplate == null || _todayTemplate!.isRestDay) return;

    // Check if there is already a completed session today
    if (_todaySession != null && _todaySession!.isCompleted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: Color(0xFF10B981),
          content: Text(
            'TODAY\'S WORKOUT IS ALREADY COMPLETED.',
            style: TextStyle(fontFamily: 'JetBrains Mono', fontWeight: FontWeight.bold),
          ),
        ),
      );
      return;
    }

    final now = DateTime.now();
    final tempSessionId = UuidGenerator.v4();

    // Step 1: Mandatory Gym Camera Check-in
    final checkinResult = await Navigator.of(context).push<String>(
      MaterialPageRoute(
        builder: (ctx) => GymCheckinScreen(
          userId: _effectiveUserId,
          sessionId: tempSessionId,
          storageService: _effectiveStorageService,
        ),
      ),
    );

    if (checkinResult == null || checkinResult.isEmpty) {
      // User cancelled check-in; workout cannot start
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: Color(0xFFEF4444),
            content: Text(
              'PHOTO CHECK-IN REQUIRED PRIOR TO LIFTING.',
              style: TextStyle(fontFamily: 'JetBrains Mono', fontWeight: FontWeight.bold),
            ),
          ),
        );
      }
      return;
    }

    // Step 2: Initialize real session with verified photo path
    try {
      var template = _todayTemplate!;
      if (template.exercises.isEmpty && !template.isRestDay) {
        final dayKey = getDayKeyForDate(now);
        final canonical = kCanonicalSchedule[dayKey];
        if (canonical != null && canonical.exercises.isNotEmpty) {
          template = template.copyWith(exercises: canonical.exercises);
        }
      }

      final session = await _effectiveRepository.createWorkoutSession(
        userId: _effectiveUserId,
        template: template,
        gymPhotoPath: checkinResult,
      );

      if (!mounted) return;

      // Step 3: Open active workout session logger
      await Navigator.of(context).push(
        MaterialPageRoute(
          builder: (ctx) => WorkoutSessionScreen(
            session: session,
            repository: _effectiveRepository,
          ),
        ),
      );

      // Reload data on return from session
      _loadGymData();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFEF4444),
            content: Text(
              'Failed to initialize session: $e',
              style: const TextStyle(fontFamily: 'Inter'),
            ),
          ),
        );
      }
    }
  }

  Future<void> _handleRefresh() async {
    setState(() => _isRefreshing = true);
    try {
      await RefreshCoordinator.instance.refreshGym();
      await _loadGymData();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: Color(0xFF10B981),
            content: Text('Gym protocols synced with cloud', style: TextStyle(fontFamily: 'Inter')),
            duration: Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFEF4444),
            content: Text('Gym sync failed: $e', style: const TextStyle(fontFamily: 'Inter')),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isRefreshing = false);
      }
    }
  }

  Future<void> _confirmDeleteSession(WorkoutSession session) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF13171F),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        title: const Text(
          'DELETE WORKOUT?',
          style: TextStyle(
            fontFamily: 'JetBrains Mono',
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: Color(0xFFEF4444),
            letterSpacing: 1.0,
          ),
        ),
        content: const Text(
          'This permanently removes the selected workout data from cloud and local storage.',
          style: TextStyle(
            fontFamily: 'Inter',
            fontSize: 13,
            color: Color(0xFF8B949E),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text(
              'CANCEL',
              style: TextStyle(
                fontFamily: 'JetBrains Mono',
                color: Color(0xFF8B949E),
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFEF4444),
              foregroundColor: Colors.white,
            ),
            child: const Text(
              'DELETE',
              style: TextStyle(
                fontFamily: 'JetBrains Mono',
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await _effectiveRepository.deleteWorkoutSession(session.id);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              backgroundColor: Color(0xFF10B981),
              content: Text('Workout session permanently deleted', style: TextStyle(fontFamily: 'Inter')),
            ),
          );
        }
        await _loadGymData();
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              backgroundColor: const Color(0xFFEF4444),
              content: Text('Failed to delete workout: $e', style: const TextStyle(fontFamily: 'Inter')),
            ),
          );
        }
      }
    }
  }

  void _showSessionDetails(WorkoutSession session) {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF13171F),
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) {
        return DraggableScrollableSheet(
          initialChildSize: 0.6,
          minChildSize: 0.3,
          maxChildSize: 0.9,
          expand: false,
          builder: (context, scrollController) {
            return Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        session.routineName.toUpperCase(),
                        style: const TextStyle(
                          fontFamily: 'JetBrains Mono',
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFFE5A93C),
                        ),
                      ),
                      Text(
                        '${session.durationMinutes}m · ${session.totalVolumeKg.toInt()} kg · ${session.totalSets} sets',
                        style: const TextStyle(
                          fontFamily: 'JetBrains Mono',
                          fontSize: 11,
                          color: Color(0xFF8B949E),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  if (session.exercises.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 24),
                      child: Center(
                        child: Text(
                          'No individual exercises recorded for this session.',
                          style: TextStyle(fontFamily: 'Inter', color: Color(0xFF8B949E), fontSize: 13),
                        ),
                      ),
                    )
                  else
                    Expanded(
                      child: ListView.builder(
                        controller: scrollController,
                        itemCount: session.exercises.length,
                        itemBuilder: (context, i) {
                          final we = session.exercises[i];
                          return Container(
                            margin: const EdgeInsets.only(bottom: 10),
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: const Color(0xFF0C0E12),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: const Color(0xFF1F2430)),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  we.exerciseName,
                                  style: const TextStyle(
                                    fontFamily: 'Inter',
                                    fontSize: 13,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFFF0F6FC),
                                  ),
                                ),
                                const SizedBox(height: 6),
                                if (we.sets.isEmpty)
                                  const Text(
                                    'No sets recorded',
                                    style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 10, color: Color(0xFF6E7681)),
                                  )
                                else
                                  Wrap(
                                    spacing: 8,
                                    runSpacing: 4,
                                    children: we.sets.map((s) {
                                      return Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF13171F),
                                          borderRadius: BorderRadius.circular(4),
                                          border: Border.all(color: const Color(0xFF2E3440)),
                                        ),
                                        child: Text(
                                          'Set ${s.setNumber}: ${s.weightKg.toInt()}kg × ${s.reps}r',
                                          style: const TextStyle(
                                            fontFamily: 'JetBrains Mono',
                                            fontSize: 10,
                                            color: Color(0xFF8B949E),
                                          ),
                                        ),
                                      );
                                    }).toList(),
                                  ),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Future<void> _showAddExerciseModal() async {
    try {
      final exercises = await _effectiveRepository.getAllExercises();
      if (!mounted) return;

      showModalBottomSheet(
        context: context,
        backgroundColor: const Color(0xFF13171F),
        isScrollControlled: true,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
        ),
        builder: (ctx) {
          String searchQuery = '';
          return StatefulBuilder(
            builder: (context, setModalState) {
              final filtered = exercises.where((e) {
                if (searchQuery.isEmpty) return true;
                final q = searchQuery.toLowerCase();
                return e.name.toLowerCase().contains(q) ||
                    e.muscleGroup.toLowerCase().contains(q);
              }).toList();

              return DraggableScrollableSheet(
                initialChildSize: 0.75,
                minChildSize: 0.4,
                maxChildSize: 0.95,
                expand: false,
                builder: (context, scrollController) {
                  return Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'EXERCISE CATALOGUE',
                              style: TextStyle(
                                fontFamily: 'JetBrains Mono',
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFFE5A93C),
                                letterSpacing: 1.0,
                              ),
                            ),
                            TextButton.icon(
                              onPressed: () async {
                                Navigator.of(ctx).pop();
                                await _showCreateCustomExerciseDialog();
                              },
                              icon: const Icon(Icons.add, size: 16, color: Color(0xFFE5A93C)),
                              label: const Text(
                                'CUSTOM',
                                style: TextStyle(
                                  fontFamily: 'JetBrains Mono',
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFFE5A93C),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        TextField(
                          onChanged: (val) => setModalState(() => searchQuery = val),
                          style: const TextStyle(color: Color(0xFFF0F6FC), fontFamily: 'Inter', fontSize: 13),
                          decoration: InputDecoration(
                            hintText: 'Search exercises or muscle groups...',
                            hintStyle: const TextStyle(color: Color(0xFF6E7681), fontFamily: 'Inter', fontSize: 12),
                            prefixIcon: const Icon(Icons.search, color: Color(0xFF8B949E), size: 18),
                            filled: true,
                            fillColor: const Color(0xFF0C0E12),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: const BorderSide(color: Color(0xFF1F2430)),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: const BorderSide(color: Color(0xFF1F2430)),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                              borderSide: const BorderSide(color: Color(0xFFE5A93C)),
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        Expanded(
                          child: filtered.isEmpty
                              ? const Center(
                                  child: Text(
                                    'No matching exercises found',
                                    style: TextStyle(fontFamily: 'Inter', color: Color(0xFF8B949E), fontSize: 12),
                                  ),
                                )
                              : ListView.builder(
                                  controller: scrollController,
                                  itemCount: filtered.length,
                                  itemBuilder: (context, i) {
                                    final ex = filtered[i];
                                    return Container(
                                      margin: const EdgeInsets.only(bottom: 8),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFF0C0E12),
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(color: const Color(0xFF1F2430)),
                                      ),
                                      child: ListTile(
                                        dense: true,
                                        title: Text(
                                          ex.name,
                                          style: const TextStyle(
                                            fontFamily: 'Inter',
                                            fontSize: 13,
                                            fontWeight: FontWeight.w600,
                                            color: Color(0xFFF0F6FC),
                                          ),
                                        ),
                                        subtitle: Text(
                                          '${ex.muscleGroup.toUpperCase()} · ${ex.defaultSets} sets × ${ex.defaultReps} reps',
                                          style: const TextStyle(
                                            fontFamily: 'JetBrains Mono',
                                            fontSize: 10,
                                            color: Color(0xFF8B949E),
                                          ),
                                        ),
                                        trailing: IconButton(
                                          icon: const Icon(Icons.add_circle_outline, color: Color(0xFFE5A93C), size: 20),
                                          onPressed: () async {
                                            Navigator.of(ctx).pop();
                                            await _addExerciseToCurrentPlan(ex);
                                          },
                                        ),
                                      ),
                                    );
                                  },
                                ),
                        ),
                      ],
                    ),
                  );
                },
              );
            },
          );
        },
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFEF4444),
            content: Text('Failed to load exercise catalogue: $e', style: const TextStyle(fontFamily: 'Inter')),
          ),
        );
      }
    }
  }

  Future<void> _showCreateCustomExerciseDialog() async {
    final nameCtrl = TextEditingController();
    final muscleCtrl = TextEditingController(text: 'Chest');
    final setsCtrl = TextEditingController(text: '3');
    final repsCtrl = TextEditingController(text: '10');

    final created = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF13171F),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        title: const Text(
          'CREATE CUSTOM EXERCISE',
          style: TextStyle(
            fontFamily: 'JetBrains Mono',
            fontSize: 13,
            fontWeight: FontWeight.bold,
            color: Color(0xFFE5A93C),
            letterSpacing: 1.0,
          ),
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameCtrl,
                style: const TextStyle(color: Color(0xFFF0F6FC), fontFamily: 'Inter', fontSize: 13),
                decoration: const InputDecoration(
                  labelText: 'Exercise Name',
                  labelStyle: TextStyle(color: Color(0xFF8B949E), fontFamily: 'Inter', fontSize: 12),
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: muscleCtrl,
                style: const TextStyle(color: Color(0xFFF0F6FC), fontFamily: 'Inter', fontSize: 13),
                decoration: const InputDecoration(
                  labelText: 'Muscle Group (e.g. Chest, Back, Legs)',
                  labelStyle: TextStyle(color: Color(0xFF8B949E), fontFamily: 'Inter', fontSize: 12),
                ),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: setsCtrl,
                      keyboardType: TextInputType.number,
                      style: const TextStyle(color: Color(0xFFF0F6FC), fontFamily: 'Inter', fontSize: 13),
                      decoration: const InputDecoration(
                        labelText: 'Default Sets',
                        labelStyle: TextStyle(color: Color(0xFF8B949E), fontFamily: 'Inter', fontSize: 12),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextField(
                      controller: repsCtrl,
                      keyboardType: TextInputType.number,
                      style: const TextStyle(color: Color(0xFFF0F6FC), fontFamily: 'Inter', fontSize: 13),
                      decoration: const InputDecoration(
                        labelText: 'Default Reps',
                        labelStyle: TextStyle(color: Color(0xFF8B949E), fontFamily: 'Inter', fontSize: 12),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('CANCEL', style: TextStyle(fontFamily: 'JetBrains Mono', color: Color(0xFF8B949E))),
          ),
          ElevatedButton(
            onPressed: () {
              if (nameCtrl.text.trim().isNotEmpty) {
                Navigator.of(ctx).pop(true);
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFE5A93C),
              foregroundColor: const Color(0xFF0C0E12),
            ),
            child: const Text('SAVE', style: TextStyle(fontFamily: 'JetBrains Mono', fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (created == true && nameCtrl.text.trim().isNotEmpty) {
      try {
        final newEx = Exercise(
          id: UuidGenerator.v4(),
          name: nameCtrl.text.trim(),
          muscleGroup: muscleCtrl.text.trim().toLowerCase(),
          defaultSets: int.tryParse(setsCtrl.text.trim()) ?? 3,
          defaultReps: repsCtrl.text.trim().isNotEmpty ? repsCtrl.text.trim() : '10',
          category: 'strength',
          equipment: 'Custom',
        );

        await _effectiveRepository.addCustomExercise(newEx);
        await _addExerciseToCurrentPlan(newEx);
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              backgroundColor: const Color(0xFFEF4444),
              content: Text('Failed to save custom exercise: $e', style: const TextStyle(fontFamily: 'Inter')),
            ),
          );
        }
      }
    }
  }

  Future<void> _addExerciseToCurrentPlan(Exercise exercise) async {
    if (_todayTemplate == null) return;
    try {
      final updatedExercises = List<Exercise>.from(_todayTemplate!.exercises)..add(exercise);
      final updatedTemplate = _todayTemplate!.copyWith(
        exercises: updatedExercises,
        isRestDay: false,
      );

      final now = DateTime.now();
      final dayKey = getDayKeyForDate(now);

      final plan = WorkoutPlan(
        id: UuidGenerator.v4(),
        userId: _effectiveUserId,
        schedule: {dayKey: updatedTemplate},
        createdAt: now,
        updatedAt: now,
      );

      await _effectiveRepository.saveWorkoutPlan(plan);

      setState(() {
        _todayTemplate = updatedTemplate;
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFF10B981),
            content: Text('Added ${exercise.name} to today\'s plan', style: const TextStyle(fontFamily: 'Inter')),
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFEF4444),
            content: Text('Failed to update workout plan: $e', style: const TextStyle(fontFamily: 'Inter')),
          ),
        );
      }
    }
  }

  void _showPhotoDialog(String photoPath) async {
    showDialog(
      context: context,
      builder: (ctx) {
        return FutureBuilder<String?>(
          future: _effectiveStorageService.getSignedPhotoUrl(
            userId: _effectiveUserId,
            storagePath: photoPath,
          ),
          builder: (context, snapshot) {
            return AlertDialog(
              backgroundColor: const Color(0xFF13171F),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              title: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: const [
                  Text(
                    'VERIFICATION PROOF',
                    style: TextStyle(
                      fontFamily: 'JetBrains Mono',
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFFE5A93C),
                      letterSpacing: 1.0,
                    ),
                  ),
                  Icon(Icons.lock_outline, size: 16, color: Color(0xFF8B949E)),
                ],
              ),
              content: SizedBox(
                width: 320,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (snapshot.connectionState == ConnectionState.waiting)
                      const Padding(
                        padding: EdgeInsets.all(32),
                        child: CircularProgressIndicator(color: Color(0xFFE5A93C)),
                      )
                    else if (snapshot.hasError)
                      Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          children: [
                            const Icon(Icons.broken_image_outlined, color: Color(0xFFEF4444), size: 36),
                            const SizedBox(height: 8),
                            Text(
                              'Proof could not be loaded: ${snapshot.error}',
                              textAlign: TextAlign.center,
                              style: const TextStyle(fontFamily: 'Inter', fontSize: 12, color: Color(0xFF8B949E)),
                            ),
                          ],
                        ),
                      )
                    else if (snapshot.hasData)
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Container(
                          height: 220,
                          width: double.infinity,
                          color: const Color(0xFF0C0E12),
                          child: Stack(
                            fit: StackFit.expand,
                            children: [
                              Image.network(
                                snapshot.data!,
                                fit: BoxFit.cover,
                                errorBuilder: (c, o, s) => Center(
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    children: const [
                                      Icon(Icons.image_not_supported_outlined, color: Color(0xFF8B949E), size: 36),
                                      SizedBox(height: 8),
                                      Text(
                                        'IMAGE UNAVAILABLE',
                                        style: TextStyle(
                                          fontFamily: 'JetBrains Mono',
                                          fontSize: 11,
                                          color: Color(0xFF8B949E),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              Positioned(
                                bottom: 8,
                                left: 8,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  color: Colors.black.withValues(alpha: 0.6),
                                  child: const Text(
                                    'SIGNED URL (TTL 1HR)',
                                    style: TextStyle(
                                      fontFamily: 'JetBrains Mono',
                                      fontSize: 9,
                                      color: Color(0xFF10B981),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    const SizedBox(height: 12),
                    Text(
                      'Path: $photoPath',
                      style: const TextStyle(
                        fontFamily: 'JetBrains Mono',
                        fontSize: 9,
                        color: Color(0xFF6E7681),
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(ctx).pop(),
                  child: const Text(
                    'CLOSE',
                    style: TextStyle(
                      fontFamily: 'JetBrains Mono',
                      color: Color(0xFFE5A93C),
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0C0E12),
      body: SafeArea(
        child: RefreshIndicator(
          color: const Color(0xFFE5A93C),
          backgroundColor: const Color(0xFF13171F),
          onRefresh: _loadGymData,
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              // Top Bar Header
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: const [
                                Text(
                                  'KINETIC DISCIPLINE',
                                  style: TextStyle(
                                    fontFamily: 'JetBrains Mono',
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFFE5A93C),
                                    letterSpacing: 1.5,
                                  ),
                                ),
                                SizedBox(height: 4),
                                Text(
                                  'TRAIN / GYM',
                                  style: TextStyle(
                                    fontFamily: 'Inter',
                                    fontSize: 22,
                                    fontWeight: FontWeight.w800,
                                    color: Color(0xFFF0F6FC),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          IconButton(
                            tooltip: 'Refresh Gym Protocols',
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(),
                            icon: _isRefreshing
                                ? const SizedBox(
                                    width: 14,
                                    height: 14,
                                    child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFFE5A93C)),
                                  )
                                : const Icon(Icons.sync, size: 18, color: Color(0xFF8B949E)),
                            onPressed: _isRefreshing ? null : _handleRefresh,
                          ),
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                            decoration: BoxDecoration(
                              color: const Color(0xFF13171F),
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: const Color(0xFF1F2430)),
                            ),
                            child: const Text(
                              'CANONICAL SPLIT',
                              style: TextStyle(
                                fontFamily: 'JetBrains Mono',
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF8B949E),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // Navigation Segments: TODAY, HISTORY, PR BANK
                      Row(
                        children: [
                          _buildTabButton(0, 'TODAY'),
                          const SizedBox(width: 8),
                          _buildTabButton(1, 'HISTORY (${_history.length})'),
                          const SizedBox(width: 8),
                          _buildTabButton(2, 'PR BANK (${_prs.length})'),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

              if (_isLoading)
                const SliverFillRemaining(
                  child: Center(
                    child: CircularProgressIndicator(color: Color(0xFFE5A93C)),
                  ),
                )
              else if (_errorMessage != null)
                SliverFillRemaining(
                  child: Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.error_outline, color: Color(0xFFEF4444), size: 40),
                          const SizedBox(height: 12),
                          Text(
                            _errorMessage!,
                            textAlign: TextAlign.center,
                            style: const TextStyle(color: Color(0xFF8B949E), fontFamily: 'Inter'),
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: _loadGymData,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFE5A93C),
                              foregroundColor: const Color(0xFF0C0E12),
                            ),
                            child: const Text('RETRY'),
                          ),
                        ],
                      ),
                    ),
                  ),
                )
              else
                _buildTabContent(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTabButton(int index, String label) {
    final isSelected = _selectedTab == index;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedTab = index),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 2),
          decoration: BoxDecoration(
            color: isSelected ? const Color(0xFFE5A93C).withValues(alpha: 0.15) : const Color(0xFF13171F),
            borderRadius: BorderRadius.circular(6),
            border: Border.all(
              color: isSelected ? const Color(0xFFE5A93C) : const Color(0xFF1F2430),
            ),
          ),
          child: Center(
            child: FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                label,
                style: TextStyle(
                  fontFamily: 'JetBrains Mono',
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: isSelected ? const Color(0xFFE5A93C) : const Color(0xFF8B949E),
                  letterSpacing: 0.3,
                ),
                maxLines: 1,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTabContent() {
    switch (_selectedTab) {
      case 1:
        return _buildHistoryTab();
      case 2:
        return _buildPrTab();
      case 0:
      default:
        return _buildTodayTab();
    }
  }

  Widget _buildTodayTab() {
    final template = _todayTemplate;
    final isRest = template == null || template.isRestDay;
    final isDone = _todaySession != null && _todaySession!.isCompleted;

    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      sliver: SliverList(
        delegate: SliverChildListDelegate([
          // Hero Today Target Card
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: const Color(0xFF13171F),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isDone
                    ? const Color(0xFF10B981).withValues(alpha: 0.4)
                    : const Color(0xFFE5A93C).withValues(alpha: 0.3),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      isRest ? 'REST DAY' : 'TODAY\'S TARGET',
                      style: TextStyle(
                        fontFamily: 'JetBrains Mono',
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: isRest ? const Color(0xFF8B949E) : const Color(0xFFE5A93C),
                        letterSpacing: 1.2,
                      ),
                    ),
                    if (isDone)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981).withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: const Color(0xFF10B981)),
                        ),
                        child: const Text(
                          'COMPLETED',
                          style: TextStyle(
                            fontFamily: 'JetBrains Mono',
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF10B981),
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  isDone
                      ? (_todaySession?.routineName ?? template?.routineName ?? 'Completed Session')
                      : (template?.routineName ?? (isRest ? 'Active Recovery' : 'Training')),
                  style: const TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFFF0F6FC),
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  isDone
                      ? '${_todaySession?.durationMinutes ?? 0}m Duration · ${_todaySession?.totalVolumeKg.toInt() ?? 0} kg Volume · ${_todaySession?.totalSets ?? 0} Sets'
                      : (isRest
                          ? 'Musculoskeletal recovery, nutrition, and sleep optimization.'
                          : '${template.exercises.length} Exercises Planned · Progressive Overload Target'),
                  style: const TextStyle(
                    fontFamily: 'Inter',
                    fontSize: 12,
                    color: Color(0xFF8B949E),
                  ),
                ),
                const SizedBox(height: 16),

                // Notice: Mandatory photo check-in
                if (!isRest && !isDone)
                  Container(
                    margin: const EdgeInsets.only(bottom: 16),
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0C0E12),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: const Color(0xFF1F2430)),
                    ),
                    child: Row(
                      children: const [
                        Icon(Icons.camera_alt_outlined, color: Color(0xFFE5A93C), size: 16),
                        SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Mandatory photo check-in required prior to lifting.',
                            style: TextStyle(
                              fontFamily: 'JetBrains Mono',
                              fontSize: 10,
                              color: Color(0xFF8B949E),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                // Action Button
                if (!isRest && !isDone)
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _startWorkoutFlow,
                      icon: const Icon(Icons.play_arrow, size: 20),
                      label: const Text(
                        'START SESSION',
                        style: TextStyle(
                          fontFamily: 'JetBrains Mono',
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.0,
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFE5A93C),
                        foregroundColor: const Color(0xFF0C0E12),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                    ),
                  ),

                if (isDone && _todaySession != null && _todaySession!.gymPhotoPath.isNotEmpty)
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () => _showPhotoDialog(_todaySession!.gymPhotoPath),
                      icon: const Icon(Icons.verified, size: 16, color: Color(0xFFE5A93C)),
                      label: const FittedBox(
                        fit: BoxFit.scaleDown,
                        child: Text(
                          'VIEW TODAY\'S VERIFICATION PHOTO',
                          style: TextStyle(
                            fontFamily: 'JetBrains Mono',
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFFF0F6FC),
                          ),
                        ),
                      ),
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: Color(0xFF2E3440)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // If session is completed, show completed exercises and logged sets
          if (isDone) ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: const [
                Expanded(
                  child: Text(
                    'COMPLETED EXERCISES & SETS',
                    style: TextStyle(
                      fontFamily: 'JetBrains Mono',
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF8B949E),
                      letterSpacing: 1.0,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                SizedBox(width: 8),
                Text(
                  'AUTHENTICATED',
                  style: TextStyle(
                    fontFamily: 'JetBrains Mono',
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF10B981),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            if (_todaySession != null && _todaySession!.exercises.isNotEmpty)
              ..._todaySession!.exercises.asMap().entries.map((entry) {
                final idx = entry.key + 1;
                final we = entry.value;
                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF13171F),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFF1F2430)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 24,
                            height: 24,
                            decoration: BoxDecoration(
                              color: const Color(0xFF10B981).withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(color: const Color(0xFF10B981)),
                            ),
                            child: Center(
                              child: Text(
                                '$idx',
                                style: const TextStyle(
                                  fontFamily: 'JetBrains Mono',
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF10B981),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              we.exerciseName,
                              style: const TextStyle(
                                fontFamily: 'Inter',
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFFF0F6FC),
                              ),
                            ),
                          ),
                          Text(
                            '${we.sets.length} SETS',
                            style: const TextStyle(
                              fontFamily: 'JetBrains Mono',
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF8B949E),
                            ),
                          ),
                        ],
                      ),
                      if (we.sets.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 6,
                          runSpacing: 4,
                          children: we.sets.map((s) {
                            return Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: const Color(0xFF0C0E12),
                                borderRadius: BorderRadius.circular(4),
                                border: Border.all(color: const Color(0xFF2E3440)),
                              ),
                              child: Text(
                                'Set ${s.setNumber}: ${s.weightKg.toInt()}kg × ${s.reps}r',
                                style: const TextStyle(
                                  fontFamily: 'JetBrains Mono',
                                  fontSize: 10,
                                  color: Color(0xFF8B949E),
                                ),
                              ),
                            );
                          }).toList(),
                        ),
                      ],
                    ],
                  ),
                );
              })
            else if (template != null && template.exercises.isNotEmpty)
              ...template.exercises.map((ex) {
                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF13171F),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFF1F2430)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.check_circle, size: 20, color: Color(0xFF10B981)),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              ex.name,
                              style: const TextStyle(
                                fontFamily: 'Inter',
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFFF0F6FC),
                              ),
                            ),
                            Text(
                              '${ex.defaultSets} SETS × ${ex.defaultReps} REPS · ${ex.muscleGroup.toUpperCase()}',
                              style: const TextStyle(
                                fontFamily: 'JetBrains Mono',
                                fontSize: 10,
                                color: Color(0xFF8B949E),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              })
            else
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF13171F),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFF1F2430)),
                ),
                child: const Center(
                  child: Text(
                    'Workout verified and saved to authentic history.',
                    style: TextStyle(fontFamily: 'Inter', color: Color(0xFF8B949E), fontSize: 12),
                  ),
                ),
              ),
          ] else if (!isRest) ...[
            // Planned Exercises Section (when not completed)
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    'PLANNED EXERCISES (${template.exercises.length})',
                    style: const TextStyle(
                      fontFamily: 'JetBrains Mono',
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF8B949E),
                      letterSpacing: 1.0,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 8),
                TextButton.icon(
                  onPressed: _showAddExerciseModal,
                  icon: const Icon(Icons.add, size: 14, color: Color(0xFFE5A93C)),
                  label: const Text(
                    'ADD',
                    style: TextStyle(
                      fontFamily: 'JetBrains Mono',
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFFE5A93C),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            if (template.exercises.isEmpty)
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: const Color(0xFF13171F),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: const Color(0xFF1F2430)),
                ),
                child: Center(
                  child: Column(
                    children: [
                      const Icon(Icons.fitness_center_outlined, color: Color(0xFF6E7681), size: 32),
                      const SizedBox(height: 8),
                      const Text(
                        'No exercises planned for today',
                        style: TextStyle(fontFamily: 'Inter', color: Color(0xFF8B949E), fontSize: 13),
                      ),
                      const SizedBox(height: 8),
                      ElevatedButton.icon(
                        onPressed: _showAddExerciseModal,
                        icon: const Icon(Icons.add, size: 16),
                        label: const Text('CUSTOMIZE PLAN', style: TextStyle(fontFamily: 'JetBrains Mono', fontSize: 11)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFE5A93C),
                          foregroundColor: const Color(0xFF0C0E12),
                        ),
                      ),
                    ],
                  ),
                ),
              )
            else
              ...template.exercises.asMap().entries.map((entry) {
                final idx = entry.key + 1;
                final ex = entry.value;
                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF13171F),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFF1F2430)),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 24,
                        height: 24,
                        decoration: BoxDecoration(
                          color: const Color(0xFF0C0E12),
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: const Color(0xFF2E3440)),
                        ),
                        child: Center(
                          child: Text(
                            '$idx',
                            style: const TextStyle(
                              fontFamily: 'JetBrains Mono',
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF8B949E),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              ex.name,
                              style: const TextStyle(
                                fontFamily: 'Inter',
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFFF0F6FC),
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${ex.defaultSets} SETS × ${ex.defaultReps} REPS · ${ex.muscleGroup.toUpperCase()}',
                              style: const TextStyle(
                                fontFamily: 'JetBrains Mono',
                                fontSize: 10,
                                color: Color(0xFF8B949E),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Icon(Icons.chevron_right, size: 18, color: Color(0xFF6E7681)),
                    ],
                  ),
                );
              }),
          ],
        ]),
      ),
    );
  }

  Widget _buildHistoryTab() {
    if (_history.isEmpty) {
      return SliverFillRemaining(
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: const [
              Icon(Icons.history_outlined, size: 40, color: Color(0xFF6E7681)),
              SizedBox(height: 12),
              Text(
                'NO WORKOUT HISTORY',
                style: TextStyle(
                  fontFamily: 'JetBrains Mono',
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF8B949E),
                ),
              ),
              SizedBox(height: 4),
              Text(
                'Complete a workout session to log authentic history.',
                style: TextStyle(fontFamily: 'Inter', fontSize: 12, color: Color(0xFF6E7681)),
              ),
            ],
          ),
        ),
      );
    }

    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      sliver: SliverList(
        delegate: SliverChildBuilderDelegate(
          (context, index) {
            final session = _history[index];
            return WorkoutHistoryCard(
              session: session,
              onTap: () => _showSessionDetails(session),
              onViewPhoto: session.gymPhotoPath.isNotEmpty
                  ? () => _showPhotoDialog(session.gymPhotoPath)
                  : null,
              onDelete: () => _confirmDeleteSession(session),
            );
          },
          childCount: _history.length,
        ),
      ),
    );
  }

  Widget _buildPrTab() {
    if (_prs.isEmpty) {
      return SliverFillRemaining(
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: const [
              Icon(Icons.emoji_events_outlined, size: 40, color: Color(0xFF6E7681)),
              SizedBox(height: 12),
              Text(
                'NO PERSONAL RECORDS YET',
                style: TextStyle(
                  fontFamily: 'JetBrains Mono',
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF8B949E),
                ),
              ),
              SizedBox(height: 4),
              Text(
                'PRs are automatically derived when you log heavier lifts.',
                style: TextStyle(fontFamily: 'Inter', fontSize: 12, color: Color(0xFF6E7681)),
              ),
            ],
          ),
        ),
      );
    }

    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      sliver: SliverList(
        delegate: SliverChildBuilderDelegate(
          (context, index) {
            final pr = _prs[index];
            return PersonalRecordCard(pr: pr);
          },
          childCount: _prs.length,
        ),
      ),
    );
  }
}
