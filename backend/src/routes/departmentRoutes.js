import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment
} from "../controllers/departmentController.js";

const router = express.Router();

// Public route to get departments (for student/teacher use)
router.get("/departments", getDepartments);

// All other routes require authentication and admin role
router.use(authMiddleware);
router.use(async (req, res, next) => {
  const User = (await import("../models/User.js")).default;
  const user = await User.findById(req.user.id);
  if (user.role !== "admin") {
    return res.status(403).json({ msg: "Access denied. Admin only." });
  }
  next();
});

router.get("/departments/:id", getDepartment);
router.post("/departments", createDepartment);
router.put("/departments/:id", updateDepartment);
router.delete("/departments/:id", deleteDepartment);

export default router;

