import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { LoaderCircle } from "lucide-react";
import { isTokenExpired, parseJwt } from "../utils/auth";
import { verifyToken } from "../utils/authApi";
import { ADMIN_USERNAME } from "../config/auth";

const ProtectedAdminRoute = ({ children }) => {
  const [accessState, setAccessState] = useState("checking");

  useEffect(() => {
    let disposed = false;
    let requestVersion = 0;

    const checkAccess = async () => {
      const currentVersion = ++requestVersion;
      const token = localStorage.getItem("token");
      const decoded = parseJwt(token);

      if (!token || isTokenExpired(token) || decoded?.username !== ADMIN_USERNAME) {
        if (!disposed && currentVersion === requestVersion) setAccessState("denied");
        return;
      }

      setAccessState("checking");
      const isValid = await verifyToken(token);
      const tokenIsCurrent = localStorage.getItem("token") === token;

      if (!disposed && currentVersion === requestVersion) {
        setAccessState(isValid && tokenIsCurrent ? "allowed" : "denied");
      }
    };

    const handleTokenChange = () => checkAccess();
    checkAccess();
    window.addEventListener("tokenChanged", handleTokenChange);
    window.addEventListener("storage", handleTokenChange);

    return () => {
      disposed = true;
      requestVersion += 1;
      window.removeEventListener("tokenChanged", handleTokenChange);
      window.removeEventListener("storage", handleTokenChange);
    };
  }, []);

  if (accessState === "checking") {
    return (
      <div
        className="flex min-h-[50svh] items-center justify-center text-slate-600 dark:text-zinc-300"
        role="status"
        aria-label="Verifying admin access"
      >
        <LoaderCircle className="h-7 w-7 animate-spin" aria-hidden="true" />
        <span className="sr-only">Verifying admin access…</span>
      </div>
    );
  }

  return accessState === "allowed" ? children : <Navigate to="/blogs" replace />;
};

export default ProtectedAdminRoute;
