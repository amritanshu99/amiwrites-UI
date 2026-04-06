import React from "react";
import { Link, useParams } from "react-router-dom";
import { legalDocuments } from "../data/legalDocuments";

const LegalPage = () => {
  const { slug } = useParams();
  const document = legalDocuments[slug];

  if (!document) {
    return (
      <section className="mx-auto max-w-4xl px-6 py-14 text-slate-200">
        <h1 className="text-3xl sm:text-4xl font-bold text-white">Document not found</h1>
        <p className="mt-3 text-sm sm:text-base text-slate-300">
          The legal page you requested does not exist. Please use the footer links to navigate
          to an available policy.
        </p>
        <Link
          className="inline-flex mt-8 rounded-md border border-slate-500/70 px-4 py-2 text-sm hover:border-cyan-400 hover:text-cyan-300 transition-colors"
          to="/"
        >
          Back to Home
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-6 py-12 sm:py-14 text-slate-100">
      <header className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Legal</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-white">{document.title}</h1>
        <p className="mt-4 text-base text-slate-200 leading-7 font-medium">{document.summary}</p>
        <p className="mt-4 text-xs text-slate-400">Last updated: {document.lastUpdated}</p>
      </header>

      <div className="space-y-5 mt-8">
        {document.sections.map((section) => (
          <article
            key={section.heading}
            className="space-y-3 rounded-2xl border border-slate-700/60 bg-slate-900/50 p-5 sm:p-6"
          >
            <h2 className="text-xl font-semibold text-slate-50">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-sm sm:text-base text-slate-200 leading-7 tracking-[0.01em]">
                {paragraph}
              </p>
            ))}
          </article>
        ))}
      </div>

      <aside className="mt-10 rounded-xl border border-amber-300/30 bg-amber-200/10 px-4 py-4 text-xs sm:text-sm leading-relaxed text-amber-100">
        This content is provided for general informational purposes and does not constitute legal
        advice. For requirements specific to your business or jurisdiction, consult qualified
        legal counsel.
      </aside>
    </section>
  );
};

export default LegalPage;
