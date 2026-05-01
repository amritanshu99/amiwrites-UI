import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  FaChevronLeft,
  FaChevronRight,
  FaImages,
  FaTimes,
} from "react-icons/fa";
import memoryLanePhotos from "../../data/memoryLanePhotos";

const publicAsset = (path) => `${process.env.PUBLIC_URL || ""}${path}`;
const isEscapeEvent = (event) =>
  event.key === "Escape" || event.key === "Esc" || event.code === "Escape";
const getAppScrollContainer = () =>
  document.querySelector(".h-screen.overflow-y-scroll");

const PhotoTile = React.memo(function PhotoTile({
  photo,
  index,
  isLoaded,
  onLoad,
  onOpen,
}) {
  return (
    <motion.button
      type="button"
      aria-label={`Open ${photo.title}`}
      onClick={() => onOpen(index)}
      className="group mb-4 block w-full break-inside-avoid overflow-hidden rounded-lg border border-white/12 bg-white/[0.06] text-left shadow-[0_16px_38px_rgba(0,0,0,0.26)] ring-1 ring-white/10 transition-all duration-300 hover:-translate-y-1 hover:border-white/24 hover:shadow-[0_24px_60px_rgba(0,0,0,0.38)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/70 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, delay: Math.min(index * 0.025, 0.28) }}
      style={{
        contentVisibility: "auto",
        containIntrinsicSize: `${photo.thumbWidth}px ${photo.thumbHeight}px`,
      }}
    >
      <span
        className="relative block w-full overflow-hidden bg-zinc-900"
        style={{ aspectRatio: `${photo.thumbWidth} / ${photo.thumbHeight}` }}
      >
        {!isLoaded && (
          <span className="absolute inset-0 animate-pulse bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-900" />
        )}
        <img
          src={publicAsset(photo.thumb)}
          alt={photo.alt}
          width={photo.thumbWidth}
          height={photo.thumbHeight}
          loading={index < 4 ? "eager" : "lazy"}
          fetchPriority={index < 2 ? "high" : "auto"}
          decoding="async"
          draggable="false"
          onLoad={() => onLoad(photo.id)}
          className={`absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.035] motion-reduce:transition-none motion-reduce:group-hover:scale-100 ${
            isLoaded ? "opacity-100 blur-0" : "opacity-0 blur-sm"
          }`}
        />
        <span className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/72 via-black/18 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-100" />
        <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-3">
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold tracking-normal text-white">
              {photo.title}
            </span>
            <span className="mt-0.5 block truncate text-xs font-medium text-white/72">
              {photo.dateLabel}
            </span>
          </span>
        </span>
      </span>
    </motion.button>
  );
});

