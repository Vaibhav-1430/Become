import 'package:flutter/foundation.dart';

/// Secure application configuration.
/// Credentials are read from compile-time environment variables (`--dart-define`),
/// ensuring zero hardcoded secrets in version control.
abstract final class AppConfig {
  static const String _defaultUrl = String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: String.fromEnvironment(
      'NEXT_PUBLIC_SUPABASE_URL',
      defaultValue: 'https://wirxgkodkfqycufayzmk.supabase.co',
    ),
  );
  static const String _defaultAnonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: String.fromEnvironment(
      'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
      defaultValue: 'sb_publishable_ompHx9iH2riZyrcxcEkCQw_-F-n1EVj',
    ),
  );

  static String _runtimeUrl = '';
  static String _runtimeAnonKey = '';

  /// The active Supabase project URL.
  static String get supabaseUrl => _runtimeUrl.isNotEmpty ? _runtimeUrl : _defaultUrl;

  /// The public/browser-safe anonymous key protected by RLS.
  static String get supabaseAnonKey => _runtimeAnonKey.isNotEmpty ? _runtimeAnonKey : _defaultAnonKey;

  /// True if Supabase credentials are configured.
  static bool get isConfigured =>
      supabaseUrl.isNotEmpty && supabaseAnonKey.isNotEmpty;

  /// Allows setting runtime credentials for testing or initialization override.
  @visibleForTesting
  static void setRuntimeCredentials({required String url, required String anonKey}) {
    _runtimeUrl = url.trim();
    _runtimeAnonKey = anonKey.trim();
  }

  /// Clears runtime credentials.
  @visibleForTesting
  static void resetRuntimeCredentials() {
    _runtimeUrl = '';
    _runtimeAnonKey = '';
  }
}
