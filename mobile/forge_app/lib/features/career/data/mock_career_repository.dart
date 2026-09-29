import '../domain/internship.dart';
import '../domain/placement_readiness.dart';
import 'career_repository.dart';

/// In-memory mock implementation of [CareerRepository] with multi-user isolation.
class MockCareerRepository implements CareerRepository {
  String? _currentUserId;
  final Map<String, List<Internship>> _userInternships = {};
  final Map<String, PlacementTarget> _userPlacementTargets = {};

  // Mock telemetry for readiness calculation
  int mockDsaSolved = 0;
  int mockDsaTotal = 443;
  int mockDevCompletedTopics = 0;
  int mockDevTotalTopics = 13;
  int mockProjectsCompleted = 0;
  int mockProjectsInProgress = 0;
  int mockCoreTopicsDone = 0;
  int mockCoreTopicsTotal = 45;
  int mockSysDesignTopicsDone = 0;
  int mockSysDesignTopicsTotal = 15;
  int mockInterviewsCount = 0;
  int mockQuestionsPracticed = 0;
  int mockQuestionsMastered = 0;
  int mockWeeklyTestsCompleted = 0;
  double mockWeeklyTestAvgAccuracy = 0.0;

  MockCareerRepository({String? initialUserId, String? userId})
      : _currentUserId = initialUserId ?? userId;

  @override
  void setUserId(String? userId) {
    _currentUserId = userId;
  }

  String get _requireUser {
    final uid = _currentUserId;
    if (uid == null || uid.isEmpty) {
      throw StateError('User not authenticated');
    }
    return uid;
  }

  @override
  Future<List<Internship>> getInternships({String? statusFilter, String? searchQuery}) async {
    final uid = _requireUser;
    final list = _userInternships[uid] ?? [];

    var filtered = list;
    if (statusFilter != null && statusFilter.isNotEmpty && statusFilter.toUpperCase() != 'ALL') {
      filtered = filtered.where((i) => i.status.toUpperCase() == statusFilter.toUpperCase()).toList();
    }

    if (searchQuery != null && searchQuery.trim().isNotEmpty) {
      final q = searchQuery.trim().toLowerCase();
      filtered = filtered.where((i) =>
        i.company.toLowerCase().contains(q) ||
        i.role.toLowerCase().contains(q) ||
        (i.notes?.toLowerCase().contains(q) ?? false)
      ).toList();
    }

    return List.unmodifiable(filtered);
  }

  @override
  Future<Internship?> getInternshipById(String id) async {
    final uid = _requireUser;
    final list = _userInternships[uid] ?? [];
    try {
      return list.firstWhere((i) => i.id == id);
    } catch (_) {
      return null;
    }
  }

  @override
  Future<Internship> createInternship(Internship internship) async {
    final uid = _requireUser;
    _userInternships.putIfAbsent(uid, () => []);

    final toSave = internship.copyWith(
      id: internship.id.isNotEmpty ? internship.id : 'mock_intern_${DateTime.now().millisecondsSinceEpoch}',
      userId: uid,
      createdAt: internship.createdAt ?? DateTime.now(),
      updatedAt: DateTime.now(),
    );

    _userInternships[uid]!.insert(0, toSave);
    return toSave;
  }

  @override
  Future<Internship> updateInternship(Internship internship) async {
    final uid = _requireUser;
    final list = _userInternships[uid] ?? [];
    final idx = list.indexWhere((i) => i.id == internship.id);

    if (idx == -1) {
      throw StateError('Internship not found: ${internship.id}');
    }

    final updated = internship.copyWith(
      userId: uid,
      updatedAt: DateTime.now(),
    );
    list[idx] = updated;
    return updated;
  }

  @override
  Future<void> deleteInternship(String id) async {
    final uid = _requireUser;
    final list = _userInternships[uid] ?? [];
    list.removeWhere((i) => i.id == id);
  }

  @override
  Future<InternshipPipelineStats> getPipelineStats() async {
    final uid = _requireUser;
    final list = _userInternships[uid] ?? [];
    return InternshipPipelineStats.fromInternships(list);
  }

  @override
  Future<PlacementReadiness> getPlacementReadiness() async {
    _requireUser;
    return PlacementReadiness.compute(
      dsaSolved: mockDsaSolved,
      dsaTotal: mockDsaTotal,
      devCompletedTopics: mockDevCompletedTopics,
      devTotalTopics: mockDevTotalTopics,
      projectsCompleted: mockProjectsCompleted,
      projectsInProgress: mockProjectsInProgress,
      coreTopicsDone: mockCoreTopicsDone,
      coreTopicsTotal: mockCoreTopicsTotal,
      sysDesignTopicsDone: mockSysDesignTopicsDone,
      sysDesignTopicsTotal: mockSysDesignTopicsTotal,
      mockInterviewsCount: mockInterviewsCount,
      questionsPracticed: mockQuestionsPracticed,
      questionsMastered: mockQuestionsMastered,
      weeklyTestsCompleted: mockWeeklyTestsCompleted,
      weeklyTestAvgAccuracy: mockWeeklyTestAvgAccuracy,
    );
  }

  @override
  Future<PlacementTarget> getPlacementTarget() async {
    final uid = _requireUser;
    return _userPlacementTargets[uid] ?? const PlacementTarget();
  }

  @override
  Future<void> updatePlacementTarget(PlacementTarget target) async {
    final uid = _requireUser;
    _userPlacementTargets[uid] = target;
  }

  /// Helper for testing: clears all user records.
  void clearAll() {
    _userInternships.clear();
    _userPlacementTargets.clear();
  }
}
