import seoRoutes from "../config/seoRoutes.json";

const SITE_NAME = "AmiVerse";
const OWNER_NAME = "Amritanshu Mishra";
export const SITE_URL = "https://www.amiverse.in";

const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;
const DEFAULT_IMAGE_ALT =
  "Amritanshu Mishra – full-stack and AI engineer, creator of AmiVerse";
const PERSON_ID = `${SITE_URL}/#person`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const PRIMARY_SEO_KEYWORDS =
  "Amritanshu Mishra, Ami Mishra, AmiVerse, full-stack engineer, AI engineer";

const SOCIAL_LINKS = [
  "https://www.linkedin.com/in/amritanshu-mishra-568598306/",
  "https://github.com/amritanshu99",
  "https://www.instagram.com/ami.mishra99/",
  "https://www.facebook.com/Ami.Mishra99",
];

const normalizeToPath = (value) => {
  if (!value) return "/";

  let pathname = String(value).split(/[?#]/, 1)[0] || "/";

  if (/^https?:\/\//i.test(value)) {
    try {
      pathname = new URL(value).pathname || "/";
    } catch {
      pathname = "/";
    }
  }

  const withLeadingSlash = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const withoutTrailingSlash = withLeadingSlash.replace(/\/+$/, "");
  return withoutTrailingSlash || "/";
};

export const getCanonicalUrl = (path = "/") => {
  const pathname = normalizeToPath(path);
  return pathname === "/" ? `${SITE_URL}/` : `${SITE_URL}${pathname}`;
};

const upsertMeta = (selector, attrs) => {
  let meta = document.head.querySelector(selector);
  if (!meta) {
    meta = document.createElement("meta");
    document.head.appendChild(meta);
  }

  Object.entries(attrs).forEach(([key, value]) => {
    meta.setAttribute(key, String(value));
  });
};

const removeMeta = (selector) => {
  document.head.querySelector(selector)?.remove();
};

const upsertLink = (selector, attrs) => {
  let link = document.head.querySelector(selector);
  if (!link) {
    link = document.createElement("link");
    document.head.appendChild(link);
  }

  Object.entries(attrs).forEach(([key, value]) => {
    link.setAttribute(key, String(value));
  });
};

const upsertJsonLd = (id, data) => {
  let script =
    document.head.querySelector(`script[data-seo-id='${id}']`) ||
    document.head.querySelector("#seo-structured-data");
  if (!script) {
    script = document.createElement("script");
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }

  script.dataset.seoId = id;
  script.textContent = JSON.stringify(data);
};

const personEntity = () => ({
  "@type": "Person",
  "@id": PERSON_ID,
  name: OWNER_NAME,
  alternateName: ["Amritanshu", "Ami Mishra"],
  url: `${SITE_URL}/`,
  image: {
    "@type": "ImageObject",
    url: DEFAULT_OG_IMAGE,
  },
  jobTitle: "Full-stack & AI Engineer",
  description:
    "Full-stack and AI engineer with 7+ years of experience building web products with React, Node.js, GraphQL, and machine-learning tools.",
  sameAs: SOCIAL_LINKS,
  worksFor: {
    "@type": "Organization",
    name: "GlobalLogic",
  },
  alumniOf: [
    {
      "@type": "CollegeOrUniversity",
      name: "Rajkumar Goel Institute of Technology",
      alternateName: "RKGIT",
    },
    {
      "@type": "EducationalOrganization",
      name: "Ramanlal Shorawala Public School",
    },
  ],
  knowsAbout: [
    "JavaScript",
    "React",
    "Node.js",
    "Express",
    "MongoDB",
    "GraphQL",
    "Artificial Intelligence",
    "Machine Learning",
    "Full-stack Development",
  ],
});

const websiteEntity = () => ({
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  url: `${SITE_URL}/`,
  name: SITE_NAME,
  alternateName: "Amritanshu Mishra Portfolio",
  description:
    "The official portfolio, engineering blog, projects, and AI tools of Amritanshu Mishra.",
  inLanguage: "en-IN",
  creator: { "@id": PERSON_ID },
  publisher: { "@id": PERSON_ID },
});

const createPageEntity = ({ title, description, canonical, schemaType }) => {
  const pageType = ["ProfilePage", "Blog", "CollectionPage", "WebPage"].includes(
    schemaType,
  )
    ? schemaType
    : "WebPage";

  const page = {
    "@type": pageType,
    "@id": `${canonical}#webpage`,
    url: canonical,
    name: title,
    description,
    inLanguage: "en-IN",
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": PERSON_ID },
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: DEFAULT_OG_IMAGE,
    },
  };

  if (schemaType === "ProfilePage") {
    page.mainEntity = { "@id": PERSON_ID };
  }

  return page;
};

const createMainEntity = ({ title, description, canonical, schemaType }) => {
  if (schemaType === "WebApplication") {
    return {
      "@type": "WebApplication",
      "@id": `${canonical}#application`,
      name: title.split(" | ")[0],
      url: canonical,
      description,
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires a modern web browser with JavaScript enabled",
      author: { "@id": PERSON_ID },
      isPartOf: { "@id": WEBSITE_ID },
    };
  }

  if (schemaType === "LearningResource") {
    return {
      "@type": "LearningResource",
      "@id": `${canonical}#learning-resource`,
      name: title.split(" | ")[0],
      url: canonical,
      description,
      learningResourceType: "Interactive simulation",
      educationalLevel: "Beginner",
      teaches: ["Q-Learning", "Deep Q-Networks", "Policy Gradients"],
      inLanguage: "en-IN",
      author: { "@id": PERSON_ID },
      isPartOf: { "@id": WEBSITE_ID },
    };
  }

  return null;
};

const createBreadcrumbEntity = (title, canonical) => {
  if (canonical === `${SITE_URL}/`) return null;

  return {
    "@type": "BreadcrumbList",
    "@id": `${canonical}#breadcrumb`,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Amritanshu Mishra",
        item: `${SITE_URL}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: title.split(" | ")[0],
        item: canonical,
      },
    ],
  };
};

const structuredDataNodes = (structuredData) => {
  if (!structuredData) return [];
  if (Array.isArray(structuredData)) return structuredData;
  if (Array.isArray(structuredData["@graph"])) return structuredData["@graph"];

  const { "@context": _context, ...entity } = structuredData;
  return [entity];
};

const buildStructuredData = ({
  title,
  description,
  canonical,
  schemaType,
  structuredData,
}) => {
  const pageEntity = createPageEntity({ title, description, canonical, schemaType });
  const mainEntity = createMainEntity({ title, description, canonical, schemaType });

  if (mainEntity) {
    pageEntity.mainEntity = { "@id": mainEntity["@id"] };
  }

  const suppliedNodes = structuredDataNodes(structuredData).map((node, index) => ({
    ...node,
    "@id": node["@id"] || `${canonical}#primary-${index + 1}`,
    isPartOf: node.isPartOf || { "@id": WEBSITE_ID },
  }));

  if (suppliedNodes[0]) {
    pageEntity.mainEntity = { "@id": suppliedNodes[0]["@id"] };
  }

  return {
    "@context": "https://schema.org",
    "@graph": [
      personEntity(),
      websiteEntity(),
      pageEntity,
      ...(mainEntity ? [mainEntity] : []),
      ...suppliedNodes,
      createBreadcrumbEntity(title, canonical),
    ].filter(Boolean),
  };
};

