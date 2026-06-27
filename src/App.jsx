import React, { Suspense, lazy, useEffect, useRef, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import axios from "axios";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Slide, ToastContainer, toast } from "react-toastify";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Info,
  X,
  XCircle,
} from "lucide-react";
import Header from "./components/Layout/Header";
import Footer from "./components/Layout/Footer";
import ContactMeButton from "./components/Floating-buttons/ContactMeButton";
import Loader from "./components/Loader/Loader";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import InitialLoader from "./components/Portfolio/InitialLoader";
import Portfolio from "./pages/Portfolio";
import { initGA, logPageView } from "./analytics";
import { isTokenExpired } from "./utils/auth";
import { verifyToken } from "./utils/authApi";
import { applySEO, seoByRoute } from "./utils/seo";
import { apiUrl } from "./config/api";

const BlogPage = lazy(() => import("./pages/BlogPage"));
const AIChatPage = lazy(() => import("./pages/AIChat"));
const AddBlogDetails = lazy(() => import("./pages/AddBlogDetails"));
const AmiBotAdmin = lazy(() => import("./pages/AmiBotAdmin"));
const AmiPulseSettings = lazy(() => import("./pages/PulseSettings"));
const BlogsDetails = lazy(() => import("./pages/BlogsDetails"));
const TechByte = lazy(() => import("./pages/TechByte"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const TaskManagerDetails = lazy(() => import("./pages/TaskManagerDetails"));
const AIToolsDetails = lazy(() => import("./pages/AIToolsDetails"));
const SpamDetectorDetails = lazy(() => import("./pages/SpamDetectorDetails"));
const MoviePredictDetails = lazy(() => import("./pages/MoviePredictDetails"));
const EmotionAnalyzerDetails = lazy(() =>
  import("./pages/EmotionAnalyzerDetails"),
);
const AmiBotDetails = lazy(() => import("./pages/AmiBotDetails"));
const ReinforcementLearningDetails = lazy(() =>
  import("./pages/ReinforcementLearning"),
);
const LegalPage = lazy(() => import("./pages/LegalPage"));

const toastIconByType = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  default: Bell,
};

const AmiToastIcon = ({ type }) => {
  const Icon = toastIconByType[type] || Bell;

  return (
    <span className="amiverse-toast-icon" aria-hidden="true">
      <Icon size={19} strokeWidth={2.35} />
    </span>
  );
};

const AmiToastCloseButton = ({ closeToast }) => (
  <button
    type="button"
    className="amiverse-toast-close"
    onClick={closeToast}
    aria-label="Close notification"
  >
    <X size={15} strokeWidth={2.4} />
  </button>
);

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
          apiUrl(`/api/auth/validate-reset-token/${token}`),
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

const hasTokenPendingVerification = () => {
  const token = localStorage.getItem("token");
  return Boolean(token && !isTokenExpired(token));
};

const App = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [shouldRender, setShouldRender] = useState(
    () => !hasTokenPendingVerification(),
  );
  const location = useLocation();
  const navigate = useNavigate();
  const appShellRef = useRef(null);
  const initialLoaderMode = location.pathname === "/" ? "showcase" : "session";
  const prefersReducedMotion = useReducedMotion();
  const routeTransition = {
    duration: prefersReducedMotion ? 0 : 0.34,
    ease: [0.22, 1, 0.36, 1],
  };

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
    return <InitialLoader mode={initialLoaderMode} />;
  }

  return (
    <div ref={appShellRef} className="h-screen overflow-y-scroll relative">
      <Header setLoading={setIsLoading} />
      <ToastContainer
        className="amiverse-toast-container"
        toastClassName="amiverse-toast"
        progressClassName="amiverse-toast-progress"
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        pauseOnFocusLoss
        draggable
        newestOnTop
        limit={3}
        icon={AmiToastIcon}
        closeButton={AmiToastCloseButton}
        transition={Slide}
      />

      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <Loader />
        </div>
      )}

      <main id="main" className="flex-1" tabIndex={-1}>
        <Suspense fallback={<InitialLoader mode={initialLoaderMode} />}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              className="amiverse-route-frame"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={
                prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -6 }
              }
              transition={routeTransition}
            >
              <Routes location={location}>
                <Route path="/" element={<Portfolio />} />
                <Route path="/blogs" element={<BlogPage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/ai-chat" element={<AIChatPage />} />
                <Route
                  path="/add-blog"
                  element={
                    <ProtectedAdminRoute>
                      <AddBlogDetails />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path="/ami-pulse-settings"
                  element={
                    <ProtectedAdminRoute>
                      <AmiPulseSettings />
                    </ProtectedAdminRoute>
                  }
                />
                <Route path="/beacon-settings" element={<Navigate to="/ami-pulse-settings" replace />} />
                <Route path="/pulse-settings" element={<Navigate to="/ami-pulse-settings" replace />} />
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
                  path="/amibot-admin"
                  element={
                    <ProtectedAdminRoute>
                      <AmiBotAdmin />
                    </ProtectedAdminRoute>
                  }
                />
                <Route
                  path="/Reinforcement-Learning"
                  element={<ReinforcementLearningDetails />}
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </Suspense>
      </main>

      <ContactMeButton />
      <Footer />
    </div>
  );
};

export default App;
