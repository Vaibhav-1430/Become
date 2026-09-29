import 'forge_profile.dart';

/// Domain representation of an authenticated FORGE user.
class ForgeUser {
  final String id;
  final String email;
  final String fullName;
  final String? handle;
  final String? cohortTarget;
  final bool hasActiveSession;
  final ForgeProfile? profile;

  const ForgeUser({
    required this.id,
    required this.email,
    required this.fullName,
    this.handle,
    this.cohortTarget,
    this.hasActiveSession = true,
    this.profile,
  });

  /// User's preferred display name from profile, or fullName, or email prefix.
  String get displayName =>
      profile?.displayName.isNotEmpty == true ? profile!.displayName : fullName;

  /// First name for greetings.
  String get firstName {
    final name = displayName.trim();
    if (name.isEmpty) return 'Operator';
    return name.split(' ').first;
  }

  ForgeUser copyWith({
    String? fullName,
    String? handle,
    String? cohortTarget,
    bool? hasActiveSession,
    ForgeProfile? profile,
  }) {
    return ForgeUser(
      id: id,
      email: email,
      fullName: fullName ?? this.fullName,
      handle: handle ?? this.handle,
      cohortTarget: cohortTarget ?? this.cohortTarget,
      hasActiveSession: hasActiveSession ?? this.hasActiveSession,
      profile: profile ?? this.profile,
    );
  }
}
