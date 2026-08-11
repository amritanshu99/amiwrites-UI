const test = require("node:test");
const assert = require("node:assert/strict");
const { renderPage } = require("./generate-seo-pages");

const template = `<!doctype html><html><head>
  <title>Home</title>
  <meta name="title" content="Home">
  <meta name="description" content="Home description">
  <meta name="robots" content="index, follow">
  <meta property="og:title" content="Home">
  <meta property="og:description" content="Home description">
  <meta property="og:url" content="https://www.amiverse.in/">
  <meta property="og:type" content="website">
  <meta property="og:image" content="https://www.amiverse.in/og-image.jpg">
  <meta property="og:image:alt" content="Home">
  <meta name="twitter:title" content="Home">
  <meta name="twitter:description" content="Home description">
  <meta name="twitter:url" content="https://www.amiverse.in/">
  <meta name="twitter:image" content="https://www.amiverse.in/og-image.jpg">
  <meta name="twitter:image:alt" content="Home">
  <script id="seo-structured-data" type="application/ld+json">{}</script>
</head><body><noscript><!-- SEO_FALLBACK_START -->old<!-- SEO_FALLBACK_END --></noscript></body></html>`;

test("renders a blog snapshot with final metadata, article schema, and crawlable fallback", () => {
  const html = renderPage(template, {
    pathname: "/blogs/post-1",
    config: {
      title: "A Useful Post | AmiVerse Blog",
      description: "A practical article about React and AI.",
      schemaType: "BlogPosting",
    },
    blog: {
      _id: "post-1",
      title: "A Useful Post",
      date: "2026-08-01T00:00:00.000Z",
      words: 500,
    },
  });

  assert.match(html, /<title>A Useful Post \| AmiVerse Blog<\/title>/);
  assert.match(html, /rel="canonical" href="https:\/\/www\.amiverse\.in\/blogs\/post-1"/);
  assert.match(html, /"@type":"BlogPosting"/);
  assert.match(html, /"datePublished":"2026-08-01T00:00:00\.000Z"/);
  assert.match(html, /By Amritanshu Mishra/);
  assert.doesNotMatch(html, /Home description/);
});
