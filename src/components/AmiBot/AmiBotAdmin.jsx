import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Inbox,
  LoaderCircle,
  RefreshCw,
  Send,
  Trash2,
  UploadCloud,
  XCircle,
} from "lucide-react";
import { apiUrl } from "../../config/api";

const panelClassName =
  "rounded-2xl border border-white/75 bg-white/86 p-5 shadow-sm ring-1 ring-white/70 backdrop-blur-2xl dark:border-zinc-800 dark:bg-black/88 dark:ring-white/[0.06] sm:p-6";

const fieldClassName =
  "w-full rounded-xl border border-slate-200/80 bg-white/92 px-3.5 py-2.5 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-cyan-300/60 dark:focus:ring-cyan-300/10";

const secondaryButtonClassName =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/86 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-zinc-700";

const primaryButtonClassName =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.2)] transition hover:-translate-y-0.5 hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-cyan-300 dark:text-zinc-950 dark:hover:bg-cyan-200";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function getErrorMessage(error) {
  return error.response?.data?.error || error.response?.data?.message || error.message || "Something went wrong";
}

function formatDate(value) {
  if (!value) return "Not yet";

  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return String(value);
  }
}

function formatBytes(bytes = 0) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function sourceIcon(type) {
  if (type === "excel") return <FileSpreadsheet className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
}

