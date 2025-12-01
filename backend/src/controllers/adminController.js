import User from "../models/User.js";
import Subject from "../models/Subject.js";
import Attendance from "../models/Attendance.js";
import AuditLog from "../models/AuditLog.js";
import crypto from "crypto";

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

// ========== STUDENT MANAGEMENT ==========

// Get all students
export const getStudents = async (req, res) => {
  try {
    const { batch, department, semester, search } = req.query;
    const query = { role: "student", isActive: true };
    
    if (batch) query.batch = batch;
    if (department) query.department = department;
    if (semester) query.semester = parseInt(semester);
    if (search) {
      query.$or = [
        { userId: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { registerNumber: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } }
      ];
    }

    const students = await User.find(query)
      .populate("subjects", "code name")
      .select("-password -activeToken")
      .sort({ createdAt: -1 });

    res.json({ students });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Get single student
export const getStudent = async (req, res) => {
  try {
    const student = await User.findOne({
      _id: req.params.id,
      role: "student"
    })
      .populate("subjects", "code name")
      .select("-password -activeToken");

    if (!student) {
      return res.status(404).json({ msg: "Student not found" });
    }

    res.json({ student });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Create student
export const createStudent = async (req, res) => {
  try {
    const { userId, name, email, password, batch, department, semester, registerNumber, phone, subjects } = req.body;

    // Check if user exists
    const existing = await User.findOne({ 
      $or: [
        { userId }, 
        { email },
        ...(registerNumber ? [{ registerNumber }] : [])
      ] 
    });
    if (existing) {
      return res.status(400).json({ msg: "User ID, email, or register number already exists" });
    }

    // Generate password if not provided
    const generatedPassword = password || crypto.randomBytes(8).toString("hex");

    const student = await User.create({
      userId,
      name,
      email,
      password: generatedPassword,
      role: "student",
      batch,
      department,
      semester,
      registerNumber,
      phone,
      subjects
    });

    await createAuditLog("create", "user", student._id, req.user.id, { role: "student" }, req);

    res.status(201).json({
      msg: "Student created successfully",
      student: {
        id: student._id,
        userId: student.userId,
        name: student.name,
        email: student.email,
        batch: student.batch
      },
      credentials: {
        userId: student.userId,
        password: generatedPassword
      }
    });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Update student
export const updateStudent = async (req, res) => {
  try {
    const { name, email, batch, department, semester, registerNumber, phone, subjects, password, profilePhoto } = req.body;
    const student = await User.findOne({ _id: req.params.id, role: "student" });

    if (!student) {
      return res.status(404).json({ msg: "Student not found" });
    }

    // Check if registerNumber is being changed and if it conflicts
    if (registerNumber && registerNumber !== student.registerNumber) {
      const existing = await User.findOne({ 
        registerNumber,
        _id: { $ne: student._id }
      });
      if (existing) {
        return res.status(400).json({ msg: "Register number already exists" });
      }
    }

    const oldData = { 
      name: student.name, 
      email: student.email, 
      batch: student.batch,
      department: student.department,
      semester: student.semester
    };
    
    if (name) student.name = name;
    if (email) student.email = email;
    if (batch) student.batch = batch;
    if (department !== undefined) student.department = department;
    if (semester !== undefined) student.semester = semester;
    if (registerNumber !== undefined) student.registerNumber = registerNumber;
    if (phone !== undefined) student.phone = phone;
    if (subjects) student.subjects = subjects;

    await student.save();

    await createAuditLog("update", "user", student._id, req.user.id, { oldData, newData: req.body }, req);

    res.json({ msg: "Student updated successfully", student });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Delete student
export const deleteStudent = async (req, res) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: "student" });

    if (!student) {
      return res.status(404).json({ msg: "Student not found" });
    }

    student.isActive = false;
    await student.save();

    await createAuditLog("delete", "user", student._id, req.user.id, {}, req);

    res.json({ msg: "Student deleted successfully" });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Generate login credentials for student
export const generateCredentials = async (req, res) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: "student" });

    if (!student) {
      return res.status(404).json({ msg: "Student not found" });
    }

    const newPassword = crypto.randomBytes(8).toString("hex");
    student.password = newPassword;
    student.activeToken = null; // Invalidate existing sessions
    await student.save();

    await createAuditLog("update", "user", student._id, req.user.id, { action: "credentials_generated" }, req);

    res.json({
      msg: "Credentials generated successfully",
      credentials: {
        userId: student.userId,
        password: newPassword
      }
    });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// ========== TEACHER MANAGEMENT ==========

// Get all teachers
export const getTeachers = async (req, res) => {
  try {
    const { search } = req.query;
    const query = { role: "teacher", isActive: true };
    
    if (search) {
      query.$or = [
        { userId: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    const teachers = await User.find(query)
      .populate("assignedSubjects", "code name")
      .select("-password -activeToken")
      .sort({ createdAt: -1 });

    res.json({ teachers });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Create teacher
export const createTeacher = async (req, res) => {
  try {
    const { userId, name, email, password, assignedSubjects } = req.body;

    const existing = await User.findOne({ $or: [{ userId }, { email }] });
    if (existing) {
      return res.status(400).json({ msg: "User ID or email already exists" });
    }

    const generatedPassword = password || crypto.randomBytes(8).toString("hex");

    const teacher = await User.create({
      userId,
      name,
      email,
      password: generatedPassword,
      role: "teacher",
      assignedSubjects
    });

    await createAuditLog("create", "user", teacher._id, req.user.id, { role: "teacher" }, req);

    res.status(201).json({
      msg: "Teacher created successfully",
      teacher: {
        id: teacher._id,
        userId: teacher.userId,
        name: teacher.name,
        email: teacher.email
      },
      credentials: {
        userId: teacher.userId,
        password: generatedPassword
      }
    });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Update teacher
export const updateTeacher = async (req, res) => {
  try {
    const { name, email, assignedSubjects, password, profilePhoto } = req.body;
    const teacher = await User.findOne({ _id: req.params.id, role: "teacher" });

    if (!teacher) {
      return res.status(404).json({ msg: "Teacher not found" });
    }

    if (name) teacher.name = name;
    if (email) teacher.email = email;
    if (assignedSubjects) teacher.assignedSubjects = assignedSubjects;

    await teacher.save();

    await createAuditLog("update", "user", teacher._id, req.user.id, { oldData: req.body }, req);

    res.json({ msg: "Teacher updated successfully", teacher });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Delete teacher
export const deleteTeacher = async (req, res) => {
  try {
    const teacher = await User.findOne({ _id: req.params.id, role: "teacher" });

    if (!teacher) {
      return res.status(404).json({ msg: "Teacher not found" });
    }

    teacher.isActive = false;
    await teacher.save();

    await createAuditLog("delete", "user", teacher._id, req.user.id, {}, req);

    res.json({ msg: "Teacher deleted successfully" });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Change password for any user (admin only)
export const changeUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const userId = req.params.id;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ msg: "Password must be at least 6 characters" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    user.password = newPassword; // Will be hashed by pre-save hook
    await user.save();

    await createAuditLog("update", "user", userId, req.user.id, { action: "password_change" }, req);

    res.json({ msg: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// ========== SUBJECT MANAGEMENT ==========

// Get all subjects
export const getSubjects = async (req, res) => {
  try {
    const { search } = req.query;
    const query = { isActive: true };
    
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } }
      ];
    }

    const subjects = await Subject.find(query)
      .populate("teacher", "userId name email")
      .populate("students", "userId name")
      .sort({ createdAt: -1 });

    res.json({ subjects });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Create subject
export const createSubject = async (req, res) => {
  try {
    const { code, name, description, teacher, students, department, semester } = req.body;

    const existing = await Subject.findOne({ code });
    if (existing) {
      return res.status(400).json({ msg: "Subject code already exists" });
    }

    const subject = await Subject.create({
      code: code.toUpperCase(),
      name,
      description,
      teacher,
      students,
      department,
      semester
    });

    await createAuditLog("create", "subject", subject._id, req.user.id, {}, req);

    res.status(201).json({ msg: "Subject created successfully", subject });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Update subject
export const updateSubject = async (req, res) => {
  try {
    const { name, description, teacher, students, department, semester } = req.body;
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({ msg: "Subject not found" });
    }

    if (name) subject.name = name;
    if (description !== undefined) subject.description = description;
    if (teacher) subject.teacher = teacher;
    if (students) subject.students = students;
    if (department !== undefined) subject.department = department;
    if (semester !== undefined) subject.semester = semester;

    await subject.save();

    await createAuditLog("update", "subject", subject._id, req.user.id, { oldData: req.body }, req);

    res.json({ msg: "Subject updated successfully", subject });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Delete subject
export const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({ msg: "Subject not found" });
    }

    subject.isActive = false;
    await subject.save();

    await createAuditLog("delete", "subject", subject._id, req.user.id, {}, req);

    res.json({ msg: "Subject deleted successfully" });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Assign subject to teacher
export const assignSubjectToTeacher = async (req, res) => {
  try {
    const { teacherId, subjectId } = req.body;

    const teacher = await User.findOne({ _id: teacherId, role: "teacher" });
    const subject = await Subject.findById(subjectId);

    if (!teacher || !subject) {
      return res.status(404).json({ msg: "Teacher or subject not found" });
    }

    subject.teacher = teacherId;
    if (!teacher.assignedSubjects.includes(subjectId)) {
      teacher.assignedSubjects.push(subjectId);
    }
    
    await subject.save();
    await teacher.save();

    await createAuditLog("update", "subject", subjectId, req.user.id, { action: "assign_teacher", teacherId }, req);

    res.json({ msg: "Subject assigned to teacher successfully" });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

