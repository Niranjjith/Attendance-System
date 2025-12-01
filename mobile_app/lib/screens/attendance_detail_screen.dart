import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/attendance_provider.dart';

class AttendanceDetailScreen extends StatefulWidget {
  final String? subjectId;

  const AttendanceDetailScreen({Key? key, this.subjectId}) : super(key: key);

  @override
  State<AttendanceDetailScreen> createState() => _AttendanceDetailScreenState();
}

class _AttendanceDetailScreenState extends State<AttendanceDetailScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<AttendanceProvider>(context, listen: false).loadAttendance(
        subjectId: widget.subjectId,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Attendance Details'),
      ),
      body: Consumer<AttendanceProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          final attendance = provider.attendance;
          if (attendance.isEmpty) {
            return const Center(child: Text('No attendance records'));
          }

          return ListView.builder(
            itemCount: attendance.length,
            itemBuilder: (context, index) {
              final record = attendance[index];
              return Card(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: ListTile(
                  leading: _getStatusIcon(record.status),
                  title: Text(
                    DateFormat('MMM dd, yyyy').format(record.date),
                  ),
                  subtitle: Text(record.subject?.name ?? 'Unknown Subject'),
                  trailing: _getStatusChip(record.status),
                ),
              );
            },
          );
        },
      ),
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

