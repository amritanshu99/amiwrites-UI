import { applySEO, getCanonicalUrl, seoByRoute } from "./seo";

const metaContent = (selector) =>
  document.head.querySelector(selector)?.getAttribute("content");

beforeEach(() => {
  document.head.innerHTML = "";
});

test("normalizes canonical URLs without query strings, fragments, or trailing slashes", () => {
  expect(getCanonicalUrl("/blogs/?page=2#latest")).toBe(
    "https://www.amiverse.in/blogs",
  );
  expect(getCanonicalUrl("https://example.com/ai-tools/?ref=test")).toBe(
    "https://www.amiverse.in/ai-tools",
  );
  expect(getCanonicalUrl("/")).toBe("https://www.amiverse.in/");
});

test("writes accurate canonical, social, alternate, and application structured data", () => {
  document.head.insertAdjacentHTML(
    "beforeend",
    '<script id="seo-structured-data" type="application/ld+json">{}</script>',
  );
  applySEO({ path: "/ai-chat", ...seoByRoute["/ai-chat"] });

  expect(document.title).toBe("Ami AI Wellness Chat | AmiVerse");
  expect(metaContent("meta[name='description']")).toContain("wellness conversations");
  expect(metaContent("meta[property='og:url']")).toBe(
    "https://www.amiverse.in/ai-chat",
  );
  expect(document.head.querySelector("link[rel='canonical']")?.href).toBe(
    "https://www.amiverse.in/ai-chat",
  );
  expect(
    document.head.querySelector("link[hreflang='en-IN']")?.getAttribute("href"),
  ).toBe("https://www.amiverse.in/ai-chat");

  const graph = JSON.parse(
    document.head.querySelector("script[data-seo-id='route-graph']").textContent,
  )["@graph"];
  expect(document.head.querySelectorAll("script[type='application/ld+json']")).toHaveLength(1);
  expect(graph.some((node) => node["@type"] === "WebApplication")).toBe(true);
  expect(graph.some((node) => node["@type"] === "Person")).toBe(true);
  expect(graph.some((node) => node["@type"] === "BreadcrumbList")).toBe(true);
});

test("marks private routes noindex and clears stale article metadata", () => {
  applySEO({
    title: "Article",
    description: "Article description",
    path: "/blogs/example",
    type: "article",
    publishedTime: "2026-01-01T00:00:00.000Z",
    tags: ["React", "AI"],
  });
  expect(metaContent("meta[property='article:published_time']")).toBe(
    "2026-01-01T00:00:00.000Z",
  );
  expect(document.head.querySelectorAll("meta[property='article:tag']")).toHaveLength(2);

  applySEO({ path: "/add-blog", ...seoByRoute["/add-blog"] });

  expect(metaContent("meta[name='robots']")).toBe("noindex, nofollow, noarchive");
  expect(metaContent("meta[name='googlebot']")).toBe(
    "noindex, nofollow, noarchive",
  );
  expect(document.head.querySelector("meta[property='article:published_time']")).toBeNull();
  expect(document.head.querySelectorAll("meta[property='article:tag']")).toHaveLength(0);
});
