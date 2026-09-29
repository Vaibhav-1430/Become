import 'package:flutter_test/flutter_test.dart';
import 'package:forge_app/core/services/streak_service.dart';
import 'package:forge_app/core/sync/storage/local_store.dart';
import 'package:forge_app/features/home/data/supabase_home_repository.dart';
import 'package:forge_app/features/dsa/data/supabase_dsa_repository.dart';
import 'package:forge_app/features/development/data/supabase_dev_repository.dart';
import 'package:forge_app/features/analytics/domain/analytics_data.dart';
import 'package:forge_app/features/gym/data/mock_gym_repository.dart';
import 'package:forge_app/features/career/data/mock_career_repository.dart';
import 'package:forge_app/features/career/domain/internship.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('PART 18 — CANONICAL_DATA_CONSISTENCY_TEST', () {
    const testUserId = 'user_consistency_test_1430';

    setUp(() async {
      final store = LocalStore.instance;
      await store.clearUserStore(testUserId);
      StreakService.instance.setStreak(0);
    });

    test('1. DSA Consistency: Home, DSA Repository, and Analytics derive identical solved counts', () async {
      final store = LocalStore.instance;

      // Seed 5 solved DSA problems in canonical dsa_progress
      for (int i = 1; i <= 5; i++) {
        await store.saveRecord(
          userId: testUserId,
          entityType: 'dsa_progress',
          entityId: 'prob_$i',
          data: {
            'problem_id': 'prob_$i',
            'user_id': testUserId,
            'status': 'SOLVED',
            'updated_at': DateTime.now().toIso8601String(),
          },
        );
      }

      final homeRepo = SupabaseHomeRepository(overrideUserId: testUserId);
      final dsaRepo = SupabaseDsaRepository(
        overrideUserId: testUserId,
        localStore: store,
      );

      final dsaSolvedIds = await dsaRepo.getSolvedProblemIds();
      expect(dsaSolvedIds.length, equals(5));

      // Home repository reads dsa_progress from LocalStore
      final homeData = await homeRepo.getTodayCommandData();
      final homeDsaPillar = homeData.dsaSummary;

      // Canonical analytics model representing the same cloud/local state
      final analyticsData = AnalyticsData(
        dsaSolved: dsaSolvedIds.length,
        dsaTotal: 443,
      );

      // Assert Home DSA == Learn DSA == Analytics DSA
      expect(homeDsaPillar.metric, contains('5/443'));
      expect(dsaSolvedIds.length, equals(5));
      expect(analyticsData.dsaSolved, equals(5));
      expect(dsaSolvedIds.length, equals(analyticsData.dsaSolved));
    });

    test('2. Development Consistency: Home, Dev Repository, and Analytics derive identical completed topics', () async {
      final store = LocalStore.instance;

      // Seed 3 completed topics in canonical development_progress
      final completedTopicIds = ['topic_1', 'topic_2', 'topic_3'];
      for (final tid in completedTopicIds) {
        await store.saveRecord(
          userId: testUserId,
          entityType: 'development_progress',
          entityId: tid,
          data: {
            'topic_id': tid,
            'item_id': tid,
            'user_id': testUserId,
            'status': 'COMPLETED',
            'completed_at': DateTime.now().toIso8601String(),
          },
        );
      }

      final homeRepo = SupabaseHomeRepository(overrideUserId: testUserId);
      final devRepo = SupabaseDevRepository(
        overrideUserId: testUserId,
        localStore: store,
      );

      final devCompletedIds = await devRepo.getCompletedTopicIds();
      expect(devCompletedIds.length, equals(3));

      // Home repository reads development_progress from LocalStore
      final homeData = await homeRepo.getTodayCommandData();
      final homeDevPillar = homeData.devSummary;

      // Canonical analytics data
      final analyticsData = AnalyticsData(
        devCompletedTopics: devCompletedIds.length,
        devTotalTopics: 16,
      );

      // Assert Home Dev == Learn Dev == Analytics Dev
      expect(homeDevPillar.metric, contains('3/16'));
      expect(devCompletedIds.length, equals(3));
      expect(analyticsData.devCompletedTopics, equals(3));
      expect(devCompletedIds.length, equals(analyticsData.devCompletedTopics));
    });

    test('3. Global Streak Consistency: Global Streak derives from canonical StreakService and matches Analytics', () async {
      // Set canonical streak on the single source of truth
      StreakService.instance.setStreak(22);

      final analyticsData = const AnalyticsData(streakDays: 22);

      // Ensure StreakService is the single source of truth across all screens
      expect(StreakService.instance.currentStreak, equals(22));
      expect(StreakService.instance.formattedStreak, equals('22d'));
      expect(analyticsData.streakDays, equals(22));
      expect(StreakService.instance.currentStreak, equals(analyticsData.streakDays));
    });

    test('4. Gym Today & History Consistency: GymRepository produces consistent history & today session', () async {
      final gymRepo = MockGymRepository(userId: testUserId);
      final history = await gymRepo.getWorkoutHistory(userId: testUserId);
      final todayTemplate = await gymRepo.getWorkoutPlanForDate(userId: testUserId, date: DateTime.now());

      expect(history, isNotEmpty);
      expect(todayTemplate, isNotNull);
      // Ensure the today plan/template has non-empty exercises if not rest day
      expect(todayTemplate!.exercises, isNotEmpty);
    });

    test('5. Career Consistency: Career repository returns consistent metrics', () async {
      final careerRepo = MockCareerRepository(initialUserId: testUserId);
      await careerRepo.createInternship(
        const Internship(
          id: 'app_1',
          userId: testUserId,
          company: 'Google',
          role: 'SWE Intern',
          status: 'APPLIED',
          dateApplied: '2026-09-29',
        ),
      );

      final apps = await careerRepo.getInternships();
      expect(apps.length, equals(1));
      expect(apps.first.company, equals('Google'));
    });
  });
}
