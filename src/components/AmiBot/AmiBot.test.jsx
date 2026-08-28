import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
