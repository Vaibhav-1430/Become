import '../domain/internship.dart';
import '../domain/placement_readiness.dart';

/// Abstract contract for career operations (Internship applications & Placement Readiness).
abstract class CareerRepository {
  /// Fetches all internship applications for the current authenticated user,
  /// with optional status filtering and search query.
  Future<List<Internship>> getInternships({String? statusFilter, String? searchQuery});

  /// Fetches a single internship application by ID.
  Future<Internship?> getInternshipById(String id);

  /// Creates a new internship application in `public.internships`.
  Future<Internship> createInternship(Internship internship);

  /// Updates an existing internship application in `public.internships`.
  Future<Internship> updateInternship(Internship internship);

  /// Deletes an internship application from `public.internships`.
  Future<void> deleteInternship(String id);

  /// Calculates pipeline counts (total, active, OA, interview, offer, rejected, saved).
  Future<InternshipPipelineStats> getPipelineStats();

  /// Calculates placement readiness metrics across all 6-8 verified pillars.
  Future<PlacementReadiness> getPlacementReadiness();

  /// Gets the user's placement target status from `placement_hub_data.placement_target`.
  Future<PlacementTarget> getPlacementTarget();

  /// Updates the user's placement target.
  Future<void> updatePlacementTarget(PlacementTarget target);

  /// Set the active user ID (for testing, mock mode, or session tracking).
  void setUserId(String? userId);
}
