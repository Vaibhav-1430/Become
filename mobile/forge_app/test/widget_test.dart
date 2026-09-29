import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:forge_app/app.dart';
import 'package:forge_app/features/auth/data/auth_service.dart';
import 'package:forge_app/features/auth/presentation/screens/create_account_screen.dart';
import 'package:forge_app/features/auth/presentation/screens/sign_in_screen.dart';
import 'package:forge_app/features/home/presentation/screens/home_shell_screen.dart';
import 'package:forge_app/features/home/presentation/screens/todays_command_screen.dart';
import 'package:forge_app/features/onboarding/presentation/screens/welcome_screen.dart';

void main() {
  setUp(() async {
    await MockAuthService().signOut();
  });

  group('Phase 5B — Foundation & Navigation Tests', () {
    testWidgets('1. App startup loads WelcomeScreen with brand text', (WidgetTester tester) async {
      await tester.pumpWidget(const ForgeApp());
      await tester.pumpAndSettle();

      expect(find.text('FORGE'), findsOneWidget);
      expect(find.text('Build yourself. Every single day.'), findsOneWidget);
      expect(find.text('GET STARTED'), findsOneWidget);
      expect(find.text('SYSTEM :: ONLINE'), findsOneWidget);
    });

    testWidgets('2. Welcome screen renders all 4 execution pillars', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: WelcomeScreen()),
      );
      await tester.pumpAndSettle();

      expect(find.text('01 // ALGO'), findsOneWidget);
      expect(find.text('02 // BUILD'), findsOneWidget);
      expect(find.text('03 // BODY'), findsOneWidget);
      expect(find.text('04 // TIER-1'), findsOneWidget);
      expect(find.text('ALGORITHMIC'), findsOneWidget);
      expect(find.text('CAPSTONES'), findsOneWidget);
      expect(find.text('RESILIENCE'), findsOneWidget);
      expect(find.text('PIPELINE'), findsOneWidget);
    });

    testWidgets('3. Sign In screen renders faithfully with inputs and SSO options', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: SignInScreen()),
      );
      await tester.pumpAndSettle();

      expect(find.text('AUTH :: GATEWAY'), findsOneWidget);
      expect(find.text('SIGN IN WITH GITHUB'), findsOneWidget);
      expect(find.text('CONTINUE WITH GOOGLE'), findsOneWidget);
      expect(find.text('WORK / STUDENT EMAIL'), findsOneWidget);
      expect(find.text('ACCESS KEY / PASSWORD'), findsOneWidget);
      expect(find.text('AUTHENTICATE & ENTER'), findsOneWidget);
      expect(find.text('MAINTAIN ACTIVE SESSION (30 DAYS)'), findsOneWidget);
    });

    testWidgets('4. Create Account screen renders with protocol initialization', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: CreateAccountScreen()),
      );
      await tester.pumpAndSettle();

      expect(find.text('ABORT // BACK'), findsOneWidget);
      expect(find.text('SYS :: READY'), findsOneWidget);
      expect(find.text('INITIALIZE ACCOUNT'), findsOneWidget);
      expect(find.text('FULL NAME / HANDLE'), findsOneWidget);
      expect(find.text('STUDENT / PRIMARY DEV EMAIL'), findsOneWidget);
      expect(find.text('CAMPUS / COHORT TARGET'), findsOneWidget);
      expect(find.text('CREATE SECURITY KEY (PASSWORD)'), findsOneWidget);
      expect(find.text('8+ CHARS'), findsOneWidget);
      expect(find.text('INITIALIZE ACCOUNT & BEGIN'), findsOneWidget);
    });

    testWidgets('5. Mock login navigation flow (Welcome -> Sign In -> Home)', (WidgetTester tester) async {
      await tester.pumpWidget(const ForgeApp());
      await tester.pumpAndSettle();

      // Tap GET STARTED to navigate to Sign In
      await tester.ensureVisible(find.text('GET STARTED'));
      await tester.tap(find.text('GET STARTED'));
      await tester.pumpAndSettle();

      expect(find.text('AUTH :: GATEWAY'), findsOneWidget);

      // Perform Mock Email Sign In
      await tester.enterText(find.byType(TextFormField).first, 'engineer@university.edu');
      await tester.enterText(find.byType(TextFormField).last, 'secretkey123');
      await tester.pumpAndSettle();

      await tester.ensureVisible(find.text('AUTHENTICATE & ENTER'));
      await tester.tap(find.text('AUTHENTICATE & ENTER'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 600));
      await tester.pumpAndSettle();

      // Should now be on Home screen (Today's Command)
      expect(find.text("Good morning, BOSS"), findsOneWidget);
      expect(find.text("DSA — Two Pointers & Sliding Window"), findsOneWidget);
    });

    testWidgets('6. Mock registration navigation flow (Welcome -> Sign In -> Create Account -> Home)', (WidgetTester tester) async {
      await tester.pumpWidget(const ForgeApp());
      await tester.pumpAndSettle();

      // Navigate to Sign In
      await tester.ensureVisible(find.text('GET STARTED'));
      await tester.tap(find.text('GET STARTED'));
      await tester.pumpAndSettle();

      // Tap INITIALIZE ACCOUNT
      await tester.ensureVisible(find.text('INITIALIZE ACCOUNT'));
      await tester.tap(find.text('INITIALIZE ACCOUNT'));
      await tester.pumpAndSettle();

      expect(find.text('INITIALIZE ACCOUNT'), findsWidgets);

      // Tap Initialize Account & Begin
      await tester.ensureVisible(find.text('INITIALIZE ACCOUNT & BEGIN'));
      await tester.tap(find.text('INITIALIZE ACCOUNT & BEGIN'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 600));
      await tester.pumpAndSettle();

      // Should arrive on authenticated Home screen
      expect(find.text("Good morning, Alex"), findsOneWidget);
    });

    testWidgets('7. Home screen and Today\'s Command render all 4 pillars and directives', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(home: HomeShellScreen()),
      );
      await tester.pumpAndSettle();

      // Top bar elements
      expect(find.text('SYS.ACT'), findsOneWidget);
      expect(find.textContaining('d'), findsWidgets);

      // Greeting & Target
      expect(find.text('DAILY TARGET'), findsOneWidget);
      expect(find.text('6.5h'), findsOneWidget);

      // Hero Command Card
      expect(find.text('AI RECOMMENDATION • HIGH PRIORITY'), findsOneWidget);
      expect(find.text('DSA — Two Pointers & Sliding Window'), findsOneWidget);
      expect(find.text('START COMMAND'), findsOneWidget);

      // Pillar Execution Status
      expect(find.text('PILLAR EXECUTION STATUS'), findsOneWidget);
      expect(find.text('3 / 4 ACTIVE'), findsOneWidget);
      expect(find.text('DSA'), findsOneWidget);
      expect(find.text('DEV'), findsOneWidget);
      expect(find.text('STUDY'), findsOneWidget);
      expect(find.text('TRAIN'), findsWidgets); // One in pillar, one in nav dock

      // Directives
      expect(find.text('UPCOMING DIRECTIVES'), findsOneWidget);
      expect(find.text('16:00'), findsOneWidget);
      expect(find.text('17:30'), findsOneWidget);
      expect(find.text('20:00'), findsOneWidget);

      // Navigation Dock
      expect(find.text('HOME'), findsOneWidget);
      expect(find.text('PLAN'), findsOneWidget);
      expect(find.text('LEARN'), findsOneWidget);
      expect(find.text('CAREER'), findsOneWidget);
    });
  });

  group('8. Responsiveness: No Horizontal Overflow at Supported Widths', () {
    const supportedWidths = [320.0, 360.0, 375.0, 390.0, 414.0, 430.0];

    for (final width in supportedWidths) {
      testWidgets('No horizontal overflow on WelcomeScreen at width $width', (WidgetTester tester) async {
        tester.view.physicalSize = Size(width, 844);
        tester.view.devicePixelRatio = 1.0;
        addTearDown(tester.view.resetPhysicalSize);

        await tester.pumpWidget(const MaterialApp(home: WelcomeScreen()));
        await tester.pumpAndSettle();

        expect(tester.takeException(), isNull);
      });

      testWidgets('No horizontal overflow on SignInScreen at width $width', (WidgetTester tester) async {
        tester.view.physicalSize = Size(width, 844);
        tester.view.devicePixelRatio = 1.0;
        addTearDown(tester.view.resetPhysicalSize);

        await tester.pumpWidget(const MaterialApp(home: SignInScreen()));
        await tester.pumpAndSettle();

        expect(tester.takeException(), isNull);
      });

      testWidgets('No horizontal overflow on CreateAccountScreen at width $width', (WidgetTester tester) async {
        tester.view.physicalSize = Size(width, 844);
        tester.view.devicePixelRatio = 1.0;
        addTearDown(tester.view.resetPhysicalSize);

        await tester.pumpWidget(const MaterialApp(home: CreateAccountScreen()));
        await tester.pumpAndSettle();

        expect(tester.takeException(), isNull);
      });

      testWidgets('No horizontal overflow on TodaysCommandScreen at width $width', (WidgetTester tester) async {
        tester.view.physicalSize = Size(width, 844);
        tester.view.devicePixelRatio = 1.0;
        addTearDown(tester.view.resetPhysicalSize);

        await tester.pumpWidget(const MaterialApp(home: Scaffold(body: TodaysCommandScreen())));
        await tester.pumpAndSettle();

        expect(tester.takeException(), isNull);
      });
    }
  });
}
