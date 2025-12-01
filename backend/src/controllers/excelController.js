import User from "../models/User.js";
import Subject from "../models/Subject.js";
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

// Upload students via Excel
// Expected format: userId, name, email, batch, subjects (comma-separated)
export const uploadStudents = async (req, res) => {
  try {
    // In a real implementation, you would use a library like 'xlsx' or 'exceljs'
    // For now, we'll accept JSON array format
    const students = req.body.students || [];

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ msg: "Invalid data format. Expected array of students." });
    }

    const results = {
      success: [],
      failed: [],
      total: students.length
    };

    for (const studentData of students) {
      try {
        const { userId, name, email, batch, subjects } = studentData;

        if (!userId || !name) {
          results.failed.push({
            data: studentData,
            error: "Missing required fields: userId and name"
          });
          continue;
        }

        // Check if user exists
        const existing = await User.findOne({ $or: [{ userId }, { email }] });
        if (existing) {
          results.failed.push({
            data: studentData,
            error: "User already exists"
          });
          continue;
        }

        // Generate password
        const password = crypto.randomBytes(8).toString("hex");

        // Process subjects if provided
        let subjectIds = [];
        if (subjects && Array.isArray(subjects)) {
          // If subjects are provided as codes, find their IDs
          const subjectDocs = await Subject.find({ code: { $in: subjects } });
          subjectIds = subjectDocs.map(s => s._id);
        }

        const student = await User.create({
          userId,
          name,
          email,
          password,
          role: "student",
          batch,
          subjects: subjectIds
        });

        await createAuditLog("create", "user", student._id, req.user.id, {
          action: "bulk_upload",
          source: "excel"
        }, req);

        results.success.push({
          userId: student.userId,
          name: student.name,
          password // Include password for admin to distribute
        });
      } catch (error) {
        results.failed.push({
          data: studentData,
          error: error.message
        });
      }
    }

    res.json({
      msg: `Upload completed: ${results.success.length} successful, ${results.failed.length} failed`,
      results
    });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Download template for student upload
export const downloadStudentTemplate = async (req, res) => {
  try {
    // In a real implementation, generate an Excel file
    // For now, return JSON template
    const template = {
      columns: ["userId", "name", "email", "batch", "subjects"],
      example: [
        {
          userId: "STU001",
          name: "John Doe",
          email: "john@example.com",
          batch: "2024",
          subjects: ["CS101", "MATH101"]
        }
      ],
      note: "subjects should be comma-separated subject codes"
    };

    res.json(template);
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

