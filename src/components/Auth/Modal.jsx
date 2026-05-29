import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  closeDisabled = false,
}) {
  const modalRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleEsc = (e) => {
      if (e.key === "Escape" && !closeDisabled) onClose();
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [closeDisabled, isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const focusFrame = window.requestAnimationFrame(() => {
      modalRef.current?.focus();
    });

    document.body.style.overflow = "hidden";

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const requestClose = () => {
    if (!closeDisabled) onClose();
  };

  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      requestClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onMouseDown={handleBackdropClick}
      className="fixed inset-0 z-[110] flex min-h-[100svh] items-center justify-center overflow-y-auto bg-slate-950/65 px-3 py-4 backdrop-blur-md sm:px-4"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(14,165,233,0.14),transparent_38%)] motion-reduce:hidden dark:bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.10),transparent_40%)]"
      />
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative my-auto max-h-[calc(100svh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-white/70 bg-white/95 p-5 text-slate-950 shadow-[0_28px_80px_rgba(15,23,42,0.28)] outline-none ring-1 ring-slate-900/5 backdrop-blur-2xl animate-fade-in dark:border-white/10 dark:bg-zinc-950/95 dark:text-white dark:shadow-[0_30px_90px_rgba(0,0,0,0.68)] dark:ring-white/10 sm:p-7"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(14,165,233,0.12),rgba(255,255,255,0))] dark:bg-[linear-gradient(180deg,rgba(34,211,238,0.10),rgba(9,9,11,0))]"
        />
        <button
          type="button"
          onClick={requestClose}
          disabled={closeDisabled}
          aria-label="Close modal"
          className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:pointer-events-none disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:ring-cyan-300"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
        <div className="relative">
          <h2
            id={titleId}
            className="pr-10 text-xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-2xl"
          >
            {title}
          </h2>
          <div className="mt-5">{children}</div>
        </div>
      </div>
    </div>
  );
}
