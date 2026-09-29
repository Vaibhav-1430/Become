class DevTopic {
  final String id;
  final String name;
  final String code; // e.g. "NXT", "TS", "PG", "RDS", "JS", "RCT"
  final String trackCategory; // "FRONTEND", "BACKEND", "DEVOPS", "PROJECTS"
  final String sourceUrl;
  final String subtitle;
  final int totalLessons;
  final bool isCompleted;
  final double progressPct;

  const DevTopic({
    required this.id,
    required this.name,
    required this.code,
    required this.trackCategory,
    required this.sourceUrl,
    required this.subtitle,
    this.totalLessons = 20,
    this.isCompleted = false,
    this.progressPct = 0.0,
  });

  DevTopic copyWith({
    String? id,
    String? name,
    String? code,
    String? trackCategory,
    String? sourceUrl,
    String? subtitle,
    int? totalLessons,
    bool? isCompleted,
    double? progressPct,
  }) {
    return DevTopic(
      id: id ?? this.id,
      name: name ?? this.name,
      code: code ?? this.code,
      trackCategory: trackCategory ?? this.trackCategory,
      sourceUrl: sourceUrl ?? this.sourceUrl,
      subtitle: subtitle ?? this.subtitle,
      totalLessons: totalLessons ?? this.totalLessons,
      isCompleted: isCompleted ?? this.isCompleted,
      progressPct: progressPct ?? this.progressPct,
    );
  }
}
