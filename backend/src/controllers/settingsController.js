import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";

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

// Update admin email/username
export const updateEmail = async (req, res) => {
  try {
    const { newEmail } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ msg: "Only admin can update email" });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ 
      email: newEmail,
      _id: { $ne: user._id }
    });

    if (existingUser) {
      return res.status(400).json({ msg: "Email already in use" });
    }

    const oldEmail = user.email;
    user.email = newEmail;
    user.userId = newEmail; // Update userId to match email for admin
    await user.save();

    await createAuditLog("update", "user", user._id, user._id, {
      action: "email_update",
      oldEmail,
      newEmail
    }, req);

    res.json({ 
      msg: "Email updated successfully",
      user: {
        id: user._id,
        userId: user.userId,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Update admin password
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ msg: "Only admin can update password" });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ msg: "Current password is incorrect" });
    }

    // Update password
    user.password = newPassword;
    user.activeToken = null; // Invalidate all sessions
    await user.save();

    await createAuditLog("update", "auth", user._id, user._id, {
      action: "password_update"
    }, req);

    res.json({ msg: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};

// Get current admin info
export const getAdminInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -activeToken");

    if (!user || user.role !== "admin") {
      return res.status(403).json({ msg: "Access denied" });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};


