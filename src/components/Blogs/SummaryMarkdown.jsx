import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const markdownComponents = {
  a: ({ children, ...props }) => (
    <a className="text-blue-600 dark:text-cyan-400 hover:underline" {...props}>
      {children}
    </a>
  ),
  code: ({ inline, children, ...props }) =>
    inline ? (
      <code className="px-1 py-0.5 rounded bg-slate-100 dark:bg-zinc-900" {...props}>
        {children}
      </code>
    ) : (
      <pre className="p-3 rounded-xl bg-slate-100 dark:bg-black overflow-x-auto">
        <code {...props}>{children}</code>
      </pre>
    ),
  h1: ({ children, ...props }) => (
    <h1 className="mt-0" {...props}>
      {children}
    </h1>
  ),
};

function SummaryMarkdown({ summary }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {summary.replace(/\r\n/g, "\n")}
    </ReactMarkdown>
  );
}

export default React.memo(SummaryMarkdown);
