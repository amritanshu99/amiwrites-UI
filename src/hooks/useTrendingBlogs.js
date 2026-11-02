import { useCallback, useEffect, useState } from "react";
import axios from "../utils/api";
import { trendingRequestPath } from "../utils/trendingAnalytics";

const FALLBACK_REFRESH_MS = 5 * 60 * 1000;
const RETRY_REFRESH_MS = 30 * 1000;

// Both the list and article badges follow the same server ranking window.
export function useTrendingBlogs(enabled = true) {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("loading");
  const [refreshVersion, setRefreshVersion] = useState(0);
  const refresh = useCallback(() => setRefreshVersion((version) => version + 1), []);

  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    let controller;
    let timer;
    let nextRefreshAt = 0;
    let generation = 0;

    const schedule = (delay) => {
      clearTimeout(timer);
      nextRefreshAt = Date.now() + delay;
      timer = setTimeout(load, delay);
    };

    async function load() {
      const requestGeneration = ++generation;
      controller?.abort();
      const requestController = new AbortController();
      controller = requestController;
      try {
        const { data } = await axios.get(trendingRequestPath(), {
          signal: requestController.signal,
          timeout: 12000,
        });
        if (!active || requestGeneration !== generation) return;
        if (!Array.isArray(data?.items)) throw new Error("Invalid trending response");
        const seen = new Set();
        setItems(data.items.filter((item) => {
          const id = item?._id && String(item._id);
          if (!id || seen.has(id)) return false;
          seen.add(id);
          return true;
        }));
        setStatus("ready");
        const remaining = Date.parse(data.meta?.epochEndsAt) - Date.now();
        schedule(Number.isFinite(remaining) && remaining > 0
          ? Math.min(60 * 60 * 1000, Math.max(1000, remaining + 100))
          : FALLBACK_REFRESH_MS);
      } catch (error) {
        if (!active || requestGeneration !== generation || requestController.signal.aborted) return;
        // An expired ranking must not keep labelling posts as currently trending.
        setItems([]);
        setStatus("failed");
        schedule(RETRY_REFRESH_MS);
      }
    }

    const resume = () => {
      if (document.visibilityState !== "hidden" && Date.now() >= nextRefreshAt) {
        clearTimeout(timer);
        void load();
      }
    };
    void load();
    document.addEventListener("visibilitychange", resume);
    window.addEventListener("online", resume);
    return () => {
      active = false;
      generation += 1;
      controller?.abort();
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", resume);
      window.removeEventListener("online", resume);
    };
  }, [enabled, refreshVersion]);

  return { items: enabled ? items : [], status, refresh };
}
