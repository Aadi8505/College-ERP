const User = require("../models/user.model");
const ResetPassword = require("../models/reset-password.model");
const Branch = require("../models/branch.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const ApiResponse = require("../utils/ApiResponse");
const sendResetMail = require("../utils/SendMail");
const { uploadToCloudinary, deleteFromCloudinary } = require("../utils/cloudinary");

// ═══════════════════════════════════════════════════════════════
// AUTH CONTROLLERS
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/auth/login
 * Single login for all roles. Returns token + role.
 */
const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return ApiResponse.badRequest("Email and password are required").send(
        res,
      );
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return ApiResponse.notFound("No account found with this email").send(res);
    }

    if (user.status === "inactive") {
      return ApiResponse.forbidden(
        "Account is deactivated. Contact admin.",
      ).send(res);
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return ApiResponse.unauthorized("Invalid password").send(res);
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 60 * 60 * 1000,
    });

    return ApiResponse.success(
      { token, role: user.role },
      "Login successful",
    ).send(res);
  } catch (error) {
    console.error("Login Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

/**
 * POST /api/auth/logout
 * Clears auth cookie.
 */
const logoutController = async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";
    res.clearCookie("token", {
      sameSite: isProduction ? "none" : "lax",
      secure: isProduction,
    });
    return ApiResponse.success(null, "Logged out successfully").send(res);
  } catch (error) {
    console.error("Logout Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

/**
 * GET /api/auth/my-details
 * Returns the logged-in user's details (any role).
 */
const getMyDetailsController = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select("-password -__v")
      .populate("branchId");

    if (!user) {
      return ApiResponse.notFound("User not found").send(res);
    }

    return ApiResponse.success(user, "User details retrieved").send(res);
  } catch (error) {
    console.error("Get My Details Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

/**
 * POST /api/auth/forget-password
 * Sends password reset email (any role).
 */
const sendForgetPasswordEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return ApiResponse.badRequest("Email is required").send(res);
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      // Don't reveal if email exists (security best practice)
      return ApiResponse.success(
        null,
        "If this email exists, a reset link will be sent",
      ).send(res);
    }

    // Delete any existing reset tokens for this user
    await ResetPassword.deleteMany({ userId: user._id });

    const resetJwt = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "10m",
    });

    await ResetPassword.create({
      userId: user._id,
      resetToken: resetJwt,
    });

    await sendResetMail(user.email, resetJwt, user.role);

    return ApiResponse.success(
      null,
      "If this email exists, a reset link will be sent",
    ).send(res);
  } catch (error) {
    console.error("Forget Password Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

/**
 * POST /api/auth/update-password/:resetId
 * Verifies reset token and updates password.
 */
const updatePasswordHandler = async (req, res) => {
  try {
    const { resetId } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return ApiResponse.badRequest(
        "Password is required and must be at least 6 characters",
      ).send(res);
    }

    const resetRecord = await ResetPassword.findOne({ resetToken: resetId });

    if (!resetRecord) {
      return ApiResponse.notFound("Invalid or expired reset link").send(res);
    }

    // Verify the JWT hasn't expired
    try {
      jwt.verify(resetId, process.env.JWT_SECRET);
    } catch (err) {
      await ResetPassword.deleteOne({ _id: resetRecord._id });
      return ApiResponse.unauthorized("Reset link has expired").send(res);
    }

    const user = await User.findById(resetRecord.userId);
    if (!user) {
      return ApiResponse.notFound("User not found").send(res);
    }

    user.password = password; // pre('save') hook will hash it
    await user.save();

    // Clean up the reset token
    await ResetPassword.deleteOne({ _id: resetRecord._id });

    return ApiResponse.success(null, "Password updated successfully").send(res);
  } catch (error) {
    console.error("Update Password Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

/**
 * POST /api/auth/change-password
 * Change password while logged in (any role).
 */
const updateLoggedInPasswordController = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return ApiResponse.badRequest(
        "Current password and new password are required",
      ).send(res);
    }

    if (newPassword.length < 6) {
      return ApiResponse.badRequest(
        "New password must be at least 6 characters",
      ).send(res);
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return ApiResponse.notFound("User not found").send(res);
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return ApiResponse.unauthorized("Current password is incorrect").send(
        res,
      );
    }

    user.password = newPassword; // pre('save') hook will hash it
    await user.save();

    return ApiResponse.success(null, "Password changed successfully").send(res);
  } catch (error) {
    console.error("Change Password Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

// ═══════════════════════════════════════════════════════════════
// USER MANAGEMENT CONTROLLERS (Admin-only)
// ═══════════════════════════════════════════════════════════════

/**
 * Generate next roll number for a student in a given branch.
 * Format: CSE101, CSE102, BCA101, etc.
 */
const generateRollNumber = async (branchId) => {
  const branch = await Branch.findById(branchId);
  if (!branch) {
    throw new Error("Branch not found");
  }

  const prefix = branch.branchId; // e.g., "CSE", "BCA"

  // Find the highest existing roll number for this branch
  const latestStudent = await User.findOne({
    role: "student",
    rollNumber: new RegExp(`^${prefix}\\d+$`),
  })
    .sort({ rollNumber: -1 })
    .select("rollNumber");

  let nextNumber = 101; // Start from 101

  if (latestStudent && latestStudent.rollNumber) {
    const currentNumber = parseInt(
      latestStudent.rollNumber.replace(prefix, ""),
      10,
    );
    nextNumber = currentNumber + 1;
  }

  const rollNumber = `${prefix}${nextNumber}`;

  // Verify uniqueness (edge case: manual data or deleted students)
  const exists = await User.findOne({ rollNumber });
  if (exists) {
    // Recursively find the next available
    return generateRollNumber(branchId);
  }

  return rollNumber;
};

/**
 * Generate next employee ID for admin/faculty.
 * Format: CSE-S101, ADM-S101, etc.
 */
const generateEmployeeId = async (role, branchId) => {
  let prefix = "ADM";
  if (role === "faculty") {
    const branch = await Branch.findById(branchId);
    if (!branch) {
      throw new Error("Branch not found");
    }
    prefix = branch.branchId;
  }

  const pattern = new RegExp(`^${prefix}-S\\d+$`);
  const employees = await User.find({
    role: { $in: ["admin", "faculty"] },
    employeeId: pattern,
  })
    .select("employeeId")
    .lean();

  let maxNumber = 100;
  for (const employee of employees) {
    const numericPart = parseInt(
      employee.employeeId.replace(`${prefix}-S`, ""),
      10,
    );
    if (!Number.isNaN(numericPart) && numericPart > maxNumber) {
      maxNumber = numericPart;
    }
  }

  const nextNumber = maxNumber + 1;
  const employeeId = `${prefix}-S${nextNumber}`;

  const exists = await User.findOne({
    employeeId,
    role: { $in: ["admin", "faculty"] },
  });
  if (exists) {
    return generateEmployeeId(role, branchId);
  }

  return employeeId;
};

/**
 * POST /api/users/register
 * Admin-only. Creates a new user with the specified role.
 * For students: auto-generates roll number, email is entered manually.
 */
const registerController = async (req, res) => {
  try {
    const {
      role,
      email,
      firstName,
      middleName,
      lastName,
      phone,
      gender,
      dob,
      bloodGroup,
      address,
      city,
      state,
      pincode,
      country,
      // Admin/Faculty specific
      designation,
      joiningDate,
      salary,
      isSuperAdmin,
      // Faculty/Student specific
      branchId,
      // Student specific
      batch,
    } = req.body;

    // ─── Validate common required fields ────────────────────
    if (!role || !["admin", "faculty", "student"].includes(role)) {
      return ApiResponse.badRequest(
        "Valid role is required (admin, faculty, or student)",
      ).send(res);
    }

    if (!email) {
      return ApiResponse.badRequest("Email is required").send(res);
    }

    const requiredFields = [
      "firstName",
      "lastName",
      "phone",
      "gender",
      "dob",
      "address",
      "city",
      "state",
      "pincode",
      "country",
    ];

    for (const field of requiredFields) {
      const value = req.body[field];
      if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
      ) {
        return ApiResponse.badRequest(`${field} is required`).send(res);
      }
    }

    // ─── Validate phone ─────────────────────────────────────
    const phoneStr = String(phone).trim();
    if (!/^\d{10}$/.test(phoneStr)) {
      return ApiResponse.badRequest(
        "Phone number must be exactly 10 digits",
      ).send(res);
    }

    // ─── Check duplicate email ──────────────────────────────
    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });
    if (existingUser) {
      return ApiResponse.conflict("Email already in use").send(res);
    }

    // ─── Role-specific validation ───────────────────────────
    if (role === "admin" || role === "faculty") {
      if (!designation) {
        return ApiResponse.badRequest("Designation is required").send(res);
      }
      if (!joiningDate) {
        return ApiResponse.badRequest("Joining date is required").send(res);
      }
      if (!salary) {
        return ApiResponse.badRequest("Salary is required").send(res);
      }
    }

    if (role === "faculty" || role === "student") {
      if (!branchId) {
        return ApiResponse.badRequest("Branch is required").send(res);
      }
    }

    if (role === "student") {
      if (!batch) {
        return ApiResponse.badRequest("Batch is required").send(res);
      }
    }

    // ─── Parse emergency contact (handles FormData) ─────────
    const emergencyContact = {
      name:
        req.body["emergencyContact[name]"] ||
        req.body.emergencyContact?.name ||
        "",
      relationship:
        req.body["emergencyContact[relationship]"] ||
        req.body.emergencyContact?.relationship ||
        "",
      phone:
        req.body["emergencyContact[phone]"] ||
        req.body.emergencyContact?.phone ||
        "",
    };

    let profileUrl;
    if (req.file) {
      const cloudinaryResponse = await uploadToCloudinary(req.file.path, "college_erp/profiles");
      if (cloudinaryResponse) {
        profileUrl = cloudinaryResponse.secure_url;
      }
    }

    // ─── Build user data ────────────────────────────────────
    const userData = {
      role,
      email: email.toLowerCase().trim(),
      password: `${role}123`, // Default password: admin123, faculty123, student123
      firstName: firstName.trim(),
      middleName: middleName ? middleName.trim() : undefined,
      lastName: lastName.trim(),
      phone: phoneStr,
      gender: gender.toLowerCase(),
      dob: new Date(dob),
      bloodGroup: bloodGroup || undefined,
      profile: profileUrl,
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      country: country.trim(),
      emergencyContact,
      status: "active",
    };

    // ─── Add role-specific fields ───────────────────────────
    if (role === "admin" || role === "faculty") {
      userData.employeeId = await generateEmployeeId(role, branchId);
      userData.designation = designation.trim();
      userData.joiningDate = new Date(joiningDate);
      userData.salary = Number(salary);
    }

    if (role === "admin") {
      userData.isSuperAdmin = isSuperAdmin === true || isSuperAdmin === "true";
    }

    if (role === "faculty" || role === "student") {
      userData.branchId = branchId;
    }

    if (role === "student") {
      userData.batch = Number(batch);
      // Auto-generate roll number
      userData.rollNumber = await generateRollNumber(branchId);
    }

    // ─── Create user ────────────────────────────────────────
    const user = await User.create(userData);

    const sanitizedUser = await User.findById(user._id)
      .select("-password -__v")
      .populate("branchId");

    return ApiResponse.created(
      sanitizedUser,
      `${role.charAt(0).toUpperCase() + role.slice(1)} registered successfully${
        role === "student" ? `. Roll Number: ${userData.rollNumber}` : ""
      }`,
    ).send(res);
  } catch (error) {
    console.error("Registration Error:", error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return ApiResponse.conflict(`${field} already exists`).send(res);
    }
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors)
        .map((err) => err.message)
        .join(", ");
      return ApiResponse.badRequest(messages).send(res);
    }
    return ApiResponse.internalServerError().send(res);
  }
};

