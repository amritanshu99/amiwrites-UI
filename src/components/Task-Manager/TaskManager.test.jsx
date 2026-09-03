import React from "react";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import TaskManager from "./TaskManager";

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

test("renders the professional board and safely maps legacy completed tasks", async () => {
  renderTaskManager();

  expect(await screen.findByRole("heading", { name: "Task Manager" })).toBeInTheDocument();
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

  window.removeEventListener("open-login-modal", loginListener);
  window.removeEventListener("open-signup-modal", signupListener);
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
