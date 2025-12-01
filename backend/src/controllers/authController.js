import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d"
  });
};

// Create audit log
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

// Register (Admin only - for creating initial admin or other users)
export const register = async (req, res) => {
  try {
    const { userId, name, email, password, role, batch, subjects } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ userId }, { email }] });
    if (existingUser) {
      return res.status(400).json({ msg: "User already exists" });
    }

    // Create user
    const user = await User.create({
      userId,
      name,
      email,
      password,
      role: role || "student",
      batch,
      subjects
    });

    await createAuditLog("create", "user", user._id, req.user?.id || user._id, { role: user.role }, req);

    res.status(201).json({
      msg: "User created successfully",
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({ msg: "Please provide userId/email and password" });
    }

    // Find user by userId or email
    const user = await User.findOne({ 
      $or: [
        { userId: userId },
        { email: userId }
      ],
      isActive: true 
    });
    
    if (!user) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    // Generate new token (this invalidates old session)
    const token = generateToken(user._id);
    user.activeToken = token;
    await user.save();

    await createAuditLog("login", "auth", user._id, user._id, {}, req);

    res.json({
      msg: "Login successful",
      token,
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        batch: user.batch
      }
    });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Logout
export const logout = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      user.activeToken = null;
      await user.save();
      await createAuditLog("logout", "auth", user._id, user._id, {}, req);
    }
    res.json({ msg: "Logout successful" });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Get current user
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("subjects", "code name")
      .populate("assignedSubjects", "code name")
      .populate("department", "name code")
      .select("-password -activeToken -resetPasswordToken -resetPasswordExpires");

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Upload profile photo
export const uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "No file uploaded" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    // Construct the file URL
    const fileUrl = `/uploads/profile-photos/${req.file.filename}`;
    
    // Update user's profile photo
    user.profilePhoto = fileUrl;
    await user.save();

    // Create audit log
    await createAuditLog("update", "user", user._id, req.user.id, { 
      action: "profile_photo_upload",
      photoUrl: fileUrl 
    }, req);

    res.json({ 
      msg: "Profile photo uploaded successfully",
      profilePhoto: fileUrl 
    });
  } catch (error) {
    console.error("Profile photo upload error:", error);
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Forgot password
export const forgotPassword = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await User.findOne({ userId, isActive: true });
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({ msg: "If user exists, reset link will be sent" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    // In production, send email with reset token
    // For now, return token (remove in production)
    res.json({
      msg: "Reset token generated",
      resetToken // Remove this in production, send via email instead
    });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Reset password
export const resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ msg: "Please provide reset token and new password" });
    }

    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ msg: "Invalid or expired reset token" });
    }

    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.activeToken = null; // Invalidate all sessions
    await user.save();

    await createAuditLog("update", "auth", user._id, user._id, { action: "password_reset" }, req);

    res.json({ msg: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

