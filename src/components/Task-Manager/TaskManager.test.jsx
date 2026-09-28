import React from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import TaskManager from "./TaskManager";
import { verifyToken } from "../../utils/authApi";
import { ADMIN_USERNAME } from "../../config/auth";
import { planningDate } from "./taskManagerConfig";

jest.mock("../../utils/authApi", () => ({ verifyToken: jest.fn() }));

const mockApiClient = {
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};
let mockDndHandlers = {};

jest.mock("react-router-dom", () => ({
  useLocation: () => ({ pathname: "/task-manager" }),
}), { virtual: true });

jest.mock("axios", () => ({
  get: jest.fn(),
  create: jest.fn(() => mockApiClient),
}));

jest.mock("@dnd-kit/core", () => {
  const React = require("react");

  return {
    DndContext: ({ children, onDragEnd, onDragStart }) => {
      mockDndHandlers = { onDragEnd, onDragStart };
      return React.createElement(React.Fragment, null, children);
    },
    DragOverlay: ({ children }) => React.createElement(React.Fragment, null, children),
    KeyboardSensor: function KeyboardSensor() {},
    MeasuringStrategy: { Always: "always" },
    MouseSensor: function MouseSensor() {},
    TouchSensor: function TouchSensor() {},
    closestCorners: jest.fn(() => []),
    pointerWithin: jest.fn(() => []),
    useDroppable: () => ({ isOver: false, setNodeRef: jest.fn() }),
    useSensor: jest.fn(() => ({})),
    useSensors: jest.fn((...sensors) => sensors),
  };
});

jest.mock("@dnd-kit/sortable", () => {
  const React = require("react");

  return {
    SortableContext: ({ children }) => React.createElement(React.Fragment, null, children),
    sortableKeyboardCoordinates: jest.fn(),
    useSortable: () => ({
      attributes: {},
      listeners: {},
      setNodeRef: jest.fn(),
      transform: null,
      transition: undefined,
      isDragging: false,
    }),
    verticalListSortingStrategy: {},
  };
});

jest.mock("react-toastify", () => ({
  Slide: jest.fn(),
  ToastContainer: () => null,
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    dismiss: jest.fn(),
    clearWaitingQueue: jest.fn(),
    pause: jest.fn(),
    play: jest.fn(),
  },
}));

const tasks = [
  {
    _id: "task-1",
    title: "Plan launch",
    description: "Write the release checklist",
    status: "in-progress",
    priority: "high",
    labels: ["Launch"],
    position: 1000,
    completed: false,
    createdAt: "2026-08-01T10:00:00.000Z",
    updatedAt: "2026-08-06T10:00:00.000Z",
  },
  {
    _id: "task-2",
    title: "Legacy completed task",
    description: "Migrates into Done",
    completed: true,
    createdAt: "2026-08-02T10:00:00.000Z",
    updatedAt: "2026-08-05T10:00:00.000Z",
  },
];

function renderTaskManager() {
  return render(<TaskManager />);
}

function dragTask(activeId, overId) {
  return mockDndHandlers.onDragEnd({
    active: {
      id: activeId,
      rect: { current: { translated: { top: 0, height: 40 } } },
    },
    over: {
      id: overId,
      rect: { top: 0, height: 40 },
    },
  });
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockDndHandlers = {};
  verifyToken.mockReset();
  localStorage.setItem("token", "test-token");
  axios.get.mockResolvedValue({ data: tasks });
  axios.create.mockReturnValue(mockApiClient);
  mockApiClient.post.mockResolvedValue({ data: {} });
  mockApiClient.put.mockResolvedValue({ data: {} });
  mockApiClient.delete.mockResolvedValue({ data: {} });
});

afterEach(() => {
  localStorage.clear();
});

function dailyTask(overrides = {}) {
  return { ...tasks[0], _id: "daily-1", title: "Draft the launch email", boardType: "daily", status: "todo", plannedDate: planningDate(), linkedGoalId: "task-1", ...overrides };
}

