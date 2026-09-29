import 'package:flutter/material.dart';
import '../../features/auth/presentation/screens/create_account_screen.dart';
import '../../features/auth/presentation/screens/sign_in_screen.dart';
import '../../features/home/presentation/screens/home_shell_screen.dart';
import '../../features/onboarding/presentation/screens/welcome_screen.dart';
import '../../features/analytics/presentation/screens/analytics_screen.dart';
import '../../features/mistakes/presentation/screens/mistake_bank_screen.dart';
import '../../features/career/presentation/screens/career_screen.dart';
import '../../features/tests/presentation/screens/test_hub_screen.dart';
import 'app_routes.dart';

/// Centralized route generator for FORGE.
abstract final class AppRouter {
  static Route<dynamic> onGenerateRoute(RouteSettings settings) {
    switch (settings.name) {
      case AppRoutes.welcome:
        return _buildRoute(const WelcomeScreen(), settings);
      case AppRoutes.signIn:
        return _buildRoute(const SignInScreen(), settings);
      case AppRoutes.createAccount:
        return _buildRoute(const CreateAccountScreen(), settings);
      case AppRoutes.home:
        return _buildRoute(const HomeShellScreen(), settings);
      case AppRoutes.analytics:
        return _buildRoute(const AnalyticsScreen(), settings);
      case AppRoutes.mistakes:
        return _buildRoute(const MistakeBankScreen(), settings);
      case AppRoutes.career:
        return _buildRoute(const CareerScreen(), settings);
      case AppRoutes.tests:
        return _buildRoute(const TestHubScreen(), settings);
      default:
        return _buildRoute(const WelcomeScreen(), settings);
    }
  }

  static PageRouteBuilder<dynamic> _buildRoute(Widget screen, RouteSettings settings) {
    return PageRouteBuilder<dynamic>(
      settings: settings,
      pageBuilder: (context, animation, secondaryAnimation) => screen,
      transitionsBuilder: (context, animation, secondaryAnimation, child) {
        return FadeTransition(
          opacity: animation,
          child: child,
        );
      },
      transitionDuration: const Duration(milliseconds: 200),
    );
  }
}
