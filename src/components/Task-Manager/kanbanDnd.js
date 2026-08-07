import { TASK_STATUSES } from "./taskManagerConfig";

const COLUMN_PREFIXES = ["column:", "mobile-column:"];
const VALID_STATUSES = new Set(TASK_STATUSES.map((status) => status.id));

function taskId(task) {
  return String(task._id);
}

function boardLayout(tasks) {
  return TASK_STATUSES.flatMap((status) =>
    tasks
      .filter((task) => task.status === status.id)
      .sort((a, b) => a.position - b.position)
      .map((task) => `${status.id}:${taskId(task)}`)
  ).join("|");
}

export function assignBoardPositions(tasks) {
  return TASK_STATUSES.flatMap((status) =>
    tasks
      .filter((task) => task.status === status.id)
      .map((task, index) => ({ ...task, position: (index + 1) * 1000 }))
  );
}

export function getDropTarget(tasks, overId) {
  const normalizedOverId = String(overId);
  const columnPrefix = COLUMN_PREFIXES.find((prefix) =>
    normalizedOverId.startsWith(prefix)
  );

  if (columnPrefix) {
    const status = normalizedOverId.slice(columnPrefix.length);
    if (!VALID_STATUSES.has(status)) return null;

    return {
      status,
      task: null,
      type: columnPrefix === "mobile-column:" ? "mobile-column" : "column",
    };
  }

  const task = tasks.find((item) => taskId(item) === normalizedOverId);
  return task ? { status: task.status, task, type: "task" } : null;
}

export function moveTaskOnBoard(
  tasks,
  { activeId, overId, insertAfter = false, movedAt = new Date().toISOString() }
) {
  const normalizedActiveId = String(activeId);
  const currentTask = tasks.find((task) => taskId(task) === normalizedActiveId);
  const target = getDropTarget(tasks, overId);

  if (!currentTask || !target || normalizedActiveId === String(overId)) {
    return tasks;
  }

  // The mobile stage picker changes columns, but dropping back on the current
  // stage should not unexpectedly send the task to the end of its list.
  if (target.type === "mobile-column" && target.status === currentTask.status) {
    return tasks;
  }

  const withoutActive = tasks.filter(
    (task) => taskId(task) !== normalizedActiveId
  );
  const targetColumn = withoutActive
    .filter((task) => task.status === target.status)
    .sort((a, b) => a.position - b.position);

  const hoveredIndex = target.task
    ? targetColumn.findIndex((task) => taskId(task) === taskId(target.task))
    : -1;
  const targetIndex = hoveredIndex >= 0
    ? hoveredIndex + (insertAfter ? 1 : 0)
    : targetColumn.length;
  const movedIntoDone = currentTask.status !== "done" && target.status === "done";

  targetColumn.splice(targetIndex, 0, {
    ...currentTask,
    status: target.status,
    completed: target.status === "done",
    completedAt:
      target.status === "done"
        ? movedIntoDone
          ? movedAt
          : currentTask.completedAt
        : null,
  });

  const candidateTasks = TASK_STATUSES.flatMap((status) =>
    status.id === target.status
      ? targetColumn
      : withoutActive
          .filter((task) => task.status === status.id)
          .sort((a, b) => a.position - b.position)
  );

  const candidateLayout = candidateTasks
    .map((task) => `${task.status}:${taskId(task)}`)
    .join("|");

  if (candidateLayout === boardLayout(tasks)) {
    return tasks;
  }

  return assignBoardPositions(candidateTasks);
}
