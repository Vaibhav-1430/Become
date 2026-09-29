import '../domain/dev_topic.dart';
import '../domain/dev_progress.dart';

abstract class DevRepository {
  Future<List<DevTopic>> getTopics();
  Future<Set<String>> getCompletedTopicIds();
  Future<bool> toggleTopicCompleted(String topicId, bool isCompleted);
  Future<DevProgress> getDevProgress();
  Future<void> refresh();
}
