const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const requireRole = require("../middlewares/role.middleware");
const upload = require("../middlewares/multer.middleware");
const ApiResponse = require("../utils/ApiResponse");
const {
  registerController,
  getAllUsersController,
  updateDetailsController,
  deleteDetailsController,
  searchStudentsController,
} = require("../controllers/user.controller");

// Helper middleware to allow either admin OR the user themselves to update details
const canUpdateUser = (req, res, next) => {
  if (req.userRole === "admin" || req.userId === req.params.id) {
    next();
  } else {
    return ApiResponse.forbidden("You do not have permission to update this user's details").send(res);
  }
};

// Admin-only endpoints for user creation and listing
router.post("/register", auth, requireRole("admin"), upload.single("file"), registerController);
router.get("/", auth, requireRole("admin"), getAllUsersController);
router.delete("/:id", auth, requireRole("admin"), deleteDetailsController);

// Admin OR self-update for updating user details
router.patch("/:id", auth, requireRole("admin", "faculty", "student"), canUpdateUser, upload.single("file"), updateDetailsController);

// Search students (accessible to admin, faculty, and student roles)
router.post("/search/students", auth, searchStudentsController);

module.exports = router;
