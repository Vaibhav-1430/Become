import '../domain/mistake.dart';
import 'mistake_repository.dart';

/// In-memory mock implementation of [MistakeRepository] with user isolation.
class MockMistakeRepository implements MistakeRepository {
  String _activeUserId;
  final Map<String, List<Mistake>> _userMistakes = {};

  MockMistakeRepository({String initialUserId = 'test_user_1'})
      : _activeUserId = initialUserId;

  void setActiveUser(String userId) {
    if (_activeUserId != userId) {
      _activeUserId = userId;
    }
  }

  List<Mistake> get _currentList =>
      _userMistakes.putIfAbsent(_activeUserId, () => []);

  @override
  void invalidateCache() {
    // Retains user isolation; can clear active cache or re-sync if needed
  }

  void seedData(List<Mistake> initial) {
    _userMistakes[_activeUserId] = List.from(initial);
  }

  @override
  Future<List<Mistake>> getMistakes({
    String? subject,
    String? status,
    String? query,
  }) async {
    List<Mistake> list = List.from(_currentList);

    if (subject != null && subject.isNotEmpty && subject.toLowerCase() != 'all') {
      list = list.where((m) => m.subject.toLowerCase() == subject.toLowerCase()).toList();
    }

    if (status != null && status.isNotEmpty && status.toLowerCase() != 'all') {
      final nowStr = DateTime.now().toIso8601String().substring(0, 10);
      switch (status) {
        case 'unresolved':
          list = list.where((m) => !m.resolved).toList();
          break;
        case 'resolved':
          list = list.where((m) => m.resolved).toList();
          break;
        case 'repeated':
          list = list.where((m) => m.repeatCount > 1).toList();
          break;
        case 'dueRevision':
          list = list.where((m) => m.isDueForRevision(nowStr)).toList();
          break;
      }
    }

    if (query != null && query.trim().isNotEmpty) {
      final q = query.trim().toLowerCase();
      list = list.where((m) =>
          m.question.toLowerCase().contains(q) ||
          m.topic.toLowerCase().contains(q) ||
          m.source.toLowerCase().contains(q) ||
          (m.explanation?.toLowerCase().contains(q) ?? false) ||
          (m.personalNote?.toLowerCase().contains(q) ?? false)
      ).toList();
    }

    // Sort: unresolved first, then newest
    list.sort((a, b) {
      if (a.resolved != b.resolved) {
        return a.resolved ? 1 : -1;
      }
      return b.date.compareTo(a.date);
    });

    return list;
  }

  @override
  Future<MistakeStats> getMistakeStats() async {
    final list = _currentList;
    if (list.isEmpty) {
      return const MistakeStats();
    }

    final todayStr = DateTime.now().toIso8601String().substring(0, 10);
    final sevenDaysAgo = DateTime.now().subtract(const Duration(days: 7)).toIso8601String().substring(0, 10);

    int total = list.length;
    int unresolved = 0;
    int repeated = 0;
    int dueForRevision = 0;
    int recent7d = 0;
    final Map<String, int> vectorCounts = {};

    for (final m in list) {
      if (!m.resolved) unresolved++;
      if (m.repeatCount > 1) repeated++;
      if (m.isDueForRevision(todayStr)) dueForRevision++;
      if (m.date.compareTo(sevenDaysAgo) >= 0) recent7d++;

      final key = m.topic.isNotEmpty ? m.topic : m.mistakeType;
      vectorCounts[key] = (vectorCounts[key] ?? 0) + 1;
    }

    String topVector = 'None';
    int maxCount = 0;
    vectorCounts.forEach((k, v) {
      if (v > maxCount) {
        maxCount = v;
        topVector = k;
      }
    });

    final accuracy = total > 0 ? ((total - unresolved) / total) * 100.0 : 0.0;

    return MistakeStats(
      total: total,
      unresolved: unresolved,
      repeated: repeated,
      dueForRevision: dueForRevision,
      recent7d: recent7d,
      recoveryAccuracy: accuracy,
      topDeficitVector: topVector,
    );
  }

  @override
  Future<Mistake?> getMistakeById(String id) async {
    final index = _currentList.indexWhere((m) => m.id == id);
    if (index >= 0) return _currentList[index];
    return null;
  }

  @override
  Future<Mistake> createMistake(Mistake mistake) async {
    // Check if duplicate question exists to increment repeatCount
    final existingIndex = _currentList.indexWhere((m) =>
        m.question.trim().toLowerCase() == mistake.question.trim().toLowerCase());

    if (existingIndex >= 0) {
      final existing = _currentList[existingIndex];
      final updated = existing.copyWith(
        repeatCount: existing.repeatCount + 1,
        resolved: false, // Reopened because repeated
        userAnswer: mistake.userAnswer ?? existing.userAnswer,
        correctAnswer: mistake.correctAnswer ?? existing.correctAnswer,
        explanation: mistake.explanation ?? existing.explanation,
        mistakeType: mistake.mistakeType,
        personalNote: mistake.personalNote ?? existing.personalNote,
        revisitDate: mistake.revisitDate ?? existing.revisitDate,
        updatedAt: DateTime.now(),
      );
      _currentList[existingIndex] = updated;
      return updated;
    }

    final newMistake = mistake.copyWith(
      id: mistake.id.isNotEmpty ? mistake.id : 'mock_mistake_${DateTime.now().microsecondsSinceEpoch}',
      userId: _activeUserId,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
    _currentList.insert(0, newMistake);
    return newMistake;
  }

  @override
  Future<Mistake> updateMistake(Mistake mistake) async {
    final index = _currentList.indexWhere((m) => m.id == mistake.id);
    if (index >= 0) {
      final updated = mistake.copyWith(updatedAt: DateTime.now());
      _currentList[index] = updated;
      return updated;
    }
    return mistake;
  }

  @override
  Future<Mistake> toggleResolved(String id, bool currentResolved) async {
    final index = _currentList.indexWhere((m) => m.id == id);
    if (index >= 0) {
      final updated = _currentList[index].copyWith(
        resolved: !currentResolved,
        updatedAt: DateTime.now(),
      );
      _currentList[index] = updated;
      return updated;
    }
    throw StateError('Mistake not found: $id');
  }

  @override
  Future<Mistake> incrementRevisit(String id) async {
    final index = _currentList.indexWhere((m) => m.id == id);
    if (index >= 0) {
      final existing = _currentList[index];
      final nextDate = DateTime.now().add(const Duration(days: 3)).toIso8601String().substring(0, 10);
      final updated = existing.copyWith(
        repeatCount: existing.repeatCount + 1,
        revisitDate: nextDate,
        resolved: false,
        updatedAt: DateTime.now(),
      );
      _currentList[index] = updated;
      return updated;
    }
    throw StateError('Mistake not found: $id');
  }

  @override
  Future<bool> deleteMistake(String id) async {
    final initialLen = _currentList.length;
    _currentList.removeWhere((m) => m.id == id);
    return _currentList.length != initialLen;
  }
}
