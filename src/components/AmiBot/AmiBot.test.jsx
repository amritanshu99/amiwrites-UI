import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import AmiBot from "./AmiBot";

jest.mock("react-markdown", () => ({
  __esModule: true,
  default: ({ children }) => {
    const text = Array.isArray(children) ? children.join("") : children || "";
    return text.replace(/\*\*(.*?)\*\*/g, "$1");
  },
}));

jest.mock("react-router-dom", () => ({
  useLocation: () => ({ pathname: "/amibot" }),
}), { virtual: true });

jest.mock("../../config/api", () => ({
  apiUrl: (path) => path,
}));

function renderAmiBot() {
  return render(<AmiBot />);
}

beforeEach(() => {
  localStorage.clear();
  global.fetch = jest.fn();
  window.scrollTo = jest.fn();
  window.requestAnimationFrame = (callback) => window.setTimeout(callback, 0);
  window.cancelAnimationFrame = (id) => window.clearTimeout(id);
  HTMLElement.prototype.scrollTo = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});

test("renders the AmiBot chat workspace and fills a prompt starter", async () => {
  renderAmiBot();

  const workspaceOverview = screen.getByRole("complementary", {
    name: /amibot workspace overview/i,
  });
  expect(workspaceOverview).toHaveAttribute("tabindex", "0");
  expect(workspaceOverview).toHaveClass(
    "h-full",
    "lg:overflow-y-auto"
  );

  expect(
    screen.getByRole("heading", { level: 1, name: "Knowledge chat" })
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: /amibot knowledge chat/i })
  ).toBeInTheDocument();
  expect(screen.getAllByText(/guest mode/i).length).toBeGreaterThan(0);

  const textbox = screen.getByRole("textbox", { name: /type your message/i });
  expect(textbox).toHaveAttribute("placeholder", "Ask about uploaded knowledge...");
  expect(screen.getByRole("button", { name: /send message/i })).toBeDisabled();
  expect(screen.getByRole("log")).toHaveClass("overscroll-y-auto");

  fireEvent.click(
    screen.getAllByRole("button", { name: /summarize the uploaded knowledge/i })[0]
  );

  await waitFor(() => {
    expect(textbox).toHaveValue("Summarize the uploaded knowledge");
  });
});

test("sends a message and renders a sourced markdown answer", async () => {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      response: "AmiBot answer from **knowledge**.",
      answeredFromKnowledge: true,
      sources: [{ sourceName: "Profile.pdf" }],
    }),
  });

  renderAmiBot();

  const textbox = screen.getByRole("textbox", { name: /type your message/i });
  fireEvent.change(textbox, {
    target: { value: "What skills are in the uploaded files?" },
  });
  fireEvent.click(screen.getByRole("button", { name: /send message/i }));

  expect(
    await screen.findByText("What skills are in the uploaded files?")
  ).toBeInTheDocument();
  expect(await screen.findByText("AmiBot answer from knowledge.")).toBeInTheDocument();
  expect(screen.getByText("Profile.pdf")).toBeInTheDocument();

  expect(global.fetch).toHaveBeenCalledWith(
    "/api/amibot",
    expect.objectContaining({
      method: "POST",
      signal: expect.any(AbortSignal),
    })
  );

  const requestBody = JSON.parse(global.fetch.mock.calls[0][1].body);
  expect(requestBody.query).toBe("What skills are in the uploaded files?");
  expect(requestBody.history).toEqual([]);
});

test("lets the user stop a slow response", async () => {
  global.fetch.mockImplementationOnce((url, options) =>
    new Promise((resolve, reject) => {
      options.signal.addEventListener("abort", () => {
        const error = new Error("Request aborted");
        error.name = "AbortError";
        reject(error);
      });
    })
  );

  renderAmiBot();

  fireEvent.change(screen.getByRole("textbox", { name: /type your message/i }), {
    target: { value: "Tell me about the projects" },
  });
  fireEvent.click(screen.getByRole("button", { name: /send message/i }));

  const stopButton = await screen.findByRole("button", { name: /stop response/i });
  fireEvent.click(stopButton);

  expect(await screen.findByText("Response stopped")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /send message/i })).toBeDisabled();
});