test("separates daily work, filters calendar days, and opens its linked goal", async () => {
  axios.get.mockResolvedValue({ data: [...tasks, dailyTask(), dailyTask({ _id: "daily-2", title: "Review tomorrow", plannedDate: planningDate(1), linkedGoalId: null })] });
  renderTaskManager();
  await screen.findByText("Plan launch");
  expect(screen.queryByText("Draft the launch email")).not.toBeInTheDocument();
  expect(screen.getByText("0/1 daily tasks complete")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Show In Progress tasks" })).toHaveAttribute("aria-pressed", "true");
  await userEvent.click(screen.getByRole("button", { name: "Daily planner", exact: true }));
  expect(screen.getByText("2 of 2 shown")).toBeInTheDocument();
  expect(screen.queryByText("Legacy completed task")).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Today", exact: true }));
  expect(screen.getByText("Draft the launch email")).toBeInTheDocument();
  expect(screen.queryByText("Review tomorrow")).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Open linked goal: Plan launch" }));
  expect(screen.getByRole("textbox", { name: /Task title/ })).toHaveValue("Plan launch");
  expect(screen.queryByLabelText("Planned date")).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Close task editor" }));
  await userEvent.click(screen.getByRole("button", { name: "Tomorrow", exact: true }));
  expect(screen.getByText("Review tomorrow")).toBeInTheDocument();
  expect(screen.queryByText("Draft the launch email")).not.toBeInTheDocument();
});

test.each(["task-1", ""])("creates and reloads tomorrow's daily task with optional link %s", async (linkedGoalId) => {
  let created;
  mockApiClient.post.mockImplementation(async (_, form) => {
    created = { ...form, _id: "new-daily" };
    return { data: created };
  });
  const view = renderTaskManager();
  await screen.findByText("Plan launch");
  await userEvent.click(screen.getByRole("button", { name: "Daily planner", exact: true }));
  await userEvent.click(screen.getByRole("button", { name: "Tomorrow", exact: true }));
  await userEvent.click(screen.getByRole("button", { name: "New task" }));
  expect(screen.getByLabelText("Planned date")).toHaveValue(planningDate(1));
  expect(screen.getByRole("combobox", { name: "Status" })).toHaveValue("todo");
  await userEvent.type(screen.getByRole("textbox", { name: /Task title/ }), "Write introduction");
  await userEvent.selectOptions(screen.getByRole("combobox", { name: "Linked goal (optional)" }), linkedGoalId);
  await userEvent.click(screen.getByRole("button", { name: "Create task", exact: true }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(mockApiClient.post).toHaveBeenCalledWith("/", expect.objectContaining({ boardType: "daily", plannedDate: planningDate(1), linkedGoalId: linkedGoalId || null, status: "todo" }));
  expect(screen.getByText("Write introduction")).toBeInTheDocument();
  view.unmount();
  axios.get.mockResolvedValue({ data: [...tasks, created] });
  renderTaskManager();
  await screen.findByText("Plan launch");
  await userEvent.click(screen.getByRole("button", { name: "Daily planner", exact: true }));
  await userEvent.click(screen.getByRole("button", { name: "Edit Write introduction" }));
  expect(screen.getByLabelText("Planned date")).toHaveValue(planningDate(1));
  expect(screen.getByRole("combobox", { name: "Linked goal (optional)" })).toHaveValue(linkedGoalId);
});

test("reschedules and unlinks daily work without hiding the saved task", async () => {
  axios.get.mockResolvedValue({ data: [...tasks, dailyTask()] });
  mockApiClient.put.mockImplementation(async (_, form) => ({ data: dailyTask(form) }));
  renderTaskManager();
  await screen.findByText("Plan launch");
  await userEvent.click(screen.getByRole("button", { name: "Daily planner", exact: true }));
  await userEvent.click(screen.getByRole("button", { name: "Today", exact: true }));
  await userEvent.click(screen.getByRole("button", { name: "Edit Draft the launch email" }));
  const dialog = screen.getByRole("dialog", { name: "Edit task" });
  await userEvent.click(within(dialog).getByRole("button", { name: "Tomorrow", exact: true }));
  await userEvent.selectOptions(within(dialog).getByRole("combobox", { name: "Linked goal (optional)" }), "");
  await userEvent.click(within(dialog).getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(mockApiClient.put).toHaveBeenCalledWith("/daily-1", expect.objectContaining({ plannedDate: planningDate(1), linkedGoalId: null }));
  expect(screen.getByText("Draft the launch email")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "All dates" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.queryByRole("button", { name: "Open linked goal: Plan launch" })).not.toBeInTheDocument();
});

test("allows choosing an empty mobile column while filtering daily tasks", async () => {
  axios.get.mockResolvedValue({ data: [...tasks, dailyTask()] });
  renderTaskManager();
  await screen.findByText("Plan launch");
  await userEvent.click(screen.getByRole("button", { name: "Daily planner", exact: true }));
  await userEvent.click(screen.getByRole("button", { name: "Today", exact: true }));
  await userEvent.click(screen.getByRole("button", { name: "Show In Progress tasks" }));
  expect(screen.getByRole("button", { name: "Show In Progress tasks" })).toHaveAttribute("aria-pressed", "true");
});

test("editing a linked goal preserves the daily board's selected mobile column", async () => {
  axios.get.mockResolvedValue({ data: [...tasks, dailyTask()] });
  mockApiClient.put.mockImplementation(async (_, form) => ({ data: { ...tasks[0], ...form } }));
  renderTaskManager();
  await screen.findByText("Plan launch");
  await userEvent.click(screen.getByRole("button", { name: "Daily planner", exact: true }));
  await userEvent.click(screen.getByRole("button", { name: "Open linked goal: Plan launch" }));
  await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(screen.getByRole("button", { name: "Show To Do tasks" })).toHaveAttribute("aria-pressed", "true");
});

test("daily completion and Undo never reorder or complete long-term goals", async () => {
  axios.get.mockResolvedValue({ data: [...tasks, dailyTask()] });
  renderTaskManager();
  await screen.findByText("Plan launch");
  await userEvent.click(screen.getByRole("button", { name: "Daily planner", exact: true }));
  await userEvent.click(screen.getByRole("button", { name: "Today", exact: true }));
  expect(screen.getByRole("button", { name: "Move Draft the launch email" })).toBeInTheDocument();
  await act(async () => { await dragTask("daily-1", "column:done"); });
  expect(mockApiClient.put.mock.calls[0][1].items).toEqual([expect.objectContaining({ id: "daily-1", status: "done" })]);
  await userEvent.click(screen.getByRole("button", { name: "Long-term goals", exact: true }));
  expect(screen.getByRole("region", { name: "In Progress column" })).toHaveTextContent("Plan launch");
  expect(screen.getByText("1/1 daily tasks complete")).toBeInTheDocument();
  const [renderAchievement] = require("react-toastify").toast.success.mock.calls.find(([content]) => typeof content === "function");
  const notice = render(renderAchievement({ closeToast: jest.fn() }));
  await userEvent.click(within(notice.container).getByRole("button", { name: "Undo completing Draft the launch email" }));
  await waitFor(() => expect(mockApiClient.put).toHaveBeenCalledTimes(2));
  expect(mockApiClient.put.mock.calls[1][1].items).toEqual([expect.objectContaining({ id: "daily-1", status: "todo" })]);
  expect(screen.getByText("0/1 daily tasks complete")).toBeInTheDocument();
});

test("deleting a goal preserves its daily tasks and removes the link", async () => {
  axios.get.mockResolvedValue({ data: [...tasks, dailyTask()] });
  renderTaskManager();
  await screen.findByText("Plan launch");
  await userEvent.click(screen.getByRole("button", { name: "Edit Plan launch" }));
  await userEvent.click(screen.getByRole("button", { name: "Delete task" }));
  await userEvent.click(screen.getByRole("button", { name: "Confirm delete" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  await userEvent.click(screen.getByRole("button", { name: "Daily planner", exact: true }));
  expect(screen.getByText("Draft the launch email")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Open linked goal/ })).not.toBeInTheDocument();
});

test("renders the professional board and safely maps legacy completed tasks", async () => {
  renderTaskManager();

  expect(await screen.findByRole("heading", { name: "Task Manager" })).toBeInTheDocument();
  expect(screen.queryByRole("region", { name: "Your prime time" })).not.toBeInTheDocument();
  await screen.findByText("Plan launch");
  expect(screen.getByRole("region", { name: "Backlog column" })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "To Do column" })).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "In Progress column" })).toHaveTextContent("Plan launch");
  expect(screen.getByRole("region", { name: "Done column" })).toHaveTextContent("Legacy completed task");
  expect(screen.getByRole("button", { name: "Show In Progress tasks" })).toHaveAttribute(
    "aria-pressed",
    "true"
  );
});

