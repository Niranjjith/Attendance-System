import 'package:flutter/foundation.dart';
import '../models/attendance.dart';
import '../api/student_api.dart';

class AttendanceProvider with ChangeNotifier {
  List<Attendance> _attendance = [];
  Map<String, dynamic>? _stats;
  bool _isLoading = false;

  List<Attendance> get attendance => _attendance;
  Map<String, dynamic>? get stats => _stats;
  bool get isLoading => _isLoading;

  Future<void> loadAttendance({
    String? subjectId,
    String? startDate,
    String? endDate,
  }) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await StudentApi.getMyAttendance(
        subjectId: subjectId,
        startDate: startDate,
        endDate: endDate,
      );
      _attendance = (response['attendance'] as List)
          .map((item) => Attendance.fromJson(item))
          .toList();
    } catch (e) {
      print('Error loading attendance: $e');
      // Return empty list on error instead of keeping old data
      _attendance = [];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadStats() async {
    try {
      final response = await StudentApi.getAttendanceStats();
      _stats = response;
      notifyListeners();
    } catch (e) {
      print('Error loading stats: $e');
    }
  }
}

