const { writeFile } = require("fs/promises");
const path = require("path");
const {
  buildRssXml,
  buildSitemapXml,
  fetchAllBlogs,
} = require("../server/seoContent");

const SITEMAP_PATH = path.resolve(__dirname, "../public/sitemap.xml");
const FEED_PATH = path.resolve(__dirname, "../public/feed.xml");

async function generateSeoDiscoveryFiles() {
  let blogs = [];

  try {
    blogs = await fetchAllBlogs();
    console.log(`Fetched ${blogs.length} blog post(s) for SEO discovery files.`);
  } catch (error) {
    console.warn(
      `Blog lookup failed; generating static-route fallbacks: ${error?.message || error}`,
    );
  }

  await Promise.all([
    writeFile(SITEMAP_PATH, buildSitemapXml(blogs), "utf8"),
    writeFile(FEED_PATH, buildRssXml(blogs), "utf8"),
  ]);

  console.log("Generated public/sitemap.xml and public/feed.xml");
}

generateSeoDiscoveryFiles().catch((error) => {
  console.error("SEO discovery generation failed:", error);
  process.exitCode = 1;
});