function signIn() {
  localStorage.setItem("token", `header.${btoa(JSON.stringify({ id: "reader" }))}.signature`);
}

test("stopping while the response body is loading preserves the stopped status", async () => {
  global.fetch.mockImplementationOnce(async (url, options) => ({
    ok: true,
    json: () => new Promise((resolve, reject) => {
      options.signal.addEventListener("abort", () => {
        const error = new Error("Body reading aborted");
        error.name = "AbortError";
        reject(error);
      });
    }),
  }));
  renderAmiBot();
  typeQuestion();
  fireEvent.click(screen.getByRole("button", { name: /send message/i }));
  const stopButton = await screen.findByRole("button", { name: /stop response/i });
  fireEvent.click(stopButton);
  expect(await screen.findByText("Response stopped")).toBeInTheDocument();
  expect(screen.queryByText(/could not answer right now/)).not.toBeInTheDocument();
});

function apiResponse(data, ok = true) {
  return { ok, json: async () => data };
}

function typeQuestion(text = "When will the next project launch?") {
  fireEvent.change(screen.getByRole("textbox", { name: /type your message/i }), {
    target: { value: text },
  });
}

test("an unknown guest question is displayed without a false source or admin badge", async () => {
  const response = "I do not have this answer in the uploaded AmiBot knowledge yet.";
  global.fetch.mockResolvedValueOnce(apiResponse({ response, answeredFromKnowledge: false, sources: [], pendingQuestionId: null }));
  renderAmiBot();
  typeQuestion();
  fireEvent.click(screen.getByRole("button", { name: /send message/i }));
  expect(await screen.findByText(response)).toBeInTheDocument();
  expect(screen.queryByText("Sent to admin")).not.toBeInTheDocument();
  expect(screen.queryByText("Knowledge", { exact: true })).not.toBeInTheDocument();
});

test("an unknown signed-in question shows its admin review confirmation", async () => {
  signIn();
  global.fetch.mockResolvedValueOnce(apiResponse({ messages: [] }));
  global.fetch.mockResolvedValueOnce(apiResponse({
    response: "I have sent your question to the admin for review.",
    answeredFromKnowledge: false, pendingQuestionId: "pending-1", sources: [],
  }));
  renderAmiBot();
  typeQuestion();
  await waitFor(() => expect(screen.getByRole("button", { name: /send message/i })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: /send message/i }));
  expect(await screen.findByText("Sent to admin")).toBeInTheDocument();
  expect(screen.queryByText("Knowledge", { exact: true })).not.toBeInTheDocument();
});

test("sending waits for history to load so a late history response cannot erase a new message", async () => {
  signIn();
  let resolveHistory;
  global.fetch.mockImplementationOnce(() => new Promise((resolve) => { resolveHistory = resolve; }));
  global.fetch.mockResolvedValueOnce(apiResponse({ response: "New answer" }));
  renderAmiBot();
  typeQuestion();
  const textbox = screen.getByRole("textbox", { name: /type your message/i });
  expect(screen.getByRole("button", { name: /send message/i })).toBeDisabled();
  fireEvent.submit(textbox.closest("form"));
  expect(global.fetch).toHaveBeenCalledTimes(1);

  await act(async () => resolveHistory(apiResponse({ messages: [{ sender: "bot", text: "Earlier answer" }] })));
  fireEvent.click(screen.getByRole("button", { name: /send message/i }));
  expect(await screen.findByText("New answer")).toBeInTheDocument();
  expect(screen.getByText("Earlier answer")).toBeInTheDocument();
});

