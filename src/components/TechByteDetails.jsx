import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useLocation } from 'react-router-dom';
// Skeleton for loading state
const TechNewsSkeleton = () => (
  <div className="bg-white rounded-3xl shadow-lg overflow-hidden animate-pulse flex flex-col h-[500px]">
    <div className="h-56 bg-gray-200 w-full" />
    <div className="p-6 flex flex-col flex-grow">
      <div className="h-5 bg-gray-300 rounded w-3/4 mb-3" />
      <div className="h-3 bg-gray-200 rounded w-full mb-2" />
      <div className="h-3 bg-gray-200 rounded w-5/6 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-4/6 mb-4" />
      <div className="h-3 bg-gray-200 rounded w-3/4 mb-1" />
      <div className="h-3 bg-gray-200 rounded w-1/2 mb-6" />
      <div className="h-8 bg-blue-300 rounded-xl w-1/2 mt-auto" />
    </div>
  </div>
);

function TechNewsCards() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
 const { pathname } = useLocation();
  useEffect(() => {
    let link = document.querySelector("link[rel='canonical']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = window.location.href;

    let isMounted = true;

    document.title = "Tech-Byte";

    axios
      .get("https://amiwrites-backend-app-1.onrender.com/api/tech-news")
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
    // Find your scroll container element
    const scrollContainer = document.querySelector('.h-screen.overflow-y-scroll.relative');

    if (scrollContainer) {
      // Scroll it to top smoothly
      scrollContainer.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  }, [pathname]);

  const handleReadMoreClick = useCallback((e, url) => {
    e.preventDefault();
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  if (error)
    return (
      <p className="text-center mt-20 text-red-600 text-lg font-semibold">
        {error}
      </p>
    );

  return (
  <div className="w-full bg-gradient-to-br from-cyan-300 via-pink-300 to-yellow-200 dark:from-black dark:via-black dark:to-black min-h-screen py-10 px-4 sm:px-6 lg:px-8">
  <section className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8 text-center">
          Latest Tech News
        </h1>

        <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <TechNewsSkeleton key={i} />)
            : articles.map((article) => (
                <a
                  key={article.url}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Read full article: ${article.title}`}
                  className="group block bg-white rounded-3xl shadow-lg overflow-hidden flex flex-col transform transition duration-400 hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-blue-400"
                >
                  <div className="relative w-full h-56 overflow-hidden rounded-t-3xl bg-gray-100">
                    <img
                      src={article.image || "/placeholder-image.png"}
                      alt={article.title}
                      loading="lazy"
                      className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>

                  <div className="p-6 flex flex-col flex-grow">
                    <h2 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors duration-300">
                      {article.title}
                    </h2>

                    <p className="text-gray-700 flex-grow text-sm leading-relaxed line-clamp-5">
                      {article.description || "No description available."}
                    </p>

                    <div className="mt-5 flex flex-col text-gray-500 text-xs space-y-1">
                      <time dateTime={article.publishedAt} className="italic">
                        {new Date(article.publishedAt).toLocaleString()}
                      </time>
                      <span>
                        Source:{" "}
                        <a
                          href={article.source?.url || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-blue-600 underline"
                        >
                          {article.source?.name || "Unknown"}
                        </a>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleReadMoreClick(e, article.url)}
                      className="mt-6 bg-blue-600 text-white rounded-xl py-2 font-semibold text-sm tracking-wide shadow-md hover:bg-blue-700 transition"
                    >
                      Read More
                    </button>
                  </div>
                </a>
              ))}
        </div>
      </section>
    </div>
  );
}

export default React.memo(TechNewsCards);
