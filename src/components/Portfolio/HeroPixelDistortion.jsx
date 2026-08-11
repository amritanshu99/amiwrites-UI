import { useEffect, useRef } from "react";

const GRID_SIZE = 15;
const POINTER_RADIUS = 0.13;
const POINTER_STRENGTH = 0.15;
const RELAXATION = 0.9;
const MAX_DEVICE_PIXEL_RATIO = 2;
const FRAME_DURATION_MS = 1000 / 60;
const SETTLED_OFFSET_PX = 0.08;

const clamp = (value, minimum, maximum) =>
  Math.max(minimum, Math.min(value, maximum));

const resolveObjectPosition = (position, freeSpace, axis) => {
  const normalizedPosition = position?.toLowerCase() || "center";
  const keywordPositions =
    axis === "x"
      ? { left: 0, center: 0.5, right: 1 }
      : { top: 0, center: 0.5, bottom: 1 };

  if (normalizedPosition in keywordPositions) {
    return freeSpace * keywordPositions[normalizedPosition];
  }

  if (normalizedPosition.endsWith("%")) {
    return freeSpace * (parseFloat(normalizedPosition) / 100);
  }

  if (normalizedPosition.endsWith("px")) {
    return parseFloat(normalizedPosition);
  }

  return freeSpace * 0.5;
};

const parseObjectPosition = (objectPosition = "50% 50%") => {
  const positions = objectPosition.trim().split(/\s+/).filter(Boolean);

  if (positions.length === 1) {
    if (["top", "bottom"].includes(positions[0].toLowerCase())) {
      return ["center", positions[0]];
    }

    return [positions[0], "center"];
  }

  return [positions[0], positions[1]];
};

export const getObjectFitRect = ({
  containerHeight,
  containerWidth,
  imageHeight,
  imageWidth,
  objectFit = "fill",
  objectPosition = "50% 50%",
}) => {
  if (
    containerWidth <= 0 ||
    containerHeight <= 0 ||
    imageWidth <= 0 ||
    imageHeight <= 0
  ) {
    return { height: 0, width: 0, x: 0, y: 0 };
  }

  let width = containerWidth;
  let height = containerHeight;

  if (objectFit !== "fill") {
    const containScale = Math.min(
      containerWidth / imageWidth,
      containerHeight / imageHeight,
    );
    const coverScale = Math.max(
      containerWidth / imageWidth,
      containerHeight / imageHeight,
    );
    const naturalScale = Math.min(1, containScale);
    const scale =
      objectFit === "cover"
        ? coverScale
        : objectFit === "none"
          ? 1
          : objectFit === "scale-down"
            ? naturalScale
            : containScale;

    width = imageWidth * scale;
    height = imageHeight * scale;
  }

  const [positionX, positionY] = parseObjectPosition(objectPosition);

  return {
    height,
    width,
    x: resolveObjectPosition(positionX, containerWidth - width, "x"),
    y: resolveObjectPosition(positionY, containerHeight - height, "y"),
  };
};

