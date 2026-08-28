import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { MousePointer2, Newspaper, RefreshCw } from "lucide-react";
import { apiUrl } from "../../config/api";
import { getSafeHttpsUrl, getSafeImageUrl } from "../../utils/safeUrl";
import TechByteScrollView from "./TechByteScrollView";
import TechByteSwipeView from "./TechByteSwipeView";

const TECH_NEWS_URL = apiUrl("/api/tech-news");
const FALLBACK_NEWS_IMAGE = "/og-image.jpg";
const TECH_NEWS_TIMEOUT_MS = 12000;
const DESKTOP_READER_QUERY = "(min-width: 900px) and (min-height: 620px)";
// Intentionally match non-printing control characters in feed text.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS = /[\u0000-\u001F\u007F]/g;

const cleanArticleText = (value, fallback, maxLength) => {
  if (typeof value !== "string") return fallback;
  const normalized = value
    .replace(CONTROL_CHARACTERS, " ")
    .replace(/\s+/g, " ")
    .trim();
  return normalized ? normalized.slice(0, maxLength) : fallback;
};

const normalizeArticle = (article) => {
  if (!article || typeof article !== "object" || Array.isArray(article)) {
    return null;
  }

  const url = getSafeHttpsUrl(article.url);
  if (!url) return null;

  return {
    url,
    image: getSafeImageUrl(article.image, FALLBACK_NEWS_IMAGE),
    title: cleanArticleText(article.title, "Untitled story", 200),
    description: cleanArticleText(
      article.description,
      "No description available.",
      600,
    ),
    publishedAt:
      typeof article.publishedAt === "string" ||
      typeof article.publishedAt === "number"
        ? article.publishedAt
        : null,
    source: {
      name: cleanArticleText(article.source?.name, "Unknown Source", 100),
      url: getSafeHttpsUrl(article.source?.url),
    },
  };
};

const formatPublishedAt = (publishedAt) => {
  if (!publishedAt) return "Date unavailable";

  const date = new Date(publishedAt);
  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getInitialDesktopReader = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(DESKTOP_READER_QUERY).matches
    : false;

function useDesktopReader() {
  const [isDesktop, setIsDesktop] = useState(getInitialDesktopReader);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return undefined;

    const query = window.matchMedia(DESKTOP_READER_QUERY);
    const syncReader = () => setIsDesktop(query.matches);

    syncReader();
    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", syncReader);
      return () => query.removeEventListener("change", syncReader);
    }

    query.addListener?.(syncReader);
    return () => query.removeListener?.(syncReader);
  }, []);

  return isDesktop;
}

const TechReaderSkeleton = React.memo(function TechReaderSkeleton({
  isDesktopReader,
}) {
  return (
    <div
      aria-label="Loading Tech Byte stories"
      className="min-h-0 flex-1 pt-3 md:pt-4"
      role="status"
    >
      <div
        className={`grid h-full min-h-0 animate-pulse overflow-hidden rounded-lg border border-white/80 bg-white/75 shadow-[0_26px_70px_-46px_rgba(15,23,42,0.28)] dark:border-zinc-900 dark:bg-black/70 ${
          isDesktopReader
            ? "grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)] grid-rows-1"
            : "grid-rows-[minmax(0,40%)_minmax(0,1fr)]"
        }`}
      >
        <div className="bg-zinc-200 dark:bg-zinc-900" />
        <div
          className={`flex min-h-0 flex-col ${
            isDesktopReader ? "p-7 lg:p-9" : "p-4 sm:p-5"
          }`}
        >
          <div className="flex gap-3">
            <div className="h-4 w-24 rounded-full bg-zinc-200 dark:bg-zinc-900" />
            <div className="h-4 w-32 rounded-full bg-zinc-200 dark:bg-zinc-900" />
          </div>
          <div className="mt-5 h-8 w-10/12 rounded-lg bg-zinc-300 dark:bg-zinc-800" />
          <div className="mt-2.5 h-8 w-7/12 rounded-lg bg-zinc-300 dark:bg-zinc-800" />
          <div className="mt-6 space-y-3">
            <div className="h-3.5 rounded-full bg-zinc-200 dark:bg-zinc-900" />
            <div className="h-3.5 w-11/12 rounded-full bg-zinc-200 dark:bg-zinc-900" />
            <div className="h-3.5 w-4/5 rounded-full bg-zinc-200 dark:bg-zinc-900" />
          </div>
          <div className="mt-auto h-11 w-40 rounded-full bg-zinc-300 dark:bg-zinc-800" />
        </div>
      </div>
    </div>
  );
});

function NewsStatePanel({ empty = false, onRetry }) {
  return (
    <div
      className="mt-3 flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto rounded-lg border border-dashed border-zinc-300/90 bg-white/65 px-6 py-8 text-center dark:border-zinc-800 dark:bg-zinc-950/70 md:mt-4"
      role={empty ? "status" : "alert"}
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 ring-1 ring-sky-200 dark:bg-cyan-300/10 dark:text-cyan-200 dark:ring-cyan-200/15">
        <Newspaper className="h-5 w-5" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-zinc-950 dark:text-white">
        {empty ? "No stories yet" : "The news feed is taking a break"}
      </h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        {empty
          ? "Fresh technology stories will appear here as soon as they are available."
          : "We could not refresh Tech Byte right now. Check your connection and try again."}
      </p>
      <button
        className="mt-5 inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-zinc-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 dark:bg-zinc-100 dark:text-black dark:hover:bg-white dark:focus-visible:ring-white/15 motion-reduce:transform-none"
        onClick={onRetry}
        type="button"
      >
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        Try again
      </button>
    </div>
  );
}

