import { TASK_STATUSES } from "./taskManagerConfig";

const COLUMN_PREFIXES = ["column:", "mobile-column:"];
const VALID_STATUSES = new Set(TASK_STATUSES.map((status) => status.id));

function taskId(task) {
  return String(task._id);
}

function taskBoard(task) {
  return task.boardType || "goals";
}

function mergeBoard(allTasks, boardTasks) {
  const byId = new Map(boardTasks.map((task) => [taskId(task), task]));
  return allTasks.map((task) => byId.get(taskId(task)) || task);
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

  if (target.task && taskBoard(target.task) !== taskBoard(currentTask)) return tasks;
  const boardTasks = tasks.filter((task) => taskBoard(task) === taskBoard(currentTask));
  if (boardTasks.length !== tasks.length) {
    const moved = moveTaskOnBoard(boardTasks, { activeId, overId, insertAfter, movedAt });
    return moved === boardTasks ? tasks : mergeBoard(tasks, moved);
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

export function restoreTaskMoveOnLatestBoard(
  latestTasks,
  previousTasks,
  movedTasks,
  activeId
) {
  const normalizedActiveId = String(activeId);
  const latestTask = latestTasks.find(
    (task) => taskId(task) === normalizedActiveId
  );
  const previousTask = previousTasks.find(
    (task) => taskId(task) === normalizedActiveId
  );
  const movedTask = movedTasks.find(
    (task) => taskId(task) === normalizedActiveId
  );

  if (!latestTask || !previousTask || !movedTask) return latestTasks;
  const boardTasks = latestTasks.filter((task) => taskBoard(task) === taskBoard(latestTask));
  if (boardTasks.length !== latestTasks.length) {
    const restored = restoreTaskMoveOnLatestBoard(
      boardTasks,
      previousTasks.filter((task) => taskBoard(task) === taskBoard(latestTask)),
      movedTasks.filter((task) => taskBoard(task) === taskBoard(latestTask)),
      activeId
    );
    return restored === boardTasks ? latestTasks : mergeBoard(latestTasks, restored);
  }
  if (latestTask.status !== movedTask.status) return latestTasks;

  // A newer completion of the same task must not be undone by an older toast.
  if (
    movedTask.status === "done" &&
    (latestTask.completedAt || null) !== (movedTask.completedAt || null)
  ) {
    return latestTasks;
  }

  const previousColumn = previousTasks
    .filter((task) => task.status === previousTask.status)
    .sort((a, b) => a.position - b.position);
  const previousIndex = previousColumn.findIndex(
    (task) => taskId(task) === normalizedActiveId
  );

  if (previousIndex < 0) return latestTasks;

  const latestTargetIds = new Set(
    latestTasks
      .filter((task) => task.status === previousTask.status)
      .map(taskId)
  );
  const nextAnchor = previousColumn
    .slice(previousIndex + 1)
    .find((task) => latestTargetIds.has(taskId(task)));
  const previousAnchor = previousColumn
    .slice(0, previousIndex)
    .reverse()
    .find((task) => latestTargetIds.has(taskId(task)));

  const restoredTasks = moveTaskOnBoard(latestTasks, {
    activeId: normalizedActiveId,
    overId: nextAnchor
      ? taskId(nextAnchor)
      : previousAnchor
        ? taskId(previousAnchor)
        : `column:${previousTask.status}`,
    insertAfter: !nextAnchor && Boolean(previousAnchor),
  });

  if (restoredTasks === latestTasks) return latestTasks;

  return restoredTasks.map((task) =>
    taskId(task) === normalizedActiveId
      ? {
          ...task,
          completed: previousTask.status === "done",
          completedAt:
            previousTask.status === "done"
              ? previousTask.completedAt || null
              : null,
        }
      : task
  );
}
