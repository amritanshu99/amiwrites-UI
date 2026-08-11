import { sanitizeBlogHtml, sanitizedHtmlToText } from "./sanitizeHtml";

test("removes executable markup and unsafe URLs from blog HTML", () => {
  const dirtyHtml = `
    <h2 id="clobber" class="fixed inset-0 z-50">Safe heading</h2>
    <img src="x" onerror="window.__xss = true" style="position:fixed">
    <a href="javascript:alert(1)" target="_blank">Bad link</a>
    <a href="https://example.com/article" target="_blank">Good link</a>
    <script>window.__xss = true</script>
    <iframe srcdoc="<script>alert(1)</script>"></iframe>
  `;

  const cleanHtml = sanitizeBlogHtml(dirtyHtml);

  expect(cleanHtml).toContain("Safe heading");
  expect(cleanHtml).not.toMatch(/script|iframe|onerror|javascript:|style=|id=|class=/i);
  expect(cleanHtml).toContain('href="https://example.com/article"');
  expect(cleanHtml).toContain('rel="noopener noreferrer nofollow"');
  expect(sanitizedHtmlToText(cleanHtml)).toContain("Safe heading");
});

test("bounds malformed and non-string input", () => {
  expect(sanitizeBlogHtml({ unsafe: true })).toBe("");
  expect(sanitizeBlogHtml(`<p>${"x".repeat(1_100_000)}</p>`).length).toBeLessThanOrEqual(
    1_000_007,
  );
});

test("keeps article headings below the page h1 and validates image dimensions", () => {
  const cleanHtml = sanitizeBlogHtml(
    '<h1>Article section</h1><img src="/image.jpg" alt="Diagram" width="800" height="bad">',
  );

  expect(cleanHtml).toContain("<h2>Article section</h2>");
  expect(cleanHtml).not.toContain("<h1>");
  expect(cleanHtml).toContain('width="800"');
  expect(cleanHtml).not.toContain("height=");
});