test("opens a complete task editor from the new task action", async () => {
  renderTaskManager();
  await screen.findByText("Plan launch");

  await userEvent.click(screen.getByRole("button", { name: "New task" }));

  expect(screen.getByRole("dialog", { name: "Create a task" })).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: /Task title/i })).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "Status" })).toHaveValue("backlog");
  expect(screen.getByRole("combobox", { name: "Priority" })).toHaveValue("medium");

  await userEvent.type(screen.getByRole("textbox", { name: /Task title/i }), "Review metrics");
  expect(screen.getByRole("button", { name: "Create task" })).toBeEnabled();

  await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));
});

test("shows a persistent load error and retries the board request", async () => {
  axios.get
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce({ data: tasks });

  renderTaskManager();

  expect(
    await screen.findByRole("heading", { name: "Your board could not be loaded" })
  ).toBeInTheDocument();
  expect(screen.queryByText("Plan launch")).not.toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "Retry loading board" }));

  expect(await screen.findByText("Plan launch")).toBeInTheDocument();
  expect(axios.get).toHaveBeenCalledTimes(2);
});

test("keeps mobile filters collapsed until requested", async () => {
  renderTaskManager();
  await screen.findByText("Plan launch");

  const filterButton = screen.getByRole("button", { name: "Toggle task filters" });
  expect(filterButton).toHaveAttribute("aria-expanded", "false");

  await userEvent.click(filterButton);

  expect(filterButton).toHaveAttribute("aria-expanded", "true");
});

