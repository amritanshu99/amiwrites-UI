import {
  getTaskCompletionAchievement,
  isTaskNewlyCompleted,
} from "./taskCompletionAchievement";

const activeTask = { _id: "task-1", status: "in-progress" };
const doneTask = { ...activeTask, status: "done" };

test("only identifies a genuine transition into Done", () => {
  expect(isTaskNewlyCompleted([activeTask], [doneTask], "task-1")).toBe(true);
  expect(isTaskNewlyCompleted([doneTask], [doneTask], "task-1")).toBe(false);
  expect(isTaskNewlyCompleted([], [doneTask], "task-1")).toBe(false);
  expect(isTaskNewlyCompleted([activeTask], [activeTask], "task-1")).toBe(false);
});

test("celebrates a cleared board before the first-task milestone", () => {
  expect(getTaskCompletionAchievement(1, 1).title).toBe("Board cleared");
});

test("recognizes first, five-task, and ten-task achievements", () => {
  expect(getTaskCompletionAchievement(1, 8).title).toBe("First win secured");
  expect(getTaskCompletionAchievement(5, 8).title).toBe("5-task milestone");
  expect(getTaskCompletionAchievement(10, 12).title).toBe("10 tasks delivered");
});

test("uses the everyday completion message between milestones", () => {
  expect(getTaskCompletionAchievement(3, 8).title).toBe("Task complete");
});
