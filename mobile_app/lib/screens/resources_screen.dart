import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme/app_theme.dart';
import '../api/api_service.dart';

class ResourcesScreen extends StatelessWidget {
  const ResourcesScreen({Key? key}) : super(key: key);

  void _showComingSoon(BuildContext context, String feature) {
    ScaffoldMessenger.maybeOf(context)?.showSnackBar(
      SnackBar(
        content: Text('$feature will be available soon.'),
        backgroundColor: AppTheme.textDark,
      ),
    );
  }

  Future<void> _shareApp(BuildContext context) async {
    const message =
        'Check out the MultiHub Attendance app for our campus.\n\nAsk your admin for the download link.';
    await Clipboard.setData(const ClipboardData(text: message));
    ScaffoldMessenger.maybeOf(context)?.showSnackBar(
      const SnackBar(
        content: Text('Share message copied to clipboard'),
        backgroundColor: AppTheme.primaryBlue,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Resources'),
      ),
      backgroundColor: AppTheme.background,
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _buildSectionHeader('General'),
          _buildTile(
            icon: Icons.share,
            title: 'Share App',
            subtitle: 'Share MultiHub with friends',
            onTap: () => _shareApp(context),
          ),
          _buildTile(
            icon: Icons.local_library,
            title: 'Library',
            subtitle: 'Access library information',
            onTap: () => _showComingSoon(context, 'Library'),
          ),
          const SizedBox(height: 16),
          _buildSectionHeader('Academics'),
          _buildTile(
            icon: Icons.account_tree,
            title: 'Departments',
            subtitle: 'View departments & key contacts',
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const DepartmentsDirectoryScreen()),
              );
            },
          ),
          _buildTile(
            icon: Icons.payments,
            title: 'Fees',
            subtitle: 'Fee details and payment info',
            onTap: () => _showComingSoon(context, 'Fees'),
          ),
          _buildTile(
            icon: Icons.assignment,
            title: 'Assessments',
            subtitle: 'Internal & external assessment details',
            onTap: () => _showComingSoon(context, 'Assessments'),
          ),
          _buildTile(
            icon: Icons.menu_book,
            title: 'Question Bank',
            subtitle: 'Access practice and past questions',
            onTap: () => _showComingSoon(context, 'Question Bank'),
          ),
          const SizedBox(height: 16),
          _buildSectionHeader('Connect'),
          _buildTile(
            icon: Icons.chat,
            title: 'Connect with Teacher',
            subtitle: 'Contact your subject teachers',
            onTap: () => _showComingSoon(context, 'Connect with Teacher'),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.bold,
          color: AppTheme.textDark,
        ),
      ),
    );
  }

  Widget _buildTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Card(
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: AppTheme.primaryBlue.withOpacity(0.06),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: AppTheme.primaryBlue),
        ),
        title: Text(
          title,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: AppTheme.textDark,
          ),
        ),
        subtitle: Text(
          subtitle,
          style: const TextStyle(
            fontSize: 13,
            color: AppTheme.textLight,
          ),
        ),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}

class DepartmentsDirectoryScreen extends StatefulWidget {
  const DepartmentsDirectoryScreen({Key? key}) : super(key: key);

  @override
  State<DepartmentsDirectoryScreen> createState() => _DepartmentsDirectoryScreenState();
}

class _DepartmentsDirectoryScreenState extends State<DepartmentsDirectoryScreen> {
  late Future<List<Map<String, dynamic>>> _future;

  @override
  void initState() {
    super.initState();
    _future = _loadDepartments();
  }

  Future<List<Map<String, dynamic>>> _loadDepartments() async {
    try {
      final response = await ApiService.get('/departments');
      final list = response['departments'] as List<dynamic>? ?? [];
      return list.cast<Map<String, dynamic>>();
    } catch (e) {
      ScaffoldMessenger.maybeOf(context)?.showSnackBar(
        SnackBar(
          content: Text('Failed to load departments: $e'),
          backgroundColor: AppTheme.errorRed,
        ),
      );
      return [];
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Departments'),
      ),
      backgroundColor: AppTheme.background,
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          final departments = snapshot.data ?? [];
          if (departments.isEmpty) {
            return const Center(
              child: Text(
                'No departments available.',
                style: TextStyle(color: AppTheme.textLight),
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: departments.length,
            itemBuilder: (context, index) {
              final dept = departments[index];
              final name = dept['name']?.toString() ?? 'Department';
              final code = dept['code']?.toString();
              final description = dept['description']?.toString();
              return Card(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textDark,
                        ),
                      ),
                      const SizedBox(height: 4),
                      if (code != null && code.isNotEmpty)
                        Text(
                          code,
                          style: const TextStyle(
                            fontSize: 13,
                            color: AppTheme.textLight,
                          ),
                        ),
                      if (description != null && description.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Text(
                          description,
                          style: const TextStyle(
                            fontSize: 13,
                            color: AppTheme.textLight,
                          ),
                        ),
                      ],
                      const SizedBox(height: 12),
                      const Divider(),
                      const SizedBox(height: 8),
                      const Text(
                        'Key Contacts',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.textDark,
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'HOD, Principal and Tutor profiles will appear here once configured by admin.',
                        style: TextStyle(
                          fontSize: 12,
                          color: AppTheme.textLight,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}


