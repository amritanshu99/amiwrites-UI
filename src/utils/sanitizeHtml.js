import DOMPurify from "dompurify";

const MAX_HTML_LENGTH = 1_000_000;
const ALLOWED_TAGS = [
  "a",
  "b",
  "blockquote",
  "br",
  "code",
  "del",
  "div",
  "em",
  "figcaption",
  "figure",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "img",
  "li",
  "ol",
  "p",
  "pre",
  "s",
  "span",
  "strong",
  "sub",
  "sup",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "u",
  "ul",
];
const ALLOWED_ATTR = [
  "alt",
  "colspan",
  "href",
  "loading",
  "rel",
  "rowspan",
  "src",
  "target",
  "title",
];
const SAFE_URI_PATTERN = /^(?:(?:https?|mailto|tel):|(?:[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$)))/i;

function hardenSanitizedLinks(html) {
  const template = document.createElement("template");
  template.innerHTML = html;

  template.content.querySelectorAll("a").forEach((anchor) => {
    if (!anchor.hasAttribute("href")) {
      anchor.removeAttribute("target");
      anchor.removeAttribute("rel");
      return;
    }

    if (anchor.getAttribute("target") === "_blank") {
      anchor.setAttribute("rel", "noopener noreferrer nofollow");
    } else {
      anchor.removeAttribute("target");
      anchor.removeAttribute("rel");
    }
  });

  template.content.querySelectorAll("img").forEach((image) => {
    if (!image.hasAttribute("src")) {
      image.remove();
      return;
    }

    image.setAttribute("loading", "lazy");
    image.setAttribute("decoding", "async");
  });

  return template.innerHTML;
}

export function sanitizeBlogHtml(value) {
  if (typeof value !== "string") return "";

  const sanitized = DOMPurify.sanitize(value.slice(0, MAX_HTML_LENGTH), {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOWED_URI_REGEXP: SAFE_URI_PATTERN,
    ALLOW_ARIA_ATTR: true,
    ALLOW_DATA_ATTR: false,
    FORBID_ATTR: ["id", "name", "srcdoc", "srcset", "style"],
    FORBID_TAGS: [
      "audio",
      "base",
      "button",
      "embed",
      "form",
      "iframe",
      "input",
      "link",
      "math",
      "meta",
      "object",
      "script",
      "style",
      "svg",
      "template",
      "textarea",
      "video",
    ],
  });

  return hardenSanitizedLinks(sanitized);
}

export function sanitizedHtmlToText(html) {
  const template = document.createElement("template");
  template.innerHTML = html;
  return (template.content.textContent || "").replace(/\s+/g, " ").trim();
}
