import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/auth_provider.dart';
import '../providers/attendance_provider.dart';
import '../models/attendance.dart';
import '../theme/app_theme.dart';
import 'profile_screen.dart';
import 'notice_board_screen.dart';
import 'timetable_screen.dart';
import 'login_screen.dart';

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
      backgroundColor: AppTheme.backgroundGreen,
      appBar: AppBar(
        title: const Text('MultiHub'),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const NoticeBoardScreen()),
              );
            },
          ),
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
      drawer: _buildDrawer(context),
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

  Widget _buildDrawer(BuildContext context) {
    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          DrawerHeader(
            decoration: const BoxDecoration(color: AppTheme.primaryGreen),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    color: AppTheme.white,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Image.asset(
                    'assets/nilgiri.png',
                    errorBuilder: (context, error, stackTrace) {
                      return Image.asset(
                        'assets/multimedia.png',
                        errorBuilder: (context, error, stackTrace) {
                          return const Icon(Icons.school, color: AppTheme.primaryGreen, size: 30);
                        },
                      );
                    },
                  ),
                ),
                const SizedBox(height: 12),
                const Text(
                  'MultiHub',
                  style: TextStyle(
                    color: AppTheme.white,
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          ListTile(
            leading: const Icon(Icons.dashboard, color: AppTheme.primaryGreen),
            title: const Text('Dashboard'),
            onTap: () {
              Navigator.pop(context);
              setState(() => _selectedIndex = 0);
            },
          ),
          ListTile(
            leading: const Icon(Icons.calendar_today, color: AppTheme.primaryGreen),
            title: const Text('Timetable'),
            onTap: () {
              Navigator.pop(context);
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const TimetableScreen()),
              );
            },
          ),
          ListTile(
            leading: const Icon(Icons.notifications, color: AppTheme.primaryGreen),
            title: const Text('Notice Board'),
            onTap: () {
              Navigator.pop(context);
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const NoticeBoardScreen()),
              );
            },
          ),
          ListTile(
            leading: const Icon(Icons.person, color: AppTheme.primaryGreen),
            title: const Text('Profile'),
            onTap: () {
              Navigator.pop(context);
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const ProfileScreen()),
              );
            },
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.logout, color: AppTheme.errorRed),
            title: const Text('Logout', style: TextStyle(color: AppTheme.errorRed)),
            onTap: () async {
              final authProvider = Provider.of<AuthProvider>(context, listen: false);
              await authProvider.logout();
              if (mounted) {
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                  (route) => false,
                );
              }
            },
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
        final today = DateFormat('yyyy-MM-dd').format(DateTime.now());

        return SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Welcome Card
              _buildWelcomeCard(),
              const SizedBox(height: 24),
              // Today's Attendance by Hour - 5 Round Icons
              _buildTodaysAttendanceByHour(provider, today),
              const SizedBox(height: 24),
              // Overall Statistics
              _buildOverallStats(stats),
              const SizedBox(height: 24),
              // Quick Actions
              _buildQuickActions(context),
            ],
          ),
        );
      },
    );
  }

  Widget _buildWelcomeCard() {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, _) {
        final user = authProvider.user;
        return Card(
          child: Container(
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [AppTheme.primaryGreen, AppTheme.lightGreen],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Welcome Back!',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.white,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  user?.name ?? 'Student',
                  style: const TextStyle(
                    fontSize: 20,
                    color: AppTheme.white,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Track your attendance and stay updated',
                  style: TextStyle(
                    fontSize: 14,
                    color: AppTheme.white,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildTodaysAttendanceByHour(AttendanceProvider provider, String today) {
    // Get today's attendance from provider
    final todayAttendance = provider.attendance.where((record) {
      final recordDate = DateFormat('yyyy-MM-dd').format(record.date);
      return recordDate == today;
    }).toList();
    
    // Create a map of hour -> attendance record
    final Map<int, Attendance> attendanceByHour = {};
    for (var record in todayAttendance) {
      final hour = record.hour;
      if (hour != null) {
        attendanceByHour[hour] = record;
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          "Today's Attendance by Hour",
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.bold,
            color: AppTheme.textDark,
          ),
        ),
        const SizedBox(height: 16),
        SizedBox(
          height: 120,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: 5, // 5 hours
            itemBuilder: (context, index) {
              final hour = index + 1;
              final record = attendanceByHour[hour];
              final status = record?.status;
                  
                  Color statusColor = Colors.grey.shade300;
                  IconData statusIcon = Icons.help_outline;
                  String statusText = 'Not Marked';

                  if (status == 'present') {
                    statusColor = AppTheme.successGreen;
                    statusIcon = Icons.check_circle;
                    statusText = 'Present';
                  } else if (status == 'absent') {
                    statusColor = AppTheme.errorRed;
                    statusIcon = Icons.cancel;
                    statusText = 'Absent';
                  } else if (status == 'late') {
                    statusColor = AppTheme.warningOrange;
                    statusIcon = Icons.schedule;
                    statusText = 'Late';
                  }

                  return Container(
                    width: 100,
                    margin: const EdgeInsets.only(right: 12),
                    child: Column(
                      children: [
                        Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            color: statusColor.withOpacity(0.1),
                            shape: BoxShape.circle,
                            border: Border.all(color: statusColor, width: 3),
                          ),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                'H$hour',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: statusColor,
                                ),
                              ),
                              Icon(
                                statusIcon,
                                color: statusColor,
                                size: 24,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          statusText,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w500,
                            color: statusColor,
                          ),
                          textAlign: TextAlign.center,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  );
            },
          ),
        ),
      ],
    );
  }


  Widget _buildOverallStats(Map<String, dynamic>? stats) {
    if (stats == null) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            children: [
              const Icon(Icons.bar_chart, size: 48, color: AppTheme.textLight),
              const SizedBox(height: 16),
              const Text(
                'No statistics available',
                style: TextStyle(color: AppTheme.textLight),
              ),
            ],
          ),
        ),
      );
    }

    final overall = stats['overall'] as Map<String, dynamic>?;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Overall Statistics',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: AppTheme.textDark,
              ),
            ),
            const SizedBox(height: 20),
            if (overall != null) ...[
              _buildStatRow('Total Classes', overall['total']?.toString() ?? '0', Icons.class_),
              const Divider(height: 24),
              _buildStatRow('Present', overall['present']?.toString() ?? '0', Icons.check_circle, AppTheme.successGreen),
              _buildStatRow('Late', overall['late']?.toString() ?? '0', Icons.schedule, AppTheme.warningOrange),
              _buildStatRow('Absent', overall['absent']?.toString() ?? '0', Icons.cancel, AppTheme.errorRed),
              const Divider(height: 24),
              _buildStatRow(
                'Attendance %',
                '${overall['percentage'] ?? '0'}%',
                Icons.trending_up,
                AppTheme.primaryGreen,
                true,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStatRow(String label, String value, IconData icon, [Color? color, bool? isBold]) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12.0),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: (color ?? AppTheme.primaryGreen).withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color ?? AppTheme.primaryGreen, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 16,
                color: AppTheme.textLight,
              ),
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 18,
              fontWeight: (isBold == true) ? FontWeight.bold : FontWeight.w600,
              color: color ?? AppTheme.textDark,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Quick Actions',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.bold,
            color: AppTheme.textDark,
          ),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _buildActionCard(
                icon: Icons.calendar_today,
                title: 'Timetable',
                color: AppTheme.primaryGreen,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const TimetableScreen()),
                  );
                },
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildActionCard(
                icon: Icons.notifications,
                title: 'Notices',
                color: AppTheme.lightGreen,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const NoticeBoardScreen()),
                  );
                },
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildActionCard({
    required IconData icon,
    required String title,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(20.0),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            gradient: LinearGradient(
              colors: [color.withOpacity(0.1), color.withOpacity(0.05)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, size: 32, color: color),
              ),
              const SizedBox(height: 12),
              Text(
                title,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textDark,
                ),
              ),
            ],
          ),
        ),
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
                Icon(Icons.inbox, size: 64, color: Colors.grey.shade400),
                const SizedBox(height: 16),
                Text(
                  'No attendance records',
                  style: TextStyle(color: Colors.grey.shade600, fontSize: 16),
                ),
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
            padding: const EdgeInsets.all(16),
            itemCount: attendance.length,
            itemBuilder: (context, index) {
              final record = attendance[index];
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: ListTile(
                  leading: _getStatusIcon(record.status),
                  title: Text(
                    record.subject?.name ?? 'Unknown Subject',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 4),
                      Text(
                        DateFormat('MMM dd, yyyy').format(record.date),
                        style: TextStyle(color: Colors.grey.shade600),
                      ),
                      if (record.hour != null)
                        Text(
                          'Hour: ${record.hour}',
                          style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                        ),
                      if (record.markedByUser != null)
                        Text(
                          'Teacher: ${record.markedByUser!.name}',
                          style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                        ),
                      if (record.markedAt != null)
                        Text(
                          'Marked at: ${DateFormat('MMM dd, yyyy HH:mm').format(record.markedAt!)}',
                          style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                        ),
                    ],
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
        color = AppTheme.successGreen;
        break;
      case 'late':
        icon = Icons.schedule;
        color = AppTheme.warningOrange;
        break;
      default:
        icon = Icons.cancel;
        color = AppTheme.errorRed;
    }
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        shape: BoxShape.circle,
      ),
      child: Icon(icon, color: color, size: 24),
    );
  }

  Widget _getStatusChip(String status) {
    Color color;
    switch (status) {
      case 'present':
        color = AppTheme.successGreen;
        break;
      case 'late':
        color = AppTheme.warningOrange;
        break;
      default:
        color = AppTheme.errorRed;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        status.toUpperCase(),
        style: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: AppTheme.white,
        ),
      ),
    );
  }
}
