import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  // Students
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  generateCredentials,
  // Teachers
  getTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  // Subjects
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  assignSubjectToTeacher
} from "../controllers/adminController.js";

const router = express.Router();

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(async (req, res, next) => {
  const User = (await import("../models/User.js")).default;
  const user = await User.findById(req.user.id);
  if (user.role !== "admin") {
    return res.status(403).json({ msg: "Access denied. Admin only." });
  }
  next();
});

// Student routes
router.get("/students", getStudents);
router.get("/students/:id", getStudent);
router.post("/students", createStudent);
router.put("/students/:id", updateStudent);
router.delete("/students/:id", deleteStudent);
router.post("/students/:id/generate-credentials", generateCredentials);

// Teacher routes
router.get("/teachers", getTeachers);
router.post("/teachers", createTeacher);
router.put("/teachers/:id", updateTeacher);
router.delete("/teachers/:id", deleteTeacher);

// Subject routes
router.get("/subjects", getSubjects);
router.post("/subjects", createSubject);
router.put("/subjects/:id", updateSubject);
router.delete("/subjects/:id", deleteSubject);
router.post("/subjects/assign", assignSubjectToTeacher);

export default router;

