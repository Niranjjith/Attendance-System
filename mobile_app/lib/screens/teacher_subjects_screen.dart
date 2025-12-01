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
                  Text(
                    'Code: ${subject['code'] ?? ''}',
                    style: const TextStyle(fontWeight: FontWeight.w500),
                  ),
                  if (subject['department'] != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      'Department: ${subject['department'] is Map ? subject['department']['name'] ?? '' : subject['department'] ?? ''}',
                      style: TextStyle(
                        color: AppTheme.primaryGreen,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                  if (subject['semester'] != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      'Semester: ${subject['semester']}',
                      style: TextStyle(
                        color: AppTheme.accentGreen,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                  if (subject['batch'] != null) ...[
                    const SizedBox(height: 2),
                    Text('Batch: ${subject['batch']}'),
                  ],
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

