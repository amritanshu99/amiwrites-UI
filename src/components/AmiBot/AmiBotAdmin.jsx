import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  Clock3,
  Database,
  FileSpreadsheet,
  FileText,
  Inbox,
  Layers3,
  LoaderCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  Trash2,
  UploadCloud,
  XCircle,
} from "lucide-react";
import { apiUrl } from "../../config/api";

const panelClassName =
  "rounded-2xl border border-white/80 bg-white/88 p-4 shadow-[0_22px_60px_-42px_rgba(15,23,42,0.42)] ring-1 ring-white/70 backdrop-blur-2xl dark:border-zinc-800 dark:bg-black/88 dark:ring-white/[0.06] sm:p-5";

const fieldClassName =
  "w-full rounded-xl border border-slate-200/80 bg-white/92 px-3.5 py-2.5 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-cyan-300/60 dark:focus:ring-cyan-300/10";

const secondaryButtonClassName =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/86 px-3.5 py-2 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-zinc-700 dark:focus-visible:ring-white/10";

const primaryButtonClassName =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-3.5 py-2 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(15,23,42,0.2)] transition hover:-translate-y-0.5 hover:bg-sky-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-cyan-300 dark:text-zinc-950 dark:hover:bg-cyan-200 dark:focus-visible:ring-cyan-300/20";

const dangerButtonClassName =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white/86 px-3.5 py-2 text-sm font-semibold text-red-700 transition hover:-translate-y-0.5 hover:bg-red-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-400/25 dark:bg-zinc-950 dark:text-red-100 dark:hover:bg-red-500/15 dark:focus-visible:ring-red-400/15";

const statusOptions = ["pending", "answered", "closed", "all"];