test("traps the task editor lifecycle and restores focus on Escape", async () => {
  renderTaskManager();
  await screen.findByText("Plan launch");

  const newTaskButton = screen.getByRole("button", { name: "New task" });
  await userEvent.click(newTaskButton);

  const titleInput = screen.getByRole("textbox", { name: /Task title/i });
  await waitFor(() => expect(titleInput).toHaveFocus());
  expect(document.body).toHaveClass("task-manager-overlay-active");

  await userEvent.keyboard("{Escape}");

  await waitFor(() => {
    expect(screen.queryByRole("dialog", { name: "Create a task" })).not.toBeInTheDocument();
  });
  expect(newTaskButton).toHaveFocus();
  expect(document.body).not.toHaveClass("task-manager-overlay-active");
});

test("offers direct authentication actions when the user is signed out", async () => {
  localStorage.removeItem("token");
  const loginListener = jest.fn();
  const signupListener = jest.fn();
  window.addEventListener("open-login-modal", loginListener);
  window.addEventListener("open-signup-modal", signupListener);

  renderTaskManager();

  await userEvent.click(screen.getByRole("button", { name: "Log in" }));
  await userEvent.click(screen.getByRole("button", { name: "Create account" }));

  expect(loginListener).toHaveBeenCalledTimes(1);
  expect(signupListener).toHaveBeenCalledTimes(1);
  expect(axios.get).not.toHaveBeenCalled();
  expect(screen.queryByRole("region", { name: "Your prime time" })).not.toBeInTheDocument();

  window.removeEventListener("open-login-modal", loginListener);
  window.removeEventListener("open-signup-modal", signupListener);
});

let authTokenSequence = 0;
function setUserToken(username) {
  const claims = btoa(JSON.stringify({ username, exp: Math.floor(Date.now() / 1000) + 3600 }));
  localStorage.setItem("token", `eyJhbGciOiJIUzI1NiJ9.${claims}.test-${++authTokenSequence}`);
}

