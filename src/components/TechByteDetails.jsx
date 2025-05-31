import React, { useEffect, useState } from "react";
import axios from "axios";
import Loader from "./Loader";

export default function TechNewsCards() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    axios
      .get(
        "https://newsapi.org/v2/top-headlines?category=technology&apiKey=e36d1ec32a5c44268ad724e8e36568cb"
      )
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

  if (loading) return <Loader />;

  if (error)
    return (
      <p className="text-center mt-20 text-red-600 text-lg font-semibold">
        {error}
      </p>
    );

  return (
    <section className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-12">
      <h2 className="text-4xl font-extrabold text-gray-900 mb-10 text-center tracking-tight">
        Latest Technology News
      </h2>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article, idx) => (
          <article
            key={idx}
            tabIndex={0}
            role="button"
            onClick={() => window.open(article.url, "_blank")}
            onKeyDown={(e) => {
              if (e.key === "Enter") window.open(article.url, "_blank");
            }}
            className="cursor-pointer bg-white rounded-xl shadow-md overflow-hidden flex flex-col transition-transform duration-300 ease-in-out hover:shadow-2xl hover:scale-[1.04] focus:outline-none focus:ring-4 focus:ring-indigo-400"
            aria-label={`Read article titled ${article.title}`}
          >
            {article.urlToImage ? (
              <img
                src={article.urlToImage}
                alt={article.title}
                className="h-52 w-full object-cover transition-transform duration-500 ease-in-out hover:scale-105"
                loading="lazy"
                decoding="async"
                fetchpriority="low"
              />
            ) : (
              <div className="h-52 w-full bg-gray-100 flex items-center justify-center text-gray-400 text-lg font-medium">
                No Image
              </div>
            )}

            <div className="p-6 flex flex-col flex-grow">
              <h3 className="text-xl font-semibold mb-3 text-gray-900 line-clamp-2 leading-tight">
                {article.title}
              </h3>
              <p className="text-gray-700 flex-grow line-clamp-3 leading-relaxed">
                {article.description || "No description available."}
              </p>

              <div className="mt-6 flex justify-between items-center text-sm text-gray-500 font-medium tracking-wide">
                <span className="capitalize">{article.source.name}</span>
                <time dateTime={article.publishedAt} className="whitespace-nowrap">
                  {new Date(article.publishedAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </time>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
