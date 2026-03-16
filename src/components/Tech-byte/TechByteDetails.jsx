import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";

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

const TechNewsSkeleton = ({ featured = false }) => (
  <div
    className={`animate-pulse overflow-hidden rounded-[1.75rem] border border-zinc-200/80 bg-white/95 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.14)] dark:border-slate-800/90 dark:bg-slate-950/90 dark:shadow-[0_18px_40px_-32px_rgba(0,0,0,0.55)] ${
      featured ? "lg:col-span-2" : ""
    }`}
  >
    <div className={`${featured ? "h-72 sm:h-80" : "h-56"} w-full bg-zinc-200 dark:bg-slate-800`} />
    <div className="flex flex-col p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="h-4 w-24 rounded-full bg-zinc-200 dark:bg-slate-700" />
        <div className="h-4 w-32 rounded-full bg-zinc-200 dark:bg-slate-700" />
      </div>
      <div className="mb-3 h-7 w-4/5 rounded bg-zinc-300 dark:bg-slate-700" />
      <div className="mb-2 h-6 w-3/5 rounded bg-zinc-200 dark:bg-slate-700" />
      <div className="space-y-3 pt-2">
        <div className="h-3 rounded bg-zinc-200 dark:bg-slate-700" />
        <div className="h-3 w-11/12 rounded bg-zinc-200 dark:bg-slate-700" />
        <div className="h-3 w-4/5 rounded bg-zinc-200 dark:bg-slate-700" />
      </div>
      <div className="mt-6 h-10 w-32 rounded-full bg-zinc-300 dark:bg-slate-700" />
    </div>
  </div>
);

