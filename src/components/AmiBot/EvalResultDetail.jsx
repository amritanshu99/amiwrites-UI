import React from "react";
import { CheckCircle2, CircleAlert, FileText, Minus } from "lucide-react";

export function EvalStatus({ status }) {
  const labels = {
    passed: "Passed",
    failed: "Needs attention",
    error: "Run error",
    pending: "Not run",
    running: "Running",
  };
  return (
    <span className={`eval-status ${status}`}>
      {status === "passed" ? (
        <CheckCircle2 size={14} />
      ) : ["failed", "error"].includes(status) ? (
        <CircleAlert size={14} />
      ) : (
        <Minus size={14} />
      )}
      {labels[status] || status}
    </span>
  );
}

export default function EvalResultDetail({ result }) {
  if (!result)
    return (
      <div className="eval-detail-empty">
        <FileText size={28} />
        <h3>Every answer has a story</h3>
        <p>
          Select a test to inspect its question, answer, and supporting
          evidence.
        </p>
      </div>
    );
  const { testCase, output, checks = [] } = result;
  return (
    <article className="eval-detail" aria-label="Test result details">
      <header>
        <span className="eval-eyebrow">CASE REVIEW · {testCase.category}</span>
        <h2>{testCase.title}</h2>
        <EvalStatus status={result.status} />
      </header>
      <section className="eval-question">
        <span className="eval-eyebrow">QUESTION</span>
        <p>{testCase.query}</p>
      </section>
      {testCase.history?.length ? (
        <details>
          <summary>Conversation before this question</summary>
          {testCase.history.map((message, i) => (
            <p key={i}>
              <strong>{message.sender === "user" ? "User" : "AmiBot"}:</strong>{" "}
              {message.text}
            </p>
          ))}
        </details>
      ) : null}
      {result.reason ? (
        <div className={`eval-verdict ${result.status}`}>
          <strong>
            {result.status === "passed"
              ? "Why this passed"
              : result.status === "error"
                ? "Execution needs attention"
                : "What needs attention"}
          </strong>
          <p>{result.reason}</p>
        </div>
      ) : null}
      <div className="eval-answer-grid">
        <section>
          <h3>Expected</h3>
          <p>
            {testCase.referenceAnswer ||
              {
                knowledge: "Answer using the selected knowledge passages.",
                unknown:
                  "Admit that the answer is not in the uploaded knowledge.",
                direct: "Respond naturally without retrieving knowledge.",
              }[testCase.expectedOutcome]}
          </p>
          {testCase.expectedFacts?.length ? (
            <div className="eval-fact-tags">
              {testCase.expectedFacts.map((fact) => (
                <span key={fact}>{fact}</span>
              ))}
            </div>
          ) : null}
        </section>
        <section>
          <h3>AmiBot’s answer</h3>
          <p>
            {output?.answer ||
              (result.status === "error"
                ? "No usable answer was produced."
                : "Run this suite to see the actual answer.")}
          </p>
          {output?.model ? <small>{output.model}</small> : null}
        </section>
      </div>
      {checks.length ? (
        <section className="eval-checks">
          <h3>Checks, explained</h3>
          {checks.map((check) => (
            <div className="eval-check" key={check.key}>
              {check.passed ? (
                <CheckCircle2 className="eval-check-pass" size={19} />
              ) : (
                <CircleAlert className="eval-check-fail" size={19} />
              )}
              <div>
                <strong>{check.label}</strong>
                <p>{check.detail}</p>
              </div>
            </div>
          ))}
        </section>
      ) : null}
      {output ? (
        <section className="eval-trace">
          <div className="eval-section-title">
            <h3>Retrieved evidence</h3>
            <span>{output.chunks.length} passages</span>
          </div>
          {!output.chunks.length ? (
            <p className="eval-hint">
              {output.outcome === "direct"
                ? "Casual replies skip retrieval."
                : "No matching passages were retrieved."}
            </p>
          ) : (
            output.chunks.map((chunk) => (
              <details key={chunk.id} className="eval-passage">
                <summary>
                  <FileText size={16} />
                  <span>
                    <strong>{chunk.sourceName}</strong>
                    <small>
                      Rank {chunk.rank} · passage {chunk.chunkIndex + 1}
                      {testCase.expectedChunkIds.includes(chunk.id)
                        ? " · expected evidence"
                        : ""}
                    </small>
                  </span>
                  <span className="eval-context-label">
                    {chunk.contextTruncated
                      ? "Truncated"
                      : chunk.contextText
                        ? "In context"
                        : "Not sent"}
                  </span>
                </summary>
                <p>{chunk.contextText || chunk.text}</p>
                {!chunk.contextText ? (
                  <p className="eval-hint">
                    Retrieved, but excluded by the context length limit.
                  </p>
                ) : null}
                {chunk.contextTruncated ? (
                  <p className="eval-hint">
                    Only part of this passage fit in the context. This does not
                    pass an expected-evidence check.
                  </p>
                ) : null}
              </details>
            ))
          )}
          <div className="eval-timings">
            <span>
              Retrieval <strong>{output.retrievalMs} ms</strong>
            </span>
            <span>
              Generation <strong>{output.generationMs} ms</strong>
            </span>
            <span>
              Total <strong>{(output.latencyMs / 1000).toFixed(2)} s</strong>
            </span>
          </div>
        </section>
      ) : null}
    </article>
  );
}
