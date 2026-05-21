import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { MdOutlineDelete, MdEdit, MdDownload } from "react-icons/md";
import { IoMdAdd } from "react-icons/io";
import { AiOutlineClose } from "react-icons/ai";
import axiosWrapper from "../utils/AxiosWrapper";
import Heading from "../components/Heading";
import DeleteConfirm from "../components/DeleteConfirm";
import CustomButton from "../components/CustomButton";
import { FiUpload } from "react-icons/fi";
import { useSelector } from "react-redux";
import Loading from "../components/Loading";
import { getMediaUrl } from "../utils/media";

const Exam = () => {
  const [data, setData] = useState({
    name: "",
    date: "",
    batch: "",
    examType: "mid",
    timetableLink: "",
    totalMarks: "",
  });
  const [exams, setExams] = useState();
  const [showModal, setShowModal] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [file, setFile] = useState(null);
  const userData = useSelector((state) => state.userData);
  const userRole = userData?.role || "";
  const [processLoading, setProcessLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    getExamsHandler();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getExamsHandler = async () => {
    try {
      setDataLoading(true);
      let link = "/exam";
      if (userData.batch) {
        link = `/exam?batch=${userData.batch}`;
      }
      const response = await axiosWrapper.get(link, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.data.success) {
        setExams(response.data.data);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setExams([]);
        return;
      }
      console.error(error);
      toast.error(error.response?.data?.message || "Error fetching exams");
    } finally {
      setDataLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const addExamHandler = async () => {
    if (
      !data.name ||
      !data.date ||
      !data.batch ||
      !data.examType ||
      !data.totalMarks
    ) {
      toast.dismiss();
      toast.error("Please fill all the fields");
      return;
    }
    try {
      setProcessLoading(true);
      toast.loading(isEditing ? "Updating Exam" : "Adding Exam");
      const headers = {
        "Content-Type": "multipart/form-data",
      };
      let response;
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("date", data.date);
      formData.append("batch", data.batch);
      formData.append("examType", data.examType);
      formData.append("totalMarks", data.totalMarks);
      if (isEditing) {
        formData.append("file", file);
        response = await axiosWrapper.patch(
          `/exam/${selectedExamId}`,
          formData,
          {
            headers: headers,
          }
        );
      } else {
        formData.append("file", file);
        response = await axiosWrapper.post(`/exam`, formData, {
          headers: headers,
        });
      }
      toast.dismiss();
      if (response.data.success) {
        toast.success(response.data.message);
        resetForm();
        getExamsHandler();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response.data.message);
    } finally {
      setProcessLoading(false);
    }
  };

  const resetForm = () => {
    setData({
      name: "",
      date: "",
      batch: "",
      examType: "mid",
      timetableLink: "",
      totalMarks: "",
    });
    setShowModal(false);
    setIsEditing(false);
    setSelectedExamId(null);
  };

  const deleteExamHandler = async (id) => {
    setIsDeleteConfirmOpen(true);
    setSelectedExamId(id);
  };

  const editExamHandler = (exam) => {
    setData({
      name: exam.name,
      date: new Date(exam.date).toISOString().split("T")[0],
      batch: exam.batch,
      examType: exam.examType,
      timetableLink: exam.timetableLink,
      totalMarks: exam.totalMarks,
    });
    setSelectedExamId(exam._id);
    setIsEditing(true);
    setShowModal(true);
  };

  const confirmDelete = async () => {
    try {
      toast.loading("Deleting Exam");
      const headers = {
        "Content-Type": "multipart/form-data",
      };
      const response = await axiosWrapper.delete(`/exam/${selectedExamId}`, {
        headers: headers,
      });
      toast.dismiss();
      if (response.data.success) {
        toast.success("Exam has been deleted successfully");
        setIsDeleteConfirmOpen(false);
        getExamsHandler();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response.data.message);
    }
  };

  return (
    <div className="w-full mx-auto mt-10 flex justify-center items-start flex-col mb-10">
      <div className="flex justify-between items-center w-full">
        <Heading title="Exam Details" />
        {!dataLoading && userRole !== "student" && (
          <CustomButton onClick={() => setShowModal(true)}>
            <IoMdAdd className="text-2xl" />
          </CustomButton>
        )}
      </div>

      {!dataLoading ? (
        <div className="mt-8 w-full space-y-8">
          {/* Table View for Students */}
          {userRole === "student" && (
            <div>
              {exams && exams.length > 0 ? (
                <>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    📋 Your Exams
                  </h3>
                  <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                    <table className="text-sm w-full">
                      <thead>
                        <tr className="bg-blue-500 text-white">
                          <th className="py-4 px-6 text-left font-semibold">
                            Exam Name
                          </th>
                          <th className="py-4 px-6 text-left font-semibold">
                            Date
                          </th>
                          <th className="py-4 px-6 text-left font-semibold">
                            Batch
                          </th>
                          <th className="py-4 px-6 text-left font-semibold">
                            Type
                          </th>
                          <th className="py-4 px-6 text-left font-semibold">
                            Total Marks
                          </th>
                          <th className="py-4 px-6 text-left font-semibold">
                            Schedule
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {exams.map((item, index) => (
                          <tr
                            key={index}
                            className={`border-b ${
                              index % 2 === 0 ? "bg-white" : "bg-gray-50"
                            } hover:bg-blue-50 transition-colors`}
                          >
                            <td className="py-4 px-6 font-medium text-gray-800">
                              {item.name}
                            </td>
                            <td className="py-4 px-6">
                              {new Date(item.date).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-6">
                              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                                Batch {item.batch}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  item.examType === "mid"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {item.examType === "mid"
                                  ? "Mid Term"
                                  : "End Term"}
                              </span>
                            </td>
                            <td className="py-4 px-6 font-semibold text-gray-800">
                              {item.totalMarks}
                            </td>
                            <td className="py-4 px-6">
                              {item.timetableLink ? (
                                <a
                                  href={getMediaUrl(item.timetableLink)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                                >
                                  <MdDownload size={16} />
                                  Download
                                </a>
                              ) : (
                                <span className="text-gray-400 text-sm">
                                  No file
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-8 text-center">
                  <p className="text-lg font-medium text-yellow-800">
                    📋 No Exams Available
                  </p>
                  <p className="text-sm text-yellow-700 mt-2">
                    There are no upcoming exams scheduled for your batch at
                    this moment.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Table View for Admin/Faculty */}
          {userRole !== "student" && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                📊 All Exams
              </h3>
              <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="text-sm w-full">
                  <thead>
                    <tr className="bg-blue-500 text-white">
                      <th className="py-4 px-6 text-left font-semibold">
                        Exam Name
                      </th>
                      <th className="py-4 px-6 text-left font-semibold">Date</th>
                      <th className="py-4 px-6 text-left font-semibold">
                        Batch
                      </th>
                      <th className="py-4 px-6 text-left font-semibold">
                        Type
                      </th>
                      <th className="py-4 px-6 text-left font-semibold">
                        Marks
                      </th>
                      <th className="py-4 px-6 text-left font-semibold">
                        Schedule
                      </th>
                      <th className="py-4 px-6 text-center font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {exams && exams.length > 0 ? (
                      exams.map((item, index) => (
                        <tr
                          key={index}
                          className={`border-b ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          } hover:bg-blue-50 transition-colors`}
                        >
                          <td className="py-4 px-6 font-medium text-gray-800">
                            {item.name}
                          </td>
                          <td className="py-4 px-6">
                            {new Date(item.date).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-6">
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                              Batch {item.batch}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                item.examType === "mid"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {item.examType === "mid"
                                ? "Mid Term"
                                : "End Term"}
                            </span>
                          </td>
                          <td className="py-4 px-6">{item.totalMarks}</td>
                          <td className="py-4 px-6">
                            {item.timetableLink ? (
                              <a
                                href={getMediaUrl(item.timetableLink)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                              >
                                <MdDownload size={16} />
                                Download
                              </a>
                            ) : (
                              <span className="text-gray-400 text-sm">
                                No file
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-center flex justify-center gap-2">
                            <CustomButton
                              variant="secondary"
                              className="!p-2"
                              onClick={() => editExamHandler(item)}
                            >
                              <MdEdit size={18} />
                            </CustomButton>
                            <CustomButton
                              variant="danger"
                              className="!p-2"
                              onClick={() => deleteExamHandler(item._id)}
                            >
                              <MdOutlineDelete size={18} />
                            </CustomButton>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="7"
                          className="text-center text-base py-10 text-gray-500"
                        >
                          No exams found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <Loading />
      )}

      {/* Add/Edit Exam Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  {isEditing ? "Edit Exam" : "Create New Exam"}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {isEditing
                    ? "Update exam details and schedule"
                    : "Add a new exam with schedule details"}
                </p>
              </div>
              <CustomButton onClick={resetForm} variant="secondary" className="!p-2">
                <AiOutlineClose size={24} />
              </CustomButton>
            </div>

            <div className="space-y-5">
              {/* Exam Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Exam Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="e.g., Data Structures Midterm"
                  required
                />
              </div>

              {/* Date and Batch */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Exam Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={data.date}
                    onChange={(e) =>
                      setData({ ...data, date: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Batch <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="batch"
                    value={data.batch}
                    onChange={(e) =>
                      setData({ ...data, batch: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="">Select Batch</option>
                    {[23, 24, 25, 26].map((b) => (
                      <option key={b} value={b}>
                        Batch {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Exam Type and Total Marks */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Exam Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={data.examType}
                    onChange={(e) =>
                      setData({ ...data, examType: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="mid">📚 Mid Term</option>
                    <option value="end">🏆 End Term</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Total Marks <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={data.totalMarks}
                    onChange={(e) =>
                      setData({ ...data, totalMarks: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="e.g., 100"
                    required
                  />
                </div>
              </div>

              {/* Exam Schedule File */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Exam Schedule File <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  📋 Upload the exam schedule/timetable image (PNG, JPG, etc.) that
                  will be visible to students
                </p>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer bg-gray-50 hover:bg-blue-50"
                  onClick={() => document.getElementById("exam-file-input").click()}
                >
                  <input
                    id="exam-file-input"
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    required={!isEditing}
                  />
                  {!file && !data.timetableLink ? (
                    <div>
                      <FiUpload className="text-4xl text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 font-medium">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-green-600 font-medium">
                        ✓{" "}
                        {file
                          ? file.name
                          : "Schedule already uploaded"}
                      </p>
                      {file && (
                        <CustomButton
                          onClick={(e) => {
                            e.stopPropagation();
                            setFile(null);
                          }}
                          variant="danger"
                          className="!p-2 mt-2"
                        >
                          <AiOutlineClose size={20} />
                          Remove
                        </CustomButton>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <CustomButton onClick={resetForm} variant="secondary">
                  Cancel
                </CustomButton>
                <CustomButton
                  onClick={addExamHandler}
                  disabled={processLoading}
                  className="flex items-center gap-2"
                >
                  {processLoading ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      {isEditing ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>{isEditing ? "Update Exam" : "Create Exam"}</>
                  )}
                </CustomButton>
              </div>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirm
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        message="Are you sure you want to delete this exam?"
      />
    </div>
  );
};

export default Exam;
