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
