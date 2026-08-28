import React, { useEffect, useRef, useState } from "react";
import {
  AlignLeft,
  CalendarDays,
  Flag,
  Layers3,
  Save,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import {
  EMPTY_TASK,
  TASK_PRIORITIES,
  TASK_STATUSES,
  toDateInputValue,
} from "./taskManagerConfig";
import useDialogFocus from "./useDialogFocus";

function toFormTask(task, initialStatus) {
  if (!task) return { ...EMPTY_TASK, status: initialStatus || "backlog" };

  return {
    title: task.title || "",
    description: task.description || "",
    status: task.status || "todo",
    priority: task.priority || "medium",
    dueDate: toDateInputValue(task.dueDate),
    labels: Array.isArray(task.labels) ? task.labels : [],
  };
}

export default function TaskModal({
  open,
  task,
  initialStatus,
  onClose,
  onSave,
  onDelete,
  isSaving,
}) {
  const [form, setForm] = useState(() => toFormTask(task, initialStatus));
  const [labelInput, setLabelInput] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const titleRef = useRef(null);
  const dialogRef = useDialogFocus({
    open,
    onClose,
    initialFocusRef: titleRef,
    canClose: !isSaving,
  });

  useEffect(() => {
    if (!open) return undefined;

    setForm(toFormTask(task, initialStatus));
    setLabelInput(Array.isArray(task?.labels) ? task.labels.join(", ") : "");
    setConfirmDelete(false);
    return undefined;
  }, [open, task, initialStatus]);

  if (!open) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.title.trim()) return;

    const labels = [
      ...new Set(
        labelInput
          .split(",")
          .map((label) => label.trim())
          .filter(Boolean)
      ),
    ].slice(0, 8);

    onSave({
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      dueDate: form.dueDate || null,
      labels,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) onClose();
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
        className="relative flex max-h-[100dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-white/60 bg-white shadow-2xl sm:max-h-[min(94dvh,52rem)] sm:max-w-2xl sm:rounded-2xl dark:border-zinc-800 dark:bg-zinc-950"
      >
        <div className="z-10 flex shrink-0 items-start justify-between gap-4 border-b border-slate-200/80 bg-white/95 px-5 py-4 backdrop-blur-xl sm:px-6 dark:border-zinc-800 dark:bg-zinc-950/95">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
              {task ? "Task details" : "New work item"}
            </p>
            <h2 id="task-modal-title" className="mt-1 text-xl font-extrabold text-slate-950 dark:text-white">
              {task ? "Edit task" : "Create a task"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
            aria-label="Close task editor"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="space-y-5 overflow-y-auto overscroll-contain p-5 sm:p-6">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-zinc-200">
                Task title <span className="text-rose-500">*</span>
              </span>
              <input
                ref={titleRef}
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                maxLength={140}
                placeholder="What needs to get done?"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-600"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-zinc-200">
                <AlignLeft size={15} /> Description
              </span>
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                maxLength={2000}
                rows={4}
                placeholder="Add context, acceptance criteria, or useful notes..."
                className="w-full resize-none rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-600"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-zinc-200">
                  <Layers3 size={15} /> Status
                </span>
                <select
                  value={form.status}
                  onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                >
                  {TASK_STATUSES.map((status) => (
                    <option key={status.id} value={status.id}>{status.label}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-zinc-200">
                  <Flag size={15} /> Priority
                </span>
                <select
                  value={form.priority}
                  onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                >
                  {TASK_PRIORITIES.map((priority) => (
                    <option key={priority.id} value={priority.id}>{priority.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-zinc-200">
                  <CalendarDays size={15} /> Due date
                </span>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:[color-scheme:dark]"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-zinc-200">
                  <Tag size={15} /> Labels
                </span>
                <input
                  value={labelInput}
                  onChange={(event) => setLabelInput(event.target.value)}
                  placeholder="Design, API, Research"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-600"
                />
                <span className="mt-1.5 block text-[11px] text-slate-400 dark:text-zinc-500">
                  Up to 8 comma-separated labels
                </span>
              </label>
            </div>
          </div>

          <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 bg-white/95 px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-zinc-800 dark:bg-zinc-950/95">
            <div>
              {task && !confirmDelete && (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  disabled={isSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                >
                  <Trash2 size={16} /> Delete task
                </button>
              )}
              {task && confirmDelete && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onDelete(task)}
                    disabled={isSaving}
                    className="rounded-xl bg-rose-600 px-3.5 py-2.5 text-sm font-bold text-white transition hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-50"
                  >
                    Confirm delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    disabled={isSaving}
                    className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                  >
                    Keep it
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-50 sm:flex-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || !form.title.trim()}
                className="inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-indigo-600 px-3 py-2.5 text-sm font-extrabold text-white shadow-lg shadow-indigo-500/20 transition hover:-translate-y-0.5 hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:flex-none sm:px-5 dark:focus-visible:ring-offset-zinc-950"
              >
                <Save size={16} />
                {isSaving ? "Saving..." : task ? "Save changes" : "Create task"}
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
