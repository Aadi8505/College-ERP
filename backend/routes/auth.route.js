const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const {
  loginController,
  getMyDetailsController,
  sendForgetPasswordEmail,
  updatePasswordHandler,
  updateLoggedInPasswordController,
  logoutController,
} = require("../controllers/user.controller");

// Public routes (no auth required)
router.post("/login", loginController);
router.post("/forget-password", sendForgetPasswordEmail);
router.post("/update-password/:resetId", updatePasswordHandler);
router.post("/logout", logoutController);

// Protected routes (any authenticated user)
router.get("/my-details", auth, getMyDetailsController);
router.post("/change-password", auth, updateLoggedInPasswordController);

module.exports = router;
