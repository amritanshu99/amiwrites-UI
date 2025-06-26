import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  useLocation,
  useParams,
  useNavigate,
} from "react-router-dom";
import axios from "axios";
import Header from "./components/Layout/Header";
import Portfolio from "./pages/Portfolio";
import BlogPage from "./pages/BlogPage";
import AIChatPage from "./pages/AIChat";
import AddBlogDetails from "./pages/AddBlogDetails";
import BlogsDetails from "./pages/BlogsDetails";
import Footer from "./components/Layout/Footer";
import TechByte from "./pages/TechByte";
import ContactMeButton from "./components/Floating-buttons/ContactMeButton";
import Loader from "./components/Loader/Loader";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { initGA, logPageView } from "./analytics";
import { Navigate } from "react-router-dom";
import TaskManagerDetails from "./pages/TaskManagerDetails";
import AIToolsDetails from "./pages/AIToolsDetails";
const ValidateResetToken = () => {
  const { id: token } = useParams();
  const navigate = useNavigate();
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      try {
        const res = await axios.get(
          `https://amiwrites-backend-app-1.onrender.com/api/auth/validate-reset-token/${token}`
        );

        if (res.data.valid) {
          setIsValidating(false);
        } else {
          toast.error("Invalid or expired reset link.");
          navigate("/");
        }
      } catch (err) {
        toast.error("Invalid or expired reset link.");
        navigate("/");
      }
    };

    validateToken();
  }, [token, navigate]);

  if (isValidating) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader />
      </div>
    );
  }

  return <ResetPasswordPage token={token} />;
};

const App = () => {
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    initGA();
  }, []);

  useEffect(() => {
    logPageView(location.pathname + location.search);
  }, [location]);

  return (
    <div className="h-screen overflow-y-scroll relative">
      <Header setLoading={setIsLoading} />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
      />

      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <Loader />
        </div>
      )}

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Portfolio />} />
          <Route path="/blogs" element={<BlogPage />} />
          <Route path="/ai-chat" element={<AIChatPage />} />
          <Route
            path="/add-blog"
            element={
              <ProtectedAdminRoute>
                <AddBlogDetails />
              </ProtectedAdminRoute>
            }
          />
          <Route path="/blogs/:id" element={<BlogsDetails />} />
          <Route path="/tech-byte" element={<TechByte />} />
          <Route path="/reset-password/:id" element={<ValidateResetToken />} />
          <Route path="/ai-tools" element={<AIToolsDetails />} />
           <Route path="/task-manager" element={<TaskManagerDetails />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <ContactMeButton />
      <Footer />
    </div>
  );
};

export default App;
