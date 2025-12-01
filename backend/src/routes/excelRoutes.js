import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  uploadStudents,
  downloadStudentTemplate
} from "../controllers/excelController.js";

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

router.post("/upload/students", uploadStudents);
router.get("/template/students", downloadStudentTemplate);

export default router;


