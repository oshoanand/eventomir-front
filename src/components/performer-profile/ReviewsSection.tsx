// "use client";

// import { useReviews } from "@/services/reviews";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import ReviewList from "@/components/ReviewList";
// import ReviewForm from "@/components/ReviewForm";

// interface ReviewsSectionProps {
//   profileId: string;
//   currentUserRole?: string | null;
//   currentUserId?: string | null;
//   currentUserName?: string | null;
//   onReviewSubmit?: () => void;
// }

// const ReviewsSection: React.FC<ReviewsSectionProps> = ({
//   profileId,
//   currentUserRole,
//   currentUserId,
//   currentUserName,
//   onReviewSubmit,
// }) => {
//   // Fetch reviews here so we can check if the user has already left one
//   const { data: reviews = [], isLoading } = useReviews(profileId);

//   // --- Derived State ---
//   const isOwnProfile = currentUserId === profileId;
//   const hasAlreadyReviewed = reviews.some((r) => r.author_id === currentUserId);

//   // Only show the review form if:
//   // 1. User is logged in
//   // 2. User is NOT viewing their own profile
//   // 3. User hasn't already reviewed this profile
//   const canLeaveReview =
//     !!currentUserId && !isOwnProfile && !hasAlreadyReviewed;

//   return (
//     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
//       {/* REVIEW LIST
//         Pass the fetched reviews down so ReviewList doesn't have to fetch them again.
//         Pass currentUserId and isOwnProfile so ReviewList knows whether to show "Delete" or "Reply" buttons.
//       */}
//       <ReviewList
//         targetId={profileId}
//         reviews={reviews}
//         isLoading={isLoading}
//         currentUserId={currentUserId}
//         isOwnProfile={isOwnProfile}
//       />

//       {/* REVIEW FORM */}
//       {canLeaveReview && (
//         <Card className="sticky top-24">
//           <CardHeader>
//             <CardTitle>Оставить отзыв</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <ReviewForm
//               targetId={profileId}
//               authorId={currentUserId!}
//               authorName={currentUserName || "Пользователь"}
//               onSubmitSuccess={onReviewSubmit}
//             />
//           </CardContent>
//         </Card>
//       )}
//     </div>
//   );
// };

// export default ReviewsSection;

"use client";

import { useReviews } from "@/services/reviews";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import ReviewList from "@/components/ReviewList";
import ReviewForm from "@/components/ReviewForm";
import { MessageSquareQuote, CheckCircle2, PenLine } from "lucide-react";
import { cn } from "@/utils/utils";

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
  const isLoggedIn = !!currentUserId;

  // Only show the review form if: logged in, not own profile, hasn't reviewed yet
  const canLeaveReview = isLoggedIn && !isOwnProfile && !hasAlreadyReviewed;

  return (
    <div className="flex flex-col space-y-8 py-4 animate-in fade-in duration-500">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border/50 pb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2.5 text-foreground">
            <MessageSquareQuote className="w-7 h-7 text-primary" />
            Отзывы клиентов
          </h2>
          <p className="text-muted-foreground mt-1.5 text-sm sm:text-base">
            Что говорят заказчики о работе специалиста
          </p>
        </div>
      </div>

      {/* DYNAMIC GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start relative">
        {/* REVIEW LIST COLUMN */}
        {/* Expands to full width max-4xl if there is no sidebar form */}
        <div
          className={cn(
            "w-full transition-all duration-500",
            (canLeaveReview || hasAlreadyReviewed) && !isOwnProfile
              ? "lg:col-span-7 xl:col-span-8"
              : "lg:col-span-12 max-w-4xl mx-auto",
          )}
        >
          <ReviewList
            targetId={profileId}
            reviews={reviews}
            isLoading={isLoading}
            currentUserId={currentUserId}
            isOwnProfile={isOwnProfile}
          />
        </div>

        {/* SIDEBAR COLUMN (Form or Status) */}
        {!isOwnProfile && (
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="sticky top-24 space-y-6">
              {/* STATE 1: CAN LEAVE REVIEW */}
              {canLeaveReview && (
                <Card className="border-border/60 shadow-lg shadow-primary/5 bg-gradient-to-b from-card to-card/50 overflow-hidden">
                  <div className="h-1.5 w-full bg-primary" />
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <PenLine className="w-5 h-5 text-primary" />
                      Оставить отзыв
                    </CardTitle>
                    <CardDescription>
                      Поделитесь своими впечатлениями о сотрудничестве
                    </CardDescription>
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

              {/* STATE 2: ALREADY REVIEWED */}
              {hasAlreadyReviewed && (
                <Card className="border-emerald-500/20 bg-emerald-500/5 shadow-sm text-center py-8 px-6">
                  <CardContent className="p-0 flex flex-col items-center justify-center space-y-3">
                    <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h4 className="font-semibold text-lg text-emerald-900 dark:text-emerald-400">
                      Ваш отзыв опубликован
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Спасибо за вашу обратную связь! Ваш отзыв помогает другим
                      пользователям сделать правильный выбор.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewsSection;
