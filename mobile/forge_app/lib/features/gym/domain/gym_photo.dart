import 'dart:typed_data';

class GymPhoto {
  final String id;
  final String storagePath;
  final String? signedUrl;
  final Uint8List? localBytes;
  final DateTime createdAt;

  const GymPhoto({
    required this.id,
    required this.storagePath,
    this.signedUrl,
    this.localBytes,
    required this.createdAt,
  });

  GymPhoto copyWith({
    String? id,
    String? storagePath,
    String? signedUrl,
    Uint8List? localBytes,
    DateTime? createdAt,
  }) {
    return GymPhoto(
      id: id ?? this.id,
      storagePath: storagePath ?? this.storagePath,
      signedUrl: signedUrl ?? this.signedUrl,
      localBytes: localBytes ?? this.localBytes,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
