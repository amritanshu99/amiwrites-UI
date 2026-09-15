const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");
const { generateInitialLoader } = require("./generate-initial-loader");

const template = fs.readFileSync(
  path.resolve(__dirname, "../public/index.html"),
  "utf8",
);

const bootstrapDocument = (pathname) => {
  // Exercise the first-paint scripts before the application bundle runs. CSS is
  // covered by browser verification and need not be parsed by jsdom here.
  const dom = new JSDOM(template.replace(/<style\b[^>]*>[\s\S]*?<\/style>/g, ""), {
    url: `https://www.amiverse.in${pathname}`,
    runScripts: "outside-only",
  });
  dom.window.document.querySelectorAll("script:not([src])").forEach((script) => {
    if (!script.type) dom.window.eval(script.textContent);
  });
  return dom;
};

test("committed first-paint scene is current and regeneration is stable", () => {
  const generated = generateInitialLoader(template);
  // Git can check out CRLF on Windows; that must not create a false mismatch.
  assert.equal(generated.replace(/\r\n/g, "\n"), template.replace(/\r\n/g, "\n"));
  assert.equal(generateInitialLoader(generated), generated);
});

test("homepage bootstrap retains the scene and SEO metadata without waiting jokes", () => {
  const dom = bootstrapDocument("/");
  try {
    const { document } = dom.window;
    const scene = document.getElementById("app-bootstrap-loader");
    assert.ok(scene?.hasAttribute("data-loader-root"));
    assert.equal(document.documentElement.dataset.bootstrapLoader, "showcase");
    assert.equal(scene.querySelector("[data-bootstrap-quip]"), null);
    assert.ok(document.querySelector('meta[name="description"]').content);
    assert.ok(JSON.parse(document.getElementById("seo-structured-data").textContent)["@graph"]);
  } finally {
    dom.window.close();
  }
});

test("direct routes retain the shared route loader and initialize its accessible label", () => {
  const dom = bootstrapDocument("/add-blog/");
  try {
    const { document } = dom.window;
    const route = document.getElementById("app-bootstrap-route-loader");
    assert.equal(document.documentElement.dataset.bootstrapLoader, "route");
    assert.equal(route.getAttribute("aria-label"), "Loading Create Blog");
    assert.equal(route.getAttribute("aria-busy"), "true");
    assert.equal(route.querySelector(".amiverse-loading-spinner").getAttribute("aria-hidden"), "true");
    assert.equal(route.textContent.trim(), "");
  } finally {
    dom.window.close();
  }
});
