import { BookOpen, TrendingUp } from "lucide-react";
import { MOST_READ_SINCE_LABEL } from "../../utils/mostReadAnalytics";

export default function BlogBadges({ isTrending, readCount = 0 }) {
  return <>
    {isTrending && <span className="journal-trending" aria-label="Trending" title="Trending among articles published in the last 60 days">
      <TrendingUp size={14} aria-hidden="true" /> Trending
    </span>}
    {readCount > 0 && <span className="journal-most-read" aria-label="Most Read" title={`${readCount.toLocaleString()} qualifying reads since ${MOST_READ_SINCE_LABEL}`}>
      <BookOpen size={14} aria-hidden="true" /> Most Read
    </span>}
  </>;
}
