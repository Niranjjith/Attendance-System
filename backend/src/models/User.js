import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["admin", "teacher", "student"],
    required: true
  },
  activeToken: {
    type: String,
    default: null
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  // Student specific fields
  batch: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  semester: {
    type: Number,
    min: 1,
    max: 6
  },
  registerNumber: {
    type: String,
    trim: true,
    sparse: true, // Allow null values but enforce uniqueness for non-null
    unique: true
  },
  phone: {
    type: String,
    trim: true
  },
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject"
  }],
  // Teacher specific fields
  assignedSubjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject"
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre("save", async function () {
  // Generate user ID if not provided
  if (!this.userId) {
    if (this.role === "student") {
      this.userId = `STU${Date.now()}`;
    } else if (this.role === "teacher") {
      this.userId = `TCH${Date.now()}`;
    }
  }
  
  // Update timestamp
  this.updatedAt = Date.now();
  
  // Hash password if modified
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("User", userSchema);

