import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import {
  ArrowUpRight,
  LayoutGrid,
  Newspaper,
  RefreshCw,
  Smartphone,
} from "lucide-react";
import { apiUrl } from "../../config/api";
import { getSafeHttpsUrl, getSafeImageUrl } from "../../utils/safeUrl";
import TechByteSwipeView from "./TechByteSwipeView";

const TECH_NEWS_URL = apiUrl("/api/tech-news");
const FALLBACK_NEWS_IMAGE = "/og-image.jpg";
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

const TechNewsSkeleton = React.memo(function TechNewsSkeleton({
  featured = false,
}) {
  return (
    <div
      className={`animate-pulse overflow-hidden rounded-[1.5rem] border border-zinc-200/80 bg-white/95 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.14)] dark:border-zinc-900 dark:bg-black dark:shadow-[0_18px_40px_-32px_rgba(0,0,0,0.9)] sm:rounded-[1.75rem] ${
        featured ? "lg:col-span-2" : ""
      }`}
    >
      <div
        className={`${
          featured ? "h-56 sm:h-72" : "h-44 sm:h-52"
        } w-full bg-zinc-200 dark:bg-zinc-900`}
      />
      <div className="flex flex-col p-4 sm:p-5 lg:p-6">
        <div className="mb-3 flex items-center gap-3 sm:mb-4">
          <div className="h-4 w-24 rounded-full bg-zinc-200 dark:bg-zinc-900" />
          <div className="h-4 w-32 rounded-full bg-zinc-200 dark:bg-zinc-900" />
        </div>
        <div className="mb-2 h-6 w-4/5 rounded bg-zinc-300 dark:bg-zinc-900 sm:mb-3 sm:h-7" />
        <div className="mb-2 h-5 w-3/5 rounded bg-zinc-200 dark:bg-zinc-900 sm:h-6" />
        <div className="space-y-2.5 pt-2 sm:space-y-3">
          <div className="h-3 rounded bg-zinc-200 dark:bg-zinc-900" />
          <div className="h-3 w-11/12 rounded bg-zinc-200 dark:bg-zinc-900" />
          <div className="h-3 w-4/5 rounded bg-zinc-200 dark:bg-zinc-900" />
        </div>
        <div className="mt-5 h-10 w-32 rounded-full bg-zinc-300 dark:bg-zinc-900 sm:mt-6" />
      </div>
    </div>
  );
});

const ViewSwitcher = React.memo(function ViewSwitcher({
  disabled,
  onChange,
  viewMode,
}) {
  return (
    <div
      aria-label="Choose Tech Byte view"
      className="grid w-full grid-cols-2 gap-1 rounded-2xl border border-zinc-200/80 bg-zinc-100/80 p-1 dark:border-zinc-800 dark:bg-zinc-950/80 md:hidden"
      role="group"
    >
      <button
        aria-pressed={viewMode === "feed"}
        className={`inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:cursor-not-allowed disabled:opacity-55 ${
          viewMode === "feed"
            ? "bg-white text-zinc-950 shadow-sm ring-1 ring-zinc-200/70 dark:bg-zinc-800 dark:text-white dark:ring-white/10"
            : "text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
        }`}
        disabled={disabled}
        onClick={() => onChange("feed")}
        type="button"
      >
        <LayoutGrid className="h-4 w-4" />
        Feed
      </button>
      <button
        aria-pressed={viewMode === "swipe"}
        className={`inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 disabled:cursor-not-allowed disabled:opacity-55 ${
          viewMode === "swipe"
            ? "bg-sky-600 text-white shadow-sm ring-1 ring-sky-500 dark:bg-cyan-300 dark:text-slate-950 dark:ring-cyan-200"
            : "text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white"
        }`}
        disabled={disabled}
        onClick={() => onChange("swipe")}
        type="button"
      >
        <Smartphone className="h-4 w-4" />
        Swipe reader
      </button>
    </div>
  );
});

function NewsStatePanel({ empty = false, onRetry }) {
  return (
    <div
      className="mt-5 flex min-h-[18rem] flex-col items-center justify-center rounded-[1.4rem] border border-dashed border-zinc-300/90 bg-white/65 px-6 py-10 text-center dark:border-zinc-800 dark:bg-zinc-950/70"
      role={empty ? "status" : "alert"}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 ring-1 ring-sky-200 dark:bg-cyan-300/10 dark:text-cyan-200 dark:ring-cyan-200/15">
        <Newspaper className="h-5 w-5" />
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
        className="mt-5 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-zinc-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 dark:bg-zinc-100 dark:text-black dark:hover:bg-white dark:focus-visible:ring-white/15 motion-reduce:transform-none"
        onClick={onRetry}
        type="button"
      >
        <RefreshCw className="h-4 w-4" />
        Try again
      </button>
    </div>
  );
}

