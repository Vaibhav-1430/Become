/// Domain representation of a focus study session in `public.study_sessions`.
class StudySession {
  final String id;
  final String userId;
  final String date; // 'YYYY-MM-DD'
  final String subject;
  final String? topic;
  final int activeSeconds;
  final int breakSeconds;
  final bool cameraEnabled;
  final int presenceRate;
  final String? aiInsight;
  final String? startTime;
  final String? endTime;
  final DateTime? createdAt;

  const StudySession({
    required this.id,
    required this.userId,
    required this.date,
    required this.subject,
    this.topic,
    this.activeSeconds = 0,
    this.breakSeconds = 0,
    this.cameraEnabled = false,
    this.presenceRate = 100,
    this.aiInsight,
    this.startTime,
    this.endTime,
    this.createdAt,
  });

  double get activeHours => activeSeconds / 3600.0;

  factory StudySession.fromMap(Map<String, dynamic> map) {
    return StudySession(
      id: map['id']?.toString() ?? '',
      userId: map['user_id']?.toString() ?? '',
      date: map['date']?.toString() ?? '',
      subject: map['subject']?.toString() ?? 'Study',
      topic: map['topic']?.toString(),
      activeSeconds: (map['active_seconds'] as num?)?.toInt() ?? 0,
      breakSeconds: (map['break_seconds'] as num?)?.toInt() ?? 0,
      cameraEnabled: map['camera_enabled'] == true,
      presenceRate: (map['presence_rate'] as num?)?.toInt() ?? 100,
      aiInsight: map['ai_insight']?.toString(),
      startTime: map['start_time']?.toString(),
      endTime: map['end_time']?.toString(),
      createdAt: map['created_at'] != null
          ? DateTime.tryParse(map['created_at'].toString())
          : null,
    );
  }

  Map<String, dynamic> toMap() => {
    if (id.isNotEmpty) 'id': id,
    'user_id': userId,
    'date': date,
    'subject': subject,
    'topic': topic,
    'active_seconds': activeSeconds,
    'break_seconds': breakSeconds,
    'camera_enabled': cameraEnabled,
    'presence_rate': presenceRate,
    'ai_insight': aiInsight,
    'start_time': startTime,
    'end_time': endTime,
  };
}
