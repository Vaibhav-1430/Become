import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/supabase/supabase_client.dart';
import '../../../core/sync/engine/sync_engine.dart';
import '../../../core/sync/hydration/cloud_hydration_service.dart';
import '../domain/forge_profile.dart';
import '../domain/forge_user.dart';
import 'auth_service.dart';

/// Real Supabase implementation of [AuthService].
/// Integrates directly with Supabase GoTrue Auth and `public.profiles`.
class SupabaseAuthService extends ChangeNotifier implements AuthService {
  final SupabaseClient? _clientOverride;
  StreamSubscription<AuthState>? _authSubscription;

  ForgeUser? _currentUser;
  bool _isLoading = false;
  String? _errorMessage;

  SupabaseAuthService({SupabaseClient? client})
      : _clientOverride = client {
    _initAuthListener();
  }

  SupabaseClient? get _client => _clientOverride ?? ForgeSupabase.instance.client;

  @override
  ForgeUser? get currentUser => _currentUser;

  @override
  bool get isAuthenticated => _currentUser != null;

  @override
  bool get isLoading => _isLoading;

  @override
  String? get errorMessage => _errorMessage;

  void _initAuthListener() {
    final client = _client;
    if (client == null) return;

    _authSubscription = client.auth.onAuthStateChange.listen((data) async {
      final session = data.session;
      if (session != null) {
        await _loadUserFromSession(session);
      } else {
        _currentUser = null;
        notifyListeners();
      }
    });
  }

  @override
  void dispose() {
    _authSubscription?.cancel();
    super.dispose();
  }

