const Subject = require("../models/subject.model");
const Marks = require("../models/marks.model");
const ApiResponse = require("../utils/ApiResponse");

const getSubjectController = async (req, res) => {
  try {
    const { branch, batch } = req.query;
    let query = {};
    if (branch) query.branch = branch;
    if (batch) query.batch = batch;
    let subjects = await Subject.find(query).populate("branch");
    if (!subjects || subjects.length === 0) {
      return ApiResponse.error("No Subjects Found", 404).send(res);
    }
    return ApiResponse.success(subjects, "All Subjects Loaded!").send(res);
  } catch (error) {
    return ApiResponse.error(error.message).send(res);
  }
};

const addSubjectController = async (req, res) => {
  const { name, code, branch, batch, credits } = req.body;

  if (!name || !code || !branch || !batch || !credits) {
    return ApiResponse.error("All fields are required", 400).send(res);
  }

  try {
    let subject = await Subject.findOne({ code });
    if (subject) {
      return ApiResponse.error("Subject Already Exists", 409).send(res);
    }

    const newSubject = await Subject.create({
      name,
      code,
      branch,
      batch,
      credits,
    });

    return ApiResponse.created(newSubject, "Subject Added Successfully!").send(
      res,
    );
  } catch (error) {
    return ApiResponse.error(error.message).send(res);
  }
};

const updateSubjectController = async (req, res) => {
  const { name, code, branch, batch, credits } = req.body;
  const updateFields = {};

  if (name) updateFields.name = name;
  if (code) updateFields.code = code;
  if (branch) updateFields.branch = branch;
  if (batch) updateFields.batch = batch;
  if (credits) updateFields.credits = credits;

  if (Object.keys(updateFields).length === 0) {
    return ApiResponse.error("No fields provided for update", 400).send(res);
  }

  try {
    let subject = await Subject.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
    });

    if (!subject) {
      return ApiResponse.error("Subject Not Found!", 404).send(res);
    }

    return ApiResponse.success(subject, "Subject Updated Successfully!").send(
      res,
    );
  } catch (error) {
    return ApiResponse.error(error.message).send(res);
  }
};

const deleteSubjectController = async (req, res) => {
  try {
    if (!req.params.id) {
      return ApiResponse.error("Subject ID is required", 400).send(res);
    }

    const subjectId = req.params.id;
    const marksCount = await Marks.countDocuments({ subjectId });

    if (marksCount > 0) {
      return ApiResponse.conflict(
        `Cannot delete: ${marksCount} marks records are linked to this subject.`,
      ).send(res);
    }

    let subject = await Subject.findByIdAndDelete(subjectId);
    if (!subject) {
      return ApiResponse.error("Subject Not Found!", 404).send(res);
    }
    return ApiResponse.success(null, "Subject Deleted Successfully!").send(res);
  } catch (error) {
    return ApiResponse.error(error.message).send(res);
  }
};

module.exports = {
  getSubjectController,
  addSubjectController,
  deleteSubjectController,
  updateSubjectController,
};
