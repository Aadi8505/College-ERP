const Marks = require("../models/marks.model");
const User = require("../models/user.model");
const ApiResponse = require("../utils/ApiResponse");

const getMarksController = async (req, res) => {
  try {
    const { studentId, batch, examId } = req.query;

    const query = {};
    if (studentId) {
      query.studentId = studentId;
    }
    if (batch) {
      query.batch = Number(batch);
    }
    if (examId) {
      query.examId = examId;
    }

    const marks = await Marks.find(query)
      .populate("subjectId", "name")
      .populate("studentId", "firstName lastName rollNumber")
      .populate("examId", "name examType totalMarks");

    if (!marks || marks.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No marks found for the specified criteria",
      });
    }

    res.json({
      success: true,
      message: "Marks retrieved successfully",
      data: marks,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const addMarksController = async (req, res) => {
  try {
    const { studentId, batch, branch, marks } = req.body;

    if (!studentId || !batch || !branch || !marks || !Array.isArray(marks)) {
      return res.status(400).json({
        success: false,
        message: "Invalid input data",
      });
    }

    const student = await User.findOne({ _id: studentId, role: "student" });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const subjectId = marks[0]?.subjectId || null;
    const examId = marks[0]?.examId || null;
    const marksObtained = marks[0]?.marksObtained || 0;

    let existingMarks = await Marks.findOne({
      studentId,
      batch,
      subjectId,
      examId,
    });

    if (existingMarks) {
      existingMarks.marksObtained = marksObtained;
      await existingMarks.save();
    } else {
      existingMarks = await Marks.create({
        studentId,
        batch,
        subjectId,
        examId,
        marksObtained,
      });
    }

    res.json({
      success: true,
      message: "Marks updated successfully",
      data: existingMarks,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const deleteMarksController = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedMarks = await Marks.findByIdAndDelete(id);

    if (!deletedMarks) {
      return res.status(404).json({
        success: false,
        message: "Marks not found",
      });
    }

    res.json({
      success: true,
      message: "Marks deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const addBulkMarksController = async (req, res) => {
  try {
    const { marks, examId, subjectId, batch } = req.body;

    if (!marks || !Array.isArray(marks) || !examId || !subjectId || !batch) {
      return ApiResponse.badRequest(
        "Invalid input data. Required: marks array, examId, subjectId, and batch",
      ).send(res);
    }

    if (marks.length === 0) {
      return ApiResponse.badRequest("Marks array cannot be empty").send(res);
    }

    const operations = marks.map((markData) => ({
      updateOne: {
        filter: {
          studentId: markData.studentId,
          examId,
          subjectId,
          batch,
        },
        update: {
          $set: {
            marksObtained: markData.obtainedMarks,
            studentId: markData.studentId,
            examId,
            subjectId,
            batch,
          },
        },
        upsert: true,
      },
    }));

    const result = await Marks.bulkWrite(operations);

    return ApiResponse.success(
      {
        modified: result.modifiedCount,
        inserted: result.upsertedCount,
      },
      "Marks saved successfully",
    ).send(res);
  } catch (error) {
    console.error("Error in addBulkMarksController:", error);
    return ApiResponse.error(error.message || "Error submitting marks").send(
      res,
    );
  }
};

const getStudentsWithMarksController = async (req, res) => {
  try {
    const { branch, subject, batch, examId } = req.query;

    if (!branch || !subject || !batch || !examId) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required parameters: branch, subject, batch, and examId are required",
      });
    }

    const students = await User.find({
      role: "student",
      branchId: branch,
      batch: Number(batch),
    }).select("_id rollNumber firstName lastName email");

    if (!students || students.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No students found for the specified criteria",
      });
    }

    const marks = await Marks.find({
      studentId: { $in: students.map((s) => s._id) },
      examId,
      subjectId: subject,
      batch: Number(batch),
    });

    const studentsWithMarks = students.map((student) => {
      const studentMarks = marks.find(
        (m) => m.studentId.toString() === student._id.toString(),
      );
      return {
        ...student.toObject(),
        obtainedMarks: studentMarks ? studentMarks.marksObtained : 0,
      };
    });

    res.json({
      success: true,
      message: "Students retrieved successfully with marks",
      data: studentsWithMarks,
    });
  } catch (error) {
    console.error("Error in getStudentsWithMarksController:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error retrieving students with marks",
    });
  }
};

const getStudentMarksController = async (req, res) => {
  try {
    const { batch } = req.query;
    const studentId = req.userId;

    if (!batch) {
      return res.status(400).json({
        success: false,
        message: "Batch is required",
      });
    }

    const marks = await Marks.find({
      studentId,
      batch: Number(batch),
    })
      .populate("subjectId", "name")
      .populate("examId", "name examType totalMarks");

    if (!marks || marks.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No marks found for this batch",
      });
    }

    res.json({
      success: true,
      message: "Marks retrieved successfully",
      data: marks,
    });
  } catch (error) {
    console.error("Error in getStudentMarksController:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error retrieving marks",
    });
  }
};

module.exports = {
  getMarksController,
  addMarksController,
  deleteMarksController,
  addBulkMarksController,
  getStudentsWithMarksController,
  getStudentMarksController,
};
