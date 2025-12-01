import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../api/api_service.dart';
import '../theme/app_theme.dart';

class TeacherMarkAttendanceScreen extends StatefulWidget {
  const TeacherMarkAttendanceScreen({Key? key}) : super(key: key);

  @override
  State<TeacherMarkAttendanceScreen> createState() => _TeacherMarkAttendanceScreenState();
}

class _TeacherMarkAttendanceScreenState extends State<TeacherMarkAttendanceScreen> {
  String? _selectedSubject;
  String? _selectedHour;
  String? _selectedDepartment;
  String? _selectedSemester;
  DateTime _selectedDate = DateTime.now();
  List<Map<String, dynamic>> _subjects = [];
  List<Map<String, dynamic>> _departments = [];
  List<Map<String, dynamic>> _students = [];
  Map<String, String> _attendanceStatus = {}; // studentId -> status
  bool _isLoading = false;
  bool _isSubmitting = false;

  final List<String> _hours = ['1', '2', '3', '4', '5', '6', '7', '8'];
  final List<int> _semesters = [1, 2, 3, 4, 5, 6];

  @override
  void initState() {
    super.initState();
    _loadSubjects();
    _loadDepartments();
  }

  Future<void> _loadDepartments() async {
    try {
      final response = await ApiService.get('/departments');
      setState(() {
        _departments = List<Map<String, dynamic>>.from(response['departments'] ?? []);
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading departments: $e')),
        );
      }
    }
  }

  Future<void> _loadSubjects() async {
    setState(() => _isLoading = true);
    try {
      final response = await ApiService.get('/teacher/subjects');
      setState(() {
        _subjects = List<Map<String, dynamic>>.from(response['subjects'] ?? []);
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading subjects: $e')),
        );
      }
    }
  }

  Future<void> _loadStudents() async {
    if (_selectedSubject == null || _selectedHour == null) return;

    setState(() => _isLoading = true);
    try {
      final queryParams = <String, String>{
        'date': DateFormat('yyyy-MM-dd').format(_selectedDate),
        'hour': _selectedHour!,
      };
      
      if (_selectedDepartment != null) {
        queryParams['department'] = _selectedDepartment!;
      }
      
      if (_selectedSemester != null) {
        queryParams['semester'] = _selectedSemester!;
      }

      final response = await ApiService.get(
        '/teacher/subjects/$_selectedSubject/students',
        queryParams: queryParams,
      );
      
      setState(() {
        _students = List<Map<String, dynamic>>.from(response['students'] ?? []);
        // Initialize attendance status - check if already marked
        _attendanceStatus = {};
        for (var student in _students) {
          final studentId = student['_id'] ?? student['id'];
          // Check if student has attendance marked for this date/hour
          if (student['attendanceStatus'] != null) {
            _attendanceStatus[studentId] = student['attendanceStatus'];
          } else {
            _attendanceStatus[studentId] = 'present'; // Default to present
          }
        }
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading students: $e')),
        );
      }
    }
  }

