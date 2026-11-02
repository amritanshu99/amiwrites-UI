import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ArrowRight, ArrowUpRight, BookOpen, Clock, Filter, Plus, RefreshCw, Search, Trash2, TrendingUp, X } from "lucide-react";
import { toast } from "react-toastify";
import axios from "../../utils/api";
import Loader from "../Loader/Loader";
import PushNotificationButton from "../Floating-buttons/PushNotificationButton";
import { useDebounce } from "../../hooks/useDebounce";
import { useVerifiedAuth } from "../../hooks/useVerifiedAuth";
import {
  createTrendingEventId,
  sendTrendingEvent,
} from "../../utils/trendingAnalytics";
import { useTrendingBlogs } from "../../hooks/useTrendingBlogs";
import { blogPreview, blogPublicationDate } from "./blogPresentation";
import "./blogs.css";

const INITIAL_SKELETON_KEYS = ["init-0", "init-1", "init-2"];
const PAGINATION_SKELETON_KEYS = ["pag-0", "pag-1", "pag-2"];
const IMPRESSION_RETRY_DELAY_MS = 250;
const IMPRESSION_MAX_DELIVERY_ROUNDS = 3;
function isRetryableTrendingDeliveryError(error) {
  const status = Number(error?.status);
  return (
    !Number.isFinite(status) ||
    status <= 0 ||
    status === 408 ||
    status === 429 ||
    status >= 500
  );
}

const BlogSkeleton = memo(function BlogSkeleton() {
  return (
    <div className="journal-card journal-skeleton" aria-hidden="true">
      <div className="journal-skeleton__label" />
      <div className="journal-skeleton__title" />
      <div className="journal-skeleton__title journal-skeleton__short" />
      <div className="journal-skeleton__line" />
      <div className="journal-skeleton__line" />
      <div className="journal-skeleton__footer" />
    </div>
  );
});

const BlogCard = memo(forwardRef(function BlogCard({
  blog, isAdmin, isDeleting, isTrending, featured, onDeleteBlog, onTrackClick,
}, forwardedRef) {
  const publicationDate = blogPublicationDate(blog);
  const publishedDate = publicationDate
    ? new Date(publicationDate).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })
    : "Date unavailable";
  const { excerpt, minutes } = useMemo(() => blogPreview(blog), [blog]);

  return (
    <article ref={forwardedRef} data-blog-id={blog._id}
      className={`journal-card${featured ? " journal-card--featured" : ""}`}>
      <div className="journal-card__eyebrow">
        <span className="journal-category">{blog.category || "Perspectives"}</span>
        {isTrending && (
          <span className="journal-trending" aria-label="Trending">
            <TrendingUp size={14} aria-hidden="true" /> Trending
          </span>
        )}
        {isAdmin && (
          <button type="button" className="journal-icon-button journal-delete"
            aria-label={`Delete blog titled ${blog.title}`} disabled={isDeleting}
            onClick={() => onDeleteBlog(blog._id)}>
            {isDeleting ? <Loader size="small" /> : <Trash2 size={16} />}
          </button>
        )}
      </div>
      <Link to={`/blogs/${blog._id}?src=list`} onClick={() => onTrackClick(blog._id)}
        className="journal-card__link" aria-label={`Read ${blog.title}`}>
        {featured && <span className="journal-feature-label">{isTrending ? "In the spotlight" : "Latest story"}</span>}
        <h2>{blog.title}</h2>
        <p className="journal-card__excerpt">{excerpt || "Discover the full story and explore a new perspective."}</p>
        <div className="journal-card__footer">
          <div className="journal-card__meta">
            <time dateTime={publicationDate}>{publishedDate}</time>
            <span><Clock size={13} aria-hidden="true" /> {minutes} min read</span>
          </div>
          <span className="journal-card__arrow" aria-hidden="true"><ArrowUpRight size={20} /></span>
        </div>
      </Link>
      {featured && <span className="journal-feature-number" aria-hidden="true">01</span>}
    </article>
  );
}));

