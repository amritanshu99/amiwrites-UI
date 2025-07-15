import React, { useState,useEffect } from "react";
import axios from "axios";
import Loader from "../Loader/Loader";
import { useLocation } from "react-router-dom";
const MoviePredict = () => {
  const [movie, setMovie] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
    const { pathname } = useLocation();
 useEffect(() => {
    const scrollContainer = document.querySelector(
      ".h-screen.overflow-y-scroll.relative"
    );
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [pathname]);
  const handleRecommend = async (e) => {
    e.preventDefault();
    if (!movie.trim()) return;

    setLoading(true);
    setError("");
    setResults(null);

    try {
      const response = await axios.post(
        "https://amiwrites-backend-app-2lp5.onrender.com/api/recommender/recommend",
        { movie, top_n: 5 }
      );
      setResults(response.data.recommendations);
    } catch (err) {
      setError(err.response?.data?.error || "❌ Something went wrong.");
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 bg-gradient-to-br from-cyan-300 via-pink-300 to-yellow-200 dark:from-black dark:via-zinc-900 dark:to-zinc-950 dark:text-white transition-all duration-300 ease-in-out">
      <div className="w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] px-8 py-10 sm:px-10 sm:py-12">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-center text-zinc-900 dark:text-white mb-6 tracking-tight">
          🎬 Hollywood Movie Recommender
        </h1>
        <p className="text-center text-lg text-gray-700 dark:text-gray-300 mb-10 leading-relaxed">
          ✨ Discover movies like your favorites using{" "}
          <span className="font-semibold text-pink-600 dark:text-pink-400">
            content-based filtering
          </span>{" "}
          powered by cosine similarity across thousands of Hollywood titles.
        </p>

        <form onSubmit={handleRecommend} className="flex flex-col gap-5">
          <input
            type="text"
            value={movie}
            onChange={(e) => setMovie(e.target.value)}
            placeholder="🎥 Try typing: Inception, Gladiator, or Interstellar..."
            className="px-5 py-4 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-md focus:outline-none focus:ring-2 focus:ring-pink-400 text-base"
          />
          <button
            type="submit"
            className="bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 rounded-xl shadow-lg transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            🔍 Recommend Movies
          </button>
        </form>

        {loading && (
          <div className="mt-8">
            <Loader />
          </div>
        )}

        {error && (
          <div className="mt-8 text-red-600 font-medium text-center">
            {error}
          </div>
        )}

        {results && (
          <div className="mt-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              🎥 You might also enjoy:
            </h2>
            <ul className="list-inside list-disc space-y-2 text-gray-800 dark:text-gray-300 text-lg">
              {results.map((title, idx) => (
                <li key={idx}>{title}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default MoviePredict;
