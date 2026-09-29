import '../domain/forge_ai_context.dart';
import '../domain/forge_recommendation.dart';
import 'forge_ai_service.dart';
import '../../plan/data/mock_plan_repository.dart';
import '../../dsa/data/mock_dsa_repository.dart';
import '../../development/data/mock_dev_repository.dart';

class MockForgeAiService extends ForgeAiService {
  bool simulateError = false;
  bool returnFallback = false;
  ForgeRecommendation? customRecommendation;

  MockForgeAiService({
    MockPlanRepository? planRepo,
    MockDsaRepository? dsaRepo,
    MockDevRepository? devRepo,
  }) : super(
          planRepository: planRepo ?? MockPlanRepository(),
          dsaRepository: dsaRepo ?? MockDsaRepository(),
          devRepository: devRepo ?? MockDevRepository(),
        );

  @override
  Future<ForgeRecommendation> getRecommendation({ForgeAiContext? context}) async {
    if (simulateError) {
      throw Exception('Simulated AI engine error');
    }

    if (customRecommendation != null) {
      return customRecommendation!;
    }

    if (returnFallback) {
      return ForgeRecommendation.deterministicFallback(
        title: 'Complete Scheduled Study Block',
        pillar: 'DSA',
        actionType: 'OPEN_DSA',
        fallbackMessage: 'Gemini is currently unavailable. Using scheduled tasks fallback.',
      );
    }

    return super.getRecommendation(context: context);
  }
}
