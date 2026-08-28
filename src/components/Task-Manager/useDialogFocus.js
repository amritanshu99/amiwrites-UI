import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "a[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export default function useDialogFocus({
  open,
  onClose,
  initialFocusRef,
  canClose = true,
}) {
  const dialogRef = useRef(null);
  const canCloseRef = useRef(canClose);
  canCloseRef.current = canClose;

  useEffect(() => {
    if (!open) return undefined;

    const previouslyFocused = document.activeElement;
    document.body.classList.add("task-manager-overlay-active");

    const focusTimer = window.setTimeout(() => {
      initialFocusRef?.current?.focus();
    }, 50);

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && canCloseRef.current) {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusableElements = [
        ...dialogRef.current.querySelectorAll(FOCUSABLE_SELECTOR),
      ];
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.classList.remove("task-manager-overlay-active");
      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, [initialFocusRef, onClose, open]);

  return dialogRef;
}
