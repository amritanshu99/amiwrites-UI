const seoRoutes = require("../src/config/seoRoutes.json");

const SITE_URL = "https://www.amiverse.in";
const DEFAULT_API_URL = "https://amiwrites-backend-app-2lp5.onrender.com";
const MAX_BLOG_PAGES = 100;
const BLOG_PAGE_SIZE = 50;

const indexableRoutes = Object.entries(seoRoutes)
  .filter(([path, config]) => path !== "/not-found" && !config.noindex)
  .map(([path, config]) => ({ path, ...config }));

const normalizeApiUrl = (value) => String(value || DEFAULT_API_URL).replace(/\/+$/, "");

const requestJson = async (url, timeoutMs = 8000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = new Error(`SEO content request failed with ${response.status}`);
      error.status = response.status;
      throw error;
    }

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
};

const fetchPaginatedBlogs = async (apiUrl) => {
  const blogs = [];

  for (let page = 1; page <= MAX_BLOG_PAGES; page += 1) {
    const url = new URL("/api/blogs", `${apiUrl}/`);
    url.searchParams.set("page", String(page));
    url.searchParams.set("limit", String(BLOG_PAGE_SIZE));
    url.searchParams.set("sort", "latest");

    const payload = await requestJson(url.toString());
    const pageBlogs = Array.isArray(payload?.blogs) ? payload.blogs : [];
    blogs.push(...pageBlogs);

    if (!payload?.hasMore || pageBlogs.length === 0) break;
  }

  return blogs;
};

const fetchAllBlogs = async ({ apiUrl } = {}) => {
  const baseUrl = normalizeApiUrl(
    apiUrl || process.env.SEO_BLOG_API_URL || process.env.REACT_APP_API_URL,
  );

  try {
    const payload = await requestJson(`${baseUrl}/api/blogs/seo-index`);
    const blogs = Array.isArray(payload) ? payload : payload?.blogs;
    if (Array.isArray(blogs)) return blogs;
  } catch (error) {
    // Before the dedicated route is deployed, Express can match "seo-index"
    // as the legacy /:id route and answer 400 instead of 404.
    if (error?.status !== 400 && error?.status !== 404) throw error;
  }

  return fetchPaginatedBlogs(baseUrl);
};

const blogPath = (blog) => `/blogs/${encodeURIComponent(String(blog?._id || ""))}`;

const validDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const blogDate = (blog) =>
  validDate(blog?.updatedAt) ||
  validDate(blog?.publishedAt) ||
  validDate(blog?.date) ||
  validDate(blog?.createdAt);

const stripHtml = (value = "") =>
  String(value)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .trim();

const escapeXml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const uniqueBlogs = (blogs = []) => {
  const seen = new Set();

  return blogs.filter((blog) => {
    const id = String(blog?._id || "").trim();
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
};

const buildSitemapXml = (blogs = []) => {
  const staticUrls = indexableRoutes.map(({ path }) => {
    const loc = path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path}`;
    return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n  </url>`;
  });

  const blogUrls = uniqueBlogs(blogs).map((blog) => {
    const loc = `${SITE_URL}${blogPath(blog)}`;
    const lastModified = blogDate(blog);
    const lastmod = lastModified
      ? `\n    <lastmod>${lastModified.toISOString()}</lastmod>`
      : "";
    return `  <url>\n    <loc>${escapeXml(loc)}</loc>${lastmod}\n  </url>`;
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...staticUrls,
    ...blogUrls,
    "</urlset>",
    "",
  ].join("\n");
};

const buildRssXml = (blogs = []) => {
  const datedBlogs = uniqueBlogs(blogs)
    .sort((left, right) => (blogDate(right)?.getTime() || 0) - (blogDate(left)?.getTime() || 0))
    .slice(0, 50);
  const lastBuildDate = blogDate(datedBlogs[0]) || new Date();
  const items = datedBlogs.map((blog) => {
    const link = `${SITE_URL}${blogPath(blog)}`;
    const description = stripHtml(blog.content || blog.description || "").slice(0, 500);
    const published = blogDate(blog);

    return [
      "    <item>",
      `      <title>${escapeXml(blog.title || "AmiVerse Blog")}</title>`,
      `      <link>${escapeXml(link)}</link>`,
      `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
      ...(published ? [`      <pubDate>${published.toUTCString()}</pubDate>`] : []),
      ...(description
        ? [`      <description>${escapeXml(description)}</description>`]
        : []),
      "    </item>",
    ].join("\n");
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    "    <title>AmiVerse Blog by Amritanshu Mishra</title>",
    `    <link>${SITE_URL}/blogs</link>`,
    "    <description>Software engineering, AI, React, Node.js, and reinforcement learning articles by Amritanshu Mishra.</description>",
    "    <language>en-IN</language>",
    `    <lastBuildDate>${lastBuildDate.toUTCString()}</lastBuildDate>`,
    `    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />`,
    ...items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
};

module.exports = {
  SITE_URL,
  blogDate,
  blogPath,
  buildRssXml,
  buildSitemapXml,
  escapeXml,
  fetchAllBlogs,
  indexableRoutes,
  stripHtml,
};
