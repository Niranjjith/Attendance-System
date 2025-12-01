import 'user.dart';

class Attendance {
  final String id;
  final String studentId;
  final String subjectId;
  final DateTime date;
  final String status; // present, absent, late
  final String markedBy;
  final String? hour; // Hour when attendance was marked
  final DateTime? markedAt; // Timestamp when attendance was marked
  final Subject? subject;
  final User? markedByUser;

  Attendance({
    required this.id,
    required this.studentId,
    required this.subjectId,
    required this.date,
    required this.status,
    required this.markedBy,
    this.hour,
    this.markedAt,
    this.subject,
    this.markedByUser,
  });

  factory Attendance.fromJson(Map<String, dynamic> json) {
    return Attendance(
      id: json['_id'] ?? '',
      studentId: json['studentId'] is String
          ? json['studentId']
          : json['studentId']?['_id'] ?? '',
      subjectId: json['subjectId'] is String
          ? json['subjectId']
          : json['subjectId']?['_id'] ?? '',
      date: DateTime.parse(json['date']),
      status: json['status'] ?? 'absent',
      markedBy: json['markedBy'] is String
          ? json['markedBy']
          : json['markedBy']?['_id'] ?? '',
      hour: json['hour'],
      markedAt: json['markedAt'] != null ? DateTime.parse(json['markedAt']) : null,
      subject: json['subjectId'] is Map
          ? Subject.fromJson(json['subjectId'])
          : null,
      markedByUser: json['markedBy'] is Map
          ? User.fromJson(json['markedBy'])
          : null,
    );
  }
}

class Subject {
  final String id;
  final String code;
  final String name;

  Subject({
    required this.id,
    required this.code,
    required this.name,
  });

  factory Subject.fromJson(Map<String, dynamic> json) {
    return Subject(
      id: json['_id'] ?? '',
      code: json['code'] ?? '',
      name: json['name'] ?? '',
    );
  }
}

