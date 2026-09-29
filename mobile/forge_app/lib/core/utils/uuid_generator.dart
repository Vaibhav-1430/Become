import 'dart:math';

/// RFC 4122 Version 4 UUID Generator.
/// Produces canonical 36-character hexadecimal strings:
/// `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`
/// Compatible with PostgreSQL `UUID` column types.
class UuidGenerator {
  static final Random _secureRandom = Random.secure();

  /// Generates a cryptographically random RFC 4122 version 4 UUID.
  static String v4() {
    final bytes = List<int>.generate(16, (_) => _secureRandom.nextInt(256));

    // Version 4 bits (bits 12-15 of time_hi_and_version set to 0100)
    bytes[6] = (bytes[6] & 0x0f) | 0x40;

    // Variant RFC 4122 bits (bits 6-7 of clock_seq_hi_and_reserved set to 10)
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    final buffer = StringBuffer();
    for (int i = 0; i < 16; i++) {
      if (i == 4 || i == 6 || i == 8 || i == 10) {
        buffer.write('-');
      }
      buffer.write(bytes[i].toRadixString(16).padLeft(2, '0'));
    }
    return buffer.toString();
  }

  /// Validates whether a given string is a valid UUID.
  static bool isValid(String? value) {
    if (value == null || value.length != 36) return false;
    final regex = RegExp(
      r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$',
    );
    return regex.hasMatch(value);
  }
}
