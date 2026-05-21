const express = require("express");
const router = express.Router();
const upload = require("../middlewares/multer.middleware");
const auth = require("../middlewares/auth.middleware");
const {
  getMaterialsController,
  addMaterialController,
  updateMaterialController,
  deleteMaterialController,
} = require("../controllers/material.controller");

const requireRole = require("../middlewares/role.middleware");

router.get("/", auth, getMaterialsController);
router.post("/", auth, requireRole("admin", "faculty"), upload.single("file"), addMaterialController);
router.put("/:id", auth, requireRole("admin", "faculty"), upload.single("file"), updateMaterialController);
router.delete("/:id", auth, requireRole("admin", "faculty"), deleteMaterialController);

module.exports = router;