const BlogList = () => {
  const { isAdmin, verifiedAdminToken } = useVerifiedAuth();
  const [blogs, setBlogs] = useState([]);
  const { items: trendingItems, status: trendingStatus, refresh: refreshTrending } = useTrendingBlogs();
  const [listError, setListError] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const fetchErrorRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [filter, setFilter] = useState("trending");
  const [search, setSearch] = useState("");
  const [refreshVersion, setRefreshVersion] = useState(0);
  const loaderRef = useRef(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const fetchedPagesRef = useRef(new Set());
  const requestGenerationRef = useRef(0);
  const activeRequestRef = useRef(null);
  const debouncedSearch = useDebounce(search, 500);

  const deletedBlogIdsRef = useRef(new Set());
  const rankedBlogs = trendingItems.filter((post) => !deletedBlogIdsRef.current.has(String(post._id)));
  const trendingIds = new Set(rankedBlogs.map((post) => String(post._id)));

  const trackClick = useCallback((postId) => {
    if (!postId) return;
    const eventId = createTrendingEventId();
    void sendTrendingEvent("click", { postId }, { eventId, attempts: 2 }).catch(
      () => {},
    );
  }, []);

  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const pageRef = useRef(1);
  const observerRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const impressionObserverRef = useRef(null);
  const cardNodesRef = useRef(new Map());
  const seenImpressionsRef = useRef(new Set());
  const impressionEventIdsRef = useRef(new Map());
  const impressionInFlightRef = useRef(new Set());
  const impressionDeliveryRoundsRef = useRef(new Map());
  const impressionRetryTimersRef = useRef(new Map());
  const terminalImpressionsRef = useRef(new Set());

  const resetObserver = useCallback(() => {
    if (observerRef.current && loaderRef.current) {
      try {
        observerRef.current.unobserve(loaderRef.current);
      } catch (e) {}
      try {
        observerRef.current.observe(loaderRef.current);
      } catch (e) {}
    }
  }, []);

  const fetchBlogs = useCallback(async (
    pageNumber,
    currentSearch,
    currentFilter,
    generation = requestGenerationRef.current,
  ) => {
    const searchQuery = currentSearch ?? "";
    const sortOrder = currentFilter === "oldest" ? "oldest" : "latest";
    const cacheKey = `${pageNumber}-${searchQuery}-${sortOrder}`;

    if (fetchedPagesRef.current.has(cacheKey)) return true;
    if (loadingRef.current) return false;

    const controller = new AbortController();
    activeRequestRef.current = controller;
    setLoading(true);
    setListError(false);
    fetchErrorRef.current = false;
    loadingRef.current = true;
    try {
      const res = await axios.get(
        `/api/blogs?page=${pageNumber}&limit=10&search=${encodeURIComponent(
          searchQuery
        )}&sort=${sortOrder}`,
        { signal: controller.signal, timeout: 15000 },
      );

      if (controller.signal.aborted || generation !== requestGenerationRef.current) {
        return false;
      }

      const nextBlogs = (Array.isArray(res.data?.blogs) ? res.data.blogs : []).filter(
        (post) => !deletedBlogIdsRef.current.has(String(post?._id)),
      );
      setBlogs((prev) => {
        if (pageNumber === 1) return nextBlogs;

        const existingIds = new Set(prev.map((post) => String(post._id)));
        return [
          ...prev,
          ...nextBlogs.filter((post) => !existingIds.has(String(post._id))),
        ];
      });
      fetchedPagesRef.current.add(cacheKey);
      pageRef.current = pageNumber;
      hasMoreRef.current = Boolean(res.data?.hasMore);
      setHasMore(hasMoreRef.current);
      return true;
    } catch (err) {
      const cancelled = controller.signal.aborted || err?.code === "ERR_CANCELED";
      if (!cancelled && generation === requestGenerationRef.current) {
        setListError(true);
        fetchErrorRef.current = true;
      }
      return false;
    } finally {
      if (activeRequestRef.current === controller) {
        activeRequestRef.current = null;
        setLoading(false);
        loadingRef.current = false;
        resetObserver();
      }
    }
  }, [resetObserver]);

  const findScrollContainer = useCallback((startEl) => {
    const explicit = document.querySelector(".h-screen.overflow-y-scroll.relative");
    if (explicit) {
      try {
        const style = getComputedStyle(explicit);
        if (
          (style.overflowY === "auto" || style.overflowY === "scroll")
        ) {
          return explicit;
        }
      } catch (e) {}
    }

    if (!startEl) return null;
    let node = startEl.parentElement;
    while (node && node !== document.body) {
      try {
        const style = getComputedStyle(node);
        const overflowY = style.overflowY;
        if (
          (overflowY === "auto" || overflowY === "scroll") &&
          node.scrollHeight > node.clientHeight
        ) {
          return node;
        }
      } catch (e) {}
      node = node.parentElement;
    }
    return null;
  }, []);

  const registerBlogCard = useCallback((postId, node) => {
    const key = String(postId || "");
    if (!key) return;

    const previousNode = cardNodesRef.current.get(key);
    if (previousNode && previousNode !== node) {
      impressionObserverRef.current?.unobserve(previousNode);
    }

    if (!node) {
      cardNodesRef.current.delete(key);
      return;
    }

    cardNodesRef.current.set(key, node);
    impressionObserverRef.current?.observe(node);
  }, []);

  useEffect(() => {
    if (typeof IntersectionObserver !== "function") return undefined;
    let active = true;
    const retryTimers = impressionRetryTimersRef.current;
    const inFlight = impressionInFlightRef.current;
    const deliveryRounds = impressionDeliveryRoundsRef.current;
    const terminalImpressions = terminalImpressionsRef.current;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const ratio = Number(entry.intersectionRatio ?? 0);
          if (!entry.isIntersecting || ratio < 0.5) return;

          const postId = entry.target?.dataset?.blogId;
          if (
            !postId ||
            seenImpressionsRef.current.has(postId) ||
            terminalImpressionsRef.current.has(postId) ||
            impressionInFlightRef.current.has(postId)
          ) {
            return;
          }

          observer.unobserve(entry.target);
          const eventId =
            impressionEventIdsRef.current.get(postId) || createTrendingEventId();
          impressionEventIdsRef.current.set(postId, eventId);
          const deliveryRound =
            (impressionDeliveryRoundsRef.current.get(postId) || 0) + 1;
          impressionDeliveryRoundsRef.current.set(postId, deliveryRound);
          impressionInFlightRef.current.add(postId);
          void sendTrendingEvent(
            "impression",
            { postId },
            { eventId, attempts: 2 },
          )
            .then(() => {
              if (!active) return;
              seenImpressionsRef.current.add(postId);
              impressionEventIdsRef.current.delete(postId);
              impressionDeliveryRoundsRef.current.delete(postId);
              const retryTimer = impressionRetryTimersRef.current.get(postId);
              if (retryTimer) clearTimeout(retryTimer);
              impressionRetryTimersRef.current.delete(postId);
            })
            .catch((error) => {
              if (!active || seenImpressionsRef.current.has(postId)) return;
              if (
                !isRetryableTrendingDeliveryError(error) ||
                deliveryRound >= IMPRESSION_MAX_DELIVERY_ROUNDS
              ) {
                terminalImpressionsRef.current.add(postId);
                impressionEventIdsRef.current.delete(postId);
                impressionDeliveryRoundsRef.current.delete(postId);
                return;
              }
              const previousTimer = impressionRetryTimersRef.current.get(postId);
              if (previousTimer) clearTimeout(previousTimer);
              const retryTimer = setTimeout(() => {
                impressionRetryTimersRef.current.delete(postId);
                if (!active || seenImpressionsRef.current.has(postId)) return;
                const currentNode = cardNodesRef.current.get(postId);
                if (currentNode) observer.observe(currentNode);
              }, IMPRESSION_RETRY_DELAY_MS * deliveryRound);
              impressionRetryTimersRef.current.set(postId, retryTimer);
            })
            .finally(() => {
              impressionInFlightRef.current.delete(postId);
            });
        });
      },
      { threshold: 0.5 },
    );

    impressionObserverRef.current = observer;
    cardNodesRef.current.forEach((node) => observer.observe(node));

    return () => {
      active = false;
      observer.disconnect();
      retryTimers.forEach((timer) => clearTimeout(timer));
      retryTimers.clear();
      inFlight.clear();
      deliveryRounds.clear();
      terminalImpressions.clear();
      if (impressionObserverRef.current === observer) {
        impressionObserverRef.current = null;
      }
    };
  }, []);

  const loadNextPage = useCallback(() => {
    if (loadingRef.current || !hasMoreRef.current || fetchErrorRef.current) return;

    const currentPage = Math.max(1, pageRef.current);
    const sortOrder = filter === "oldest" ? "oldest" : "latest";
    const currentKey = `${currentPage}-${debouncedSearch}-${sortOrder}`;
    const nextPage = fetchedPagesRef.current.has(currentKey)
      ? currentPage + 1
      : currentPage;

    void fetchBlogs(
      nextPage,
      debouncedSearch,
      filter,
      requestGenerationRef.current,
    );
  }, [debouncedSearch, fetchBlogs, filter]);

  const checkAndLoadByScroll = useCallback((scroller) => {
    if (loadingRef.current || !hasMoreRef.current || fetchErrorRef.current) return;

    let distanceToBottom = Infinity;
    if (
      !scroller ||
      scroller === window ||
      scroller === document.documentElement ||
      scroller === document.body
    ) {
      const doc = document.documentElement || document.body;
      const scrollTop = window.scrollY || window.pageYOffset || doc.scrollTop || 0;
      const clientHeight = window.innerHeight || doc.clientHeight;
      const scrollHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      );
      distanceToBottom = scrollHeight - (scrollTop + clientHeight);
    } else {
      distanceToBottom =
        scroller.scrollHeight - (scroller.scrollTop + scroller.clientHeight);
    }

    const thresholdPx = 350;
    if (distanceToBottom <= thresholdPx) {
      loadNextPage();
    }
  }, [loadNextPage]);

  useEffect(() => {
    let scrollTarget;
    let scrollTimer;
    const onScroll = () => {
      if (scrollTimer) return;
      scrollTimer = setTimeout(() => {
        scrollTimer = null;
        checkAndLoadByScroll(scrollContainerRef.current);
      }, 150);
    };
    const build = () => {
      observerRef.current?.disconnect();
      scrollTarget?.removeEventListener("scroll", onScroll);
      const scroller = findScrollContainer(loaderRef.current);
      scrollContainerRef.current = scroller;
      if (typeof IntersectionObserver === "function") {
        observerRef.current = new IntersectionObserver((entries) => {
          if (entries[0]?.isIntersecting) loadNextPage();
        }, { root: scroller, rootMargin: "400px 0px", threshold: 0 });
        if (loaderRef.current) observerRef.current.observe(loaderRef.current);
      }
      scrollTarget = scroller || window;
      scrollTarget.addEventListener("scroll", onScroll, { passive: true });
    };
    // Build after the initial fetch effect has reset pagination.
    const timer = setTimeout(build, 40);
    window.addEventListener("resize", build);
    return () => {
      clearTimeout(timer);
      clearTimeout(scrollTimer);
      observerRef.current?.disconnect();
      observerRef.current = null;
      scrollTarget?.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", build);
    };
  }, [checkAndLoadByScroll, findScrollContainer, loadNextPage]);

  useEffect(() => {
    const scrollContainer = document.querySelector(
      ".h-screen.overflow-y-scroll.relative"
    );
    if (scrollContainer)
      scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);

  const handleDelete = useCallback(async (id) => {
    const tokenIsCurrent = localStorage.getItem("token") === verifiedAdminToken;
    if (!isAdmin || !verifiedAdminToken || !tokenIsCurrent) {
      return toast.error("Verified admin access is required to delete a blog");
    }

    setDeletingId(id);
    try {
      await axios.delete(`/api/blogs/${id}`, {
        headers: { Authorization: `Bearer ${verifiedAdminToken}` },
      });

      toast.success("Blog deleted");
      deletedBlogIdsRef.current.add(String(id));
      setBlogs((current) =>
        current.filter((post) => String(post?._id) !== String(id)),
      );
      setRefreshVersion((current) => current + 1);
    } catch {
      toast.error("Failed to delete blog");
    } finally {
      setDeletingId(null);
    }
  }, [isAdmin, verifiedAdminToken]);

  useEffect(() => {
    const previousRequest = activeRequestRef.current;
    activeRequestRef.current = null;
    if (previousRequest) previousRequest.abort();

    const generation = requestGenerationRef.current + 1;
    requestGenerationRef.current = generation;
    loadingRef.current = false;
    setBlogs([]);
    hasMoreRef.current = true;
    setHasMore(true);
    setListError(false);
    fetchErrorRef.current = false;
    fetchedPagesRef.current = new Set();
    pageRef.current = 1;
    setLoading(false);

    void fetchBlogs(1, debouncedSearch, filter, generation);

    return () => {
      if (requestGenerationRef.current !== generation) return;
      const activeRequest = activeRequestRef.current;
      activeRequestRef.current = null;
      loadingRef.current = false;
      if (activeRequest) activeRequest.abort();
    };
  }, [debouncedSearch, fetchBlogs, filter, refreshVersion]);

  const handleAddBlog = useCallback(() => navigate("/add-blog"), [navigate]);

  const filteredBlogs = (() => {
    if (filter !== "trending") return blogs;
    if (trendingStatus === "loading") return [];
    if (trendingStatus === "failed") return blogs;

    const normalizedSearch = debouncedSearch.trim().toLocaleLowerCase();
    const matchingRanked = normalizedSearch
      ? rankedBlogs.filter((post) =>
          String(post?.title || "").toLocaleLowerCase().includes(normalizedSearch),
        )
      : rankedBlogs;
    const rankedIds = new Set(matchingRanked.map((post) => String(post._id)));

    return [
      ...matchingRanked,
      ...blogs.filter((post) => !rankedIds.has(String(post?._id))),
    ];
  })();

  const waitingForTrending = filter === "trending" && trendingStatus === "loading";

  const retryBlogs = () => {
    fetchErrorRef.current = false;
    loadNextPage();
  };
  const isSearching = Boolean(debouncedSearch.trim());
  const resultsLabel = isSearching ? `Results for “${debouncedSearch.trim()}”`
    : filter === "trending" ? "Discover your next read" : filter === "latest" ? "Fresh from the journal" : "From the beginning";

  return (
    <div className="journal-page">
      <PushNotificationButton />
      <div className="journal-shell">
        <header className="journal-hero">
          <div>
            <p className="journal-kicker"><span /> THE AMIVERSE JOURNAL</p>
            <h1>Ideas for <em>curious minds.</em></h1>
            <p className="journal-intro">Thoughts on technology, software, and the things we learn along the way. Find something worth your time.</p>
          </div>
          {isAdmin ? (
            <button type="button" onClick={handleAddBlog} className="journal-button journal-button--primary">
              <Plus size={17} aria-hidden="true" /> Add Blog
            </button>
          ) : (
            <div className="journal-hero-note"><BookOpen size={22} aria-hidden="true" /><span>A fresh perspective.<br />One article at a time.</span></div>
          )}
        </header>

        <section className="journal-toolbar" aria-label="Find an article">
          <div className="journal-search">
            <Search size={19} aria-hidden="true" />
            <input id="blog-search" type="text" placeholder="Find your next read…" value={search}
              onChange={(e) => setSearch(e.target.value)} maxLength={100} aria-label="Search blogs by title" />
            {search && <button type="button" className="journal-icon-button" onClick={() => {
              setSearch(""); document.getElementById("blog-search")?.focus();
            }} aria-label="Clear search"><X size={17} /></button>}
          </div>
          <div className="journal-sort">
            <Filter size={16} aria-hidden="true" />
            <label htmlFor="blog-sort">Sort by</label>
            <select id="blog-sort" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Sort blogs">
              <option value="trending">Trending</option>
              <option value="latest">Latest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        </section>

        <div className="journal-section-heading">
          <div><p className="journal-section-title">{resultsLabel}</p>
            <p className="journal-section-description">{isSearching ? "Articles matching your title search."
              : filter === "trending" && trendingStatus === "ready" && rankedBlogs.length > 0
                ? "Trending reads first, followed by the latest stories."
                : filter === "oldest" ? "Explore the archive, oldest stories first." : "Explore the latest stories from AmiVerse."}</p>
          </div>
          <span role="status" className="journal-result-count">{loading || waitingForTrending ? "Finding stories…" : `${filteredBlogs.length} ${filteredBlogs.length === 1 ? "article" : "articles"}${hasMore ? " loaded" : ""}`}</span>
        </div>

        {filter === "trending" && trendingStatus === "failed" && (
          <div className="journal-notice" role="status">
            <span>Trending is taking a break. You can still explore the latest articles.</span>
            <button type="button" onClick={refreshTrending}><RefreshCw size={14} aria-hidden="true" /> Retry trending</button>
          </div>
        )}

        <div className="journal-grid" aria-busy={loading || waitingForTrending}>
          {filteredBlogs.map((blog, index) => (
            <BlogCard key={blog._id} ref={(node) => registerBlogCard(blog._id, node)} blog={blog}
              isAdmin={isAdmin} isDeleting={deletingId === blog._id}
              isTrending={trendingIds.has(String(blog._id))}
              featured={index === 0 && filter === "trending" && !isSearching}
              onDeleteBlog={handleDelete} onTrackClick={trackClick} />
          ))}
          {(loading || waitingForTrending) && (filteredBlogs.length ? PAGINATION_SKELETON_KEYS : INITIAL_SKELETON_KEYS)
            .map((key) => <BlogSkeleton key={key} />)}
        </div>

        {listError && (
          <div className="journal-empty" role="alert">
            <RefreshCw size={28} aria-hidden="true" />
            <h2>{filteredBlogs.length ? "There’s more to explore" : "We couldn’t load the articles"}</h2>
            <p>There was a connection problem. Give it another try.</p>
            <button type="button" className="journal-button" onClick={retryBlogs}>Try again</button>
          </div>
        )}
        {!filteredBlogs.length && !loading && !waitingForTrending && !listError && (
          <div className="journal-empty">
            <Search size={28} aria-hidden="true" />
            <h2>{isSearching ? "No matching stories" : "The next story is on its way"}</h2>
            <p>{isSearching ? "Try another title or clear your search to explore all articles." : "Check back soon for fresh ideas and new perspectives."}</p>
            {isSearching && <button type="button" className="journal-button" onClick={() => setSearch("")}>Clear search <ArrowRight size={16} /></button>}
          </div>
        )}
        <div ref={loaderRef} className="journal-pagination">
          {hasMore && !listError && !waitingForTrending && filteredBlogs.length > 0 && (
            <button type="button" className="journal-button" onClick={loadNextPage} disabled={loading}>
              {loading ? "Loading articles…" : "Load more articles"}<ArrowRight size={16} aria-hidden="true" />
            </button>
          )}
          {!hasMore && filteredBlogs.length > 0 && !loading && <p>You’re all caught up. Stay curious.</p>}
        </div>
      </div>
    </div>
  );
};

export default BlogList;
