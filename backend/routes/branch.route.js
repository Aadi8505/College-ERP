const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const {
  getBranchController,
  addBranchController,
  updateBranchController,
  deleteBranchController,
} = require("../controllers/branch.controller");

const requireRole = require("../middlewares/role.middleware");

router.get("/", auth, getBranchController);
router.post("/", auth, requireRole("admin"), addBranchController);
router.patch("/:id", auth, requireRole("admin"), updateBranchController);
router.delete("/:id", auth, requireRole("admin"), deleteBranchController);

module.exports = router;