const setOptionalArticleMeta = (selector, property, value) => {
  if (!value) {
    removeMeta(selector);
    return;
  }

  upsertMeta(selector, { property, content: value });
};

export const applySEO = ({
  title,
  description,
  path = "/",
  image = DEFAULT_OG_IMAGE,
  imageAlt = DEFAULT_IMAGE_ALT,
  noindex = false,
  type = "website",
  keywords,
  schemaType = "WebPage",
  structuredData,
  publishedTime,
  modifiedTime,
  section,
  tags = [],
}) => {
  const canonical = getCanonicalUrl(path);
  const imageUrl = /^https?:\/\//i.test(image)
    ? image
    : `${SITE_URL}${normalizeToPath(image)}`;
  const robots = noindex
    ? "noindex, nofollow, noarchive"
    : "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1";

  document.title = title;

  upsertMeta("meta[name='description']", { name: "description", content: description });
  upsertMeta("meta[name='title']", { name: "title", content: title });
  upsertMeta("meta[name='author']", { name: "author", content: OWNER_NAME });
  upsertMeta("meta[name='application-name']", {
    name: "application-name",
    content: SITE_NAME,
  });
  upsertMeta("meta[name='robots']", { name: "robots", content: robots });
  upsertMeta("meta[name='googlebot']", { name: "googlebot", content: robots });
  upsertMeta("meta[name='keywords']", {
    name: "keywords",
    content: keywords ? `${keywords}, ${PRIMARY_SEO_KEYWORDS}` : PRIMARY_SEO_KEYWORDS,
  });

  upsertMeta("meta[property='og:title']", { property: "og:title", content: title });
  upsertMeta("meta[property='og:description']", {
    property: "og:description",
    content: description,
  });
  upsertMeta("meta[property='og:url']", { property: "og:url", content: canonical });
  upsertMeta("meta[property='og:type']", { property: "og:type", content: type });
  upsertMeta("meta[property='og:site_name']", {
    property: "og:site_name",
    content: SITE_NAME,
  });
  upsertMeta("meta[property='og:locale']", { property: "og:locale", content: "en_IN" });
  upsertMeta("meta[property='og:image']", { property: "og:image", content: imageUrl });
  upsertMeta("meta[property='og:image:secure_url']", {
    property: "og:image:secure_url",
    content: imageUrl,
  });
  upsertMeta("meta[property='og:image:alt']", {
    property: "og:image:alt",
    content: imageAlt,
  });

  upsertMeta("meta[name='twitter:card']", {
    name: "twitter:card",
    content: "summary",
  });
  upsertMeta("meta[name='twitter:title']", { name: "twitter:title", content: title });
  upsertMeta("meta[name='twitter:description']", {
    name: "twitter:description",
    content: description,
  });
  upsertMeta("meta[name='twitter:image']", { name: "twitter:image", content: imageUrl });
  upsertMeta("meta[name='twitter:image:alt']", {
    name: "twitter:image:alt",
    content: imageAlt,
  });
  upsertMeta("meta[name='twitter:url']", { name: "twitter:url", content: canonical });

  upsertLink("link[rel='canonical']", { rel: "canonical", href: canonical });
  upsertLink("link[rel='alternate'][hreflang='en-IN']", {
    rel: "alternate",
    hreflang: "en-IN",
    href: canonical,
  });
  upsertLink("link[rel='alternate'][hreflang='x-default']", {
    rel: "alternate",
    hreflang: "x-default",
    href: canonical,
  });

  setOptionalArticleMeta(
    "meta[property='article:published_time']",
    "article:published_time",
    type === "article" ? publishedTime : null,
  );
  setOptionalArticleMeta(
    "meta[property='article:modified_time']",
    "article:modified_time",
    type === "article" ? modifiedTime : null,
  );
  setOptionalArticleMeta(
    "meta[property='article:section']",
    "article:section",
    type === "article" ? section : null,
  );

  document.head
    .querySelectorAll("meta[property='article:tag']")
    .forEach((element) => element.remove());
  if (type === "article") {
    tags.filter(Boolean).forEach((tag) => {
      const meta = document.createElement("meta");
      meta.setAttribute("property", "article:tag");
      meta.setAttribute("content", String(tag));
      document.head.appendChild(meta);
    });
  }

  upsertJsonLd(
    "route-graph",
    buildStructuredData({
      title,
      description,
      canonical,
      schemaType,
      structuredData,
    }),
  );
};

export const seoByRoute = seoRoutes;
