const express = require("express");
const {
  getNoticeController,
  addNoticeController,
  updateNoticeController,
  deleteNoticeController,
} = require("../controllers/notice.controller");
const auth = require("../middlewares/auth.middleware");
const router = express.Router();

const requireRole = require("../middlewares/role.middleware");

router.get("/", auth, getNoticeController);
router.post("/", auth, requireRole("admin"), addNoticeController);
router.put("/:id", auth, requireRole("admin"), updateNoticeController);
router.delete("/:id", auth, requireRole("admin"), deleteNoticeController);

module.exports = router;
