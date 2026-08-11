const { mkdir, readFile, writeFile } = require("fs/promises");
const path = require("path");
const seoRoutes = require("../src/config/seoRoutes.json");
const {
  SITE_URL,
  blogDate,
  blogPath,
  fetchAllBlogs,
  indexableRoutes,
  stripHtml,
} = require("../server/seoContent");

const BUILD_DIR = path.resolve(__dirname, "../build");
const INDEX_PATH = path.join(BUILD_DIR, "index.html");
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;
const PERSON_ID = `${SITE_URL}/#person`;
const WEBSITE_ID = `${SITE_URL}/#website`;

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const insertBeforeHeadClose = (html, tag) => html.replace("</head>", `    ${tag}\n  </head>`);

const upsertMeta = (html, attribute, key, content) => {
  const expression = new RegExp(
    `<meta\\s+(?=[^>]*\\b${attribute}=["']${escapeRegExp(key)}["'])[^>]*>`,
    "i",
  );
  const tag = `<meta ${attribute}="${escapeHtml(key)}" content="${escapeHtml(content)}" />`;
  return expression.test(html)
    ? html.replace(expression, tag)
    : insertBeforeHeadClose(html, tag);
};

const upsertLink = (html, rel, href, extra = "") => {
  const extraSelector = extra
    ? `(?=[^>]*\\bhreflang=["']${escapeRegExp(extra)}["'])`
    : "";
  const expression = new RegExp(
    `<link\\s+(?=[^>]*\\brel=["']${escapeRegExp(rel)}["'])${extraSelector}[^>]*>`,
    "i",
  );
  const tag = `<link rel="${escapeHtml(rel)}"${extra ? ` hreflang="${escapeHtml(extra)}"` : ""} href="${escapeHtml(href)}" />`;
  return expression.test(html)
    ? html.replace(expression, tag)
    : insertBeforeHeadClose(html, tag);
};

const canonicalForPath = (pathname) =>
  pathname === "/" ? `${SITE_URL}/` : `${SITE_URL}${pathname}`;

const personEntity = {
  "@type": "Person",
  "@id": PERSON_ID,
  name: "Amritanshu Mishra",
  alternateName: ["Amritanshu", "Ami Mishra"],
  url: `${SITE_URL}/`,
  image: DEFAULT_IMAGE,
  jobTitle: "Full-stack & AI Engineer",
  sameAs: [
    "https://www.linkedin.com/in/amritanshu-mishra-568598306/",
    "https://github.com/amritanshu99",
    "https://www.instagram.com/ami.mishra99/",
    "https://www.facebook.com/Ami.Mishra99",
  ],
  worksFor: { "@type": "Organization", name: "GlobalLogic" },
  knowsAbout: [
    "JavaScript",
    "React",
    "Node.js",
    "GraphQL",
    "Artificial Intelligence",
    "Machine Learning",
  ],
};

const websiteEntity = {
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  url: `${SITE_URL}/`,
  name: "AmiVerse",
  alternateName: "Amritanshu Mishra Portfolio",
  inLanguage: "en-IN",
  creator: { "@id": PERSON_ID },
  publisher: { "@id": PERSON_ID },
};

