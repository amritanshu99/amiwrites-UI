const { z } = require("zod");
const text = (max) => z.string().trim().min(1).max(max);
const meaningfulText = (max) => text(max).refine((value) => /[\p{L}\p{N}]/u.test(value), "Include at least one letter or number.");
const query = meaningfulText(200);
const slug = text(160).regex(/^[a-z\d][a-z\d_-]*$/i).describe("Exact slug or article ID returned by search_amiverse, list_projects, or get_latest_content.");
const limit = z.number().int().min(1).max(20).default(10).describe("Maximum number of results (1-20; default 10).");
const item = z.object({
  type: z.enum(["project", "article", "profile"]), slug: z.string(), id: z.string().optional(),
  title: z.string(), summary: z.string(), url: z.url(), tags: z.array(z.string()), publishedAt: z.iso.datetime().nullable(),
});
const collection = { results: z.array(item).max(20), total: z.number().int().nonnegative(), truncated: z.boolean() };
const skill = z.object({ name: z.string(), expertise: z.string(), categories: z.array(z.string()) });
const profile = z.object({
  name: z.string(), title: z.string(), summary: z.string(), url: z.url(), skills: z.array(skill),
  experience: z.array(z.object({ company: z.string(), roles: z.array(z.object({ title: z.string(), startDate: z.string(), endDate: z.string().regex(/^\d{4}-\d{2}$/).nullable() })) })),
  links: z.object({ github: z.url(), linkedin: z.url() }),
});
const inputs = {
  search_amiverse: z.strictObject({ query: query.describe("Words or phrase to search across public Amiverse projects, article titles, excerpts, categories, skills and profile, e.g. AI agents or RAG.") }),
  list_projects: z.strictObject({ topic: meaningfulText(100).optional().describe("Project topic such as AI, MERN, or reinforcement learning."), technology: meaningfulText(100).optional().describe("Required technology such as React, Node.js, MongoDB, or MERN."), limit }),
  get_project: z.strictObject({ slug }), get_article: z.strictObject({ slug }), get_profile: z.strictObject({}),
  get_skills: z.strictObject({ category: text(50).optional().describe("Case-insensitive category: Frontend, Backend, AI, Cloud, or DevOps. Unsupported categories return an empty list.") }),
  get_latest_content: z.strictObject({ type: z.enum(["all", "project", "article"]).default("all").describe("Content kind. Undated projects cannot be ordered by publication date."), limit }),
};
const outputs = {
  search_amiverse: z.object({ ...collection, partial: z.boolean(), warnings: z.array(z.string()) }),
  list_projects: z.object(collection),
  get_project: z.object({ project: item.extend({ description: z.string() }) }),
  get_article: z.object({ article: item.extend({ excerpt: z.string().max(6000), truncated: z.boolean() }) }),
  get_profile: z.object({ profile }), get_skills: z.object({ skills: z.array(skill) }),
  get_latest_content: z.object({ ...collection, warnings: z.array(z.string()) }),
};
module.exports = { inputs, outputs };
