/// Domain model for an entry in `public.mistakes`.
/// Exactly matches the Supabase schema and web implementation in FORGE.
class Mistake {
  final String id;
  final String userId;
  final String question;
  final String subject; // 'DSA', 'Development', 'Core CS', 'College', 'Other'
  final String topic;
  final String source;
  final String date; // 'YYYY-MM-DD'
  final String? userAnswer;
  final String? correctAnswer;
  final String? explanation;
  final String mistakeType;
  final String? personalNote;
  final String? revisitDate; // 'YYYY-MM-DD'
  final int repeatCount;
  final bool resolved;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const Mistake({
    required this.id,
    required this.userId,
    required this.question,
    required this.subject,
    this.topic = 'General',
    this.source = 'FORGE Question',
    required this.date,
    this.userAnswer,
    this.correctAnswer,
    this.explanation,
    this.mistakeType = 'Conceptual mistake',
    this.personalNote,
    this.revisitDate,
    this.repeatCount = 1,
    this.resolved = false,
    this.createdAt,
    this.updatedAt,
  });

  bool get isRepeated => repeatCount > 1;

  bool isDueForRevision(String todayStr) {
    if (resolved) return false;
    if (revisitDate == null || revisitDate!.isEmpty) return false;
    return revisitDate!.compareTo(todayStr) <= 0;
  }

  Mistake copyWith({
    String? id,
    String? userId,
    String? question,
    String? subject,
    String? topic,
    String? source,
    String? date,
    String? userAnswer,
    String? correctAnswer,
    String? explanation,
    String? mistakeType,
    String? personalNote,
    String? revisitDate,
    int? repeatCount,
    bool? resolved,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Mistake(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      question: question ?? this.question,
      subject: subject ?? this.subject,
      topic: topic ?? this.topic,
      source: source ?? this.source,
      date: date ?? this.date,
      userAnswer: userAnswer ?? this.userAnswer,
      correctAnswer: correctAnswer ?? this.correctAnswer,
      explanation: explanation ?? this.explanation,
      mistakeType: mistakeType ?? this.mistakeType,
      personalNote: personalNote ?? this.personalNote,
      revisitDate: revisitDate ?? this.revisitDate,
      repeatCount: repeatCount ?? this.repeatCount,
      resolved: resolved ?? this.resolved,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  factory Mistake.fromMap(Map<String, dynamic> map) {
    return Mistake(
      id: map['id']?.toString() ?? '',
      userId: map['user_id']?.toString() ?? '',
      question: map['question']?.toString() ?? '',
      subject: map['subject']?.toString() ?? 'DSA',
      topic: map['topic']?.toString() ?? 'General',
      source: map['source']?.toString() ?? 'FORGE Question',
      date: map['date']?.toString() ?? '',
      userAnswer: map['user_answer']?.toString(),
      correctAnswer: map['correct_answer']?.toString(),
      explanation: map['explanation']?.toString(),
      mistakeType: map['mistake_type']?.toString() ?? 'Conceptual mistake',
      personalNote: map['personal_note']?.toString(),
      revisitDate: map['revisit_date']?.toString(),
      repeatCount: (map['repeat_count'] as num?)?.toInt() ?? 1,
      resolved: map['resolved'] == true,
      createdAt: map['created_at'] != null
          ? DateTime.tryParse(map['created_at'].toString())
          : null,
      updatedAt: map['updated_at'] != null
          ? DateTime.tryParse(map['updated_at'].toString())
          : null,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      if (id.isNotEmpty) 'id': id,
      'user_id': userId,
      'question': question,
      'subject': subject,
      'topic': topic,
      'source': source,
      'date': date,
      'user_answer': userAnswer,
      'correct_answer': correctAnswer,
      'explanation': explanation,
      'mistake_type': mistakeType,
      'personal_note': personalNote,
      'revisit_date': revisitDate,
      'repeat_count': repeatCount,
      'resolved': resolved,
      if (createdAt != null) 'created_at': createdAt!.toIso8601String(),
      if (updatedAt != null) 'updated_at': updatedAt!.toIso8601String(),
    };
  }
}

/// Statistics calculated from authentic mistake records.
class MistakeStats {
  final int total;
  final int unresolved;
  final int repeated;
  final int dueForRevision;
  final int recent7d;
  final double recoveryAccuracy;
  final String topDeficitVector;

  const MistakeStats({
    this.total = 0,
    this.unresolved = 0,
    this.repeated = 0,
    this.dueForRevision = 0,
    this.recent7d = 0,
    this.recoveryAccuracy = 0.0,
    this.topDeficitVector = 'None',
  });

  bool get hasData => total > 0;
}
