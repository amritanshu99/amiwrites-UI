import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Loader from "./Loader";

function TechNewsCards() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

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

  // Memoize the handler to avoid recreating the function each render
  const handleReadMoreClick = useCallback((e, url) => {
    e.preventDefault();
    window.open(url, "_blank", "noopener,noreferrer");
  }, []);

  if (loading) return <Loader />;

  if (error)
    return (
      <p className="text-center mt-20 text-red-600 text-lg font-semibold">
        {error}
      </p>
    );

  return (
    <section className="max-w-7xl mx-auto p-6 sm:p-10">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8 text-center">
        Latest Tech News
      </h1>

      <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <a
            key={article.url} // Use URL as a unique key
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
  );
}

export default React.memo(TechNewsCards);
