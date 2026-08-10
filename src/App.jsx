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
import AppLoadingFallback from "./components/Loader/AppLoadingFallback";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import { completeInitialLoaderCycle } from "./components/Portfolio/InitialLoader";
import Portfolio from "./pages/Portfolio";
import { getPublicPagePath, initGA, logPageView } from "./analytics";
import { applySEO, seoByRoute } from "./utils/seo";
import { apiUrl } from "./config/api";
import {
  addBlogRoute,
  amiBotAdminRoute,
  amiPulseSettingsRoute,
  createPreloadedRouteComponent,
} from "./utils/adminRoutePreload";

const BlogPage = lazy(() => import("./pages/BlogPage"));
const AIChatPage = lazy(() => import("./pages/AIChat"));
const AddBlogDetails = createPreloadedRouteComponent(addBlogRoute);
const AmiBotAdmin = createPreloadedRouteComponent(amiBotAdminRoute);
const AmiPulseSettings = createPreloadedRouteComponent(amiPulseSettingsRoute);
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

const instantScrollPaths = new Set([
  "/add-blog",
  "/ami-pulse-settings",
  "/amibot-admin",
  "/amibot",
]);

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
  const normalizedToken = typeof token === "string" ? token.trim() : "";

  useEffect(() => {
    if (!normalizedToken || normalizedToken.length > 2048) {
      toast.error("Invalid or expired reset link.");
      navigate("/", { replace: true });
      return undefined;
    }

    if (window.location.pathname.startsWith("/reset-password/")) {
      window.history.replaceState(window.history.state, "", "/reset-password");
    }

    const controller = new AbortController();

    const validateToken = async () => {
      try {
        const res = await axios.get(
          apiUrl(`/api/auth/validate-reset-token/${encodeURIComponent(normalizedToken)}`),
          { signal: controller.signal, timeout: 10000 },
        );

        if (res.data.valid) {
          setIsValidating(false);
        } else {
          toast.error("Invalid or expired reset link.");
          navigate("/", { replace: true });
        }
      } catch (error) {
        if (axios.isCancel(error) || error?.code === "ERR_CANCELED") return;
        toast.error("Invalid or expired reset link.");
        navigate("/", { replace: true });
      }
    };

    validateToken();
    return () => controller.abort();
  }, [normalizedToken, navigate]);

  if (isValidating) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader />
      </div>
    );
  }

  return <ResetPasswordPage token={normalizedToken} />;
};

const App = () => {
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const appShellRef = useRef(null);
  const isAmiBotWorkspace = location.pathname === "/amibot";
  const usesInstantRouteScroll = instantScrollPaths.has(location.pathname);

  useEffect(() => {
    initGA();
  }, []);

  useEffect(() => {
    logPageView(location.pathname);
  }, [location]);

  useEffect(() => {
    if (location.pathname !== "/") completeInitialLoaderCycle();
  }, [location.pathname]);

  useEffect(() => {
    const routeSeo = resolveRouteSeo(location.pathname);
    applySEO({
      path: getPublicPagePath(location.pathname),
      ...routeSeo,
    });
  }, [location.pathname]);

  useEffect(() => {
    if (appShellRef.current) {
      appShellRef.current.scrollTo({
        top: 0,
        behavior: usesInstantRouteScroll ? "auto" : "smooth",
      });
      return;
    }

    window.scrollTo({
      top: 0,
      behavior: usesInstantRouteScroll ? "auto" : "smooth",
    });
  }, [location.pathname, usesInstantRouteScroll]);

  return (
    <div
      ref={appShellRef}
      className={`amiverse-app-shell h-screen relative ${isAmiBotWorkspace ? "overflow-hidden" : "overflow-y-scroll"}`}
    >
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

      <main
        id="main"
        className={
          isAmiBotWorkspace
            ? "h-[calc(100svh_-_4rem_-_env(safe-area-inset-top))] min-h-0 sm:h-[calc(100svh_-_4.25rem_-_env(safe-area-inset-top))] lg:h-[calc(100svh_-_4.5rem_-_env(safe-area-inset-top))]"
            : "flex-1"
        }
        tabIndex={-1}
      >
        <Suspense
          fallback={<AppLoadingFallback pathname={location.pathname} />}
        >
          <Routes>
            <Route path="/" element={<Portfolio />} />
            <Route path="/blogs" element={<BlogPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/ai-chat" element={<AIChatPage />} />
            <Route
              path="/add-blog"
              element={
                <ProtectedAdminRoute loadingLabel="Loading Create Blog">
                  <AddBlogDetails />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/ami-pulse-settings"
              element={
                <ProtectedAdminRoute loadingLabel="Loading Ami Pulse settings">
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
                <ProtectedAdminRoute loadingLabel="Loading AmiBot settings">
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
        </Suspense>
      </main>

      <ContactMeButton />
      {!isAmiBotWorkspace && <Footer />}
    </div>
  );
};

export default App;