export default function AmiBotAdmin() {
  const [questions, setQuestions] = useState([]);
  const [sources, setSources] = useState([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [savingQuestionId, setSavingQuestionId] = useState("");
  const [deletingSourceId, setDeletingSourceId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [file, setFile] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [addToKnowledge, setAddToKnowledge] = useState({});

  const authHeaders = useMemo(() => getAuthHeaders(), []);

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [questionResponse, sourceResponse] = await Promise.all([
        axios.get(apiUrl("/api/amibot/admin/questions"), {
          headers: authHeaders,
          params: statusFilter === "all" ? {} : { status: statusFilter },
        }),
        axios.get(apiUrl("/api/amibot/admin/knowledge"), {
          headers: authHeaders,
        }),
      ]);

      setQuestions(questionResponse.data?.questions || []);
      setSources(sourceResponse.data?.sources || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [authHeaders, statusFilter]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!file || uploading) return;

    const formData = new FormData();
    formData.append("file", file);
    if (sourceName.trim()) formData.append("sourceName", sourceName.trim());

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const response = await axios.post(
        apiUrl("/api/amibot/admin/knowledge/upload"),
        formData,
        {
          headers: {
            ...authHeaders,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      setSuccess(response.data?.message || "Knowledge uploaded");
      setFile(null);
      setSourceName("");
      event.target.reset();
      await loadAdminData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteSource = async (sourceId) => {
    if (!sourceId || deletingSourceId) return;

    setDeletingSourceId(sourceId);
    setError("");
    setSuccess("");

    try {
      await axios.delete(apiUrl(`/api/amibot/admin/knowledge/${sourceId}`), {
        headers: authHeaders,
      });
      setSuccess("Knowledge source deleted");
      await loadAdminData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingSourceId("");
    }
  };

  const handleAnswerQuestion = async (questionId) => {
    const answer = (drafts[questionId] || "").trim();
    if (!answer || savingQuestionId) return;

    setSavingQuestionId(questionId);
    setError("");
    setSuccess("");

    try {
      await axios.patch(
        apiUrl(`/api/amibot/admin/questions/${questionId}/answer`),
        {
          answer,
          addToKnowledge: addToKnowledge[questionId] === true,
        },
        {
          headers: {
            ...authHeaders,
            "Content-Type": "application/json",
          },
        },
      );

      setSuccess("Question answered");
      setDrafts((previous) => ({ ...previous, [questionId]: "" }));
      await loadAdminData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingQuestionId("");
    }
  };

  const handleCloseQuestion = async (questionId) => {
    if (!questionId || savingQuestionId) return;

    setSavingQuestionId(questionId);
    setError("");
    setSuccess("");

    try {
      await axios.patch(
        apiUrl(`/api/amibot/admin/questions/${questionId}/close`),
        {},
        { headers: authHeaders },
      );
      setSuccess("Question closed");
      await loadAdminData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingQuestionId("");
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f8fafc,#eef7ff_42%,#f7fee7_78%,#f8fafc)] px-4 py-8 text-slate-950 dark:bg-[linear-gradient(180deg,#050505_0%,#09090b_52%,#000000_100%)] dark:text-zinc-50 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-white/75 bg-white/86 p-5 shadow-[0_18px_46px_rgba(15,23,42,0.12)] ring-1 ring-white/70 backdrop-blur-2xl dark:border-zinc-800 dark:bg-black/90 dark:ring-white/[0.06] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              to="/amibot"
              className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-sky-700 dark:text-zinc-300 dark:hover:text-cyan-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to AmiBot
            </Link>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 ring-1 ring-sky-200/70 dark:bg-cyan-300/10 dark:text-cyan-100 dark:ring-cyan-300/20">
                <Bot className="h-5 w-5" />
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-normal sm:text-3xl">AmiBot Admin</h1>
                <p className="mt-1 text-sm text-slate-600 dark:text-zinc-300">
                  Manage knowledge files and answer logged-in users' unanswered questions.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={loadAdminData}
            disabled={loading}
            className={secondaryButtonClassName}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {error ? (
          <div className="mb-5 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-400/30 dark:bg-red-950/35 dark:text-red-100">
            <XCircle className="h-4 w-4" />
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mb-5 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-300/25 dark:bg-emerald-950/35 dark:text-emerald-100">
            <CheckCircle2 className="h-4 w-4" />
            {success}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.45fr)]">
          <section className={panelClassName}>
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold tracking-normal">Knowledge</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-zinc-300">
                  Upload PDFs or `.xlsx` sheets for data-grounded answers.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-zinc-900 dark:text-zinc-300">
                {sources.length} files
              </span>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-200">
                Display name
                <input
                  className={`mt-1.5 ${fieldClassName}`}
                  value={sourceName}
                  onChange={(event) => setSourceName(event.target.value)}
                  placeholder="Optional name for this knowledge file"
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-200">
                PDF or `.xlsx` file
                <input
                  accept=".pdf,.xlsx,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className={`mt-1.5 ${fieldClassName}`}
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                  type="file"
                />
              </label>

              <button
                type="submit"
                disabled={!file || uploading}
                className={primaryButtonClassName}
              >
                {uploading ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <UploadCloud className="h-4 w-4" />
                )}
                Upload knowledge
              </button>
            </form>

            <div className="mt-6 space-y-3">
              {sources.length ? (
                sources.map((source) => (
                  <div
                    key={source.id}
                    className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/70"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
                          <span className="text-sky-700 dark:text-cyan-100">
                            {sourceIcon(source.sourceType)}
                          </span>
                          <span className="truncate">{source.sourceName}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                          {source.chunkCount} chunks | {formatBytes(source.size)} | {formatDate(source.createdAt)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteSource(source.id)}
                        disabled={deletingSourceId === source.id}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:text-red-200 dark:hover:bg-red-500/15"
                        aria-label={`Delete ${source.sourceName}`}
                      >
                        {deletingSourceId === source.id ? (
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white/55 p-5 text-sm font-semibold text-slate-600 dark:border-zinc-700 dark:bg-zinc-950/55 dark:text-zinc-300">
                  No AmiBot knowledge uploaded yet.
                </div>
              )}
            </div>
          </section>

          <section className={panelClassName}>
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold tracking-normal">User Questions</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-zinc-300">
                  Questions appear here only when a logged-in user asks something outside uploaded data.
                </p>
              </div>

              <div className="grid grid-cols-4 rounded-xl border border-slate-200/80 bg-white/70 p-1 dark:border-zinc-800 dark:bg-zinc-950">
                {["pending", "answered", "closed", "all"].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-lg px-3 py-2 text-xs font-bold capitalize transition ${
                      statusFilter === status
                        ? "bg-slate-950 text-white shadow-sm dark:bg-cyan-300 dark:text-zinc-950"
                        : "text-slate-600 hover:bg-white/80 dark:text-zinc-300 dark:hover:bg-zinc-900"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="flex min-h-64 items-center justify-center text-slate-500 dark:text-zinc-300">
                <LoaderCircle className="h-7 w-7 animate-spin" />
              </div>
            ) : questions.length ? (
              <div className="space-y-4">
                {questions.map((question) => (
                  <article
                    key={question.id}
                    className="rounded-2xl border border-slate-200/80 bg-white/70 p-4 dark:border-zinc-800 dark:bg-zinc-950/70"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold capitalize text-slate-600 dark:bg-zinc-900 dark:text-zinc-300">
                            {question.status}
                          </span>
                          <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                            {formatDate(question.createdAt)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                          {question.username || "User"}
                        </p>
                        {question.userEmail ? (
                          <p className="text-xs text-slate-500 dark:text-zinc-400">
                            {question.userEmail}
                          </p>
                        ) : null}
                      </div>

                      {question.status === "pending" ? (
                        <button
                          type="button"
                          onClick={() => handleCloseQuestion(question.id)}
                          disabled={savingQuestionId === question.id}
                          className={secondaryButtonClassName}
                        >
                          <XCircle className="h-4 w-4" />
                          Close
                        </button>
                      ) : null}
                    </div>

                    <p className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 dark:bg-black dark:text-zinc-200">
                      {question.question}
                    </p>

                    {question.status === "answered" ? (
                      <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800 dark:border-emerald-300/20 dark:bg-emerald-950/25 dark:text-emerald-100">
                        {question.adminAnswer}
                      </div>
                    ) : null}

                    {question.status === "pending" ? (
                      <div className="mt-4 space-y-3">
                        <textarea
                          className={`${fieldClassName} min-h-28 resize-y`}
                          placeholder="Write the answer users should see..."
                          value={drafts[question.id] || ""}
                          onChange={(event) =>
                            setDrafts((previous) => ({
                              ...previous,
                              [question.id]: event.target.value,
                            }))
                          }
                        />

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-zinc-200">
                            <input
                              type="checkbox"
                              checked={addToKnowledge[question.id] === true}
                              onChange={(event) =>
                                setAddToKnowledge((previous) => ({
                                  ...previous,
                                  [question.id]: event.target.checked,
                                }))
                              }
                              className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 dark:border-zinc-700 dark:bg-zinc-950"
                            />
                            Save answer into AmiBot knowledge
                          </label>

                          <button
                            type="button"
                            onClick={() => handleAnswerQuestion(question.id)}
                            disabled={!drafts[question.id]?.trim() || savingQuestionId === question.id}
                            className={primaryButtonClassName}
                          >
                            {savingQuestionId === question.id ? (
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                            Save answer
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/55 p-6 text-center text-slate-600 dark:border-zinc-700 dark:bg-zinc-950/55 dark:text-zinc-300">
                <Inbox className="mb-3 h-9 w-9" />
                <p className="text-sm font-semibold">No questions in this view.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