  @override
  Future<void> restoreSession() async {
    final client = _client;
    if (client == null) return;

    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final session = client.auth.currentSession;
      if (session != null) {
        await _loadUserFromSession(session);
      } else {
        _currentUser = null;
      }
    } catch (e) {
      debugPrint('[SupabaseAuthService] restoreSession error: $e');
      _currentUser = null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> _loadUserFromSession(Session session) async {
    final client = _client;
    final user = session.user;
    final userId = user.id;
    final email = user.email ?? '';

    ForgeProfile? profile;
    if (client != null) {
      try {
        final profileRes = await client
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        if (profileRes != null) {
          profile = ForgeProfile.fromMap(profileRes);
        } else {
          // Profile trigger might have lagged or failed, ensure it
          final defaultName = user.userMetadata?['display_name'] as String? ??
              (email.isNotEmpty ? email.split('@').first : 'StudyOS Engineer');
          await _ensureProfile(userId, defaultName);
          profile = ForgeProfile(
            id: userId,
            displayName: defaultName,
          );
        }
      } catch (e) {
        debugPrint('[SupabaseAuthService] Error loading profile: $e');
      }
    }

    final rawName = profile?.displayName ??
        user.userMetadata?['display_name'] as String? ??
        (email.isNotEmpty ? email.split('@').first : 'StudyOS Engineer');

    _currentUser = ForgeUser(
      id: userId,
      email: email,
      fullName: rawName,
      handle: rawName.toLowerCase().replaceAll(' ', '_'),
      cohortTarget: user.userMetadata?['cohort_target'] as String?,
      hasActiveSession: true,
      profile: profile,
    );
    SyncEngine.instance.setActiveUserId(userId);
    CloudHydrationService.instance.hydrate(userId);
    notifyListeners();
  }

  Future<void> _ensureProfile(String userId, String displayName) async {
    final client = _client;
    if (client == null) return;
    try {
      await client.from('profiles').upsert({
        'id': userId,
        'display_name': displayName,
        'timezone': 'Asia/Kolkata',
        'updated_at': DateTime.now().toIso8601String(),
      });
    } catch (e) {
      debugPrint('[SupabaseAuthService] ensureProfile error: $e');
    }
  }

  @override
  Future<bool> signInWithEmailPassword({
    required String email,
    required String password,
    bool rememberSession = true,
  }) async {
    final client = _client;
    if (client == null) {
      _errorMessage = 'BACKEND NOT INITIALIZED // CONFIG MISSING';
      notifyListeners();
      return false;
    }

    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await client.auth.signInWithPassword(
        email: email.trim(),
        password: password,
      );

      if (res.session != null) {
        await _loadUserFromSession(res.session!);
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _errorMessage = 'AUTHENTICATION FAILED // NO ACTIVE SESSION';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } on AuthException catch (e) {
      _errorMessage = _mapAuthError(e.message);
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _errorMessage = 'NETWORK ERROR // CANNOT REACH AUTH GATEWAY';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  @override
  Future<bool> createAccount({
    required String fullName,
    required String email,
    required String password,
    required String cohortTarget,
    bool commitProtocol = true,
  }) async {
    final client = _client;
    if (client == null) {
      _errorMessage = 'BACKEND NOT INITIALIZED // CONFIG MISSING';
      notifyListeners();
      return false;
    }

    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final res = await client.auth.signUp(
        email: email.trim(),
        password: password,
        data: {
          'display_name': fullName.trim(),
          'cohort_target': cohortTarget,
          'commit_protocol': commitProtocol,
        },
      );

      final user = res.user;
      if (user != null) {
        await _ensureProfile(user.id, fullName.trim());

        if (res.session != null) {
          await _loadUserFromSession(res.session!);
        } else {
          // If Supabase project requires email confirmation
          _currentUser = ForgeUser(
            id: user.id,
            email: user.email ?? email.trim(),
            fullName: fullName.trim(),
            handle: fullName.trim().toLowerCase().replaceAll(' ', '_'),
            cohortTarget: cohortTarget,
            hasActiveSession: false,
          );
        }

        _isLoading = false;
        notifyListeners();
        return true;
      }

      _errorMessage = 'ACCOUNT INITIALIZATION FAILED';
      _isLoading = false;
      notifyListeners();
      return false;
    } on AuthException catch (e) {
      _errorMessage = _mapAuthError(e.message);
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _errorMessage = 'NETWORK ERROR // PROTOCOL CONNECTION TIMEOUT';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  @override
  Future<bool> signInWithGithub() async {
    final client = _client;
    if (client == null) return false;
    try {
      return await client.auth.signInWithOAuth(OAuthProvider.github);
    } catch (e) {
      debugPrint('[SupabaseAuthService] OAuth error: $e');
      return false;
    }
  }

  @override
  Future<bool> signInWithGoogle() async {
    final client = _client;
    if (client == null) return false;
    try {
      return await client.auth.signInWithOAuth(OAuthProvider.google);
    } catch (e) {
      debugPrint('[SupabaseAuthService] OAuth error: $e');
      return false;
    }
  }

  @override
  Future<void> signOut() async {
    final client = _client;
    _isLoading = true;
    notifyListeners();

    try {
      if (client != null) {
        await client.auth.signOut();
      }
    } catch (e) {
      debugPrint('[SupabaseAuthService] signOut error: $e');
    } finally {
      _currentUser = null;
      _errorMessage = null;
      _isLoading = false;
      SyncEngine.instance.setActiveUserId(null);
      CloudHydrationService.instance.reset();
      notifyListeners();
    }
  }

  String _mapAuthError(String message) {
    final lower = message.toLowerCase();
    if (lower.contains('invalid login credentials') || lower.contains('invalid credentials')) {
      return 'INVALID CREDENTIALS // ACCESS DENIED';
    }
    if (lower.contains('already registered') || lower.contains('user already exists')) {
      return 'OPERATOR EXISTS // SWITCH TO SIGN IN';
    }
    if (lower.contains('password')) {
      return 'SECURITY KEY MUST BE AT LEAST 6 CHARACTERS';
    }
    if (lower.contains('email not confirmed')) {
      return 'EMAIL VERIFICATION PENDING // CHECK INBOX';
    }
    return message.toUpperCase();
  }
}
