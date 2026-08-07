import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Inbox, Plus } from "lucide-react";
import TaskCard from "./TaskCard";

export default function KanbanColumn({
  status,
  tasks,
  onAddTask,
  onEditTask,
  dragDisabled,
  isMobileActive,
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column:${status.id}`,
    data: { type: "column", status: status.id },
    disabled: dragDisabled,
  });

  return (
    <section
      ref={setNodeRef}
      aria-label={`${status.label} column`}
      className={`${isMobileActive ? "flex" : "hidden"} w-full min-w-0 flex-col rounded-[1.35rem] border p-2.5 transition-colors sm:flex sm:w-[320px] sm:min-w-[320px] xl:w-auto xl:min-w-0 ${
        isOver
          ? "border-indigo-300 bg-indigo-50/80 ring-2 ring-indigo-500/10 dark:border-indigo-700 dark:bg-indigo-950/25"
          : "border-slate-200/80 bg-slate-100/75 dark:border-zinc-800/90 dark:bg-zinc-900/65"
      }`}
    >
      <header className="flex items-start justify-between gap-3 px-2 pb-3 pt-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${status.dotClass}`} />
            <h2 className="truncate text-sm font-extrabold text-slate-900 dark:text-zinc-100">
              {status.label}
            </h2>
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-white px-1.5 text-[11px] font-bold text-slate-500 shadow-sm ring-1 ring-slate-200 dark:bg-zinc-950 dark:text-zinc-400 dark:ring-zinc-800">
              {tasks.length}
            </span>
          </div>
          <p className="mt-1 truncate text-xs text-slate-500 dark:text-zinc-500">
            {status.description}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onAddTask(status.id)}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:text-indigo-600 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:bg-zinc-950 dark:text-zinc-400 dark:ring-zinc-800 dark:hover:text-indigo-400"
          aria-label={`Add task to ${status.label}`}
          title={`Add to ${status.label}`}
        >
          <Plus size={16} />
        </button>
      </header>

      <SortableContext
        items={tasks.map((task) => task._id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex min-h-36 flex-1 flex-col gap-2.5">
          {tasks.length === 0 ? (
            <button
              type="button"
              onClick={() => onAddTask(status.id)}
              className="flex min-h-32 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/45 px-4 text-center transition hover:border-indigo-300 hover:bg-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-zinc-700 dark:bg-zinc-950/35 dark:hover:border-indigo-700 dark:hover:bg-zinc-950/70"
            >
              <span className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-zinc-900 dark:text-zinc-500">
                <Inbox size={17} />
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                Drop a task here
              </span>
              <span className="mt-0.5 text-[11px] text-slate-400 dark:text-zinc-600">
                or click to create one
              </span>
            </button>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onEdit={onEditTask}
                disabled={dragDisabled}
              />
            ))
          )}
        </div>
      </SortableContext>
    </section>
  );
}
