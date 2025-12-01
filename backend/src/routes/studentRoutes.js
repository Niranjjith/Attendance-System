import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getMyAttendance,
  getAttendanceStats,
  getDailyRecord
} from "../controllers/studentController.js";

const router = express.Router();

// All routes require authentication and student role
router.use(authMiddleware);
router.use(async (req, res, next) => {
  const User = (await import("../models/User.js")).default;
  const user = await User.findById(req.user.id);
  if (user.role !== "student") {
    return res.status(403).json({ msg: "Access denied. Student only." });
  }
  next();
});

router.get("/attendance", getMyAttendance);
router.get("/attendance/stats", getAttendanceStats);
router.get("/attendance/daily", getDailyRecord);

export default router;


