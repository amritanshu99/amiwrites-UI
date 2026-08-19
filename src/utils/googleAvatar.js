const MAX_AVATAR_URL_LENGTH = 2_048;
const MIN_AVATAR_SIZE = 64;
const MAX_AVATAR_SIZE = 512;
const GOOGLE_IMAGE_HOST_PATTERNS = [
  /(^|\.)googleusercontent\.com$/i,
  /(^|\.)ggpht\.com$/i,
];
const GOOGLE_SIZE_SUFFIX_PATTERN = /=s\d+(?:-[a-z0-9-]+)*$/i;

const normalizeAvatarSize = (size) =>
  Math.min(
    MAX_AVATAR_SIZE,
    Math.max(MIN_AVATAR_SIZE, Number.isFinite(size) ? Math.round(size) : 160),
  );

export const getHighResolutionGoogleAvatarUrl = (avatarUrl, size = 256) => {
  if (
    typeof avatarUrl !== "string" ||
    !avatarUrl.trim() ||
    avatarUrl.length > MAX_AVATAR_URL_LENGTH
  ) {
    return null;
  }

  try {
    const parsedUrl = new URL(avatarUrl.trim());
    if (
      parsedUrl.protocol !== "https:" ||
      parsedUrl.username ||
      parsedUrl.password ||
      parsedUrl.port ||
      !GOOGLE_IMAGE_HOST_PATTERNS.some((pattern) =>
        pattern.test(parsedUrl.hostname),
      )
    ) {
      return null;
    }

    const requestedSize = normalizeAvatarSize(size);
    parsedUrl.hash = "";

    if (parsedUrl.searchParams.has("sz")) {
      parsedUrl.searchParams.set("sz", String(requestedSize));
    } else if (GOOGLE_SIZE_SUFFIX_PATTERN.test(parsedUrl.pathname)) {
      parsedUrl.pathname = parsedUrl.pathname.replace(
        GOOGLE_SIZE_SUFFIX_PATTERN,
        `=s${requestedSize}-c`,
      );
    } else {
      parsedUrl.pathname = `${parsedUrl.pathname}=s${requestedSize}-c`;
    }

    const resolvedUrl = parsedUrl.toString();
    return resolvedUrl.length <= MAX_AVATAR_URL_LENGTH ? resolvedUrl : null;
  } catch {
    return null;
  }
};
