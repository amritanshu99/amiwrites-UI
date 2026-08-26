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

function TechByteSwipeView({
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
  const articleCount = articles.length;

  useEffect(() => {
    storyRefs.current = storyRefs.current.slice(0, articleCount);
    setActiveIndex((currentIndex) =>
      clampIndex(currentIndex, articleCount),
    );
  }, [articleCount]);

  useEffect(
    () => () => {
      if (scrollFrameRef.current !== null) {
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

      deck.scrollTo({
        top: deck.scrollTop + storyTop - deckTop,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    },
    [articleCount, prefersReducedMotion],
  );

  const handleScroll = useCallback(() => {
    if (scrollFrameRef.current !== null) return;

    scrollFrameRef.current = window.requestAnimationFrame(() => {
      scrollFrameRef.current = null;

      const deck = deckRef.current;
      if (!deck || !deck.clientHeight) return;

      const nextIndex = clampIndex(
        Math.round(deck.scrollTop / deck.clientHeight),
        articleCount,
      );

      setActiveIndex((currentIndex) =>
        currentIndex === nextIndex ? currentIndex : nextIndex,
      );
    });
  }, [articleCount]);

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

  const handleOpenArticle = useCallback(
    (url) => {
      if (typeof onOpenArticle === "function") {
        onOpenArticle(url);
      }
    },
    [onOpenArticle],
  );

  if (!articleCount) {
    return (
      <section
        className="rounded-[1.35rem] border border-white/80 bg-white/90 px-5 py-10 text-center shadow-[0_20px_50px_-38px_rgba(15,23,42,0.25)] dark:border-zinc-900 dark:bg-black"
        aria-label="Swipe through tech news"
      >
        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          No stories are available in swipe view yet.
        </p>
      </section>
    );
  }

  const progress = ((activeIndex + 1) / articleCount) * 100;

  return (
    <section
      className="relative flex h-full min-h-0 flex-col"
      aria-labelledby={`${deckId}-title`}
    >
      <div className="mb-2 flex shrink-0 items-end justify-between gap-4 px-1">
        <div className="min-w-0">
          <h2
            id={`${deckId}-title`}
            className="text-sm font-semibold text-zinc-950 dark:text-white"
          >
            Swipe briefing
          </h2>
          <p
            id={instructionsId}
            className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400"
          >
            Swipe vertically, or use the arrow controls.
          </p>
        </div>

        <p
          className="shrink-0 text-xs font-semibold tabular-nums text-sky-700 dark:text-sky-300"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          Story {activeIndex + 1} of {articleCount}
        </p>
      </div>

      <div
        className="mb-2 h-1 shrink-0 overflow-hidden rounded-full bg-zinc-200/90 dark:bg-zinc-800"
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

      <div className="relative min-h-0 flex-1">
        <div
          id={deckId}
          ref={deckRef}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          aria-describedby={instructionsId}
          aria-label="Tech news swipe deck"
          className={`h-full min-h-0 touch-pan-y snap-y snap-mandatory overflow-x-hidden overflow-y-auto rounded-[1.45rem] border border-white/80 bg-white/45 shadow-[0_26px_70px_-44px_rgba(15,23,42,0.32)] outline-none ring-1 ring-sky-100/60 backdrop-blur-xl focus-visible:ring-4 focus-visible:ring-sky-200/80 dark:border-zinc-900 dark:bg-black/55 dark:ring-white/5 dark:focus-visible:ring-sky-500/20 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
            prefersReducedMotion ? "" : "scroll-smooth"
          } motion-reduce:scroll-auto`}
        >
          {articles.map((article, index) => (
            <article
              key={`${article.url}-${index}`}
              ref={(node) => {
                storyRefs.current[index] = node;
              }}
              aria-current={index === activeIndex ? "true" : undefined}
              aria-label={`Story ${index + 1} of ${articleCount}: ${article.title}`}
              aria-posinset={index + 1}
              aria-setsize={articleCount}
              className="h-full snap-start snap-always p-2"
            >
              <div className="tech-byte-swipe-card group grid h-full grid-rows-[minmax(0,42%)_minmax(0,1fr)] overflow-hidden rounded-[1.25rem] border border-white/90 bg-white/95 shadow-[0_24px_60px_-42px_rgba(15,23,42,0.28)] dark:border-zinc-800 dark:bg-black dark:shadow-[0_26px_64px_-40px_rgba(0,0,0,0.96)]">
                <div className="relative min-h-0 overflow-hidden bg-zinc-100 dark:bg-zinc-950">
                  <img
                    src={article.image}
                    alt=""
                    loading={index < 2 ? "eager" : "lazy"}
                    decoding="async"
                    onError={onImageError}
                    className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.03] motion-reduce:transform-none motion-reduce:transition-none"
                  />
                  <div
                    className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent"
                    aria-hidden="true"
                  />
                  <span className="absolute left-3 top-3 max-w-[70%] truncate rounded-full border border-white/40 bg-black/60 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-white backdrop-blur-md">
                    {article.source?.name || "Unknown Source"}
                  </span>
                </div>

                <div className="tech-byte-swipe-card-content flex min-h-0 flex-col p-4 pb-5 sm:p-5">
                  <time
                    dateTime={
                      article.publishedAt == null
                        ? undefined
                        : String(article.publishedAt)
                    }
                    className="text-[11px] font-semibold uppercase tracking-[0.13em] text-zinc-500 dark:text-zinc-400"
                  >
                    {formatPublishedAt(article.publishedAt)}
                  </time>

                  <h3 className="tech-byte-swipe-card-title mt-2 line-clamp-3 text-xl font-semibold leading-tight text-zinc-950 dark:text-zinc-50">
                    {article.title}
                  </h3>

                  <p className="tech-byte-swipe-card-description mt-2.5 line-clamp-4 text-sm leading-5 text-zinc-600 dark:text-zinc-300">
                    {article.description}
                  </p>

                  <div className="mt-auto flex items-end justify-between gap-3 pt-3">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.13em] text-zinc-400 dark:text-zinc-500">
                      {index + 1} / {articleCount}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleOpenArticle(article.url)}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_16px_34px_-24px_rgba(15,23,42,0.9)] transition duration-200 hover:-translate-y-0.5 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 dark:bg-zinc-100 dark:text-black dark:hover:bg-white dark:focus-visible:ring-white/20 motion-reduce:transform-none motion-reduce:transition-none"
                      aria-label={`Read full story: ${article.title}`}
                    >
                      Read full story
                      <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <nav
          className="absolute right-4 top-4 z-10 flex gap-2"
          aria-label="Swipe deck controls"
        >
          <button
            type="button"
            onClick={() => scrollToStory(activeIndex - 1)}
            disabled={activeIndex === 0}
            aria-controls={deckId}
            aria-label="Previous story"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/90 text-zinc-800 shadow-[0_12px_30px_-18px_rgba(15,23,42,0.65)] backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-white dark:hover:bg-zinc-800 dark:focus-visible:ring-sky-500/20 motion-reduce:transform-none motion-reduce:transition-none"
          >
            <ChevronUp className="h-5 w-5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => scrollToStory(activeIndex + 1)}
            disabled={activeIndex === articleCount - 1}
            aria-controls={deckId}
            aria-label="Next story"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-950/10 bg-zinc-950/92 text-white shadow-[0_14px_34px_-18px_rgba(15,23,42,0.8)] backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:bg-white/90 dark:text-black dark:hover:bg-white dark:focus-visible:ring-white/20 motion-reduce:transform-none motion-reduce:transition-none"
          >
            <ChevronDown className="h-5 w-5" aria-hidden="true" />
          </button>
        </nav>
      </div>
    </section>
  );
}

export default React.memo(TechByteSwipeView);
