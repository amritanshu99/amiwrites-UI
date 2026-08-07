import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  TouchSensor,
  closestCorners,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  FolderKanban,
  GripVertical,
  ListFilter,
  LockKeyhole,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import KanbanColumn from "./KanbanColumn";
import ProductivityAnalytics from "./ProductivityAnalytics";
import TaskModal from "./TaskModal";
import { TaskCardSurface } from "./TaskCard";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  getPriority,
  normalizeTask,
} from "./taskManagerConfig";
import { moveTaskOnBoard } from "./kanbanDnd";
import { apiUrl } from "../../config/api";

const API_BASE = apiUrl("/api/tasks");

function SummaryCard({ icon: Icon, label, value, helper, iconClass }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-[0_15px_45px_-32px_rgba(15,23,42,0.55)] backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/70">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400 dark:text-zinc-500">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">{helper}</p>
        </div>
        <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
          <Icon size={18} />
        </span>
      </div>
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden xl:grid xl:grid-cols-4">
      {TASK_STATUSES.map((status) => (
        <div
          key={status.id}
          className="w-[320px] min-w-[320px] rounded-[1.35rem] border border-slate-200/80 bg-slate-100/70 p-3 xl:w-auto xl:min-w-0 dark:border-zinc-800 dark:bg-zinc-900/60"
        >
          <div className="mb-4 flex items-center gap-2 px-1">
            <span className={`h-2.5 w-2.5 rounded-full ${status.dotClass}`} />
            <div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-zinc-800" />
          </div>
          {[0, 1].map((item) => (
            <div key={item} className="mb-3 animate-pulse rounded-2xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="h-5 w-20 rounded-full bg-slate-100 dark:bg-zinc-900" />
              <div className="mt-4 h-4 w-4/5 rounded bg-slate-200 dark:bg-zinc-800" />
              <div className="mt-2 h-3 w-full rounded bg-slate-100 dark:bg-zinc-900" />
              <div className="mt-5 h-8 rounded-lg bg-slate-100 dark:bg-zinc-900" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function buildStats(tasks) {
  const statusCounts = TASK_STATUSES.reduce(
    (counts, status) => ({ ...counts, [status.id]: 0 }),
    {}
  );

  tasks.forEach((task) => {
    statusCounts[task.status] = (statusCounts[task.status] || 0) + 1;
  });

  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const done = statusCounts.done || 0;
  const overdue = tasks.filter((task) => {
    if (!task.dueDate || task.status === "done") return false;
    const due = new Date(task.dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  }).length;

  const dueSoon = tasks.filter((task) => {
    if (!task.dueDate || task.status === "done") return false;
    const due = new Date(task.dueDate);
    due.setHours(0, 0, 0, 0);
    return due >= today && due <= nextWeek;
  }).length;

  const history = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(today);
    day.setDate(day.getDate() - (6 - index));
    const dayKey = day.toDateString();
    const completed = tasks.filter((task) => {
      if (task.status !== "done") return false;
      const completedDate = task.completedAt || task.updatedAt;
      return completedDate && new Date(completedDate).toDateString() === dayKey;
    }).length;

    return {
      date: day.toLocaleDateString(undefined, { weekday: "short" }),
      completed,
    };
  });

  return {
    total: tasks.length,
    done,
    active: (statusCounts.todo || 0) + (statusCounts["in-progress"] || 0),
    overdue,
    dueSoon,
    completionRate: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
    statusCounts,
    history,
  };
}

function boardCollisionDetection(args) {
  const pointerCollisions = pointerWithin(args);
  const mobileDropTargets = pointerCollisions.filter(
    ({ id }) =>
      args.droppableContainers.find((container) => container.id === id)?.data
        .current?.type === "mobile-column"
  );

  if (mobileDropTargets.length > 0) return mobileDropTargets;
  if (pointerCollisions.length > 0) return pointerCollisions;
  return closestCorners(args);
}

function MobileStatusTab({
  status,
  count,
  isActive,
  isDragging,
  dragDisabled,
  onSelect,
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `mobile-column:${status.id}`,
    data: { type: "mobile-column", status: status.id },
    disabled: dragDisabled,
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={() => onSelect(status.id)}
      className={`min-w-0 rounded-lg px-1.5 py-2 text-[11px] font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
        isOver
          ? "scale-[1.03] bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-300"
          : isActive && !isDragging
            ? "bg-slate-950 text-white shadow dark:bg-white dark:text-zinc-950"
            : "text-slate-500 hover:bg-slate-100 dark:text-zinc-500 dark:hover:bg-zinc-900"
      }`}
      aria-label={
        isDragging
          ? `Drop task in ${status.label}`
          : `Show ${status.label} tasks`
      }
    >
      <span className="block truncate">{status.label}</span>
      <span
        className={`mt-0.5 block text-[10px] ${
          isOver || (isActive && !isDragging)
            ? "opacity-70"
            : "text-slate-400 dark:text-zinc-600"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function MobileBoardNavigation({
  tasks,
  mobileStatus,
  onStatusChange,
  dragDisabled,
  isDragging,
}) {
  return (
    <nav
      className={`grid grid-cols-4 gap-1 rounded-xl border border-slate-200 bg-white/95 p-1 backdrop-blur transition-[box-shadow,transform] sm:hidden dark:border-zinc-800 dark:bg-zinc-950/95 ${
        isDragging
          ? "fixed bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] left-3 right-3 z-40 shadow-2xl shadow-slate-950/30 ring-1 ring-indigo-500/20"
          : "mb-3"
      }`}
      aria-label={isDragging ? "Drop task into a column" : "Board columns"}
    >
      <span className="sr-only" aria-live="polite">
        {isDragging ? "Choose a column and release to move the task" : ""}
      </span>
      {TASK_STATUSES.map((status) => (
        <MobileStatusTab
          key={status.id}
          status={status}
          count={tasks.filter((task) => task.status === status.id).length}
          isActive={mobileStatus === status.id}
          isDragging={isDragging}
          dragDisabled={dragDisabled}
          onSelect={onStatusChange}
        />
      ))}
    </nav>
  );
}

export default function TaskManager() {
  const initialToken = localStorage.getItem("token");
  const [token, setToken] = useState(initialToken);
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(initialToken));
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(Boolean(initialToken));
  const [saving, setSaving] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [labelFilter, setLabelFilter] = useState("all");
  const [sortMode, setSortMode] = useState("board");
  const [mobileStatus, setMobileStatus] = useState("todo");
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [taskModal, setTaskModal] = useState({ open: false, task: null, initialStatus: "backlog" });
  const { pathname } = useLocation();

  const apiClient = useMemo(
    () =>
      axios.create({
        baseURL: API_BASE,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }),
    [token]
  );

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const fetchTasks = useCallback(async (tokenToUse) => {
    if (!tokenToUse) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(API_BASE, {
        headers: { Authorization: `Bearer ${tokenToUse}` },
      });
      setTasks(response.data.filter((task) => !task.isDeleted).map(normalizeTask));
    } catch (error) {
      toast.error(error.response?.data?.error || "We could not load your board.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const updateAuthState = () => {
      const nextToken = localStorage.getItem("token");
      setToken(nextToken);
      setIsAuthenticated(Boolean(nextToken));
      fetchTasks(nextToken);
    };

    window.addEventListener("tokenChanged", updateAuthState);
    updateAuthState();
    return () => window.removeEventListener("tokenChanged", updateAuthState);
  }, [fetchTasks]);

  useEffect(() => {
    const scrollContainer = document.querySelector(".h-screen.overflow-y-scroll.relative");
    scrollContainer?.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);

  const stats = useMemo(() => buildStats(tasks), [tasks]);

  const labels = useMemo(
    () => [...new Set(tasks.flatMap((task) => task.labels))].sort((a, b) => a.localeCompare(b)),
    [tasks]
  );

  const filteredTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const matches = tasks.filter((task) => {
      const matchesSearch =
        !query ||
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query) ||
        task.labels.some((label) => label.toLowerCase().includes(query));
      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
      const matchesLabel = labelFilter === "all" || task.labels.includes(labelFilter);
      return matchesSearch && matchesPriority && matchesLabel;
    });

    return [...matches].sort((a, b) => {
      if (sortMode === "priority") return getPriority(b.priority).rank - getPriority(a.priority).rank;
      if (sortMode === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortMode === "due") {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      return a.position - b.position;
    });
  }, [tasks, searchQuery, priorityFilter, labelFilter, sortMode]);

  const activeFilters = [
    Boolean(searchQuery.trim()),
    priorityFilter !== "all",
    labelFilter !== "all",
    sortMode !== "board",
  ].filter(Boolean).length;
  const dragDisabled = activeFilters > 0 || saving || isReordering;
  const activeTask = tasks.find((task) => task._id === activeTaskId);

  const closeTaskModal = useCallback(() => {
    setTaskModal({ open: false, task: null, initialStatus: "backlog" });
  }, []);

  const openNewTask = (status = "backlog") => {
    setTaskModal({ open: true, task: null, initialStatus: status });
  };

  const openEditTask = (task) => {
    setTaskModal({ open: true, task, initialStatus: task.status });
  };

  const handleSaveTask = async (form) => {
    setSaving(true);

    try {
      if (taskModal.task) {
        const response = await apiClient.put(`/${taskModal.task._id}`, form);
        const updatedTask = normalizeTask(response.data);
        setTasks((current) =>
          current.map((task) => (task._id === updatedTask._id ? updatedTask : task))
        );
        toast.success("Task updated");
      } else {
        const statusTasks = tasks.filter((task) => task.status === form.status);
        const maxPosition = statusTasks.reduce(
          (max, task) => Math.max(max, Number(task.position) || 0),
          0
        );
        const response = await apiClient.post("/", {
          ...form,
          position: maxPosition + 1000,
        });
        setTasks((current) => [...current, normalizeTask(response.data)]);
        setMobileStatus(form.status);
        toast.success("Task created");
      }

      closeTaskModal();
    } catch (error) {
      toast.error(error.response?.data?.error || "We could not save this task.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async (task) => {
    setSaving(true);

    try {
      await apiClient.delete(`/${task._id}`);
      setTasks((current) => current.filter((item) => item._id !== task._id));
      closeTaskModal();
      toast.success("Task deleted");
    } catch (error) {
      toast.error(error.response?.data?.error || "We could not delete this task.");
    } finally {
      setSaving(false);
    }
  };

  const persistBoardOrder = useCallback(
    (orderedTasks) =>
      apiClient.put("/reorder", {
        items: orderedTasks.map((task) => ({
          id: task._id,
          status: task.status,
          position: task.position,
          completedAt: task.completedAt || null,
        })),
      }),
    [apiClient]
  );

  const handleDragStart = ({ active }) => {
    setActiveTaskId(active.id);
  };

  const handleDragEnd = async ({ active, over }) => {
    setActiveTaskId(null);
    if (!over || active.id === over.id) return;

    const previousTasks = tasks;
    const activeRect = active.rect.current.translated;
    const insertAfter = Boolean(
      activeRect &&
        over.rect &&
        activeRect.top + activeRect.height / 2 >
          over.rect.top + over.rect.height / 2
    );
    const nextTasks = moveTaskOnBoard(tasks, {
      activeId: active.id,
      overId: over.id,
      insertAfter,
    });

    if (nextTasks === tasks) return;

    const movedTask = nextTasks.find(
      (task) => String(task._id) === String(active.id)
    );
    if (!movedTask) return;

    setTasks(nextTasks);
    setMobileStatus(movedTask.status);
    setIsReordering(true);

    try {
      await persistBoardOrder(nextTasks);
      toast.success(({ closeToast }) => (
        <div className="flex items-center justify-between gap-3">
          <span>Task moved</span>
          <button
            type="button"
            className="font-extrabold text-indigo-600 underline underline-offset-2 dark:text-indigo-300"
            onClick={async () => {
              setTasks(previousTasks);
              closeToast?.();
              try {
                await persistBoardOrder(previousTasks);
              } catch {
                setTasks(nextTasks);
                toast.error("The move could not be undone.");
              }
            }}
          >
            Undo
          </button>
        </div>
      ));
    } catch (error) {
      setTasks(previousTasks);
      toast.error(error.response?.data?.error || "The task could not be moved.");
    } finally {
      setIsReordering(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setPriorityFilter("all");
    setLabelFilter("all");
    setSortMode("board");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f4f6fa] px-3 pb-14 pt-5 transition-colors sm:px-5 lg:px-7 dark:bg-[#050506]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_15%_0%,rgba(99,102,241,0.16),transparent_38%),radial-gradient(circle_at_85%_5%,rgba(14,165,233,0.13),transparent_34%)] dark:bg-[radial-gradient(circle_at_15%_0%,rgba(99,102,241,0.15),transparent_38%),radial-gradient(circle_at_85%_5%,rgba(14,165,233,0.1),transparent_34%)]" />

      <div className="relative mx-auto max-w-[1600px]">
        <header className="mb-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-indigo-200/70 bg-white/65 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-indigo-700 shadow-sm backdrop-blur dark:border-indigo-900/70 dark:bg-indigo-950/35 dark:text-indigo-300">
              <Sparkles size={13} /> Personal workspace
            </div>
            <h1 className="text-3xl font-black tracking-[-0.04em] text-slate-950 sm:text-4xl lg:text-[2.75rem] dark:text-white">
              Task Manager
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px] dark:text-zinc-400">
              Plan what matters, keep work moving, and turn your priorities into visible progress.
            </p>
          </div>

          {isAuthenticated && (
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <button
                type="button"
                onClick={() => setShowAnalytics(true)}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white/80 px-4 py-2.5 text-sm font-extrabold text-slate-700 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 sm:flex-none dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                <BarChart3 size={17} /> Insights
              </button>
              <button
                type="button"
                onClick={() => openNewTask("backlog")}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 sm:flex-none dark:focus-visible:ring-offset-black"
              >
                <Plus size={17} /> New task
              </button>
            </div>
          )}
        </header>

        {!isAuthenticated ? (
          <section className="mx-auto mt-12 max-w-xl rounded-[1.75rem] border border-white/70 bg-white/80 p-8 text-center shadow-2xl shadow-slate-900/5 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/80">
            <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300 dark:ring-indigo-900">
              <LockKeyhole size={24} />
            </span>
            <h2 className="mt-5 text-xl font-black text-slate-950 dark:text-white">Your board is ready when you are</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-zinc-400">
              Log in or create an account to organize tasks, track deadlines, and keep your progress synced.
            </p>
          </section>
        ) : (
          <>
            <section className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <SummaryCard
                icon={FolderKanban}
                label="Total work"
                value={stats.total}
                helper="Tasks across the board"
                iconClass="bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300"
              />
              <SummaryCard
                icon={CircleDot}
                label="Active"
                value={stats.active}
                helper={`${stats.statusCounts["in-progress"] || 0} currently in progress`}
                iconClass="bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300"
              />
              <SummaryCard
                icon={AlertTriangle}
                label="Due soon"
                value={stats.dueSoon}
                helper={stats.overdue ? `${stats.overdue} already overdue` : "Nothing overdue"}
                iconClass="bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-300"
              />
              <SummaryCard
                icon={CheckCircle2}
                label="Completed"
                value={`${stats.completionRate}%`}
                helper={`${stats.done} tasks delivered`}
                iconClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300"
              />
            </section>

            <section className="mb-4 rounded-2xl border border-white/70 bg-white/75 p-2.5 shadow-[0_15px_45px_-32px_rgba(15,23,42,0.55)] backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/75">
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
                <label className="relative min-w-0 flex-1">
                  <span className="sr-only">Search tasks</span>
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search titles, descriptions, and labels"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-600 dark:focus:border-indigo-600 dark:focus:bg-zinc-950"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                      aria-label="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </label>

                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  <label className="relative">
                    <span className="sr-only">Filter by priority</span>
                    <select
                      value={priorityFilter}
                      onChange={(event) => setPriorityFilter(event.target.value)}
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-9 text-xs font-bold text-slate-700 outline-none transition hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 sm:w-auto dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
                    >
                      <option value="all">All priorities</option>
                      {TASK_PRIORITIES.map((priority) => (
                        <option key={priority.id} value={priority.id}>{priority.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  </label>

                  <label className="relative">
                    <span className="sr-only">Filter by label</span>
                    <select
                      value={labelFilter}
                      onChange={(event) => setLabelFilter(event.target.value)}
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-9 text-xs font-bold text-slate-700 outline-none transition hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 sm:w-auto dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
                    >
                      <option value="all">All labels</option>
                      {labels.map((label) => (
                        <option key={label} value={label}>{label}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  </label>

                  <label className="relative col-span-2 sm:col-span-1">
                    <span className="sr-only">Sort tasks</span>
                    <select
                      value={sortMode}
                      onChange={(event) => setSortMode(event.target.value)}
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-9 text-xs font-bold text-slate-700 outline-none transition hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 sm:w-auto dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
                    >
                      <option value="board">Board order</option>
                      <option value="priority">Highest priority</option>
                      <option value="due">Due date</option>
                      <option value="newest">Recently created</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  </label>

                  {activeFilters > 0 && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-2.5 text-xs font-extrabold text-indigo-700 transition hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 sm:col-span-1 dark:bg-indigo-950/50 dark:text-indigo-300 dark:hover:bg-indigo-950"
                    >
                      <X size={14} /> Clear {activeFilters}
                    </button>
                  )}
                </div>
              </div>
            </section>

            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-zinc-500">
                {dragDisabled ? <ListFilter size={14} /> : <GripVertical size={14} />}
                <span>
                  {dragDisabled && activeFilters > 0
                    ? "Clear filters to drag and reorder tasks"
                    : "Drag cards between columns to update progress"}
                </span>
              </div>
              <span className="hidden text-xs font-semibold text-slate-400 sm:inline dark:text-zinc-600">
                {filteredTasks.length} of {tasks.length} shown
              </span>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={boardCollisionDetection}
              measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragCancel={() => setActiveTaskId(null)}
            >
              <MobileBoardNavigation
                tasks={filteredTasks}
                mobileStatus={mobileStatus}
                onStatusChange={setMobileStatus}
                dragDisabled={dragDisabled}
                isDragging={Boolean(activeTaskId)}
              />

              {loading ? (
                <BoardSkeleton />
              ) : (
                <div className="flex gap-4 overflow-x-auto overscroll-x-contain pb-4 sm:snap-x sm:snap-mandatory xl:grid xl:grid-cols-4 xl:overflow-visible xl:snap-none">
                  {TASK_STATUSES.map((status) => (
                    <KanbanColumn
                      key={status.id}
                      status={status}
                      tasks={filteredTasks.filter((task) => task.status === status.id)}
                      onAddTask={openNewTask}
                      onEditTask={openEditTask}
                      dragDisabled={dragDisabled}
                      isMobileActive={mobileStatus === status.id}
                    />
                  ))}
                </div>
              )}

              <DragOverlay
                adjustScale={false}
                dropAnimation={{ duration: 180, easing: "ease" }}
              >
                {activeTask ? (
                  <div className="w-[min(300px,calc(100vw-1.5rem))]">
                    <TaskCardSurface task={activeTask} overlay />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>

            {!loading && tasks.length > 0 && filteredTasks.length === 0 && (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white/60 p-8 text-center dark:border-zinc-700 dark:bg-zinc-950/60">
                <p className="text-sm font-extrabold text-slate-800 dark:text-zinc-200">No matching tasks</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-zinc-500">Try a different search or clear your filters.</p>
                <button type="button" onClick={clearFilters} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-xs font-extrabold text-white dark:bg-white dark:text-zinc-950">
                  Clear filters
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <TaskModal
        open={taskModal.open}
        task={taskModal.task}
        initialStatus={taskModal.initialStatus}
        onClose={closeTaskModal}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
        isSaving={saving}
      />

      {showAnalytics && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowAnalytics(false);
          }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="analytics-title" className="max-h-[94vh] w-full overflow-y-auto rounded-t-[1.75rem] border border-white/60 bg-[#f8fafc] p-5 shadow-2xl sm:max-w-5xl sm:rounded-[1.75rem] sm:p-6 dark:border-zinc-800 dark:bg-[#09090b]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">Board analytics</p>
                <h2 id="analytics-title" className="mt-1 text-2xl font-black tracking-tight text-slate-950 dark:text-white">Productivity insights</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">A clear view of workload, flow, and delivery.</p>
              </div>
              <button type="button" onClick={() => setShowAnalytics(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-200/70 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white" aria-label="Close analytics">
                <X size={18} />
              </button>
            </div>
            <ProductivityAnalytics stats={stats} />
          </section>
        </div>
      )}
    </div>
  );
}