const TechNewsGrid = React.memo(function TechNewsGrid({
  className = "",
  featuredArticle,
  handleCardKeyDown,
  handleImageError,
  handleReadMoreClick,
  openArticle,
  secondaryArticles,
}) {
  return (
    <div
      className={`mt-4 gap-3.5 sm:mt-5 sm:gap-4 md:grid-cols-2 2xl:grid-cols-3 ${className}`}
      data-testid="tech-byte-feed-view"
    >
      {featuredArticle && (
        <article
          aria-label={`Read full article: ${featuredArticle.title}`}
          className="group cursor-pointer overflow-hidden rounded-[1.45rem] border border-white/80 bg-white/92 shadow-[0_24px_60px_-38px_rgba(15,23,42,0.22)] backdrop-blur-sm transform-gpu transition-[transform,box-shadow,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-sky-100 hover:shadow-[0_34px_84px_-42px_rgba(15,23,42,0.3)] focus:outline-none focus:ring-4 focus:ring-sky-100 focus-visible:-translate-y-1 dark:border-zinc-900 dark:bg-black dark:hover:border-zinc-700 dark:focus:ring-zinc-700/20 dark:shadow-[0_24px_60px_-38px_rgba(0,0,0,0.95)] dark:hover:shadow-[0_36px_88px_-44px_rgba(0,0,0,0.98)] sm:rounded-[1.8rem] lg:col-span-2 motion-reduce:transform-none motion-reduce:transition-none"
          key={featuredArticle.url}
          onClick={() => openArticle(featuredArticle.url)}
          onKeyDown={(event) =>
            handleCardKeyDown(event, featuredArticle.url)
          }
          role="link"
          tabIndex={0}
        >
          <div className="grid h-full grid-cols-1 lg:grid-cols-[1.25fr_1fr]">
            <div className="relative min-h-[200px] overflow-hidden bg-zinc-100 dark:bg-zinc-950 sm:min-h-[280px] lg:min-h-full">
              <img
                alt={featuredArticle.title}
                className="h-full w-full object-cover object-center transform-gpu transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
                decoding="async"
                fetchPriority="high"
                loading="eager"
                onError={handleImageError}
                src={featuredArticle.image || FALLBACK_NEWS_IMAGE}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent dark:from-black/85 dark:via-black/30" />
              <span className="absolute left-4 top-4 rounded-full bg-white/92 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-900 shadow-sm backdrop-blur dark:bg-zinc-950/90 dark:text-zinc-100 sm:left-5 sm:top-5">
                Lead story
              </span>
            </div>

            <div className="flex flex-col p-4 sm:p-5 lg:p-6">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                <span>{featuredArticle.source?.name || "Unknown Source"}</span>
                <span className="text-zinc-300 dark:text-zinc-600">&bull;</span>
                <time dateTime={featuredArticle.publishedAt || undefined}>
                  {formatPublishedAt(featuredArticle.publishedAt)}
                </time>
              </div>

              <h2 className="mt-3 text-xl font-semibold leading-tight text-zinc-950 transition group-hover:text-sky-700 dark:text-zinc-50 dark:group-hover:text-zinc-200 sm:mt-4 sm:text-2xl">
                {featuredArticle.title}
              </h2>

              <p className="mt-3 line-clamp-4 text-sm leading-5 text-zinc-600 dark:text-zinc-300 sm:mt-4 sm:text-[15px] sm:leading-6">
                {featuredArticle.description}
              </p>

              <div className="mt-auto pt-4 sm:pt-5">
                <button
                  className="inline-flex min-h-[44px] min-w-[154px] items-center justify-center gap-2 rounded-full bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_16px_34px_-24px_rgba(15,23,42,0.9)] transition duration-200 hover:-translate-y-0.5 hover:bg-zinc-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 dark:bg-zinc-100 dark:text-black dark:hover:bg-white dark:focus-visible:ring-white/15 motion-reduce:transform-none sm:min-w-[166px] sm:px-5"
                  onClick={(event) =>
                    handleReadMoreClick(event, featuredArticle.url)
                  }
                  type="button"
                >
                  Read full story
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </article>
      )}

      {secondaryArticles.map((article) => (
        <article
          aria-label={`Read full article: ${article.title}`}
          className="group flex min-h-[250px] w-full cursor-pointer flex-col overflow-hidden rounded-[1.35rem] border border-white/80 bg-white/92 p-0 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.18)] backdrop-blur-sm transform-gpu transition-[transform,box-shadow,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-sky-100 hover:shadow-[0_28px_60px_-36px_rgba(15,23,42,0.26)] focus:outline-none focus:ring-4 focus:ring-sky-100 focus-visible:-translate-y-1 dark:border-zinc-900 dark:bg-black dark:hover:border-zinc-700 dark:focus:ring-zinc-700/20 dark:shadow-[0_18px_40px_-34px_rgba(0,0,0,0.95)] dark:hover:shadow-[0_30px_66px_-38px_rgba(0,0,0,0.98)] sm:min-h-[290px] sm:rounded-[1.55rem] motion-reduce:transform-none motion-reduce:transition-none"
          key={article.url}
          onClick={() => openArticle(article.url)}
          onKeyDown={(event) => handleCardKeyDown(event, article.url)}
          role="link"
          tabIndex={0}
        >
          <div className="relative h-40 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-950 sm:h-44 lg:h-48">
            <img
              alt={article.title}
              className="h-full w-full object-cover object-center transform-gpu transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
              decoding="async"
              fetchPriority="low"
              loading="lazy"
              onError={handleImageError}
              src={article.image || FALLBACK_NEWS_IMAGE}
            />
          </div>

          <div className="flex h-full flex-col p-4 sm:p-5">
            <div className="mb-2.5 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400 sm:mb-3">
              <span>{article.source?.name || "Unknown Source"}</span>
              <span className="text-zinc-300 dark:text-zinc-600">&bull;</span>
              <time dateTime={article.publishedAt || undefined}>
                {formatPublishedAt(article.publishedAt)}
              </time>
            </div>

            <h2 className="line-clamp-2 text-[15px] font-semibold leading-5 text-zinc-950 transition-colors duration-300 group-hover:text-sky-700 dark:text-zinc-50 dark:group-hover:text-zinc-200 sm:text-[1.05rem] sm:leading-6">
              {article.title}
            </h2>

            <p className="mt-2.5 flex-grow line-clamp-3 text-sm leading-5 text-zinc-600 dark:text-zinc-300 sm:mt-3 sm:line-clamp-4 sm:leading-6">
              {article.description}
            </p>

            <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400 sm:mt-4">
              <span>
                Source: {" "}
                {article.source.url ? (
                  <a
                    className="font-medium text-sky-700 underline decoration-sky-300 underline-offset-2 dark:text-sky-300"
                    href={article.source.url}
                    onClick={(event) => event.stopPropagation()}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {article.source.name}
                  </a>
                ) : (
                  <span className="font-medium text-zinc-600 dark:text-zinc-300">
                    {article.source.name}
                  </span>
                )}
              </span>
            </div>

            <button
              className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_16px_34px_-26px_rgba(15,23,42,0.8)] transition duration-200 hover:-translate-y-0.5 hover:bg-zinc-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 dark:bg-zinc-100 dark:text-black dark:hover:bg-white dark:focus-visible:ring-white/15 motion-reduce:transform-none sm:mt-5"
              onClick={(event) => handleReadMoreClick(event, article.url)}
              type="button"
            >
              Read story
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </article>
      ))}
    </div>
  );
});