const statusClassNames = {
  pending:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-300/25 dark:bg-amber-300/10 dark:text-amber-100",
  answered:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-300/25 dark:bg-emerald-300/10 dark:text-emerald-100",
  closed:
    "border-slate-200 bg-slate-100 text-slate-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
};

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

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold capitalize ${
        statusClassNames[status] || statusClassNames.closed
      }`}
    >
      {status}
    </span>
  );
}

function Notice({ children, type }) {
  const isSuccess = type === "success";
  const Icon = isSuccess ? CheckCircle2 : XCircle;

  return (
    <div
      className={`mb-4 flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold ${
        isSuccess
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-300/25 dark:bg-emerald-950/35 dark:text-emerald-100"
          : "border-red-200 bg-red-50 text-red-700 dark:border-red-400/30 dark:bg-red-950/35 dark:text-red-100"
      }`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="min-w-0 [overflow-wrap:anywhere]">{children}</span>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-3 dark:border-zinc-800 dark:bg-zinc-950/72">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700 dark:bg-cyan-300/10 dark:text-cyan-100">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-zinc-500">
            {label}
          </p>
          <p className="text-xl font-bold text-slate-950 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

function SourceCard({ deleting, onDelete, source }) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white/72 p-4 dark:border-zinc-800 dark:bg-zinc-950/72">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <span className="text-sky-700 dark:text-cyan-100">
              {sourceIcon(source.sourceType)}
            </span>
            <span className="truncate">{source.sourceName}</span>
          </div>
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-zinc-400">
            {source.chunkCount} chunks | {formatBytes(source.size)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
            {formatDate(source.createdAt)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onDelete(source)}
          disabled={deleting}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-red-600 transition hover:bg-red-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-red-100 disabled:opacity-50 dark:text-red-200 dark:hover:bg-red-500/15 dark:focus-visible:ring-red-400/15"
          aria-label={`Delete ${source.sourceName}`}
        >
          {deleting ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </button>
      </div>
    </article>
  );
}

function LoadingQuestions() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((item) => (
        <div
          key={item}
          className="h-40 animate-pulse rounded-2xl border border-slate-200/80 bg-white/60 dark:border-zinc-800 dark:bg-zinc-950/70"
        />
      ))}
    </div>
  );
}

export default function AmiBotAdmin() {
  const [questions, setQuestions] = useState([]);
  const [allQuestions, setAllQuestions] = useState([]);
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

  const loadAdminData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const headers = getAuthHeaders();
      const questionRequest = axios.get(apiUrl("/api/amibot/admin/questions"), {
        headers,
        params: statusFilter === "all" ? { limit: 300 } : { status: statusFilter, limit: 300 },
      });
      const allQuestionRequest =
        statusFilter === "all"
          ? questionRequest
          : axios.get(apiUrl("/api/amibot/admin/questions"), {
              headers,
              params: { limit: 300 },
            });
      const sourceRequest = axios.get(apiUrl("/api/amibot/admin/knowledge"), {
        headers,
      });

      const [questionResponse, allQuestionResponse, sourceResponse] = await Promise.all([
        questionRequest,
        allQuestionRequest,
        sourceRequest,
      ]);

      setQuestions(questionResponse.data?.questions || []);
      setAllQuestions(allQuestionResponse.data?.questions || []);
      setSources(sourceResponse.data?.sources || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const summary = useMemo(() => {
    const pool = allQuestions.length ? allQuestions : questions;
    return {
      pending: pool.filter((question) => question.status === "pending").length,
      answered: pool.filter((question) => question.status === "answered").length,
      closed: pool.filter((question) => question.status === "closed").length,
    };
  }, [allQuestions, questions]);

  const selectedFileLabel = file ? `${file.name} (${formatBytes(file.size)})` : "Choose PDF or .xlsx";

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!file || uploading) return;

    const extension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (![".pdf", ".xlsx"].includes(extension)) {
      setError("Please choose a PDF or .xlsx file.");
      return;
    }

    const form = event.currentTarget;
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
            ...getAuthHeaders(),
            "Content-Type": "multipart/form-data",
          },
        },
      );

      setSuccess(response.data?.message || "Knowledge uploaded");
      setFile(null);
      setSourceName("");
      form.reset();
      await loadAdminData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteSource = async (source) => {
    if (!source?.id || deletingSourceId) return;
    const confirmed = window.confirm(`Delete "${source.sourceName}" from AmiBot knowledge?`);
    if (!confirmed) return;

    setDeletingSourceId(source.id);
    setError("");
    setSuccess("");

    try {
      await axios.delete(apiUrl(`/api/amibot/admin/knowledge/${source.id}`), {
        headers: getAuthHeaders(),
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
            ...getAuthHeaders(),
            "Content-Type": "application/json",
          },
        },
      );

      setSuccess("Question answered");
      setDrafts((previous) => ({ ...previous, [questionId]: "" }));
      setAddToKnowledge((previous) => ({ ...previous, [questionId]: false }));
      await loadAdminData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingQuestionId("");
    }
  };

  const handleCloseQuestion = async (question) => {
    if (!question?.id || savingQuestionId) return;
    const confirmed = window.confirm("Close this unanswered question?");
    if (!confirmed) return;

    setSavingQuestionId(question.id);
    setError("");
    setSuccess("");

    try {
      await axios.patch(
        apiUrl(`/api/amibot/admin/questions/${question.id}/close`),
        {},
        { headers: getAuthHeaders() },
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
    <div className="min-h-screen bg-[linear-gradient(135deg,#f8fafc,#eef7ff_42%,#f7fee7_78%,#f8fafc)] px-3 py-4 text-slate-950 dark:bg-[linear-gradient(180deg,#050505_0%,#09090b_52%,#000000_100%)] dark:text-zinc-50 sm:px-5 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className={`${panelClassName} mb-4`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <Link
                to="/amibot"
                className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-sky-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 dark:text-zinc-300 dark:hover:text-cyan-100 dark:focus-visible:ring-white/10"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to AmiBot
              </Link>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 ring-1 ring-sky-200/70 dark:bg-cyan-300/10 dark:text-cyan-100 dark:ring-cyan-300/20">
                  <Bot className="h-6 w-6" />
                </span>
                <div className="min-w-0">
                  <h1 className="truncate text-2xl font-bold tracking-normal sm:text-3xl">
                    AmiBot Admin
                  </h1>
                  <p className="mt-1 text-sm text-slate-600 dark:text-zinc-300">
                    Knowledge files, pending answers, and review status.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={loadAdminData}
              disabled={loading}
              className={`${secondaryButtonClassName} w-full sm:w-auto`}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard icon={Inbox} label="Visible" value={loading ? "-" : questions.length} />
            <MetricCard icon={Clock3} label="Pending" value={loading ? "-" : summary.pending} />
            <MetricCard icon={CheckCircle2} label="Answered" value={loading ? "-" : summary.answered} />
            <MetricCard icon={Database} label="Files" value={loading ? "-" : sources.length} />
          </div>
        </header>

        {error ? <Notice type="error">{error}</Notice> : null}
        {success ? <Notice type="success">{success}</Notice> : null}

        <div className="grid gap-4 xl:grid-cols-[minmax(20rem,0.82fr)_minmax(0,1.5fr)]">
          <section className={`${panelClassName} min-w-0`}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold tracking-normal">Knowledge</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-zinc-300">
                  {sources.length} active {sources.length === 1 ? "file" : "files"}
                </p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-zinc-900 dark:text-zinc-200">
                <Layers3 className="h-5 w-5" />
              </span>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-200">
                Display name
                <input
                  className={`mt-1.5 ${fieldClassName}`}
                  value={sourceName}
                  onChange={(event) => setSourceName(event.target.value)}
                  placeholder="Optional name"
                />
              </label>

              <div>
                <span className="block text-sm font-semibold text-slate-700 dark:text-zinc-200">
                  Knowledge file
                </span>
                <label className="mt-1.5 flex min-h-32 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white/62 px-4 py-5 text-center transition hover:border-sky-300 hover:bg-sky-50/70 focus-within:border-sky-400 focus-within:ring-4 focus-within:ring-sky-100 dark:border-zinc-700 dark:bg-zinc-950/62 dark:hover:border-cyan-300/45 dark:hover:bg-cyan-300/10 dark:focus-within:ring-cyan-300/10">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700 dark:bg-cyan-300/10 dark:text-cyan-100">
                    <UploadCloud className="h-5 w-5" />
                  </span>
                  <span className="max-w-full truncate text-sm font-bold text-slate-800 dark:text-zinc-100">
                    {selectedFileLabel}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-zinc-500">
                    PDF / XLSX
                  </span>
                  <input
                    accept=".pdf,.xlsx,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    className="sr-only"
                    onChange={(event) => setFile(event.target.files?.[0] || null)}
                    type="file"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={!file || uploading}
                className={`${primaryButtonClassName} w-full sm:w-auto`}
              >
                {uploading ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <UploadCloud className="h-4 w-4" />
                )}
                Upload knowledge
              </button>
            </form>

            <div className="mt-5 max-h-[30rem] space-y-3 overflow-y-auto pr-1">
              {sources.length ? (
                sources.map((source) => (
                  <SourceCard
                    key={source.id}
                    deleting={deletingSourceId === source.id}
                    onDelete={handleDeleteSource}
                    source={source}
                  />
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white/55 p-5 text-sm font-semibold text-slate-600 dark:border-zinc-700 dark:bg-zinc-950/55 dark:text-zinc-300">
                  No AmiBot knowledge uploaded yet.
                </div>
              )}
            </div>
          </section>

          <section className={`${panelClassName} min-w-0`}>
            <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <h2 className="text-lg font-bold tracking-normal">User Questions</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-zinc-300">
                  {summary.closed} closed
                </p>
              </div>

              <div className="max-w-full overflow-x-auto rounded-2xl border border-slate-200/80 bg-white/72 p-1 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex min-w-max gap-1">
                  {statusOptions.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatusFilter(status)}
                      className={`min-h-10 min-w-[5.7rem] rounded-xl px-3 py-2 text-xs font-bold capitalize transition focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 dark:focus-visible:ring-white/10 ${
                        statusFilter === status
                          ? "bg-slate-950 text-white shadow-sm dark:bg-cyan-300 dark:text-zinc-950"
                          : "text-slate-600 hover:bg-white/90 dark:text-zinc-300 dark:hover:bg-zinc-900"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {loading ? (
              <LoadingQuestions />
            ) : questions.length ? (
              <div className="space-y-4">
                {questions.map((question) => {
                  const draft = drafts[question.id] || "";
                  const isSaving = savingQuestionId === question.id;

                  return (
                    <article
                      key={question.id}
                      className="rounded-2xl border border-slate-200/80 bg-white/72 p-4 dark:border-zinc-800 dark:bg-zinc-950/72"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge status={question.status} />
                            <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                              {formatDate(question.createdAt)}
                            </span>
                          </div>

                          <div className="mt-3 flex min-w-0 items-center gap-2">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold uppercase text-slate-700 dark:bg-zinc-900 dark:text-zinc-200">
                              {(question.username || "U").slice(0, 1)}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                                {question.username || "User"}
                              </p>
                              {question.userEmail ? (
                                <p className="truncate text-xs text-slate-500 dark:text-zinc-400">
                                  {question.userEmail}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        {question.status === "pending" ? (
                          <button
                            type="button"
                            onClick={() => handleCloseQuestion(question)}
                            disabled={isSaving}
                            className={`${dangerButtonClassName} w-full sm:w-auto`}
                          >
                            {isSaving ? (
                              <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                            Close
                          </button>
                        ) : null}
                      </div>

                      <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 dark:bg-black dark:text-zinc-200">
                        <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">
                          {question.question}
                        </p>
                      </div>

                      {question.status === "answered" ? (
                        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800 dark:border-emerald-300/20 dark:bg-emerald-950/25 dark:text-emerald-100">
                          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em]">
                            <ShieldCheck className="h-4 w-4" />
                            Answer
                          </div>
                          <p className="whitespace-pre-wrap [overflow-wrap:anywhere]">
                            {question.adminAnswer}
                          </p>
                        </div>
                      ) : null}

                      {question.status === "pending" ? (
                        <div className="mt-4 space-y-3">
                          <textarea
                            className={`${fieldClassName} min-h-32 resize-y leading-6`}
                            placeholder="Write the answer users should see..."
                            value={draft}
                            onChange={(event) =>
                              setDrafts((previous) => ({
                                ...previous,
                                [question.id]: event.target.value,
                              }))
                            }
                          />

                          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-zinc-800 dark:bg-black dark:text-zinc-200">
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
                              Save into knowledge
                            </label>

                            <button
                              type="button"
                              onClick={() => handleAnswerQuestion(question.id)}
                              disabled={!draft.trim() || isSaving}
                              className={`${primaryButtonClassName} w-full lg:w-auto`}
                            >
                              {isSaving ? (
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
                  );
                })}
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
