const express = require("express");
const {
  getAllExamsController,
  addExamController,
  updateExamController,
  deleteExamController,
} = require("../controllers/exam.controller");
const auth = require("../middlewares/auth.middleware");
const router = express.Router();
const upload = require("../middlewares/multer.middleware");

const requireRole = require("../middlewares/role.middleware");

router.get("/", auth, getAllExamsController);
router.post("/", auth, requireRole("admin"), upload.single("file"), addExamController);
router.patch("/:id", auth, requireRole("admin"), upload.single("file"), updateExamController);
router.delete("/:id", auth, requireRole("admin"), deleteExamController);

module.exports = router;
