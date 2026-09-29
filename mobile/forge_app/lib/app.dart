import 'package:flutter/material.dart';
import 'core/constants/app_constants.dart';
import 'core/routing/app_router.dart';
import 'core/routing/app_routes.dart';
import 'core/theme/forge_theme.dart';

/// Root application widget for FORGE Mobile.
class ForgeApp extends StatelessWidget {
  final String? initialRoute;

  const ForgeApp({super.key, this.initialRoute});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: AppConstants.appName,
      debugShowCheckedModeBanner: false,
      theme: ForgeTheme.darkTheme,
      initialRoute: initialRoute ?? AppRoutes.initial,
      onGenerateRoute: AppRouter.onGenerateRoute,
    );
  }
}
