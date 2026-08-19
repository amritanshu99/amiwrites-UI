import { useEffect, useMemo, useState } from "react";
import { UserRound } from "lucide-react";
import { getHighResolutionGoogleAvatarUrl } from "../../utils/googleAvatar";

const getProfileInitial = (profileName) => {
  const normalizedName = typeof profileName === "string" ? profileName.trim() : "";
  return normalizedName ? Array.from(normalizedName)[0].toUpperCase() : "";
};

export default function UserAvatar({ avatarUrl, displayName, username }) {
  const normalizedDisplayName =
    typeof displayName === "string" ? displayName.trim() : "";
  const normalizedUsername = typeof username === "string" ? username.trim() : "";
  const profileName = normalizedDisplayName || normalizedUsername || "Amiverse user";
  const profileInitial = getProfileInitial(
    normalizedDisplayName || normalizedUsername,
  );
  const resolvedAvatarUrl = useMemo(
    () => getHighResolutionGoogleAvatarUrl(avatarUrl, 256),
    [avatarUrl],
  );
  const [imageStatus, setImageStatus] = useState(
    resolvedAvatarUrl ? "loading" : "unavailable",
  );

  useEffect(() => {
    setImageStatus(resolvedAvatarUrl ? "loading" : "unavailable");
  }, [resolvedAvatarUrl]);

  const showImage = resolvedAvatarUrl && imageStatus !== "error";

  return (
    <span className="relative inline-flex h-8 w-8 shrink-0 overflow-hidden rounded-full bg-[linear-gradient(135deg,#e0f2fe,#e2e8f0)] shadow-sm ring-1 ring-slate-900/10 dark:bg-[linear-gradient(135deg,rgba(34,211,238,0.22),rgba(255,255,255,0.10))] dark:ring-white/20">
      <span
        data-testid="user-avatar-fallback"
        className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-700 dark:text-cyan-100"
        aria-hidden="true"
      >
        {profileInitial ? (
          profileInitial
        ) : (
          <UserRound className="h-5 w-5" />
        )}
      </span>
      {showImage && (
        <img
          src={resolvedAvatarUrl}
          alt={`${profileName}'s profile picture`}
          width="32"
          height="32"
          className={`absolute inset-0 h-full w-full rounded-full object-cover transition-opacity duration-200 ${
            imageStatus === "loaded" ? "opacity-100" : "opacity-0"
          }`}
          loading="eager"
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={() => setImageStatus("loaded")}
          onError={() => setImageStatus("error")}
        />
      )}
    </span>
  );
}