/**
 * GET /api/users?role=admin|faculty|student
 * Get all users, optionally filtered by role.
 */
const getAllUsersController = async (req, res) => {
  try {
    const { role } = req.query;

    const filter = {};
    if (role && ["admin", "faculty", "student"].includes(role)) {
      filter.role = role;
    }

    const users = await User.find(filter)
      .select("-password -__v")
      .populate("branchId")
      .sort({ createdAt: -1 });

    return ApiResponse.success(users, `${users.length} user(s) found`).send(
      res,
    );
  } catch (error) {
    console.error("Get All Users Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

/**
 * PATCH /api/users/:id
 * Update a user's details (admin-only, or self-update for profile).
 */
const updateDetailsController = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Don't allow role changes via this endpoint
    delete updateData.role;
    delete updateData.password;
    delete updateData.rollNumber;
    delete updateData.employeeId;

    // Handle file upload
    if (req.file) {
      const existingUser = await User.findById(id);
      if (existingUser) {
        const cloudinaryResponse = await uploadToCloudinary(req.file.path, "college_erp/profiles");
        if (cloudinaryResponse) {
          updateData.profile = cloudinaryResponse.secure_url;
          // Delete old profile image from Cloudinary (if any)
          if (existingUser.profile) {
            await deleteFromCloudinary(existingUser.profile);
          }
        }
      }
    }

    // Handle emergency contact from FormData
    if (
      req.body["emergencyContact[name]"] ||
      req.body["emergencyContact[relationship]"] ||
      req.body["emergencyContact[phone]"]
    ) {
      updateData.emergencyContact = {
        name: req.body["emergencyContact[name]"] || "",
        relationship: req.body["emergencyContact[relationship]"] || "",
        phone: req.body["emergencyContact[phone]"] || "",
      };
      // Clean up bracket-notation keys
      delete updateData["emergencyContact[name]"];
      delete updateData["emergencyContact[relationship]"];
      delete updateData["emergencyContact[phone]"];
    }

    const user = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .select("-password -__v")
      .populate("branchId");

    if (!user) {
      return ApiResponse.notFound("User not found").send(res);
    }

    return ApiResponse.success(user, "User updated successfully").send(res);
  } catch (error) {
    console.error("Update User Error:", error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return ApiResponse.conflict(`${field} already exists`).send(res);
    }
    return ApiResponse.internalServerError().send(res);
  }
};

/**
 * DELETE /api/users/:id
 * Delete a user (admin-only).
 */
const deleteDetailsController = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (id === req.userId) {
      return ApiResponse.badRequest("You cannot delete your own account").send(
        res,
      );
    }

    const user = await User.findById(id);

    if (!user) {
      return ApiResponse.notFound("User not found").send(res);
    }

    // Delete profile image from Cloudinary
    if (user.profile) {
      await deleteFromCloudinary(user.profile);
    }

    await User.findByIdAndDelete(id);

    // Clean up related reset tokens
    await ResetPassword.deleteMany({ userId: id });

    return ApiResponse.success(
      null,
      `${user.role} '${user.firstName} ${user.lastName}' deleted successfully`,
    ).send(res);
  } catch (error) {
    console.error("Delete User Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

/**
 * POST /api/users/search/students
 * Search students by name, roll number, or branch.
 */
const searchStudentsController = async (req, res) => {
  try {
    const { searchQuery, branchId, batch } = req.body;

    const filter = { role: "student" };

    if (branchId) {
      filter.branchId = branchId;
    }

    if (batch) {
      filter.batch = Number(batch);
    }

    if (searchQuery) {
      const regex = new RegExp(searchQuery, "i");
      filter.$or = [
        { firstName: regex },
        { lastName: regex },
        { rollNumber: regex },
        { email: regex },
      ];
    }

    const students = await User.find(filter)
      .select("-password -__v")
      .populate("branchId")
      .sort({ rollNumber: 1 });

    return ApiResponse.success(
      students,
      `${students.length} student(s) found`,
    ).send(res);
  } catch (error) {
    console.error("Search Students Error:", error);
    return ApiResponse.internalServerError().send(res);
  }
};

module.exports = {
  loginController,
  getMyDetailsController,
  sendForgetPasswordEmail,
  updatePasswordHandler,
  updateLoggedInPasswordController,
  logoutController,
  registerController,
  getAllUsersController,
  updateDetailsController,
  deleteDetailsController,
  searchStudentsController,
};
