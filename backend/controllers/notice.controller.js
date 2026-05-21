const Notice = require("../models/notice.model");
const User = require("../models/user.model");
const ApiResponse = require("../utils/ApiResponse");

const getNoticeController = async (req, res) => {
  try {
    let query = {};

    if (req.userId) {
      const user = await User.findById(req.userId).select("role");
      if (!user) {
        return ApiResponse.notFound("User not found").send(res);
      }

      if (user.role === "student") {
        query.type = { $in: ["student", "both"] };
      } else if (user.role === "faculty") {
        query.type = { $in: ["faculty", "both"] };
      }
    }

    const notices = await Notice.find(query);
    if (!notices || notices.length === 0) {
      return ApiResponse.error("No Notices Found", 404).send(res);
    }
    return ApiResponse.success(notices, "All Notices Loaded!").send(res);
  } catch (error) {
    return ApiResponse.error(error.message).send(res);
  }
};

const addNoticeController = async (req, res) => {
  const { title, description, type, link } = req.body;

  if (!title || !description || !type) {
    return ApiResponse.error("All fields are required", 400).send(res);
  }

  try {
    const notice = await Notice.create({
      title,
      type,
      description,
      link,
    });

    return ApiResponse.created(notice, "Notice Added Successfully!").send(res);
  } catch (error) {
    return ApiResponse.error(error.message).send(res);
  }
};

const updateNoticeController = async (req, res) => {
  const { title, description, type, link } = req.body;
  const updateFields = {};

  if (title) updateFields.title = title;
  if (description) updateFields.description = description;
  if (type) updateFields.type = type;
  if (link) updateFields.link = link;

  if (Object.keys(updateFields).length === 0) {
    return ApiResponse.error("No fields provided for update", 400).send(res);
  }

  try {
    let notice = await Notice.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
    });

    if (!notice) {
      return ApiResponse.error("Notice Not Found!", 404).send(res);
    }

    return ApiResponse.success(notice, "Notice Updated Successfully!").send(
      res,
    );
  } catch (error) {
    return ApiResponse.error(error.message).send(res);
  }
};

const deleteNoticeController = async (req, res) => {
  try {
    if (!req.params.id) {
      return ApiResponse.error("Notice ID is required", 400).send(res);
    }

    let notice = await Notice.findByIdAndDelete(req.params.id);
    if (!notice) {
      return ApiResponse.error("Notice Not Found!", 404).send(res);
    }
    return ApiResponse.success(null, "Notice Deleted Successfully!").send(res);
  } catch (error) {
    return ApiResponse.error(error.message).send(res);
  }
};

module.exports = {
  getNoticeController,
  addNoticeController,
  updateNoticeController,
  deleteNoticeController,
};
