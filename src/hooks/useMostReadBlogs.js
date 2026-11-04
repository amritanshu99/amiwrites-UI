import { useBlogRanking } from "./useBlogRanking";

export function useMostReadBlogs(enabled = true) {
  return useBlogRanking("/api/most-read", enabled);
}
