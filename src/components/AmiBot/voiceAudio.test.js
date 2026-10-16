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

test("browser voice uses shorter chunks without dropping long words", () => {
  const chunks = speechChunks(`${"AmiBot can speak. ".repeat(30)}${"x".repeat(350)}`, 160);
  expect(chunks.every((chunk) => chunk.length <= 160 && chunk.length > 0)).toBe(true);
  expect(chunks.join("").match(/x/g)).toHaveLength(350);
});

test("browser speech starts with the complete opening sentence before preparing the longer answer", () => {
  const reply = "Yes, I can help. Here is a longer explanation of how your voice conversation works, with the details you asked for.";
  const chunks = speechChunks(reply, 160, 96);
  expect(chunks[0]).toBe("Yes, I can help.");
  expect(chunks.join(" ")).toBe(reply);
  expect(chunks.slice(1).some((chunk) => chunk.length > 96)).toBe(true);
});

test("a long opening sentence fits the smaller first request without losing words", () => {
  const reply = "AmiBot explains how voice conversations work using the voice you recorded and generating each spoken answer directly on your device. Then it listens for your next question.";
  const chunks = speechChunks(reply, 160, 96);
  expect(chunks[0].length).toBeLessThanOrEqual(96);
  expect(chunks.every((chunk) => chunk.length <= 160 && chunk.length > 0)).toBe(true);
  expect(chunks.join(" ")).toBe(reply);
});

test("a smaller opening request preserves long unbroken text", () => {
  const chunks = speechChunks("x".repeat(450), 160, 96);
  expect(chunks.map((chunk) => chunk.length)).toEqual([96, 160, 160, 34]);
  expect(chunks.join("")).toBe("x".repeat(450));
});


test.each([32, 48])("small first chunks (%i characters) preserve an entire fifty-word answer", (firstLimit) => {
  const reply = "Amritanshu builds useful web applications with React and Node.js. He also works with artificial intelligence, natural language processing, and modern databases. His projects focus on practical features, reliable performance, and clear interfaces that help people solve everyday problems while learning about new tools and ideas in software engineering and development.";
  const chunks = speechChunks(reply, 160, firstLimit);
  expect(chunks[0].length).toBeLessThanOrEqual(firstLimit);
  expect(chunks.join(" ")).toBe(reply);
  expect(chunks.slice(1).some(chunk => chunk.length > firstLimit)).toBe(true);
});
