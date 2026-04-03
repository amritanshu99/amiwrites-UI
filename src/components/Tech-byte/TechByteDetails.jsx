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
    className={`animate-pulse overflow-hidden rounded-[1.5rem] border border-zinc-200/80 bg-white/95 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.14)] dark:border-zinc-900 dark:bg-black dark:shadow-[0_18px_40px_-32px_rgba(0,0,0,0.9)] sm:rounded-[1.75rem] ${
      featured ? "lg:col-span-2" : ""
    }`}
  >
    <div className={`${featured ? "h-56 sm:h-72" : "h-44 sm:h-52"} w-full bg-zinc-200 dark:bg-zinc-900`} />
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

function TechNewsCards() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { pathname } = useLocation();

  useEffect(() => {
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
    <div className="min-h-screen w-full bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.96),_rgba(232,240,249,0.95)_22%,_rgba(241,245,249,1)_52%,_rgba(248,250,252,1)_100%)] px-3 py-3 dark:bg-[linear-gradient(180deg,_#000000_0%,_#070707_52%,_#000000_100%)] sm:px-5 sm:py-4 lg:px-8 lg:py-6">
      <section className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-[1.3rem] border border-white/80 bg-white/84 px-4 py-4 shadow-[0_30px_90px_-50px_rgba(15,23,42,0.25)] backdrop-blur-xl dark:border-zinc-900 dark:bg-black dark:shadow-[0_30px_90px_-50px_rgba(0,0,0,0.95)] sm:rounded-[1.6rem] sm:px-5 sm:py-4 lg:px-6 lg:py-5">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/60 to-transparent dark:via-sky-400/30" />

          <div className="relative border-b border-zinc-200/80 pb-4 dark:border-zinc-900 sm:pb-5">
            <div className="max-w-3xl">
              <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-200">
                Tech Byte
              </span>
              <h1 className="mt-2 max-w-2xl text-base font-semibold tracking-tight text-zinc-950 dark:text-white sm:text-[1.4rem] lg:text-[1.65rem]">
                Tech news that gets to the point faster.
              </h1>
              <p className="mt-1.5 max-w-2xl text-sm leading-5 text-zinc-600 dark:text-zinc-300">
                Top stories stay visible sooner, with less scrolling on phones and desktops.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3.5 sm:mt-5 sm:gap-4 md:grid-cols-2 2xl:grid-cols-3">
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
                    className="group overflow-hidden rounded-[1.45rem] border border-white/80 bg-white/92 shadow-[0_24px_60px_-38px_rgba(15,23,42,0.22)] backdrop-blur-sm transform-gpu transition-[transform,box-shadow,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:scale-[1.005] hover:border-sky-100 hover:shadow-[0_34px_84px_-42px_rgba(15,23,42,0.3)] focus:outline-none focus:ring-4 focus:ring-sky-100 focus-visible:-translate-y-1 dark:border-zinc-900 dark:bg-black dark:hover:border-zinc-700 dark:focus:ring-zinc-700/20 dark:shadow-[0_24px_60px_-38px_rgba(0,0,0,0.95)] dark:hover:shadow-[0_36px_88px_-44px_rgba(0,0,0,0.98)] sm:rounded-[1.8rem] lg:col-span-2 motion-reduce:transform-none motion-reduce:transition-none"
                  >
                    <div className="grid h-full grid-cols-1 lg:grid-cols-[1.25fr_1fr]">
                      <div className="relative min-h-[200px] overflow-hidden bg-zinc-100 dark:bg-zinc-950 sm:min-h-[280px] lg:min-h-full">
                        <img
                          src={featuredArticle.image || "/placeholder-image.png"}
                          alt={featuredArticle.title}
                          loading="lazy"
                          className="h-full w-full object-cover object-center transform-gpu transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110 motion-reduce:transform-none motion-reduce:transition-none"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent dark:from-black/85 dark:via-black/30" />
                        <span className="absolute left-4 top-4 rounded-full bg-white/92 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 sm:left-5 sm:top-5">
                          Lead Story
                        </span>
                      </div>

                      <div className="flex flex-col p-4 sm:p-5 lg:p-6">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
                          <span>{featuredArticle.source?.name || "Unknown Source"}</span>
                          <span className="text-zinc-300 dark:text-zinc-600">&bull;</span>
                          <time dateTime={featuredArticle.publishedAt}>
                            {formatPublishedAt(featuredArticle.publishedAt)}
                          </time>
                        </div>

                        <h2 className="mt-3 text-xl font-semibold leading-tight text-zinc-950 transition group-hover:text-sky-700 dark:text-zinc-50 dark:group-hover:text-zinc-200 sm:mt-4 sm:text-2xl">
                          {featuredArticle.title}
                        </h2>

                        <p className="mt-3 line-clamp-4 text-sm leading-5 text-zinc-600 dark:text-zinc-300 sm:mt-4 sm:leading-6 sm:text-[15px]">
                          {featuredArticle.description || "No description available."}
                        </p>

                        <div className="mt-auto pt-4 sm:pt-5">
                          <button
                            type="button"
                            onClick={(e) => handleReadMoreClick(e, featuredArticle.url)}
                            className="inline-flex min-h-[42px] min-w-[148px] items-center justify-center rounded-full bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-white sm:min-h-[44px] sm:min-w-[160px] sm:px-5"
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
                    className="group flex min-h-[250px] w-full flex-col overflow-hidden rounded-[1.35rem] border border-white/80 bg-white/92 p-0 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.18)] backdrop-blur-sm transform-gpu transition-[transform,box-shadow,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:scale-[1.01] hover:border-sky-100 hover:shadow-[0_28px_60px_-36px_rgba(15,23,42,0.26)] focus:outline-none focus:ring-4 focus:ring-sky-100 focus-visible:-translate-y-1 dark:border-zinc-900 dark:bg-black dark:hover:border-zinc-700 dark:focus:ring-zinc-700/20 dark:shadow-[0_18px_40px_-34px_rgba(0,0,0,0.95)] dark:hover:shadow-[0_30px_66px_-38px_rgba(0,0,0,0.98)] sm:min-h-[290px] sm:rounded-[1.55rem] motion-reduce:transform-none motion-reduce:transition-none"
                  >
                    <div className="relative h-40 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-950 sm:h-44 lg:h-48">
                      <img
                        src={article.image || "/placeholder-image.png"}
                        alt={article.title}
                        loading="lazy"
                        className="h-full w-full object-cover object-center transform-gpu transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110 motion-reduce:transform-none motion-reduce:transition-none"
                      />
                    </div>

                    <div className="flex h-full flex-col p-4 sm:p-5">
                      <div className="mb-2.5 flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400 sm:mb-3">
                        <span>{article.source?.name || "Unknown Source"}</span>
                        <span className="text-zinc-300 dark:text-zinc-600">&bull;</span>
                        <time dateTime={article.publishedAt}>
                          {formatPublishedAt(article.publishedAt)}
                        </time>
                      </div>

                      <h2 className="line-clamp-2 text-[15px] font-semibold leading-5 text-zinc-950 transition-colors duration-300 group-hover:text-sky-700 dark:text-zinc-50 dark:group-hover:text-zinc-200 sm:text-[1.05rem] sm:leading-6">
                        {article.title}
                      </h2>

                      <p className="mt-2.5 flex-grow line-clamp-3 text-sm leading-5 text-zinc-600 dark:text-zinc-300 sm:mt-3 sm:line-clamp-4 sm:leading-6">
                        {article.description || "No description available."}
                      </p>

                      <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400 sm:mt-4">
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
                        className="mt-4 inline-flex min-h-[42px] w-full items-center justify-center rounded-full bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-black dark:hover:bg-white sm:mt-5 sm:min-h-[44px]"
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