function TechNewsCards() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = "Tech-Byte";

    const link =
      document.querySelector("link[rel='canonical']") ||
      document.head.appendChild(document.createElement("link"));
    link.rel = "canonical";
    link.href = window.location.href;

    let isMounted = true;

    axios
      .get("https://amiwrites-backend-app-2lp5.onrender.com/api/tech-news")
      .then((res) => {
        if (isMounted) {
          setArticles(res.data.articles);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError("Failed to load news");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const scrollContainer = document.querySelector(
      ".h-screen.overflow-y-scroll.relative"
    );
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [pathname]);

  const handleReadMoreClick = useCallback((e, url) => {
    e.preventDefault();
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  const featuredArticle = !loading && articles.length > 0 ? articles[0] : null;
  const secondaryArticles =
    !loading && articles.length > 0 ? articles.slice(1) : [];

  if (error) {
    return (
      <p className="mt-20 text-center text-lg font-semibold text-red-600 dark:text-red-400">
        {error}
      </p>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.96),_rgba(232,240,249,0.95)_22%,_rgba(241,245,249,1)_52%,_rgba(248,250,252,1)_100%)] px-4 py-6 dark:bg-[radial-gradient(circle_at_top,_rgba(30,41,59,0.95),_rgba(15,23,42,1)_28%,_rgba(9,9,11,1)_68%,_rgba(3,7,18,1)_100%)] sm:px-6 lg:px-8 lg:py-8">
      <section className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/84 px-5 py-6 shadow-[0_30px_90px_-50px_rgba(15,23,42,0.25)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-950/78 dark:shadow-[0_30px_90px_-50px_rgba(2,6,23,0.9)] sm:px-7 sm:py-7">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/60 to-transparent dark:via-sky-400/30" />

          <div className="relative flex flex-col gap-5 border-b border-zinc-200/80 pb-6 dark:border-slate-800 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-200">
                Tech Byte
              </span>
              <h1 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-zinc-950 dark:text-slate-50 sm:text-[2rem]">
                A sharper, more professional read on what is happening in technology.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-slate-300">
                Scan the day&apos;s most relevant stories in a cleaner editorial layout with stronger contrast, clearer metadata, and a more polished dark theme.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:min-w-[320px]">
              <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/85 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/85">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-slate-400">
                  Coverage
                </p>
                <p className="mt-2 text-base font-semibold text-zinc-950 dark:text-slate-100">
                  Latest tech stories
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/85 px-4 py-4 dark:border-slate-800 dark:bg-slate-900/85">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-slate-400">
                  Articles
                </p>
                <p className="mt-2 text-base font-semibold text-zinc-950 dark:text-slate-100">
                  {loading ? "Loading..." : `${articles.length} stories`}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {loading ? (
              <>
                <TechNewsSkeleton featured />
                {Array.from({ length: 5 }).map((_, i) => (
                  <TechNewsSkeleton key={i} />
                ))}
              </>
            ) : (
              <>
                {featuredArticle && (
                  <a
                    key={featuredArticle.url}
                    href={featuredArticle.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Read full article: ${featuredArticle.title}`}
                    className="group overflow-hidden rounded-[1.8rem] border border-white/80 bg-white/92 shadow-[0_24px_60px_-38px_rgba(15,23,42,0.22)] backdrop-blur-sm transition hover:-translate-y-1 hover:border-sky-100 hover:shadow-[0_28px_70px_-38px_rgba(15,23,42,0.28)] focus:outline-none focus:ring-4 focus:ring-sky-100 dark:border-slate-700/70 dark:bg-slate-950/84 dark:hover:border-sky-500/30 dark:focus:ring-sky-500/10 dark:shadow-[0_24px_60px_-38px_rgba(2,6,23,0.9)] lg:col-span-2"
                  >
                    <div className="grid h-full grid-cols-1 lg:grid-cols-[1.25fr_1fr]">
                      <div className="relative min-h-[260px] overflow-hidden bg-zinc-100 dark:bg-slate-900 sm:min-h-[340px]">
                        <img
                          src={featuredArticle.image || "/placeholder-image.png"}
                          alt={featuredArticle.title}
                          loading="lazy"
                          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent dark:from-slate-950/80 dark:via-slate-950/25" />
                        <span className="absolute left-5 top-5 rounded-full bg-white/92 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-900 dark:bg-slate-950/90 dark:text-slate-100">
                          Lead Story
                        </span>
                      </div>

                      <div className="flex flex-col p-5 sm:p-6">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-zinc-500 dark:text-slate-400">
                          <span>{featuredArticle.source?.name || "Unknown Source"}</span>
                          <span className="text-zinc-300 dark:text-slate-600">&bull;</span>
                          <time dateTime={featuredArticle.publishedAt}>
                            {formatPublishedAt(featuredArticle.publishedAt)}
                          </time>
                        </div>

                        <h2 className="mt-4 text-2xl font-semibold leading-tight text-zinc-950 transition group-hover:text-sky-700 dark:text-slate-50 dark:group-hover:text-sky-300">
                          {featuredArticle.title}
                        </h2>

                        <p className="mt-4 text-sm leading-7 text-zinc-600 dark:text-slate-300 sm:text-[15px]">
                          {featuredArticle.description || "No description available."}
                        </p>

                        <div className="mt-auto pt-6">
                          <button
                            type="button"
                            onClick={(e) => handleReadMoreClick(e, featuredArticle.url)}
                            className="inline-flex min-h-[44px] min-w-[160px] items-center justify-center rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-sky-400 dark:text-slate-950 dark:hover:bg-sky-300"
                          >
                            Read Full Story
                          </button>
                        </div>
                      </div>
                    </div>
                  </a>
                )}

                {secondaryArticles.map((article) => (
                  <a
                    key={article.url}
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Read full article: ${article.title}`}
                    className="group flex min-h-[290px] w-full flex-col overflow-hidden rounded-[1.55rem] border border-white/80 bg-white/92 p-0 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.18)] backdrop-blur-sm transition hover:-translate-y-1 hover:border-sky-100 hover:shadow-[0_24px_50px_-34px_rgba(15,23,42,0.24)] focus:outline-none focus:ring-4 focus:ring-sky-100 dark:border-slate-700/70 dark:bg-slate-950/84 dark:hover:border-sky-500/30 dark:focus:ring-sky-500/10 dark:shadow-[0_18px_40px_-34px_rgba(2,6,23,0.88)]"
                  >
                    <div className="relative h-52 w-full overflow-hidden bg-zinc-100 dark:bg-slate-900">
                      <img
                        src={article.image || "/placeholder-image.png"}
                        alt={article.title}
                        loading="lazy"
                        className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>

                    <div className="flex h-full flex-col p-5">
                      <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-slate-400">
                        <span>{article.source?.name || "Unknown Source"}</span>
                        <span className="text-zinc-300 dark:text-slate-600">&bull;</span>
                        <time dateTime={article.publishedAt}>
                          {formatPublishedAt(article.publishedAt)}
                        </time>
                      </div>

                      <h2 className="line-clamp-2 text-base font-semibold leading-6 text-zinc-950 transition-colors duration-300 group-hover:text-sky-700 dark:text-slate-50 dark:group-hover:text-sky-300 sm:text-[1.05rem]">
                        {article.title}
                      </h2>

                      <p className="mt-3 flex-grow line-clamp-4 text-sm leading-6 text-zinc-600 dark:text-slate-300">
                        {article.description || "No description available."}
                      </p>

                      <div className="mt-4 text-xs text-zinc-500 dark:text-slate-400">
                        <span>
                          Source:{" "}
                          <a
                            href={article.source?.url || "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="font-medium text-sky-700 underline underline-offset-2 dark:text-sky-300"
                          >
                            {article.source?.name || "Unknown"}
                          </a>
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleReadMoreClick(e, article.url)}
                        className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-sky-400 dark:text-slate-950 dark:hover:bg-sky-300"
                      >
                        Read More
                      </button>
                    </div>
                  </a>
                ))}
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default React.memo(TechNewsCards);
