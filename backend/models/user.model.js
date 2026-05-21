const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    // ─── Core Identity ─────────────────────────────────────
    role: {
      type: String,
      required: true,
      enum: ["admin", "faculty", "student"],
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },

    // ─── Personal Info ──────────────────────────────────────
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    middleName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      required: true,
      enum: ["male", "female", "other"],
    },
    dob: {
      type: Date,
      required: true,
    },
    profile: {
      type: String,
    },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    },

    // ─── Address ────────────────────────────────────────────
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    pincode: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },

    // ─── Emergency Contact ──────────────────────────────────
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
    },

    // ─── Status ─────────────────────────────────────────────
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    // ─── Admin & Faculty Specific ───────────────────────────
    employeeId: {
      type: String,
      // Auto-generated for admin and faculty in controller
    },
    designation: {
      type: String,
      // Required for admin and faculty
    },
    joiningDate: {
      type: Date,
      // Required for admin and faculty
    },
    salary: {
      type: Number,
      // Required for admin and faculty
    },
    isSuperAdmin: {
      type: Boolean,
      default: false,
    },

    // ─── Faculty & Student Specific ─────────────────────────
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      // Required for faculty and student
    },

    // ─── Student Specific ───────────────────────────────────
    rollNumber: {
      type: String,
      unique: true,
      sparse: true, // Allows null for non-students (unique only when set)
    },
    batch: {
      type: Number,
      // Year joined (23, 24, 25, 26 for 4-year course)
      // Required for student
    },
  },
  { timestamps: true },
);

// ─── Indexes ──────────────────────────────────────────────────
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ rollNumber: 1 });
userSchema.index({ branchId: 1, role: 1 });
userSchema.index({ employeeId: 1, role: 1 });

// ─── Pre-save: Hash Password ─────────────────────────────────
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// ─── Instance Method: Compare Password ───────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ─── Virtuals for Backend / Frontend compatibility ──────────
userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

userSchema.virtual("enrollmentNo").get(function () {
  return this.rollNumber;
});

const User = mongoose.model("User", userSchema);

module.exports = User;