function TechNewsCards() {
  const [articles, setArticles] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requestVersion, setRequestVersion] = useState(0);
  const isDesktopReader = useDesktopReader();
  const { pathname } = useLocation();

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    setError(null);
    setLoading(true);

    axios
      .get(TECH_NEWS_URL, {
        signal: controller.signal,
        timeout: TECH_NEWS_TIMEOUT_MS,
      })
      .then((response) => {
        if (!isMounted) return;

        const nextArticles = Array.isArray(response.data?.articles)
          ? response.data.articles
              .slice(0, 50)
              .map(normalizeArticle)
              .filter(Boolean)
          : [];

        setArticles(nextArticles);
        setLoading(false);
      })
      .catch((requestError) => {
        if (requestError?.name === "CanceledError") return;

        if (isMounted) {
          setArticles([]);
          setError("Failed to load news");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [requestVersion]);

  useEffect(() => {
    document.body.classList.add("tech-byte-reader-active");
    return () => document.body.classList.remove("tech-byte-reader-active");
  }, []);

  useEffect(() => {
    document
      .querySelector(".amiverse-app-shell")
      ?.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname]);

  const retryNews = useCallback(() => {
    setRequestVersion((version) => version + 1);
  }, []);

  const openArticle = useCallback((url) => {
    const safeUrl = getSafeHttpsUrl(url);
    if (!safeUrl) return;
    window.open(safeUrl, "_blank", "noopener,noreferrer");
  }, []);

  const handleImageError = useCallback((event) => {
    if (event.currentTarget.dataset.fallbackApplied) return;
    event.currentTarget.dataset.fallbackApplied = "true";
    event.currentTarget.src = FALLBACK_NEWS_IMAGE;
  }, []);

  return (
    <div
      className="amiverse-premium-light-page amiverse-viewport-workspace tech-byte-reader-page w-full overflow-hidden px-2 pb-2 pt-2 dark:bg-[linear-gradient(180deg,_#000000_0%,_#070707_52%,_#000000_100%)] sm:px-4 sm:pb-3 sm:pt-3 lg:px-6 lg:pb-4 lg:pt-4"
      data-reader-kind={isDesktopReader ? "scroll" : "swipe"}
      data-testid="tech-byte-reader-shell"
    >
      <section className="mx-auto h-full max-w-7xl">
        <div className="relative flex h-full min-h-0 flex-col overflow-hidden px-1 py-1 sm:px-2 sm:py-2 lg:px-3">
          <header className="relative shrink-0 border-b border-zinc-200/80 pb-3 dark:border-zinc-900 md:pb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-200">
                  <Newspaper className="h-3.5 w-3.5" aria-hidden="true" />
                  Tech Byte
                </span>
                {!loading && !error && articles.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {articles.length} stories
                  </span>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <span className="hidden min-[390px]:inline-flex min-h-10 items-center gap-2 rounded-full border border-zinc-200/80 bg-white/80 px-3 text-xs font-semibold text-zinc-600 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/80 dark:text-zinc-300">
                  <MousePointer2
                    className="h-4 w-4 text-sky-600 dark:text-sky-300"
                    aria-hidden="true"
                  />
                  {isDesktopReader ? "Scroll reader" : "Swipe reader"}
                </span>
                <button
                  type="button"
                  onClick={retryNews}
                  disabled={loading}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200/80 bg-white/85 text-zinc-700 shadow-sm transition-colors hover:bg-white hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 disabled:cursor-wait disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950/85 dark:text-zinc-200 dark:hover:bg-zinc-900 dark:hover:text-white dark:focus-visible:ring-sky-500/20"
                  aria-label="Refresh Tech Byte stories"
                  title="Refresh stories"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>

            <h1 className="tech-byte-reader-heading mt-2 max-w-3xl text-lg font-semibold leading-6 text-zinc-950 dark:text-white sm:text-xl lg:text-[1.65rem] lg:leading-8">
              Tech news, one focused story at a time.
            </h1>
            <p
              className={`tech-byte-reader-subtitle mt-1 max-w-2xl text-sm leading-5 text-zinc-600 dark:text-zinc-300 ${
                isDesktopReader ? "hidden sm:block" : "hidden"
              }`}
            >
              Scroll through a calm, full-story briefing built for quick
              context without the clutter of a traditional news grid.
            </p>
          </header>

          {loading ? (
            <TechReaderSkeleton isDesktopReader={isDesktopReader} />
          ) : error ? (
            <NewsStatePanel onRetry={retryNews} />
          ) : articles.length === 0 ? (
            <NewsStatePanel empty onRetry={retryNews} />
          ) : isDesktopReader ? (
            <div className="min-h-0 flex-1 pt-4">
              <TechByteScrollView
                articles={articles}
                formatPublishedAt={formatPublishedAt}
                onImageError={handleImageError}
                onOpenArticle={openArticle}
              />
            </div>
          ) : (
            <div className="min-h-0 flex-1 pt-3">
              <TechByteSwipeView
                articles={articles}
                formatPublishedAt={formatPublishedAt}
                onImageError={handleImageError}
                onOpenArticle={openArticle}
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default React.memo(TechNewsCards);
