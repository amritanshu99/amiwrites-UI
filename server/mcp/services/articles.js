const { z } = require("zod");
const { stripHtml, blogPath } = require("../../seoContent");
const { SITE_URL } = require("../config");
const { ContentError } = require("./errors");

const MAX_BYTES = 4 * 1024 * 1024;
const date = z.string().max(100).nullable().optional();
const blogSchema = z.object({
  _id: z.string().regex(/^[a-f\d]{24}$/i),
  slug: z.string().max(160).nullable().optional(), title: z.string().min(1).max(500),
  category: z.string().max(200).nullable().optional(), excerpt: z.string().max(5000).optional(),
  content: z.string().max(2 * 1024 * 1024).optional(),
  publishedAt: date, date, createdAt: date,
});
const indexSchema = z.object({ blogs: z.array(blogSchema).max(1000) });
const pageSchema = z.object({ blogs: z.array(blogSchema).max(50), hasMore: z.boolean() });

function publicationDate(blog) {
  const raw = blog.publishedAt || blog.date || blog.createdAt;
  if (!raw) return null;
  const time = Date.parse(raw);
  return Number.isFinite(time) ? new Date(time).toISOString() : null;
}

function isPublished(blog) {
  // Invalid explicit publication dates fail closed too.
  if (blog.publishedAt && (!Number.isFinite(Date.parse(blog.publishedAt)) || Date.parse(blog.publishedAt) > Date.now())) return false;
  const publishedAt = publicationDate(blog);
  return !publishedAt || Date.parse(publishedAt) <= Date.now();
}

function articleSummary(blog) {
  return {
    type: "article", slug: blog.slug && /^[a-z\d][a-z\d_-]*$/i.test(blog.slug) ? blog.slug : blog._id,
    id: blog._id, title: stripHtml(blog.title),
    summary: stripHtml(blog.excerpt || blog.content || "").slice(0, 600),
    url: SITE_URL + blogPath(blog), tags: blog.category ? [stripHtml(blog.category)] : [],
    publishedAt: publicationDate(blog),
  };
}

function createArticles(config, { fetchImpl = fetch, now = Date.now } = {}) {
  let cached;
  let pending;
  async function request(path, signal) {
    // Paths are constructed internally; neither MCP input nor API data can set an origin.
    const response = await fetchImpl(config.apiOrigin + path, {
      headers: { Accept: "application/json" }, redirect: "error", signal,
    });
    if (!response.ok) {
      await response.body?.cancel();
      const error = new ContentError("CONTENT_UNAVAILABLE", "Amiverse articles are temporarily unavailable. Please try again later.");
      error.status = response.status;
      throw error;
    }
    if (!response.headers.get("content-type")?.includes("application/json")) {
      await response.body?.cancel();
      throw new Error("Unexpected content type");
    }
    if (Number(response.headers.get("content-length")) > MAX_BYTES) {
      await response.body?.cancel();
      throw new Error("Upstream response too large");
    }
    const reader = response.body.getReader();
    const chunks = [];
    let length = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        length += value.length;
        if (length > MAX_BYTES) throw new Error("Upstream response too large");
        chunks.push(Buffer.from(value));
      }
      return JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } finally {
      await reader.cancel().catch(() => {});
      reader.releaseLock();
    }
  }

  async function load() {
    const signal = AbortSignal.timeout(config.timeoutMs);
    try {
      let blogs;
      let truncated = false;
      try {
        blogs = indexSchema.parse(await request("/api/blogs/seo-index", signal)).blogs;
        truncated = blogs.length === 1000;
      } catch (error) {
        if (![400, 404].includes(error.status)) throw error;
        // Compatibility with the existing backend before seo-index was deployed.
        // Same API as seoContent.js, but strictly bounded by time/pages/bytes.
        blogs = [];
        for (let page = 1; page <= 10; page += 1) {
          const payload = pageSchema.parse(await request(`/api/blogs?page=${page}&limit=50&sort=latest`, signal));
          blogs.push(...payload.blogs);
          truncated = payload.hasMore;
          if (!payload.hasMore || !payload.blogs.length) break;
        }
      }
      const seen = new Set();
      const results = blogs.filter((blog) => {
        if (!isPublished(blog) || seen.has(blog._id)) return false;
        seen.add(blog._id);
        return true;
      }).map(articleSummary);
      const slugCounts = new Map();
      for (const article of results) slugCounts.set(article.slug, (slugCounts.get(article.slug) || 0) + 1);
      for (const article of results) {
        // Always return identifiers that round-trip to exactly one public record.
        if (slugCounts.get(article.slug) > 1 || (seen.has(article.slug) && article.slug !== article.id)) article.slug = article.id;
      }
      return { results, truncated };
    } catch {
      throw new ContentError("CONTENT_UNAVAILABLE", "Amiverse articles are temporarily unavailable. Please try again later.");
    }
  }

  async function list() {
    if (cached && cached.expires > now()) return cached.data;
    if (!pending) pending = load().then((data) => {
      cached = { data, expires: now() + config.cacheSeconds * 1000 };
      return data;
    }).finally(() => { pending = undefined; });
    return pending;
  }

  async function get(slug) {
    const index = await list();
    const match = index.results.find((article) => article.id === slug) || index.results.find((article) => article.slug === slug);
    if (!match) throw new ContentError("NOT_FOUND", "Article not found in the public index. Use search_amiverse to find a valid slug or ID.");
    try {
      const blog = blogSchema.parse(await request(`/api/blogs/${match.id}`, AbortSignal.timeout(config.timeoutMs)));
      if (blog._id !== match.id || !isPublished(blog)) throw new ContentError("NOT_FOUND", "Article is no longer available.");
      const text = stripHtml(blog.content || blog.excerpt || "");
      return { ...articleSummary(blog), slug: match.slug, excerpt: text.slice(0, 6000), truncated: text.length > 6000 };
    } catch (error) {
      if (error.code === "NOT_FOUND" || error.status === 404) throw new ContentError("NOT_FOUND", "Article is no longer available.");
      throw new ContentError("CONTENT_UNAVAILABLE", "Amiverse article is temporarily unavailable. Please try again later.");
    }
  }
  return { list, get };
}

module.exports = { createArticles, articleSummary, isPublished };
