import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Bold, BookOpen, Check, CheckCircle2, Code2, Eye, Italic, List, ListOrdered, PenLine, Quote, Redo2, RotateCcw, Send, Undo2 } from "lucide-react";
import Loader from "../Loader/Loader";
import { apiUrl } from "../../config/api";
import { sanitizeBlogHtml } from "../../utils/sanitizeHtml";
import { useBlogDraft } from "../../hooks/useBlogDraft";
import "./blogs.css";
import "./blogComposer.css";

const countWords = (text) => text.trim().split(/\s+/).filter(Boolean).length;
const saveLabels = { empty: "Your next story starts here", saving: "Saving draft…", saved: "Draft saved on this browser", unavailable: "Draft saving unavailable — keep this page open" };

function ChecklistItem({ complete, children }) {
  return <li className={complete ? "is-complete" : ""}>
    <span aria-hidden="true">{complete ? <Check size={13} /> : null}</span>
    <span className="sr-only">{complete ? "Complete: " : "Still needed: "}</span>{children}
  </li>;
}

export default function AddBlog() {
  const { draft, setDraft, saveStatus, restored, saveNow, discard, finishPublishing } = useBlogDraft();
  const [view, setView] = useState("write");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [invalidField, setInvalidField] = useState("");
  const publishing = useRef(false);
  const titleRef = useRef(null);
  const navigate = useNavigate();
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] } })],
    content: draft.html,
    editorProps: { attributes: {
      class: "blog-content composer-prose",
      role: "textbox",
      "aria-label": "Blog content",
      "aria-multiline": "true",
      "aria-invalid": invalidField === "content" ? "true" : "false",
      "aria-describedby": invalidField === "content" ? "blog-editor-help create-blog-error" : "blog-editor-help",
    } },
    onUpdate: ({ editor: activeEditor }) => {
      setDraft((previous) => ({ ...previous, html: activeEditor.getHTML(), text: activeEditor.getText() }));
      setInvalidField("");
      setError("");
    },
  });

  useEffect(() => { editor?.setEditable(!loading, false); }, [editor, loading]);
  useEffect(() => {
    if (invalidField === "title") titleRef.current?.focus();
    if (invalidField === "content") editor?.commands.focus();
  }, [invalidField, view, editor]);

  const words = countWords(draft.text);
  const minutes = Math.max(1, Math.ceil(words / 220));
  const titleReady = Boolean(draft.title.trim());
  const contentReady = Boolean(draft.text.trim());
  const previewHtml = useMemo(() => sanitizeBlogHtml(draft.html), [draft.html]);

  const leaveEditor = () => {
    if (publishing.current) return;
    if (saveNow() === "unavailable" && (titleReady || contentReady) &&
        !window.confirm("Your draft could not be saved. Leave this page and lose your changes?")) return;
    navigate("/blogs");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (publishing.current) return;
    if (!draft.title.trim() || !editor?.getText().trim()) {
      const field = draft.title.trim() ? "content" : "title";
      setView("write");
      setInvalidField(field);
      setError(field === "title" ? "Add a title before publishing." : "Write some blog content before publishing.");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) { setError("You must be logged in to publish a blog. Your draft is kept on this browser."); return; }
    publishing.current = true;
    setLoading(true);
    setError("");
    setInvalidField("");
    saveNow();
    try {
      const { data } = await axios.post(apiUrl("/api/blogs"), {
        title: draft.title.trim(), content: editor.getHTML(),
        ...(draft.category.trim() ? { category: draft.category.trim() } : {}),
      }, { headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } });
      finishPublishing();
      navigate(data?._id ? `/blogs/${data._id}` : "/blogs");
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || "We couldn’t publish your story. Your draft is still here — please try again.");
    } finally {
      publishing.current = false;
      setLoading(false);
    }
  };

  const clearDraft = () => {
    if (publishing.current || !window.confirm("Clear the title, category and story from this browser? This cannot be undone.")) return;
    editor?.commands.clearContent();
    discard();
    setView("write");
    setError("");
    setInvalidField("");
    titleRef.current?.focus();
  };

  const tools = editor ? [
    { label: "Bold", shortcut: "Ctrl/⌘ B", icon: Bold, active: editor.isActive("bold"), run: () => editor.chain().focus().toggleBold().run() },
    { label: "Italic", shortcut: "Ctrl/⌘ I", icon: Italic, active: editor.isActive("italic"), run: () => editor.chain().focus().toggleItalic().run() },
    { label: "Bullet list", icon: List, active: editor.isActive("bulletList"), run: () => editor.chain().focus().toggleBulletList().run() },
    { label: "Numbered list", icon: ListOrdered, active: editor.isActive("orderedList"), run: () => editor.chain().focus().toggleOrderedList().run() },
    { label: "Blockquote", icon: Quote, active: editor.isActive("blockquote"), run: () => editor.chain().focus().toggleBlockquote().run() },
    { label: "Code block", icon: Code2, active: editor.isActive("codeBlock"), run: () => editor.chain().focus().toggleCodeBlock().run() },
    { label: "Undo", icon: Undo2, disabled: !editor.can().undo(), run: () => editor.chain().focus().undo().run() },
    { label: "Redo", icon: Redo2, disabled: !editor.can().redo(), run: () => editor.chain().focus().redo().run() },
  ] : [];

  return <section className="journal-page journal-composer">
    <div className="journal-shell">
      <nav className="composer-topbar" aria-label="Editor navigation">
        <button className="composer-back" type="button" onClick={leaveEditor} disabled={loading}><ArrowLeft size={16} aria-hidden="true" /> Back to blogs</button>
        <span className={`composer-save composer-save--${saveStatus}`} role="status">{saveStatus === "saved" && <CheckCircle2 size={14} aria-hidden="true" />}{saveLabels[saveStatus]}</span>
      </nav>
      <header className="composer-header">
        <div><p className="journal-kicker"><span /> THE AMIVERSE JOURNAL · EDITOR</p><h1>A little thought.<br /><em>A new perspective.</em></h1></div>
        <p>{restored ? "Welcome back. Your saved draft is ready to pick up where you left off." : "Give your idea room to grow. Write, preview, and share it when you’re ready."}</p>
      </header>

      <form onSubmit={handleSubmit} noValidate className="composer-layout" aria-label="Create blog" aria-busy={loading}>
        <div className="composer-workspace">
          <div className="composer-workspace-bar">
            <div className="composer-view-switch" role="group" aria-label="Editor view">
              <button type="button" aria-pressed={view === "write"} onClick={() => setView("write")}><PenLine size={15} aria-hidden="true" /> Write</button>
              <button type="button" aria-pressed={view === "preview"} onClick={() => setView("preview")}><Eye size={15} aria-hidden="true" /> Preview</button>
            </div>
            <span className="composer-word-count">{words.toLocaleString()} {words === 1 ? "word" : "words"}<span aria-hidden="true"> · </span>{words ? `${minutes} min read` : "Just getting started"}</span>
          </div>

          <div hidden={view !== "write"}>
            <div className="composer-title-field">
              <label htmlFor="blog-title">Blog title</label>
              <textarea ref={titleRef} id="blog-title" rows={2} value={draft.title} disabled={loading}
                onChange={(event) => { setDraft((previous) => ({ ...previous, title: event.target.value })); setError(""); setInvalidField(""); }}
                placeholder="Every good story starts with a title…" aria-invalid={invalidField === "title"}
                aria-describedby={invalidField === "title" ? "create-blog-error" : undefined} />
            </div>
            <div className="composer-toolbar" role="toolbar" aria-label="Blog formatting">
              <select aria-label="Text style" disabled={!editor || loading}
                value={editor?.isActive("heading", { level: 2 }) ? "2" : editor?.isActive("heading", { level: 3 }) ? "3" : "paragraph"}
                onChange={(event) => event.target.value === "paragraph" ? editor.chain().focus().setParagraph().run() : editor.chain().focus().setHeading({ level: Number(event.target.value) }).run()}>
                <option value="paragraph">Paragraph</option><option value="2">Heading</option><option value="3">Subheading</option>
              </select>
              <span className="composer-toolbar-divider" aria-hidden="true" />
              {tools.map(({ label, shortcut, icon: Icon, active, run, disabled }) => <button key={label} type="button"
                aria-label={label} title={`${label}${shortcut ? ` (${shortcut})` : ""}`} aria-pressed={active}
                onClick={run} disabled={loading || disabled}><Icon size={17} aria-hidden="true" /></button>)}
            </div>
            <div className={`composer-editor-body journal-reading-main${invalidField === "content" ? " composer-editor-body--invalid" : ""}`}>
              {editor ? <>
                {!contentReady && <p className="composer-placeholder" aria-hidden="true">Start with the thought you can’t stop thinking about…</p>}
                <EditorContent editor={editor} />
              </> : <p className="composer-editor-loading" role="status">Preparing your writing space…</p>}
            </div>
            <p className="composer-editor-help" id="blog-editor-help">Make it easy to follow. Break up your story with headings, lists, and a little breathing room.</p>
          </div>

          {view === "preview" && <section className="composer-preview" aria-label="Article preview">
            <p className="composer-preview-note"><Eye size={14} aria-hidden="true" /> Reader preview · Not published</p>
            <span className="journal-category">{draft.category.trim() || "Perspectives"}</span>
            <h2>{draft.title.trim() || "Your story title"}</h2>
            <p className="composer-preview-byline">Amritanshu Mishra <span aria-hidden="true">·</span> {minutes} min read</p>
            {contentReady ? <div className="journal-reading-main"><div className="blog-content" dangerouslySetInnerHTML={{ __html: previewHtml }} /></div>
              : <div className="composer-preview-empty"><BookOpen size={28} aria-hidden="true" /><p>Your story will take shape here.</p><button className="journal-button" type="button" onClick={() => setView("write")}>Start writing <ArrowUpRight size={15} aria-hidden="true" /></button></div>}
          </section>}
        </div>

        <aside className="composer-sidebar" aria-label="Publishing settings">
          <div className="composer-publish-card">
            <p className="journal-kicker">THE FINISHING TOUCHES</p><h2>Ready when you are.</h2>
            <p className="composer-sidebar-intro">Your story goes live as soon as you publish.</p>
            <label htmlFor="blog-category">Category <span>optional</span></label>
            <input id="blog-category" value={draft.category} maxLength={60} disabled={loading} placeholder="e.g. Technology" list="blog-category-options"
              onChange={(event) => setDraft((previous) => ({ ...previous, category: event.target.value }))} />
            <datalist id="blog-category-options"><option value="Technology" /><option value="Artificial Intelligence" /><option value="Science" /><option value="Software Engineering" /><option value="Perspectives" /></datalist>
            <ul className="composer-checklist"><ChecklistItem complete={titleReady}>A title to draw readers in</ChecklistItem><ChecklistItem complete={contentReady}>A story worth sharing</ChecklistItem></ul>
            {error && <p id="create-blog-error" className="composer-error" role="alert">{error}</p>}
            <button className="journal-button journal-button--primary composer-publish" type="submit" disabled={loading || !editor}>
              {loading ? <><Loader size="small" fullscreen={false} label="Publishing blog" /> Publishing…</> : <><Send size={16} aria-hidden="true" /> Publish blog</>}
            </button>
            <p className="composer-local-note">Drafts stay on this browser until you publish or clear them.</p>
            <button className="composer-clear" type="button" onClick={clearDraft} disabled={loading || (!titleReady && !contentReady && !draft.category)}><RotateCcw size={14} aria-hidden="true" /> Clear draft</button>
          </div>
          <div className="composer-writing-note"><PenLine size={18} aria-hidden="true" /><p><strong>A small writing tip</strong>Write like you’re explaining it to one curious person. You can polish the details in Preview.</p></div>
        </aside>
      </form>
    </div>
  </section>;
}
