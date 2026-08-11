import { Link, useLocation } from "react-router-dom";

const NotFound = () => {
  const { pathname } = useLocation();

  return (
    <section className="flex min-h-[70svh] items-center justify-center bg-slate-50 px-5 py-16 text-slate-950 dark:bg-black dark:text-white">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-zinc-800 dark:bg-zinc-950 sm:p-12">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-700 dark:text-cyan-300">
          Error 404
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
          This page is outside the AmiVerse.
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600 dark:text-zinc-300">
          No page exists at <span className="font-semibold">{pathname}</span>.
          Return to Amritanshu Mishra&apos;s portfolio or browse his latest writing.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white hover:bg-sky-800 dark:bg-cyan-300 dark:text-slate-950 dark:hover:bg-cyan-200"
          >
            View portfolio
          </Link>
          <Link
            to="/blogs"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 px-5 py-2.5 text-sm font-bold hover:border-sky-300 hover:bg-sky-50 dark:border-zinc-700 dark:hover:border-cyan-300 dark:hover:bg-zinc-900"
          >
            Read the blog
          </Link>
        </div>
      </div>
    </section>
  );
};

export default NotFound;
