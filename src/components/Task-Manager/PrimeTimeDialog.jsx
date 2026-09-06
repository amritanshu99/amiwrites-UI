import React, { useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import PrimeTimePanel from "./PrimeTimePanel";
import useDialogFocus from "./useDialogFocus";

export default function PrimeTimeDialog({ onClose }) {
  const closeRef = useRef(null);
  const dialogRef = useDialogFocus({
    open: true,
    onClose,
    initialFocusRef: closeRef,
  });

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        id="prime-time-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prime-time-title"
        className="max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl overflow-y-auto overscroll-contain rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-3rem)] dark:bg-zinc-950"
      >
        <PrimeTimePanel
          headerAction={
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="Close prime time"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 transition hover:bg-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:bg-emerald-900/50 dark:text-emerald-200 dark:hover:bg-emerald-900"
            >
              <X size={18} aria-hidden="true" />
            </button>
          }
        />
      </div>
    </div>,
    document.body
  );
}
