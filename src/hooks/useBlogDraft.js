import { useEffect, useRef, useState } from "react";
import { sanitizeBlogHtml, sanitizedHtmlToText } from "../utils/sanitizeHtml";

export const BLOG_DRAFT_KEY = "amiverse:blog-draft:v1";
const emptyDraft = () => ({ title: "", category: "", html: "", text: "" });
const hasContent = (draft) => Boolean(draft.title.trim() || draft.text.trim() || draft.category.trim());

function restoreDraft() {
  try {
    const saved = JSON.parse(localStorage.getItem(BLOG_DRAFT_KEY));
    if (saved?.version !== 1 || typeof saved.title !== "string" || typeof saved.html !== "string") return emptyDraft();
    const html = sanitizeBlogHtml(saved.html);
    return {
      title: saved.title,
      category: typeof saved.category === "string" ? saved.category.slice(0, 60) : "",
      html,
      text: sanitizedHtmlToText(html.replace(/<\/(?:p|li|h[1-6])>/gi, "$& ")),
    };
  } catch { return emptyDraft(); }
}

function persistDraft(draft) {
  try {
    if (!hasContent(draft)) {
      localStorage.removeItem(BLOG_DRAFT_KEY);
      return "empty";
    }
    localStorage.setItem(BLOG_DRAFT_KEY, JSON.stringify({ version: 1, title: draft.title, category: draft.category, html: draft.html }));
    return "saved";
  } catch { return "unavailable"; }
}

export function useBlogDraft() {
  const [draft, setDraft] = useState(restoreDraft);
  const [restored] = useState(() => hasContent(draft));
  const [saveStatus, setSaveStatus] = useState(restored ? "saved" : "empty");
  const latest = useRef(draft);
  const finished = useRef(false);
  const timer = useRef(null);
  latest.current = draft;

  useEffect(() => {
    if (finished.current) return undefined;
    setSaveStatus(hasContent(draft) ? "saving" : "empty");
    timer.current = setTimeout(() => setSaveStatus(persistDraft(draft)), 500);
    return () => clearTimeout(timer.current);
  }, [draft]);

  useEffect(() => {
    const onLeave = (event) => {
      if (finished.current) return;
      if (persistDraft(latest.current) === "unavailable" && hasContent(latest.current)) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.removeEventListener("beforeunload", onLeave);
      if (!finished.current) persistDraft(latest.current);
    };
  }, []);

  const saveNow = () => {
    clearTimeout(timer.current);
    const status = persistDraft(latest.current);
    setSaveStatus(status);
    return status;
  };
  const discard = () => {
    clearTimeout(timer.current);
    const next = emptyDraft();
    latest.current = next;
    setDraft(next);
    setSaveStatus(persistDraft(next));
  };
  const finishPublishing = () => {
    finished.current = true;
    clearTimeout(timer.current);
    persistDraft(emptyDraft());
  };

  return { draft, setDraft, saveStatus, restored, saveNow, discard, finishPublishing };
}
