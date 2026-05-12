const { SitemapStream, streamToPromise } = require("sitemap");
const { writeFile } = require("fs/promises");
const path = require("path");

const SITE_URL = "https://www.amiverse.in";
const SITEMAP_PATH = path.resolve(__dirname, "../public/sitemap.xml");

async function generateSitemap() {
  const hostname = SITE_URL;
  const today = new Date().toISOString();

  const urls = [
    { url: "/", changefreq: "daily", priority: 1.0 },
    { url: "/blogs", changefreq: "daily", priority: 0.9 },
    { url: "/ai-chat", changefreq: "weekly", priority: 0.8 },
    { url: "/tech-byte", changefreq: "daily", priority: 0.8 },
    { url: "/ai-tools", changefreq: "weekly", priority: 0.8 },
    { url: "/task-manager", changefreq: "weekly", priority: 0.8 },
    { url: "/spam-check", changefreq: "weekly", priority: 0.7 },
    { url: "/movie-recommender", changefreq: "weekly", priority: 0.7 },
    { url: "/emotion-analyzer", changefreq: "weekly", priority: 0.7 },
    { url: "/amibot", changefreq: "weekly", priority: 0.7 },
    { url: "/Reinforcement-Learning", changefreq: "monthly", priority: 0.6 },
  ];

  const sitemapStream = new SitemapStream({ hostname });

  urls.forEach(({ url, changefreq, priority }) => {
    sitemapStream.write({ url, changefreq, priority, lastmodISO: today });
  });

  sitemapStream.end();
  const xml = (await streamToPromise(sitemapStream)).toString();
  const stylesheet = '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>';
  const withStylesheet = xml.includes("sitemap.xsl")
    ? xml
    : xml.replace("?>", `?>\n${stylesheet}`);

  await writeFile(SITEMAP_PATH, withStylesheet, "utf8");

  console.log("Sitemap generated at public/sitemap.xml");
}

generateSitemap().catch(console.error);
