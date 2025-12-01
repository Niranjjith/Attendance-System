import express from "express";
import {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  uploadProfilePhoto
} from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { handleProfilePhotoUpload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected routes
router.get("/me", authMiddleware, getMe);
router.post("/logout", authMiddleware, logout);
router.post("/upload-profile-photo", authMiddleware, handleProfilePhotoUpload, uploadProfilePhoto);

export default router;

