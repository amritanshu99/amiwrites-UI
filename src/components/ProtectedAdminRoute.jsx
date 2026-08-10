import React from "react";
import { Navigate } from "react-router-dom";
import Loader from "./Loader/Loader";
import { useVerifiedAuth } from "../hooks/useVerifiedAuth";

const ProtectedAdminRoute = ({ children, loadingLabel = "Loading admin page" }) => {
  const { isAuthenticated, isAdmin, isVerifyingAdmin } = useVerifiedAuth();

  if (isVerifyingAdmin) {
    return <Loader label={loadingLabel} opaque />;
  }

  return isAuthenticated && isAdmin ? (
    children
  ) : (
    <Navigate to="/blogs" replace />
  );
};

export default ProtectedAdminRoute;
