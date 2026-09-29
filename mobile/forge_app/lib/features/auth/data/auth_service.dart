import 'dart:async';
import 'package:flutter/foundation.dart';
import '../domain/forge_user.dart';

/// Contract for Authentication service across the FORGE mobile ecosystem.
abstract class AuthService extends ChangeNotifier {
  static AuthService? _current;

  /// The active production or test auth service singleton.
  static AuthService get current {
    _current ??= MockAuthService();
    return _current!;
  }

  static set current(AuthService service) {
    _current = service;
  }

  ForgeUser? get currentUser;
  bool get isAuthenticated => currentUser != null;
  bool get isLoading => false;
  String? get errorMessage => null;

  Future<bool> signInWithEmailPassword({
    required String email,
    required String password,
    bool rememberSession = true,
  });

  Future<bool> createAccount({
    required String fullName,
    required String email,
    required String password,
    required String cohortTarget,
    bool commitProtocol = true,
  });

  Future<bool> signInWithGithub();

  Future<bool> signInWithGoogle();

  Future<void> signOut();

  Future<void> restoreSession() async {}
}

/// Mock implementation of AuthService preserved for Phase 5B compatibility and offline/test mode.
class MockAuthService extends ChangeNotifier implements AuthService {
  static final MockAuthService _instance = MockAuthService._internal();
  factory MockAuthService() => _instance;
  MockAuthService._internal();

  ForgeUser? _currentUser;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  ForgeUser? get currentUser => _currentUser;

  @override
  bool get isAuthenticated => _currentUser != null;

  @override
  bool get isLoading => _isLoading;

  @override
  String? get errorMessage => _errorMessage;

  @override
  Future<bool> signInWithEmailPassword({
    required String email,
    required String password,
    bool rememberSession = true,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    await Future.delayed(const Duration(milliseconds: 300));

    if (email.trim().isEmpty || password.isEmpty) {
      _isLoading = false;
      _errorMessage = 'PLEASE FILL IN ALL REQUIRED CREDENTIALS';
      notifyListeners();
      return false;
    }

    _currentUser = ForgeUser(
      id: 'usr_mock_001',
      email: email.trim(),
      fullName: 'BOSS Operator',
      handle: 'boss',
      cohortTarget: 'Class of 2026 // L4 SWE Intern',
      hasActiveSession: rememberSession,
    );

    _isLoading = false;
    notifyListeners();
    return true;
  }

  @override
  Future<bool> createAccount({
    required String fullName,
    required String email,
    required String password,
    required String cohortTarget,
    bool commitProtocol = true,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    await Future.delayed(const Duration(milliseconds: 400));

    if (email.trim().isEmpty || fullName.trim().isEmpty || password.isEmpty) {
      _isLoading = false;
      _errorMessage = 'PLEASE FILL IN ALL REQUIRED CREDENTIALS';
      notifyListeners();
      return false;
    }

    _currentUser = ForgeUser(
      id: 'usr_mock_${DateTime.now().millisecondsSinceEpoch}',
      email: email.trim(),
      fullName: fullName.trim(),
      handle: fullName.trim().toLowerCase().replaceAll(' ', '_'),
      cohortTarget: cohortTarget,
      hasActiveSession: true,
    );

    _isLoading = false;
    notifyListeners();
    return true;
  }

  @override
  Future<bool> signInWithGithub() async {
    _currentUser = const ForgeUser(
      id: 'usr_gh_9901',
      email: 'engineer@github.com',
      fullName: 'Alex Chen',
      handle: 'alexc',
      cohortTarget: 'Class of 2026 // L4 SWE Intern',
    );
    notifyListeners();
    return true;
  }

  @override
  Future<bool> signInWithGoogle() async {
    _currentUser = const ForgeUser(
      id: 'usr_google_442',
      email: 'operator@gmail.com',
      fullName: 'Alex Chen',
      handle: 'alexc',
      cohortTarget: 'Class of 2026 // L4 SWE Intern',
    );
    notifyListeners();
    return true;
  }

  @override
  Future<void> signOut() async {
    _currentUser = null;
    _errorMessage = null;
    notifyListeners();
  }

  @override
  Future<void> restoreSession() async {
    // No-op for mock unless already set
  }
}
