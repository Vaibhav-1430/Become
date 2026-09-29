import 'dart:typed_data';
import 'package:supabase_flutter/supabase_flutter.dart';

class CachedSignedUrl {
  final String signedUrl;
  final DateTime expiresAt;

  CachedSignedUrl({required this.signedUrl, required this.expiresAt});
}

class GymStorageService {
  final SupabaseClient? _client;
  final Map<String, CachedSignedUrl> _signedUrlCache = {};
  String? _lastUserId;

  GymStorageService({SupabaseClient? client}) : _client = client;

  /// Normalizes any raw storage path by stripping leading slashes and bucket prefix.
  /// Exactly matches web implementation in js/supabase-service.js
  static String normalizeGymPhotoPath(String rawPath) {
    if (rawPath.isEmpty) return '';
    var clean = rawPath.trim();
    clean = clean.replaceFirst(RegExp(r'^/?gym-photos/', caseSensitive: false), '');
    clean = clean.replaceFirst(RegExp(r'^/+'), '');
    return clean;
  }

  /// Generates the canonical storage path:
  /// gym-photos/{user_id}/{year}/{month}/{session_id}.jpg
  static String buildCanonicalPath(String userId, String sessionId, [DateTime? date]) {
    final now = date ?? DateTime.now();
    final year = now.year.toString();
    final month = now.month.toString().padLeft(2, '0');
    final sid = sessionId.isNotEmpty ? sessionId : 'sess_${now.millisecondsSinceEpoch}';
    return '$userId/$year/$month/$sid.jpg';
  }

  /// Invalidate cache when user session changes or on logout
  void checkUserSession(String? currentUserId) {
    if (_lastUserId != null && _lastUserId != currentUserId) {
      _signedUrlCache.clear();
    }
    _lastUserId = currentUserId;
  }

  void clearCache() {
    _signedUrlCache.clear();
  }

  /// Uploads verified JPEG image bytes to private gym-photos bucket.
  Future<String> uploadGymPhoto({
    required Uint8List imageBytes,
    required String sessionId,
    required String userId,
    DateTime? date,
  }) async {
    if (userId.isEmpty) {
      throw Exception('Authentication required to upload gym photo.');
    }
    if (imageBytes.isEmpty) {
      throw Exception('No gym photo provided. A newly captured gym check-in photo is mandatory.');
    }
    if (imageBytes.lengthInBytes > 5 * 1024 * 1024) {
      throw Exception('Gym photo exceeds maximum allowed size (5MB).');
    }

    checkUserSession(userId);
    final objectPath = buildCanonicalPath(userId, sessionId, date);
    final client = _client;

    if (client == null) {
      // Mock / Offline mode fallback
      return objectPath;
    }

    try {
      await client.storage.from('gym-photos').uploadBinary(
            objectPath,
            imageBytes,
            fileOptions: const FileOptions(
              contentType: 'image/jpeg',
              upsert: true,
            ),
          );
      return objectPath;
    } catch (e) {
      throw Exception('Failed to upload gym check-in photo: $e');
    }
  }

  /// Obtains a secure, temporary signed URL for displaying the private gym photo.
  /// Enforces user ownership check: only the owner may request a signed URL.
  Future<String?> getSignedGymPhotoUrl({
    required String rawPath,
    required String currentUserId,
    int expiresIn = 3600,
  }) async {
    final cleanPath = normalizeGymPhotoPath(rawPath);
    if (cleanPath.isEmpty || currentUserId.isEmpty) return null;

    checkUserSession(currentUserId);

    // Security Check: Validate the authenticated Supabase user owns this path
    final pathOwnerId = cleanPath.split('/').first;
    if (pathOwnerId != currentUserId) {
      // Security warning: Attempt to request signed URL for another user's photo denied
      return null;
    }

    final cacheKey = '$currentUserId:$cleanPath';
    final cached = _signedUrlCache[cacheKey];
    if (cached != null &&
        cached.expiresAt.isAfter(DateTime.now().add(const Duration(minutes: 1)))) {
      return cached.signedUrl;
    }

    final client = _client;
    if (client == null) {
      // Mock / Offline signed URL simulation
      return 'https://storage.supabase.co/mock/gym-photos/$cleanPath?token=simulated';
    }

    try {
      final signedUrl = await client.storage
          .from('gym-photos')
          .createSignedUrl(cleanPath, expiresIn);

      _signedUrlCache[cacheKey] = CachedSignedUrl(
        signedUrl: signedUrl,
        expiresAt: DateTime.now().add(Duration(seconds: expiresIn)),
      );

      return signedUrl;
    } catch (_) {
      return null;
    }
  }

  /// Convenience wrapper for uploading photo bytes with named parameters
  Future<String> uploadGymPhotoBytes({
    required String userId,
    required String sessionId,
    required Uint8List imageBytes,
    DateTime? timestamp,
  }) {
    return uploadGymPhoto(
      imageBytes: imageBytes,
      sessionId: sessionId,
      userId: userId,
      date: timestamp,
    );
  }

  /// Convenience wrapper for fetching signed URL with named parameters
  Future<String?> getSignedPhotoUrl({
    required String userId,
    required String storagePath,
    int expiresIn = 3600,
  }) {
    return getSignedGymPhotoUrl(
      rawPath: storagePath,
      currentUserId: userId,
      expiresIn: expiresIn,
    );
  }
}