export const applyPointerImpulse = ({
  field,
  gridSize = GRID_SIZE,
  height,
  pointerX,
  pointerY,
  radius = POINTER_RADIUS,
  strength = POINTER_STRENGTH,
  velocityX,
  velocityY,
  width,
}) => {
  if (!field || width <= 0 || height <= 0) return 0;

  const gridPointerX = (pointerX / width) * gridSize;
  const gridPointerY = (pointerY / height) * gridSize;
  const maximumDistance = gridSize * radius;
  const maximumDistanceSquared = maximumDistance ** 2;
  const aspect = height / width;
  const maximumOffset = Math.min(width, height) * 0.14;
  let strongestOffset = 0;

  for (let row = 0; row < gridSize; row += 1) {
    for (let column = 0; column < gridSize; column += 1) {
      const deltaX = gridPointerX - (column + 0.5);
      const deltaY = gridPointerY - (row + 0.5);
      const distanceSquared = deltaX ** 2 / aspect + deltaY ** 2;

      if (distanceSquared >= maximumDistanceSquared) continue;

      const fieldIndex = (row * gridSize + column) * 2;
      const power = clamp(
        maximumDistance / Math.sqrt(Math.max(distanceSquared, 0.01)),
        0,
        10,
      );
      const impulseScale = strength * 2 * power;

      field[fieldIndex] = clamp(
        field[fieldIndex] + velocityX * impulseScale,
        -maximumOffset,
        maximumOffset,
      );
      field[fieldIndex + 1] = clamp(
        field[fieldIndex + 1] + velocityY * impulseScale,
        -maximumOffset,
        maximumOffset,
      );
      strongestOffset = Math.max(
        strongestOffset,
        Math.abs(field[fieldIndex]),
        Math.abs(field[fieldIndex + 1]),
      );
    }
  }

  return strongestOffset;
};

export const relaxPixelField = (
  field,
  frameScale = 1,
  relaxation = RELAXATION,
) => {
  const decay = relaxation ** frameScale;
  let strongestOffset = 0;

  for (let index = 0; index < field.length; index += 1) {
    const nextOffset = field[index] * decay;
    field[index] =
      Math.abs(nextOffset) < SETTLED_OFFSET_PX ? 0 : nextOffset;
    strongestOffset = Math.max(strongestOffset, Math.abs(field[index]));
  }

  return strongestOffset;
};

const seedIntroDistortion = (field, width, height) => {
  const amplitude = clamp(Math.min(width, height) * 0.035, 12, 30);

  for (let index = 0; index < field.length; index += 2) {
    const cell = index / 2 + 1;
    field[index] = Math.sin(cell * 12.9898) * amplitude;
    field[index + 1] = Math.cos(cell * 7.233) * amplitude;
  }
};

