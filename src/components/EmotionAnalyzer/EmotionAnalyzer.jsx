import React, { useState } from "react";
import axios from "axios";
import Loader from "../Loader/Loader";

const EmotionAnalyzer = () => {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const encodedText = encodeURIComponent(text.trim());
      const res = await axios.get(
        `https://amiwrites-backend-app-1.onrender.com/api/emotion/${encodedText}`
      );

      setResult(res.data);
    } catch (err) {
      setError("Failed to analyze emotion. Please try again.");
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-300 via-pink-300 to-yellow-200 dark:from-[#0a0a0a] dark:via-[#111111] dark:to-black p-6 transition-colors duration-500 flex flex-col items-center justify-start">
      <div className="max-w-2xl w-full bg-white dark:bg-[#1a1a1a] shadow-xl rounded-2xl p-6 space-y-6 mt-10">
        <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-white">
          🎯 Emotion Analyzer
        </h1>
        <p className="text-center text-gray-700 dark:text-gray-300 text-sm">
          Predict emotions from English text using Deep Learning (RNN + LSTM). Works best with sentences up to <strong>50 words</strong>. Enjoy the power of AI on your thoughts!
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            className="w-full p-4 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-[#0d0d0d] dark:text-white outline-none resize-none focus:ring-2 focus:ring-blue-400 transition"
            rows="4"
            placeholder="Type something in English to analyze emotions..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
          />

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-2 px-4 rounded-xl hover:opacity-90 transition duration-300"
            disabled={loading}
          >
            Analyze Emotion
          </button>
        </form>

        {loading && <Loader />}

        {error && (
          <div className="text-red-500 text-center font-medium">{error}</div>
        )}

        {result && (
          <div className="text-center text-lg mt-4 text-gray-800 dark:text-gray-200 space-y-2">
            <p>
              <strong>Detected Emotion:</strong>{" "}
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {result.emotion}
              </span>
            </p>
            <p>
              <strong>Confidence:</strong>{" "}
              <span className="text-xl font-bold">{result.confidence}</span>
            </p>
            <p>
              <strong>Your Input:</strong>{" "}
              <span className="italic text-sm text-gray-500 dark:text-gray-400">
                “{result.text}”
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmotionAnalyzer;
