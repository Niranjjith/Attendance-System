import mongoose from "mongoose";
import Attendance from "../models/Attendance.js";
import Subject from "../models/Subject.js";
import User from "../models/User.js";

// Get student's attendance
export const getMyAttendance = async (req, res) => {
  try {
    const { subjectId, startDate, endDate, page = 1, limit = 50 } = req.query;

    const query = { studentId: req.user.id };

    if (subjectId) query.subjectId = subjectId;
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const attendance = await Attendance.find(query)
      .populate("subjectId", "code name")
      .populate("markedBy", "name")
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Attendance.countDocuments(query);

    res.json({
      attendance,
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

// Get attendance statistics
export const getAttendanceStats = async (req, res) => {
  try {
    const student = await User.findById(req.user.id).populate("subjects");

    // Get attendance for all subjects
    const attendanceBySubject = await Attendance.aggregate([
      {
        $match: { studentId: new mongoose.Types.ObjectId(req.user.id) }
      },
      {
        $group: {
          _id: "$subjectId",
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] }
          },
          late: {
            $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] }
          },
          absent: {
            $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] }
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
          subjectId: "$_id",
          subjectCode: "$subject.code",
          subjectName: "$subject.name",
          total: 1,
          present: 1,
          late: 1,
          absent: 1,
          percentage: {
            $cond: [
              { $gt: ["$total", 0] },
              {
                $multiply: [
                  {
                    $divide: [
                      { $add: ["$present", "$late"] },
                      "$total"
                    ]
                  },
                  100
                ]
              },
              0
            ]
          }
        }
      }
    ]);

    // Overall statistics
    const overall = await Attendance.aggregate([
      {
        $match: { studentId: new mongoose.Types.ObjectId(req.user.id) }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] }
          },
          late: {
            $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] }
          },
          absent: {
            $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] }
          }
        }
      }
    ]);

    const overallStats = overall[0] || { total: 0, present: 0, late: 0, absent: 0 };
    const overallPercentage = overallStats.total > 0
      ? ((overallStats.present + overallStats.late) / overallStats.total) * 100
      : 0;

    // Monthly statistics
    const monthlyStats = await Attendance.aggregate([
      {
        $match: { studentId: new mongoose.Types.ObjectId(req.user.id) }
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" }
          },
          total: { $sum: 1 },
          present: {
            $sum: { $cond: [{ $eq: ["$status", "present"] }, 1, 0] }
          },
          late: {
            $sum: { $cond: [{ $eq: ["$status", "late"] }, 1, 0] }
          },
          absent: {
            $sum: { $cond: [{ $eq: ["$status", "absent"] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          month: "$_id.month",
          year: "$_id.year",
          total: 1,
          present: 1,
          late: 1,
          absent: 1,
          percentage: {
            $cond: [
              { $gt: ["$total", 0] },
              {
                $multiply: [
                  {
                    $divide: [
                      { $add: ["$present", "$late"] },
                      "$total"
                    ]
                  },
                  100
                ]
              },
              0
            ]
          }
        }
      },
      { $sort: { year: -1, month: -1 } }
    ]);

    res.json({
      bySubject: attendanceBySubject,
      overall: {
        ...overallStats,
        percentage: overallPercentage.toFixed(2)
      },
      monthly: monthlyStats
    });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Get detailed daily record
export const getDailyRecord = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ msg: "Date is required" });
    }

    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);

    const attendance = await Attendance.find({
      studentId: req.user.id,
      date: { $gte: dateObj, $lte: dateEnd }
    })
      .populate("subjectId", "code name")
      .populate("markedBy", "name");

    res.json({ attendance, date: dateObj });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

