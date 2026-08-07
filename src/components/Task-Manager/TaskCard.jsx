import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  GripVertical,
  Pencil,
  Tag,
} from "lucide-react";
import { getPriority } from "./taskManagerConfig";

function getDueDateMeta(dueDate, status) {
  if (!dueDate) return null;

  const date = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(date);
  due.setHours(0, 0, 0, 0);
  const daysAway = Math.round((due - today) / 86400000);

  let label = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (daysAway === 0) label = "Due today";
  if (daysAway === 1) label = "Due tomorrow";
  if (daysAway === -1) label = "Due yesterday";

  return {
    label,
    overdue: daysAway < 0 && status !== "done",
    soon: daysAway >= 0 && daysAway <= 2 && status !== "done",
  };
}

export function TaskCardSurface({ task, overlay = false, onEdit, dragHandleProps }) {
  const priority = getPriority(task.priority);
  const dueDate = getDueDateMeta(task.dueDate, task.status);
  const visibleLabels = task.labels.slice(0, 2);

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border bg-white p-4 shadow-[0_12px_35px_-28px_rgba(15,23,42,0.65)] transition-all duration-200 dark:bg-zinc-950 ${
        overlay
          ? "rotate-2 scale-[1.02] border-indigo-400 shadow-2xl shadow-indigo-500/20 dark:border-indigo-500"
          : "border-slate-200/80 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_45px_-28px_rgba(15,23,42,0.72)] dark:border-zinc-800 dark:hover:border-zinc-700"
      }`}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-80 dark:via-white/20" />

      <div className="mb-3 flex items-start justify-between gap-3">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${priority.badgeClass}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${priority.dotClass}`} />
          {priority.label}
        </span>

        <div className="flex items-center gap-1">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(task)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 opacity-100 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              aria-label={`Edit ${task.title}`}
              title="Edit task"
            >
              <Pencil size={15} />
            </button>
          )}
          {dragHandleProps && (
            <button
              type="button"
              {...dragHandleProps}
              className="inline-flex h-8 w-8 touch-none items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:cursor-grabbing dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              aria-label={`Move ${task.title}`}
              title="Drag to move"
            >
              <GripVertical size={17} />
            </button>
          )}
        </div>
      </div>

      <h3 className="break-words text-[15px] font-bold leading-snug text-slate-900 dark:text-zinc-100">
        {task.title}
      </h3>

      {task.description && (
        <p className="mt-1.5 line-clamp-2 break-words text-sm leading-5 text-slate-500 dark:text-zinc-400">
          {task.description}
        </p>
      )}

      {task.labels.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {visibleLabels.map((label) => (
            <span
              key={label}
              className="inline-flex max-w-[8rem] items-center gap-1 truncate rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600 dark:bg-zinc-900 dark:text-zinc-300"
            >
              <Tag size={10} className="shrink-0" />
              <span className="truncate">{label}</span>
            </span>
          ))}
          {task.labels.length > visibleLabels.length && (
            <span className="text-[11px] font-semibold text-slate-400">
              +{task.labels.length - visibleLabels.length}
            </span>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs dark:border-zinc-900">
        {dueDate ? (
          <span
            className={`inline-flex items-center gap-1.5 font-semibold ${
              dueDate.overdue
                ? "text-rose-600 dark:text-rose-400"
                : dueDate.soon
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-slate-500 dark:text-zinc-400"
            }`}
          >
            <CalendarDays size={13} />
            {dueDate.label}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-slate-400 dark:text-zinc-500">
            <Clock3 size={13} />
            No due date
          </span>
        )}

        {task.status === "done" && (
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={14} />
            Complete
          </span>
        )}
      </div>
    </article>
  );
}

export default function TaskCard({ task, onEdit, disabled = false }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task._id,
    data: { type: "task", task },
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? "opacity-25" : "opacity-100"}
    >
      <TaskCardSurface
        task={task}
        onEdit={onEdit}
        dragHandleProps={disabled ? null : { ...attributes, ...listeners }}
      />
    </div>
  );
}
