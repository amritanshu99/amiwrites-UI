// ✅ Enhanced TaskManager with polished toggle button, loading protection, and premium UI
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import ProductivityAnalytics from "./ProductivityAnalytics";

const API_BASE = "https://amiwrites-backend-app-2lp5.onrender.com/api/tasks";

const quotes = [
  "🕶️ Your mission, should you choose to accept it, is to conquer your tasks and crush the day.",
  "💣 There’s no backup plan. There’s only you and the clock ticking.",
  "🧠 The impossible is just the mission we haven’t finished yet.",
  "💼 Every task you complete is a mission accomplished. Make today legendary.",
  "🎯 Forget luck. You’ve got precision, focus, and a plan. Now execute.",
  "🚁 Your productivity protocol has been activated. Proceed with intensity.",
  "🗂️ You don’t need a team. You are the team. Now go complete that mission.",
];

function TaskManager() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ title: "", description: "" });
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    completionRate: 0,
    history: [],
  });
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [quote, setQuote] = useState("");
  const analyticsRef = useRef(null);
  const { pathname } = useLocation();
  const [animate, setAnimate] = useState(false);
  const axiosAuth = axios.create({
    baseURL: API_BASE,
    headers: { Authorization: `Bearer ${token}` },
  });

  useEffect(() => {
    const updateQuote = () => {
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      setQuote(
        `${randomQuote} This message will self-destruct in 30 seconds. Good luck!`
      );
      setAnimate(true);
      setTimeout(() => setAnimate(false), 1000); // reset class after 1s
    };

    updateQuote();

    const intervalId = setInterval(updateQuote, 30000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const handleKey = (e) => e.key === "Escape" && setShowAnalytics(false);
    const handleClickOutside = (e) =>
      analyticsRef.current &&
      !analyticsRef.current.contains(e.target) &&
      setShowAnalytics(false);
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    document.title = "Task Manager";
    const link =
      document.querySelector("link[rel='canonical']") ||
      document.createElement("link");
    link.rel = "canonical";
    link.href = window.location.href;
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    const scrollContainer = document.querySelector(
      ".h-screen.overflow-y-scroll.relative"
    );
    scrollContainer && scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);

  useEffect(() => {
    const updateAuthStateFromToken = () => {
      const updatedToken = localStorage.getItem("token");
      setToken(updatedToken);
      setIsAuthenticated(!!updatedToken);
      updatedToken ? fetchTasks(updatedToken) : setTasks([]);
    };
    window.addEventListener("tokenChanged", updateAuthStateFromToken);
    updateAuthStateFromToken();
    return () =>
      window.removeEventListener("tokenChanged", updateAuthStateFromToken);
  }, []);

  const fetchTasks = async (tokenToUse = token) => {
    try {
      setLoading(true);
      const res = await axios.get(API_BASE, {
        headers: { Authorization: `Bearer ${tokenToUse}` },
      });
      const filtered = res.data.filter((t) => !t.isDeleted);
      setTasks(filtered);
      calculateStats(filtered);
    } catch {
      toast.error("Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (tasks) => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const completionRate =
      total > 0 ? ((completed / total) * 100).toFixed(1) : 0;
    const history = tasks.map((t) => ({
      date: new Date(t.createdAt).toDateString(),
      completed: t.completed ? 1 : 0,
    }));
    setStats({ total, completed, completionRate, history });
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim() || !newTask.description.trim()) {
      toast.warn("Please enter both title and description.");
      return;
    }
    try {
      setLoading(true);
      const res = await axiosAuth.post("/", newTask);
      const updated = [res.data, ...tasks];
      setTasks(updated);
      setNewTask({ title: "", description: "" });
      calculateStats(updated);
      toast.success("Mission added successfully!");
    } catch {
      toast.error("Error adding task.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (id) => {
    setLoading(true);
    try {
      await axiosAuth.delete(`/${id}`);
      const updated = tasks.filter((task) => task._id !== id);
      setTasks(updated);
      calculateStats(updated);
      toast.success("Mission deleted!");
    } catch {
      toast.error("Error deleting task.");
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskComplete = async (id, currentStatus) => {
    debugger;
    setLoading(true);
    try {
      const res = await axiosAuth.put(`/${id}`, { completed: !currentStatus });
      const updated = tasks.map((task) => (task._id === id ? res.data : task));
      setTasks(updated);
      calculateStats(updated);
      const task = updated.find((item) => item._id === id);
      const isCompleted = task?.completed;
      toast.success(
        isCompleted ? "Mission Accomplished" : "Mission Reinitiated"
      );
    } catch {
      toast.error("Error updating task status.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditTask = (id) => {
    const task = tasks.find((t) => t._id === id);
    setNewTask({ title: task.title, description: task.description });
    setEditingTaskId(id);
  };

  const handleUpdateTask = async () => {
    if (!newTask.title.trim() || !newTask.description.trim()) {
      toast.warn("Please enter both title and description.");
      return;
    }
    try {
      setLoading(true);
      const res = await axiosAuth.put(`/${editingTaskId}`, newTask);
      const updated = tasks.map((t) =>
        t._id === editingTaskId ? res.data : t
      );
      setTasks(updated);
      setEditingTaskId(null);
      setNewTask({ title: "", description: "" });
      calculateStats(updated);
      toast.success("Mission updated!");
    } catch {
      toast.error("Error updating task.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setNewTask({ title: "", description: "" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-300 via-pink-300 to-yellow-200 dark:from-[#0a0a0a] dark:via-[#111111] dark:to-black p-6 transition-colors duration-500">
      <div className="max-w-5xl mx-auto">
        {loading && (
          <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black/30">
            <div className="flex flex-col items-center justify-center gap-4 bg-white dark:bg-zinc-900 shadow-2xl rounded-2xl px-8 py-6 w-80 animate-fade-in">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-200">
                Loading your mission...
              </div>
            </div>
          </div>
        )}
        <h1 className="text-5xl font-extrabold text-center mb-4 text-gray-900 dark:text-blue-200 drop-shadow tracking-tight">
          {" "}
          Mission Control Dashboard
        </h1>
        <p
          className={`text-center italic text-lg text-gray-800 dark:text-gray-400 mb-8 max-w-3xl mx-auto ${
            animate ? "animate-smoke" : ""
          }`}
        >
          {quote}
        </p>

        {isAuthenticated && (
          <div className="mb-6 text-center">
            <button
              onClick={() => setShowAnalytics(true)}
              disabled={loading}
              className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 disabled:opacity-60 hover:brightness-110 text-white px-6 py-2 rounded-full font-bold shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              📊 View Productivity Snapshot
            </button>
          </div>
        )}

        {showAnalytics && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4 sm:px-0">
            <div
              ref={analyticsRef}
              className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative shadow-2xl"
            >
              <button
                onClick={() => setShowAnalytics(false)}
                className="absolute top-2 right-3 text-gray-500 hover:text-red-600 font-bold text-2xl"
              >
                &times;
              </button>
              <ProductivityAnalytics stats={stats} />
            </div>
          </div>
        )}

        {!isAuthenticated ? (
          <div className="text-center text-lg font-semibold text-gray-700 dark:text-gray-300">
            🔐 Please{" "}
            <span className="text-blue-600 dark:text-blue-400">Login</span> or{" "}
            <span className="text-green-600 dark:text-green-400">Signup</span>{" "}
            to manage tasks.
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <input
                type="text"
                placeholder="Task title"
                className="p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-black dark:text-white w-full"
                value={newTask.title}
                onChange={(e) =>
                  setNewTask({ ...newTask, title: e.target.value })
                }
                disabled={loading}
              />
              <input
                type="text"
                placeholder="Task description"
                className="p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-black dark:text-white w-full"
                value={newTask.description}
                onChange={(e) =>
                  setNewTask({ ...newTask, description: e.target.value })
                }
                disabled={loading}
              />
              {editingTaskId ? (
                <div className="flex gap-2">
                  <button
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-xl font-semibold transition-all disabled:opacity-50"
                    onClick={handleUpdateTask}
                    disabled={loading}
                  >
                    Update
                  </button>
                  <button
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-xl font-semibold transition-all disabled:opacity-50"
                    onClick={handleCancelEdit}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl font-semibold transition-all disabled:opacity-50"
                  onClick={handleAddTask}
                  disabled={loading}
                >
                  Add
                </button>
              )}
            </div>

            <div className="space-y-6">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-xl p-5 shadow bg-white dark:bg-zinc-900 animate-pulse"
                  >
                    <div className="h-5 bg-gray-300 dark:bg-zinc-600 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded w-full" />
                  </div>
                ))
              ) : tasks.length === 0 ? (
                <div className="text-center text-xl font-semibold text-gray-800 dark:text-gray-300 bg-white/60 dark:bg-zinc-800 p-6 rounded-2xl shadow-md">
                  🎯{" "}
                  <em>
                    “Your mission, should you choose to accept it, begins now.
                    No tasks on file.”
                  </em>
                </div>
              ) : (
                tasks.map((task) => (
                  <div
                    key={task._id}
                    className="flex flex-col sm:flex-row justify-between gap-4 bg-white/70 dark:bg-zinc-800 p-5 rounded-2xl shadow-lg transition-all hover:shadow-2xl"
                  >
                    <div>
                      <h2
                        className={`font-semibold text-xl ${
                          task.completed
                            ? "line-through text-gray-400"
                            : "text-gray-900 dark:text-blue-300"
                        }`}
                      >
                        {task.title}
                      </h2>
                      <p className="text-gray-700 dark:text-gray-300 mt-1">
                        {task.description}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap items-center">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={task.completed}
                          onChange={() =>
                            toggleTaskComplete(task._id, task.completed)
                          }
                          disabled={loading}
                        />
                        <div className="w-14 h-8 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-500 peer-checked:bg-green-500 relative"></div>
                        <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                          {task.completed ? "Completed" : "Mark Complete"}
                        </span>
                      </label>
                      <button
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-xl font-semibold shadow transition-all"
                        onClick={() => handleEditTask(task._id)}
                        disabled={loading}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-semibold shadow transition-all"
                        onClick={() => handleDeleteTask(task._id)}
                        disabled={loading}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default TaskManager;
