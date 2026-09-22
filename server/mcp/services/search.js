const { projects, getProject } = require("./projects");
const { getProfile, getSkills } = require("./profile");
const { createArticles } = require("./articles");

const aliases = { llms: "llm", agents: "agent", nodejs: "node", "node.js": "node", reactjs: "react", "artificial intelligence": "ai", "machine learning": "ml" };
function normalize(value) {
  let text = String(value).normalize("NFKC").toLowerCase();
  for (const [from, to] of Object.entries(aliases)) text = text.split(from).join(to);
  return text.replace(/[^\p{L}\p{N}+#]+/gu, " ").trim();
}
function terms(value) { return [...new Set(normalize(value).split(/\s+/).filter(Boolean))].slice(0, 30); }
function contains(text, term) { return ` ${normalize(text)} `.includes(` ${term} `); }
function score(item, query) {
  const tokens = terms(query);
  return tokens.reduce((sum, token) => sum +
    (contains(item.title, token) ? 12 : 0) +
    (contains(item.tags.join(" "), token) ? 8 : 0) +
    (contains(item.summary, token) ? 3 : 0), 0) +
    (normalize(item.title) === normalize(query) ? 30 : 0);
}
function matches(item, query) {
  return terms(query).every((term) => contains([item.title, item.tags.join(" "), item.summary].join(" "), term));
}
function summary({ description, ...item }) { return item; }

function createServices(config, dependencies) {
  const articles = createArticles(config, dependencies);
  return {
    getProject, getProfile, getSkills, getArticle: articles.get,
    listProjects({ topic, technology, limit = 10 }) {
      const results = projects().filter((item) => (!topic || matches(item, topic)) &&
        (!technology || terms(technology).every((term) => contains(item.tags.join(" "), term))));
      return { results: results.slice(0, limit).map(summary), total: results.length, truncated: results.length > limit };
    },
    async search(query) {
      const profile = getProfile();
      const results = [...projects().map(summary), {
        type: "profile", slug: "amritanshu-mishra", title: profile.name,
        summary: `${profile.title}. ${profile.summary}`, url: profile.url,
        tags: profile.skills.map((skill) => skill.name), publishedAt: null,
      }];
      const warnings = [];
      let truncated = false;
      try {
        const index = await articles.list();
        results.push(...index.results);
        truncated = index.truncated;
        if (truncated) warnings.push("Article search covers a bounded public index; older articles may be omitted.");
      } catch {
        warnings.push("Articles are temporarily unavailable; results include projects and profile only.");
      }
      const ranked = results.map((item) => ({ item, score: score(item, query) }))
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score || (Date.parse(b.item.publishedAt) || 0) - (Date.parse(a.item.publishedAt) || 0) || a.item.slug.localeCompare(b.item.slug));
      return { results: ranked.slice(0, 20).map(({ item }) => item), total: ranked.length,
        truncated: truncated || ranked.length > 20, partial: warnings.length > 0, warnings };
    },
    async latest({ type = "all", limit = 10 }) {
      const index = type === "project" ? { results: [], truncated: false } : await articles.list();
      const dated = index.results.filter((item) => item.publishedAt)
        .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt) || a.slug.localeCompare(b.slug));
      const warnings = type === "article" ? [] : ["Projects have no publication dates in the source and are excluded from chronological results. Use list_projects to browse them."];
      if (index.truncated) warnings.push("The public article index is bounded; older articles may be omitted.");
      return { results: dated.slice(0, limit), total: dated.length,
        truncated: index.truncated || dated.length > limit, warnings };
    },
  };
}

module.exports = { createServices, normalize, score };
