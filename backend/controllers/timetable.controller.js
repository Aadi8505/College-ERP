const Timetable = require("../models/timetable.model");
const ApiResponse = require("../utils/ApiResponse");
const { uploadToCloudinary, deleteFromCloudinary } = require("../utils/cloudinary");

const getTimetableController = async (req, res) => {
  try {
    const { batch, branch } = req.query;
    let query = {};

    if (batch) query.batch = batch;
    if (branch) query.branch = branch;

    const timetables = await Timetable.find(query)
      .populate("branch")
      .sort({ createdAt: -1 });

    if (!timetables || timetables.length === 0) {
      return ApiResponse.notFound("No timetables found").send(res);
    }

    return ApiResponse.success(
      timetables,
      "Timetables retrieved successfully",
    ).send(res);
  } catch (error) {
    console.error("Get Timetable Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const addTimetableController = async (req, res) => {
  try {
    const { batch, branch } = req.body;

    if (!batch || !branch) {
      return ApiResponse.badRequest("Batch and branch are required").send(res);
    }

    if (!req.file) {
      return ApiResponse.badRequest("Timetable file is required").send(res);
    }

    let timetable = await Timetable.findOne({ batch, branch });

    // Upload timetable file to Cloudinary
    const cloudinaryResponse = await uploadToCloudinary(req.file.path, "college_erp/timetables");
    if (!cloudinaryResponse) {
      return ApiResponse.internalServerError("Failed to upload timetable to cloud").send(res);
    }

    if (timetable) {
      // Delete old timetable file from Cloudinary (if any)
      await deleteFromCloudinary(timetable.link);

      timetable = await Timetable.findByIdAndUpdate(
        timetable._id,
        {
          batch,
          branch,
          link: cloudinaryResponse.secure_url,
        },
        { new: true },
      );
      return ApiResponse.success(
        timetable,
        "Timetable updated successfully",
      ).send(res);
    }

    timetable = await Timetable.create({
      batch,
      branch,
      link: cloudinaryResponse.secure_url,
    });

    return ApiResponse.created(timetable, "Timetable added successfully").send(
      res,
    );
  } catch (error) {
    console.error("Add Timetable Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const updateTimetableController = async (req, res) => {
  try {
    const { id } = req.params;
    const { batch, branch } = req.body;

    if (!id) {
      return ApiResponse.badRequest("Timetable ID is required").send(res);
    }

    const existingTimetable = await Timetable.findById(id);
    if (!existingTimetable) {
      return ApiResponse.notFound("Timetable not found").send(res);
    }

    let newLink;
    if (req.file) {
      // Upload new file to Cloudinary
      const cloudinaryResponse = await uploadToCloudinary(req.file.path, "college_erp/timetables");
      if (!cloudinaryResponse) {
        return ApiResponse.internalServerError("Failed to upload timetable to cloud").send(res);
      }
      newLink = cloudinaryResponse.secure_url;

      // Delete old file from Cloudinary
      await deleteFromCloudinary(existingTimetable.link);
    }

    const timetable = await Timetable.findByIdAndUpdate(
      id,
      {
        batch,
        branch,
        link: newLink || undefined,
      },
      { new: true },
    );

    if (!timetable) {
      return ApiResponse.notFound("Timetable not found").send(res);
    }

    return ApiResponse.success(
      timetable,
      "Timetable updated successfully",
    ).send(res);
  } catch (error) {
    console.error("Update Timetable Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

const deleteTimetableController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return ApiResponse.badRequest("Timetable ID is required").send(res);
    }

    const timetable = await Timetable.findById(id);

    if (!timetable) {
      return ApiResponse.notFound("Timetable not found").send(res);
    }

    // Delete associated file from Cloudinary
    await deleteFromCloudinary(timetable.link);

    await Timetable.findByIdAndDelete(id);

    return ApiResponse.success(null, "Timetable deleted successfully").send(
      res,
    );
  } catch (error) {
    console.error("Delete Timetable Error: ", error);
    return ApiResponse.internalServerError().send(res);
  }
};

module.exports = {
  getTimetableController,
  addTimetableController,
  updateTimetableController,
  deleteTimetableController,
};
