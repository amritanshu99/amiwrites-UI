import { useEffect } from "react";
import MoviePredict from '../components/Movie-Predict/MoviePredict';

import { applySEO, seoByRoute } from "../utils/seo";

const MoviePredictDetails = () => {
  useEffect(() => {
    const routeSeo = seoByRoute["/movie-recommender"] || {
      title: "AmiVerse | SEO",
      description: "AmiVerse by Amritanshu Mishra",
    };

    applySEO({
      path: "/movie-recommender",
      ...routeSeo,
    });
  }, []);

  return (
    <div>
      <MoviePredict />
    </div>
  );
};

export default MoviePredictDetails;