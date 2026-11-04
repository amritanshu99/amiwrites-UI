import { useEffect } from "react";
import { MIN_READ_MS, sendQualifiedRead } from "../utils/mostReadAnalytics";

// Independent of Trending: sharing a link must not count as reading the article.
export function useQualifiedBlogRead(postId, onCounted) {
  useEffect(() => {
    if (!postId) return undefined;
    let visibleMs = 0;
    let startedAt = document.visibilityState === "hidden" ? null : performance.now();
    let timer;
    let stopped = false;
    let complete = false;
    let inFlight = false;
    let attempts = 0;
    const elapsed = () => visibleMs + (startedAt === null ? 0 : Math.max(0, performance.now() - startedAt));

    const schedule = (delay = Math.max(0, MIN_READ_MS - elapsed())) => {
      clearTimeout(timer);
      if (!stopped && !complete && !inFlight && attempts < 3 && startedAt !== null) {
        timer = setTimeout(deliver, delay);
      }
    };
    async function deliver() {
      if (stopped || complete || inFlight || attempts >= 3) return;
      if (elapsed() < MIN_READ_MS) { schedule(); return; }
      attempts += 1;
      inFlight = true;
      try {
        const result = await sendQualifiedRead(postId, elapsed());
        complete = true;
        if (!stopped && result.counted) onCounted?.();
      } catch (error) {
        const status = Number(error?.status) || 0;
        if (status >= 400 && status < 500 && status !== 408 && status !== 429) complete = true;
      } finally {
        inFlight = false;
        schedule(1000 * 2 ** (attempts - 1));
      }
    }
    const pause = () => {
      if (startedAt !== null) visibleMs += Math.max(0, performance.now() - startedAt);
      startedAt = null;
      clearTimeout(timer);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") pause();
      else { if (startedAt === null) startedAt = performance.now(); schedule(); }
    };
    const onPageHide = () => {
      pause();
      if (elapsed() >= MIN_READ_MS) void deliver();
    };
    schedule();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onVisibility);
    return () => {
      pause();
      if (elapsed() >= MIN_READ_MS) void deliver();
      stopped = true;
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onVisibility);
    };
  }, [postId, onCounted]);
}
