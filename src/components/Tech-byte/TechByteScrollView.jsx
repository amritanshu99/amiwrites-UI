import React, {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { ArrowUpRight, ChevronDown, ChevronUp } from "lucide-react";
import { useReducedMotion } from "framer-motion";

const clampIndex = (index, articleCount) =>
  Math.min(Math.max(index, 0), Math.max(articleCount - 1, 0));

const defaultFormatPublishedAt = () => "Date unavailable";

const getArticleTitle = (article) => article?.title || "Untitled story";

function TechByteScrollView({
  articles = [],
  formatPublishedAt = defaultFormatPublishedAt,
  onImageError,
  onOpenArticle,
}) {
  const deckId = useId();
  const instructionsId = `${deckId}-instructions`;
  const deckRef = useRef(null);
  const storyRefs = useRef([]);
  const scrollFrameRef = useRef(null);
  const prefersReducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const safeArticles = Array.isArray(articles) ? articles : [];
  const articleCount = safeArticles.length;

  useEffect(() => {
    storyRefs.current = storyRefs.current.slice(0, articleCount);
    setActiveIndex((currentIndex) =>
      clampIndex(currentIndex, articleCount),
    );
  }, [articleCount]);

  useEffect(
    () => () => {
      if (
        scrollFrameRef.current !== null &&
        typeof window.cancelAnimationFrame === "function"
      ) {
        window.cancelAnimationFrame(scrollFrameRef.current);
      }
    },
    [],
  );

  const scrollToStory = useCallback(
    (nextIndex) => {
      if (!articleCount) return;

      const boundedIndex = clampIndex(nextIndex, articleCount);
      const deck = deckRef.current;
      const story = storyRefs.current[boundedIndex];

      setActiveIndex(boundedIndex);

      if (!deck || !story) return;

      const deckTop = deck.getBoundingClientRect().top;
      const storyTop = story.getBoundingClientRect().top;
      const nextScrollTop = deck.scrollTop + storyTop - deckTop;

      if (typeof deck.scrollTo === "function") {
        deck.scrollTo({
          top: nextScrollTop,
          behavior: prefersReducedMotion ? "auto" : "smooth",
        });
      } else {
        deck.scrollTop = nextScrollTop;
      }
    },
    [articleCount, prefersReducedMotion],
  );

  const updateActiveStory = useCallback(() => {
    const deck = deckRef.current;
    if (!deck || !deck.clientHeight) return;

    const nextIndex = clampIndex(
      Math.round(deck.scrollTop / deck.clientHeight),
      articleCount,
    );

    setActiveIndex((currentIndex) =>
      currentIndex === nextIndex ? currentIndex : nextIndex,
    );
  }, [articleCount]);

  const handleScroll = useCallback(() => {
    if (scrollFrameRef.current !== null) return;

    if (typeof window.requestAnimationFrame !== "function") {
      updateActiveStory();
      return;
    }

    scrollFrameRef.current = window.requestAnimationFrame(() => {
      scrollFrameRef.current = null;
      updateActiveStory();
    });
  }, [updateActiveStory]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.target !== event.currentTarget) return;

      let nextIndex = null;

      if (event.key === "ArrowDown" || event.key === "PageDown") {
        nextIndex = activeIndex + 1;
      } else if (event.key === "ArrowUp" || event.key === "PageUp") {
        nextIndex = activeIndex - 1;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = articleCount - 1;
      }

      if (nextIndex === null) return;

      event.preventDefault();
      scrollToStory(nextIndex);
    },
    [activeIndex, articleCount, scrollToStory],
  );

  const handleImageError = useCallback(
    (event) => {
      if (typeof onImageError === "function") {
        onImageError(event);
      }
    },
    [onImageError],
  );

  const handleOpenArticle = useCallback(
    (url) => {
      if (url && typeof onOpenArticle === "function") {
        onOpenArticle(url);
      }
    },
    [onOpenArticle],
  );

  const formatArticleDate = useCallback(
    (publishedAt) => {
      if (typeof formatPublishedAt !== "function") {
        return defaultFormatPublishedAt();
      }

      return formatPublishedAt(publishedAt);
    },
    [formatPublishedAt],
  );

  if (!articleCount) {
    return (
      <section
        className="rounded-[1.6rem] border border-white/80 bg-white/90 px-8 py-14 text-center shadow-[0_26px_70px_-44px_rgba(15,23,42,0.3)] dark:border-zinc-900 dark:bg-black"
        aria-label="Tech news scroll reader"
      >
        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          No stories are available in the scroll reader yet.
        </p>
      </section>
    );
  }

  const progress = ((activeIndex + 1) / articleCount) * 100;

  return (
    <section
      className="relative flex h-full min-h-0 flex-col"
      aria-labelledby={`${deckId}-title`}
      data-testid="tech-byte-scroll-view"
    >
      <div className="mb-3 flex shrink-0 items-end justify-between gap-6 px-1">
        <div className="min-w-0">
          <h2
            id={`${deckId}-title`}
            className="text-base font-semibold tracking-tight text-zinc-950 dark:text-white"
          >
            Scroll briefing
          </h2>
          <p
            id={instructionsId}
            className="mt-1 text-sm text-zinc-500 dark:text-zinc-400"
          >
            Use your mouse wheel or trackpad to move one story at a time. Arrow
            keys work too.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <p
            className="rounded-full border border-sky-200/80 bg-sky-50/90 px-3.5 py-2 text-xs font-semibold tabular-nums text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-200"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            Story {activeIndex + 1} of {articleCount}
          </p>

          <nav
            className="flex gap-2"
            aria-label="Scroll reader controls"
          >
            <button
              type="button"
              onClick={() => scrollToStory(activeIndex - 1)}
              disabled={activeIndex === 0}
              aria-controls={deckId}
              aria-label="Previous story"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white/90 text-zinc-800 shadow-[0_12px_28px_-20px_rgba(15,23,42,0.7)] backdrop-blur-md transition hover:-translate-y-0.5 hover:border-sky-200 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200/80 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-800 dark:bg-zinc-950/90 dark:text-white dark:hover:border-zinc-700 dark:hover:bg-zinc-900 dark:focus-visible:ring-sky-500/20 motion-reduce:transform-none motion-reduce:transition-none"
            >
              <ChevronUp className="h-5 w-5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={() => scrollToStory(activeIndex + 1)}
              disabled={activeIndex === articleCount - 1}
              aria-controls={deckId}
              aria-label="Next story"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-950/10 bg-zinc-950 text-white shadow-[0_14px_32px_-18px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white dark:text-black dark:hover:bg-zinc-100 dark:focus-visible:ring-white/20 motion-reduce:transform-none motion-reduce:transition-none"
            >
              <ChevronDown className="h-5 w-5" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>

      <div
        className="mb-3 h-1 shrink-0 overflow-hidden rounded-full bg-zinc-200/90 dark:bg-zinc-800"
        role="progressbar"
        aria-label="Reading progress"
        aria-valuemin={1}
        aria-valuemax={articleCount}
        aria-valuenow={activeIndex + 1}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-500 to-teal-400 transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div
        id={deckId}
        ref={deckRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onScroll={handleScroll}
        aria-describedby={instructionsId}
        aria-label="Tech news scroll reader"
        className={`min-h-0 flex-1 snap-y snap-mandatory overflow-x-hidden overflow-y-auto rounded-[1.75rem] border border-white/80 bg-white/45 shadow-[0_32px_90px_-52px_rgba(15,23,42,0.38)] outline-none ring-1 ring-sky-100/60 backdrop-blur-xl focus-visible:ring-4 focus-visible:ring-sky-200/80 dark:border-zinc-900 dark:bg-black/55 dark:ring-white/5 dark:focus-visible:ring-sky-500/20 [scrollbar-color:rgb(14_165_233_/_0.45)_transparent] [scrollbar-width:thin] ${
          prefersReducedMotion ? "" : "scroll-smooth"
        } motion-reduce:scroll-auto`}
      >
        {safeArticles.map((article, index) => {
          const title = getArticleTitle(article);
          const sourceName = article?.source?.name || "Unknown Source";
          const publishedAt = article?.publishedAt;

          return (
            <article
              key={`${article?.url || title}-${index}`}
              ref={(node) => {
                storyRefs.current[index] = node;
              }}
              aria-current={index === activeIndex ? "true" : undefined}
              aria-label={`Story ${index + 1} of ${articleCount}: ${title}`}
              aria-posinset={index + 1}
              aria-setsize={articleCount}
              className="h-full snap-start snap-always p-3"
            >
              <div className="group grid h-full grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.92fr)] overflow-hidden rounded-[1.45rem] border border-white/90 bg-white/95 shadow-[0_28px_70px_-44px_rgba(15,23,42,0.32)] dark:border-zinc-800 dark:bg-black dark:shadow-[0_28px_72px_-42px_rgba(0,0,0,0.98)]">
                <div className="relative min-w-0 overflow-hidden bg-zinc-100 dark:bg-zinc-950">
                  {article?.image ? (
                    <img
                      src={article.image}
                      alt=""
                      loading={index < 2 ? "eager" : "lazy"}
                      decoding="async"
                      onError={handleImageError}
                      className="h-full w-full object-cover object-center transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.025] motion-reduce:transform-none motion-reduce:transition-none"
                    />
                  ) : (
                    <div
                      className="h-full w-full bg-[radial-gradient(circle_at_30%_25%,rgba(56,189,248,0.35),transparent_34%),linear-gradient(145deg,#e4edf4,#cbd8e1)] dark:bg-[radial-gradient(circle_at_30%_25%,rgba(14,165,233,0.22),transparent_34%),linear-gradient(145deg,#09090b,#18181b)]"
                      aria-hidden="true"
                    />
                  )}

                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/10"
                    aria-hidden="true"
                  />

                  <span className="absolute left-5 top-5 max-w-[70%] truncate rounded-full border border-white/35 bg-black/55 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white shadow-sm backdrop-blur-md">
                    {sourceName}
                  </span>

                  <div className="absolute bottom-5 left-5 text-white">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/70">
                      In this briefing
                    </p>
                    <p className="mt-1 text-lg font-semibold tabular-nums">
                      {String(index + 1).padStart(2, "0")}
                      <span className="mx-2 text-white/45">/</span>
                      {String(articleCount).padStart(2, "0")}
                    </p>
                  </div>
                </div>

                <div className="flex min-w-0 flex-col border-l border-zinc-100 p-7 dark:border-zinc-900 lg:p-9">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
                    <span>{sourceName}</span>
                    <span className="text-zinc-300 dark:text-zinc-700">
                      &bull;
                    </span>
                    <time
                      dateTime={
                        publishedAt == null ? undefined : String(publishedAt)
                      }
                    >
                      {formatArticleDate(publishedAt)}
                    </time>
                  </div>

                  <h3 className="mt-4 line-clamp-3 text-2xl font-semibold leading-[1.14] tracking-[-0.025em] text-zinc-950 [text-wrap:balance] dark:text-zinc-50 lg:text-[2rem]">
                    {title}
                  </h3>

                  <p className="mt-3 line-clamp-4 text-[15px] leading-6 text-zinc-600 dark:text-zinc-300 lg:leading-7">
                    {article?.description ||
                      "Open the full story for the complete report and context."}
                  </p>

                  <div className="mt-auto flex items-end justify-between gap-5 border-t border-zinc-200/80 pt-5 dark:border-zinc-800">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
                        Wheel / trackpad
                      </p>
                      <p className="mt-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        Scroll for the next story
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenArticle(article?.url)}
                      className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_16px_34px_-24px_rgba(15,23,42,0.9)] transition duration-200 hover:-translate-y-0.5 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 dark:bg-zinc-100 dark:text-black dark:hover:bg-white dark:focus-visible:ring-white/20 motion-reduce:transform-none motion-reduce:transition-none"
                      aria-label={`Read full story: ${title}`}
                    >
                      Read full story
                      <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default React.memo(TechByteScrollView);
