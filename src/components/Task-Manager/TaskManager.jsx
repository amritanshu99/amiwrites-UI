// ✅ TaskManager with Premium Modern UI (Hard Delete + Quote + Analytics)
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import ProductivityAnalytics from "./ProductivityAnalytics";

const API_BASE = "https://amiwrites-backend-app-1.onrender.com/api/tasks";

const quotes = [
  "🕶️ Your mission, should you choose to accept it, is to conquer your tasks and crush the day.",
  "💣 There’s no backup plan. There’s only you and the clock ticking.",
  "🧠 The impossible is just the mission we haven’t finished yet.",
  "💼 Every task you complete is a mission accomplished. Make today legendary.",
  "🎯 Forget luck. You’ve got precision, focus, and a plan. Now execute.",
  "🚁 Your productivity protocol has been activated. Proceed with intensity.",
  "🗂️ You don’t need a team. You are the team. Now go complete that mission."
];

function TaskManager() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ title: "", description: "" });
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, completed: 0, completionRate: 0, history: [] });
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [quote, setQuote] = useState("");
  const analyticsRef = useRef(null);
  const { pathname } = useLocation();

  const axiosAuth = axios.create({
    baseURL: API_BASE,
    headers: { Authorization: `Bearer ${token}` },
  });

  useEffect(() => {
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") setShowAnalytics(false);
    };
    const handleClickOutside = (e) => {
      if (analyticsRef.current && !analyticsRef.current.contains(e.target)) {
        setShowAnalytics(false);
      }
    };
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
     let link = document.querySelector("link[rel='canonical']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = window.location.href;
    document.title = "Task Manager";
  }, []);


   useEffect(() => {
      const scrollContainer = document.querySelector(
        ".h-screen.overflow-y-scroll.relative"
      );
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, [pathname]);

  useEffect(() => {
    const updateAuthStateFromToken = () => {
      const updatedToken = localStorage.getItem("token");
      setToken(updatedToken);
      setIsAuthenticated(!!updatedToken);
      if (updatedToken) fetchTasks(updatedToken);
      else setTasks([]);
    };
    window.addEventListener("tokenChanged", updateAuthStateFromToken);
    updateAuthStateFromToken();
    return () => window.removeEventListener("tokenChanged", updateAuthStateFromToken);
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
    } catch (err) {
      toast.error("Failed to load tasks.");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (tasks) => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;
    const history = tasks.map((t) => ({ date: new Date(t.createdAt).toDateString(), completed: t.completed ? 1 : 0 }));
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
      toast.success("Task added successfully!");
    } catch {
      toast.error("Error adding task.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await axiosAuth.delete(`/${id}`);
      const updated = tasks.filter((task) => task._id !== id);
      setTasks(updated);
      calculateStats(updated);
      toast.success("Task deleted!");
    } catch {
      toast.error("Error deleting task.");
    }
  };

  const toggleTaskComplete = async (id, currentStatus) => {
    try {
      const res = await axiosAuth.put(`/${id}`, { completed: !currentStatus });
      const updated = tasks.map((task) => (task._id === id ? res.data : task));
      setTasks(updated);
      calculateStats(updated);
    } catch {
      toast.error("Error updating task status.");
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
      const updated = tasks.map((t) => (t._id === editingTaskId ? res.data : t));
      setTasks(updated);
      setEditingTaskId(null);
      setNewTask({ title: "", description: "" });
      calculateStats(updated);
      toast.success("Task updated!");
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
    <div className="min-h-screen bg-gradient-to-br from-cyan-300 via-pink-300 to-yellow-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 transition-colors duration-500">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-5xl font-extrabold text-center mb-4 text-gray-900 dark:text-blue-200 drop-shadow tracking-tight">
          ✨ Task Manager
        </h1>
        <p className="text-center italic text-lg text-gray-800 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
          {quote}
        </p>

        {isAuthenticated && (
          <div className="mb-6 text-center">
            <button
              onClick={() => setShowAnalytics(true)}
              className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:brightness-110 text-white px-6 py-2 rounded-full font-bold shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              📊 View Productivity Snapshot
            </button>
          </div>
        )}

        {showAnalytics && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div
              ref={analyticsRef}
              className="bg-white dark:bg-gray-800 p-6 rounded-2xl max-w-3xl w-full relative shadow-2xl"
            >
              <button
                onClick={() => setShowAnalytics(false)}
                className="absolute top-2 right-3 text-gray-500 hover:text-red-600 font-bold text-xl"
              >
                &times;
              </button>
              <ProductivityAnalytics stats={stats} />
            </div>
          </div>
        )}

        {!isAuthenticated ? (
          <div className="text-center text-lg font-semibold text-gray-700 dark:text-gray-300">
            🔐 Please <span className="text-blue-600 dark:text-blue-400">Login</span> or <span className="text-green-600 dark:text-green-400">Signup</span> to manage tasks.
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <input
                type="text"
                placeholder="Task title"
                className="p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-black dark:text-white w-full"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />
              <input
                type="text"
                placeholder="Task description"
                className="p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-black dark:text-white w-full"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              />
              {editingTaskId ? (
                <div className="flex gap-2">
                  <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-xl font-semibold transition-all" onClick={handleUpdateTask}>Update</button>
                  <button className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-xl font-semibold transition-all" onClick={handleCancelEdit}>Cancel</button>
                </div>
              ) : (
                <button className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl font-semibold transition-all" onClick={handleAddTask}>Add</button>
              )}
            </div>

            <div className="space-y-6">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="rounded-xl p-5 shadow bg-white dark:bg-zinc-900 animate-pulse">
                      <div className="h-5 bg-gray-300 dark:bg-zinc-600 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded w-full" />
                    </div>
                  ))
                : tasks.map((task) => (
                    <div key={task._id} className="flex flex-col sm:flex-row justify-between gap-4 bg-white/70 dark:bg-zinc-800 p-5 rounded-2xl shadow-lg transition-all hover:shadow-2xl">
                      <div>
                        <h2 className={`font-semibold text-xl ${task.completed ? 'line-through text-gray-400' : 'text-gray-900 dark:text-blue-300'}`}>{task.title}</h2>
                        <p className="text-gray-700 dark:text-gray-300 mt-1">{task.description}</p>
                      </div>
                      <div className="flex gap-2 flex-wrap items-center">
                        <button className={`px-4 py-2 rounded-xl font-semibold shadow transition-all ${task.completed ? 'bg-gray-500' : 'bg-green-600 hover:bg-green-700'} text-white`} onClick={() => toggleTaskComplete(task._id, task.completed)}>
                          {task.completed ? '☑️ Completed' : '✅ Mark Complete'}
                        </button>
                        <button className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-xl font-semibold shadow transition-all" onClick={() => handleEditTask(task._id)}>✏️ Edit</button>
                        <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-semibold shadow transition-all" onClick={() => handleDeleteTask(task._id)}>🗑️ Delete</button>
                      </div>
                    </div>
                  ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default TaskManager;
