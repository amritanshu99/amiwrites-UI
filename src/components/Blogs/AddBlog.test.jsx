import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import AddBlog from "./AddBlog";
import { useEditor } from "@tiptap/react";
import { BLOG_DRAFT_KEY } from "../../hooks/useBlogDraft";

const mockNavigate = jest.fn();

jest.mock("axios", () => ({
  post: jest.fn(),
}));

jest.mock(
  "react-router-dom",
  () => ({
    useNavigate: () => mockNavigate,
  }),
  { virtual: true },
);

jest.mock("@tiptap/react", () => ({
  useEditor: jest.fn(),
  EditorContent: () => (
    <div role="textbox" aria-label="Blog content" data-testid="blog-editor" />
  ),
}));

const createEditor = ({ text = "", html = "<p></p>" } = {}) => {
  const chain = {};
  [
    "focus",
    "toggleBold",
    "toggleItalic",
    "toggleHeading",
    "setHeading",
    "setParagraph",
    "toggleCodeBlock",
    "toggleBulletList",
    "toggleOrderedList",
    "toggleBlockquote",
    "undo",
    "redo",
  ].forEach((command) => {
    chain[command] = jest.fn(() => chain);
  });
  chain.run = jest.fn(() => true);

  return {
    chain: jest.fn(() => chain),
    chainCommands: chain,
    commands: { clearContent: jest.fn(), focus: jest.fn() },
    can: () => ({ undo: () => true, redo: () => false }),
    setEditable: jest.fn(),
    getHTML: jest.fn(() => html),
    getText: jest.fn(() => text),
    isActive: jest.fn(() => false),
  };
};

beforeEach(() => {
  localStorage.clear();
  mockNavigate.mockReset();
  axios.post.mockReset();
  useEditor.mockReset();
});

test("renders an accessible editorial workspace and runs Tiptap formatting chains", () => {
  const editor = createEditor();
  useEditor.mockReturnValue(editor);

  render(<AddBlog />);

  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("A little thought.A new perspective.");
  expect(screen.getByLabelText("Blog title")).toBeInTheDocument();
  expect(screen.getByRole("toolbar", { name: "Blog formatting" })).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "Blog content" })).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Bold" }));

  expect(editor.chain).toHaveBeenCalled();
  expect(editor.chainCommands.focus).toHaveBeenCalled();
  expect(editor.chainCommands.toggleBold).toHaveBeenCalled();
  expect(editor.chainCommands.run).toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Redo" })).toBeDisabled();
});

