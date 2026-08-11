import React, { useCallback, useRef } from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import HeroPixelDistortion from "./HeroPixelDistortion";

const Harness = ({ enabled = true }) => {
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const setImageRef = useCallback((image) => {
    if (!image) return;

    Object.defineProperties(image, {
      complete: { configurable: true, value: true },
      naturalHeight: { configurable: true, value: 400 },
      naturalWidth: { configurable: true, value: 600 },
      offsetHeight: { configurable: true, value: 200 },
      offsetLeft: { configurable: true, value: 100 },
      offsetTop: { configurable: true, value: 10 },
      offsetWidth: { configurable: true, value: 300 },
    });
    imageRef.current = image;
  }, []);

  return (
    <div ref={containerRef}>
      <img
        ref={setImageRef}
        src="/portrait.png"
        alt="Portrait"
        style={{ objectFit: "cover", objectPosition: "50% 50%" }}
      />
      <HeroPixelDistortion
        containerRef={containerRef}
        enabled={enabled}
        imageRef={imageRef}
        imageUrl="/portrait.png"
      />
    </div>
  );
};

describe("HeroPixelDistortion lifecycle", () => {
  let animationFrames;
  let canvasContext;
  let resizeObservers;

  beforeEach(() => {
    animationFrames = new Map();
    resizeObservers = [];
    canvasContext = {
      clearRect: jest.fn(),
      drawImage: jest.fn(),
      imageSmoothingEnabled: true,
      setTransform: jest.fn(),
    };

    jest
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue(canvasContext);
    jest
      .spyOn(HTMLCanvasElement.prototype, "getBoundingClientRect")
      .mockReturnValue({
        bottom: 210,
        height: 200,
        left: 100,
        right: 400,
        top: 10,
        width: 300,
        x: 100,
        y: 10,
      });

    let nextFrameId = 0;
    jest
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((callback) => {
        nextFrameId += 1;
        animationFrames.set(nextFrameId, callback);
        return nextFrameId;
      });
    jest
      .spyOn(window, "cancelAnimationFrame")
      .mockImplementation((frameId) => animationFrames.delete(frameId));

    Object.defineProperty(window, "devicePixelRatio", {
      configurable: true,
      value: 3,
    });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: jest.fn(() => ({
        addEventListener: jest.fn(),
        addListener: jest.fn(),
        matches: true,
        removeEventListener: jest.fn(),
        removeListener: jest.fn(),
      })),
    });

    global.ResizeObserver = class ResizeObserverMock {
      constructor() {
        this.disconnect = jest.fn();
        this.observe = jest.fn();
        resizeObservers.push(this);
      }
    };
  });

  afterEach(() => {
    cleanup();
    delete global.ResizeObserver;
    jest.restoreAllMocks();
  });

  it("aligns a DPR-capped canvas, renders the intro, and releases work", () => {
    const view = render(<Harness />);
    const canvas = screen.getByTestId("hero-pixel-distortion");

    expect(canvas).toHaveAttribute("data-ready", "true");
    expect(canvas).toHaveAttribute("data-active", "false");
    expect(canvas).toHaveAttribute("aria-hidden", "true");
    expect(canvas).toHaveStyle({
      height: "200px",
      left: "100px",
      top: "10px",
      width: "300px",
    });
    expect(canvas).toHaveAttribute("width", "600");
    expect(canvas).toHaveAttribute("height", "400");
    expect(resizeObservers[0].observe).toHaveBeenCalledTimes(2);

    const firstFrame = animationFrames.entries().next().value;
    expect(firstFrame).toBeDefined();

    act(() => {
      animationFrames.delete(firstFrame[0]);
      firstFrame[1](16);
    });

    expect(canvas).toHaveAttribute("data-active", "true");
    expect(canvasContext.drawImage).toHaveBeenCalled();
    expect(animationFrames.size).toBeGreaterThan(0);

    view.unmount();

    expect(window.cancelAnimationFrame).toHaveBeenCalled();
    expect(resizeObservers[0].disconnect).toHaveBeenCalled();
    expect(canvas).toHaveAttribute("data-ready", "false");
  });

  it("leaves the semantic image alone when animation is disabled", () => {
    render(<Harness enabled={false} />);

    expect(screen.getByRole("img", { name: "Portrait" })).toBeInTheDocument();
    expect(screen.getByTestId("hero-pixel-distortion")).toHaveAttribute(
      "data-ready",
      "false",
    );
    expect(HTMLCanvasElement.prototype.getContext).not.toHaveBeenCalled();
  });

  it("uses a lighter backing canvas on coarse-pointer devices", () => {
    window.matchMedia.mockImplementation(() => ({
      addEventListener: jest.fn(),
      addListener: jest.fn(),
      matches: false,
      removeEventListener: jest.fn(),
      removeListener: jest.fn(),
    }));

    render(<Harness />);

    expect(screen.getByTestId("hero-pixel-distortion")).toHaveAttribute(
      "width",
      "300",
    );
    expect(screen.getByTestId("hero-pixel-distortion")).toHaveAttribute(
      "height",
      "200",
    );
  });
});
