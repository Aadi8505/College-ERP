const express = require("express");
const {
  getSubjectController,
  addSubjectController,
  deleteSubjectController,
  updateSubjectController,
} = require("../controllers/subject.controller");
const router = express.Router();
const auth = require("../middlewares/auth.middleware");
const requireRole = require("../middlewares/role.middleware");

router.get("/", auth, getSubjectController);
router.post("/", auth, requireRole("admin"), addSubjectController);
router.delete("/:id", auth, requireRole("admin"), deleteSubjectController);
router.put("/:id", auth, requireRole("admin"), updateSubjectController);

module.exports = router;
