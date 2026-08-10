import React, { useState } from "react";
import axios from "axios";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bold,
  Check,
  FilePenLine,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo2,
  RotateCcw,
  Send,
  Sparkles,
  Undo2,
} from "lucide-react";
import Loader from "../Loader/Loader";
import { apiUrl } from "../../config/api";

const getWordCount = (value) => {
  const normalized = value.trim();
  return normalized ? normalized.split(/\s+/).length : 0;
};

const ChecklistItem = ({ complete, children }) => (
  <li className="flex items-center gap-3 text-sm text-slate-600 dark:text-zinc-300">
    <span
      aria-hidden="true"
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
        complete
          ? "border-emerald-500/25 bg-emerald-500/[0.12] text-emerald-600 dark:text-emerald-300"
          : "border-slate-300 bg-white/60 text-slate-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-500"
      }`}
    >
      {complete ? <Check className="h-3.5 w-3.5" strokeWidth={2.7} /> : null}
    </span>
    {children}
  </li>
);

export default function AddBlog() {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [wordCount, setWordCount] = useState(0);
  const [isEditorEmpty, setIsEditorEmpty] = useState(true);
  const navigate = useNavigate();

  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    editorProps: {
      attributes: {
        class: "blog-editor-content__surface",
        role: "textbox",
        "aria-label": "Blog content",
        "aria-multiline": "true",
        "aria-describedby": "blog-editor-help",
      },
    },
    onUpdate: ({ editor: activeEditor }) => {
      const text = activeEditor.getText();
      setWordCount(getWordCount(text));
      setIsEditorEmpty(!text.trim());
    },
  });

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!title.trim()) {
      setError("Add a title before publishing.");
      return;
    }

    if (!editor || !editor.getText().trim()) {
      setError("Write some blog content before publishing.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setError("You must be logged in to publish a blog.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await axios.post(
        apiUrl("/api/blogs"),
        { title: title.trim(), content: editor.getHTML() },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      navigate("/blogs");
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.message ||
          "The blog could not be published. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    const hasDraft = Boolean(title.trim()) || Boolean(editor?.getText().trim());
    if (hasDraft && !window.confirm("Clear this draft? This cannot be undone.")) return;

    setTitle("");
    editor?.commands.clearContent();
    setWordCount(0);
    setIsEditorEmpty(true);
    setError(null);
  };

  const titleIsReady = Boolean(title.trim());
  const contentIsReady = Boolean(editor?.getText().trim());

  const toolbarButtons = editor
    ? [
        {
          key: "bold",
          label: "Bold",
          icon: Bold,
          isActive: () => editor.isActive("bold"),
          run: () => editor.chain().focus().toggleBold().run(),
        },
        {
          key: "italic",
          label: "Italic",
          icon: Italic,
          isActive: () => editor.isActive("italic"),
          run: () => editor.chain().focus().toggleItalic().run(),
        },
        {
          key: "heading-1",
          label: "Heading 1",
          icon: Heading1,
          isActive: () => editor.isActive("heading", { level: 1 }),
          run: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
        },
        {
          key: "heading-2",
          label: "Heading 2",
          icon: Heading2,
          isActive: () => editor.isActive("heading", { level: 2 }),
          run: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        },
        {
          key: "bullet-list",
          label: "Bullet list",
          icon: List,
          isActive: () => editor.isActive("bulletList"),
          run: () => editor.chain().focus().toggleBulletList().run(),
        },
        {
          key: "ordered-list",
          label: "Numbered list",
          icon: ListOrdered,
          isActive: () => editor.isActive("orderedList"),
          run: () => editor.chain().focus().toggleOrderedList().run(),
        },
        {
          key: "blockquote",
          label: "Blockquote",
          icon: Quote,
          isActive: () => editor.isActive("blockquote"),
          run: () => editor.chain().focus().toggleBlockquote().run(),
        },
        {
          key: "undo",
          label: "Undo",
          icon: Undo2,
          run: () => editor.chain().focus().undo().run(),
        },
        {
          key: "redo",
          label: "Redo",
          icon: Redo2,
          run: () => editor.chain().focus().redo().run(),
        },
      ]
    : [];

  return (
    <section className="amiverse-premium-light-page relative min-h-[calc(100svh-4rem)] overflow-hidden bg-slate-100 text-slate-950 transition-colors dark:bg-black dark:text-white">
      <div
        aria-hidden="true"
        className="amiverse-premium-light-overlay pointer-events-none absolute inset-0 dark:bg-[radial-gradient(circle_at_16%_0%,rgba(14,165,233,0.12),transparent_30%),radial-gradient(circle_at_88%_12%,rgba(99,102,241,0.10),transparent_32%)]"
      />

      <div className="relative mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-9 lg:px-8 lg:py-12">
        <header className="mb-6 overflow-hidden rounded-3xl border border-white/[0.65] bg-white/[0.72] p-5 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-950/[0.72] dark:shadow-[0_24px_70px_rgba(0,0,0,0.48)] sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-cyan-200 shadow-[0_14px_30px_rgba(15,23,42,0.18)] dark:bg-white dark:text-slate-950">
                <FilePenLine className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.24em] text-sky-700 dark:text-cyan-300">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  Editorial studio
                </p>
                <h1 className="mt-2 font-cinzel text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl lg:text-4xl">
                  Create a new story
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-zinc-400 sm:text-base">
                  Shape the draft, add structure, and publish it to AmiVerse when it is ready.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/blogs")}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-300/80 bg-white/75 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-sky-400 hover:text-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300/35 dark:border-white/10 dark:bg-white/[0.05] dark:text-zinc-200 dark:hover:border-cyan-300/40 dark:hover:text-cyan-200"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to blogs
            </button>
          </div>
        </header>

        <form
          id="create-blog-form"
          onSubmit={handleSubmit}
          className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]"
        >
          <div className="min-w-0 overflow-hidden rounded-3xl border border-white/70 bg-white/[0.82] shadow-[0_24px_70px_rgba(15,23,42,0.11)] backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-950/[0.82] dark:shadow-[0_24px_70px_rgba(0,0,0,0.52)]">
            <div className="border-b border-slate-200/80 p-5 dark:border-white/10 sm:p-7">
              <div className="flex items-end justify-between gap-4">
                <label
                  htmlFor="blog-title"
                  className="text-sm font-bold text-slate-800 dark:text-zinc-100"
                >
                  Blog title
                </label>
                <span
                  id="blog-title-count"
                  className="text-xs font-medium tabular-nums text-slate-400 dark:text-zinc-500"
                >
                  {title.length} characters
                </span>
              </div>
              <input
                id="blog-title"
                type="text"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  if (error) setError(null);
                }}
                placeholder="Give your story a clear, memorable title"
                aria-describedby={`blog-title-count${error ? " create-blog-error" : ""}`}
                className="mt-3 w-full rounded-2xl border border-slate-300/80 bg-white/80 px-4 py-3.5 text-lg font-semibold text-slate-950 shadow-inner shadow-slate-900/[0.03] outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-300/25 dark:border-white/10 dark:bg-black/35 dark:text-white dark:placeholder:text-zinc-600 dark:focus:border-cyan-300/60 dark:focus:ring-cyan-300/10 sm:px-5 sm:text-xl"
              />
            </div>

            <div
              role="toolbar"
              aria-label="Blog formatting"
              className="sticky top-0 z-10 flex items-center gap-1 overflow-x-auto border-b border-slate-200/80 bg-white/90 px-3 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/90 sm:px-5"
            >
              {editor ? (
                toolbarButtons.map(({ key, label, icon: Icon, isActive, run }) => {
                  const active = isActive?.() || false;
                  return (
                    <button
                      key={key}
                      type="button"
                      title={label}
                      aria-label={label}
                      aria-pressed={isActive ? active : undefined}
                      onClick={run}
                      disabled={loading}
                      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300/30 disabled:cursor-not-allowed disabled:opacity-45 dark:focus-visible:ring-cyan-300/15 ${
                        active
                          ? "border-sky-500 bg-sky-500 text-white shadow-[0_8px_18px_rgba(14,165,233,0.22)] dark:border-cyan-300 dark:bg-cyan-300 dark:text-slate-950"
                          : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-950 dark:text-zinc-400 dark:hover:border-white/10 dark:hover:bg-white/[0.07] dark:hover:text-white"
                      }`}
                    >
                      <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                    </button>
                  );
                })
              ) : (
                <div className="flex gap-2" aria-label="Loading editor toolbar">
                  {[0, 1, 2, 3, 4].map((item) => (
                    <span
                      key={item}
                      className="h-10 w-10 animate-pulse rounded-xl bg-slate-200/80 dark:bg-white/[0.07]"
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="relative min-h-[25rem] bg-white/[0.45] dark:bg-black/20">
              {editor ? (
                <>
                  {isEditorEmpty ? (
                    <p
                      aria-hidden="true"
                      className="pointer-events-none absolute left-5 top-5 z-[1] text-base text-slate-400 dark:text-zinc-600 sm:left-7 sm:top-7"
                    >
                      Start writing your blog here…
                    </p>
                  ) : null}
                  <EditorContent editor={editor} className="blog-editor-content" />
                </>
              ) : (
                <div className="space-y-4 p-5 sm:p-7" aria-label="Loading blog editor">
                  <div className="h-4 w-4/5 animate-pulse rounded bg-slate-200 dark:bg-white/[0.08]" />
                  <div className="h-4 w-full animate-pulse rounded bg-slate-200 dark:bg-white/[0.08]" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-white/[0.08]" />
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 bg-slate-50/75 px-5 py-3.5 text-xs font-medium text-slate-500 dark:border-white/10 dark:bg-white/[0.025] dark:text-zinc-500 sm:px-7">
              <p id="blog-editor-help">Use headings and lists to keep the article easy to scan.</p>
              <p className="tabular-nums">{wordCount} {wordCount === 1 ? "word" : "words"}</p>
            </div>
          </div>

          <aside className="rounded-3xl border border-white/70 bg-white/[0.78] p-5 shadow-[0_22px_60px_rgba(15,23,42,0.10)] backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-950/[0.78] dark:shadow-[0_22px_60px_rgba(0,0,0,0.48)] lg:sticky lg:top-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-zinc-500">
                  Draft status
                </p>
                <p className="mt-1 text-base font-bold text-slate-900 dark:text-white">Not published</p>
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-[0_0_14px_rgba(251,191,36,0.55)]" aria-hidden="true" />
            </div>

            <ul className="mt-5 space-y-3 border-y border-slate-200/80 py-5 dark:border-white/10">
              <ChecklistItem complete={titleIsReady}>Title added</ChecklistItem>
              <ChecklistItem complete={contentIsReady}>Story written</ChecklistItem>
              <ChecklistItem complete>Admin access verified</ChecklistItem>
            </ul>

            {error ? (
              <p
                id="create-blog-error"
                role="alert"
                className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium leading-5 text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/[0.08] dark:text-rose-200"
              >
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading || !editor}
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(15,23,42,0.22)] transition hover:-translate-y-0.5 hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300/35 disabled:cursor-not-allowed disabled:opacity-55 dark:bg-cyan-300 dark:text-slate-950 dark:hover:bg-cyan-200 dark:focus-visible:ring-cyan-300/20"
            >
              {loading ? (
                <>
                  <Loader size="small" fullscreen={false} label="Publishing blog" />
                  Publishing…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" aria-hidden="true" />
                  Publish blog
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate("/blogs")}
              disabled={loading}
              className="mt-2.5 inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-slate-300/80 bg-white/70 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-sky-400 hover:text-sky-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-300/30 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-zinc-300 dark:hover:border-cyan-300/35 dark:hover:text-cyan-200"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleClear}
              disabled={loading || (!title.trim() && !contentIsReady)}
              className="mt-2.5 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 transition hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-200/50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-zinc-500 dark:hover:bg-rose-400/[0.08] dark:hover:text-rose-200 dark:focus-visible:ring-rose-400/15"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Clear draft
            </button>
          </aside>
        </form>
      </div>
    </section>
  );
}
