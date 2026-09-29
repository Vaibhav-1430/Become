import '../domain/dev_topic.dart';
import '../domain/dev_progress.dart';
import 'dev_repository.dart';
import 'dev_curriculum_data.dart';

class MockDevRepository implements DevRepository {
  final Set<String> _completedIds;
  bool shouldFail = false;

  MockDevRepository({Set<String>? initialCompletedIds})
      : _completedIds = initialCompletedIds ?? <String>{'html', 'css', 'javascript'};

  @override
  Future<void> refresh() async {}

  @override
  Future<Set<String>> getCompletedTopicIds() async {
    return Set<String>.from(_completedIds);
  }

  @override
  Future<List<DevTopic>> getTopics() async {
    return kDevCurriculumTopics.map((topic) {
      final isComp = _completedIds.contains(topic.id);
      return topic.copyWith(
        isCompleted: isComp,
        progressPct: isComp ? 100.0 : (topic.id == 'nextjs' ? 74.0 : 0.0),
      );
    }).toList();
  }

  @override
  Future<bool> toggleTopicCompleted(String topicId, bool isCompleted) async {
    final previousState = _completedIds.contains(topicId);

    if (isCompleted) {
      _completedIds.add(topicId);
    } else {
      _completedIds.remove(topicId);
    }

    if (shouldFail) {
      if (previousState) {
        _completedIds.add(topicId);
      } else {
        _completedIds.remove(topicId);
      }
      throw Exception('Simulated persistence failure in Dev');
    }

    return true;
  }

  @override
  Future<DevProgress> getDevProgress() async {
    final topics = await getTopics();
    final completedCount = topics.where((t) => t.isCompleted).length;
    final activeFocus = topics.firstWhere(
      (t) => t.id == 'nextjs',
      orElse: () => topics.first,
    );

    return DevProgress(
      totalTopics: topics.length,
      completedTopics: completedCount,
      hoursLogged: 142.5,
      commitsCount: 184,
      stackMasteryPct: topics.isEmpty ? 0.0 : (completedCount / topics.length) * 100,
      oaReadyCount: 4,
      oaTotalCount: 6,
      activeFocusTopic: activeFocus,
    );
  }
}
