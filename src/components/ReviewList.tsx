"use client";

import * as React from "react";
import { useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

import {
  useReplyToReview,
  useDeleteReview,
  useEditReview,
  useDeleteReplyToReview, // <-- Import the new hook
  type Review,
} from "@/services/reviews";
import { RatingStars } from "@/components/ui/rating-stars";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Trash2,
  MessageSquareReply,
  Loader2,
  Star,
  Edit2,
  X,
  Check,
} from "lucide-react";

interface ReviewListProps {
  targetId: string;
  reviews: Review[];
  isLoading: boolean;
  currentUserId?: string | null;
  isOwnProfile: boolean;
}

const ReviewList: React.FC<ReviewListProps> = ({
  targetId,
  reviews,
  isLoading,
  currentUserId,
  isOwnProfile,
}) => {
  const { toast } = useToast();

  // Reply State (Used for both New and Edit)
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  // Edit Review State
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState<number>(0);
  const [editComment, setEditComment] = useState("");

  // Mutations
  const submitReplyMutation = useReplyToReview();
  const deleteReplyMutation = useDeleteReplyToReview(); // <-- New mutation
  const deleteReviewMutation = useDeleteReview();
  const editReviewMutation = useEditReview();

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const getImageUrl = (path?: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8800"}${path}`;
  };

  // Submit a new reply OR edit an existing one
  const handleReplySubmit = (reviewId: string) => {
    if (!replyText.trim()) return;
    submitReplyMutation.mutate(
      { reviewId, replyText, targetId },
      {
        onSuccess: () => {
          toast({ variant: "success", title: "Ответ сохранен!" });
          setReplyingTo(null);
          setReplyText("");
        },
        onError: (error: any) => {
          toast({
            variant: "destructive",
            title: "Ошибка",
            description:
              error.response?.data?.message || "Не удалось сохранить ответ.",
          });
        },
      },
    );
  };

  // Delete an existing reply
  const handleDeleteReply = (reviewId: string) => {
    if (confirm("Удалить ваш ответ?")) {
      deleteReplyMutation.mutate(
        { reviewId, targetId },
        {
          onSuccess: () => toast({ variant: "success", title: "Ответ удален" }),
          onError: () =>
            toast({ variant: "destructive", title: "Ошибка удаления" }),
        },
      );
    }
  };

  const startEditingReview = (review: Review) => {
    setEditingReviewId(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment || "");
    setReplyingTo(null);
  };

  const cancelEditingReview = () => {
    setEditingReviewId(null);
    setEditRating(0);
    setEditComment("");
  };

  const handleEditReviewSubmit = (reviewId: string) => {
    if (editRating === 0) return;
    editReviewMutation.mutate(
      { reviewId, rating: editRating, comment: editComment, targetId },
      {
        onSuccess: () => {
          toast({ variant: "success", title: "Отзыв обновлен!" });
          cancelEditingReview();
        },
        onError: (error: any) => {
          toast({
            variant: "destructive",
            title: "Ошибка",
            description: error.response?.data?.message,
          });
        },
      },
    );
  };

  const ReviewSkeleton = () => (
    <div className="flex items-start space-x-4 py-6">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-3">
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );

  return (
    <div className="space-y-0">
      <h3 className="text-xl font-bold mb-6">
        Все отзывы{" "}
        {reviews.length > 0 && (
          <span className="text-muted-foreground font-normal text-base ml-1">
            ({reviews.length})
          </span>
        )}
      </h3>

      {isLoading ? (
        <div className="space-y-4">
          <ReviewSkeleton />
          <Separator />
          <ReviewSkeleton />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 bg-muted/10 rounded-xl border border-dashed">
          <Star className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
          <h4 className="font-bold text-lg mb-1">Пока нет отзывов</h4>
          <p className="text-sm text-muted-foreground">
            {isOwnProfile
              ? "У вас пока нет отзывов. Выполняйте заказы и просите клиентов оценить вашу работу!"
              : "Станьте первым, кто оставит отзыв!"}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {reviews.map((review) => {
            const isEditingReview = editingReviewId === review.id;
            const isEditingReply = replyingTo === review.id;

            const isEdited =
              review.updated_at &&
              new Date(review.updated_at).getTime() >
                new Date(review.created_at).getTime() + 1000;

            return (
              <div key={review.id} className="py-6 first:pt-0">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border shadow-sm">
                      <AvatarImage
                        src={getImageUrl(review.author?.profile_picture)}
                      />
                      <AvatarFallback className="bg-primary/5 font-bold">
                        {getInitials(review.author?.name || "Пользователь")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-bold text-sm">
                        {review.author?.name || "Пользователь"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(review.created_at), "d MMMM yyyy", {
                          locale: ru,
                        })}
                        {isEdited && (
                          <span className="italic opacity-80 ml-1">
                            (изменено)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isEditingReview && (
                      <RatingStars value={review.rating} readOnly size={16} />
                    )}

                    {review.author_id === currentUserId && !isEditingReview && (
                      <div className="flex ml-2 gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => startEditingReview(review)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            if (
                              confirm(
                                "Вы уверены, что хотите удалить этот отзыв?",
                              )
                            ) {
                              deleteReviewMutation.mutate({
                                reviewId: review.id,
                                targetId,
                              });
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {isEditingReview ? (
                  <div className="pl-14 space-y-3 animate-in fade-in">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium">Оценка:</span>
                      <RatingStars
                        value={editRating}
                        onValueChange={setEditRating}
                        readOnly={editReviewMutation.isPending}
                        size={20}
                      />
                    </div>
                    <Textarea
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                      className="text-sm resize-none bg-background"
                      rows={3}
                      disabled={editReviewMutation.isPending}
                    />
                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={cancelEditingReview}
                        disabled={editReviewMutation.isPending}
                      >
                        <X className="h-4 w-4 mr-2" /> Отмена
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleEditReviewSubmit(review.id)}
                        disabled={editReviewMutation.isPending}
                      >
                        {editReviewMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="mr-2 h-4 w-4" />
                        )}
                        Сохранить
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap pl-14">
                    {review.comment}
                  </p>
                )}

                {/* --- REPLY SECTION --- */}
                {!isEditingReview && (
                  <div className="pl-14 mt-4">
                    {/* IF EDITING REPLY OR CREATING NEW REPLY */}
                    {isEditingReply ? (
                      <div className="mt-2 space-y-3 animate-in fade-in slide-in-from-top-2">
                        <Textarea
                          placeholder="Напишите ответ на отзыв..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          className="text-sm resize-none bg-background"
                          rows={3}
                          autoFocus
                          disabled={submitReplyMutation.isPending}
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={submitReplyMutation.isPending}
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyText("");
                            }}
                          >
                            Отмена
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleReplySubmit(review.id)}
                            disabled={
                              submitReplyMutation.isPending || !replyText.trim()
                            }
                          >
                            {submitReplyMutation.isPending && (
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                            )}
                            Сохранить
                          </Button>
                        </div>
                      </div>
                    ) : review.reply ? (
                      /* IF REPLY EXISTS (Render text + Edit/Delete hover buttons) */
                      <div className="bg-muted/40 border-l-4 border-l-primary rounded-r-lg p-4 group relative">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquareReply className="h-4 w-4 text-primary" />
                          <span className="font-bold text-xs text-primary">
                            Ваш ответ
                          </span>
                          <span className="text-[10px] text-muted-foreground ml-auto">
                            {review.reply_created_at &&
                              format(
                                new Date(review.reply_created_at),
                                "d MMM yyyy",
                                { locale: ru },
                              )}
                          </span>

                          {/* Reply Edit/Delete Actions (Shows on hover for the owner) */}
                          {isOwnProfile && (
                            <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-primary"
                                onClick={() => {
                                  setReplyingTo(review.id);
                                  setReplyText(review.reply || "");
                                }}
                                title="Редактировать ответ"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteReply(review.id)}
                                disabled={deleteReplyMutation.isPending}
                                title="Удалить ответ"
                              >
                                {deleteReplyMutation.isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-foreground/90 whitespace-pre-wrap">
                          {review.reply}
                        </p>
                      </div>
                    ) : (
                      /* NO REPLY EXISTS: Show "Reply" Button to Owner */
                      isOwnProfile && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-primary h-8 px-2"
                          onClick={() => {
                            setReplyingTo(review.id);
                            setReplyText("");
                          }}
                        >
                          <MessageSquareReply className="h-4 w-4 mr-2" />{" "}
                          Ответить
                        </Button>
                      )
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReviewList;
