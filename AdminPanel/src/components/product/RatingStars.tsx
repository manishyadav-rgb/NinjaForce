import { Star } from "lucide-react";

export function RatingStars({ rating, reviews }: { rating: number; reviews?: number }) {
  return (
    <div className="flex items-center gap-2 text-sm text-text-muted" aria-label={`${rating} star rating`}>
      <span className="flex items-center gap-1 rounded-full bg-background-soft px-2 py-1 font-semibold text-text-main">
        <Star className="h-4 w-4 fill-accent-rating text-accent-rating" aria-hidden="true" />
        {rating.toFixed(1)}
      </span>
      {reviews ? <span>({reviews})</span> : null}
    </div>
  );
}

