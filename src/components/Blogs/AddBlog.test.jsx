import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import axios from "axios";
import AddBlog from "./AddBlog";
import { useEditor } from "@tiptap/react";

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
    commands: { clearContent: jest.fn() },
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

  expect(screen.getByRole("heading", { name: "Create a new story" })).toBeInTheDocument();
  expect(screen.getByLabelText("Blog title")).toBeInTheDocument();
  expect(screen.getByRole("toolbar", { name: "Blog formatting" })).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "Blog content" })).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Bold" }));

  expect(editor.chain).toHaveBeenCalled();
  expect(editor.chainCommands.focus).toHaveBeenCalled();
  expect(editor.chainCommands.toggleBold).toHaveBeenCalled();
  expect(editor.chainCommands.run).toHaveBeenCalled();
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
  expect(axios.post).toHaveBeenCalledWith(
    expect.stringContaining("/api/blogs"),
    { title: "A useful title", content: "<p>A concise article</p>" },
    expect.objectContaining({
      headers: expect.objectContaining({ Authorization: "Bearer admin-token" }),
    }),
  );

  resolveRequest({ data: {} });
  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/blogs"));
});
