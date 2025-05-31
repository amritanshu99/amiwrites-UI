import React, { useState } from "react";
import axios from "axios";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

export default function AddBlog() {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const editor = useEditor({
    extensions: [StarterKit],
    content: "<p>Start writing your blog here...</p>",
  });

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!editor) return;

    const content = editor.getHTML();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const token = localStorage.getItem("token"); // get token from localStorage
    if (!token) {
      setError("You must be logged in to submit a blog");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        "https://amiwrites-backend-app-1.onrender.com/api/blogs",
        { title, content },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,  // <-- JWT token in header
          },
        }
      );

      setSuccess("Blog submitted successfully!");
      setTitle("");
      editor.commands.clearContent();
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

  return (
    <div className="max-w-4xl mx-auto mt-12 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-3xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
        Create Blog
      </h2>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Blog Title"
        className="w-full mb-6 px-6 py-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xl focus:outline-none focus:ring-4 focus:ring-blue-500"
      />

      {/* Toolbar */}
      <div className="mb-4 space-x-3">
        {[
          { format: "bold", label: "B" },
          { format: "italic", label: "I" },
          { format: "underline", label: "U" },
        ].map(({ format, label }) => (
          <button
            key={format}
            type="button"
            onClick={() =>
              editor
                .chain()
                .focus()
                [`toggle${format.charAt(0).toUpperCase() + format.slice(1)}`]()
                .run()
            }
            className={`px-4 py-2 rounded border text-2xl font-bold ${
              editor.isActive(format)
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
            }`}
            aria-label={format}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Editor */}
      <div className="border border-gray-300 dark:border-gray-600 rounded-md p-6 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 min-h-[300px] text-lg">
        <EditorContent editor={editor} />
      </div>

      {error && (
        <p className="mt-4 text-red-600 dark:text-red-400 font-medium text-lg">{error}</p>
      )}
      {success && (
        <p className="mt-4 text-green-600 dark:text-green-400 font-medium text-lg">{success}</p>
      )}

      <div className="flex justify-end space-x-6 mt-8">
        <button
          onClick={handleCancel}
          disabled={loading}
          className="px-8 py-3 rounded-md bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-100 hover:bg-gray-400 dark:hover:bg-gray-500 transition disabled:opacity-50 text-lg font-semibold"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-8 py-3 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 text-lg font-semibold"
        >
          {loading ? "Submitting..." : "Add Blog"}
        </button>
      </div>
    </div>
  );
}
