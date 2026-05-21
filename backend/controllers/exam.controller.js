const Exam = require("../models/exam.model");
const Marks = require("../models/marks.model");
const ApiResponse = require("../utils/ApiResponse");

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
      formData.timetableLink = req.file.filename;
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
    if (req.file) {
      formData.timetableLink = req.file.filename;
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

    const exam = await Exam.findByIdAndDelete(examId);
    if (!exam) {
      return ApiResponse.error("Exam Not Found!", 404).send(res);
    }

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