test("sending waits for history clearing to finish", async () => {
  signIn();
  let resolveClear;
  global.fetch.mockResolvedValueOnce(apiResponse({ messages: [] }));
  global.fetch.mockImplementationOnce(() => new Promise((resolve) => { resolveClear = resolve; }));
  renderAmiBot();
  const clearButton = screen.getByRole("button", { name: /clear amibot history/i });
  await waitFor(() => expect(clearButton).toBeEnabled());
  fireEvent.click(clearButton);
  typeQuestion();
  expect(clearButton).toBeDisabled();
  expect(screen.getByRole("button", { name: /send message/i })).toBeDisabled();
  fireEvent.submit(screen.getByRole("textbox", { name: /type your message/i }).closest("form"));
  expect(global.fetch).toHaveBeenCalledTimes(2);
  await act(async () => resolveClear(apiResponse({ message: "Cleared" })));
  expect(screen.getByRole("button", { name: /send message/i })).toBeEnabled();
});

test("logging out prevents an old in-flight answer from entering the guest conversation", async () => {
  signIn();
  let resolveAnswer;
  global.fetch.mockResolvedValueOnce(apiResponse({ messages: [] }));
  global.fetch.mockImplementationOnce(() => new Promise((resolve) => { resolveAnswer = resolve; }));
  renderAmiBot();
  typeQuestion();
  await waitFor(() => expect(screen.getByRole("button", { name: /send message/i })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: /send message/i }));
  act(() => {
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("tokenChanged"));
  });
  await act(async () => resolveAnswer(apiResponse({ response: "Previous user's answer" })));
  expect(screen.queryByText("Previous user's answer")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /stop response/i })).not.toBeInTheDocument();
});

test("logging out during history clearing immediately unlocks guest chat", async () => {
  signIn();
  let resolveClear;
  global.fetch.mockResolvedValueOnce(apiResponse({ messages: [] }));
  global.fetch.mockImplementationOnce(() => new Promise((resolve) => { resolveClear = resolve; }));
  global.fetch.mockResolvedValueOnce(apiResponse({ response: "Guest answer" }));
  renderAmiBot();
  const clearButton = screen.getByRole("button", { name: /clear amibot history/i });
  await waitFor(() => expect(clearButton).toBeEnabled());
  fireEvent.click(clearButton);
  act(() => {
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("tokenChanged"));
  });
  typeQuestion();
  expect(screen.getByRole("button", { name: /send message/i })).toBeEnabled();
  fireEvent.click(screen.getByRole("button", { name: /send message/i }));
  expect(await screen.findByText("Guest answer")).toBeInTheDocument();
  await act(async () => resolveClear(apiResponse({ message: "Cleared" })));
  expect(screen.getByText("Guest answer")).toBeInTheDocument();
});

test.each([
  ["non-JSON error", { ok: false, json: async () => { throw new SyntaxError("Unexpected token <"); } }, "AmiBot could not answer right now. Please try again."],
  ["null response", apiResponse(null), "AmiBot could not answer right now. Please try again."],
  ["empty answer", apiResponse({ response: "  " }), "AmiBot returned an empty answer. Please try again."],
  ["non-text answer", apiResponse({ response: { text: "invalid" } }), "AmiBot returned an empty answer. Please try again."],
])("recovers from a %s and excludes the error from subsequent model context", async (name, response, errorMessage) => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  global.fetch.mockResolvedValueOnce(response);
  global.fetch.mockResolvedValueOnce(apiResponse({ response: "Recovered answer" }));
  renderAmiBot();
  typeQuestion();
  fireEvent.click(screen.getByRole("button", { name: /send message/i }));
  expect(await screen.findByText(errorMessage)).toBeInTheDocument();
  typeQuestion("Try again");
  fireEvent.click(screen.getByRole("button", { name: /send message/i }));
  expect(await screen.findByText("Recovered answer")).toBeInTheDocument();
  const request = JSON.parse(global.fetch.mock.calls[1][1].body);
  expect(request.history.some((message) => message.text === errorMessage)).toBe(false);
});
