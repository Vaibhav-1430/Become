import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'app.dart';
import 'core/routing/app_routes.dart';
import 'core/supabase/supabase_client.dart';
import 'core/sync/engine/sync_engine.dart';
import 'core/sync/hydration/cloud_hydration_service.dart';
import 'core/sync/network/connectivity_service.dart';
import 'features/auth/data/auth_service.dart';
import 'features/auth/data/supabase_auth_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Set system UI overlay style to dark canvas
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: Color(0xFF0C0E12),
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );

  // Initialize centralized Supabase Client
  await ForgeSupabase.instance.initialize();

  // If Supabase is initialized, attach production SupabaseAuthService
  if (ForgeSupabase.instance.isInitialized) {
    AuthService.current = SupabaseAuthService();
  }

  // Restore session cleanly before deciding route
  await AuthService.current.restoreSession();

  // Initialize connectivity monitoring and sync engine
  ConnectivityService.instance.startMonitoring();
  final user = AuthService.current.currentUser;
  if (user != null) {
    SyncEngine.instance.setActiveUserId(user.id);
    // Start initial cloud hydration in background
    CloudHydrationService.instance.hydrate(user.id);
  }

  // Route directly to home if session restored, else welcome
  final initialRoute = AuthService.current.isAuthenticated
      ? AppRoutes.home
      : AppRoutes.welcome;

  runApp(ForgeApp(initialRoute: initialRoute));
}
