import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    enum: ["present", "absent", "late"],
    required: true,
    default: "absent"
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  hour: {
    type: String,
    trim: true
  },
  markedAt: {
    type: Date,
    default: Date.now
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  lockedAt: {
    type: Date
  },
  // Audit trail
  changes: [{
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    oldStatus: String,
    newStatus: String,
    changedAt: {
      type: Date,
      default: Date.now
    },
    reason: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to prevent duplicate entries
attendanceSchema.index({ studentId: 1, subjectId: 1, date: 1 }, { unique: true });

// Index for efficient queries
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ subjectId: 1 });
attendanceSchema.index({ studentId: 1 });

attendanceSchema.pre("save", function () {
  this.updatedAt = Date.now();
});

export default mongoose.model("Attendance", attendanceSchema);
