import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ["create", "update", "delete", "login", "logout", "attendance_mark", "attendance_update", "bulk_operation"]
  },
  entity: {
    type: String,
    required: true,
    enum: ["user", "subject", "attendance", "auth"]
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  changes: {
    type: mongoose.Schema.Types.Mixed
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ performedBy: 1 });
auditLogSchema.index({ entity: 1, entityId: 1 });

export default mongoose.model("AuditLog", auditLogSchema);