function TechNewsCards() {
  const [articles, setArticles] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requestVersion, setRequestVersion] = useState(0);
  const [viewMode, setViewMode] = useState("feed");
  const { pathname } = useLocation();

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    setError(null);
    setLoading(true);

    axios
      .get(TECH_NEWS_URL, { signal: controller.signal })
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
        if (nextArticles.length === 0) setViewMode("feed");
      })
      .catch((requestError) => {
        if (requestError?.name === "CanceledError") return;

        if (isMounted) {
          setArticles([]);
          setError("Failed to load news");
          setLoading(false);
          setViewMode("feed");
        }
      });

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [requestVersion]);

  useEffect(() => {
    const scrollContainer = document.querySelector(".amiverse-app-shell");
    scrollContainer?.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);

  useEffect(() => {
    if (viewMode !== "swipe") {
      document.body.classList.remove("tech-byte-swipe-active");
      return undefined;
    }

    document.body.classList.add("tech-byte-swipe-active");
    document
      .querySelector(".amiverse-app-shell")
      ?.scrollTo({ top: 0, behavior: "auto" });

    return () => document.body.classList.remove("tech-byte-swipe-active");
  }, [viewMode]);

  const retryNews = useCallback(() => {
    setRequestVersion((version) => version + 1);
  }, []);

  const openArticle = useCallback((url) => {
    const safeUrl = getSafeHttpsUrl(url);
    if (!safeUrl) return;
    window.open(safeUrl, "_blank", "noopener,noreferrer");
  }, []);

  const handleReadMoreClick = useCallback(
    (event, url) => {
      event.preventDefault();
      event.stopPropagation();
      openArticle(url);
    },
    [openArticle],
  );

  const handleCardKeyDown = useCallback(
    (event, url) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openArticle(url);
      }
    },
    [openArticle],
  );

  const handleImageError = useCallback((event) => {
    if (event.currentTarget.dataset.fallbackApplied) return;
    event.currentTarget.dataset.fallbackApplied = "true";
    event.currentTarget.src = FALLBACK_NEWS_IMAGE;
  }, []);

  const featuredArticle = useMemo(
    () => (!loading && articles.length > 0 ? articles[0] : null),
    [articles, loading],
  );
  const secondaryArticles = useMemo(
    () => (!loading && articles.length > 0 ? articles.slice(1) : []),
    [articles, loading],
  );

  const isSwipeMode = viewMode === "swipe";
  const viewSwitcherDisabled =
    loading || Boolean(error) || articles.length === 0;

  return (
    <div
      className={`amiverse-premium-light-page w-full dark:bg-[linear-gradient(180deg,_#000000_0%,_#070707_52%,_#000000_100%)] ${
        isSwipeMode
          ? "h-[calc(100svh_-_4rem_-_env(safe-area-inset-top))] overflow-hidden px-2 pb-2 pt-2 md:h-auto md:min-h-screen md:overflow-visible md:px-5 md:pb-6 md:pt-4 lg:px-8 lg:pb-8 lg:pt-6"
          : "min-h-screen px-3 pb-24 pt-3 sm:px-5 sm:pb-6 sm:pt-4 lg:px-8 lg:pb-8 lg:pt-6"
      }`}
      data-tech-byte-mode={viewMode}
    >
      <section
        className={`mx-auto max-w-7xl ${
          isSwipeMode ? "h-full md:h-auto" : ""
        }`}
      >
        <div
          className={`relative overflow-hidden rounded-[1.3rem] border border-white/85 bg-white/88 px-4 py-4 shadow-[0_30px_90px_-50px_rgba(15,23,42,0.28)] backdrop-blur-xl dark:border-zinc-900 dark:bg-black dark:shadow-[0_30px_90px_-50px_rgba(0,0,0,0.95)] sm:rounded-[1.6rem] sm:px-5 sm:py-4 lg:px-6 lg:py-5 ${
            isSwipeMode ? "flex h-full flex-col md:block md:h-auto" : ""
          }`}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/60 to-transparent dark:via-sky-400/30" />

          <div
            className={`relative shrink-0 border-b border-zinc-200/80 dark:border-zinc-900 ${
              isSwipeMode ? "pb-3 sm:pb-4" : "pb-4 sm:pb-5"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-200">
                    <Newspaper className="h-3.5 w-3.5" />
                    Tech Byte
                  </span>
                  {!loading && !error && articles.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {articles.length} stories
                    </span>
                  )}
                </div>
                <h1
                  className={`max-w-2xl font-semibold tracking-tight text-zinc-950 dark:text-white ${
                    isSwipeMode
                      ? "sr-only md:not-sr-only md:mt-2 md:text-[1.4rem]"
                      : "mt-2 text-xl sm:text-[1.55rem] lg:text-[1.8rem]"
                  }`}
                >
                  Tech news that gets to the point faster.
                </h1>
                <p
                  className={`mt-1.5 max-w-2xl text-sm leading-5 text-zinc-600 dark:text-zinc-300 ${
                    isSwipeMode ? "hidden md:block" : "block"
                  }`}
                >
                  Get your daily tech dose in a quick feed, or switch to the
                  mobile reader and swipe through one focused story at a time.
                </p>
              </div>
            </div>

            <div className="mt-3">
              <ViewSwitcher
                disabled={viewSwitcherDisabled}
                onChange={setViewMode}
                viewMode={viewMode}
              />
            </div>
          </div>

          {loading ? (
            <div className="mt-4 grid gap-3.5 sm:mt-5 sm:gap-4 md:grid-cols-2 2xl:grid-cols-3">
              <TechNewsSkeleton featured />
              {Array.from({ length: 5 }).map((_, index) => (
                <TechNewsSkeleton key={index} />
              ))}
            </div>
          ) : error ? (
            <NewsStatePanel onRetry={retryNews} />
          ) : articles.length === 0 ? (
            <NewsStatePanel empty onRetry={retryNews} />
          ) : (
            <>
              {isSwipeMode && (
                <div className="min-h-0 flex-1 pt-3 md:hidden">
                  <TechByteSwipeView
                    articles={articles}
                    formatPublishedAt={formatPublishedAt}
                    onImageError={handleImageError}
                    onOpenArticle={openArticle}
                  />
                </div>
              )}
              <TechNewsGrid
                className={isSwipeMode ? "hidden md:grid" : "grid"}
                featuredArticle={featuredArticle}
                handleCardKeyDown={handleCardKeyDown}
                handleImageError={handleImageError}
                handleReadMoreClick={handleReadMoreClick}
                openArticle={openArticle}
                secondaryArticles={secondaryArticles}
              />
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default React.memo(TechNewsCards);
