const Exam = require("../models/exam.model");
const Marks = require("../models/marks.model");
const ApiResponse = require("../utils/ApiResponse");
const { uploadToCloudinary, deleteFromCloudinary } = require("../utils/cloudinary");

const getAllExamsController = async (req, res) => {
  try {
    const { search = "", examType = "", batch = "" } = req.query;

    let query = {};

    if (batch) query.batch = batch;
    if (examType) query.examType = examType;

    const exams = await Exam.find(query);

    if (!exams || exams.length === 0) {
      return ApiResponse.error("No Exams Found", 404).send(res);
    }

    return ApiResponse.success(exams, "All Exams Loaded!").send(res);
  } catch (error) {
    return ApiResponse.error(error.message).send(res);
  }
};

const addExamController = async (req, res) => {
  try {
    const formData = req.body;
    if (req.file) {
      const cloudinaryResponse = await uploadToCloudinary(req.file.path, "college_erp/exams");
      if (!cloudinaryResponse) {
        return ApiResponse.error("Failed to upload exam timetable to cloud").send(res);
      }
      formData.timetableLink = cloudinaryResponse.secure_url;
    }
    const exam = await Exam.create(formData);
    return ApiResponse.success(exam, "Exam Added Successfully!").send(res);
  } catch (error) {
    return ApiResponse.error(error.message).send(res);
  }
};

const updateExamController = async (req, res) => {
  try {
    const formData = req.body;
    const existingExam = await Exam.findById(req.params.id);
    if (!existingExam) {
      return ApiResponse.error("Exam Not Found!", 404).send(res);
    }

    if (req.file) {
      const cloudinaryResponse = await uploadToCloudinary(req.file.path, "college_erp/exams");
      if (!cloudinaryResponse) {
        return ApiResponse.error("Failed to upload new exam timetable to cloud").send(res);
      }
      formData.timetableLink = cloudinaryResponse.secure_url;
      
      // Delete old file from Cloudinary
      await deleteFromCloudinary(existingExam.timetableLink);
    }

    const exam = await Exam.findByIdAndUpdate(req.params.id, formData, {
      new: true,
    });
    return ApiResponse.success(exam, "Exam Updated Successfully!").send(res);
  } catch (error) {
    return ApiResponse.error(error.message).send(res);
  }
};

const deleteExamController = async (req, res) => {
  try {
    const examId = req.params.id;
    const marksCount = await Marks.countDocuments({ examId });

    if (marksCount > 0) {
      return ApiResponse.conflict(
        `Cannot delete: ${marksCount} marks records are linked to this exam.`,
      ).send(res);
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return ApiResponse.error("Exam Not Found!", 404).send(res);
    }

    // Delete associated file from Cloudinary
    await deleteFromCloudinary(exam.timetableLink);

    await Exam.findByIdAndDelete(examId);
    return ApiResponse.success(exam, "Exam Deleted Successfully!").send(res);
  } catch (error) {
    return ApiResponse.error(error.message).send(res);
  }
};

module.exports = {
  getAllExamsController,
  addExamController,
  updateExamController,
  deleteExamController,
};
