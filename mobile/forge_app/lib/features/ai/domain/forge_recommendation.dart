class AiInsight {
  final String number; // e.g. "01"
  final String title;
  final String description;
  final String tagColor; // "error", "secondary", "tertiary"

  const AiInsight({
    required this.number,
    required this.title,
    required this.description,
    this.tagColor = 'secondary',
  });
}

class ContingentDirective {
  final String pillar; // "DEV", "REVISION", "DSA"
  final String durationText; // "35m"
  final String priorityText; // "Medium Priority"
  final String title;
  final String actionType; // "OPEN_DSA", "OPEN_DEV", "OPEN_TASK"
  final String? targetId;

  const ContingentDirective({
    required this.pillar,
    required this.durationText,
    required this.priorityText,
    required this.title,
    required this.actionType,
    this.targetId,
  });
}

class ForgeRecommendation {
  final String title;
  final String priority; // "HIGH", "MEDIUM", "NORMAL"
  final String stepTag; // "STEP 3.2"
  final String pillar; // "DSA", "DEV", "TASK"
  final String categoryTag; // "DSA // STRIVER A2Z STEP 3"
  final int estimatedMinutes;
  final String targetMastery;
  final String retentionDecayRisk;
  final String downstreamImpact;
  final String actionType; // "OPEN_DSA", "OPEN_DEV", "START_TASK"
  final String? actionTargetId;
  final List<AiInsight> insights;
  final List<ContingentDirective> contingentDirectives;
  final bool isFallback;
  final String? fallbackMessage;

  const ForgeRecommendation({
    required this.title,
    required this.priority,
    required this.stepTag,
    required this.pillar,
    required this.categoryTag,
    required this.estimatedMinutes,
    required this.targetMastery,
    required this.retentionDecayRisk,
    required this.downstreamImpact,
    required this.actionType,
    this.actionTargetId,
    this.insights = const [],
    this.contingentDirectives = const [],
    this.isFallback = false,
    this.fallbackMessage,
  });

  factory ForgeRecommendation.deterministicFallback({
    required String title,
    required String pillar,
    required String actionType,
    String? targetId,
    int estimatedMinutes = 45,
    String fallbackMessage = 'Generated using your scheduled StudyOS priority routines.',
  }) {
    return ForgeRecommendation(
      title: title,
      priority: 'HIGH',
      stepTag: pillar == 'DSA' ? 'STEP 3.2' : 'MODULE 04',
      pillar: pillar,
      categoryTag: pillar == 'DSA' ? 'DSA // STRIVER A2Z' : 'DEV // PRODUCTION TRACK',
      estimatedMinutes: estimatedMinutes,
      targetMastery: '+8% Execution Logic',
      retentionDecayRisk: 'Scheduled routine block',
      downstreamImpact: 'Core milestone progression',
      actionType: actionType,
      actionTargetId: targetId,
      insights: [
        const AiInsight(
          number: '01',
          title: 'Decay Velocity',
          description: 'Scheduled priority item ready for focus execution.',
          tagColor: 'error',
        ),
        const AiInsight(
          number: '02',
          title: 'Pattern Synergy',
          description: 'Reinforces foundation for upcoming evaluation blocks.',
          tagColor: 'secondary',
        ),
        const AiInsight(
          number: '03',
          title: 'Optimal Biometric Window',
          description: 'Peak cognitive window active. Lowest expected friction.',
          tagColor: 'tertiary',
        ),
      ],
      contingentDirectives: [
        const ContingentDirective(
          pillar: 'DEV',
          durationText: '35m',
          priorityText: 'Medium Priority',
          title: 'Next.js Server Actions & Distributed Caching',
          actionType: 'OPEN_DEV',
          targetId: 'nextjs',
        ),
        const ContingentDirective(
          pillar: 'DSA',
          durationText: '25m',
          priorityText: 'High Priority',
          title: 'Striver A2Z Next Permutation',
          actionType: 'OPEN_DSA',
        ),
      ],
      isFallback: true,
      fallbackMessage: fallbackMessage,
    );
  }
}