const HeroPixelDistortion = ({
  containerRef,
  enabled,
  imageRef,
  imageUrl,
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const image = imageRef.current;

    if (!enabled || !canvas || !container || !image || !imageUrl) {
      if (canvas) {
        canvas.dataset.active = "false";
        canvas.dataset.ready = "false";
      }
      return undefined;
    }

    const context = canvas.getContext("2d", { alpha: true });
    const sourceCanvas = document.createElement("canvas");
    const sourceContext = sourceCanvas.getContext("2d", { alpha: true });

    if (!context || !sourceContext) return undefined;

    const field = new Float32Array(GRID_SIZE * GRID_SIZE * 2);
    const finePointerQuery = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    );
    let animationFrame = null;
    let resizeFrame = null;
    let lastFrameTime = null;
    let previousPointer = null;
    let canvasWidth = 0;
    let canvasHeight = 0;
    let devicePixelRatio = 1;
    let compositionSignature = "";
    let effectIsVisible = true;
    let introHasPlayed = false;
    let disposed = false;

    const setEffectActive = (isActive) => {
      canvas.dataset.active = isActive ? "true" : "false";
    };

    const drawDistortedImage = () => {
      const pixelWidth = canvas.width;
      const pixelHeight = canvas.height;

      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, pixelWidth, pixelHeight);
      context.imageSmoothingEnabled = true;

      for (let row = 0; row < GRID_SIZE; row += 1) {
        const destinationY = Math.round((row / GRID_SIZE) * pixelHeight);
        const destinationBottom = Math.round(
          ((row + 1) / GRID_SIZE) * pixelHeight,
        );
        const tileHeight = destinationBottom - destinationY;

        for (let column = 0; column < GRID_SIZE; column += 1) {
          const destinationX = Math.round(
            (column / GRID_SIZE) * pixelWidth,
          );
          const destinationRight = Math.round(
            ((column + 1) / GRID_SIZE) * pixelWidth,
          );
          const tileWidth = destinationRight - destinationX;
          const fieldIndex = (row * GRID_SIZE + column) * 2;
          const sourceX =
            destinationX - field[fieldIndex] * devicePixelRatio;
          const sourceY =
            destinationY - field[fieldIndex + 1] * devicePixelRatio;

          context.drawImage(
            sourceCanvas,
            sourceX,
            sourceY,
            tileWidth,
            tileHeight,
            destinationX,
            destinationY,
            tileWidth,
            tileHeight,
          );
        }
      }
    };

    const queueAnimation = () => {
      if (
        animationFrame === null &&
        effectIsVisible &&
        !document.hidden &&
        !disposed
      ) {
        animationFrame = window.requestAnimationFrame(renderFrame);
      }
    };

    function renderFrame(timestamp) {
      animationFrame = null;
      if (disposed || !effectIsVisible || document.hidden) return;

      const elapsed =
        lastFrameTime === null
          ? FRAME_DURATION_MS
          : clamp(timestamp - lastFrameTime, 1, 64);
      lastFrameTime = timestamp;
      const strongestOffset = relaxPixelField(
        field,
        elapsed / FRAME_DURATION_MS,
      );

      drawDistortedImage();
      setEffectActive(strongestOffset > SETTLED_OFFSET_PX);

      if (strongestOffset > SETTLED_OFFSET_PX) queueAnimation();
    }

    const syncCanvasToImage = () => {
      if (disposed || !image.naturalWidth || !image.naturalHeight) return;

      const width = image.offsetWidth;
      const height = image.offsetHeight;

      if (width <= 0 || height <= 0) return;

      const imageStyles = window.getComputedStyle(image);
      const nextDevicePixelRatio = Math.min(
        window.devicePixelRatio || 1,
        finePointerQuery.matches ? MAX_DEVICE_PIXEL_RATIO : 1,
      );
      const nextCompositionSignature = [
        width,
        height,
        image.naturalWidth,
        image.naturalHeight,
        imageStyles.objectFit,
        imageStyles.objectPosition,
        nextDevicePixelRatio,
      ].join(":");

      if (
        canvas.dataset.ready === "true" &&
        compositionSignature === nextCompositionSignature
      ) {
        return;
      }

      canvasWidth = width;
      canvasHeight = height;
      devicePixelRatio = nextDevicePixelRatio;
      compositionSignature = nextCompositionSignature;

      canvas.style.left = `${image.offsetLeft}px`;
      canvas.style.top = `${image.offsetTop}px`;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.width = Math.max(1, Math.round(width * devicePixelRatio));
      canvas.height = Math.max(1, Math.round(height * devicePixelRatio));
      sourceCanvas.width = canvas.width;
      sourceCanvas.height = canvas.height;

      const objectRect = getObjectFitRect({
        containerHeight: height,
        containerWidth: width,
        imageHeight: image.naturalHeight,
        imageWidth: image.naturalWidth,
        objectFit: imageStyles.objectFit,
        objectPosition: imageStyles.objectPosition,
      });

      sourceContext.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      sourceContext.clearRect(0, 0, width, height);
      sourceContext.drawImage(
        image,
        objectRect.x,
        objectRect.y,
        objectRect.width,
        objectRect.height,
      );

      field.fill(0);
      setEffectActive(false);
      canvas.dataset.ready = "true";

      if (!introHasPlayed) {
        introHasPlayed = true;
        seedIntroDistortion(field, width, height);
        lastFrameTime = null;
        queueAnimation();
      }
    };

    const queueResize = () => {
      if (resizeFrame !== null) return;

      resizeFrame = window.requestAnimationFrame(() => {
        resizeFrame = null;
        syncCanvasToImage();
      });
    };

    const handlePointerMove = (event) => {
      if (
        !finePointerQuery.matches ||
        event.pointerType === "touch" ||
        canvasWidth <= 0 ||
        canvasHeight <= 0
      ) {
        previousPointer = null;
        return;
      }

      const canvasRect = canvas.getBoundingClientRect();
      const pointerX = event.clientX - canvasRect.left;
      const pointerY = event.clientY - canvasRect.top;

      if (
        pointerX < 0 ||
        pointerX > canvasRect.width ||
        pointerY < 0 ||
        pointerY > canvasRect.height
      ) {
        previousPointer = null;
        return;
      }

      if (!previousPointer) {
        previousPointer = { x: pointerX, y: pointerY };
        return;
      }

      const scaleX = canvasWidth / canvasRect.width;
      const scaleY = canvasHeight / canvasRect.height;
      const velocityX = clamp(
        (pointerX - previousPointer.x) * scaleX,
        -48,
        48,
      );
      const velocityY = clamp(
        (pointerY - previousPointer.y) * scaleY,
        -48,
        48,
      );
      previousPointer = { x: pointerX, y: pointerY };

      const strongestOffset = applyPointerImpulse({
        field,
        height: canvasHeight,
        pointerX: pointerX * scaleX,
        pointerY: pointerY * scaleY,
        velocityX,
        velocityY,
        width: canvasWidth,
      });

      if (strongestOffset > SETTLED_OFFSET_PX) {
        lastFrameTime = null;
        setEffectActive(true);
        queueAnimation();
      }
    };

    const resetPointer = () => {
      previousPointer = null;
    };

    const handlePointerSupportChange = () => {
      if (!finePointerQuery.matches) resetPointer();
      queueResize();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animationFrame !== null) {
          window.cancelAnimationFrame(animationFrame);
          animationFrame = null;
        }
        return;
      }

      lastFrameTime = null;
      queueAnimation();
    };

    const resizeObserver =
      typeof ResizeObserver === "function"
        ? new ResizeObserver(queueResize)
        : null;
    const intersectionObserver =
      typeof IntersectionObserver === "function"
        ? new IntersectionObserver(([entry]) => {
            effectIsVisible = entry.isIntersecting;

            if (!effectIsVisible && animationFrame !== null) {
              window.cancelAnimationFrame(animationFrame);
              animationFrame = null;
            } else if (effectIsVisible) {
              lastFrameTime = null;
              queueAnimation();
            }
          })
        : null;

    const initialize = () => {
      if (disposed) return;
      syncCanvasToImage();
      resizeObserver?.observe(container);
      resizeObserver?.observe(image);
      intersectionObserver?.observe(container);
    };

    container.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    container.addEventListener("pointerleave", resetPointer);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("resize", queueResize, { passive: true });

    if (finePointerQuery.addEventListener) {
      finePointerQuery.addEventListener("change", handlePointerSupportChange);
    } else {
      finePointerQuery.addListener(handlePointerSupportChange);
    }

    if (image.complete && image.naturalWidth > 0) {
      initialize();
    } else {
      image.addEventListener("load", initialize, { once: true });
    }

    return () => {
      disposed = true;
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerleave", resetPointer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("resize", queueResize);
      image.removeEventListener("load", initialize);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();

      if (finePointerQuery.removeEventListener) {
        finePointerQuery.removeEventListener(
          "change",
          handlePointerSupportChange,
        );
      } else {
        finePointerQuery.removeListener(handlePointerSupportChange);
      }

      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }

      if (resizeFrame !== null) window.cancelAnimationFrame(resizeFrame);

      canvas.dataset.active = "false";
      canvas.dataset.ready = "false";
      canvas.width = 1;
      canvas.height = 1;
      sourceCanvas.width = 1;
      sourceCanvas.height = 1;
    };
  }, [containerRef, enabled, imageRef, imageUrl]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-active="false"
      data-ready="false"
      data-testid="hero-pixel-distortion"
      className="portfolio-hero-pixels pointer-events-none absolute max-w-none"
    />
  );
};

export default HeroPixelDistortion;
