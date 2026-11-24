import React, { useEffect, useRef, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { evalError, evalRequest } from "./evalApi";

const emptyCase = {
  title: "",
  query: "",
  category: "General",
  expectedOutcome: "knowledge",
  referenceAnswer: "",
  expectedFacts: [],
  expectedChunkIds: [],
  history: [],
};

export default function EvalCaseEditor({ initial, onClose, onSaved }) {
  const [draft, setDraft] = useState(() => ({ ...emptyCase, ...initial }));
  const [facts, setFacts] = useState(() =>
    (initial?.expectedFacts || []).join("\n"),
  );
  const [query, setQuery] = useState("");
  const [chunks, setChunks] = useState([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const dialogRef = useRef(null);
  const titleRef = useRef(null);
  const change = (name, value) =>
    setDraft((previous) => ({ ...previous, [name]: value }));

  useEffect(() => {
    const previous = document.activeElement;
    const dialog = dialogRef.current;
    dialog.showModal();
    titleRef.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);

  useEffect(() => {
    if (draft.expectedOutcome !== "knowledge") return undefined;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await evalRequest(
          `/evidence?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        setChunks(data.chunks);
      } catch (err) {
        if (!controller.signal.aborted) setError(evalError(err));
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, draft.expectedOutcome]);

  const save = async (event) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...draft,
        expectedFacts:
          draft.expectedOutcome === "unknown"
            ? []
            : facts
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean),
        expectedChunkIds:
          draft.expectedOutcome === "knowledge" ? draft.expectedChunkIds : [],
      };
      await evalRequest(`/cases${initial?._id ? `/${initial._id}` : ""}`, {
        method: initial?._id ? "put" : "post",
        data: payload,
      });
      await onSaved();
    } catch (err) {
      setError(evalError(err));
      setSaving(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="eval-dialog"
      aria-labelledby="eval-editor-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!saving) onClose();
      }}
    >
      <form onSubmit={save}>
        <header className="eval-dialog-head">
          <div>
            <span className="eval-eyebrow">TEST DESIGN</span>
            <h2 id="eval-editor-title">
              {initial?._id
                ? "Edit test case"
                : "What should AmiBot get right?"}
            </h2>
            <p>A good test pairs a real question with a clear expectation.</p>
          </div>
          <button
            type="button"
            className="eval-icon-button"
            aria-label="Close test editor"
            disabled={saving}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        <div className="eval-dialog-body">
          {error ? (
            <div role="alert" className="eval-alert">
              {error}
            </div>
          ) : null}
          <div className="eval-form-grid">
            <label>
              Test name
              <input
                ref={titleRef}
                required
                maxLength={120}
                value={draft.title}
                onChange={(e) => change("title", e.target.value)}
                placeholder="Current role, phrased naturally"
              />
            </label>
            <label>
              Category
              <input
                required
                maxLength={60}
                value={draft.category}
                onChange={(e) => change("category", e.target.value)}
                placeholder="Career, follow-ups, unknowns…"
              />
            </label>
          </div>
          <label>
            Question
            <textarea
              required
              maxLength={4000}
              rows={2}
              value={draft.query}
              onChange={(e) => change("query", e.target.value)}
              placeholder="What would a visitor ask?"
            />
          </label>
          <label>
            Expected behavior
            <select
              value={draft.expectedOutcome}
              onChange={(e) => change("expectedOutcome", e.target.value)}
            >
              <option value="knowledge">Answer from knowledge</option>
              <option value="unknown">Say the answer is unknown</option>
              <option value="direct">Give a casual reply (e.g. hello)</option>
            </select>
          </label>
          {draft.expectedOutcome !== "unknown" ? (
            <>
              <label>
                Reference answer{" "}
                <span className="eval-optional">
                  optional · for human review
                </span>
                <textarea
                  rows={2}
                  maxLength={4000}
                  value={draft.referenceAnswer}
                  onChange={(e) => change("referenceAnswer", e.target.value)}
                  placeholder="Write a good answer to compare against."
                />
              </label>
              <label>
                Expected facts{" "}
                <span className="eval-optional">one short phrase per line</span>
                <textarea
                  rows={3}
                  required={draft.expectedOutcome === "knowledge"}
                  value={facts}
                  onChange={(e) => setFacts(e.target.value)}
                  placeholder={"GlobalLogic\nAssociate Consultant Technology"}
                />
              </label>
              <p className="eval-hint">
                Every phrase must appear in the reply. Case and punctuation are
                ignored; synonyms are not. Prefer stable names, numbers, and
                short facts.
              </p>
            </>
          ) : (
            <p className="eval-hint">
              Use a question that your knowledge genuinely cannot answer. This
              checks whether AmiBot admits the gap instead of answering.
            </p>
          )}
          {draft.expectedOutcome === "knowledge" ? (
            <section
              className="eval-evidence-picker"
              aria-label="Expected evidence"
            >
              <h3>Which passages support the answer?</h3>
              <p>
                Select up to 8. All selected passages must reach the model’s
                context.
              </p>
              <label className="eval-search">
                <Search size={18} />
                <input
                  aria-label="Search knowledge passages"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search your uploaded knowledge…"
                />
              </label>
              <div className="eval-selected-evidence">
                {draft.expectedChunkIds.length} selected
                {draft.expectedChunkIds.length ? (
                  <button
                    type="button"
                    onClick={() => change("expectedChunkIds", [])}
                  >
                    Clear selection
                  </button>
                ) : null}
              </div>
              <div className="eval-evidence-options" aria-busy={searching}>
                {searching ? (
                  <p role="status">Searching passages…</p>
                ) : !chunks.length ? (
                  <p>
                    No passages found. Upload knowledge in AmiBot Admin, or try
                    a different search.
                  </p>
                ) : (
                  chunks.map((chunk) => (
                    <label className="eval-evidence-option" key={chunk._id}>
                      <input
                        type="checkbox"
                        checked={draft.expectedChunkIds.includes(chunk._id)}
                        disabled={
                          !draft.expectedChunkIds.includes(chunk._id) &&
                          draft.expectedChunkIds.length >= 8
                        }
                        onChange={(e) =>
                          change(
                            "expectedChunkIds",
                            e.target.checked
                              ? [...draft.expectedChunkIds, chunk._id]
                              : draft.expectedChunkIds.filter(
                                  (id) => id !== chunk._id,
                                ),
                          )
                        }
                      />
                      <span>
                        <strong>
                          {chunk.sourceName} · passage {chunk.chunkIndex + 1}
                        </strong>
                        <span>{chunk.chunkText}</span>
                      </span>
                    </label>
                  ))
                )}
              </div>
            </section>
          ) : null}
          <details
            className="eval-history-editor"
            open={draft.history.length > 0 || undefined}
          >
            <summary>
              Conversation context{" "}
              <span className="eval-optional">for follow-up questions</span>
            </summary>
            <p className="eval-hint">
              Add the earlier messages needed to understand this question.
            </p>
            {draft.history.map((message, index) => (
              <div className="eval-history-row" key={index}>
                <select
                  aria-label={`Speaker ${index + 1}`}
                  value={message.sender}
                  onChange={(e) =>
                    change(
                      "history",
                      draft.history.map((m, i) =>
                        i === index ? { ...m, sender: e.target.value } : m,
                      ),
                    )
                  }
                >
                  <option value="user">User</option>
                  <option value="bot">AmiBot</option>
                </select>
                <input
                  aria-label={`Message ${index + 1}`}
                  required
                  maxLength={1200}
                  value={message.text}
                  onChange={(e) =>
                    change(
                      "history",
                      draft.history.map((m, i) =>
                        i === index ? { ...m, text: e.target.value } : m,
                      ),
                    )
                  }
                />
                <button
                  type="button"
                  className="eval-icon-button"
                  aria-label={`Remove message ${index + 1}`}
                  onClick={() =>
                    change(
                      "history",
                      draft.history.filter((_, i) => i !== index),
                    )
                  }
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="eval-button secondary"
              disabled={draft.history.length >= 8}
              onClick={() =>
                change("history", [
                  ...draft.history,
                  { sender: "user", text: "" },
                ])
              }
            >
              <Plus size={16} />
              Add message
            </button>
          </details>
        </div>
        <footer className="eval-dialog-footer">
          <button
            type="button"
            className="eval-button secondary"
            disabled={saving}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="eval-button primary"
            disabled={
              saving ||
              (draft.expectedOutcome === "knowledge" &&
                !draft.expectedChunkIds.length)
            }
          >
            {saving ? "Saving…" : "Save test case"}
          </button>
        </footer>
      </form>
    </dialog>
  );
}
