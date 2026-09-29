/// Domain representation of a user profile in `public.profiles`.
class ForgeProfile {
  final String id;
  final String displayName;
  final String? avatarPath;
  final String timezone;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const ForgeProfile({
    required this.id,
    required this.displayName,
    this.avatarPath,
    this.timezone = 'Asia/Kolkata',
    this.createdAt,
    this.updatedAt,
  });

  factory ForgeProfile.fromMap(Map<String, dynamic> map) {
    return ForgeProfile(
      id: map['id'] as String,
      displayName: (map['display_name'] as String?)?.isNotEmpty == true
          ? map['display_name'] as String
          : 'StudyOS Engineer',
      avatarPath: map['avatar_path'] as String?,
      timezone: map['timezone'] as String? ?? 'Asia/Kolkata',
      createdAt: map['created_at'] != null
          ? DateTime.tryParse(map['created_at'].toString())
          : null,
      updatedAt: map['updated_at'] != null
          ? DateTime.tryParse(map['updated_at'].toString())
          : null,
    );
  }

  factory ForgeProfile.empty(String id) {
    return ForgeProfile(
      id: id,
      displayName: 'Operator',
      timezone: 'Asia/Kolkata',
    );
  }

  String get firstName => displayName.split(' ').first;

  Map<String, dynamic> toMap() => {
    'id': id,
    'display_name': displayName,
    'avatar_path': avatarPath,
    'timezone': timezone,
    'updated_at': DateTime.now().toIso8601String(),
  };

  ForgeProfile copyWith({
    String? displayName,
    String? avatarPath,
    String? timezone,
  }) {
    return ForgeProfile(
      id: id,
      displayName: displayName ?? this.displayName,
      avatarPath: avatarPath ?? this.avatarPath,
      timezone: timezone ?? this.timezone,
      createdAt: createdAt,
      updatedAt: DateTime.now(),
    );
  }
}