test("keeps prime time behind an admin button and dismisses the popup on logout", async () => {
  const verification = deferred();
  verifyToken.mockReturnValueOnce(verification.promise);
  setUserToken(ADMIN_USERNAME);
  renderTaskManager();
  await screen.findByText("Plan launch");
  expect(screen.queryByRole("button", { name: "Prime time" })).not.toBeInTheDocument();

  await act(async () => verification.resolve(true));
  const trigger = await screen.findByRole("button", { name: "Prime time" });
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByRole("region", { name: "Your prime time" })).not.toBeInTheDocument();
  expect(screen.getByRole("region", { name: "In Progress column" })).toHaveTextContent("Plan launch");

  await userEvent.click(trigger);
  expect(screen.getByRole("dialog", { name: "Your prime time" })).toHaveAttribute("aria-modal", "true");
  expect(trigger).toHaveAttribute("aria-expanded", "true");
  expect(document.body).toHaveClass("task-manager-overlay-active");

  act(() => {
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("tokenChanged"));
  });
  expect(screen.queryByRole("dialog", { name: "Your prime time" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Prime time" })).not.toBeInTheDocument();
  expect(document.body).not.toHaveClass("task-manager-overlay-active");

  verifyToken.mockResolvedValueOnce(true);
  act(() => {
    setUserToken(ADMIN_USERNAME);
    window.dispatchEvent(new Event("tokenChanged"));
  });
  expect(await screen.findByRole("button", { name: "Prime time" })).toHaveAttribute("aria-expanded", "false");
  expect(screen.queryByRole("dialog", { name: "Your prime time" })).not.toBeInTheDocument();
});

test("traps popup focus including the calculation disclosure and restores the trigger on close", async () => {
  verifyToken.mockResolvedValueOnce(true);
  setUserToken(ADMIN_USERNAME);
  renderTaskManager();
  const trigger = await screen.findByRole("button", { name: "Prime time" });
  await userEvent.click(trigger);
  const dialog = screen.getByRole("dialog", { name: "Your prime time" });
  const closeButton = within(dialog).getByRole("button", { name: "Close prime time" });
  const disclosure = within(dialog).getByText("How this is calculated");
  await waitFor(() => expect(closeButton).toHaveFocus());

  await userEvent.tab({ shift: true });
  expect(disclosure).toHaveFocus();
  await userEvent.tab();
  expect(closeButton).toHaveFocus();
  await userEvent.click(within(dialog).getByRole("heading", { name: "Your prime time" }));
  expect(dialog).toBeInTheDocument();

  await userEvent.keyboard("{Escape}");
  expect(screen.queryByRole("dialog", { name: "Your prime time" })).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
  expect(document.body).not.toHaveClass("task-manager-overlay-active");

  await userEvent.click(trigger);
  await userEvent.click(screen.getByRole("button", { name: "Close prime time" }));
  expect(screen.queryByRole("dialog", { name: "Your prime time" })).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
  expect(screen.getByRole("region", { name: "In Progress column" })).toHaveTextContent("Plan launch");
});

test("closes prime time when the backdrop is clicked", async () => {
  verifyToken.mockResolvedValueOnce(true);
  setUserToken(ADMIN_USERNAME);
  renderTaskManager();
  const trigger = await screen.findByRole("button", { name: "Prime time" });
  await userEvent.click(trigger);
  fireEvent.mouseDown(screen.getByRole("dialog", { name: "Your prime time" }).parentElement);
  expect(screen.queryByRole("dialog", { name: "Your prime time" })).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
});

test("hides prime time when admin verification fails", async () => {
  verifyToken.mockResolvedValueOnce(false);
  setUserToken(ADMIN_USERNAME);
  renderTaskManager();
  await screen.findByText("Plan launch");
  await waitFor(() => expect(verifyToken).toHaveBeenCalledTimes(1));
  expect(screen.queryByRole("region", { name: "Your prime time" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Prime time" })).not.toBeInTheDocument();
});

test("hides prime time for a signed-in regular user", async () => {
  setUserToken("reader");
  renderTaskManager();
  await screen.findByText("Plan launch");
  expect(verifyToken).not.toHaveBeenCalled();
  expect(screen.queryByRole("region", { name: "Your prime time" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Prime time" })).not.toBeInTheDocument();
});

test("persists a Done move before celebrating the achievement and supports Undo", async () => {
  const reorderRequest = deferred();
  mockApiClient.put.mockReturnValueOnce(reorderRequest.promise);
  renderTaskManager();
  await screen.findByText("Plan launch");

  let dragPromise;
  await act(async () => {
    dragPromise = dragTask("task-1", "column:done");
    await Promise.resolve();
  });

  await waitFor(() => expect(mockApiClient.put).toHaveBeenCalledTimes(1));
  expect(mockApiClient.put).toHaveBeenCalledWith(
    "/reorder",
    expect.objectContaining({
      items: expect.arrayContaining([
        expect.objectContaining({ id: "task-1", status: "done" }),
      ]),
    })
  );
  expect(require("react-toastify").toast.success).not.toHaveBeenCalled();

  reorderRequest.resolve({ data: {} });
  await act(async () => {
    await dragPromise;
  });

  const { toast } = require("react-toastify");
  const achievementCall = toast.success.mock.calls.find(
    ([content, options]) =>
      typeof content === "function" && options?.ariaLabel?.startsWith("Achievement unlocked")
  );
  expect(achievementCall).toBeDefined();

  const [renderAchievement, options] = achievementCall;
  expect(options).toEqual(
    expect.objectContaining({
      autoClose: 8000,
      closeOnClick: false,
      role: "status",
    })
  );

  const closeToast = jest.fn();
  const achievementView = render(renderAchievement({ closeToast }));
  expect(within(achievementView.container).getByText("Achievement unlocked")).toBeInTheDocument();
  expect(within(achievementView.container).getByText("Board cleared")).toBeInTheDocument();
  expect(within(achievementView.container).getByText("2 done")).toBeInTheDocument();
  expect(within(achievementView.container).getByText(/Plan launch/)).toHaveTextContent(
    "Plan launch"
  );

  await userEvent.click(
    within(achievementView.container).getByRole("button", { name: "Undo completing Plan launch" })
  );

  await waitFor(() => expect(mockApiClient.put).toHaveBeenCalledTimes(2));
  expect(closeToast).toHaveBeenCalledTimes(1);
  expect(mockApiClient.put.mock.calls[1]).toEqual([
    "/reorder",
    expect.objectContaining({
      items: expect.arrayContaining([
        expect.objectContaining({
          id: "task-1",
          status: "in-progress",
          completedAt: null,
        }),
      ]),
    }),
  ]);
});

test("ignores an older Undo after the same card has moved again", async () => {
  renderTaskManager();
  await screen.findByText("Plan launch");

  await act(async () => {
    await dragTask("task-1", "column:done");
  });

  const { toast } = require("react-toastify");
  const [renderOldAchievement] = toast.success.mock.calls.find(
    ([content, options]) =>
      typeof content === "function" && options?.ariaLabel?.startsWith("Achievement unlocked")
  );

  await act(async () => {
    await dragTask("task-1", "column:todo");
  });
  expect(mockApiClient.put).toHaveBeenCalledTimes(2);
  expect(screen.getByRole("region", { name: "To Do column" })).toHaveTextContent(
    "Plan launch"
  );

  const staleToastView = render(renderOldAchievement({ closeToast: jest.fn() }));
  await userEvent.click(
    within(staleToastView.container).getByRole("button", {
      name: "Undo completing Plan launch",
    })
  );
  await act(async () => {
    await Promise.resolve();
  });

  expect(mockApiClient.put).toHaveBeenCalledTimes(2);
  expect(screen.getByRole("region", { name: "To Do column" })).toHaveTextContent(
    "Plan launch"
  );
});

test("rolls the board back when move persistence fails", async () => {
  mockApiClient.put.mockRejectedValueOnce(new Error("offline"));
  renderTaskManager();
  await screen.findByText("Plan launch");

  await act(async () => {
    await dragTask("task-1", "column:done");
  });

  expect(
    screen.getByRole("region", { name: "In Progress column" })
  ).toHaveTextContent("Plan launch");
  expect(screen.getByRole("region", { name: "Done column" })).not.toHaveTextContent(
    "Plan launch"
  );
  expect(require("react-toastify").toast.error).toHaveBeenCalledWith(
    "The task could not be moved."
  );
});
