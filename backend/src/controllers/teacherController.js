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

const isSubjectAssignedToTeacher = (teacher, subjectId) => {
  if (!teacher || !subjectId) return false;
  const subjectIdStr = subjectId.toString();
  return (teacher.assignedSubjects || []).some(
    (assignedSubject) => assignedSubject?.toString() === subjectIdStr
  );
};

const teacherHasAccessToSubject = (teacher, subject, teacherId) => {
  if (!subject) return false;
  if (subject.teacher?.toString && subject.teacher.toString() === teacherId) {
    return true;
  }
  return isSubjectAssignedToTeacher(teacher, subject._id || subject.id || subject);
};

const serializeDepartment = (department) => {
  if (!department) return null;
  if (typeof department === "string") {
    return {
      _id: department,
      name: undefined,
      code: undefined
    };
  }
  return {
    _id: (department._id || department.id)?.toString() || undefined,
    name: department.name,
    code: department.code
  };
};

// Get teacher's assigned subjects
export const getMySubjects = async (req, res) => {
  try {
    const teacher = await User.findById(req.user.id).select("assignedSubjects");

    const orConditions = [{ teacher: req.user.id }];
    if (teacher?.assignedSubjects?.length) {
      orConditions.push({ _id: { $in: teacher.assignedSubjects } });
    }

    const subjects = await Subject.find({
      isActive: true,
      $or: orConditions
    })
      .populate("department", "name code")
      .select("code name description semester department students");

    const seen = new Set();
    const formatted = subjects.reduce((acc, subject) => {
      const key = subject._id.toString();
      if (seen.has(key)) {
        return acc;
      }
      seen.add(key);
      acc.push({
        _id: subject._id,
        code: subject.code,
        name: subject.name,
        description: subject.description,
        semester: subject.semester,
        department: serializeDepartment(subject.department),
        studentCount: subject.students?.length || 0
      });
      return acc;
    }, []);

    res.json({ subjects: formatted });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Get students for a subject
export const getSubjectStudents = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { department, semester, date, hour } = req.query;
    const departmentFilter = department || null;
    const semesterFilter = semester ? Number(semester) : null;

    const subject = await Subject.findById(subjectId)
      .populate("department", "name code")
      .populate({
        path: "students",
        select: "userId name batch department semester registerNumber",
        populate: {
          path: "department",
          select: "name code"
        }
      });
    
    if (!subject) {
      return res.status(404).json({ msg: "Subject not found" });
    }

    // Verify teacher is assigned to this subject
    const teacher = await User.findById(req.user.id).select("assignedSubjects");
    if (
      subject.teacher?.toString() !== req.user.id &&
      !isSubjectAssignedToTeacher(teacher, subjectId)
    ) {
      return res.status(403).json({ msg: "You are not assigned to this subject" });
    }

    let students = subject.students ? [...subject.students] : [];

    if (!students.length) {
      // Fallback to students referencing this subject
      const fallbackBySubject = await User.find({
        role: "student",
        isActive: true,
        subjects: subject._id
      })
        .select("userId name batch department semester registerNumber")
        .populate("department", "name code");

      students = fallbackBySubject;
    }

    if (!students.length && (subject.department || subject.semester)) {
      // Last resort: fetch by subject metadata (department + semester)
      const fallbackQuery = { role: "student", isActive: true };
      if (subject.department) {
        fallbackQuery.department =
          subject.department._id || subject.department.id || subject.department;
      }
      if (subject.semester) {
        fallbackQuery.semester = subject.semester;
      }

      const fallbackByMeta = await User.find(fallbackQuery)
        .select("userId name batch department semester registerNumber")
        .populate("department", "name code");

      students = fallbackByMeta;
    }

    if (departmentFilter) {
      students = students.filter((student) => {
        const dept = student.department;
        if (!dept) return false;
        const deptId =
          typeof dept === "string"
            ? dept
            : (dept._id || dept.id)?.toString();
        return deptId === departmentFilter;
      });
    }

    if (!Number.isNaN(semesterFilter) && semesterFilter !== null) {
      students = students.filter(
        (student) => student.semester === semesterFilter
      );
    }

    let attendanceMap = {};
    if (date) {
      const dateObj = new Date(date);
      if (!Number.isNaN(dateObj.getTime())) {
        dateObj.setHours(0, 0, 0, 0);
        const attendanceQuery = { subjectId, date: dateObj };
        if (hour) {
          const parsedHour = Number(hour);
          attendanceQuery.hour = Number.isNaN(parsedHour) ? hour : parsedHour;
        }
        const attendanceDocs = await Attendance.find(attendanceQuery).select(
          "studentId status"
        );
        attendanceMap = attendanceDocs.reduce((acc, doc) => {
          acc[doc.studentId.toString()] = doc.status;
          return acc;
        }, {});
      }
    }

    const formattedStudents = students.map((student) => ({
      _id: student._id,
      userId: student.userId,
      name: student.name,
      batch: student.batch,
      semester: student.semester,
      department: serializeDepartment(student.department),
      attendanceStatus:
        attendanceMap[student._id?.toString()] || null
    }));

    res.json({
      subject: {
        _id: subject._id,
        code: subject.code,
        name: subject.name,
        semester: subject.semester,
        department: serializeDepartment(subject.department)
      },
      students: formattedStudents
    });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Mark attendance
export const markAttendance = async (req, res) => {
  try {
    const { subjectId, date, hour, attendance } = req.body; // attendance: [{studentId, status}]
    const normalizedHour =
      hour === undefined || hour === null
        ? null
        : Number.isNaN(Number(hour))
        ? hour
        : Number(hour);

    if (!subjectId || !date || !attendance || !Array.isArray(attendance)) {
      return res.status(400).json({ msg: "Invalid request data" });
    }

    const [teacher, subject] = await Promise.all([
      User.findById(req.user.id).select("assignedSubjects"),
      Subject.findById(subjectId).select("teacher")
    ]);

    if (!subject) {
      return res.status(404).json({ msg: "Subject not found" });
    }

    if (!teacherHasAccessToSubject(teacher, subject, req.user.id)) {
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
            hour: normalizedHour,
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

    const [teacher, subject] = await Promise.all([
      User.findById(req.user.id).select("assignedSubjects"),
      Subject.findById(subjectId).select("teacher")
    ]);

    if (!subject) {
      return res.status(404).json({ msg: "Subject not found" });
    }

    if (!teacherHasAccessToSubject(teacher, subject, req.user.id)) {
      return res.status(403).json({ msg: "You are not assigned to this subject" });
    }

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

    const [teacher, subject] = await Promise.all([
      User.findById(req.user.id).select("assignedSubjects"),
      Subject.findById(attendance.subjectId).select("teacher")
    ]);

    if (!subject) {
      return res.status(404).json({ msg: "Subject not found" });
    }

    if (!teacherHasAccessToSubject(teacher, subject, req.user.id)) {
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
      const [teacher, subject] = await Promise.all([
        User.findById(req.user.id).select("assignedSubjects"),
        Subject.findById(subjectId).select("teacher")
      ]);

      if (!subject) {
        return res.status(404).json({ msg: "Subject not found" });
      }

      if (!teacherHasAccessToSubject(teacher, subject, req.user.id)) {
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

