import {
  getDropTarget,
  moveTaskOnBoard,
  restoreTaskMoveOnLatestBoard,
} from "./kanbanDnd";

const boardTasks = [
  {
    _id: "todo-1",
    title: "First",
    status: "todo",
    position: 1000,
    completed: false,
    completedAt: null,
  },
  {
    _id: "todo-2",
    title: "Second",
    status: "todo",
    position: 2000,
    completed: false,
    completedAt: null,
  },
  {
    _id: "todo-3",
    title: "Third",
    status: "todo",
    position: 3000,
    completed: false,
    completedAt: null,
  },
  {
    _id: "done-1",
    title: "Finished",
    status: "done",
    position: 1000,
    completed: true,
    completedAt: "2026-08-01T12:00:00.000Z",
  },
];

function idsInStatus(tasks, status) {
  return tasks
    .filter((task) => task.status === status)
    .sort((a, b) => a.position - b.position)
    .map((task) => task._id);
}

test("moves a task after the hovered card and assigns stable positions", () => {
  const moved = moveTaskOnBoard(boardTasks, {
    activeId: "todo-1",
    overId: "todo-2",
    insertAfter: true,
  });

  expect(idsInStatus(moved, "todo")).toEqual([
    "todo-2",
    "todo-1",
    "todo-3",
  ]);
  expect(
    moved.filter((task) => task.status === "todo").map((task) => task.position)
  ).toEqual([1000, 2000, 3000]);
});

test("moves a task into a desktop column and updates completion metadata", () => {
  const movedAt = "2026-08-07T08:30:00.000Z";
  const moved = moveTaskOnBoard(boardTasks, {
    activeId: "todo-2",
    overId: "column:done",
    movedAt,
  });
  const task = moved.find((item) => item._id === "todo-2");

  expect(idsInStatus(moved, "done")).toEqual(["done-1", "todo-2"]);
  expect(task).toMatchObject({
    status: "done",
    completed: true,
    completedAt: movedAt,
    position: 2000,
  });
});

test("supports the mobile drop targets and clears completion when work resumes", () => {
  const moved = moveTaskOnBoard(boardTasks, {
    activeId: "done-1",
    overId: "mobile-column:in-progress",
  });
  const task = moved.find((item) => item._id === "done-1");

  expect(task).toMatchObject({
    status: "in-progress",
    completed: false,
    completedAt: null,
  });
});

test("keeps the board unchanged for a no-op or invalid mobile drop", () => {
  expect(
    moveTaskOnBoard(boardTasks, {
      activeId: "todo-1",
      overId: "mobile-column:todo",
    })
  ).toBe(boardTasks);
  expect(getDropTarget(boardTasks, "mobile-column:unknown")).toBeNull();
});

test("undoes only the selected move on the latest board", () => {
  const firstMove = moveTaskOnBoard(boardTasks, {
    activeId: "todo-2",
    overId: "column:done",
    movedAt: "2026-08-07T08:30:00.000Z",
  });
  const latestBoard = moveTaskOnBoard(firstMove, {
    activeId: "todo-3",
    overId: "column:done",
    movedAt: "2026-08-07T08:31:00.000Z",
  }).map((task) =>
    task._id === "todo-3" ? { ...task, title: "Edited after completion" } : task
  );

  const restored = restoreTaskMoveOnLatestBoard(
    latestBoard,
    boardTasks,
    firstMove,
    "todo-2"
  );

  expect(idsInStatus(restored, "todo")).toEqual(["todo-1", "todo-2"]);
  expect(idsInStatus(restored, "done")).toEqual(["done-1", "todo-3"]);
  expect(restored.find((task) => task._id === "todo-3")).toMatchObject({
    title: "Edited after completion",
    status: "done",
    completed: true,
  });
});

test("does not resurrect deleted work or undo a newer completion", () => {
  const firstMove = moveTaskOnBoard(boardTasks, {
    activeId: "todo-2",
    overId: "column:done",
    movedAt: "2026-08-07T08:30:00.000Z",
  });
  const deletedBoard = firstMove.filter((task) => task._id !== "todo-2");

  expect(
    restoreTaskMoveOnLatestBoard(
      deletedBoard,
      boardTasks,
      firstMove,
      "todo-2"
    )
  ).toBe(deletedBoard);

  const resumed = moveTaskOnBoard(firstMove, {
    activeId: "todo-2",
    overId: "column:todo",
  });
  const completedAgain = moveTaskOnBoard(resumed, {
    activeId: "todo-2",
    overId: "column:done",
    movedAt: "2026-08-07T09:00:00.000Z",
  });

  expect(
    restoreTaskMoveOnLatestBoard(
      completedAgain,
      boardTasks,
      firstMove,
      "todo-2"
    )
  ).toBe(completedAgain);
});
