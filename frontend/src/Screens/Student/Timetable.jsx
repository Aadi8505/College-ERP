import React, { useEffect, useState } from "react";
import { FiDownload } from "react-icons/fi";
import Heading from "../../components/Heading";
import { useSelector } from "react-redux";
import axiosWrapper from "../../utils/AxiosWrapper";
import { toast } from "react-hot-toast";
import Loading from "../../components/Loading";
import { getMediaUrl } from "../../utils/media";

const Timetable = () => {
  const [timetable, setTimetable] = useState(null);
  const [allTimetables, setAllTimetables] = useState([]);
  const userData = useSelector((state) => state.userData);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    const getTimetable = async () => {
      try {
        setDataLoading(true);
        const response = await axiosWrapper.get(
          `/timetable?batch=${userData.batch}&branch=${userData.branchId?._id}`,
          {
            headers: {},
          }
        );
        if (response.data.success && response.data.data.length > 0) {
          setTimetable(response.data.data[0]);
          setAllTimetables(response.data.data);
        } else {
          setTimetable(null);
          setAllTimetables([]);
        }
      } catch (error) {
        if (error && error.response && error.response.status === 404) {
          setTimetable(null);
          setAllTimetables([]);
          return;
        }
        toast.error(
          error.response?.data?.message || "Error fetching timetable"
        );
        console.error(error);
      } finally {
        setDataLoading(false);
      }
    };
    userData && getTimetable();
  }, [userData, userData.branchId, userData.batch]);

  return (
    <div className="w-full mx-auto mt-10 flex justify-center items-start flex-col mb-10 px-4">
      <div className="flex justify-between items-center w-full mb-8">
        <Heading title={`Timetable - Batch ${userData.batch}`} />
      </div>

      {dataLoading && <Loading />}

      {!dataLoading && !timetable && (
        <div className="w-full bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-lg font-medium text-yellow-800">
            📋 No Timetable Available
          </p>
          <p className="text-sm text-yellow-700 mt-2">
            Your timetable for Batch {userData.batch} will be available soon. Please check back later.
          </p>
        </div>
      )}

      {!dataLoading && timetable && (
        <div className="w-full space-y-6">
          {/* Main Timetable Card */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white">
                  {userData.branchId?.name || "Branch"} - Batch {userData.batch}
                </h3>
                <p className="text-blue-100 text-sm mt-1">
                  Exam Schedule & Class Timings
                </p>
              </div>
              <button
                onClick={() =>
                  window.open(getMediaUrl(timetable.link))
                }
                className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors"
              >
                <FiDownload size={20} />
                Download
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Batch</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {userData.batch}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Branch</p>
                  <p className="text-2xl font-bold text-green-600 line-clamp-2">
                    {userData.branchId?.name || "N/A"}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Last Updated</p>
                  <p className="text-lg font-bold text-purple-600">
                    {timetable.updatedAt
                      ? new Date(timetable.updatedAt).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-4">
                  📄 Timetable Preview
                </h4>
                <div className="flex justify-center">
                  <img
                    className="rounded-lg shadow-md max-w-full h-auto border border-gray-300"
                    src={getMediaUrl(timetable.link)}
                    alt="timetable"
                    style={{ maxHeight: "600px" }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Other Batches Notice */}
          {allTimetables.length > 1 && (
            <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4">
              <p className="text-blue-800">
                <span className="font-semibold">ℹ️ Note:</span> You're viewing the timetable
                for your current batch. Contact your faculty if you need timetables from other batches.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Timetable;
