import 'package:flutter/foundation.dart';
import '../../../core/sync/storage/local_store.dart';

/// Manages local crash and offline recovery for active test sessions.
class TestRecoveryService {
  final LocalStore _localStore;

  TestRecoveryService({LocalStore? localStore})
      : _localStore = localStore ?? LocalStore.instance;

  /// Saves the active in-progress test state.
  Future<void> saveActiveState({
    required String userId,
    required String testType,
    required int currentQuestionIndex,
    required Map<String, dynamic> userAnswers,
    required int remainingSeconds,
    required List<Map<String, dynamic>> questions,
  }) async {
    try {
      await _localStore.saveActiveTestSession(userId, {
        'testType': testType,
        'currentQuestionIndex': currentQuestionIndex,
        'userAnswers': userAnswers,
        'remainingSeconds': remainingSeconds,
        'questions': questions,
        'savedAt': DateTime.now().toUtc().toIso8601String(),
      });
    } catch (e) {
      debugPrint('[TestRecoveryService] Error saving active state: $e');
    }
  }

  /// Retrieves any previously saved in-progress test session.
  Future<Map<String, dynamic>?> getActiveState(String userId) async {
    try {
      return await _localStore.getActiveTestSession(userId);
    } catch (e) {
      debugPrint('[TestRecoveryService] Error loading active state: $e');
      return null;
    }
  }

  /// Clears active test session state upon submission or manual abandonment.
  Future<void> clearActiveState(String userId) async {
    try {
      await _localStore.clearActiveTestSession(userId);
    } catch (e) {
      debugPrint('[TestRecoveryService] Error clearing active state: $e');
    }
  }
}
