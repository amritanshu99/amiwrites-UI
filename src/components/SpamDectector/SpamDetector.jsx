import React, { useState } from "react";
import axios from "axios";
import Loader from "../Loader/Loader";

const SpamDetector = () => {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await axios.post("https://amiwrites-backend-app-1.onrender.com/api/spam-check", {
        subject,
        body,
      });

      setResult(response.data.spam ? "🚨 This is SPAM" : "✅ This is NOT spam");
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-10 bg-gradient-to-br from-cyan-300 via-pink-300 to-yellow-200 text-black dark:bg-gradient-to-br dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 dark:text-white transition-colors duration-300">

      <div className="w-full max-w-xl bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-2xl border border-zinc-300 dark:border-zinc-700">
        <h1 className="text-3xl font-bold mb-6 text-center text-cyan-700 dark:text-cyan-400">📨 Spam Email Detector</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject"
              className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-zinc-800 border border-zinc-400 dark:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter email body"
              className="w-full px-4 py-2 h-32 resize-none rounded-lg bg-gray-100 dark:bg-zinc-800 border border-zinc-400 dark:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            ></textarea>
          </div>

          <button
            type="submit"
            className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 transition font-semibold text-white text-lg shadow-md"
          >
            Check for Spam
          </button>
        </form>

        {loading && <Loader />}

        {result && (
          <div className="mt-6 text-center text-xl font-semibold">
            {result.includes("SPAM") ? (
              <p className="text-red-500 dark:text-red-400">{result}</p>
            ) : (
              <p className="text-green-600 dark:text-green-400">{result}</p>
            )}
          </div>
        )}

        {error && (
          <div className="mt-6 text-center text-red-600 dark:text-red-500 font-medium">
            ❌ {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default SpamDetector;
