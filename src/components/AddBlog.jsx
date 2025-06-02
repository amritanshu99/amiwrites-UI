import React, { useState, useEffect } from "react";
import axios from "axios";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useNavigate } from "react-router-dom";

export default function AddBlog() {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const navigate = useNavigate();

  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-xl max-w-full focus:outline-none min-h-[350px] px-6 py-5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm transition-shadow duration-300 placeholder-gray-400 dark:placeholder-gray-600",
        placeholder: "Start writing your blog here...",
      },
    },
  });

  useEffect(() => {
      let link = document.querySelector("link[rel='canonical']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  link.href = window.location.href;
    document.title = "Add Blog";
  }, []);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!editor) return;

    const content = editor.getHTML();
    if (!content || content === "<p></p>") {
      setError("Content cannot be empty");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const token = localStorage.getItem("token");
    if (!token) {
      setError("You must be logged in to submit a blog");
      setLoading(false);
      return;
    }

    try {
      await axios.post(
        "https://amiwrites-backend-app-1.onrender.com/api/blogs",
        { title, content },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess("Blog submitted successfully!");
      setTitle("");
      editor.commands.clearContent();

      navigate("/blog");
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setTitle("");
    editor?.commands.clearContent();
    setError(null);
    setSuccess(null);
  };

  if (!editor) return null;

  const toolbarButtons = [
    { format: "bold", label: "B", title: "Bold" },
    { format: "italic", label: "I", title: "Italic" },
    { format: "underline", label: "U", title: "Underline" },
    { format: "heading", level: 1, label: "H1", title: "Heading 1" },
    { format: "heading", level: 2, label: "H2", title: "Heading 2" },
    { format: "bulletList", label: "• List", title: "Bullet List" },
    { format: "orderedList", label: "1. List", title: "Ordered List" },
    { format: "blockquote", label: '"', title: "Blockquote" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-300 via-pink-300 to-yellow-200 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full p-8 bg-white dark:bg-gray-900 rounded-xl shadow-lg">
        <h2 className="text-4xl font-serif font-semibold mb-8 text-gray-900 dark:text-gray-100">
          Create Blog
        </h2>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Blog Title"
          className="w-full mb-8 px-6 py-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-2xl font-semibold tracking-wide placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-4 focus:ring-blue-500 transition"
        />

        {/* Toolbar */}
        <div className="flex flex-wrap gap-3 mb-6">
          {toolbarButtons.map(({ format, label, title, level }) => {
            const isActive =
              format === "heading"
                ? editor.isActive(format, { level })
                : editor.isActive(format);
            return (
              <button
                key={`${format}${level || ""}`}
                type="button"
                title={title}
                onClick={() => {
                  editor.chain().focus();
                  if (format === "heading") {
                    editor.toggleHeading({ level }).run();
                  } else if (format === "bulletList") {
                    editor.toggleBulletList().run();
                  } else if (format === "orderedList") {
                    editor.toggleOrderedList().run();
                  } else if (format === "blockquote") {
                    editor.toggleBlockquote().run();
                  } else {
                    editor[
                      `toggle${format.charAt(0).toUpperCase() + format.slice(1)}`
                    ]().run();
                  }
                }}
                className={`px-4 py-2 rounded-lg border font-semibold transition 
                  ${
                    isActive
                      ? "bg-blue-600 border-blue-600 text-white shadow-md"
                      : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Editor */}
        <EditorContent editor={editor} />

        {error && (
          <p className="mt-6 text-red-600 dark:text-red-400 font-medium text-lg">
            {error}
          </p>
        )}
        {success && (
          <p className="mt-6 text-green-600 dark:text-green-400 font-medium text-lg">
            {success}
          </p>
        )}

        <div className="flex justify-end space-x-6 mt-10">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="px-10 py-3 rounded-lg bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-400 dark:hover:bg-gray-600 transition disabled:opacity-50 text-lg font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-10 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 text-lg font-semibold"
          >
            {loading ? "Submitting..." : "Add Blog"}
          </button>
        </div>
      </div>
    </div>
  );
}
