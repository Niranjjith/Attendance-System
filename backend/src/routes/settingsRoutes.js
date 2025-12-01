import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  updateEmail,
  updatePassword,
  getAdminInfo
} from "../controllers/settingsController.js";

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

router.get("/info", getAdminInfo);
router.put("/email", updateEmail);
router.put("/password", updatePassword);

export default router;


