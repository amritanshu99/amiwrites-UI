import { sanitizeBlogHtml, sanitizedHtmlToText } from "../../utils/sanitizeHtml";

export function blogPublicationDate(blog) {
  return [blog?.publishedAt, blog?.date, blog?.createdAt].find(
    (value) => value && Number.isFinite(new Date(value).getTime()),
  );
}

export function blogPreview(blog) {
  const text = sanitizedHtmlToText(sanitizeBlogHtml(blog?.content)
    .replace(/<\/(?:p|div|li|h[1-6]|pre|blockquote)>|<br\s*\/?>/gi, "$& "));
  const words = Number(blog?.words) > 0 ? Number(blog.words) : text.split(/\s+/).filter(Boolean).length;
  return {
    excerpt: text.length > 190 ? `${text.slice(0, 190).replace(/\s+\S*$/, "")}…` : text,
    minutes: Math.max(1, Math.ceil(words / 220)),
  };
}

export function articleOutline(sanitizedHtml) {
  const template = document.createElement("template");
  template.innerHTML = sanitizedHtml;
  const headings = Array.from(template.content.querySelectorAll("h2, h3"))
    .filter((heading) => heading.textContent.trim())
    .map((heading, index) => {
      const id = `article-section-${index + 1}`;
      heading.id = id;
      heading.tabIndex = -1;
      return { id, title: heading.textContent.trim(), level: heading.tagName === "H3" ? 3 : 2 };
    });
  return { html: template.innerHTML, headings };
}
