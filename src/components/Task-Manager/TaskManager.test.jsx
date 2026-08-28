import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import TaskManager from "./TaskManager";

jest.mock("react-router-dom", () => ({
  useLocation: () => ({ pathname: "/task-manager" }),
}), { virtual: true });

jest.mock("axios", () => ({
  get: jest.fn(),
  create: jest.fn(() => ({
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
}));

jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
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

beforeEach(() => {
  localStorage.setItem("token", "test-token");
  axios.get.mockResolvedValue({ data: tasks });
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
