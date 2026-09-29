import '../domain/models/test_attempt_result.dart';

/// Generates deterministic analytical insights from a [TestAttemptResult].
/// Does not depend on external AI models.
class TestAnalysisService {
  /// Generates human-readable, actionable engineering feedback.
  static List<String> generateInsights(TestAttemptResult result) {
    final insights = <String>[];

    // 1. Overall Performance Evaluation
    if (result.scorePct >= 80.0) {
      insights.add(
        'Outstanding benchmark: ${result.scorePct.toStringAsFixed(1)}% score indicates strong technical interview readiness in this syllabus band.',
      );
    } else if (result.scorePct >= 60.0) {
      insights.add(
        'Solid foundation: ${result.scorePct.toStringAsFixed(1)}% score. Focused practice on missed subtopics will elevate performance to tier-1 readiness.',
      );
    } else {
      insights.add(
        'Needs reinforcement: ${result.scorePct.toStringAsFixed(1)}% score indicates foundational gaps that should be addressed before advancing.',
      );
    }

    // 2. Strongest Topic Identification
    if (result.topicScores.isNotEmpty) {
      final sortedTopics = List<TopicScore>.from(result.topicScores)
        ..sort((a, b) => b.accuracyPct.compareTo(a.accuracyPct));

      final strongest = sortedTopics.first;
      if (strongest.accuracyPct >= 70.0) {
        insights.add(
          'Your strongest topic was ${strongest.topic} with ${strongest.accuracyPct.toStringAsFixed(0)}% accuracy (${strongest.correct}/${strongest.total} correct).',
        );
      }

      // 3. Weakest Topic Identification
      final weakest = sortedTopics.last;
      if (weakest.accuracyPct < 60.0 && weakest != strongest) {
        insights.add(
          'Priority revision required: ${weakest.topic} accuracy is low at ${weakest.accuracyPct.toStringAsFixed(0)}% (${weakest.correct}/${weakest.total} correct).',
        );
      }
    }

    // 4. Difficulty Breakdown Analysis
    if (result.difficultyScores.isNotEmpty) {
      DifficultyScore? maxLossDiff;
      int maxLossCount = 0;

      for (final diff in result.difficultyScores) {
        final missed = diff.total - diff.correct;
        if (missed > maxLossCount) {
          maxLossCount = missed;
          maxLossDiff = diff;
        }
      }

      if (maxLossDiff != null && maxLossCount > 0) {
        insights.add(
          'Point loss analysis: You dropped the most points on ${maxLossDiff.difficulty}-level questions ($maxLossCount missed).',
        );
      }
    }

    // 5. Unanswered / Time Management
    if (result.skippedCount > 0) {
      insights.add(
        '${result.skippedCount} question${result.skippedCount > 1 ? 's were' : ' was'} left completely unanswered. Prioritize elimination strategies.',
      );
    }

    // 6. Time Pacing
    final minutes = result.timeTakenSeconds ~/ 60;
    final seconds = result.timeTakenSeconds % 60;
    final timeStr = '${minutes}m ${seconds}s';
    if (result.totalQuestions > 0) {
      final avgSec = result.timeTakenSeconds ~/ result.totalQuestions;
      insights.add(
        'Assessment velocity: Completed ${result.totalQuestions} items in $timeStr (~${avgSec}s per question).',
      );
    }

    return insights;
  }
}
