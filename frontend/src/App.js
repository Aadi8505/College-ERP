import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import mystore from "./redux/store";
import ProtectedRoute from "./components/ProtectedRoute";
import Loading from "./components/Loading";

const Login = lazy(() => import("./Screens/Login"));
const ForgetPassword = lazy(() => import("./Screens/ForgetPassword"));
const UpdatePassword = lazy(() => import("./Screens/UpdatePassword"));
const StudentHome = lazy(() => import("./Screens/Student/Home"));
const FacultyHome = lazy(() => import("./Screens/Faculty/Home"));
const AdminHome = lazy(() => import("./Screens/Admin/Home"));

const App = () => {
  return (
    <>
      <Provider store={mystore}>
        <Router>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/forget-password" element={<ForgetPassword />} />
              <Route
                path="/:type/update-password/:resetId"
                element={<UpdatePassword />}
              />
              <Route
                path="student"
                element={
                  <ProtectedRoute allowedRoles={["student"]}>
                    <StudentHome />
                  </ProtectedRoute>
                }
              />
              <Route
                path="faculty"
                element={
                  <ProtectedRoute allowedRoles={["faculty"]}>
                    <FacultyHome />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminHome />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </Router>
      </Provider>
    </>
  );
};

export default App;
