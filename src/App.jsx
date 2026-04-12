import React, { useEffect, useRef, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Header from "./components/Layout/Header";
import Footer from "./components/Layout/Footer";
import ContactMeButton from "./components/Floating-buttons/ContactMeButton";
import Loader from "./components/Loader/Loader";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import InitialLoader from "./components/Portfolio/InitialLoader";
import Portfolio from "./pages/Portfolio";
import BlogPage from "./pages/BlogPage";
import AIChatPage from "./pages/AIChat";
import AddBlogDetails from "./pages/AddBlogDetails";
import BlogsDetails from "./pages/BlogsDetails";
import TechByte from "./pages/TechByte";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import TaskManagerDetails from "./pages/TaskManagerDetails";
import AIToolsDetails from "./pages/AIToolsDetails";
import SpamDetectorDetails from "./pages/SpamDetectorDetails";
import MoviePredictDetails from "./pages/MoviePredictDetails";
import EmotionAnalyzerDetails from "./pages/EmotionAnalyzerDetails";
import AmiBotDetails from "./pages/AmiBotDetails";
import ReinforcementLearningDetails from "./pages/ReinforcementLearning";
import LegalPage from "./pages/LegalPage";
import { initGA, logPageView } from "./analytics";
import { isTokenExpired } from "./utils/auth";
import { verifyToken } from "./utils/authApi";
import { applySEO, seoByRoute } from "./utils/seo";

const resolveRouteSeo = (pathname) => {
  if (seoByRoute[pathname]) return seoByRoute[pathname];
  if (pathname.startsWith("/blogs/")) return seoByRoute["/blogs"];
  if (pathname.startsWith("/reset-password/")) return seoByRoute["/reset-password"];
  if (pathname.startsWith("/legal/")) return seoByRoute["/legal"];
  return seoByRoute["/"];
};

const ValidateResetToken = () => {
  const { id: token } = useParams();
  const navigate = useNavigate();
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      try {
        const res = await axios.get(
          `https://amiwrites-backend-app-2lp5.onrender.com/api/auth/validate-reset-token/${token}`,
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
  const [shouldRender, setShouldRender] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const appShellRef = useRef(null);

  const logout = () => {
    localStorage.removeItem("token");
    setShouldRender(true);
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");

      if (!token || isTokenExpired(token)) {
        logout();
        return;
      }

      const isValid = await verifyToken(token);
      if (!isValid) {
        logout();
        return;
      }

      setShouldRender(true);
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    initGA();
  }, []);

  useEffect(() => {
    logPageView(location.pathname + location.search);
  }, [location]);

  useEffect(() => {
    const routeSeo = resolveRouteSeo(location.pathname);
    applySEO({
      path: location.pathname,
      ...routeSeo,
    });
  }, [location.pathname]);

  useEffect(() => {
    if (appShellRef.current) {
      appShellRef.current.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  if (!shouldRender) {
    return <InitialLoader mode="session" />;
  }

  return (
    <div ref={appShellRef} className="h-screen overflow-y-scroll relative">
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
          <Route path="/legal/:slug" element={<LegalPage />} />
          <Route path="/ai-tools" element={<AIToolsDetails />} />
          <Route path="/task-manager" element={<TaskManagerDetails />} />
          <Route path="/spam-check" element={<SpamDetectorDetails />} />
          <Route path="/movie-recommender" element={<MoviePredictDetails />} />
          <Route
            path="/emotion-analyzer"
            element={<EmotionAnalyzerDetails />}
          />
          <Route path="/amibot" element={<AmiBotDetails />} />
          <Route
            path="/Reinforcement-Learning"
            element={<ReinforcementLearningDetails />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <ContactMeButton />
      <Footer />
    </div>
  );
};

export default App;
