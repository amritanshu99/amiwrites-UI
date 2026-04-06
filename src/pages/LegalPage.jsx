import React from "react";
import { Link, useParams } from "react-router-dom";
import { legalDocuments } from "../data/legalDocuments";

const LegalPage = () => {
  const { slug } = useParams();
  const document = legalDocuments[slug];

  if (!document) {
    return (
      <section className="mx-auto max-w-4xl px-4 sm:px-6 py-12 sm:py-14 text-slate-800 dark:text-slate-200">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">
          Document not found
        </h1>
        <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          The legal page you requested does not exist. Please use the footer links to navigate to
          an available policy.
        </p>
        <Link
          className="inline-flex mt-8 rounded-md border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm text-slate-700 dark:text-slate-100 hover:border-cyan-500 hover:text-cyan-600 dark:hover:text-cyan-300 transition-colors"
          to="/"
        >
          Back to Home
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-14 text-slate-800 dark:text-slate-100">
      <header className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/80 shadow-sm p-5 sm:p-8">
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">Legal</p>
        <h1 className="mt-2 text-2xl sm:text-4xl font-bold text-slate-900 dark:text-white leading-tight">
          {document.title}
        </h1>
        <p className="mt-4 text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-7 sm:leading-8 max-w-3xl">
          {document.summary}
        </p>
        <p className="mt-4 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Last updated: {document.lastUpdated}
        </p>
      </header>

      <div className="space-y-4 sm:space-y-5 mt-6 sm:mt-8">
        {document.sections.map((section) => (
          <article
            key={section.heading}
            className="space-y-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/70 shadow-sm p-4 sm:p-6"
          >
            <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-50">
              {section.heading}
            </h2>
            {section.paragraphs.map((paragraph) => (
              <p
                key={paragraph}
                className="text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-7 sm:leading-8 tracking-[0.005em]"
              >
                {paragraph}
              </p>
            ))}
          </article>
        ))}
      </div>

      <aside className="mt-8 sm:mt-10 rounded-xl border border-amber-300/70 dark:border-amber-300/35 bg-amber-50 dark:bg-amber-200/10 px-4 sm:px-5 py-4 text-xs sm:text-sm leading-relaxed text-amber-900 dark:text-amber-100">
        This content is provided for general informational purposes and does not constitute legal
        advice. For requirements specific to your business or jurisdiction, consult qualified legal
        counsel.
      </aside>
    </section>
  );
};

export default LegalPage;
