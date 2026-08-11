const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildRssXml,
  buildSitemapXml,
  fetchAllBlogs,
  stripHtml,
} = require("./seoContent");

test("blog lookup falls back to the legacy list endpoint on a 400 response", async () => {
  const originalFetch = global.fetch;
  const requestedUrls = [];

  global.fetch = async (url) => {
    requestedUrls.push(String(url));

    if (String(url).endsWith("/api/blogs/seo-index")) {
      return { ok: false, status: 400 };
    }

    return {
      ok: true,
      status: 200,
      json: async () => ({ blogs: [{ _id: "legacy-post" }], hasMore: false }),
    };
  };

  try {
    const blogs = await fetchAllBlogs({ apiUrl: "https://api.example.test" });
    assert.deepEqual(blogs, [{ _id: "legacy-post" }]);
    assert.equal(requestedUrls.length, 2);
    assert.match(requestedUrls[1], /\/api\/blogs\?page=1&limit=50&sort=latest$/);
  } finally {
    global.fetch = originalFetch;
  }
});

test("sitemap contains public routes and dated blog URLs but excludes private routes", () => {
  const xml = buildSitemapXml([
    {
      _id: "abc123",
      title: "A post",
      updatedAt: "2026-08-10T12:00:00.000Z",
    },
  ]);

  assert.match(xml, /https:\/\/www\.amiverse\.in\/legal\/privacy-policy/);
  assert.match(xml, /https:\/\/www\.amiverse\.in\/blogs\/abc123/);
  assert.match(xml, /2026-08-10T12:00:00\.000Z/);
  assert.doesNotMatch(xml, /add-blog|reset-password|not-found/);
});

test("RSS escapes titles and never includes raw HTML", () => {
  const xml = buildRssXml([
    {
      _id: "post-1",
      title: "React & AI <Guide>",
      content: "<p>Useful <strong>article</strong>.</p><script>alert(1)</script>",
      date: "2026-08-01T00:00:00.000Z",
    },
  ]);

  assert.match(xml, /React &amp; AI &lt;Guide&gt;/);
  assert.match(xml, /Useful article\./);
  assert.doesNotMatch(xml, /<strong>|<script>|alert\(1\)/);
});

test("stripHtml returns normalized plain text", () => {
  assert.equal(stripHtml("<h2>Hello&nbsp; world</h2>\n<p>Next</p>"), "Hello world Next");
});
