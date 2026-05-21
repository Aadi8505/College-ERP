const Branch = require("../models/branch.model");
const Subject = require("../models/subject.model");
const User = require("../models/user.model");
const ApiResponse = require("../utils/ApiResponse");

const getBranchController = async (req, res, next) => {
  try {
    const { search = "" } = req.query;

    const branches = await Branch.find({
      $or: [
        { name: { $regex: search, $options: "i" } },
        { branchId: { $regex: search, $options: "i" } },
      ],
    });
    if (!branches || branches.length === 0) {
      return ApiResponse.error("No Branches Found", 404).send(res);
    }

    return ApiResponse.success(branches, "All Branches Loaded!").send(res);
  } catch (error) {
    return ApiResponse.error(error.message).send(res);
  }
};

const addBranchController = async (req, res, next) => {
  let { name, branchId } = req.body;
  try {
    let existingBranch = await Branch.findOne({
      $or: [{ name }, { branchId }],
    });

    if (existingBranch) {
      return ApiResponse.error(
        "Branch with this name or ID already exists!",
        409,
      ).send(res);
    }

    const newBranch = await Branch.create(req.body);
    return ApiResponse.created(newBranch, "Branch Added Successfully!").send(
      res,
    );
  } catch (error) {
    return ApiResponse.error(error.message).send(res);
  }
};

const updateBranchController = async (req, res, next) => {
  try {
    const { name, branchId } = req.body;

    if (name || branchId) {
      const existingBranch = await Branch.findOne({
        _id: { $ne: req.params.id },
        $or: [{ name: name || undefined }, { branchId: branchId || undefined }],
      });

      if (existingBranch) {
        return ApiResponse.error(
          "Branch with this name or ID already exists!",
          409,
        ).send(res);
      }
    }

    let branch = await Branch.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!branch) {
      return ApiResponse.error("Branch Not Found!", 404).send(res);
    }

    return ApiResponse.success(branch, "Branch Updated Successfully!").send(
      res,
    );
  } catch (error) {
    return ApiResponse.error(error.message).send(res);
  }
};

const deleteBranchController = async (req, res, next) => {
  try {
    const branchId = req.params.id;

    let branch = await Branch.findById(branchId);
    if (!branch) {
      return ApiResponse.error("Branch Not Found!", 404).send(res);
    }

    const [students, faculty, subjects] = await Promise.all([
      User.countDocuments({ branchId, role: "student" }),
      User.countDocuments({ branchId, role: "faculty" }),
      Subject.countDocuments({ branch: branchId }),
    ]);

    if (students + faculty + subjects > 0) {
      return ApiResponse.conflict(
        `Cannot delete: ${students} students, ${faculty} faculty, and ${subjects} subjects are linked to this branch.`,
      ).send(res);
    }

    await Branch.findByIdAndDelete(branchId);
    return ApiResponse.success(null, "Branch Deleted Successfully!").send(res);
  } catch (error) {
    return ApiResponse.error(error.message).send(res);
  }
};

module.exports = {
  getBranchController,
  addBranchController,
  updateBranchController,
  deleteBranchController,
};
