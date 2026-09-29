class DsaProblem {
  final String id;
  final String title;
  final String difficulty; // 'Easy', 'Medium', 'Hard'
  final int sectionIndex;
  final String topicName;
  final String? leetcodeUrl;
  final String? articleUrl;
  final String? youtubeUrl;
  final bool isSolved;

  const DsaProblem({
    required this.id,
    required this.title,
    required this.difficulty,
    required this.sectionIndex,
    required this.topicName,
    this.leetcodeUrl,
    this.articleUrl,
    this.youtubeUrl,
    this.isSolved = false,
  });

  DsaProblem copyWith({
    String? id,
    String? title,
    String? difficulty,
    int? sectionIndex,
    String? topicName,
    String? leetcodeUrl,
    String? articleUrl,
    String? youtubeUrl,
    bool? isSolved,
  }) {
    return DsaProblem(
      id: id ?? this.id,
      title: title ?? this.title,
      difficulty: difficulty ?? this.difficulty,
      sectionIndex: sectionIndex ?? this.sectionIndex,
      topicName: topicName ?? this.topicName,
      leetcodeUrl: leetcodeUrl ?? this.leetcodeUrl,
      articleUrl: articleUrl ?? this.articleUrl,
      youtubeUrl: youtubeUrl ?? this.youtubeUrl,
      isSolved: isSolved ?? this.isSolved,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is DsaProblem &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          isSolved == other.isSolved;

  @override
  int get hashCode => id.hashCode ^ isSolved.hashCode;
}
