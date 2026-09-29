import 'package:flutter/material.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/routing/app_routes.dart';
import '../../../../core/theme/forge_colors.dart';
import '../../../../core/theme/forge_spacing.dart';
import '../../../../core/theme/forge_typography.dart';
import '../../../../core/utils/responsive_layout.dart';
import '../../../../shared/widgets/forge_button.dart';
import '../../../../shared/widgets/forge_divider.dart';
import '../../../../shared/widgets/forge_text_field.dart';
import '../../data/auth_service.dart';
import '../widgets/sso_buttons.dart';

/// Screen 2: FORGE — Sign In (Screen ID: 1add5ebe0a0e4fe0b92e3fdf963e6e13)
/// Authentication Gateway faithfully matching Stitch specifications.
class SignInScreen extends StatefulWidget {
  const SignInScreen({super.key});

  @override
  State<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends State<SignInScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _isPasswordVisible = false;
  bool _maintainSession = true;
  bool _isLoading = false;
  bool _isEmailValid = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _emailController.addListener(_onEmailChanged);
  }

  void _onEmailChanged() {
    final text = _emailController.text.trim();
    final isValid = text.length > 3 && text.contains('@');
    if (isValid != _isEmailValid) {
      setState(() => _isEmailValid = isValid);
    }
  }

  @override
  void dispose() {
    _emailController.removeListener(_onEmailChanged);
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleSignIn() async {
    setState(() {
      _errorMessage = null;
      _isLoading = true;
    });

    final email = _emailController.text.trim();
    final password = _passwordController.text;

    if (email.isEmpty || password.isEmpty) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'PLEASE FILL IN ALL REQUIRED CREDENTIALS';
      });
      return;
    }

    final success = await AuthService.current.signInWithEmailPassword(
      email: email,
      password: password,
      rememberSession: _maintainSession,
    );

    if (!mounted) return;

    setState(() => _isLoading = false);

    if (success) {
      Navigator.of(context).pushReplacementNamed(AppRoutes.home);
    } else {
      setState(() => _errorMessage = 'AUTHENTICATION FAILED // INVALID CREDENTIALS');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: ForgeColors.canvas,
      body: SafeArea(
        child: ResponsiveContentWrapper(
          maxWidth: AppConstants.maxContentWidth,
          padding: const EdgeInsets.symmetric(horizontal: ForgeSpacing.margin),
          child: Column(
            children: [
              // Top Minimal Instrument Header
              _buildHeader(context),

              // Scrollable Form Body
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.only(top: ForgeSpacing.spaceLg, bottom: ForgeSpacing.spaceMd),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Brand & Tactical Monogram Lockup
                      _buildBrandLockup(),

                      const SizedBox(height: ForgeSpacing.spaceLg),

                      // Fast Developer SSO Cluster
                      GithubSsoButton(
                        label: 'SIGN IN WITH GITHUB',
                        trailingTag: '[OAUTH]',
                        onPressed: () async {
                          final navigator = Navigator.of(context);
                          await AuthService.current.signInWithGithub();
                          if (!mounted) return;
                          navigator.pushReplacementNamed(AppRoutes.home);
                        },
                      ),

                      const SizedBox(height: 8),

                      GoogleSsoButton(
                        onPressed: () async {
                          final navigator = Navigator.of(context);
                          await AuthService.current.signInWithGoogle();
                          if (!mounted) return;
                          navigator.pushReplacementNamed(AppRoutes.home);
                        },
                      ),

                      const SizedBox(height: ForgeSpacing.spaceMd),

                      // Tactical Divider
                      const ForgeDivider(
                        label: 'KEY AUTHENTICATION',
                        showDots: true,
                      ),

                      const SizedBox(height: ForgeSpacing.spaceMd),

                      // Authentication Form
                      _buildAuthForm(),

                      const SizedBox(height: ForgeSpacing.spaceLg),

                      // Footer Navigation & Encryption Protocol Stamp
                      _buildFooter(context),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      height: 56,
      decoration: const BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: ForgeColors.surfaceContainer,
            width: 1.0,
          ),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Row(
              children: [
                InkWell(
                  onTap: () => Navigator.of(context).pop(),
                  borderRadius: ForgeSpacing.borderRadiusXs,
                  child: Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      borderRadius: ForgeSpacing.borderRadiusXs,
                      border: Border.all(
                        color: ForgeColors.surfaceContainer,
                        width: 1.0,
                      ),
                    ),
                    child: const Icon(
                      Icons.arrow_back,
                      size: 18,
                      color: ForgeColors.onSurfaceVariant,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Flexible(
                  child: Text(
                    'AUTH :: GATEWAY',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: ForgeTypography.labelSm.copyWith(
                      color: ForgeColors.onSurfaceVariant,
                      letterSpacing: 1.2,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: ForgeColors.surfaceContainerLow,
                  borderRadius: ForgeSpacing.borderRadiusXs,
                  border: Border.all(
                    color: ForgeColors.surfaceContainer,
                    width: 1.0,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 6,
                      height: 6,
                      decoration: const BoxDecoration(
                        color: ForgeColors.tertiary,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 5),
                    Text(
                      'SYS.ON',
                      style: ForgeTypography.labelSm.copyWith(
                        color: ForgeColors.tertiary,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 6),
              Text(
                '[${AppConstants.systemVersion}]',
                style: ForgeTypography.labelSm.copyWith(
                  color: ForgeColors.outlineVariant,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBrandLockup() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            // Tactical Emblem Monogram
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: ForgeColors.surface,
                borderRadius: ForgeSpacing.borderRadiusXs,
                border: Border.all(
                  color: ForgeColors.outlineVariant,
                  width: 1.0,
                ),
              ),
              child: Stack(
                children: [
                  const Center(
                    child: Icon(
                      Icons.terminal,
                      size: 22,
                      color: ForgeColors.primary,
                    ),
                  ),
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: Container(
                      width: 8,
                      height: 8,
                      color: ForgeColors.primaryContainer,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    AppConstants.appName,
                    style: ForgeTypography.headlineLg.copyWith(
                      letterSpacing: 1.5,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Text(
                    'ACCESS COMMAND // TERMINAL AUTH',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: ForgeTypography.labelSm.copyWith(
                      color: ForgeColors.primary,
                      letterSpacing: 1.2,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.only(left: 10, top: 2, bottom: 2),
          decoration: const BoxDecoration(
            border: Border(
              left: BorderSide(
                color: ForgeColors.primaryContainer,
                width: 2.5,
              ),
            ),
          ),
          child: Text(
            '"${AppConstants.appTagline}" Authenticate your sovereign engineering environment.',
            style: ForgeTypography.bodySm.copyWith(
              color: ForgeColors.onSurfaceVariant,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildAuthForm() {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Email field
          ForgeTextField(
            label: 'WORK / STUDENT EMAIL',
            rightTag: 'SYS_ID',
            isRequired: true,
            hintText: 'engineer@university.edu',
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            leadingIcon: const Icon(
              Icons.alternate_email,
              size: 18,
              color: ForgeColors.onSurfaceVariant,
            ),
            trailingIcon: Padding(
              padding: const EdgeInsets.only(right: 10),
              child: Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: _isEmailValid ? ForgeColors.tertiary : ForgeColors.outlineVariant,
                  shape: BoxShape.circle,
                  boxShadow: _isEmailValid
                      ? [
                          BoxShadow(
                            color: ForgeColors.tertiary.withValues(alpha: 0.6),
                            blurRadius: 6,
                            spreadRadius: 1,
                          ),
                        ]
                      : null,
                ),
              ),
            ),
          ),

          const SizedBox(height: ForgeSpacing.spaceMd),

          // Password field
          ForgeTextField(
            label: 'ACCESS KEY / PASSWORD',
            isRequired: true,
            rightAction: InkWell(
              onTap: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    backgroundColor: ForgeColors.surfaceContainerHigh,
                    content: Text(
                      'KEY RECOVERY INITIATED // CONTACT SYSADMIN',
                      style: ForgeTypography.labelSm.copyWith(color: ForgeColors.primary),
                    ),
                  ),
                );
              },
              child: Text(
                'FORGOT KEY?',
                style: ForgeTypography.labelSm.copyWith(
                  color: ForgeColors.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            hintText: '••••••••••••••••',
            controller: _passwordController,
            isPassword: true,
            isPasswordVisible: _isPasswordVisible,
            onTogglePasswordVisibility: () {
              setState(() => _isPasswordVisible = !_isPasswordVisible);
            },
            leadingIcon: const Icon(
              Icons.key,
              size: 18,
              color: ForgeColors.onSurfaceVariant,
            ),
          ),

          const SizedBox(height: ForgeSpacing.spaceSm),

          // Session Persistence Checkbox
          InkWell(
            onTap: () => setState(() => _maintainSession = !_maintainSession),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  width: 20,
                  height: 20,
                  child: Checkbox(
                    value: _maintainSession,
                    onChanged: (val) => setState(() => _maintainSession = val ?? true),
                    activeColor: ForgeColors.primaryContainer,
                    checkColor: ForgeColors.canvas,
                    side: const BorderSide(color: ForgeColors.outlineVariant, width: 1.0),
                    shape: RoundedRectangleBorder(
                      borderRadius: ForgeSpacing.borderRadiusXs,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'MAINTAIN ACTIVE SESSION (30 DAYS)',
                        style: ForgeTypography.labelSm.copyWith(
                          color: ForgeColors.onSurface,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        'Hardware-bound session key stored locally.',
                        style: ForgeTypography.labelSm.copyWith(
                          color: ForgeColors.outlineVariant,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          if (_errorMessage != null) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              decoration: BoxDecoration(
                color: ForgeColors.errorContainer.withValues(alpha: 0.3),
                borderRadius: ForgeSpacing.borderRadiusXs,
                border: Border.all(color: ForgeColors.error.withValues(alpha: 0.5)),
              ),
              child: Text(
                _errorMessage!,
                style: ForgeTypography.labelSm.copyWith(
                  color: ForgeColors.error,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],

          const SizedBox(height: ForgeSpacing.spaceLg),

          // Primary Auth CTA
          ForgePrimaryButton(
            label: 'AUTHENTICATE & ENTER',
            height: 52,
            isLoading: _isLoading,
            trailing: const Icon(
              Icons.arrow_forward,
              size: 20,
              color: ForgeColors.canvas,
            ),
            onPressed: _handleSignIn,
          ),

          const SizedBox(height: 8),

          // Biometric Passkey
          ForgeSecondaryButton(
            label: 'USE BIOMETRIC PASSKEY / FACE ID',
            height: 46,
            backgroundColor: ForgeColors.surfaceContainerLow,
            leading: const Icon(
              Icons.fingerprint,
              size: 20,
              color: ForgeColors.primary,
            ),
            onPressed: () async {
              final navigator = Navigator.of(context);
              await AuthService.current.signInWithGithub();
              if (!mounted) return;
              navigator.pushReplacementNamed(AppRoutes.home);
            },
          ),
        ],
      ),
    );
  }

  Widget _buildFooter(BuildContext context) {
    return Column(
      children: [
        // Navigation to Register
        InkWell(
          onTap: () {
            Navigator.of(context).pushNamed(AppRoutes.createAccount);
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Wrap(
              alignment: WrapAlignment.center,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                Text(
                  'NEW OPERATOR? ',
                  style: ForgeTypography.labelMd.copyWith(
                    color: ForgeColors.onSurfaceVariant,
                  ),
                ),
                Text(
                  'INITIALIZE ACCOUNT',
                  style: ForgeTypography.labelMd.copyWith(
                    color: ForgeColors.primary,
                    fontWeight: FontWeight.bold,
                    decoration: TextDecoration.underline,
                  ),
                ),
                const SizedBox(width: 4),
                const Icon(
                  Icons.arrow_forward,
                  size: 14,
                  color: ForgeColors.primary,
                ),
              ],
            ),
          ),
        ),

        const SizedBox(height: 12),

        Container(
          padding: const EdgeInsets.only(top: 8),
          decoration: const BoxDecoration(
            border: Border(
              top: BorderSide(
                color: Color(0x30504535),
                width: 1.0,
              ),
            ),
          ),
          child: Center(
            child: FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                'END-TO-END ENCRYPTED // FORGE SECURE PROTOCOL v2.4',
                style: ForgeTypography.labelSm.copyWith(
                  color: ForgeColors.outlineVariant,
                  letterSpacing: 0.8,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
