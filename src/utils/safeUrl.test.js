import { getSafeHttpsUrl, getSafeImageUrl } from "./safeUrl";

test("allows credential-free HTTPS destinations", () => {
  expect(getSafeHttpsUrl("https://example.com/story?q=react")).toBe(
    "https://example.com/story?q=react",
  );
  expect(getSafeHttpsUrl("https://user:password@example.com/story")).toBeNull();
});

test.each([
  `${"java"}script:alert(1)`,
  "data:text/html,<script>alert(1)</script>",
  "file:///etc/passwd",
  "http://example.com/insecure",
  "//example.com/protocol-relative",
  "not a URL",
])("rejects unsafe outbound URL %s", (value) => {
  expect(getSafeHttpsUrl(value)).toBeNull();
});

test("allows only local paths or HTTPS image URLs", () => {
  expect(getSafeImageUrl("/news/photo.jpg")).toBe("/news/photo.jpg");
  expect(getSafeImageUrl("https://cdn.example.com/photo.jpg")).toBe(
    "https://cdn.example.com/photo.jpg",
  );
  expect(getSafeImageUrl("data:image/svg+xml,<svg/>")).toBe("/og-image.jpg");
});
