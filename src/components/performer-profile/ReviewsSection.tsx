"use client";

import { useReviews } from "@/services/reviews";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import ReviewList from "@/components/performer-profile/reviews/ReviewList";
import ReviewForm from "@/components/performer-profile/reviews/ReviewForm";
import {
  MessageSquareQuote,
  CheckCircle2,
  PenLine,
  Loader2,
} from "lucide-react";

interface ReviewsSectionProps {
  profileId: string;
  currentUserRole?: string | null;
  currentUserId?: string | null;
  currentUserName?: string | null;
  onReviewSubmit?: () => void;
}

export default function ReviewsSection({
  profileId,
  currentUserRole,
  currentUserId,
  currentUserName,
  onReviewSubmit,
}: ReviewsSectionProps) {
  // 1. Fetch data from React Query
  const { data: reviews, isLoading } = useReviews(profileId);

  // 2. Safe Array Extraction
  const safeReviews = reviews || [];

  // 3. --- Derived State ---
  const isOwnProfile = Boolean(currentUserId && currentUserId === profileId);
  const isLoggedIn = Boolean(currentUserId);

  // SAFE CHECK: Ensure the user is logged in before checking if they already reviewed
  const hasAlreadyReviewed =
    isLoggedIn &&
    safeReviews.some(
      (r: any) => r.author_id === currentUserId || r.authorId === currentUserId,
    );

  // Only show the review form if: logged in, not own profile, hasn't reviewed yet
  const canLeaveReview = isLoggedIn && !isOwnProfile && !hasAlreadyReviewed;

  // 4. Loading State Guard
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 animate-in fade-in">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-medium">Загрузка отзывов...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-8 py-4 animate-in fade-in duration-500 max-w-4xl mx-auto">
      {/* ================= HEADER SECTION ================= */}
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

      {/* ================= TOP SECTION: FORM OR STATUS ================= */}
      {!isOwnProfile && isLoggedIn && (
        <div className="w-full space-y-6">
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
                  authorId={currentUserId as string}
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
                <p className="text-sm text-muted-foreground leading-relaxed max-w-lg mx-auto">
                  Спасибо за вашу обратную связь! Ваш отзыв помогает другим
                  пользователям сделать правильный выбор.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ================= BOTTOM SECTION: REVIEWS LIST ================= */}
      <div className="w-full">
        <ReviewList
          targetId={profileId}
          reviews={safeReviews}
          isLoading={isLoading}
          currentUserId={currentUserId}
          isOwnProfile={isOwnProfile}
        />
      </div>
    </div>
  );
}
