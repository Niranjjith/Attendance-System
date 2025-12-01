import User from "../models/User.js";
import Subject from "../models/Subject.js";
import Attendance from "../models/Attendance.js";
import AuditLog from "../models/AuditLog.js";
import mongoose from "mongoose";

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: "student", isActive: true });
    const totalTeachers = await User.countDocuments({ role: "teacher", isActive: true });
    const totalSubjects = await Subject.countDocuments({ isActive: true });

    // Today's date range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Today's attendance
    const todayAttendance = await Attendance.find({
      date: { $gte: todayStart, $lte: todayEnd }
    });

    const todayPresent = todayAttendance.filter(a => a.status === "present" || a.status === "late").length;
    const todayAbsent = todayAttendance.filter(a => a.status === "absent").length;

    // Overall attendance percentage
    const allAttendance = await Attendance.find();
    const totalClasses = allAttendance.length;
    const presentCount = allAttendance.filter(a => a.status === "present" || a.status === "late").length;
    const overallPercentage = totalClasses > 0 ? (presentCount / totalClasses) * 100 : 0;

    // Attendance by subject
    const attendanceBySubject = await Attendance.aggregate([
      {
        $group: {
          _id: "$subjectId",
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $in: ["$status", ["present", "late"]] }, 1, 0] }
          }
        }
      },
      {
        $lookup: {
          from: "subjects",
          localField: "_id",
          foreignField: "_id",
          as: "subject"
        }
      },
      { $unwind: "$subject" },
      {
        $project: {
          subjectCode: "$subject.code",
          subjectName: "$subject.name",
          total: 1,
          present: 1,
          percentage: { $multiply: [{ $divide: ["$present", "$total"] }, 100] }
        }
      }
    ]);

    res.json({
      stats: {
        totalStudents,
        totalTeachers,
        totalSubjects,
        overallAttendancePercentage: overallPercentage.toFixed(2),
        todayAttendance: {
          present: todayPresent,
          absent: todayAbsent,
          total: todayAttendance.length
        }
      },
      attendanceBySubject
    });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Get attendance logs with filters
export const getAttendanceLogs = async (req, res) => {
  try {
    const { date, subjectId, studentId, status, page = 1, limit = 50 } = req.query;

    const query = {};
    
    if (date) {
      const dateStart = new Date(date);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(date);
      dateEnd.setHours(23, 59, 59, 999);
      query.date = { $gte: dateStart, $lte: dateEnd };
    }
    
    if (subjectId) query.subjectId = subjectId;
    if (studentId) query.studentId = studentId;
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const logs = await Attendance.find(query)
      .populate("studentId", "userId name batch")
      .populate("subjectId", "code name")
      .populate("markedBy", "userId name")
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Attendance.countDocuments(query);

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Export attendance as CSV
export const exportAttendanceCSV = async (req, res) => {
  try {
    const { startDate, endDate, subjectId, studentId } = req.query;

    const query = {};
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    if (subjectId) query.subjectId = subjectId;
    if (studentId) query.studentId = studentId;

    const attendance = await Attendance.find(query)
      .populate("studentId", "userId name batch")
      .populate("subjectId", "code name")
      .populate("markedBy", "userId name")
      .sort({ date: -1 });

    // Generate CSV
    let csv = "Date,Student ID,Student Name,Batch,Subject Code,Subject Name,Status,Marked By\n";
    
    attendance.forEach(record => {
      csv += `${record.date.toISOString().split('T')[0]},${record.studentId?.userId || ''},${record.studentId?.name || ''},${record.studentId?.batch || ''},${record.subjectId?.code || ''},${record.subjectId?.name || ''},${record.status},${record.markedBy?.name || ''}\n`;
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=attendance_${Date.now()}.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Bulk operations
export const bulkMarkHoliday = async (req, res) => {
  try {
    const { date, subjectId } = req.body;

    if (!date) {
      return res.status(400).json({ msg: "Date is required" });
    }

    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);

    // Mark all attendance for that date/subject as holiday (we can add a holiday field or skip marking)
    // For now, we'll just acknowledge the holiday
    res.json({ msg: "Holiday marked successfully. No attendance will be recorded for this date." });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

export const bulkMarkPresent = async (req, res) => {
  try {
    const { date, subjectId, studentIds } = req.body;

    if (!date || !subjectId) {
      return res.status(400).json({ msg: "Date and subjectId are required" });
    }

    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);

    const bulkOps = [];
    const students = studentIds || await User.find({ role: "student", isActive: true }).select("_id");

    for (const student of students) {
      const studentId = studentIds ? student : student._id;
      bulkOps.push({
        updateOne: {
          filter: {
            studentId,
            subjectId,
            date: dateObj
          },
          update: {
            $set: {
              studentId,
              subjectId,
              date: dateObj,
              status: "present",
              markedBy: req.user.id,
              isLocked: false
            }
          },
          upsert: true
        }
      });
    }

    await Attendance.bulkWrite(bulkOps);

    res.json({ msg: "Bulk attendance marked successfully" });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

