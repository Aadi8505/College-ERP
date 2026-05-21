const Material = require("../models/material.model");
const ApiResponse = require("../utils/ApiResponse");
const { uploadToCloudinary, deleteFromCloudinary } = require("../utils/cloudinary");

const getMaterialsController = async (req, res) => {
  try {
    const { subject, faculty, batch, branch, type } = req.query;
    let query = {};

    if (subject) query.subject = subject;
    if (faculty) query.faculty = faculty;
    if (batch) query.batch = batch;
    if (branch) query.branch = branch;
    if (type) query.type = type;

    const materials = await Material.find(query)
      .populate("subject")
      .populate("faculty")
      .populate("branch")
      .sort({ createdAt: -1 });

    if (!materials || materials.length === 0) {
      return ApiResponse.notFound("No materials found").send(res);
    }

    return ApiResponse.success(
      materials,
      "Materials retrieved successfully",
    ).send(res);
  } catch (error) {
    console.error("Get Materials Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const addMaterialController = async (req, res) => {
  try {
    const { title, subject, batch, branch, type } = req.body;

    if (!title || !subject || !batch || !branch || !type) {
      return ApiResponse.badRequest("All fields are required").send(res);
    }

    if (!req.file) {
      return ApiResponse.badRequest("Material file is required").send(res);
    }

    if (!["notes", "assignment", "syllabus", "other"].includes(type)) {
      return ApiResponse.badRequest("Invalid material type").send(res);
    }

    // Upload file to Cloudinary
    const cloudinaryResponse = await uploadToCloudinary(req.file.path, "college_erp/materials");
    if (!cloudinaryResponse) {
      return ApiResponse.internalServerError("Failed to upload material to cloud").send(res);
    }

    const material = await Material.create({
      title,
      subject,
      faculty: req.userId, // From auth middleware
      batch,
      branch,
      type,
      file: cloudinaryResponse.secure_url,
    });

    const populatedMaterial = await Material.findById(material._id)
      .populate("subject")
      .populate("faculty")
      .populate("branch");

    return ApiResponse.created(
      populatedMaterial,
      "Material added successfully",
    ).send(res);
  } catch (error) {
    console.error("Add Material Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const updateMaterialController = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subject, batch, branch, type } = req.body;

    if (!id) {
      return ApiResponse.badRequest("Material ID is required").send(res);
    }

    const material = await Material.findById(id);

    if (!material) {
      return ApiResponse.notFound("Material not found").send(res);
    }

    if (material.faculty.toString() !== req.userId) {
      return ApiResponse.unauthorized(
        "You are not authorized to update this material",
      ).send(res);
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (subject) updateData.subject = subject;
    if (batch) updateData.batch = batch;
    if (branch) updateData.branch = branch;
    if (type) {
      if (!["notes", "assignment", "syllabus", "other"].includes(type)) {
        return ApiResponse.badRequest("Invalid material type").send(res);
      }
      updateData.type = type;
    }
    
    if (req.file) {
      // Upload new file to Cloudinary
      const cloudinaryResponse = await uploadToCloudinary(req.file.path, "college_erp/materials");
      if (!cloudinaryResponse) {
        return ApiResponse.internalServerError("Failed to upload new material to cloud").send(res);
      }
      updateData.file = cloudinaryResponse.secure_url;

      // Delete old file from Cloudinary
      await deleteFromCloudinary(material.file);
    }

    const updatedMaterial = await Material.findByIdAndUpdate(id, updateData, {
      new: true,
    })
      .populate("subject")
      .populate("faculty")
      .populate("branch");

    return ApiResponse.success(
      updatedMaterial,
      "Material updated successfully",
    ).send(res);
  } catch (error) {
    console.error("Update Material Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const deleteMaterialController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return ApiResponse.badRequest("Material ID is required").send(res);
    }

    const material = await Material.findById(id);

    if (!material) {
      return ApiResponse.notFound("Material not found").send(res);
    }

    if (material.faculty.toString() !== req.userId) {
      return ApiResponse.unauthorized(
        "You are not authorized to delete this material",
      ).send(res);
    }

    // Delete file from Cloudinary
    await deleteFromCloudinary(material.file);

    await Material.findByIdAndDelete(id);

    return ApiResponse.success(null, "Material deleted successfully").send(res);
  } catch (error) {
    console.error("Delete Material Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

module.exports = {
  getMaterialsController,
  addMaterialController,
  updateMaterialController,
  deleteMaterialController,
};
