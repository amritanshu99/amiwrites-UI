// components/ProtectedAdminRoute.js
import React from "react";
import { Navigate } from "react-router-dom";

function parseJwt(token) {
  try {
    const base64Payload = token.split('.')[1];
    const payload = atob(base64Payload);
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

const ProtectedAdminRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const decoded = token ? parseJwt(token) : null;

  if (decoded?.username === "amritanshu99") {
    return children;
  }

  return <Navigate to="/blogs" replace />;
};

export default ProtectedAdminRoute;
