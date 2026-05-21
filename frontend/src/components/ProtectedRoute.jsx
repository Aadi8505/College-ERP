import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axiosWrapper from "../utils/AxiosWrapper";
import Loading from "./Loading";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await axiosWrapper.get("/auth/my-details");
        if (response.data?.success) {
          setUserRole(response.data.data.role);
        } else {
          setIsUnauthorized(true);
        }
      } catch {
        setIsUnauthorized(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSession();
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  if (isUnauthorized || !userRole) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to={`/${userRole}`} replace />;
  }

  return children;
};

export default ProtectedRoute;
