import 'package:flutter/foundation.dart';

/// Status constants for internship applications matching the audited FORGE Web & Supabase schema.
abstract final class InternshipStatus {
  static const String saved = 'SAVED';
  static const String applied = 'APPLIED';
  static const String oa = 'OA';
  static const String interview = 'INTERVIEW';
  static const String selected = 'SELECTED';
  static const String rejected = 'REJECTED';

  static const List<String> all = [
    saved,
    applied,
    oa,
    interview,
    selected,
    rejected,
  ];

  static String displayName(String status) {
    switch (status.toUpperCase()) {
      case saved:
        return 'Saved';
      case applied:
        return 'Applied';
      case oa:
        return 'Online Assessment (OA)';
      case interview:
        return 'Interview Round';
      case selected:
        return 'Selected 🎉';
      case rejected:
        return 'Rejected';
      default:
        return status;
    }
  }

  static String badgeLabel(String status) {
    switch (status.toUpperCase()) {
      case saved:
        return 'SAVED';
      case applied:
        return 'APPLIED';
      case oa:
        return 'OA STAGE';
      case interview:
        return 'TECH ROUND';
      case selected:
        return 'OFFER 🎉';
      case rejected:
        return 'REJECTED';
      default:
        return status.toUpperCase();
    }
  }
}

/// Immutable model representing an internship application from `public.internships`.
@immutable
class Internship {
  final String id;
  final String userId;
  final String company;
  final String role;
  final String? dateApplied; // Local calendar format YYYY-MM-DD
  final String status;
  final String? link;
  final String? notes;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const Internship({
    this.id = '',
    this.userId = '',
    required this.company,
    required this.role,
    this.dateApplied,
    this.status = InternshipStatus.applied,
    this.link,
    this.notes,
    this.createdAt,
    this.updatedAt,
  });

  bool get isSaved => status.toUpperCase() == InternshipStatus.saved;
  bool get isApplied => status.toUpperCase() == InternshipStatus.applied;
  bool get isOA => status.toUpperCase() == InternshipStatus.oa;
  bool get isInterview => status.toUpperCase() == InternshipStatus.interview;
  bool get isSelected => status.toUpperCase() == InternshipStatus.selected;
  bool get isRejected => status.toUpperCase() == InternshipStatus.rejected;
  bool get isActive => !isRejected && !isSelected;

  Internship copyWith({
    String? id,
    String? userId,
    String? company,
    String? role,
    String? dateApplied,
    String? status,
    String? link,
    String? notes,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Internship(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      company: company ?? this.company,
      role: role ?? this.role,
      dateApplied: dateApplied ?? this.dateApplied,
      status: status ?? this.status,
      link: link ?? this.link,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  factory Internship.fromJson(Map<String, dynamic> json) {
    return Internship(
      id: json['id'] as String? ?? '',
      userId: json['user_id'] as String? ?? '',
      company: json['company'] as String? ?? 'Company',
      role: json['role'] as String? ?? 'SDE Intern',
      dateApplied: json['date_applied'] as String? ?? json['dateApplied'] as String?,
      status: (json['status'] as String? ?? InternshipStatus.applied).toUpperCase(),
      link: json['link'] as String?,
      notes: json['notes'] as String?,
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at'].toString()) : null,
      updatedAt: json['updated_at'] != null ? DateTime.tryParse(json['updated_at'].toString()) : null,
    );
  }

  Map<String, dynamic> toJson({bool includeId = true, bool forCloud = true}) {
    final map = <String, dynamic>{
      'user_id': userId,
      'company': company,
      'role': role,
      'date_applied': dateApplied,
      'status': status.toUpperCase(),
      'link': link,
      'notes': notes,
    };
    if (includeId && id.isNotEmpty && !id.startsWith('intern_') && !id.startsWith('temp_')) {
      map['id'] = id;
    }
    if (forCloud) {
      map['updated_at'] = DateTime.now().toUtc().toIso8601String();
    }
    return map;
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Internship &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          userId == other.userId &&
          company == other.company &&
          role == other.role &&
          dateApplied == other.dateApplied &&
          status == other.status &&
          link == other.link &&
          notes == other.notes;

  @override
  int get hashCode => Object.hash(id, userId, company, role, dateApplied, status, link, notes);
}

/// Aggregated statistics for the internship pipeline.
@immutable
class InternshipPipelineStats {
  final int total;
  final int active;
  final int oaStage;
  final int techRound;
  final int offers;
  final int rejected;
  final int saved;

  const InternshipPipelineStats({
    this.total = 0,
    this.active = 0,
    this.oaStage = 0,
    this.techRound = 0,
    this.offers = 0,
    this.rejected = 0,
    this.saved = 0,
  });

  factory InternshipPipelineStats.fromInternships(List<Internship> items) {
    int active = 0;
    int oa = 0;
    int interview = 0;
    int offers = 0;
    int rejected = 0;
    int saved = 0;

    for (final item in items) {
      switch (item.status.toUpperCase()) {
        case InternshipStatus.oa:
          oa++;
          active++;
          break;
        case InternshipStatus.interview:
          interview++;
          active++;
          break;
        case InternshipStatus.selected:
          offers++;
          break;
        case InternshipStatus.rejected:
          rejected++;
          break;
        case InternshipStatus.saved:
          saved++;
          active++;
          break;
        case InternshipStatus.applied:
        default:
          active++;
          break;
      }
    }

    return InternshipPipelineStats(
      total: items.length,
      active: active,
      oaStage: oa,
      techRound: interview,
      offers: offers,
      rejected: rejected,
      saved: saved,
    );
  }
}
