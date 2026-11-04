import { useBlogRanking } from "./useBlogRanking";
import { trendingRequestPath } from "../utils/trendingAnalytics";

export function useTrendingBlogs(enabled = true) {
  return useBlogRanking(trendingRequestPath(), enabled);
}
