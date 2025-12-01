import 'package:flutter/material.dart';
import '../api/api_service.dart';
import '../theme/app_theme.dart';

class TeacherSubjectsScreen extends StatefulWidget {
  const TeacherSubjectsScreen({Key? key}) : super(key: key);

  @override
  State<TeacherSubjectsScreen> createState() => _TeacherSubjectsScreenState();
}

class _TeacherSubjectsScreenState extends State<TeacherSubjectsScreen> {
  List<Map<String, dynamic>> _subjects = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadSubjects();
  }

  Future<void> _loadSubjects() async {
    setState(() => _isLoading = true);
    try {
      // TODO: Replace with actual API call
      // final response = await ApiService.get('/teacher/subjects');
      // setState(() {
      //   _subjects = List<Map<String, dynamic>>.from(response['subjects'] ?? []);
      // });

      // Mock data for now
      await Future.delayed(const Duration(seconds: 1));
      setState(() {
        _subjects = [
          {
            'id': '1',
            'code': 'MATH101',
            'name': 'Mathematics',
            'batch': '2024',
            'semester': 1,
          },
          {
            'id': '2',
            'code': 'SCI101',
            'name': 'Science',
            'batch': '2024',
            'semester': 1,
          },
        ];
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

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_subjects.isEmpty) {
      return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.subject, size: 64, color: Colors.grey.shade400),
                  const SizedBox(height: 16),
                  Text(
                    'No subjects assigned',
                    style: TextStyle(fontSize: 18, color: Colors.grey.shade600),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _loadSubjects,
                    child: const Text('Refresh'),
                  ),
                ],
              ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadSubjects,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _subjects.length,
        itemBuilder: (context, index) {
          final subject = _subjects[index];
          return Card(
            margin: const EdgeInsets.only(bottom: 12),
            child: ListTile(
              leading: Container(
                width: 50,
                height: 50,
                  decoration: BoxDecoration(
                    color: AppTheme.primaryGreen.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(Icons.book, color: AppTheme.primaryGreen),
              ),
              title: Text(
                subject['name'] ?? '',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textDark,
                ),
              ),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 4),
                  Text('Code: ${subject['code'] ?? ''}'),
                  if (subject['batch'] != null)
                    Text('Batch: ${subject['batch']}'),
                  if (subject['semester'] != null)
                    Text('Semester: ${subject['semester']}'),
                ],
              ),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                // TODO: Navigate to subject details
              },
            ),
          );
        },
      ),
    );
  }
}

