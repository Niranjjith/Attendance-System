import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/auth_provider.dart';
import '../providers/attendance_provider.dart';
import 'attendance_detail_screen.dart';
import 'profile_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<AttendanceProvider>(context, listen: false).loadStats();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Attendance System'),
        actions: [
          IconButton(
            icon: const Icon(Icons.person),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const ProfileScreen()),
              );
            },
          ),
        ],
      ),
      body: IndexedStack(
        index: _selectedIndex,
        children: [
          _buildDashboard(),
          _buildAttendanceList(),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (index) => setState(() => _selectedIndex = index),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.list),
            label: 'Attendance',
          ),
        ],
      ),
    );
  }

  Widget _buildDashboard() {
    return Consumer<AttendanceProvider>(
      builder: (context, provider, _) {
        if (provider.isLoading) {
          return const Center(child: CircularProgressIndicator());
        }

        final stats = provider.stats;
        if (stats == null) {
          return const Center(child: Text('No data available'));
        }

        final overall = stats['overall'] as Map<String, dynamic>?;
        final bySubject = stats['bySubject'] as List?;

        return SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Overall Attendance',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 16),
                      if (overall != null) ...[
                        _buildStatRow('Total Classes', overall['total']?.toString() ?? '0'),
                        _buildStatRow('Present', overall['present']?.toString() ?? '0'),
                        _buildStatRow('Late', overall['late']?.toString() ?? '0'),
                        _buildStatRow('Absent', overall['absent']?.toString() ?? '0'),
                        const Divider(),
                        _buildStatRow(
                          'Percentage',
                          '${overall['percentage'] ?? '0'}%',
                          isHighlight: true,
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'By Subject',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              if (bySubject != null && bySubject.isNotEmpty)
                ...bySubject.map((subject) => Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        title: Text(subject['subjectName'] ?? ''),
                        subtitle: Text('Code: ${subject['subjectCode'] ?? ''}'),
                        trailing: Text(
                          '${subject['percentage']?.toStringAsFixed(1) ?? '0'}%',
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => AttendanceDetailScreen(
                                subjectId: subject['subjectId'],
                              ),
                            ),
                          );
                        },
                      ),
                    ))
              else
                const Card(
                  child: Padding(
                    padding: EdgeInsets.all(16.0),
                    child: Text('No subject data available'),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildStatRow(String label, String value, {bool isHighlight = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label),
          Text(
            value,
            style: TextStyle(
              fontWeight: isHighlight ? FontWeight.bold : FontWeight.normal,
              fontSize: isHighlight ? 20 : 16,
              color: isHighlight ? Colors.green : null,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAttendanceList() {
    return Consumer<AttendanceProvider>(
      builder: (context, provider, _) {
        if (provider.isLoading) {
          return const Center(child: CircularProgressIndicator());
        }

        final attendance = provider.attendance;
        if (attendance.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.inbox, size: 64, color: Colors.grey),
                const SizedBox(height: 16),
                const Text('No attendance records'),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () {
                    provider.loadAttendance();
                  },
                  child: const Text('Load Attendance'),
                ),
              ],
            ),
          );
        }

        return RefreshIndicator(
          onRefresh: () => provider.loadAttendance(),
          child: ListView.builder(
            itemCount: attendance.length,
            itemBuilder: (context, index) {
              final record = attendance[index];
              return Card(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: ListTile(
                  leading: _getStatusIcon(record.status),
                  title: Text(record.subject?.name ?? 'Unknown Subject'),
                  subtitle: Text(
                    DateFormat('MMM dd, yyyy').format(record.date),
                  ),
                  trailing: _getStatusChip(record.status),
                ),
              );
            },
          ),
        );
      },
    );
  }

  Widget _getStatusIcon(String status) {
    IconData icon;
    Color color;
    switch (status) {
      case 'present':
        icon = Icons.check_circle;
        color = Colors.green;
        break;
      case 'late':
        icon = Icons.schedule;
        color = Colors.orange;
        break;
      default:
        icon = Icons.cancel;
        color = Colors.red;
    }
    return Icon(icon, color: color);
  }

  Widget _getStatusChip(String status) {
    Color color;
    switch (status) {
      case 'present':
        color = Colors.green;
        break;
      case 'late':
        color = Colors.orange;
        break;
      default:
        color = Colors.red;
    }
    return Chip(
      label: Text(
        status.toUpperCase(),
        style: const TextStyle(fontSize: 12, color: Colors.white),
      ),
      backgroundColor: color,
    );
  }
}

