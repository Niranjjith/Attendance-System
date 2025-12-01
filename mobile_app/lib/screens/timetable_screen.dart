import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class TimetableScreen extends StatefulWidget {
  const TimetableScreen({Key? key}) : super(key: key);

  @override
  State<TimetableScreen> createState() => _TimetableScreenState();
}

class _TimetableScreenState extends State<TimetableScreen> {
  final List<String> days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  final List<String> timeSlots = ['9:00', '10:00', '11:00', '12:00', '1:00', '2:00'];

  // Mock timetable data
  final Map<String, Map<String, String>> timetable = {
    'Mon': {
      '9:00': 'Math',
      '10:00': 'Science',
      '11:00': 'English',
      '12:00': 'Break',
      '1:00': 'History',
      '2:00': 'Physics',
    },
    'Tue': {
      '9:00': 'Physics',
      '10:00': 'Math',
      '11:00': 'Science',
      '12:00': 'Break',
      '1:00': 'English',
      '2:00': 'History',
    },
    'Wed': {
      '9:00': 'English',
      '10:00': 'History',
      '11:00': 'Math',
      '12:00': 'Break',
      '1:00': 'Science',
      '2:00': 'Physics',
    },
    'Thu': {
      '9:00': 'Science',
      '10:00': 'Physics',
      '11:00': 'History',
      '12:00': 'Break',
      '1:00': 'Math',
      '2:00': 'English',
    },
    'Fri': {
      '9:00': 'History',
      '10:00': 'English',
      '11:00': 'Physics',
      '12:00': 'Break',
      '1:00': 'Science',
      '2:00': 'Math',
    },
  };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundGreen,
      appBar: AppBar(
        title: const Text('Timetable'),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Time slots header
            Container(
              color: AppTheme.primaryGreen,
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Row(
                children: [
                  const SizedBox(width: 80),
                  ...timeSlots.map((time) => Expanded(
                        child: Text(
                          time,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: AppTheme.white,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                        ),
                      )),
                ],
              ),
            ),
            // Days and subjects
            ...days.map((day) => _buildDayRow(day)),
          ],
        ),
      ),
    );
  }

  Widget _buildDayRow(String day) {
    final daySchedule = timetable[day] ?? {};
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Container(
            width: 80,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.primaryGreen,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(8),
                bottomLeft: Radius.circular(8),
              ),
            ),
            child: Text(
              day,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: AppTheme.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          Expanded(
            child: Row(
              children: timeSlots.map((time) {
                final subject = daySchedule[time] ?? '';
                final isBreak = subject == 'Break';
                return Expanded(
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 2),
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: isBreak ? Colors.grey[200] : Colors.white,
                      border: Border.all(color: Colors.grey[300]!),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      subject,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: isBreak ? FontWeight.normal : FontWeight.w500,
                        color: isBreak ? Colors.grey[600] : Colors.black,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }
}

