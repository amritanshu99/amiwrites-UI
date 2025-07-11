const { SitemapStream, streamToPromise } = require("sitemap");
const { createWriteStream } = require("fs");
const path = require("path");

async function generateSitemap() {
  const hostname = "https://www.amiverse.in"; // Change this

  const urls = [
    { url: "/", changefreq: "daily", priority: 1.0 },
    { url: "/blogs", changefreq: "daily", priority: 1.0 },
    { url: "/ai-chat", changefreq: "monthly", priority: 0.7 },
    { url: "/add-blog", changefreq: "monthly", priority: 0.7 },
    { url: "/tech-byte", changefreq: "daily", priority: 1.0 },
    { url: "/ai-tools", changefreq: "monthly", priority: 0.5 },
    { url: "/task-manager", changefreq: "weekly", priority: 0.8 },
    { url: "/spam-check", changefreq: "weekly", priority: 0.8 },
    { url: "/movie-recommender", changefreq: "weekly", priority: 0.8 },
  ];

  const sitemapStream = new SitemapStream({ hostname });
  const writeStream = createWriteStream(
    path.resolve(__dirname, "../public/sitemap.xml")
  );

  sitemapStream.pipe(writeStream);

  urls.forEach(({ url, changefreq, priority }) => {
    sitemapStream.write({ url, changefreq, priority });
  });

  sitemapStream.end();

  await streamToPromise(sitemapStream); // <--- fix here
  console.log("Sitemap generated at public/sitemap.xml");
}

generateSitemap().catch(console.error);
