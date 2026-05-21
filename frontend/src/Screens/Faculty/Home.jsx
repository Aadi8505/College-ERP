import React, { Suspense, lazy, useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { toast, Toaster } from "react-hot-toast";
import { useDispatch } from "react-redux";
import { setUserData } from "../../redux/actions";
import axiosWrapper from "../../utils/AxiosWrapper";
import { useNavigate } from "react-router-dom";
import Loading from "../../components/Loading";

const Notice = lazy(() => import("../Notice"));
const Timetable = lazy(() => import("./Timetable"));
const Material = lazy(() => import("./Material"));
const StudentFinder = lazy(() => import("./StudentFinder"));
const Profile = lazy(() => import("./Profile"));
const Marks = lazy(() => import("./AddMarks"));
const Exam = lazy(() => import("../Exam"));

const MENU_ITEMS = [
  { id: "home", label: "Home", component: null },
  { id: "timetable", label: "Timetable", component: Timetable },
  { id: "material", label: "Material", component: Material },
  { id: "notice", label: "Notice", component: Notice },
  { id: "student info", label: "Student Info", component: StudentFinder },
  { id: "marks", label: "Marks", component: Marks },
  { id: "exam", label: "Exam", component: Exam },
];

const Home = () => {
  const [selectedMenu, setSelectedMenu] = useState("Home");
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserDetails = async () => {
      setIsLoading(true);
      try {
        const response = await axiosWrapper.get("/auth/my-details");

        if (response.data.success) {
          const user = response.data.data;
          if (user.role !== "faculty") {
            toast.error("Access denied. Redirecting to your dashboard...");
            setTimeout(() => {
              if (user.role === "admin") {
                navigate("/admin");
              } else if (user.role === "student") {
                navigate("/student");
              } else {
                navigate("/");
              }
            }, 1500);
            return;
          }
          setProfileData(user);
          dispatch(setUserData(user));
        }
      } catch (error) {
        toast.error("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserDetails();
  }, [dispatch, navigate]);

  const getMenuItemClass = (menuId) => {
    const isSelected = selectedMenu.toLowerCase() === menuId.toLowerCase();
    return `text-center px-6 py-3 cursor-pointer font-medium text-sm w-full rounded-md ${
      isSelected
        ? "bg-blue-500 text-white"
        : "bg-blue-50 text-blue-700 hover:bg-blue-100"
    }`;
  };

  const renderContent = () => {
    return (
      <Suspense fallback={<Loading />}>
        {selectedMenu === "Home" && profileData ? (
          <Profile profileData={profileData} />
        ) : (
          (() => {
            const menuItem = MENU_ITEMS.find(
              (item) => item.label.toLowerCase() === selectedMenu.toLowerCase()
            );
            if (menuItem && menuItem.component) {
              const Component = menuItem.component;
              return <Component />;
            }
            return null;
          })()
        )}
      </Suspense>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-slate-600 font-medium">Verifying authorization...</p>
        </div>
        <Toaster position="bottom-center" />
      </div>
    );
  }

  if (!profileData || profileData.role !== "faculty") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4 bg-white p-8 rounded-xl shadow-md border border-slate-100 max-w-md mx-4">
          <div className="text-red-500 text-5xl mb-2">⚠️</div>
          <h2 className="text-xl font-bold text-slate-800">Access Denied</h2>
          <p className="text-slate-500 text-sm">
            You do not have permission to access the faculty dashboard. Redirecting...
          </p>
        </div>
        <Toaster position="bottom-center" />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto">
        <ul className="flex justify-evenly items-center gap-10 w-full mx-auto my-8">
          {MENU_ITEMS.map((item) => (
            <li
              key={item.id}
              className={getMenuItemClass(item.id)}
              onClick={() => setSelectedMenu(item.label)}
            >
              {item.label}
            </li>
          ))}
        </ul>

        {renderContent()}
      </div>
      <Toaster position="bottom-center" />
    </>
  );
};

export default Home;
