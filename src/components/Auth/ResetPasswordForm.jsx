import { useState } from "react";
import Loader from "../Loader/Loader";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white/90 px-3.5 py-2.5 text-sm text-slate-950 shadow-inner shadow-slate-100/70 outline-none transition-colors duration-200 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-70 dark:border-white/10 dark:bg-white/[0.06] dark:text-white dark:shadow-none dark:placeholder:text-zinc-500 dark:focus:border-cyan-300/50 dark:focus:bg-white/[0.08] dark:focus:ring-cyan-300/10";

export default function ResetPasswordForm({ onBack, onSubmit }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (emailToValidate) =>
    /^\S+@\S+\.\S+$/.test(emailToValidate);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      await onSubmit(email);
    } catch (err) {
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div>
        <label
          htmlFor="reset-email"
          className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-zinc-200"
        >
          Email
        </label>
        <input
          id="reset-email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
          className={`${inputClass} ${
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-100 dark:focus:ring-red-500/10"
              : ""
          }`}
        />
        <div aria-live="polite" className="mt-2 min-h-5">
          {error && (
            <p className="text-sm font-medium text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-3 pt-1 sm:grid-cols-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition-colors duration-200 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/[0.06] dark:text-zinc-100 dark:hover:bg-white/[0.1] dark:focus-visible:ring-white/10"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)] transition-colors duration-200 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-cyan-300 dark:text-slate-950 dark:hover:bg-cyan-200 dark:focus-visible:ring-cyan-300/15"
        >
          {isSubmitting ? (
            <>
              <Loader size="small" label="Sending reset link" />
              <span>Sending</span>
            </>
          ) : (
            "Submit"
          )}
        </button>
      </div>
    </form>
  );
}
