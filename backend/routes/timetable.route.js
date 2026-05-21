require("dotenv").config();
const express = require("express");
const router = express.Router();
const upload = require("../middlewares/multer.middleware");
const auth = require("../middlewares/auth.middleware");
const {
  getTimetableController,
  addTimetableController,
  updateTimetableController,
  deleteTimetableController,
} = require("../controllers/timetable.controller");

const requireRole = require("../middlewares/role.middleware");

router.get("/", auth, getTimetableController);

router.post("/", auth, requireRole("admin", "faculty"), upload.single("file"), addTimetableController);

router.put("/:id", auth, requireRole("admin", "faculty"), upload.single("file"), updateTimetableController);

router.delete("/:id", auth, requireRole("admin", "faculty"), deleteTimetableController);

module.exports = router;
