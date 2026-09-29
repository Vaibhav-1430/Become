import 'package:flutter/material.dart';
import '../../../../core/constants/app_constants.dart';
import '../../../../core/routing/app_routes.dart';
import '../../../../core/theme/forge_colors.dart';
import '../../../../core/theme/forge_spacing.dart';
import '../../../../core/theme/forge_typography.dart';
import '../../../../core/utils/responsive_layout.dart';
import '../../../../shared/widgets/forge_button.dart';
import '../../../../shared/widgets/forge_card.dart';
import '../../../../shared/widgets/forge_divider.dart';
import '../../../../shared/widgets/forge_pill.dart';
import '../../../../shared/widgets/forge_text_field.dart';
import '../../data/auth_service.dart';

/// Screen 3: FORGE — Create Account (Screen ID: 2575861a459846d4878932dc9d551bf6)
/// Faithful reproduction of the Stitch Initialize Account screen.
class CreateAccountScreen extends StatefulWidget {
  const CreateAccountScreen({super.key});

  @override
  State<CreateAccountScreen> createState() => _CreateAccountScreenState();
}

class _CreateAccountScreenState extends State<CreateAccountScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController(text: 'Alex Chen');
  final _emailController = TextEditingController(text: 'alex.chen@berkeley.edu');
  final _passwordController = TextEditingController(text: 'K1net!c_D1scipline#2026');

  final List<String> _cohortOptions = [
    'Class of 2026 // L4 SWE Intern',
    'Class of 2025 // Full-Time New Grad',
    'Class of 2027 // Systems & Infra Track',
    "Master's // Distributed Systems Spec",
  ];

  late String _selectedCohort;
  bool _isPasswordVisible = false;
  bool _commitProtocol = true;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _selectedCohort = _cohortOptions.first;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleRegister() async {
    setState(() {
      _errorMessage = null;
      _isLoading = true;
    });

    final name = _nameController.text.trim();
    final email = _emailController.text.trim();
    final password = _passwordController.text;

    if (name.isEmpty || email.isEmpty || password.isEmpty) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'PLEASE COMPLETE ALL PROTOCOL FIELDS';
      });
      return;
    }

    final success = await AuthService.current.createAccount(
      fullName: name,
      email: email,
      password: password,
      cohortTarget: _selectedCohort,
      commitProtocol: _commitProtocol,
    );

    if (!mounted) return;

    setState(() => _isLoading = false);

    if (success) {
      if (AuthService.current.isAuthenticated) {
        Navigator.of(context).pushReplacementNamed(AppRoutes.home);
      } else {
        // Email verification dispatched
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: ForgeColors.surfaceContainerHigh,
            content: Text(
              'ACCOUNT INITIALIZED // VERIFICATION EMAIL DISPATCHED',
              style: ForgeTypography.labelSm.copyWith(color: ForgeColors.tertiary),
            ),
          ),
        );
        Navigator.of(context).pushReplacementNamed(AppRoutes.signIn);
      }
    } else {
      setState(() => _errorMessage = 'ACCOUNT INITIALIZATION FAILED // CHECK INPUTS');
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
              // Top Status Header (Engineering Instrumentation HUD)
              _buildHeader(context),

              // Scrollable Content Canvas
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.only(top: ForgeSpacing.spaceLg, bottom: ForgeSpacing.spaceLg),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Header & Context Protocol Block
                      _buildProtocolBlock(),

                      const SizedBox(height: ForgeSpacing.spaceMd),

                      // Fast Path: GitHub Protocol
                      _buildGithubFastPath(),

                      const SizedBox(height: ForgeSpacing.spaceSm),

                      // Structural Boundary Divider
                      const ForgeDivider(
                        label: '// OR MANUAL INITIALIZATION //',
                      ),

                      const SizedBox(height: ForgeSpacing.spaceMd),

                      // Registration Form Chassis
                      _buildForm(),

                      const SizedBox(height: ForgeSpacing.spaceLg),

                      // Return / Switch to Login Terminal
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
            color: Color(0x35504535),
            width: 1.0,
          ),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: InkWell(
              onTap: () => Navigator.of(context).pop(),
              child: Row(
                children: [
                  const Icon(
                    Icons.arrow_back,
                    size: 18,
                    color: ForgeColors.onSurfaceVariant,
                  ),
                  const SizedBox(width: 6),
                  Flexible(
                    child: Text(
                      'ABORT // BACK',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: ForgeTypography.labelSm.copyWith(
                        color: ForgeColors.onSurfaceVariant,
                        letterSpacing: 1.5,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 8),
          ForgePill.status(
            label: 'SYS :: READY',
            dotColor: ForgeColors.tertiary,
          ),
        ],
      ),
    );
  }

  Widget _buildProtocolBlock() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Flexible(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: ForgeColors.surfaceContainerLow,
                  borderRadius: ForgeSpacing.borderRadiusXs,
                  border: Border.all(
                    color: ForgeColors.outlineVariant.withValues(alpha: 0.6),
                    width: 0.8,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.terminal,
                      size: 14,
                      color: ForgeColors.primaryContainer,
                    ),
                    const SizedBox(width: 5),
                    Flexible(
                      child: Text(
                        'PROTOCOL INITIALIZATION // STEP 01 OF 02',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: ForgeTypography.labelSm.copyWith(
                          color: ForgeColors.primaryContainer,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(width: 6),
            Text(
              '[AUTH.ENG-V2.4]',
              style: ForgeTypography.labelSm.copyWith(
                color: ForgeColors.outline,
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Text(
          'INITIALIZE ACCOUNT',
          style: ForgeTypography.headlineLg.copyWith(
            fontWeight: FontWeight.bold,
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'Join the sovereign operating terminal engineered for software engineering students & relentless execution.',
          style: ForgeTypography.bodyMd.copyWith(
            color: ForgeColors.onSurfaceVariant,
            height: 1.4,
          ),
        ),
      ],
    );
  }

  Widget _buildGithubFastPath() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: double.infinity,
          height: 52,
          child: OutlinedButton(
            onPressed: () async {
              final navigator = Navigator.of(context);
              await AuthService.current.signInWithGithub();
              if (!mounted) return;
              navigator.pushReplacementNamed(AppRoutes.home);
            },
            style: OutlinedButton.styleFrom(
              backgroundColor: ForgeColors.surfaceContainerLow,
              foregroundColor: ForgeColors.onSurface,
              side: const BorderSide(color: ForgeColors.outlineVariant, width: 1.0),
              shape: RoundedRectangleBorder(
                borderRadius: ForgeSpacing.borderRadiusSm,
              ),
              padding: const EdgeInsets.symmetric(horizontal: ForgeSpacing.spaceMd),
            ),
            child: Row(
              children: [
                const Icon(
                  Icons.terminal,
                  size: 20,
                  color: ForgeColors.primary,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'INITIALIZE WITH GITHUB',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: ForgeTypography.labelMd.copyWith(
                          color: ForgeColors.onSurface,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 0.6,
                        ),
                      ),
                      Text(
                        'Telemetry & Commit Sync',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: ForgeTypography.labelSm.copyWith(
                          color: ForgeColors.outline,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(
                  Icons.north_east,
                  size: 16,
                  color: ForgeColors.outline,
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 4),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4),
          child: Text(
            'Syncs public commits, leetcode hooks, and academic branches automatically.',
            style: ForgeTypography.labelSm.copyWith(
              color: ForgeColors.outline,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildForm() {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Field 1: Name / Handle
          ForgeTextField(
            label: 'FULL NAME / HANDLE',
            rightTag: '[SYS.ID]',
            controller: _nameController,
            leadingIcon: const Icon(
              Icons.person,
              size: 16,
              color: ForgeColors.primary,
            ),
            trailingIcon: const Padding(
              padding: EdgeInsets.only(right: 10),
              child: Icon(
                Icons.check_circle,
                size: 16,
                color: ForgeColors.tertiary,
              ),
            ),
          ),

          const SizedBox(height: ForgeSpacing.spaceMd),

          // Field 2: Email
          ForgeTextField(
            label: 'STUDENT / PRIMARY DEV EMAIL',
            rightTag: '[REQUIRED]',
            isRequired: true,
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            leadingIcon: const Icon(
              Icons.mail,
              size: 16,
              color: ForgeColors.primary,
            ),
            trailingIcon: const Padding(
              padding: EdgeInsets.only(right: 10),
              child: Icon(
                Icons.check_circle,
                size: 16,
                color: ForgeColors.tertiary,
              ),
            ),
          ),

          const SizedBox(height: ForgeSpacing.spaceMd),

          // Field 3: Target Role / Cohort Dropdown
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Row(
                      children: [
                        const Icon(
                          Icons.school,
                          size: 16,
                          color: ForgeColors.primary,
                        ),
                        const SizedBox(width: 6),
                        Flexible(
                          child: Text(
                            'CAMPUS / COHORT TARGET',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: ForgeTypography.labelSm.copyWith(
                              color: ForgeColors.onSurface,
                              fontWeight: FontWeight.w600,
                              letterSpacing: 0.8,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    '[SWE PIPELINE]',
                    style: ForgeTypography.labelSm.copyWith(
                      color: ForgeColors.primary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Container(
                height: 48,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                decoration: BoxDecoration(
                  color: ForgeColors.surface,
                  borderRadius: ForgeSpacing.borderRadiusSm,
                  border: Border.all(
                    color: ForgeColors.surfaceContainer,
                    width: 1.0,
                  ),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _selectedCohort,
                    isExpanded: true,
                    dropdownColor: ForgeColors.surfaceContainerHigh,
                    icon: const Icon(
                      Icons.unfold_more,
                      size: 18,
                      color: ForgeColors.outline,
                    ),
                    items: _cohortOptions.map((option) {
                      return DropdownMenuItem<String>(
                        value: option,
                        child: Text(
                          option,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: ForgeTypography.labelMd.copyWith(
                            color: ForgeColors.onSurface,
                          ),
                        ),
                      );
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) setState(() => _selectedCohort = val);
                    },
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: ForgeSpacing.spaceMd),

          // Field 4: Password / Security Key
          ForgeTextField(
            label: 'CREATE SECURITY KEY (PASSWORD)',
            rightTag: 'ENTROPY: OPTIMAL',
            rightAction: Text(
              'ENTROPY: OPTIMAL',
              style: ForgeTypography.labelSm.copyWith(
                color: ForgeColors.tertiary,
                fontWeight: FontWeight.bold,
              ),
            ),
            controller: _passwordController,
            isPassword: true,
            isPasswordVisible: _isPasswordVisible,
            onTogglePasswordVisibility: () {
              setState(() => _isPasswordVisible = !_isPasswordVisible);
            },
            leadingIcon: const Icon(
              Icons.key,
              size: 16,
              color: ForgeColors.primary,
            ),
          ),

          const SizedBox(height: 6),

          // Real-Time Password Criteria Telemetry Badges
          Row(
            children: [
              Expanded(child: _buildCriteriaBadge('8+ CHARS')),
              const SizedBox(width: 6),
              Expanded(child: _buildCriteriaBadge('ALPHA-NUM')),
              const SizedBox(width: 6),
              Expanded(child: _buildCriteriaBadge('SYMBOL')),
            ],
          ),

          const SizedBox(height: ForgeSpacing.spaceMd),

          // Protocol Commitment Box
          ForgeCard(
            backgroundColor: ForgeColors.surfaceContainerLow,
            padding: const EdgeInsets.all(ForgeSpacing.spaceMd),
            borderColor: ForgeColors.outlineVariant.withValues(alpha: 0.7),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                InkWell(
                  onTap: () => setState(() => _commitProtocol = !_commitProtocol),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SizedBox(
                        width: 18,
                        height: 18,
                        child: Checkbox(
                          value: _commitProtocol,
                          onChanged: (val) => setState(() => _commitProtocol = val ?? true),
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
                        child: Text(
                          'I commit to the daily execution protocol (DSA Mastery, Systems Code, Physical Conditioning, Placement Pipeline).',
                          style: ForgeTypography.bodySm.copyWith(
                            color: ForgeColors.onSurface,
                            fontWeight: FontWeight.w500,
                            height: 1.35,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
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
                  child: Text(
                    'By initializing, you accept the FORGE Execution Standards & Privacy Architecture. Zero spam, zero metric sellout.',
                    style: ForgeTypography.labelSm.copyWith(
                      color: ForgeColors.outline,
                    ),
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

          // Primary Action CTA Button
          ForgePrimaryButton(
            label: 'INITIALIZE ACCOUNT & BEGIN',
            height: 52,
            isLoading: _isLoading,
            trailing: const Icon(
              Icons.arrow_forward,
              size: 20,
              color: ForgeColors.canvas,
            ),
            onPressed: _handleRegister,
          ),
        ],
      ),
    );
  }

  Widget _buildCriteriaBadge(String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
      decoration: BoxDecoration(
        color: ForgeColors.surfaceContainerLow,
        borderRadius: ForgeSpacing.borderRadiusXs,
        border: Border.all(
          color: ForgeColors.tertiaryContainer.withValues(alpha: 0.4),
          width: 0.8,
        ),
      ),
      child: Center(
        child: FittedBox(
          fit: BoxFit.scaleDown,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.check,
                size: 12,
                color: ForgeColors.tertiary,
              ),
              const SizedBox(width: 3),
              Text(
                label,
                style: ForgeTypography.labelSm.copyWith(
                  color: ForgeColors.tertiary,
                  fontWeight: FontWeight.w600,
                  fontSize: 10,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFooter(BuildContext context) {
    return Column(
      children: [
        InkWell(
          onTap: () {
            Navigator.of(context).pushReplacementNamed(AppRoutes.signIn);
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Wrap(
              alignment: WrapAlignment.center,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                Text(
                  'ALREADY REGISTERED? ',
                  style: ForgeTypography.labelMd.copyWith(
                    color: ForgeColors.outline,
                  ),
                ),
                Text(
                  'AUTHENTICATE →',
                  style: ForgeTypography.labelMd.copyWith(
                    color: ForgeColors.primary,
                    fontWeight: FontWeight.bold,
                    decoration: TextDecoration.underline,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 8),
        Wrap(
          alignment: WrapAlignment.center,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            Text(
              AppConstants.terminalCore,
              style: ForgeTypography.labelSm.copyWith(
                color: ForgeColors.outline,
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 6),
              child: Text(
                '•',
                style: ForgeTypography.labelSm.copyWith(color: ForgeColors.outline),
              ),
            ),
            Text(
              AppConstants.campusEdition,
              style: ForgeTypography.labelSm.copyWith(
                color: ForgeColors.outline,
              ),
            ),
          ],
        ),
      ],
    );
  }
}
