const featured = require("../../../src/data/featuredProjects.json");
const routes = require("../../../src/config/seoRoutes.json");
const { SITE_URL } = require("../config");
const { ContentError } = require("./errors");

// The two full-stack apps use React plus Express/Node and MongoDB models in
// the existing backend. Other technologies come from the public route metadata.
const fullStackPaths = new Set(["/amibot", "/task-manager"]);
const toolPaths = ["/spam-check", "/movie-recommender", "/emotion-analyzer", "/reinforcement-learning"];

function projects() {
  const cards = featured.map((card) => ({
    type: "project", slug: card.to.slice(1), title: card.title,
    summary: card.description, url: SITE_URL + card.to,
    tags: [...new Set([...card.stack, ...(fullStackPaths.has(card.to) ? ["Express", "MongoDB", "MERN"] : [])])],
    description: `${card.description} ${card.result}`,
    publishedAt: null,
  }));
  return cards.concat(toolPaths.map((path) => ({
    type: "project", slug: path.slice(1), title: routes[path].title.split(" | ")[0],
    summary: routes[path].description, description: routes[path].description,
    url: SITE_URL + path,
    tags: ["React", "JavaScript", "AI", ...routes[path].keywords.split(", ")],
    publishedAt: null,
  })));
}

function getProject(slug) {
  const project = projects().find((item) => item.slug === slug);
  if (!project) throw new ContentError("NOT_FOUND", "Project not found. Use list_projects or search_amiverse to find a valid slug.");
  return project;
}

module.exports = { projects, getProject };
