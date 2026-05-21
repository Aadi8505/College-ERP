import React, { useEffect, useState } from "react";
import { MdOutlineDelete, MdEdit, MdLink } from "react-icons/md";
import { IoMdAdd, IoMdClose } from "react-icons/io";
import Heading from "../../components/Heading";
import toast from "react-hot-toast";
import axiosWrapper from "../../utils/AxiosWrapper";
import DeleteConfirm from "../../components/DeleteConfirm";
import CustomButton from "../../components/CustomButton";
import { getMediaUrl } from "../../utils/media";

const AddTimetableModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  branches,
}) => {
  const [formData, setFormData] = useState({
    branch: initialData?.branch?._id || "",
    batch: initialData?.batch || "",
    file: null,
    previewUrl: initialData?.link ? getMediaUrl(initialData.link) : "",
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }
  };

  const handleSubmit = () => {
    if (!formData.branch || !formData.batch || (!initialData && !formData.file)) {
      toast.error("Please fill all required fields and select a file");
      return;
    }
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 px-4">
      <div className="bg-white p-8 rounded-lg w-full max-w-[600px] max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {initialData ? "Edit Timetable" : "Upload Timetable"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {initialData
                ? "Update the timetable details"
                : "Add a new timetable for students"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <IoMdClose className="text-3xl" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Branch Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Branch <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.branch}
              onChange={(e) =>
                setFormData({ ...formData, branch: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="">Choose a branch...</option>
              {branches?.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Batch Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Batch <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.batch}
              onChange={(e) =>
                setFormData({ ...formData, batch: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="">Choose a batch...</option>
              {[23, 24, 25, 26].map((batch) => (
                <option key={batch} value={batch}>
                  Batch {batch}
                </option>
              ))}
            </select>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Timetable Image {!initialData && <span className="text-red-500">*</span>}
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer"
              onClick={() => document.getElementById("file-input").click()}
            >
              <input
                id="file-input"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {!formData.previewUrl ? (
                <div>
                  <p className="text-gray-600 font-medium">📁 Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
                </div>
              ) : (
                <p className="text-green-600 font-medium">✓ File selected</p>
              )}
            </div>
          </div>

          {/* Preview */}
          {formData.previewUrl && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">Preview:</p>
              <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                <img
                  src={formData.previewUrl}
                  alt="Preview"
                  className="max-w-full h-auto max-h-80 mx-auto"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <CustomButton variant="secondary" onClick={onClose}>
              Cancel
            </CustomButton>
            <CustomButton variant="primary" onClick={handleSubmit}>
              {initialData ? "Update Timetable" : "Upload Timetable"}
            </CustomButton>
          </div>
        </div>
      </div>
    </div>
  );
};

const Timetable = () => {
  const [branch, setBranch] = useState();
  const [timetables, setTimetables] = useState([]);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedTimetableId, setSelectedTimetableId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTimetable, setEditingTimetable] = useState(null);

  useEffect(() => {
    getBranchHandler();
    getTimetablesHandler();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getBranchHandler = async () => {
    try {
      const response = await axiosWrapper.get(`/branch`, {
        headers: {},
      });
      if (response.data.success) {
        setBranch(response.data.data);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Error fetching branches");
    }
  };

  const getTimetablesHandler = async () => {
    try {
      const response = await axiosWrapper.get(`/timetable`, {
        headers: {},
      });
      if (response.data.success) {
        setTimetables(response.data.data);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Error fetching timetables");
    }
  };

  const handleSubmitTimetable = async (formData) => {
    const headers = {
      "Content-Type": "multipart/form-data",
    };

    const submitData = new FormData();
    submitData.append("branch", formData.branch);
    submitData.append("batch", formData.batch);
    if (formData.file) {
      submitData.append("file", formData.file);
    }

    try {
      toast.loading(
        editingTimetable ? "Updating Timetable" : "Adding Timetable"
      );

      let response;
      if (editingTimetable) {
        response = await axiosWrapper.put(
          `/timetable/${editingTimetable._id}`,
          submitData,
          { headers }
        );
      } else {
        response = await axiosWrapper.post("/timetable", submitData, {
          headers,
        });
      }

      toast.dismiss();
      if (response.data.success) {
        toast.success(response.data.message);
        getTimetablesHandler();
        setShowAddModal(false);
        setEditingTimetable(null);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || "Error with timetable");
    }
  };

  const deleteTimetableHandler = async (id) => {
    setIsDeleteConfirmOpen(true);
    setSelectedTimetableId(id);
  };

  const confirmDelete = async () => {
    try {
      toast.loading("Deleting Timetable");
      const response = await axiosWrapper.delete(
        `/timetable/${selectedTimetableId}`,
        {}
      );
      toast.dismiss();
      if (response.data.success) {
        toast.success("Timetable deleted successfully");
        setIsDeleteConfirmOpen(false);
        getTimetablesHandler();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.dismiss();
      toast.error(error.response?.data?.message || "Error deleting timetable");
    }
  };

  const editTimetableHandler = (timetable) => {
    setEditingTimetable(timetable);
    setShowAddModal(true);
  };

  return (
    <div className="w-full mx-auto mt-10 flex justify-center items-start flex-col mb-10 relative px-4">
      <div className="flex justify-between items-center w-full mb-8">
        <Heading title="Timetable Management" />
        <CustomButton onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
          <IoMdAdd className="text-2xl" />
          <span>Add Timetable</span>
        </CustomButton>
      </div>

      {timetables.length === 0 ? (
        <div className="w-full bg-yellow-50 border-2 border-yellow-200 rounded-lg p-8 text-center">
          <p className="text-lg font-medium text-yellow-800">
            📋 No Timetables Available
          </p>
          <p className="text-sm text-yellow-700 mt-2">
            Start by adding a timetable for your branch and batch.
          </p>
        </div>
      ) : (
        <div className="w-full space-y-6">
          {/* Grid View of Timetables */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {timetables.filter(Boolean).map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3">
                  <h3 className="text-lg font-bold text-white">
                    {item.branch?.name || "Unknown Branch"}
                  </h3>
                  <p className="text-blue-100 text-sm">
                    Batch {item.batch}
                  </p>
                </div>

                {/* Thumbnail Preview */}
                <div className="relative h-48 bg-gray-100 overflow-hidden">
                  <img
                    src={getMediaUrl(item.link)}
                    alt="Timetable preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
                    <a
                      href={getMediaUrl(item.link)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-semibold flex items-center gap-2"
                    >
                      <MdLink size={20} />
                      View Full
                    </a>
                  </div>
                </div>

                {/* Details */}
                <div className="px-4 py-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600 mb-3">
                    📅 {new Date(item.createdAt).toLocaleDateString()} • Updated:{" "}
                    {new Date(item.updatedAt).toLocaleDateString()}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <CustomButton
                      variant="secondary"
                      onClick={() => editTimetableHandler(item)}
                      className="flex-1 text-sm flex items-center justify-center gap-1"
                    >
                      <MdEdit size={16} />
                      Edit
                    </CustomButton>
                    <CustomButton
                      variant="danger"
                      onClick={() => deleteTimetableHandler(item._id)}
                      className="flex-1 text-sm flex items-center justify-center gap-1"
                    >
                      <MdOutlineDelete size={16} />
                      Delete
                    </CustomButton>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Table View for detailed info */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📊 Detailed View
            </h3>
            <div className="overflow-x-auto bg-white rounded-lg shadow-md">
              <table className="text-sm w-full">
                <thead>
                  <tr className="bg-blue-500 text-white">
                    <th className="py-4 px-6 text-left font-semibold">Branch</th>
                    <th className="py-4 px-6 text-left font-semibold">Batch</th>
                    <th className="py-4 px-6 text-left font-semibold">Created</th>
                    <th className="py-4 px-6 text-left font-semibold">Updated</th>
                    <th className="py-4 px-6 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {timetables.filter(Boolean).map((item, index) => (
                    <tr
                      key={index}
                      className={`border-b ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } hover:bg-blue-50 transition-colors`}
                    >
                      <td className="py-4 px-6 font-medium">
                        {item.branch?.name || "Unknown"}
                      </td>
                      <td className="py-4 px-6">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                          Batch {item.batch}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6">
                        {new Date(item.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-center flex justify-center gap-3">
                        <a
                          href={getMediaUrl(item.link)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="View full timetable"
                        >
                          <MdLink size={20} />
                        </a>
                        <button
                          onClick={() => editTimetableHandler(item)}
                          className="text-green-600 hover:text-green-800 transition-colors"
                          title="Edit timetable"
                        >
                          <MdEdit size={20} />
                        </button>
                        <button
                          onClick={() => deleteTimetableHandler(item._id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Delete timetable"
                        >
                          <MdOutlineDelete size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <AddTimetableModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingTimetable(null);
        }}
        onSubmit={handleSubmitTimetable}
        initialData={editingTimetable}
        branches={branch}
      />

      <DeleteConfirm
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        message="Are you sure you want to delete this timetable?"
      />
    </div>
  );
};

export default Timetable;
