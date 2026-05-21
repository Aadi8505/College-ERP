import React, { Suspense, lazy, useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { toast, Toaster } from "react-hot-toast";
import { useDispatch } from "react-redux";
import { setUserData } from "../../redux/actions";
import axiosWrapper from "../../utils/AxiosWrapper";
import { useNavigate, useLocation } from "react-router-dom";
import Loading from "../../components/Loading";

const Notice = lazy(() => import("../Notice"));
const Timetable = lazy(() => import("./Timetable"));
const Material = lazy(() => import("./Material"));
const Profile = lazy(() => import("./Profile"));
const Exam = lazy(() => import("../Exam"));
const ViewMarks = lazy(() => import("./ViewMarks"));

const MENU_ITEMS = [
  { id: "home", label: "Home", component: null },
  { id: "timetable", label: "Timetable", component: Timetable },
  { id: "material", label: "Material", component: Material },
  { id: "notice", label: "Notice", component: Notice },
  { id: "exam", label: "Exam", component: Exam },
  { id: "marks", label: "Marks", component: ViewMarks },
];

const Home = () => {
  const [selectedMenu, setSelectedMenu] = useState("home");
  const [profileData, setProfileData] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const fetchUserDetails = async () => {
    setIsLoading(true);
    try {
      toast.loading("Loading user details...");
      const response = await axiosWrapper.get(`/auth/my-details`);
      if (response.data.success) {
        const user = response.data.data;
        if (user.role !== "student") {
          toast.error("Access denied. Redirecting to your dashboard...");
          setTimeout(() => {
            if (user.role === "admin") {
              navigate("/admin");
            } else if (user.role === "faculty") {
              navigate("/faculty");
            } else {
              navigate("/");
            }
          }, 1500);
          return;
        }
        setProfileData(user);
        dispatch(setUserData(user));
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || "Error fetching user details"
      );
    } finally {
      setIsLoading(false);
      toast.dismiss();
    }
  };

  useEffect(() => {
    fetchUserDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const getMenuItemClass = (menuId) => {
    const isSelected = selectedMenu.toLowerCase() === menuId.toLowerCase();
    return `
      text-center px-6 py-3 cursor-pointer
      font-medium text-sm w-full
      rounded-md
      transition-all duration-300 ease-in-out
      ${
        isSelected
          ? "bg-gradient-to-r from-blue-400 to-blue-600 text-white shadow-lg transform -translate-y-1"
          : "bg-blue-50 text-blue-700 hover:bg-blue-100"
      }
    `;
  };

  const renderContent = () => {
    return (
      <Suspense fallback={<Loading />}>
        {selectedMenu === "home" && profileData ? (
          <Profile profileData={profileData} />
        ) : (
          (() => {
            const MenuItem = MENU_ITEMS.find(
              (item) => item.label.toLowerCase() === selectedMenu.toLowerCase()
            )?.component;
            return MenuItem && <MenuItem />;
          })()
        )}
      </Suspense>
    );
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const pathMenuId = urlParams.get("page") || "home";
    const validMenu = MENU_ITEMS.find((item) => item.id === pathMenuId);
    setSelectedMenu(validMenu ? validMenu.id : "home");
  }, [location.search, location.pathname]);

  const handleMenuClick = (menuId) => {
    setSelectedMenu(menuId);
    navigate(`/student?page=${menuId}`);
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

  if (!profileData || profileData.role !== "student") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4 bg-white p-8 rounded-xl shadow-md border border-slate-100 max-w-md mx-4">
          <div className="text-red-500 text-5xl mb-2">⚠️</div>
          <h2 className="text-xl font-bold text-slate-800">Access Denied</h2>
          <p className="text-slate-500 text-sm">
            You do not have permission to access the student dashboard. Redirecting...
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
              onClick={() => handleMenuClick(item.id)}
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