  Future<void> _submitAttendance() async {
    if (_selectedSubject == null || _selectedHour == null || _students.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select subject, hour and mark attendance')),
      );
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      final attendanceData = _attendanceStatus.entries.map((e) => {
        'studentId': e.key,
        'status': e.value,
      }).toList();

      await ApiService.post('/teacher/attendance/mark', {
        'subjectId': _selectedSubject,
        'date': DateFormat('yyyy-MM-dd').format(_selectedDate),
        'hour': int.parse(_selectedHour!),
        'attendance': attendanceData,
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Attendance marked successfully!'),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundGreen,
      appBar: AppBar(
        title: const Text('Mark Attendance'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Subject Selection
            const Text(
              'Select Subject',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _selectedSubject,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                filled: true,
                fillColor: Color(0xFFF5F5F5),
              ),
              items: _subjects.map<DropdownMenuItem<String>>((subject) {
                return DropdownMenuItem<String>(
                  value: subject['_id'] ?? subject['id'] ?? '',
                  child: Text('${subject['code']} - ${subject['name']}'),
                );
              }).toList(),
              onChanged: (value) {
                setState(() {
                  _selectedSubject = value;
                  _students = [];
                  _attendanceStatus = {};
                });
                if (_selectedHour != null) {
                  _loadStudents();
                }
              },
            ),
            const SizedBox(height: 24),
            // Hour Selection
            const Text(
              'Select Hour',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _selectedHour,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                filled: true,
                fillColor: AppTheme.white,
              ),
              items: _hours.map<DropdownMenuItem<String>>((hour) {
                return DropdownMenuItem<String>(
                  value: hour,
                  child: Text('Hour $hour'),
                );
              }).toList(),
              onChanged: (value) {
                setState(() {
                  _selectedHour = value;
                  _students = [];
                  _attendanceStatus = {};
                });
                if (_selectedSubject != null) {
                  _loadStudents();
                }
              },
            ),
            const SizedBox(height: 24),
            // Date Selection
            const Text(
              'Date',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            InkWell(
              onTap: () async {
                final date = await showDatePicker(
                  context: context,
                  initialDate: _selectedDate,
                  firstDate: DateTime.now().subtract(const Duration(days: 30)),
                  lastDate: DateTime.now(),
                );
                if (date != null) {
                  setState(() => _selectedDate = date);
                }
              },
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppTheme.white,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.grey.shade300),
                  ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(DateFormat('MMM dd, yyyy').format(_selectedDate)),
                    const Icon(Icons.calendar_today),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
            // Department Filter
            const Text(
              'Filter by Department (Optional)',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _selectedDepartment,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                filled: true,
                fillColor: AppTheme.white,
                hintText: 'All Departments',
              ),
              items: [
                const DropdownMenuItem<String>(
                  value: null,
                  child: Text('All Departments'),
                ),
                ..._departments.map<DropdownMenuItem<String>>((dept) {
                  return DropdownMenuItem<String>(
                    value: dept['_id'] ?? dept['id'] ?? '',
                    child: Text('${dept['code'] ?? ''} - ${dept['name'] ?? ''}'),
                  );
                }).toList(),
              ],
              onChanged: (value) {
                setState(() {
                  _selectedDepartment = value;
                  _students = [];
                  _attendanceStatus = {};
                });
                if (_selectedSubject != null && _selectedHour != null) {
                  _loadStudents();
                }
              },
            ),
            const SizedBox(height: 24),
            // Semester Filter
            const Text(
              'Filter by Semester (Optional)',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<int>(
              value: _selectedSemester != null ? int.tryParse(_selectedSemester!) : null,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                filled: true,
                fillColor: AppTheme.white,
                hintText: 'All Semesters',
              ),
              items: [
                const DropdownMenuItem<int>(
                  value: null,
                  child: Text('All Semesters'),
                ),
                ..._semesters.map<DropdownMenuItem<int>>((sem) {
                  return DropdownMenuItem<int>(
                    value: sem,
                    child: Text('Semester $sem'),
                  );
                }).toList(),
              ],
              onChanged: (value) {
                setState(() {
                  _selectedSemester = value?.toString();
                  _students = [];
                  _attendanceStatus = {};
                });
                if (_selectedSubject != null && _selectedHour != null) {
                  _loadStudents();
                }
              },
            ),
            const SizedBox(height: 24),
            // Students List
            if (_isLoading)
              const Center(child: CircularProgressIndicator())
            else if (_students.isEmpty && _selectedSubject != null && _selectedHour != null)
              const Center(
                child: Text('No students found for this subject'),
              )
            else if (_students.isNotEmpty) ...[
              const Text(
                'Mark Attendance',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              ..._students.map((student) {
                final studentId = student['_id'] ?? student['id'] ?? '';
                final currentStatus = _attendanceStatus[studentId] ?? 'present';
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                student['name'] ?? '',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                ),
                              ),
                              Text(
                                student['userId'] ?? '',
                                style: TextStyle(color: Colors.grey[600]),
                              ),
                            ],
                          ),
                        ),
                        Row(
                          children: [
                            _buildStatusButton(
                              'Present',
                              'present',
                              currentStatus,
                              Colors.green,
                              () {
                                setState(() => _attendanceStatus[studentId] = 'present');
                              },
                            ),
                            const SizedBox(width: 8),
                            _buildStatusButton(
                              'Late',
                              'late',
                              currentStatus,
                              Colors.orange,
                              () {
                                setState(() => _attendanceStatus[studentId] = 'late');
                              },
                            ),
                            const SizedBox(width: 8),
                            _buildStatusButton(
                              'Absent',
                              'absent',
                              currentStatus,
                              Colors.red,
                              () {
                                setState(() => _attendanceStatus[studentId] = 'absent');
                              },
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              }),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : _submitAttendance,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryGreen,
                    foregroundColor: AppTheme.white,
                  ),
                  child: _isSubmitting
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text(
                          'Submit Attendance',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStatusButton(
    String label,
    String value,
    String currentValue,
    Color color,
    VoidCallback onTap,
  ) {
    final isSelected = currentValue == value;
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? color : Colors.transparent,
          border: Border.all(color: color, width: 2),
          borderRadius: BorderRadius.circular(6),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : color,
            fontWeight: FontWeight.w600,
            fontSize: 12,
          ),
        ),
      ),
    );
  }
}

