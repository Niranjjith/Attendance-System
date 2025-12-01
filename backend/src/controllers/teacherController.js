import Attendance from "../models/Attendance.js";
import Subject from "../models/Subject.js";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";

// Create audit log helper
const createAuditLog = async (action, entity, entityId, performedBy, changes = {}, req = null) => {
  try {
    await AuditLog.create({
      action,
      entity,
      entityId,
      performedBy,
      changes,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.get("user-agent")
    });
  } catch (error) {
    console.error("Audit log creation failed:", error);
  }
};

// Get teacher's assigned subjects
export const getMySubjects = async (req, res) => {
  try {
    const teacher = await User.findById(req.user.id).populate("assignedSubjects");
    res.json({ subjects: teacher.assignedSubjects });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Get students for a subject
export const getSubjectStudents = async (req, res) => {
  try {
    const { subjectId } = req.params;
    
    const subject = await Subject.findById(subjectId).populate("students", "userId name batch");
    
    if (!subject) {
      return res.status(404).json({ msg: "Subject not found" });
    }

    // Verify teacher is assigned to this subject
    const teacher = await User.findById(req.user.id);
    if (!teacher.assignedSubjects.includes(subjectId)) {
      return res.status(403).json({ msg: "You are not assigned to this subject" });
    }

    res.json({ students: subject.students });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Mark attendance
export const markAttendance = async (req, res) => {
  try {
    const { subjectId, date, hour, attendance } = req.body; // attendance: [{studentId, status}]

    if (!subjectId || !date || !attendance || !Array.isArray(attendance)) {
      return res.status(400).json({ msg: "Invalid request data" });
    }

    // Verify teacher is assigned to this subject
    const teacher = await User.findById(req.user.id);
    if (!teacher.assignedSubjects.includes(subjectId)) {
      return res.status(403).json({ msg: "You are not assigned to this subject" });
    }

    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);

    // Check if already locked
    const existing = await Attendance.findOne({
      subjectId,
      date: dateObj,
      isLocked: true
    });

    if (existing) {
      return res.status(400).json({ msg: "Attendance for this date is already locked" });
    }

    const bulkOps = [];
    const results = [];

    for (const record of attendance) {
      const { studentId, status } = record;
      
      if (!["present", "absent", "late"].includes(status)) {
        continue;
      }

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
              status,
              markedBy: req.user.id,
              hour: hour || null,
              markedAt: new Date(),
              isLocked: false
            },
            $push: {
              changes: {
                changedBy: req.user.id,
                newStatus: status,
                changedAt: new Date(),
                reason: "Initial marking"
              }
            }
          },
          upsert: true
        }
      });

      results.push({ studentId, status });
    }

    await Attendance.bulkWrite(bulkOps);

    // Log the action
    await createAuditLog("attendance_mark", "attendance", subjectId, req.user.id, {
      date: dateObj,
      count: attendance.length
    }, req);

    res.json({
      msg: "Attendance marked successfully",
      marked: results.length
    });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Lock attendance (prevent further changes)
export const lockAttendance = async (req, res) => {
  try {
    const { subjectId, date } = req.body;

    const dateObj = new Date(date);
    dateObj.setHours(0, 0, 0, 0);

    const result = await Attendance.updateMany(
      {
        subjectId,
        date: dateObj
      },
      {
        $set: {
          isLocked: true,
          lockedAt: new Date()
        }
      }
    );

    await createAuditLog("update", "attendance", subjectId, req.user.id, {
      action: "lock_attendance",
      date: dateObj
    }, req);

    res.json({
      msg: "Attendance locked successfully",
      locked: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Update attendance (within time window)
export const updateAttendance = async (req, res) => {
  try {
    const { attendanceId, status, reason } = req.body;

    const attendance = await Attendance.findById(attendanceId);

    if (!attendance) {
      return res.status(404).json({ msg: "Attendance record not found" });
    }

    // Verify teacher is assigned to this subject
    const teacher = await User.findById(req.user.id);
    if (!teacher.assignedSubjects.includes(attendance.subjectId.toString())) {
      return res.status(403).json({ msg: "You are not assigned to this subject" });
    }

    // Check if locked
    if (attendance.isLocked) {
      return res.status(400).json({ msg: "Attendance is locked and cannot be modified" });
    }

    // Optional: Check time window (e.g., allow updates within 24 hours)
    const timeDiff = Date.now() - attendance.date.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    
    if (hoursDiff > 24) {
      return res.status(400).json({ msg: "Attendance can only be updated within 24 hours" });
    }

    const oldStatus = attendance.status;
    attendance.status = status;
    attendance.changes.push({
      changedBy: req.user.id,
      oldStatus,
      newStatus: status,
      changedAt: new Date(),
      reason: reason || "Updated by teacher"
    });

    await attendance.save();

    await createAuditLog("attendance_update", "attendance", attendanceId, req.user.id, {
      oldStatus,
      newStatus: status,
      reason
    }, req);

    res.json({ msg: "Attendance updated successfully", attendance });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Get attendance history
export const getAttendanceHistory = async (req, res) => {
  try {
    const { subjectId, date, batch, page = 1, limit = 50 } = req.query;

    const query = {};
    
    if (subjectId) {
      // Verify teacher is assigned
      const teacher = await User.findById(req.user.id);
      if (!teacher.assignedSubjects.includes(subjectId)) {
        return res.status(403).json({ msg: "You are not assigned to this subject" });
      }
      query.subjectId = subjectId;
    }

    if (date) {
      const dateStart = new Date(date);
      dateStart.setHours(0, 0, 0, 0);
      const dateEnd = new Date(date);
      dateEnd.setHours(23, 59, 59, 999);
      query.date = { $gte: dateStart, $lte: dateEnd };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let attendance = await Attendance.find(query)
      .populate("studentId", "userId name batch")
      .populate("subjectId", "code name")
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Filter by batch if provided
    if (batch) {
      attendance = attendance.filter(a => a.studentId?.batch === batch);
    }

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

