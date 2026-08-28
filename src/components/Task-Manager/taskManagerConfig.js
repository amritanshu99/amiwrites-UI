export const TASK_STATUSES = [
  {
    id: "backlog",
    label: "Backlog",
    description: "Ideas and work to prioritize",
    dotClass: "bg-slate-400",
    accentClass: "from-slate-400 to-slate-500",
    softClass: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  },
  {
    id: "todo",
    label: "To Do",
    description: "Ready to be picked up",
    dotClass: "bg-sky-500",
    accentClass: "from-sky-500 to-blue-600",
    softClass: "bg-sky-100 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300",
  },
  {
    id: "in-progress",
    label: "In Progress",
    description: "Work currently underway",
    dotClass: "bg-amber-500",
    accentClass: "from-amber-400 to-orange-500",
    softClass: "bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300",
  },
  {
    id: "done",
    label: "Done",
    description: "Completed and delivered",
    dotClass: "bg-emerald-500",
    accentClass: "from-emerald-400 to-teal-500",
    softClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300",
  },
];

export const TASK_PRIORITIES = [
  {
    id: "low",
    label: "Low",
    badgeClass: "bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300",
    dotClass: "bg-slate-400",
    rank: 1,
  },
  {
    id: "medium",
    label: "Medium",
    badgeClass: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
    dotClass: "bg-blue-500",
    rank: 2,
  },
  {
    id: "high",
    label: "High",
    badgeClass: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
    dotClass: "bg-amber-500",
    rank: 3,
  },
  {
    id: "urgent",
    label: "Urgent",
    badgeClass: "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
    dotClass: "bg-rose-500",
    rank: 4,
  },
];

export const STATUS_IDS = TASK_STATUSES.map((status) => status.id);

export const EMPTY_TASK = {
  title: "",
  description: "",
  status: "backlog",
  priority: "medium",
  dueDate: "",
  labels: [],
};

export function parseTaskDate(value) {
  if (!value) return null;

  if (typeof value === "string") {
    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
      const localDate = new Date(Number(year), Number(month) - 1, Number(day));

      if (
        localDate.getFullYear() === Number(year) &&
        localDate.getMonth() === Number(month) - 1 &&
        localDate.getDate() === Number(day)
      ) {
        return localDate;
      }

      return null;
    }
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

export function toDateInputValue(value) {
  const date = parseTaskDate(value);
  if (!date) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getStatus(statusId) {
  return TASK_STATUSES.find((status) => status.id === statusId) || TASK_STATUSES[1];
}

export function getPriority(priorityId) {
  return TASK_PRIORITIES.find((priority) => priority.id === priorityId) || TASK_PRIORITIES[1];
}

export function normalizeTask(task) {
  const status = STATUS_IDS.includes(task.status)
    ? task.status
    : task.completed
      ? "done"
      : "todo";

  return {
    ...task,
    status,
    priority: TASK_PRIORITIES.some((priority) => priority.id === task.priority)
      ? task.priority
      : "medium",
    labels: Array.isArray(task.labels) ? task.labels : [],
    position: Number.isFinite(Number(task.position))
      ? Number(task.position)
      : new Date(task.createdAt || 0).getTime(),
    completed: status === "done",
  };
}
