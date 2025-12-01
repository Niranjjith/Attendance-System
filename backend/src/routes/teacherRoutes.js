import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getMySubjects,
  getSubjectStudents,
  markAttendance,
  lockAttendance,
  updateAttendance,
  getAttendanceHistory
} from "../controllers/teacherController.js";

const router = express.Router();

// All routes require authentication and teacher role
router.use(authMiddleware);
router.use(async (req, res, next) => {
  const User = (await import("../models/User.js")).default;
  const user = await User.findById(req.user.id);
  if (user.role !== "teacher") {
    return res.status(403).json({ msg: "Access denied. Teacher only." });
  }
  next();
});

router.get("/subjects", getMySubjects);
router.get("/subjects/:subjectId/students", getSubjectStudents);
router.post("/attendance/mark", markAttendance);
router.post("/attendance/lock", lockAttendance);
router.put("/attendance/update", updateAttendance);
router.get("/attendance/history", getAttendanceHistory);

export default router;


