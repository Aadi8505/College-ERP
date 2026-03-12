const studentDetails = require("../../models/details/student-details.model");
const resetToken = require("../../models/reset-password.model");
const bcrypt = require("bcryptjs");
const ApiResponse = require("../../utils/ApiResponse");
const jwt = require("jsonwebtoken");
const sendResetMail = require("../../utils/SendMail");

const loginStudentController = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await studentDetails.findOne({ email });

    if (!user) {
      return ApiResponse.notFound("User not found").send(res);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return ApiResponse.unauthorized("Invalid password").send(res);
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    return ApiResponse.success({ token }, "Login successful").send(res);
  } catch (error) {
    console.error("Login Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const getAllDetailsController = async (req, res) => {
  try {
    const users = await studentDetails
      .find()
      .select("-__v -password")
      .populate("branchId");

    if (!users || users.length === 0) {
      return ApiResponse.notFound("No Student Found").send(res);
    }

    return ApiResponse.success(users, "Student Details Found!").send(res);
  } catch (error) {
    console.error("Get Details Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const registerStudentController = async (req, res) => {
  try {
    // Log incoming data for debugging
    console.log(
      "Student Registration - Incoming Data:",
      JSON.stringify(req.body, null, 2),
    );

    const {
      enrollmentNo,
      firstName,
      middleName,
      lastName,
      phone,
      semester,
      branchId,
      gender,
      dob,
      bloodGroup,
      address,
      city,
      state,
      pincode,
      country,
    } = req.body;

    // Validate all required fields
    const requiredFields = [
      "enrollmentNo",
      "firstName",
      "middleName",
      "lastName",
      "phone",
      "semester",
      "branchId",
      "gender",
      "dob",
      "address",
      "city",
      "state",
      "pincode",
      "country",
    ];

    for (const field of requiredFields) {
      let value = req.body[field];

      // Handle different data types and conversions
      if (value === undefined || value === null) {
        console.error(
          `❌ Validation Failed: ${field} is undefined/null`,
          value,
        );
        return ApiResponse.badRequest(`${field} is required`).send(res);
      }

      // Convert to string and trim if necessary
      value = String(value).trim();

      if (value === "" || value === "undefined" || value === "null") {
        console.error(`❌ Validation Failed: ${field} is empty`, {
          field,
          received: req.body[field],
          stringified: value,
        });
        return ApiResponse.badRequest(`${field} cannot be empty`).send(res);
      }
    }

    console.log("✅ All required fields passed validation");

    // Validate enrollment number - check from req.body directly
    const enrollmentNoValue = req.body.enrollmentNo || enrollmentNo;
    console.log("📋 EnrollmentNo check:", {
      collected: enrollmentNo,
      fromReqBody: req.body.enrollmentNo,
      final: enrollmentNoValue,
    });

    if (!enrollmentNoValue) {
      return ApiResponse.badRequest(
        "Enrollment number is missing after validation",
      ).send(res);
    }

    const enrollmentStr = String(enrollmentNoValue).trim();
    console.log("🔢 Enrollment string validation:", {
      enrollmentStr,
      isNumeric: /^\d+$/.test(enrollmentStr),
    });

    if (!/^\d+$/.test(enrollmentStr)) {
      return ApiResponse.badRequest(
        `Enrollment number must contain only digits, received: "${enrollmentStr}"`,
      ).send(res);
    }

    // Validate phone format
    const phoneStr = String(phone).trim();
    console.log("📞 Phone validation:", {
      phone,
      phoneStr,
      isValid: /^\d{10}$/.test(phoneStr),
    });
    if (!/^\d{10}$/.test(phoneStr)) {
      return ApiResponse.badRequest(
        `Phone number must be exactly 10 digits, received: "${phoneStr}" (${phoneStr?.length || 0} characters)`,
      ).send(res);
    }

    console.log("✅ Phone validation passed");

    // Check if enrollment number already exists
    const existingStudent = await studentDetails.findOne({
      enrollmentNo: Number(enrollmentStr),
    });
    if (existingStudent) {
      console.warn(`⚠️ Enrollment number already exists: ${enrollmentStr}`);
      return ApiResponse.conflict("Enrollment number already in use").send(res);
    }

    console.log("✅ Enrollment number is unique");

    // Parse nested emergencyContact fields from FormData
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

    const profile = req.file ? req.file.filename : null;
    const email = `${enrollmentStr}@gmail.com`;

    // Convert enrollmentNo to number and semester to number
    const studentData = {
      enrollmentNo: Number(enrollmentStr),
      firstName: firstName.trim(),
      middleName: middleName.trim(),
      lastName: lastName.trim(),
      phone: phoneStr,
      semester: Number(semester),
      branchId,
      gender: gender.toLowerCase(),
      dob: new Date(dob),
      bloodGroup: bloodGroup || null,
      profile,
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      country: country.trim(),
      emergencyContact,
      email,
      password: "student123",
    };

    const student = await studentDetails.create(studentData);

    const sanitizedUser = await studentDetails
      .findById(student._id)
      .select("-password -__v");

    return ApiResponse.created(sanitizedUser, "Student Details Added!").send(
      res,
    );
  } catch (error) {
    console.error("Add Details Error:", error);
    if (error.code === 11000) {
      return ApiResponse.conflict(
        "Student with this enrollment number already exists",
      ).send(res);
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
const getMyDetailsController = async (req, res) => {
  try {
    const user = await studentDetails
      .findById(req.userId)
      .select("-password -__v")
      .populate("branchId");

    if (!user) {
      return ApiResponse.notFound("User not found").send(res);
    }

    return ApiResponse.success(user, "My Details Found!").send(res);
  } catch (error) {
    console.error("Get My Details Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const updateDetailsController = async (req, res) => {
  try {
    if (!req.params.id) {
      return ApiResponse.badRequest("Student ID is required").send(res);
    }

    const updateData = { ...req.body };
    const { email, phone, password, enrollmentNo } = updateData;

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return ApiResponse.badRequest("Invalid email format").send(res);
    }

    if (phone && !/^\d{10}$/.test(phone)) {
      return ApiResponse.badRequest("Phone number must be 10 digits").send(res);
    }

    if (password && password.length < 8) {
      return ApiResponse.badRequest(
        "Password must be at least 8 characters long",
      ).send(res);
    }

    if (phone) {
      const existingStudent = await studentDetails.findOne({
        _id: { $ne: req.params.id },
        phone: phone,
      });

      if (existingStudent) {
        return ApiResponse.conflict("Phone number already in use").send(res);
      }
    }

    if (email) {
      const existingStudent = await studentDetails.findOne({
        _id: { $ne: req.params.id },
        email: email,
      });

      if (existingStudent) {
        return ApiResponse.conflict("Email already in use").send(res);
      }
    }

    if (enrollmentNo) {
      const existingStudent = await studentDetails.findOne({
        _id: { $ne: req.params.id },
        enrollmentNo: enrollmentNo,
      });

      if (existingStudent) {
        return ApiResponse.conflict("Enrollment number already in use").send(
          res,
        );
      }
    }

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    if (req.file) {
      updateData.profile = req.file.filename;
    }

    if (updateData.dob) {
      updateData.dob = new Date(updateData.dob);
    }
    if (updateData.joiningDate) {
      updateData.joiningDate = new Date(updateData.joiningDate);
    }

    const updatedUser = await studentDetails
      .findByIdAndUpdate(req.params.id, updateData, { new: true })
      .select("-__v -password");

    if (!updatedUser) {
      return ApiResponse.notFound("Student not found").send(res);
    }

    return ApiResponse.success(updatedUser, "Updated Successfully!").send(res);
  } catch (error) {
    console.error("Update Details Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const deleteDetailsController = async (req, res) => {
  try {
    if (!req.params.id) {
      return ApiResponse.badRequest("Student ID is required").send(res);
    }

    const user = await studentDetails.findById(req.params.id);

    if (!user) {
      return ApiResponse.notFound("No Student Found").send(res);
    }

    await studentDetails.findByIdAndDelete(req.params.id);

    return ApiResponse.success(null, "Deleted Successfully!").send(res);
  } catch (error) {
    console.error("Delete Details Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const sendForgetPasswordEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return ApiResponse.badRequest("Email is required").send(res);
    }

    const user = await studentDetails.findOne({ email });

    if (!user) {
      return ApiResponse.notFound("No Student Found").send(res);
    }
    const resetTkn = jwt.sign(
      {
        _id: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "10m",
      },
    );

    await resetToken.deleteMany({
      type: "StudentDetails",
      userId: user._id,
    });

    const resetId = await resetToken.create({
      resetToken: resetTkn,
      type: "StudentDetails",
      userId: user._id,
    });

    await sendResetMail(user.email, resetId._id, "student");

    return ApiResponse.success(null, "Reset Mail Send Successful").send(res);
  } catch (error) {
    console.error("Send Reset Mail Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const updatePasswordHandler = async (req, res) => {
  try {
    const { resetId } = req.params;
    const { password } = req.body;
    if (!resetId || !password) {
      return ApiResponse.badRequest("Password and ResetId is Required").send(
        res,
      );
    }

    const resetTkn = await resetToken.findById(resetId);

    if (!resetTkn) {
      return ApiResponse.notFound("No Reset Request Found").send(res);
    }

    const verifyToken = await jwt.verify(
      resetTkn.resetToken,
      process.env.JWT_SECRET,
    );

    if (!verifyToken) {
      return ApiResponse.notFound("Token Expired").send(res);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await studentDetails.findByIdAndUpdate(verifyToken._id, {
      password: hashedPassword,
    });

    await resetToken.deleteMany({
      type: "StudentDetails",
      userId: verifyToken._id,
    });

    return ApiResponse.success(null, "Password Updated!").send(res);
  } catch (error) {
    console.error("Update Password Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const searchStudentsController = async (req, res) => {
  try {
    const { enrollmentNo, name, semester, branch } = req.body;
    let query = {};

    if (!enrollmentNo && !name && !semester && !branch) {
      return ApiResponse.badRequest("Select at least one filter").send(res);
    }

    if (enrollmentNo) {
      query.enrollmentNo = enrollmentNo;
    }

    if (name) {
      query.$or = [
        { firstName: { $regex: name, $options: "i" } },
        { middleName: { $regex: name, $options: "i" } },
        { lastName: { $regex: name, $options: "i" } },
      ];
    }

    if (semester) {
      query.semester = semester;
    }

    if (branch) {
      query.branchId = branch;
    }

    const students = await studentDetails
      .find(query)
      .select("-password -__v")
      .populate("branchId")
      .sort({ enrollmentNo: 1 });

    if (!students || students.length === 0) {
      return ApiResponse.notFound("No students found").send(res);
    }

    return ApiResponse.success(students, "Students found successfully").send(
      res,
    );
  } catch (error) {
    console.error("Search Students Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const updateLoggedInPasswordController = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;

    if (!currentPassword || !newPassword) {
      return ApiResponse.badRequest(
        "Current password and new password are required",
      ).send(res);
    }

    if (newPassword.length < 8) {
      return ApiResponse.badRequest(
        "New password must be at least 8 characters long",
      ).send(res);
    }

    const user = await studentDetails.findById(userId);
    if (!user) {
      return ApiResponse.notFound("User not found").send(res);
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      return ApiResponse.unauthorized("Current password is incorrect").send(
        res,
      );
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await studentDetails.findByIdAndUpdate(userId, {
      password: hashedPassword,
    });

    return ApiResponse.success(null, "Password updated successfully").send(res);
  } catch (error) {
    console.error("Update Password Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

module.exports = {
  loginStudentController,
  getAllDetailsController,
  registerStudentController,
  updateDetailsController,
  deleteDetailsController,
  getMyDetailsController,
  sendForgetPasswordEmail,
  updatePasswordHandler,
  searchStudentsController,
  updateLoggedInPasswordController,
};
