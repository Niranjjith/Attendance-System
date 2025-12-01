import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getDashboardStats,
  getAttendanceLogs,
  exportAttendanceCSV,
  bulkMarkHoliday,
  bulkMarkPresent
} from "../controllers/dashboardController.js";

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

router.get("/stats", getDashboardStats);
router.get("/logs", getAttendanceLogs);
router.get("/export/csv", exportAttendanceCSV);
router.post("/bulk/holiday", bulkMarkHoliday);
router.post("/bulk/present", bulkMarkPresent);

export default router;


