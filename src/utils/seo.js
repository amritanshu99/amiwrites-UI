const SITE_NAME = "AmiVerse";
const SITE_URL = "https://www.amiverse.in";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

const removeTrailingSlash = (url) => url.replace(/\/$/, "");

const upsertMeta = (selector, attrs) => {
  let meta = document.head.querySelector(selector);
  if (!meta) {
    meta = document.createElement("meta");
    document.head.appendChild(meta);
  }

  Object.entries(attrs).forEach(([key, value]) => {
    meta.setAttribute(key, value);
  });
};

const upsertLink = (rel, href) => {
  let link = document.head.querySelector(`link[rel='${rel}']`);
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", rel);
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
};

const upsertJsonLd = (id, data) => {
  let script = document.head.querySelector(`script[data-seo-id='${id}']`);
  if (!script) {
    script = document.createElement("script");
    script.type = "application/ld+json";
    script.dataset.seoId = id;
    document.head.appendChild(script);
  }

  script.textContent = JSON.stringify(data);
};

export const applySEO = ({
  title,
  description,
  path = "/",
  image = DEFAULT_OG_IMAGE,
  noindex = false,
  type = "website",
  keywords,
  structuredData,
}) => {
  const canonical = `${removeTrailingSlash(SITE_URL)}${path.startsWith("/") ? path : `/${path}`}`;

  document.title = title;

  upsertMeta("meta[name='description']", { name: "description", content: description });
  upsertMeta("meta[name='robots']", {
    name: "robots",
    content: noindex
      ? "noindex, nofollow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
      : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
  });

  if (keywords) {
    upsertMeta("meta[name='keywords']", { name: "keywords", content: keywords });
  }

  upsertMeta("meta[property='og:title']", { property: "og:title", content: title });
  upsertMeta("meta[property='og:description']", {
    property: "og:description",
    content: description,
  });
  upsertMeta("meta[property='og:url']", { property: "og:url", content: canonical });
  upsertMeta("meta[property='og:type']", { property: "og:type", content: type });
  upsertMeta("meta[property='og:image']", { property: "og:image", content: image });

  upsertMeta("meta[name='twitter:title']", { name: "twitter:title", content: title });
  upsertMeta("meta[name='twitter:description']", {
    name: "twitter:description",
    content: description,
  });
  upsertMeta("meta[name='twitter:image']", { name: "twitter:image", content: image });
  upsertMeta("meta[name='twitter:url']", { name: "twitter:url", content: canonical });

  upsertLink("canonical", canonical);

  const baseStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: canonical,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    },
  };

  upsertJsonLd("route-webpage", structuredData || baseStructuredData);
};

export const seoByRoute = {
  "/": {
    title: "Amritanshu Mishra | AmiVerse Portfolio, Blogs & AI Tools",
    description:
      "Explore AmiVerse by Amritanshu Mishra: developer portfolio, practical blogs, and AI-powered tools for productivity and creativity.",
    keywords:
      "Amritanshu Mishra, AmiVerse, portfolio, AI tools, developer blog, productivity tools",
  },
  "/blogs": {
    title: "Developer Blogs on React, AI & Productivity | AmiVerse",
    description:
      "Read practical developer blogs by Amritanshu Mishra on React, AI workflows, engineering growth, and productivity.",
  },
  "/ai-chat": {
    title: "AI Chat Assistant | AmiVerse",
    description:
      "Use AmiVerse AI Chat to brainstorm, summarize, and accelerate day-to-day writing and development tasks.",
  },
  "/tech-byte": {
    title: "Tech Byte | Quick Technical Insights by AmiVerse",
    description:
      "Discover short, actionable tech bytes on web development, AI features, and engineering best practices.",
  },
  "/ai-tools": {
    title: "AI Tools Suite | Spam, Emotion, Movies & More | AmiVerse",
    description:
      "Try AI-powered tools from AmiVerse, including spam detection, emotion analysis, movie recommendations, and productivity helpers.",
  },
  "/task-manager": {
    title: "Task Manager & Productivity Analytics | AmiVerse",
    description:
      "Plan, track, and optimize daily tasks with AmiVerse Task Manager and built-in productivity analytics.",
  },
  "/spam-check": {
    title: "Spam Detector Tool | AmiVerse AI Utilities",
    description:
      "Detect spam-like messages instantly using AmiVerse Spam Detector powered by machine learning.",
  },
  "/movie-recommender": {
    title: "Movie Recommender | AmiVerse AI Tools",
    description:
      "Get personalized movie suggestions using AmiVerse Movie Recommender and discover what to watch next.",
  },
  "/emotion-analyzer": {
    title: "Emotion Analyzer | Sentiment Intelligence by AmiVerse",
    description:
      "Analyze emotions in text with AmiVerse Emotion Analyzer to better understand tone, sentiment, and intent.",
  },
  "/amibot": {
    title: "AmiBot AI Assistant | AmiVerse",
    description:
      "Chat with AmiBot for faster answers, idea generation, and writing assistance across your workflow.",
  },
  "/Reinforcement-Learning": {
    title: "Reinforcement Learning Projects & Notes | AmiVerse",
    description:
      "Explore reinforcement learning demos, concepts, and project notes published on AmiVerse.",
  },
  "/add-blog": {
    title: "Add Blog | AmiVerse Admin",
    description: "Admin area for creating and publishing AmiVerse blog posts.",
    noindex: true,
  },
  "/reset-password": {
    title: "Reset Password | AmiVerse",
    description: "Securely reset your AmiVerse account password.",
    noindex: true,
  },
};
