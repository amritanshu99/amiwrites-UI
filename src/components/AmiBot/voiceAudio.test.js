import { speechChunks } from "./voiceAudio";

test("spoken replies preserve words while removing Markdown and URLs", () => {
  expect(speechChunks("## Hello **Amrit**. Read [my profile](https://example.com)." ).join(" ")).toBe("Hello Amrit . Read my profile.");
});

test("long replies including unbroken strings respect the speech API limit", () => {
  const text = `${"A sentence about AmiVerse. ".repeat(100)}${"x".repeat(900)}`;
  const chunks = speechChunks(text);
  expect(chunks.length).toBeGreaterThan(2);
  expect(chunks.every((chunk) => chunk.length <= 400 && chunk.length > 0)).toBe(true);
  expect(chunks.join("").match(/x/g)).toHaveLength(900);
});
