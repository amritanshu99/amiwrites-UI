import React from "react";
import { Link, useParams } from "react-router-dom";
import { legalDocuments } from "../data/legalDocuments";

const LegalPage = () => {
  const { slug } = useParams();
  const document = legalDocuments[slug];

  if (!document) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-12 text-slate-800 dark:text-slate-200 sm:px-6 sm:py-14">
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
    <div className="w-full bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-black dark:via-black dark:to-black">
      <section className="mx-auto max-w-5xl px-4 py-10 text-slate-800 dark:text-slate-100 sm:px-6 sm:py-14">
        <header className="rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90 sm:p-8">
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">Legal</p>
          <h1 className="mt-2 text-2xl font-bold leading-tight text-slate-900 dark:text-white sm:text-4xl">
            {document.title}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-700 dark:text-slate-200 sm:text-base sm:leading-8">
            {document.summary}
          </p>
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
            Last updated: {document.lastUpdated}
          </p>
        </header>

        <div className="mt-6 space-y-4 sm:mt-8 sm:space-y-5">
          {document.sections.map((section) => (
            <article
              key={section.heading}
              className="space-y-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80 sm:p-6"
            >
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 sm:text-xl">
                {section.heading}
              </h2>
              {section.paragraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-sm leading-7 tracking-[0.005em] text-slate-700 dark:text-slate-200 sm:text-base sm:leading-8"
                >
                  {paragraph}
                </p>
              ))}
            </article>
          ))}
        </div>

        <aside className="mt-8 rounded-xl border border-amber-300/70 bg-amber-50 px-4 py-4 text-xs leading-relaxed text-amber-900 dark:border-amber-300/35 dark:bg-amber-200/10 dark:text-amber-100 sm:mt-10 sm:px-5 sm:text-sm">
          This content is provided for general informational purposes and does not constitute legal
          advice. For requirements specific to your business or jurisdiction, consult qualified legal
          counsel.
        </aside>
      </section>
    </div>
  );
};

export default LegalPage;
