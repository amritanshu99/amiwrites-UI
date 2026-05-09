import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Award, CheckCircle2, Sparkles, X } from "lucide-react";

export default function AchievementsModal({ isOpen, onClose, title, achievements = [] }) {
  const modalRef = useRef(null);
  const achievementCount = achievements.length;

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40 bg-slate-950/72 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            key="modal"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.97 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            onMouseDown={handleBackdropClick}
          >
            <div
              ref={modalRef}
              onMouseDown={(e) => e.stopPropagation()}
              className="relative flex max-h-[84vh] w-full max-w-2xl flex-col overflow-hidden rounded-[1.5rem] border border-white/80 bg-white/95 text-slate-900 shadow-[0_30px_90px_rgba(15,23,42,0.3)] ring-1 ring-sky-100/70 backdrop-blur-2xl dark:border-cyan-100/10 dark:bg-zinc-950/95 dark:text-zinc-50 dark:shadow-[0_34px_96px_rgba(0,0,0,0.74)] dark:ring-cyan-100/10"
            >
              <span className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400 dark:from-cyan-500/80 dark:via-sky-500/70 dark:to-emerald-500/70" />
              <span className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgba(14,165,233,0.13),rgba(255,255,255,0))] dark:bg-[linear-gradient(180deg,rgba(8,145,178,0.16),rgba(9,9,11,0))]" />

              <button
                onClick={onClose}
                aria-label="Close modal"
                className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white/80 text-slate-500 shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:text-slate-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 dark:border-white/10 dark:bg-white/[0.06] dark:text-zinc-300 dark:hover:border-cyan-200/30 dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:ring-cyan-300/20"
              >
                <X size={18} strokeWidth={2.2} />
              </button>

              <div className="relative px-5 pb-4 pt-6 sm:px-7 sm:pb-5 sm:pt-7">
                <div className="flex flex-col gap-4 pr-12 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-600 to-cyan-500 text-white shadow-[0_16px_32px_rgba(14,165,233,0.24)] ring-1 ring-white/70 dark:from-cyan-400 dark:to-sky-500 dark:text-slate-950 dark:shadow-[0_16px_34px_rgba(34,211,238,0.16)] dark:ring-cyan-100/20">
                      <Award size={26} strokeWidth={2.1} />
                    </span>
                    <div className="min-w-0">
                      <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700 dark:border-cyan-300/20 dark:bg-cyan-300/10 dark:text-cyan-100">
                        <Sparkles size={13} strokeWidth={2.2} />
                        Impact highlights
                      </div>
                      <h2 className="mt-3 text-2xl font-bold leading-tight tracking-normal text-slate-950 dark:text-white sm:text-3xl">
                        Achievements
                      </h2>
                      {title && (
                        <p className="mt-1.5 text-sm font-medium leading-relaxed text-slate-600 dark:text-zinc-300 sm:text-base">
                          {title}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 shadow-sm dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-100">
                    <CheckCircle2 size={16} strokeWidth={2.2} />
                    {achievementCount} {achievementCount === 1 ? "win" : "wins"}
                  </div>
                </div>
              </div>

              <div className="relative min-h-0 overflow-y-auto px-5 pb-5 sm:px-7 sm:pb-7">
                {achievementCount > 0 ? (
                  <ul className="space-y-3">
                    {achievements.map((item, i) => (
                      <motion.li
                        key={`${item}-${i}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.28,
                          delay: 0.08 + i * 0.045,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/[0.82] p-4 shadow-[0_14px_34px_rgba(15,23,42,0.08)] ring-1 ring-white/70 transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-[0_18px_42px_rgba(14,116,144,0.14)] dark:border-white/10 dark:bg-white/[0.045] dark:ring-white/[0.04] dark:hover:border-cyan-200/25 dark:hover:bg-white/[0.07] dark:hover:shadow-[0_18px_46px_rgba(0,0,0,0.44)]"
                      >
                        <span className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-sky-500 via-cyan-400 to-emerald-400 dark:from-cyan-400/80 dark:via-sky-400/70 dark:to-emerald-400/70" />
                        <div className="flex gap-3 pl-1">
                          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-700 ring-1 ring-sky-100 transition-all duration-300 group-hover:scale-105 dark:bg-cyan-300/10 dark:text-cyan-100 dark:ring-cyan-200/20">
                            <CheckCircle2 size={18} strokeWidth={2.2} />
                          </span>
                          <div className="min-w-0">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-zinc-500">
                              Highlight {String(i + 1).padStart(2, "0")}
                            </span>
                            <p className="mt-1 text-sm font-medium leading-relaxed text-slate-800 dark:text-zinc-100 sm:text-base">
                              {item}
                            </p>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-8 text-center text-sm font-medium text-slate-500 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-400">
                    No achievements listed yet.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