test("rejects a visually empty article before making an API request", () => {
  const editor = createEditor({ text: "   ", html: "<p>   </p>" });
  useEditor.mockReturnValue(editor);

  render(<AddBlog />);
  fireEvent.change(screen.getByLabelText("Blog title"), {
    target: { value: "A useful title" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Publish blog" }));

  expect(screen.getByRole("alert")).toHaveTextContent(
    "Write some blog content before publishing.",
  );
  expect(axios.post).not.toHaveBeenCalled();
});

test("publishes the trimmed title and HTML with an inline progress indicator", async () => {
  const editor = createEditor({
    text: "A concise article",
    html: "<p>A concise article</p>",
  });
  let resolveRequest;
  axios.post.mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
  );
  useEditor.mockReturnValue(editor);
  localStorage.setItem("token", "admin-token");

  render(<AddBlog />);
  fireEvent.change(screen.getByLabelText("Blog title"), {
    target: { value: "  A useful title  " },
  });
  fireEvent.click(screen.getByRole("button", { name: "Publish blog" }));

  expect(await screen.findByRole("status", { name: "Publishing blog" })).toBeInTheDocument();
  expect(screen.getByLabelText("Blog title")).toBeDisabled();
  expect(editor.setEditable).toHaveBeenLastCalledWith(false, false);
  fireEvent.submit(screen.getByRole("form", { name: "Create blog" }));
  expect(axios.post).toHaveBeenCalledTimes(1);
  expect(axios.post).toHaveBeenCalledWith(
    expect.stringContaining("/api/blogs"),
    { title: "A useful title", content: "<p>A concise article</p>" },
    expect.objectContaining({
      headers: expect.objectContaining({ Authorization: "Bearer admin-token" }),
    }),
  );

  resolveRequest({ data: {} });
  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/blogs"));
  expect(localStorage.getItem(BLOG_DRAFT_KEY)).toBeNull();
});

test("restores a saved draft and previews sanitized article content without publishing", () => {
  localStorage.setItem(BLOG_DRAFT_KEY, JSON.stringify({ version: 1, title: "A saved thought", category: "Science", html: '<h2>Clear ideas</h2><p>A story worth reading.</p><img src="x" onerror="bad()"><script>bad()</script>' }));
  useEditor.mockReturnValue(createEditor({ text: "Clear ideas A story worth reading." }));
  render(<AddBlog />);
  expect(screen.getByLabelText("Blog title")).toHaveValue("A saved thought");
  expect(screen.getByLabelText(/Category/)).toHaveValue("Science");
  expect(screen.getByText(/Welcome back/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Preview" }));
  const preview = screen.getByRole("region", { name: "Article preview" });
  expect(preview).toHaveTextContent("Clear ideas");
  expect(preview.querySelector("script")).toBeNull();
  expect(preview.querySelector("img")).not.toHaveAttribute("onerror");
  expect(axios.post).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Write" }));
  expect(screen.getByLabelText("Blog title")).toHaveValue("A saved thought");
});

test("saves the latest title and body when leaving before the autosave timer fires", () => {
  const editor = createEditor({ text: "A draft to keep", html: "<p>A draft to keep</p>" });
  useEditor.mockReturnValue(editor);
  const { unmount } = render(<AddBlog />);
  fireEvent.change(screen.getByLabelText("Blog title"), { target: { value: "Keep this draft" } });
  act(() => useEditor.mock.calls[useEditor.mock.calls.length - 1][0].onUpdate({ editor }));
  unmount();
  expect(JSON.parse(localStorage.getItem(BLOG_DRAFT_KEY))).toEqual({ version: 1, title: "Keep this draft", category: "", html: "<p>A draft to keep</p>" });
});

test("publishes an optional category, clears the saved draft, and opens the published article", async () => {
  useEditor.mockReturnValue(createEditor({ text: "A short story", html: "<p>A short story</p>" }));
  localStorage.setItem("token", "admin-token");
  axios.post.mockResolvedValue({ data: { _id: "published-post" } });
  const { unmount } = render(<AddBlog />);
  fireEvent.change(screen.getByLabelText("Blog title"), { target: { value: "New story" } });
  fireEvent.change(screen.getByLabelText(/Category/), { target: { value: " Science " } });
  fireEvent.click(screen.getByRole("button", { name: "Publish blog" }));
  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/blogs/published-post"));
  expect(axios.post.mock.calls[0][1].category).toBe("Science");
  unmount();
  expect(localStorage.getItem(BLOG_DRAFT_KEY)).toBeNull();
});

test("failed publishing keeps the draft and enables another attempt", async () => {
  useEditor.mockReturnValue(createEditor({ text: "A short story", html: "<p>A short story</p>" }));
  localStorage.setItem("token", "admin-token");
  axios.post.mockRejectedValue(new Error("offline"));
  render(<AddBlog />);
  fireEvent.change(screen.getByLabelText("Blog title"), { target: { value: "Keep my work" } });
  fireEvent.click(screen.getByRole("button", { name: "Publish blog" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Your draft is still here");
  expect(screen.getByRole("button", { name: "Publish blog" })).toBeEnabled();
  expect(screen.getByLabelText("Blog title")).toHaveValue("Keep my work");
  expect(JSON.parse(localStorage.getItem(BLOG_DRAFT_KEY)).title).toBe("Keep my work");
  expect(mockNavigate).not.toHaveBeenCalled();
});

test("clear draft requires confirmation and clears the stored copy", () => {
  useEditor.mockReturnValue(createEditor());
  const confirm = jest.spyOn(window, "confirm").mockReturnValue(false);
  render(<AddBlog />);
  fireEvent.change(screen.getByLabelText("Blog title"), { target: { value: "Do not lose this" } });
  fireEvent.click(screen.getByRole("button", { name: "Clear draft" }));
  expect(screen.getByLabelText("Blog title")).toHaveValue("Do not lose this");
  confirm.mockReturnValue(true);
  fireEvent.click(screen.getByRole("button", { name: "Clear draft" }));
  expect(screen.getByLabelText("Blog title")).toHaveValue("");
  expect(localStorage.getItem(BLOG_DRAFT_KEY)).toBeNull();
  confirm.mockRestore();
});

test("validation returns from preview and focuses the missing title", () => {
  useEditor.mockReturnValue(createEditor());
  render(<AddBlog />);
  fireEvent.click(screen.getByRole("button", { name: "Preview" }));
  fireEvent.click(screen.getByRole("button", { name: "Publish blog" }));
  expect(screen.getByLabelText("Blog title")).toHaveFocus();
  expect(screen.getByLabelText("Blog title")).toHaveAttribute("aria-invalid", "true");
  expect(screen.getByRole("alert")).toHaveTextContent("Add a title");
});
