export function isTaskNewlyCompleted(previousTasks, nextTasks, taskId) {
  const normalizedTaskId = String(taskId);
  const previousTask = previousTasks.find(
    (task) => String(task._id) === normalizedTaskId
  );
  const nextTask = nextTasks.find(
    (task) => String(task._id) === normalizedTaskId
  );

  return Boolean(
    previousTask &&
      nextTask &&
      previousTask.status !== "done" &&
      nextTask.status === "done"
  );
}

export function getTaskCompletionAchievement(completedCount, totalCount) {
  const completed = Math.max(0, Number(completedCount) || 0);
  const total = Math.max(0, Number(totalCount) || 0);

  if (total > 0 && completed === total) {
    return {
      title: "Board cleared",
      message: "Everything on your board is complete. Take the win—you earned it.",
    };
  }

  if (completed === 1) {
    return {
      title: "First win secured",
      message: "Momentum starts with one finished task. Keep it rolling.",
    };
  }

  if (completed > 0 && completed % 10 === 0) {
    return {
      title: `${completed} tasks delivered`,
      message: "That consistency is turning into serious progress.",
    };
  }

  if (completed > 0 && completed % 5 === 0) {
    return {
      title: `${completed}-task milestone`,
      message: "A strong streak is taking shape. Keep the momentum going.",
    };
  }

  return {
    title: "Task complete",
    message: "Another meaningful step forward. Nicely done.",
  };
}
