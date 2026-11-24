import React from "react";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import AmiBotEvals from "./AmiBotEvals";
import { compareRuns, evalRequest } from "./evalApi";

jest.mock(
  "react-router-dom",
  () => ({
    Link: ({ to, children, ...props }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  }),
  { virtual: true },
);
jest.mock("axios", () => jest.fn());
jest.mock("./evalApi", () => ({
  ...jest.requireActual("./evalApi"),
  evalRequest: jest.fn(),
}));

const testCase = {
  _id: "case-1",
  title: "Current role",
  query: "What is your job title?",
  category: "Career",
  expectedOutcome: "knowledge",
  expectedFacts: ["Engineer"],
  expectedChunkIds: ["chunk-1"],
  history: [],
  referenceAnswer: "Platform Engineer.",
};
const completeRun = {
  _id: "run-1",
  createdAt: "2026-11-24T10:00:00Z",
  evaluatorVersion: "v1",
  suiteFingerprint: "same",
  config: {
    models: ["test-model"],
    topK: 8,
    knowledgeCount: 2,
    temperature: "0.35",
  },
  summary: {
    total: 1,
    completed: 1,
    passed: 1,
    failed: 0,
    errors: 0,
    pending: 0,
    status: "completed",
    passRate: 1,
    evidenceRate: 1,
    factsRate: 1,
    p95LatencyMs: 250,
  },
  results: [
    {
      caseId: "case-1",
      testCase,
      status: "passed",
      reason: "All configured checks passed.",
      checks: [
        {
          key: "facts",
          label: "Expected facts",
          passed: true,
          detail: "Every expected phrase appears in the answer.",
        },
      ],
      output: {
        answer: "I am a Platform Engineer.",
        outcome: "knowledge",
        model: "test-model",
        retrievalMs: 30,
        generationMs: 220,
        latencyMs: 250,
        chunks: [
          {
            id: "chunk-1",
            sourceName: "Career profile",
            chunkIndex: 0,
            rank: 1,
            contextText: "Answer: Platform Engineer.",
          },
        ],
      },
    },
  ],
};
const pendingRun = {
  ...completeRun,
  summary: {
    ...completeRun.summary,
    completed: 0,
    passed: 0,
    pending: 1,
    status: "incomplete",
    passRate: null,
    factsRate: null,
    evidenceRate: null,
    p95LatencyMs: null,
  },
  results: [{ caseId: "case-1", testCase, status: "pending" }],
};

beforeEach(() => {
  jest.clearAllMocks();
  HTMLDialogElement.prototype.showModal = jest.fn(function showModal() {
    this.setAttribute("open", "");
  });
});
function mockLoad({ cases = [testCase], runs = [completeRun] } = {}) {
  evalRequest.mockImplementation(async (path) => {
    if (path === "/cases") return { cases };
    if (path === "/runs") return { runs };
    if (path.startsWith("/evidence")) return { chunks: [] };
    return { run: runs[0] };
  });
}

test("empty state shows no invented scores and explains how to begin", async () => {
  mockLoad({ cases: [], runs: [] });
  render(<AmiBotEvals />);
  await screen.findByRole("button", { name: "Create your first test" });
  expect(screen.getByRole("button", { name: "Run evaluation" })).toBeDisabled();
  expect(screen.queryByText("100%")).not.toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("button", { name: "Create your first test" }),
  );
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Save test case" })).toBeDisabled();
});
test("results show actual and reference answers, evidence, and useful filters", async () => {
  mockLoad();
  render(<AmiBotEvals />);
  await screen.findByText("I am a Platform Engineer.");
  expect(screen.getByText("Platform Engineer.")).toBeInTheDocument();
  expect(screen.getByText("Career profile")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Needs attention" }));
  expect(screen.getByText(/No cases match/)).toBeInTheDocument();
  expect(
    screen.queryByText("I am a Platform Engineer."),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
  expect(screen.getByText("I am a Platform Engineer.")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "How to read this" }));
  expect(screen.getByText(/not an AI judgment of meaning/)).toBeInTheDocument();
});
test("running a suite persists each case and updates the review", async () => {
  mockLoad({ runs: [] });
  evalRequest.mockImplementation(async (path, options) => {
    if (path === "/cases") return { cases: [testCase] };
    if (path === "/runs" && options?.method === "post")
      return { run: pendingRun };
    if (path === "/runs") return { runs: [] };
    if (path === "/runs/run-1/cases/case-1") return { run: completeRun };
    throw new Error(path);
  });
  render(<AmiBotEvals />);
  await screen.findByRole("button", { name: "Run your first evaluation" });
  fireEvent.click(screen.getByRole("button", { name: "Run evaluation" }));
  await screen.findByText(/Run complete/);
  expect(screen.getByText("I am a Platform Engineer.")).toBeInTheDocument();
  expect(evalRequest).toHaveBeenCalledWith("/runs/run-1/cases/case-1", {
    method: "post",
  });
});
test("pausing finishes the active case and leaves the rest resumable", async () => {
  const second = {
    ...pendingRun.results[0],
    caseId: "case-2",
    testCase: { ...testCase, _id: "case-2", title: "Second case" },
  };
  const two = {
    ...pendingRun,
    results: [...pendingRun.results, second],
    summary: { ...pendingRun.summary, total: 2, pending: 2 },
  };
  const partial = {
    ...two,
    results: [completeRun.results[0], second],
    summary: {
      ...completeRun.summary,
      total: 2,
      pending: 1,
      status: "incomplete",
    },
  };
  let finish;
  evalRequest.mockImplementation(async (path, options) => {
    if (path === "/cases") return { cases: [testCase, second.testCase] };
    if (path === "/runs" && options?.method === "post") return { run: two };
    if (path === "/runs") return { runs: [] };
    if (path.endsWith("/cases/case-1"))
      return new Promise((resolve) => {
        finish = resolve;
      });
    throw new Error(path);
  });
  render(<AmiBotEvals />);
  await screen.findByRole("button", { name: "Run your first evaluation" });
  fireEvent.click(screen.getByRole("button", { name: "Run evaluation" }));
  await waitFor(() => expect(finish).toBeDefined());
  fireEvent.click(screen.getByRole("button", { name: "Pause" }));
  await act(async () => finish({ run: partial }));
  expect(
    await screen.findByRole("button", { name: "Resume run" }),
  ).toBeEnabled();
  expect(
    evalRequest.mock.calls.some(([path]) => path.endsWith("/cases/case-2")),
  ).toBe(false);
});
test("a load failure is actionable and can be retried", async () => {
  evalRequest.mockRejectedValue(new Error("offline"));
  render(<AmiBotEvals />);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    /Could not reach evaluations/,
  );
  mockLoad({ cases: [], runs: [] });
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await screen.findByRole("button", { name: "Create your first test" });
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});
test("unknown case creation does not require fake evidence or facts", async () => {
  mockLoad({ cases: [], runs: [] });
  render(<AmiBotEvals />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Create your first test" }),
  );
  const dialog = within(screen.getByRole("dialog"));
  fireEvent.change(dialog.getByLabelText("Test name"), {
    target: { value: "Missing knowledge" },
  });
  fireEvent.change(dialog.getByLabelText("Question"), {
    target: { value: "What is the unpublished launch date?" },
  });
  fireEvent.change(dialog.getByLabelText("Expected behavior"), {
    target: { value: "unknown" },
  });
  fireEvent.click(dialog.getByRole("button", { name: "Save test case" }));
  await waitFor(() =>
    expect(evalRequest).toHaveBeenCalledWith(
      "/cases",
      expect.objectContaining({
        method: "post",
        data: expect.objectContaining({
          expectedOutcome: "unknown",
          expectedFacts: [],
          expectedChunkIds: [],
        }),
      }),
    ),
  );
});
test("comparisons require completed runs with the same cases and evaluator", () => {
  expect(
    compareRuns(completeRun, {
      ...completeRun,
      summary: { ...completeRun.summary, passRate: 0.5 },
    }),
  ).toBe(50);
  expect(compareRuns(completeRun, pendingRun)).toBeNull();
  expect(
    compareRuns(completeRun, { ...completeRun, suiteFingerprint: "different" }),
  ).toBeNull();
  expect(
    compareRuns(completeRun, { ...completeRun, evaluatorVersion: "v2" }),
  ).toBeNull();
});
