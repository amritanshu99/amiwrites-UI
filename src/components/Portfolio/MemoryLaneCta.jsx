import React from "react";
import { FaImages } from "react-icons/fa";
import memoryLanePhotos from "../../data/memoryLanePhotos";

const publicAsset = (path) => `${process.env.PUBLIC_URL || ""}${path}`;
const ctaCollageUrl = publicAsset("/memory-lane/memory-lane-cta-collage.jpg");

export default function MemoryLaneCta({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open Memory Lane photo gallery"
      className="group relative isolate inline-flex min-h-[78px] w-full overflow-hidden rounded-[1.05rem] border border-white/30 bg-zinc-950 px-4 py-3 text-left text-white shadow-[0_16px_42px_rgba(15,23,42,0.2)] ring-1 ring-white/55 transition-all duration-500 hover:-translate-y-0.5 hover:scale-[1.01] hover:border-cyan-200/80 hover:shadow-[0_22px_58px_rgba(8,145,178,0.24)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/85 dark:border-white/15 dark:shadow-[0_20px_50px_rgba(0,0,0,0.38)] dark:ring-white/10 dark:hover:border-cyan-200/50 sm:min-h-[82px] sm:w-[19.5rem]"
    >
      <span className="absolute inset-0 z-0 bg-zinc-950" />

      <img
        src={ctaCollageUrl}
        alt=""
        aria-hidden="true"
        width="1600"
        height="640"
        loading="lazy"
        fetchPriority="auto"
        decoding="async"
        draggable="false"
        className="absolute inset-0 z-0 h-full w-full object-cover opacity-92 transition-transform duration-700 ease-out will-change-transform group-hover:scale-[1.07] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:translate-y-0"
      />

      <span className="absolute inset-0 z-0 bg-gradient-to-r from-black/88 via-black/62 to-black/24 transition-opacity duration-500 group-hover:opacity-95" />
      <span className="absolute inset-0 z-0 bg-gradient-to-t from-black/55 via-transparent to-white/10" />
      <span className="absolute inset-0 z-0 opacity-0 shadow-[inset_0_0_0_1px_rgba(103,232,249,0.42),inset_0_0_42px_rgba(34,211,238,0.26)] transition-opacity duration-500 group-hover:opacity-100" />

      <span className="relative z-10 flex min-w-0 flex-1 items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/16 text-cyan-100 shadow-[0_8px_22px_rgba(0,0,0,0.24)] ring-1 ring-white/24 backdrop-blur-md transition-all duration-500 group-hover:scale-105 group-hover:bg-cyan-200/18">
          <FaImages className="text-sm" />
        </span>
        <span className="min-w-0">
          <span className="block text-base font-bold leading-tight tracking-normal text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]">
            Memory Lane
          </span>
          <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-100/82">
            Photo gallery
          </span>
        </span>
      </span>

      <span className="relative z-10 ml-2 self-end rounded-full bg-white/14 px-2 py-0.5 text-[11px] font-semibold text-white/86 ring-1 ring-white/18 backdrop-blur-md transition-all duration-500 group-hover:bg-cyan-200/16 group-hover:text-cyan-50">
        {memoryLanePhotos.length}
      </span>
    </button>
  );
}
