import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/app_config.dart';

/// Centralized manager for the Supabase Flutter client.
/// Ensures single initialization, graceful error handling, and clean access.
class ForgeSupabase {
  ForgeSupabase._();
  static final ForgeSupabase instance = ForgeSupabase._();

  bool _isInitialized = false;
  String? _initError;

  /// Whether Supabase has been successfully initialized.
  bool get isInitialized => _isInitialized;

  /// Any error message encountered during initialization.
  String? get initError => _initError;

  /// Access to the underlying SupabaseClient if initialized, or null.
  SupabaseClient? get client {
    if (!_isInitialized) return null;
    try {
      return Supabase.instance.client;
    } catch (_) {
      return null;
    }
  }

  /// Initialize Supabase Flutter SDK exactly once.
  Future<bool> initialize() async {
    if (_isInitialized) return true;

    if (!AppConfig.isConfigured) {
      debugPrint('[ForgeSupabase] Supabase credentials not configured. Running in offline/mock mode.');
      _isInitialized = false;
      return false;
    }

    try {
      await Supabase.initialize(
        url: AppConfig.supabaseUrl,
        anonKey: AppConfig.supabaseAnonKey, // ignore: deprecated_member_use
        debug: kDebugMode,
      );
      _isInitialized = true;
      _initError = null;
      debugPrint('[ForgeSupabase] Initialized successfully.');
      return true;
    } catch (e) {
      _isInitialized = false;
      _initError = e.toString();
      debugPrint('[ForgeSupabase] Initialization failed: $e');
      return false;
    }
  }

  /// Explicitly reset for testing or reconfiguration.
  @visibleForTesting
  void resetForTesting() {
    _isInitialized = false;
    _initError = null;
  }
}