export default function MemoryLaneGallery({ isOpen, onClose }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const [loadedPhotoIds, setLoadedPhotoIds] = useState(() => new Set());
  const prefersReducedMotion = useReducedMotion();
  const closeButtonRef = useRef(null);
  const galleryRef = useRef(null);
  const lastActiveElementRef = useRef(null);
  const previewCloseButtonRef = useRef(null);
  const activePhoto =
    activeIndex === null ? null : memoryLanePhotos[activeIndex];

  const markPhotoLoaded = useCallback((photoId) => {
    setLoadedPhotoIds((current) => {
      if (current.has(photoId)) return current;
      const next = new Set(current);
      next.add(photoId);
      return next;
    });
  }, []);

  const closeGallery = useCallback(() => {
    setActiveIndex(null);
    onClose();
  }, [onClose]);

  const openPhoto = useCallback((index) => {
    setActiveIndex(index);
  }, []);

  const closePreview = useCallback(() => {
    setActiveIndex(null);
  }, []);

  const showPrevious = useCallback(() => {
    setActiveIndex((current) =>
      current === null
        ? current
        : (current - 1 + memoryLanePhotos.length) % memoryLanePhotos.length,
    );
  }, []);

  const showNext = useCallback(() => {
    setActiveIndex((current) =>
      current === null ? current : (current + 1) % memoryLanePhotos.length,
    );
  }, []);

  const handleGalleryKeyDown = useCallback(
    (event) => {
      if (isEscapeEvent(event)) {
        event.preventDefault?.();
        event.stopPropagation?.();
        event.stopImmediatePropagation?.();
        event.nativeEvent?.stopImmediatePropagation?.();

        if (activeIndex !== null) {
          closePreview();
          return;
        }

        closeGallery();
        return;
      }

      if (activeIndex === null) return;

      if (event.key === "ArrowLeft") {
        event.preventDefault?.();
        event.stopPropagation?.();
        showPrevious();
      }

      if (event.key === "ArrowRight") {
        event.preventDefault?.();
        event.stopPropagation?.();
        showNext();
      }
    },
    [activeIndex, closeGallery, closePreview, showNext, showPrevious],
  );

  useEffect(() => {
    if (!isOpen) {
      setActiveIndex(null);
      return undefined;
    }

    lastActiveElementRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    return () => {
      lastActiveElementRef.current?.focus?.();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const timer = window.setTimeout(() => {
      if (activeIndex === null) {
        (closeButtonRef.current || galleryRef.current)?.focus();
        return;
      }

      previewCloseButtonRef.current?.focus();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [activeIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    const scrollContainer = getAppScrollContainer();
    const previousScrollContainerOverflowY = scrollContainer?.style.overflowY;

    document.body.style.overflow = "hidden";
    if (scrollContainer) {
      scrollContainer.style.overflowY = "hidden";
    }

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      if (scrollContainer) {
        scrollContainer.style.overflowY = previousScrollContainerOverflowY || "";
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;

    window.addEventListener("keydown", handleGalleryKeyDown, true);
    document.addEventListener("keydown", handleGalleryKeyDown, true);

    return () => {
      window.removeEventListener("keydown", handleGalleryKeyDown, true);
      document.removeEventListener("keydown", handleGalleryKeyDown, true);
    };
  }, [handleGalleryKeyDown, isOpen]);

  useEffect(() => {
    if (activeIndex === null) return undefined;

    const adjacentIndexes = [
      (activeIndex - 1 + memoryLanePhotos.length) % memoryLanePhotos.length,
      (activeIndex + 1) % memoryLanePhotos.length,
    ];
    const preloadAdjacentPhotos = () => {
      adjacentIndexes.forEach((index) => {
        const image = new Image();
        image.decoding = "async";
        image.src = publicAsset(memoryLanePhotos[index].large);
      });
    };

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(preloadAdjacentPhotos, {
        timeout: 900,
      });

      return () => window.cancelIdleCallback(idleId);
    }

    const preloadTimer = window.setTimeout(preloadAdjacentPhotos, 120);
    return () => window.clearTimeout(preloadTimer);
  }, [activeIndex]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[95] bg-zinc-950 text-white"
          ref={galleryRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="memory-lane-title"
          tabIndex={-1}
          onKeyDownCapture={handleGalleryKeyDown}
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.24,
            ease: "easeOut",
          }}
        >
          <div className="flex h-full flex-col overflow-hidden">
            <header className="shrink-0 border-b border-white/10 bg-zinc-950/88 px-4 py-4 shadow-[0_16px_46px_rgba(0,0,0,0.26)] backdrop-blur-2xl sm:px-6 md:px-10">
              <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-300/12 text-cyan-100 ring-1 ring-cyan-200/20">
                    <FaImages />
                  </span>
                  <div className="min-w-0">
                    <h2
                      id="memory-lane-title"
                      className="truncate text-xl font-semibold tracking-normal text-white sm:text-2xl"
                    >
                      Memory Lane
                    </h2>
                    <p className="truncate text-sm font-medium text-zinc-400">
                      {memoryLanePhotos.length} selected moments
                    </p>
                  </div>
                </div>

                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={closeGallery}
                  aria-label="Close Memory Lane"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/8 text-white shadow-sm transition-all duration-200 hover:bg-white/14 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/70"
                >
                  <FaTimes />
                </button>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 md:px-10 md:py-8">
              <div className="mx-auto max-w-7xl">
                <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 2xl:columns-4">
                  {memoryLanePhotos.map((photo, index) => (
                    <PhotoTile
                      key={photo.id}
                      photo={photo}
                      index={index}
                      isLoaded={loadedPhotoIds.has(photo.id)}
                      onLoad={markPhotoLoaded}
                      onOpen={openPhoto}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {activePhoto && (
              <motion.div
                className="fixed inset-0 z-[110] flex items-center justify-center bg-black/92 p-3 backdrop-blur-md sm:p-6"
                role="dialog"
                aria-modal="true"
                aria-label={activePhoto.title}
                onKeyDownCapture={handleGalleryKeyDown}
                initial={prefersReducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                onMouseDown={(event) => {
                  if (event.target === event.currentTarget) {
                    closePreview();
                  }
                }}
              >
                <button
                  ref={previewCloseButtonRef}
                  type="button"
                  onClick={closePreview}
                  aria-label="Close photo preview"
                  className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/10 text-white shadow-lg backdrop-blur transition-all duration-200 hover:bg-white/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/70"
                >
                  <FaTimes />
                </button>

                <button
                  type="button"
                  onClick={showPrevious}
                  aria-label="Previous photo"
                  className="absolute left-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/12 bg-white/10 text-white shadow-lg backdrop-blur transition-all duration-200 hover:bg-white/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/70 sm:left-5"
                >
                  <FaChevronLeft />
                </button>

                <figure className="flex h-full w-full max-w-6xl flex-col items-center justify-center gap-4">
                  <motion.img
                    key={activePhoto.id}
                    src={publicAsset(activePhoto.large)}
                    alt={activePhoto.alt}
                    width={activePhoto.width}
                    height={activePhoto.height}
                    loading="eager"
                    decoding="async"
                    className="max-h-[78vh] w-auto max-w-full rounded-lg object-contain shadow-[0_24px_80px_rgba(0,0,0,0.52)]"
                    initial={
                      prefersReducedMotion ? false : { opacity: 0, scale: 0.985 }
                    }
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.985 }}
                    transition={{
                      duration: prefersReducedMotion ? 0 : 0.22,
                      ease: "easeOut",
                    }}
                  />
                  <figcaption className="max-w-full text-center">
                    <p className="truncate text-base font-semibold text-white">
                      {activePhoto.title}
                    </p>
                    <p className="mt-1 text-sm text-white/62">
                      {activePhoto.dateLabel} . {activeIndex + 1} of{" "}
                      {memoryLanePhotos.length}
                    </p>
                  </figcaption>
                </figure>

                <button
                  type="button"
                  onClick={showNext}
                  aria-label="Next photo"
                  className="absolute right-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/12 bg-white/10 text-white shadow-lg backdrop-blur transition-all duration-200 hover:bg-white/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/70 sm:right-5"
                >
                  <FaChevronRight />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
