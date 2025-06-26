import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";

const API_BASE = "https://amiwrites-backend-app-1.onrender.com/api/tasks";

function TaskManager() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({ title: "", description: "" });
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [loading, setLoading] = useState(false);
  const { pathname } = useLocation();

  const axiosAuth = axios.create({
    baseURL: API_BASE,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

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

    return () => {
      window.removeEventListener("tokenChanged", updateAuthStateFromToken);
    };
  }, []);

  const fetchTasks = async (tokenToUse = token) => {
    try {
      setLoading(true);
      const res = await axios.get(API_BASE, {
        headers: {
          Authorization: `Bearer ${tokenToUse}`,
        },
      });
      setTasks(res.data);
    } catch (err) {
      toast.error("Failed to load tasks.");
      console.error("Failed to fetch tasks:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim() || !newTask.description.trim()) {
      toast.warn("Please enter both title and description.");
      return;
    }

    try {
      setLoading(true);
      const res = await axiosAuth.post("/", newTask);
      setTasks([res.data, ...tasks]);
      setNewTask({ title: "", description: "" });
      toast.success("Task added successfully!");
    } catch (err) {
      toast.error("Error adding task.");
      console.error("Error adding task:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      setLoading(true);
      await axiosAuth.delete(`/${id}`);
      setTasks(tasks.filter((task) => task._id !== id));
      toast.success("Task deleted!");
    } catch (err) {
      toast.error("Error deleting task.");
      console.error("Error deleting task:", err.response?.data || err.message);
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
      setTasks(tasks.map((t) => (t._id === editingTaskId ? res.data : t)));
      setEditingTaskId(null);
      setNewTask({ title: "", description: "" });
      toast.success("Task updated!");
    } catch (err) {
      toast.error("Error updating task.");
      console.error("Error updating task:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setNewTask({ title: "", description: "" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-300 via-pink-300 to-yellow-200 dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-500 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-900 dark:text-blue-200 drop-shadow">
          ✨ Task Manager
        </h1>

        {!isAuthenticated ? (
          <div className="text-center text-lg font-semibold text-gray-700 dark:text-gray-300">
            🔐 Please <span className="text-blue-600 dark:text-blue-400">Login</span> or <span className="text-green-600 dark:text-green-400">Signup</span> to add and view tasks.
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <input
                type="text"
                placeholder="Task title"
                className="p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 w-full shadow-md focus:ring-2 focus:ring-blue-500 transition"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              />
              <input
                type="text"
                placeholder="Task description"
                className="p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 w-full shadow-md focus:ring-2 focus:ring-blue-500 transition"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              />
              {editingTaskId ? (
                <div className="flex gap-2">
                  <button
                    className="bg-gradient-to-tr from-yellow-400 to-yellow-500 hover:to-yellow-600 text-white px-5 py-2.5 rounded-xl font-semibold transition shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-yellow-300"
                    onClick={handleUpdateTask}
                  >
                    Update
                  </button>
                  <button
                    className="bg-gradient-to-tr from-gray-400 to-gray-500 hover:to-gray-600 text-white px-5 py-2.5 rounded-xl font-semibold transition shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-gray-300"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  className="bg-gradient-to-tr from-green-500 to-green-600 hover:to-green-700 text-white px-5 py-2.5 rounded-xl font-semibold transition shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-green-300"
                  onClick={handleAddTask}
                >
                  Add
                </button>
              )}
            </div>

            <div className="space-y-6">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-2xl p-5 shadow-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 flex flex-col sm:flex-row gap-4 animate-pulse"
                    >
                      <div className="flex-1 space-y-3">
                        <div className="h-5 bg-gray-300 dark:bg-zinc-600 rounded w-3/4" />
                        <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded w-full" />
                        <div className="h-3 bg-gray-200 dark:bg-zinc-700 rounded w-5/6" />
                      </div>
                      <div className="w-32 h-10 bg-blue-300 dark:bg-blue-600 rounded-xl self-center" />
                    </div>
                  ))
                : tasks.map((task) => (
                    <div
                      key={task._id}
                      className="flex flex-col sm:flex-row items-start justify-between gap-4 backdrop-blur-xl bg-white/60 dark:bg-white/10 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-xl transition transform hover:scale-[1.01] hover:shadow-2xl dark:text-white"
                    >
                      <div className="flex-1">
                        <h2 className="font-semibold text-xl text-gray-900 dark:text-blue-300">
                          {task.title}
                        </h2>
                        <p className="text-gray-700 dark:text-gray-300 mt-1">
                          {task.description}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <button
                          className="bg-gradient-to-tr from-yellow-400 to-yellow-500 hover:to-yellow-600 text-white px-4 py-2 rounded-xl font-semibold shadow-md transition focus:outline-none focus:ring-2 focus:ring-yellow-300"
                          onClick={() => handleEditTask(task._id)}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="bg-gradient-to-tr from-red-500 to-red-600 hover:to-red-700 text-white px-4 py-2 rounded-xl font-semibold shadow-md transition focus:outline-none focus:ring-2 focus:ring-red-300"
                          onClick={() => handleDeleteTask(task._id)}
                        >
                          🗑️ Delete
                        </button>
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
