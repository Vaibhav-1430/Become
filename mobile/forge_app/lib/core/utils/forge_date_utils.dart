import 'package:intl/intl.dart';

/// Date utility matching FORGE Web's `DateUtils` semantics.
/// Enforces `YYYY-MM-DD` local date strings to prevent off-by-one UTC shifts.
abstract final class ForgeDateUtils {
  /// Format a DateTime into standard `YYYY-MM-DD`.
  static String toDateString(DateTime date) {
    final y = date.year.toString().padLeft(4, '0');
    final m = date.month.toString().padLeft(2, '0');
    final d = date.day.toString().padLeft(2, '0');
    return '$y-$m-$d';
  }

  /// Returns today's date in `YYYY-MM-DD` format.
  static String todayDateString() {
    return toDateString(DateTime.now());
  }

  /// Parses a `YYYY-MM-DD` string into a local DateTime.
  /// Does NOT use UTC to avoid timezone shift.
  static DateTime parseDate(String dateStr) {
    final parts = dateStr.split('-');
    if (parts.length != 3) {
      return DateTime.now();
    }
    final y = int.tryParse(parts[0]) ?? DateTime.now().year;
    final m = int.tryParse(parts[1]) ?? DateTime.now().month;
    final d = int.tryParse(parts[2]) ?? DateTime.now().day;
    return DateTime(y, m, d);
  }

  /// Returns true if [dateStr] represents today.
  static bool isToday(String dateStr) {
    return dateStr == todayDateString();
  }

  /// Formats a `YYYY-MM-DD` into `Thursday, Oct 24, 2024`.
  static String formatLongDate(String dateStr) {
    final d = parseDate(dateStr);
    return DateFormat('EEEE, MMM d, yyyy').format(d);
  }

  /// Formats a `YYYY-MM-DD` into `Thursday, Oct 24`.
  static String formatHeaderDate(String dateStr) {
    final d = parseDate(dateStr);
    return DateFormat('EEEE, MMM d').format(d);
  }

  /// Formats a DateTime directly into `Thursday, Oct 24`.
  static String formatDisplayDate(DateTime date) {
    return DateFormat('EEEE, MMM d').format(date);
  }

  /// Formats a DateTime into `October 2024`.
  static String formatMonthYear(DateTime month) {
    return DateFormat('MMMM yyyy').format(month);
  }

  /// Formats a DateTime into short month name: `Oct`.
  static String formatShortMonth(DateTime month) {
    return DateFormat('MMM').format(month);
  }

  /// Returns next day's `YYYY-MM-DD`.
  static String nextDate(String dateStr) {
    final d = parseDate(dateStr);
    return toDateString(d.add(const Duration(days: 1)));
  }

  /// Returns previous day's `YYYY-MM-DD`.
  static String prevDate(String dateStr) {
    final d = parseDate(dateStr);
    return toDateString(d.subtract(const Duration(days: 1)));
  }

  /// Returns total days in given year and month.
  static int daysInMonth(int year, int month) {
    return DateTime(year, month + 1, 0).day;
  }

  /// Returns the weekday offset for 1st of the month (Monday = 0, Sunday = 6).
  static int firstWeekdayOfMonth(int year, int month) {
    final d = DateTime(year, month, 1);
    // DateTime.weekday is 1 for Mon, 7 for Sun. We want 0-based (Mon=0, Sun=6).
    return d.weekday - 1;
  }
}
