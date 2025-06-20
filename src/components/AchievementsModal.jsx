import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FaTimes } from "react-icons/fa";

export default function AchievementsModal({ isOpen, onClose, title, achievements = [] }) {
  const modalRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Close on outside click
  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            className="fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal container */}
          <motion.div
            key="modal"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            onMouseDown={handleBackdropClick}
          >
            {/* Modal content */}
            <div
              ref={modalRef}
              onMouseDown={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 rounded-2xl shadow-2xl p-6 sm:p-8 border border-gray-200 dark:border-gray-700"
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                aria-label="Close modal"
                className="absolute top-4 right-4 text-cyan-700 hover:text-cyan-900 dark:text-cyan-300 dark:hover:text-white transition text-2xl"
              >
                <FaTimes />
              </button>

              {/* Title */}
              <h2 className="text-3xl font-bold text-cyan-900 dark:text-cyan-100 mb-4">
                Achievements
              </h2>

              {/* Achievements List */}
              <ul className="list-disc list-inside space-y-3 text-cyan-800 dark:text-cyan-300 text-base sm:text-lg leading-relaxed">
                {achievements.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
