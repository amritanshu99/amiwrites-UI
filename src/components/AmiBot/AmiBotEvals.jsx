import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  BookOpen,
  CheckCheck,
  ChevronRight,
  Download,
  FlaskConical,
  History,
  LoaderCircle,
  Pencil,
  Play,
  Plus,
  Search,
  Square,
  Trash2,
} from "lucide-react";
import EvalCaseEditor from "./EvalCaseEditor";
import EvalResultDetail, { EvalStatus } from "./EvalResultDetail";
import {
  compareRuns,
  downloadRun,
  evalError,
  evalRequest,
  percent,
  runDate,
} from "./evalApi";
import "./AmiBotEvals.css";

const statusFilters = [
  ["all", "All cases"],
  ["failed", "Needs attention"],
  ["passed", "Passed"],
  ["error", "Errors"],
];

function Metric({ label, value, description, tone }) {
  return (
    <div className={`eval-metric ${tone || ""}`}>
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{description}</span>
    </div>
  );
}

export default function AmiBotEvals() {
  const [cases, setCases] = useState([]);
  const [runs, setRuns] = useState([]);
  const [run, setRun] = useState(null);
  const [selectedId, setSelectedId] = useState("");
  const [tab, setTab] = useState("results");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [deleting, setDeleting] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const stop = useRef(false);
  const mounted = useRef(true);
  const busyRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [suite, history] = await Promise.all([
        evalRequest("/cases"),
        evalRequest("/runs"),
      ]);
      if (!mounted.current) return;
      setCases(suite.cases);
      setRuns(history.runs);
      if (history.runs.length) {
        const latest = await evalRequest(`/runs/${history.runs[0]._id}`);
        if (mounted.current) {
          setRun(latest.run);
          setSelectedId(latest.run.results[0]?.caseId || "");
        }
      }
    } catch (err) {
      if (mounted.current) setError(evalError(err));
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    load();
    return () => {
      mounted.current = false;
      stop.current = true;
    };
  }, [load]);

  useEffect(() => {
    if (!busy) return undefined;
    const warn = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [busy]);

  const recordRun = (next) => {
    if (!mounted.current) return;
    setRun(next);
    setRuns((previous) =>
      [next, ...previous.filter((item) => item._id !== next._id)]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 20),
    );
  };

  const execute = async (resume = false) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    setTab("results");
    setFilter("all");
    stop.current = false;
    let active;
    try {
      active = resume
        ? (await evalRequest(`/runs/${run._id}`)).run
        : (await evalRequest("/runs", { method: "post" })).run;
      recordRun(active);
      setSelectedId(active.results[0]?.caseId || "");
      for (const result of active.results) {
        if (stop.current || !mounted.current) break;
        if (result.status !== "pending") continue;
        setSelectedId(result.caseId);
        setRun((previous) => ({
          ...previous,
          results: previous.results.map((item) =>
            item.caseId === result.caseId
              ? { ...item, status: "running" }
              : item,
          ),
        }));
        active = (
          await evalRequest(`/runs/${active._id}/cases/${result.caseId}`, {
            method: "post",
          })
        ).run;
        recordRun(active);
      }
      if (mounted.current)
        setNotice(
          stop.current
            ? "Run paused. Completed results are saved; resume the remaining cases any time."
            : active.summary.status === "completed"
              ? "Run complete. Select a case to understand its result."
              : "Some cases are still running. Refresh this run shortly to see their results.",
        );
    } catch (err) {
      if (mounted.current)
        setError(
          `${evalError(err)} Completed results are saved. Refresh the run before resuming.`,
        );
      if (active && mounted.current) {
        try {
          recordRun((await evalRequest(`/runs/${active._id}`)).run);
        } catch {
          /* Preserve the original error. */
        }
      }
    } finally {
      busyRef.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  const selectRun = async (id) => {
    if (busyRef.current) return;
    setSwitching(true);
    setError("");
    setNotice("");
    try {
      const next = (await evalRequest(`/runs/${id}`)).run;
      recordRun(next);
      setSelectedId(next.results[0]?.caseId || "");
      setFilter("all");
    } catch (err) {
      setError(evalError(err));
    } finally {
      setSwitching(false);
    }
  };
  const saveCase = async () => {
    const data = await evalRequest("/cases");
    setCases(data.cases);
    setEditor(null);
    setNotice(
      "Test case saved. Start a new run to evaluate the updated suite.",
    );
  };
  const removeCase = async (testCase) => {
    if (
      !window.confirm(
        `Remove “${testCase.title}” from this suite? Previous run results will stay available.`,
      )
    )
      return;
    setDeleting(testCase._id);
    setError("");
    try {
      await evalRequest(`/cases/${testCase._id}`, { method: "delete" });
      setCases((previous) =>
        previous.filter((item) => item._id !== testCase._id),
      );
    } catch (err) {
      setError(evalError(err));
    } finally {
      setDeleting("");
    }
  };

  const summary = run?.summary;
  const previous = runs.find(
    (item) =>
      item._id !== run?._id &&
      new Date(item.createdAt) < new Date(run?.createdAt) &&
      compareRuns(run, item) !== null,
  );
  const delta = compareRuns(run, previous);
  const results = run?.results || [];
  const visible = results.filter(
    (result) =>
      (filter === "all" || result.status === filter) &&
      `${result.testCase.title} ${result.testCase.query} ${result.testCase.category}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const selected =
    visible.find((result) => result.caseId === selectedId) || visible[0];
  const progress = summary?.total
    ? Math.round((summary.completed / summary.total) * 100)
    : 0;

  return (
    <div className="amibot-evals">
      <div className="eval-shell">
        <nav className="eval-breadcrumb" aria-label="Breadcrumb">
          <Link to="/amibot-admin">AmiBot Admin</Link>
          <ChevronRight size={14} />
          <span>Evaluations</span>
        </nav>
        <header className="eval-header">
          <div>
            <span className="eval-eyebrow">
              <FlaskConical size={16} /> AMIBOT / QUALITY LAB
            </span>
            <h1>Know why an answer works.</h1>
            <p>
              Test the knowledge. Inspect the answer. Improve with evidence.
            </p>
          </div>
          <div className="eval-header-actions">
            <button
              className="eval-button secondary"
              disabled={
                busy || loading || switching || Boolean(error && !cases.length)
              }
              onClick={() => setEditor({})}
            >
              <Plus size={17} />
              Add test case
            </button>
            <button
              className="eval-button primary"
              disabled={busy || loading || switching || !cases.length}
              onClick={() => execute(false)}
            >
              {busy ? (
                <LoaderCircle className="eval-spin" size={17} />
              ) : (
                <Play size={17} />
              )}
              {busy ? "Running suite…" : "Run evaluation"}
            </button>
          </div>
        </header>
        {error ? (
          <div role="alert" className="eval-alert">
            {error}
            {!busy ? (
              <button onClick={run ? () => selectRun(run._id) : load}>
                Retry
              </button>
            ) : null}
          </div>
        ) : null}
        {notice ? (
          <div role="status" className="eval-notice">
            {notice}
          </div>
        ) : null}
        <section className="eval-overview" aria-label="Evaluation overview">
          <div className="eval-overview-intro">
            <span className="eval-eyebrow">A CLEARER PICTURE OF QUALITY</span>
            <h2>
              {run
                ? summary.status === "completed"
                  ? summary.failed || summary.errors
                    ? "See what needs your attention."
                    : "Your checks are looking good."
                  : "Build the picture, one case at a time."
                : "Confidence starts with a good test."}
            </h2>
            <p>
              {run
                ? `${summary.completed} of ${summary.total} cases completed. ${summary.errors} execution ${summary.errors === 1 ? "error" : "errors"}.`
                : "Turn real visitor questions into a repeatable quality check for Amibot’s RAG."}
            </p>
            <div className="eval-overview-label">
              <Activity size={16} />
              {run
                ? `Live knowledge · ${runDate(run.createdAt)}`
                : "Your knowledge → AmiBot’s answer → Clear checks"}
            </div>
          </div>
          <div className="eval-metrics">
            <Metric
              label="Overall pass rate"
              value={percent(summary?.passRate)}
              tone="highlight"
              description={
                delta === null
                  ? "All checks must pass per case"
                  : `${delta > 0 ? "+" : ""}${delta} points vs. prior matching suite`
              }
            />
            <Metric
              label="Evidence found"
              value={percent(summary?.evidenceRate)}
              description="Expected passages in context"
            />
            <Metric
              label="Expected facts"
              value={percent(summary?.factsRate)}
              description="Cases with every required phrase"
            />
            <Metric
              label="Response time · p95"
              value={
                summary?.p95LatencyMs != null
                  ? `${(summary.p95LatencyMs / 1000).toFixed(1)}s`
                  : "—"
              }
              description="95% of valid cases are this fast"
            />
          </div>
        </section>
        <div className="eval-toolbar">
          <div className="eval-tabs" aria-label="Evaluation views">
            <button
              aria-pressed={tab === "results"}
              onClick={() => setTab("results")}
            >
              <Activity size={17} />
              Results
            </button>
            <button
              aria-pressed={tab === "suite"}
              onClick={() => setTab("suite")}
            >
              <CheckCheck size={17} />
              Test suite <span>{cases.length}</span>
            </button>
            <button
              aria-pressed={tab === "guide"}
              onClick={() => setTab("guide")}
            >
              <BookOpen size={17} />
              How to read this
            </button>
          </div>
          {run ? (
            <div className="eval-run-controls">
              <History size={16} />
              <select
                aria-label="Select evaluation run"
                disabled={busy || switching}
                value={run._id}
                onChange={(e) => selectRun(e.target.value)}
              >
                {runs.map((item) => (
                  <option key={item._id} value={item._id}>
                    {runDate(item.createdAt)} · {item.summary.completed}/
                    {item.summary.total} complete
                  </option>
                ))}
              </select>
              <button
                className="eval-icon-button"
                title="Download run JSON"
                aria-label="Download run JSON"
                onClick={() => downloadRun(run)}
                disabled={busy}
              >
                <Download size={18} />
              </button>
            </div>
          ) : null}
        </div>
        {busy || summary?.status === "incomplete" ? (
          <div className="eval-progress-panel">
            <div>
              <span role="status">
                {busy
                  ? `Evaluating ${summary?.completed || 0} of ${summary?.total || cases.length} cases. You can pause after the current case.`
                  : `This run is incomplete. ${summary?.pending || 0} cases are waiting.`}
              </span>
              {busy ? (
                <button
                  className="eval-button secondary"
                  onClick={() => {
                    stop.current = true;
                    setNotice("Pausing after the current case finishes…");
                  }}
                >
                  <Square size={14} />
                  Pause
                </button>
              ) : (
                <div className="eval-inline-actions">
                  <button
                    className="eval-button secondary"
                    disabled={switching}
                    onClick={() => selectRun(run._id)}
                  >
                    Refresh run
                  </button>
                  <button
                    className="eval-button secondary"
                    disabled={switching || !summary?.pending}
                    onClick={() => execute(true)}
                  >
                    Resume run
                  </button>
                </div>
              )}
            </div>
            <progress
              max={100}
              value={progress}
              aria-label="Evaluation progress"
            />
          </div>
        ) : null}
        {loading || switching ? (
          <div className="eval-loading" role="status">
            <LoaderCircle size={24} className="eval-spin" />
            Loading evaluations…
          </div>
        ) : tab === "guide" ? (
          <Guide />
        ) : tab === "suite" ? (
          <section className="eval-suite">
            <div className="eval-section-title">
              <div>
                <h2>Your test suite</h2>
                <p>
                  Up to 30 focused cases. Each run saves its own copy of the
                  expectations.
                </p>
              </div>
              <span>{cases.length} / 30 cases</span>
            </div>
            {!cases.length ? (
              <EmptySuite onAdd={() => setEditor({})} />
            ) : (
              cases.map((testCase) => (
                <article key={testCase._id} className="eval-suite-case">
                  <div>
                    <span className="eval-eyebrow">{testCase.category}</span>
                    <h3>{testCase.title}</h3>
                    <p>{testCase.query}</p>
                    <small>
                      {
                        {
                          knowledge: "Answer from knowledge",
                          unknown: "Admit missing knowledge",
                          direct: "Casual reply",
                        }[testCase.expectedOutcome]
                      }{" "}
                      · {testCase.expectedFacts.length} expected facts ·{" "}
                      {testCase.expectedChunkIds.length} passages
                    </small>
                  </div>
                  <div className="eval-inline-actions">
                    <button
                      className="eval-icon-button"
                      disabled={busy}
                      aria-label={`Edit ${testCase.title}`}
                      onClick={() => setEditor(testCase)}
                    >
                      <Pencil size={17} />
                    </button>
                    <button
                      className="eval-icon-button danger"
                      disabled={busy || Boolean(deleting)}
                      aria-label={`Delete ${testCase.title}`}
                      onClick={() => removeCase(testCase)}
                    >
                      {deleting === testCase._id ? (
                        <LoaderCircle size={17} />
                      ) : (
                        <Trash2 size={17} />
                      )}
                    </button>
                  </div>
                </article>
              ))
            )}
          </section>
        ) : !run ? (
          <EmptySuite
            onAdd={() => setEditor({})}
            hasCases={cases.length > 0}
            onRun={() => execute(false)}
          />
        ) : (
          <section className="eval-results-layout">
            <aside className="eval-case-list" aria-label="Evaluation cases">
              <div className="eval-list-heading">
                <h2>
                  Test cases <span>{results.length}</span>
                </h2>
                <label className="eval-search">
                  <Search size={17} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Find a question…"
                    aria-label="Search test results"
                  />
                </label>
                <div className="eval-filters">
                  {statusFilters.map(([key, label]) => (
                    <button
                      key={key}
                      aria-pressed={filter === key}
                      onClick={() => setFilter(key)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="eval-case-scroll">
                {visible.length ? (
                  visible.map((result) => (
                    <button
                      key={result.caseId}
                      className="eval-case-row"
                      aria-pressed={selected?.caseId === result.caseId}
                      onClick={() => setSelectedId(result.caseId)}
                    >
                      <span className="eval-case-meta">
                        <span>{result.testCase.category}</span>
                        <EvalStatus status={result.status} />
                      </span>
                      <strong>{result.testCase.title}</strong>
                      <span className="eval-case-query">
                        {result.testCase.query}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="eval-no-matches">
                    No cases match these filters.
                    <button
                      onClick={() => {
                        setFilter("all");
                        setSearch("");
                      }}
                    >
                      Clear filters
                    </button>
                  </p>
                )}
              </div>
            </aside>
            <EvalResultDetail result={selected} />
          </section>
        )}
        <footer className="eval-page-note">
          <FlaskConical size={16} />
          <p>
            Live runs use your current knowledge and model, and may incur API
            costs. They do not send admin emails or create chat history. Passing
            checks are a regression signal, not proof that every claim is
            correct.
          </p>
        </footer>
        {run ? (
          <details className="eval-run-config">
            <summary>Run configuration & reproducibility</summary>
            <div>
              <p>
                Evaluator: {run.evaluatorVersion} · suite:{" "}
                {run.suiteFingerprint}
              </p>
              <p>
                Models: {run.config.models.join(", ")} · embeddings:{" "}
                {run.config.embeddingsEnabled
                  ? run.config.embeddingModel
                  : "disabled"}{" "}
                · top K: {run.config.topK}
              </p>
              <p>
                Temperature: {run.config.temperature} · knowledge passages:{" "}
                {run.config.knowledgeCount} · most recent knowledge update:{" "}
                {run.config.knowledgeUpdatedAt
                  ? runDate(run.config.knowledgeUpdatedAt)
                  : "none"}
              </p>
              <p>
                Run comparisons use the same saved test definitions and
                evaluator version. Models and knowledge can change between runs;
                inspect this configuration and the actual evidence when
                investigating a difference.
              </p>
            </div>
          </details>
        ) : null}
      </div>
      {editor ? (
        <EvalCaseEditor
          initial={editor}
          onClose={() => setEditor(null)}
          onSaved={saveCase}
        />
      ) : null}
    </div>
  );
}

function EmptySuite({ onAdd, onRun, hasCases }) {
  return (
    <div className="eval-empty">
      <span className="eval-empty-icon">
        <FlaskConical size={30} />
      </span>
      <span className="eval-eyebrow">MAKE QUALITY VISIBLE</span>
      <h2>
        {hasCases
          ? "Your suite is ready for its first run."
          : "Start with a question worth getting right."}
      </h2>
      <p>
        {hasCases
          ? "Run your cases against Amibot’s current knowledge. You’ll see exactly which checks passed and the evidence behind each answer."
          : "Add a question, the facts you expect, and the passages that support them. Then let AmiBot show its work."}
      </p>
      <button
        className="eval-button primary"
        onClick={hasCases ? onRun : onAdd}
      >
        {hasCases ? <Play size={17} /> : <Plus size={17} />}
        {hasCases ? "Run your first evaluation" : "Create your first test"}
      </button>
      <div className="eval-starting-points">
        <span>Factual questions</span>
        <span>Follow-up conversations</span>
        <span>Missing knowledge</span>
        <span>Casual replies</span>
      </div>
    </div>
  );
}

function Guide() {
  return (
    <section className="eval-guide">
      <header>
        <span className="eval-eyebrow">A QUICK FIELD GUIDE</span>
        <h2>Three questions behind every result.</h2>
        <p>
          RAG means finding relevant knowledge, then using it to answer. These
          evaluations make both steps visible.
        </p>
      </header>
      <div className="eval-guide-grid">
        <article>
          <Search size={24} />
          <h3>Did it find the evidence?</h3>
          <p>
            For knowledge tests, all passages you selected must appear in the
            context sent to the model. “Not sent” means retrieval found it, but
            the context limit excluded it.
          </p>
          <strong>Improve this by</strong>
          <p>
            Checking source content, search phrases, chunk boundaries, and
            embeddings.
          </p>
        </article>
        <article>
          <CheckCheck size={24} />
          <h3>Did it include the facts?</h3>
          <p>
            Every expected phrase must appear in the answer, ignoring case and
            punctuation. This is a transparent phrase check, not an AI judgment
            of meaning.
          </p>
          <strong>Improve this by</strong>
          <p>
            Using short, essential facts. Review valid paraphrases before
            changing the prompt.
          </p>
        </article>
        <article>
          <Activity size={24} />
          <h3>Did it behave correctly?</h3>
          <p>
            AmiBot should answer from knowledge, admit a missing answer, or
            handle a casual greeting—depending on your expectation.
          </p>
          <strong>Improve this by</strong>
          <p>
            Adding unknown questions and realistic follow-ups, not just easy
            factual prompts.
          </p>
        </article>
      </div>
      <div className="eval-guide-bottom">
        <h3>What counts as a pass?</h3>
        <p>
          A case passes only when every configured check passes. Overall pass
          rate is passed cases divided by completed cases, including execution
          errors. Evidence and fact rates exclude errors and cases where that
          check does not apply. A dash means there is no data, not a perfect
          score.
        </p>
        <h3>What still needs your judgment?</h3>
        <p>
          Phrase checks can miss correct synonyms and can accept negated or
          unsupported claims containing the expected words. They do not measure
          semantic correctness or full faithfulness. Compare the answer with the
          reference and retrieved passages. Source attachments show available
          context, not verified citations for each claim.
        </p>
        <h3>Build a useful suite</h3>
        <p>
          Use representative visitor questions, ambiguous wording, missing
          information, and multi-turn conversations. Keep a few difficult cases.
          Re-run after editing knowledge or retrieval settings, and only compare
          scores for the same test definitions.
        </p>
        <h3>Keep runs reproducible</h3>
        <p>
          Each run stores the cases, expectations, model configuration, answers,
          and evidence. A paused run can resume, but changing knowledge during a
          run makes it less comparable. The offline command{" "}
          <code>npm run eval:amibot</code> in the backend checks fixed retrieval
          fixtures without model calls; it is separate from this live score.
        </p>
      </div>
    </section>
  );
}
