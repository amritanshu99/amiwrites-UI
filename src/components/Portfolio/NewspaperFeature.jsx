import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight, Expand, Minus, Plus, X } from "lucide-react";
import "./NewspaperFeature.css";

const clippingUrl = `${process.env.PUBLIC_URL || ""}/images/born-to-build-newspaper.jpg`;
const clippingAlt =
  "Dainik Jagran newspaper clipping about Amritanshu Mishra in Class VIII, dreaming of becoming an engineer and building the world's tallest building.";

export default function NewspaperFeature({ sectionRef }) {
  const dialogRef = useRef(null);
  const readerRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;

    const scrollContainer = document.querySelector(".h-screen.overflow-y-scroll");
    const targets = [document.body, scrollContainer].filter(Boolean);
    const previousOverflow = targets.map((element) => element.style.overflow);
    targets.forEach((element) => { element.style.overflow = "hidden"; });

    return () => {
      targets.forEach((element, index) => {
        element.style.overflow = previousOverflow[index];
      });
    };
  }, [isOpen]);

  const openReader = () => {
    setIsZoomed(false);
    dialogRef.current.showModal();
    setIsOpen(true);
    readerRef.current?.scrollTo?.({ top: 0, left: 0 });
  };

  return (
    <>
      <section
        id="origin-story"
        ref={sectionRef}
        aria-labelledby="origin-story-heading"
        className="newspaper-feature"
      >
        <div className="newspaper-feature__inner">
          <div className="newspaper-feature__masthead">
            <p>06 / Where it began</p>
            <span>A page from my story</span>
          </div>

          <div className="newspaper-feature__layout">
            <div className="newspaper-feature__story">
              <p className="newspaper-feature__eyebrow">
                A childhood dream. A lifelong pursuit.
              </p>
              <h2 id="origin-story-heading">
                Born to Build.<br />
                <em>Destined to Engineer.</em>
              </h2>
              <p className="newspaper-feature__intro">
                Before the first line of code, there was a schoolboy with a dream
                to build something extraordinary.
              </p>
              <p className="newspaper-feature__description">
                In Class VIII, I told Dainik Jagran that I wanted to become an
                engineer and build the world&apos;s tallest building. This clipping
                holds that early ambition &mdash; and the determination that still
                shapes everything I create.
              </p>

              <blockquote className="newspaper-feature__quote">
                <p lang="hi">“बनाना चाहता हूं दुनिया की सबसे ऊंची इमारत”</p>
                <p className="newspaper-feature__translation">
                  “I want to build the tallest building in the world.”
                </p>
                <cite>The dream, in print.</cite>
              </blockquote>

              <button
                type="button"
                className="newspaper-feature__read"
                onClick={openReader}
                aria-haspopup="dialog"
              >
                Read the clipping <ArrowUpRight size={18} aria-hidden="true" />
              </button>
              <p className="newspaper-feature__note">
                An original keepsake. The same drive to build.
              </p>
            </div>

            <figure className="newspaper-feature__artifact">
              <div className="newspaper-feature__frame">
                <div className="newspaper-feature__archive-label" aria-hidden="true">
                  <span>THE PERSONAL ARCHIVE</span><span>No. 01</span>
                </div>
                <button
                  type="button"
                  className="newspaper-feature__preview"
                  onClick={openReader}
                  aria-label="Enlarge the original newspaper clipping"
                  aria-haspopup="dialog"
                >
                  {imageFailed ? (
                    <span className="newspaper-feature__image-error">
                      The preview could not load. Open the clipping to try again.
                    </span>
                  ) : (
                    <img
                      src={clippingUrl}
                      alt={clippingAlt}
                      width="2448"
                      height="3264"
                      loading="lazy"
                      decoding="async"
                      fetchPriority="low"
                      onError={() => setImageFailed(true)}
                    />
                  )}
                  <span className="newspaper-feature__enlarge" aria-hidden="true">
                    <Expand size={15} /> View original
                  </span>
                </button>
                <figcaption className="newspaper-feature__caption">
                  <span><strong>Dainik Jagran</strong><span>Mathura · School days</span></span>
                  <span lang="hi" className="newspaper-feature__caption-hindi">मेरा सपना</span>
                </figcaption>
              </div>
              <p className="newspaper-feature__footnote">Small beginnings. An enduring ambition.</p>
            </figure>
          </div>
        </div>
      </section>

      {createPortal(
        <dialog
          ref={dialogRef}
          className="newspaper-reader"
          aria-labelledby="newspaper-reader-title"
          aria-describedby="newspaper-reader-description"
          onClose={() => setIsOpen(false)}
          onClick={(event) => {
            if (event.target === event.currentTarget) dialogRef.current.close();
          }}
        >
          <div className="newspaper-reader__panel">
            <header className="newspaper-reader__header">
              <div className="newspaper-reader__title">
                <h2 id="newspaper-reader-title">The dream, in print.</h2>
                <p id="newspaper-reader-description">Dainik Jagran · Original photograph</p>
              </div>
              <div className="newspaper-reader__actions">
                <button
                  type="button"
                  aria-label={isZoomed ? "Fit clipping to screen" : "Zoom in on clipping"}
                  aria-pressed={isZoomed}
                  onClick={() => setIsZoomed((zoomed) => !zoomed)}
                >
                  {isZoomed ? <Minus size={18} /> : <Plus size={18} />}
                  <span>{isZoomed ? "Fit" : "Zoom"}</span>
                </button>
                <button type="button" aria-label="Close newspaper viewer" onClick={() => dialogRef.current.close()}>
                  <X size={20} />
                </button>
              </div>
            </header>
            <div
              ref={readerRef}
              className="newspaper-reader__image-scroll"
              tabIndex={0}
              role="region"
              aria-label="Newspaper photograph. Scroll to read the full clipping."
            >
              {isOpen && (
                <img
                  src={clippingUrl}
                  alt={clippingAlt}
                  width="2448"
                  height="3264"
                  className={isZoomed ? "newspaper-reader__image is-zoomed" : "newspaper-reader__image"}
                />
              )}
            </div>
            <footer className="newspaper-reader__footer">
              <span>{isZoomed ? "Scroll to explore the original photograph." : "Zoom in for a closer look."}</span>
              <a href={clippingUrl} target="_blank" rel="noreferrer">Open full-size image <ArrowUpRight size={14} aria-hidden="true" /></a>
            </footer>
          </div>
        </dialog>,
        document.body,
      )}
    </>
  );
}