const routeGraph = ({ pathname, config, blog }) => {
  const canonical = canonicalForPath(pathname);
  const pageType = ["ProfilePage", "Blog", "CollectionPage", "WebPage"].includes(
    config.schemaType,
  )
    ? config.schemaType
    : "WebPage";
  const page = {
    "@type": pageType,
    "@id": `${canonical}#webpage`,
    url: canonical,
    name: config.title,
    description: config.description,
    inLanguage: "en-IN",
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": PERSON_ID },
  };
  const nodes = [personEntity, websiteEntity, page];

  if (pathname === "/") page.mainEntity = { "@id": PERSON_ID };

  if (blog) {
    const published = blogDate(blog);
    const articleId = `${canonical}#article`;
    page.mainEntity = { "@id": articleId };
    nodes.push({
      "@type": "BlogPosting",
      "@id": articleId,
      headline: blog.title || "AmiVerse Blog",
      description: config.description,
      url: canonical,
      mainEntityOfPage: { "@id": page["@id"] },
      image: DEFAULT_IMAGE,
      author: { "@id": PERSON_ID },
      publisher: { "@id": PERSON_ID },
      ...(published
        ? {
            datePublished: published.toISOString(),
            dateModified: published.toISOString(),
          }
        : {}),
      inLanguage: "en-IN",
      wordCount: blog.words || undefined,
    });
  } else if (config.schemaType === "WebApplication") {
    const applicationId = `${canonical}#application`;
    page.mainEntity = { "@id": applicationId };
    nodes.push({
      "@type": "WebApplication",
      "@id": applicationId,
      name: config.title.split(" | ")[0],
      url: canonical,
      description: config.description,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any",
      author: { "@id": PERSON_ID },
    });
  } else if (config.schemaType === "LearningResource") {
    const resourceId = `${canonical}#learning-resource`;
    page.mainEntity = { "@id": resourceId };
    nodes.push({
      "@type": "LearningResource",
      "@id": resourceId,
      name: config.title.split(" | ")[0],
      url: canonical,
      description: config.description,
      learningResourceType: "Interactive simulation",
      educationalLevel: "Beginner",
      teaches: ["Q-Learning", "Deep Q-Networks", "Policy Gradients"],
      author: { "@id": PERSON_ID },
    });
  }

  if (pathname !== "/") {
    const breadcrumbItems = [
      {
        "@type": "ListItem",
        position: 1,
        name: "Amritanshu Mishra",
        item: `${SITE_URL}/`,
      },
    ];

    if (blog) {
      breadcrumbItems.push({
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${SITE_URL}/blogs`,
      });
    }

    breadcrumbItems.push({
      "@type": "ListItem",
      position: breadcrumbItems.length + 1,
      name: config.title.split(" | ")[0],
      item: canonical,
    });

    nodes.push({
      "@type": "BreadcrumbList",
      "@id": `${canonical}#breadcrumb`,
      itemListElement: breadcrumbItems,
    });
  }

  return { "@context": "https://schema.org", "@graph": nodes };
};

const fallbackMarkup = ({ pathname, config, blogs, blog }) => {
  const blogLinks =
    pathname === "/blogs"
      ? blogs
          .filter((item) => item?._id && item?.title)
          .map(
            (item) =>
              `<li><a href="${escapeHtml(blogPath(item))}">${escapeHtml(item.title)}</a></li>`,
          )
          .join("")
      : "";
  const extra = blog
    ? `<p><a href="/">By Amritanshu Mishra</a> · <a href="/blogs">More engineering articles</a></p>`
    : blogLinks
      ? `<h2>Published articles</h2><ul>${blogLinks}</ul>`
      : "";

  return `<!-- SEO_FALLBACK_START -->
      <main style="min-height:100svh;padding:clamp(2rem,7vw,6rem);background:#010101;color:#fff;font:500 1rem/1.7 system-ui,sans-serif">
        <div style="max-width:52rem;margin:0 auto">
          <p style="color:#67e8f9;font-size:.8rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase">AmiVerse</p>
          <h1 style="margin:.5rem 0 1rem;font-size:clamp(2rem,6vw,4rem);line-height:1.08">${escapeHtml(config.title.split(" | ")[0])}</h1>
          <p>${escapeHtml(config.description)}</p>
          ${extra}
          <nav aria-label="AmiVerse pages" style="margin-top:2rem">
            <a style="color:#67e8f9;margin-right:1.25rem" href="/">Portfolio</a>
            <a style="color:#67e8f9;margin-right:1.25rem" href="/blogs">Engineering blog</a>
            <a style="color:#67e8f9" href="/ai-tools">AI projects</a>
          </nav>
          <p style="margin-top:2rem;color:#a1a1aa">Enable JavaScript to use the interactive AmiVerse experience.</p>
        </div>
      </main>
      <!-- SEO_FALLBACK_END -->`;
};

const renderPage = (template, { pathname, config, blogs = [], blog = null }) => {
  const canonical = canonicalForPath(pathname);
  const imageAlt = blog
    ? `${blog.title} – AmiVerse blog by Amritanshu Mishra`
    : "Amritanshu Mishra – full-stack and AI engineer, creator of AmiVerse";
  let html = template.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(config.title)}</title>`);

  [
    ["name", "title", config.title],
    ["name", "description", config.description],
    [
      "name",
      "keywords",
      config.keywords ||
        "Amritanshu Mishra, Ami Mishra, AmiVerse, full-stack engineer, AI engineer",
    ],
    ["name", "robots", "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"],
    ["name", "googlebot", "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"],
    ["property", "og:title", config.title],
    ["property", "og:description", config.description],
    ["property", "og:url", canonical],
    ["property", "og:type", blog ? "article" : "website"],
    ["property", "og:image", DEFAULT_IMAGE],
    ["property", "og:image:alt", imageAlt],
    ["name", "twitter:title", config.title],
    ["name", "twitter:description", config.description],
    ["name", "twitter:url", canonical],
    ["name", "twitter:image", DEFAULT_IMAGE],
    ["name", "twitter:image:alt", imageAlt],
  ].forEach(([attribute, key, content]) => {
    html = upsertMeta(html, attribute, key, content);
  });

  const published = blogDate(blog);
  if (blog && published) {
    html = upsertMeta(
      html,
      "property",
      "article:published_time",
      published.toISOString(),
    );
    html = upsertMeta(
      html,
      "property",
      "article:modified_time",
      published.toISOString(),
    );
  }

  html = upsertLink(html, "canonical", canonical);
  html = upsertLink(html, "alternate", canonical, "en-IN");
  html = upsertLink(html, "alternate", canonical, "x-default");

  const graph = JSON.stringify(routeGraph({ pathname, config, blog })).replace(
    /</g,
    "\\u003c",
  );
  html = html.replace(
    /<script\s+id=["']seo-structured-data["'][^>]*>[\s\S]*?<\/script>/i,
    `<script id="seo-structured-data" type="application/ld+json">${graph}</script>`,
  );
  html = html.replace(
    /<!-- SEO_FALLBACK_START -->[\s\S]*?<!-- SEO_FALLBACK_END -->/i,
    fallbackMarkup({ pathname, config, blogs, blog }),
  );

  return html;
};

const outputPathForRoute = (pathname) => {
  if (pathname === "/") return INDEX_PATH;
  return path.join(BUILD_DIR, `${pathname.slice(1)}.html`);
};

const writeRoute = async (template, details) => {
  const outputPath = outputPathForRoute(details.pathname);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, renderPage(template, details), "utf8");
};

async function generateSeoPages() {
  const template = await readFile(INDEX_PATH, "utf8");
  let blogs = [];

  try {
    blogs = await fetchAllBlogs();
  } catch (error) {
    console.warn(`Blog prerender lookup failed: ${error?.message || error}`);
  }

  for (const route of indexableRoutes) {
    const config = seoRoutes[route.path];
    await writeRoute(template, {
      pathname: route.path,
      config,
      blogs,
    });
  }

  for (const blog of blogs) {
    if (!blog?._id) continue;
    const pathname = blogPath(blog);
    const excerpt = stripHtml(blog.excerpt || blog.description || blog.content || "");
    const config = {
      title: `${blog.title || "AmiVerse Blog"} | AmiVerse Blog`,
      description:
        excerpt.slice(0, 160) ||
        "Read this AmiVerse blog for practical software engineering and AI insights.",
      schemaType: "BlogPosting",
    };
    await writeRoute(template, { pathname, config, blogs, blog });
  }

  const notFoundConfig = seoRoutes["/not-found"];
  const notFoundHtml = renderPage(template, {
    pathname: "/not-found",
    config: notFoundConfig,
  })
    .replace(
      /<meta\s+(?=[^>]*\bname=["']robots["'])[^>]*>/i,
      '<meta name="robots" content="noindex, nofollow, noarchive" />',
    )
    .replace(
      /<meta\s+(?=[^>]*\bname=["']googlebot["'])[^>]*>/i,
      '<meta name="googlebot" content="noindex, nofollow, noarchive" />',
    );
  await writeFile(path.join(BUILD_DIR, "404.html"), notFoundHtml, "utf8");

  console.log(
    `Generated ${indexableRoutes.length} static SEO route(s) and ${blogs.length} blog route(s).`,
  );
}

if (require.main === module) {
  generateSeoPages().catch((error) => {
    console.error("SEO page generation failed:", error);
    process.exitCode = 1;
  });
}

module.exports = {
  generateSeoPages,
  renderPage,
  routeGraph,
};
