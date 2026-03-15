"use client";

import { useReviews } from "@/services/reviews";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ReviewList from "@/components/ReviewList";
import ReviewForm from "@/components/ReviewForm";

interface ReviewsSectionProps {
  profileId: string;
  currentUserRole?: string | null;
  currentUserId?: string | null;
  currentUserName?: string | null;
  onReviewSubmit?: () => void;
}

const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  profileId,
  currentUserRole,
  currentUserId,
  currentUserName,
  onReviewSubmit,
}) => {
  // Fetch reviews here so we can check if the user has already left one
  const { data: reviews = [], isLoading } = useReviews(profileId);

  // --- Derived State ---
  const isOwnProfile = currentUserId === profileId;
  const hasAlreadyReviewed = reviews.some((r) => r.author_id === currentUserId);

  // Only show the review form if:
  // 1. User is logged in
  // 2. User is NOT viewing their own profile
  // 3. User hasn't already reviewed this profile
  const canLeaveReview =
    !!currentUserId && !isOwnProfile && !hasAlreadyReviewed;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
      {/* REVIEW LIST 
        Pass the fetched reviews down so ReviewList doesn't have to fetch them again.
        Pass currentUserId and isOwnProfile so ReviewList knows whether to show "Delete" or "Reply" buttons.
      */}
      <ReviewList
        targetId={profileId}
        reviews={reviews}
        isLoading={isLoading}
        currentUserId={currentUserId}
        isOwnProfile={isOwnProfile}
      />

      {/* REVIEW FORM */}
      {canLeaveReview && (
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle>Оставить отзыв</CardTitle>
          </CardHeader>
          <CardContent>
            <ReviewForm
              targetId={profileId}
              authorId={currentUserId!}
              authorName={currentUserName || "Пользователь"}
              onSubmitSuccess={onReviewSubmit}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReviewsSection;
