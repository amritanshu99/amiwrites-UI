const { buildSitemapXml, fetchAllBlogs } = require("../server/seoContent");

module.exports = async function sitemapHandler(_request, response) {
  let blogs = [];

  try {
    blogs = await fetchAllBlogs();
  } catch (error) {
    console.error("Dynamic sitemap blog lookup failed:", error?.message || error);
  }

  response.setHeader("Content-Type", "application/xml; charset=utf-8");
  response.setHeader(
    "Cache-Control",
    "public, s-maxage=3600, stale-while-revalidate=86400",
  );
  response.status(200).send(buildSitemapXml(blogs));
};
