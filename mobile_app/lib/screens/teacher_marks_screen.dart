import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../theme/app_theme.dart';
import '../api/api_service.dart';

class TeacherMarksScreen extends StatefulWidget {
  const TeacherMarksScreen({Key? key}) : super(key: key);

  @override
  State<TeacherMarksScreen> createState() => _TeacherMarksScreenState();
}

class _TeacherMarksScreenState extends State<TeacherMarksScreen> {
  String? _selectedSubject;
  String? _selectedExamType;
  List<Map<String, dynamic>> _subjects = [];
  List<Map<String, dynamic>> _students = [];
  Map<String, String> _marks = {}; // studentId -> marks
  bool _isLoading = false;
  bool _isSubmitting = false;

  final List<String> _examTypes = ['Quiz', 'Midterm', 'Final', 'Assignment', 'Project'];

  @override
  void initState() {
    super.initState();
    _loadSubjects();
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
    if (_selectedSubject == null) return;

    setState(() => _isLoading = true);
    try {
      final response = await ApiService.get('/teacher/subjects/$_selectedSubject/students');
      setState(() {
        _students = List<Map<String, dynamic>>.from(response['students'] ?? []);
        // Load existing marks if any
        _marks = {};
        for (var student in _students) {
          final studentId = student['_id'] ?? student['id'];
          if (student['marks'] != null && student['marks'][_selectedExamType] != null) {
            _marks[studentId] = student['marks'][_selectedExamType].toString();
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

  Future<void> _submitMarks() async {
    if (_selectedSubject == null || _selectedExamType == null || _students.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select subject, exam type and enter marks')),
      );
      return;
    }

    setState(() => _isSubmitting = true);
    try {
      final marksData = _marks.entries.map((e) => {
        'studentId': e.key,
        'marks': double.tryParse(e.value) ?? 0.0,
      }).toList();

      await ApiService.post('/teacher/marks', {
        'subjectId': _selectedSubject,
        'examType': _selectedExamType,
        'marks': marksData,
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Marks submitted successfully!')),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to submit marks: $e')),
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
      appBar: AppBar(
        title: const Text('Manage Marks'),
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
                fillColor: AppTheme.white,
              ),
              items: _subjects.map<DropdownMenuItem<String>>((subject) {
                return DropdownMenuItem<String>(
                  value: subject['id'] as String,
                  child: Text('${subject['code']} - ${subject['name']}'),
                );
              }).toList(),
              onChanged: (value) {
                setState(() {
                  _selectedSubject = value;
                  _students = [];
                  _marks = {};
                });
                _loadStudents();
              },
            ),
            const SizedBox(height: 24),
            // Exam Type Selection
            const Text(
              'Select Exam Type',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _selectedExamType,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                filled: true,
                fillColor: AppTheme.white,
              ),
              items: _examTypes.map<DropdownMenuItem<String>>((type) {
                return DropdownMenuItem<String>(
                  value: type,
                  child: Text(type),
                );
              }).toList(),
              onChanged: (value) {
                setState(() => _selectedExamType = value);
              },
            ),
            const SizedBox(height: 24),
            // Students List
            if (_isLoading)
              const Center(child: CircularProgressIndicator())
            else if (_students.isEmpty && _selectedSubject != null)
              const Center(
                child: Text('No students found for this subject'),
              )
            else if (_students.isNotEmpty) ...[
              const Text(
                'Enter Marks',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              ..._students.map((student) {
                final studentId = student['id'] as String;
                final currentMarks = _marks[studentId] ?? '';
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
                                style: TextStyle(color: Colors.grey.shade600),
                              ),
                            ],
                          ),
                        ),
                        SizedBox(
                          width: 100,
                          child: TextField(
                            keyboardType: TextInputType.number,
                            decoration: const InputDecoration(
                              labelText: 'Marks',
                              border: OutlineInputBorder(),
                              filled: true,
                              fillColor: AppTheme.white,
                            ),
                            onChanged: (value) {
                              setState(() => _marks[studentId] = value);
                            },
                          ),
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
                  onPressed: _isSubmitting ? null : _submitMarks,
                  child: _isSubmitting
                      ? const CircularProgressIndicator(color: AppTheme.white)
                      : const Text(
                          'Save Marks',
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
}

