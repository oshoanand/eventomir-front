"use client";

import { MessageSquareOff } from "lucide-react";
import ReviewItem from "@/components/performer-profile/reviews/ReviewItem";
import { Review } from "@/services/reviews";

interface ReviewListProps {
  targetId: string;
  reviews: Review[];
  isLoading: boolean;
  currentUserId?: string | null;
  isOwnProfile: boolean;
}

export default function ReviewList({
  reviews,
  isLoading,
  currentUserId,
  isOwnProfile,
}: ReviewListProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="w-full h-40 bg-muted/20 animate-pulse rounded-3xl border border-border/50"
          />
        ))}
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-white rounded-3xl border border-dashed border-border/60">
        <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mb-4">
          <MessageSquareOff className="w-8 h-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">
          Отзывов пока нет
        </h3>
        <p className="text-muted-foreground text-sm max-w-sm">
          У этого специалиста еще нет отзывов.
          {!isOwnProfile &&
            " Станьте первым, кто поделится впечатлениями о сотрудничестве!"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <ReviewItem
          key={review.id}
          review={review}
          currentUserId={currentUserId}
          isOwnProfile={isOwnProfile}
        />
      ))}
    </div>
  );
}
