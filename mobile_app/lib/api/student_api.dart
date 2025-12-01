import 'api_service.dart';

class StudentApi {
  static Future<Map<String, dynamic>> getMyAttendance({
    String? subjectId,
    String? startDate,
    String? endDate,
    int page = 1,
    int limit = 50,
  }) async {
    final queryParams = <String, String>{};
    if (subjectId != null) queryParams['subjectId'] = subjectId;
    if (startDate != null) queryParams['startDate'] = startDate;
    if (endDate != null) queryParams['endDate'] = endDate;
    queryParams['page'] = page.toString();
    queryParams['limit'] = limit.toString();

    return await ApiService.get('/student/attendance', queryParams: queryParams);
  }

  static Future<Map<String, dynamic>> getAttendanceStats() async {
    return await ApiService.get('/student/attendance/stats');
  }

  static Future<Map<String, dynamic>> getDailyRecord(String date) async {
    return await ApiService.get('/student/attendance/daily', queryParams: {'date': date});
  }
}

