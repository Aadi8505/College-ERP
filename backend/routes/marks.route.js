const express = require("express");
const {
  getMarksController,
  addMarksController,
  deleteMarksController,
  addBulkMarksController,
  getStudentsWithMarksController,
  getStudentMarksController,
} = require("../controllers/marks.controller");
const auth = require("../middlewares/auth.middleware");
const router = express.Router();
const upload = require("../middlewares/multer.middleware");

const requireRole = require("../middlewares/role.middleware");

router.get("/", auth, requireRole("admin", "faculty"), getMarksController);
router.get("/students", auth, requireRole("admin", "faculty"), getStudentsWithMarksController);
router.get("/student", auth, getStudentMarksController);
router.post("/", auth, requireRole("admin", "faculty"), addMarksController);
router.post("/bulk", auth, requireRole("admin", "faculty"), addBulkMarksController);
router.delete("/:id", auth, requireRole("admin", "faculty"), deleteMarksController);

module.exports = router;
