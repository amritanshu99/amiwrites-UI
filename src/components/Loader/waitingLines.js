export const waitingLines = [
  "Good things take time. Apparently, so does this.",
  "Making you wait. For character development.",
  "The pixels are making a dramatic entrance.",
  "Patience is a virtue. We're really testing yours.",
  "Just a moment. The universe has a lot of tabs open.",
];

export const getWaitingLine = () => {
  // Keep the first HTML paint and React handoff on the same punchline.
  const startupLine = typeof document !== "undefined"
    ? document.documentElement.dataset.loaderQuip
    : undefined;
  return waitingLines.includes(startupLine)
    ? startupLine
    : waitingLines[Math.floor(Math.random() * waitingLines.length)];
};
