import { useEffect, useState } from "react";
import {
  Check,
  Eye,
  EyeOff,
  Link2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { ADMIN_USERNAME } from "../../config/auth";
import { passwordMeetsLengthPolicy } from "../../utils/passwordPolicy";
import {
  continueWithGoogle,
  loginWithPassword,
  requestPasswordReset,
  signupWithPassword,
} from "../../utils/authApi";
import {
  getGeolocationErrorMessage,
  updatePulseLocationFromBrowser,
} from "../../utils/pulseLocation";
import Loader from "../Loader/Loader";
import GoogleSignInButton from "./GoogleSignInButton";
import Modal from "./Modal";
import ResetPasswordForm from "./ResetPasswordForm";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white/90 px-3.5 py-2.5 text-sm text-slate-950 shadow-inner shadow-slate-100/70 outline-none transition-colors duration-200 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-70 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:shadow-none dark:placeholder:text-zinc-500 dark:focus:border-cyan-300/50 dark:focus:bg-white/[0.08] dark:focus:ring-cyan-300/10";
const labelClass =
  "mb-1.5 block text-sm font-semibold text-slate-700 dark:text-zinc-200";
const GOOGLE_LINK_REQUIRED_CODE = "ACCOUNT_LINK_REQUIRED";
const emailPattern = /^\S+@\S+\.\S+$/;
const specialCharacterPattern = /[!@#$%^&*]/;

const getErrorMessage = (error, fallback) =>
  (typeof error?.message === "string" && error.message) || fallback;

function PasswordField({
  autoComplete,
  disabled,
  id,
  label = "Password",
  onChange,
  showPassword,
  togglePassword,
  value,
  describedBy,
  dataAutofocus = false,
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={showPassword ? "text" : "password"}
          className={`${inputClass} pr-11`}
          placeholder="Enter your password"
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          disabled={disabled}
          maxLength={72}
          aria-describedby={describedBy}
          data-autofocus={dataAutofocus || undefined}
          required
        />
        <button
          type="button"
          onClick={togglePassword}
          disabled={disabled}
          aria-label={showPassword ? "Hide password" : "Show password"}
          aria-pressed={showPassword}
          className="absolute inset-y-1.5 right-2 inline-flex w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:cursor-not-allowed disabled:opacity-60 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:ring-cyan-300"
        >
          {showPassword ? (
            <EyeOff size={18} aria-hidden="true" />
          ) : (
            <Eye size={18} aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}

export default function AuthModal({ isOpen, onClose, initialMode = "signin" }) {
  const [mode, setMode] = useState(initialMode);
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberIdentifier, setRememberIdentifier] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [pendingGoogleLink, setPendingGoogleLink] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const nextMode = initialMode === "signup" ? "signup" : "signin";
      const rememberedIdentifier = localStorage.getItem("rememberedUsername") || "";
      setMode(nextMode);
      setIdentifier(nextMode === "signin" ? rememberedIdentifier : "");
      setRememberIdentifier(Boolean(rememberedIdentifier));
      return;
    }

    setIdentifier("");
    setEmail("");
    setUsername("");
    setPassword("");
    setConfirmPassword("");
    setRememberIdentifier(false);
    setShowPassword(false);
    setShowResetForm(false);
    setIsSubmitting(false);
    setError("");
    setPendingGoogleLink(null);
  }, [initialMode, isOpen]);

  const isSignup = mode === "signup";
  const passwordChecks = [
    {
      label: "At least 10 characters (72-byte limit)",
      met: passwordMeetsLengthPolicy(password),
    },
    { label: "At least one number", met: /[0-9]/.test(password) },
    {
      label: "A special character (!@#$%^&*)",
      met: specialCharacterPattern.test(password),
    },
  ];
  const isBusy = isSubmitting;
  const errorId = error ? "auth-form-error" : undefined;

  const clearTransientState = () => {
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setError("");
    setPendingGoogleLink(null);
    setShowResetForm(false);
  };

  const switchMode = (nextMode) => {
    if (isBusy || nextMode === mode) return;
    clearTransientState();
    setMode(nextMode);

    if (nextMode === "signin" && !identifier) {
      const rememberedIdentifier = localStorage.getItem("rememberedUsername") || "";
      setIdentifier(rememberedIdentifier);
      setRememberIdentifier(Boolean(rememberedIdentifier));
    }
  };

  const requestClose = () => {
    if (!isBusy) onClose();
  };

  const refreshAdminPulseLocation = (token, payload) => {
    if (payload?.username !== ADMIN_USERNAME) return;

    toast.info("Allow location access to refresh your Ami Pulse location.");
    void updatePulseLocationFromBrowser(token)
      .then(({ locationLabel }) => {
        toast.success(`Ami Pulse location updated to ${locationLabel}.`);
      })
      .catch((locationError) => {
        toast.warning(getGeolocationErrorMessage(locationError));
      });
  };

  const completeAuthentication = (session, successMessage, rememberedValue = "") => {
    localStorage.setItem("token", session.token);
    if (rememberIdentifier && rememberedValue) {
      localStorage.setItem("rememberedUsername", rememberedValue);
    } else if (rememberedValue) {
      localStorage.removeItem("rememberedUsername");
    }

    toast.success(successMessage);
    window.dispatchEvent(new Event("tokenChanged"));
    onClose();
    refreshAdminPulseLocation(session.token, session.payload);
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    if (isBusy) return;

    setError("");

    if (pendingGoogleLink) {
      if (!password) {
        setError("Enter your current password to link this Google account.");
        return;
      }

      setIsSubmitting(true);
      try {
        const session = await continueWithGoogle({
          credential: pendingGoogleLink.credential,
          password,
        });
        completeAuthentication(
          session,
          "Google is now linked. Welcome back!",
          identifier.trim(),
        );
      } catch (linkError) {
        setError(
          getErrorMessage(
            linkError,
            "We could not link Google to your account. Please try again.",
          ),
        );
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const normalizedIdentifier = identifier.trim();
    if (!normalizedIdentifier || !password) {
      setError("Enter your email or username and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const session = await loginWithPassword({
        identifier: normalizedIdentifier,
        password,
      });
      completeAuthentication(
        session,
        "Signed in successfully. Welcome back!",
        normalizedIdentifier,
      );
    } catch (loginError) {
      setError(getErrorMessage(loginError, "Unable to sign in. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignupSubmit = async (event) => {
    event.preventDefault();
    if (isBusy) return;

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim();
    setError("");

    if (!normalizedEmail || !normalizedUsername || !password || !confirmPassword) {
      setError("Complete every field to create your account.");
      return;
    }
    if (!emailPattern.test(normalizedEmail) || normalizedEmail.length > 254) {
      setError("Enter a valid email address.");
      return;
    }
    if (normalizedUsername.length > 50) {
      setError("Username must be 50 characters or fewer.");
      return;
    }
    if (passwordChecks.some(({ met }) => !met)) {
      setError("Choose a password that meets all three requirements.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const session = await signupWithPassword({
        email: normalizedEmail,
        username: normalizedUsername,
        password,
      });
      completeAuthentication(session, "Your Amiverse account is ready. Welcome!", "");
    } catch (signupError) {
      setError(
        getErrorMessage(signupError, "Unable to create your account. Please try again."),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleCredential = async (credential) => {
    if (isBusy) return;

    setError("");
    setIsSubmitting(true);
    try {
      const session = await continueWithGoogle({ credential });
      completeAuthentication(session, "Signed in with Google. Welcome!");
    } catch (googleError) {
      if (googleError?.code === GOOGLE_LINK_REQUIRED_CODE) {
        const linkEmail =
          typeof googleError.email === "string" ? googleError.email.trim() : "";
        setMode("signin");
        setIdentifier(linkEmail);
        setPassword("");
        setPendingGoogleLink({ credential, email: linkEmail });
        setError("");
      } else {
        setError(
          getErrorMessage(
            googleError,
            "Unable to continue with Google. Please try again.",
          ),
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPasswordSubmit = async (resetEmail) => {
    await requestPasswordReset(resetEmail);
    toast.success("If that account exists, a reset link is on its way.");
    onClose();
  };

  const modalTitle = showResetForm
    ? "Reset your password"
    : pendingGoogleLink
      ? "Link Google securely"
      : isSignup
        ? "Create your account"
        : "Welcome back";
  const modalDescription = showResetForm
    ? "Enter your account email and we'll send the next step."
    : pendingGoogleLink
      ? "Verify your existing Amiverse password once to connect Google."
      : isSignup
        ? "Save your work and unlock personalized Amiverse experiences."
        : "Sign in to continue where you left off.";

  return (
    <Modal
      isOpen={isOpen}
      onClose={requestClose}
      title={modalTitle}
      description={modalDescription}
      closeDisabled={isBusy}
    >
      {showResetForm ? (
        <ResetPasswordForm
          onBack={() => {
            setShowResetForm(false);
            setError("");
          }}
          onSubmit={handleResetPasswordSubmit}
        />
      ) : (
        <div className="space-y-5">
          <div
            role="tablist"
            aria-label="Authentication mode"
            className="grid grid-cols-2 rounded-xl bg-slate-100 p-1 dark:bg-white/[0.07]"
          >
            <button
              type="button"
              role="tab"
              aria-selected={!isSignup}
              onClick={() => switchMode("signin")}
              disabled={isBusy}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 dark:focus-visible:ring-cyan-300 ${
                !isSignup
                  ? "bg-white text-slate-950 shadow-sm dark:bg-white/15 dark:text-white"
                  : "text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={isSignup}
              onClick={() => switchMode("signup")}
              disabled={isBusy}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 dark:focus-visible:ring-cyan-300 ${
                isSignup
                  ? "bg-white text-slate-950 shadow-sm dark:bg-white/15 dark:text-white"
                  : "text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              Create account
            </button>
          </div>

          {pendingGoogleLink ? (
            <div className="rounded-2xl border border-sky-200 bg-sky-50/80 p-4 dark:border-cyan-300/20 dark:bg-cyan-300/[0.08]">
              <div className="flex gap-3">
                <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-sky-700 shadow-sm dark:bg-white/10 dark:text-cyan-200">
                  <Link2 className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    An account already uses this email
                  </p>
                  <p className="mt-1 break-all text-xs leading-5 text-slate-600 dark:text-zinc-300">
                    {pendingGoogleLink.email || "Your verified Google email"}. Enter your
                    current password below; you'll only need to do this once.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {isOpen && (
                <GoogleSignInButton
                  disabled={isBusy}
                  mode={mode}
                  onCredential={handleGoogleCredential}
                  onError={setError}
                />
              )}
              <div className="flex items-center gap-3" aria-hidden="true">
                <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-zinc-500">
                  or use your password
                </span>
                <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
              </div>
            </>
          )}

          <form
            onSubmit={isSignup ? handleSignupSubmit : handlePasswordSubmit}
            className="space-y-4"
            noValidate
          >
            {isSignup ? (
              <>
                <div>
                  <label htmlFor="signup-email" className={labelClass}>
                    Email
                  </label>
                  <input
                    id="signup-email"
                    type="email"
                    className={inputClass}
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    disabled={isBusy}
                    maxLength={254}
                    aria-describedby={errorId}
                    data-autofocus
                    required
                  />
                </div>
                <div>
                  <label htmlFor="signup-username" className={labelClass}>
                    Username
                  </label>
                  <input
                    id="signup-username"
                    type="text"
                    className={inputClass}
                    placeholder="Choose how people will know you"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    autoComplete="username"
                    disabled={isBusy}
                    minLength={1}
                    maxLength={50}
                    aria-describedby={errorId}
                    required
                  />
                </div>
                <PasswordField
                  id="signup-password"
                  label="Password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  showPassword={showPassword}
                  togglePassword={() => setShowPassword((current) => !current)}
                  autoComplete="new-password"
                  disabled={isBusy}
                  describedBy={`signup-password-guidance${errorId ? ` ${errorId}` : ""}`}
                />
                <ul
                  id="signup-password-guidance"
                  className="grid gap-1.5 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-white/[0.04] dark:text-zinc-300 sm:grid-cols-2"
                >
                  {passwordChecks.map(({ label, met }) => (
                    <li
                      key={label}
                      className={`flex items-center gap-1.5 ${
                        met ? "text-emerald-700 dark:text-emerald-300" : ""
                      }`}
                    >
                      <span
                        className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                          met
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-slate-300 dark:border-white/20"
                        }`}
                        aria-hidden="true"
                      >
                        {met && <Check className="h-2.5 w-2.5" />}
                      </span>
                      {label}
                    </li>
                  ))}
                </ul>
                <PasswordField
                  id="signup-confirm-password"
                  label="Confirm password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  showPassword={showPassword}
                  togglePassword={() => setShowPassword((current) => !current)}
                  autoComplete="new-password"
                  disabled={isBusy}
                  describedBy={errorId}
                />
              </>
            ) : (
              <>
                <div>
                  <label htmlFor="login-identifier" className={labelClass}>
                    Email or username
                  </label>
                  <input
                    id="login-identifier"
                    type="text"
                    className={inputClass}
                    placeholder="you@example.com or username"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    autoComplete="username"
                    disabled={isBusy || Boolean(pendingGoogleLink)}
                    maxLength={254}
                    aria-describedby={errorId}
                    data-autofocus={!pendingGoogleLink || undefined}
                    required
                  />
                </div>
                <PasswordField
                  id="login-password"
                  label={pendingGoogleLink ? "Current Amiverse password" : "Password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  showPassword={showPassword}
                  togglePassword={() => setShowPassword((current) => !current)}
                  autoComplete="current-password"
                  disabled={isBusy}
                  describedBy={errorId}
                  dataAutofocus={Boolean(pendingGoogleLink)}
                />
                {!pendingGoogleLink && (
                  <div className="flex items-center justify-between gap-3">
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-zinc-300">
                      <input
                        type="checkbox"
                        checked={rememberIdentifier}
                        onChange={(event) => setRememberIdentifier(event.target.checked)}
                        disabled={isBusy}
                        className="h-4 w-4 rounded border-slate-300 accent-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:opacity-60 dark:border-white/20"
                      />
                      Remember this account
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowResetForm(true);
                        setError("");
                      }}
                      disabled={isBusy}
                      className="rounded-lg px-1 py-1 text-sm font-semibold text-sky-700 transition hover:text-sky-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 dark:text-cyan-200 dark:hover:text-cyan-100"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </>
            )}

            <div aria-live="polite" aria-atomic="true" className="min-h-5">
              {error && (
                <p
                  id="auth-form-error"
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200"
                  role="alert"
                >
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isBusy}
              aria-busy={isBusy}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-cyan-300 dark:text-slate-950 dark:hover:bg-cyan-200 dark:focus-visible:ring-cyan-300/15"
            >
              {isBusy ? (
                <>
                  <Loader
                    size="small"
                    label={
                      pendingGoogleLink
                        ? "Linking Google account"
                        : isSignup
                          ? "Creating account"
                          : "Signing in"
                    }
                  />
                  <span>
                    {pendingGoogleLink
                      ? "Linking Google"
                      : isSignup
                        ? "Creating account"
                        : "Signing in"}
                  </span>
                </>
              ) : (
                <>
                  {pendingGoogleLink ? (
                    <Link2 className="h-4 w-4" aria-hidden="true" />
                  ) : isSignup ? (
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span>
                    {pendingGoogleLink
                      ? "Verify & link Google"
                      : isSignup
                        ? "Create account"
                        : "Sign in"}
                  </span>
                </>
              )}
            </button>

            {pendingGoogleLink && (
              <button
                type="button"
                onClick={() => {
                  setPendingGoogleLink(null);
                  setPassword("");
                  setError("");
                }}
                disabled={isBusy}
                className="w-full rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 dark:text-zinc-300 dark:hover:bg-white/[0.07] dark:hover:text-white"
              >
                Use password sign-in without linking
              </button>
            )}
          </form>

          {isSignup && !pendingGoogleLink && (
            <p className="flex items-start gap-2 text-xs leading-5 text-slate-500 dark:text-zinc-400">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                By creating an account, you agree to the{" "}
                <Link
                  to="/legal/terms-of-service"
                  onClick={requestClose}
                  className="font-semibold text-sky-700 underline-offset-2 hover:underline dark:text-cyan-200"
                >
                  Terms
                </Link>{" "}
                and acknowledge the{" "}
                <Link
                  to="/legal/privacy-policy"
                  onClick={requestClose}
                  className="font-semibold text-sky-700 underline-offset-2 hover:underline dark:text-cyan-200"
                >
                  Privacy Policy
                </Link>
                .
              </span>
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
