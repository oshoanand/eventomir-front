"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

// --- Hooks & Services ---
import {
  useEditReview,
  useDeleteReview,
  useReplyToReview,
  useDeleteReplyToReview,
} from "@/services/reviews";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/utils/utils";

// --- UI Components ---
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Star,
  MoreHorizontal,
  Edit3,
  Trash2,
  Reply,
  Loader2,
} from "lucide-react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8800";
const getImageUrl = (path: string | undefined | null) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path}`;
};

interface ReviewItemProps {
  review: any;
  currentUserId: string | null | undefined;
  isOwnProfile: boolean;
}

export default function ReviewItem({
  review,
  currentUserId,
  isOwnProfile,
}: ReviewItemProps) {
  const { toast } = useToast();

  // --- Derived Identification ---
  const isAuthor = currentUserId === review.authorId;
  const hasReply = !!review.reply && review.reply.trim() !== "";

  // --- Local States: Customer Edit ---
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [editRating, setEditRating] = useState(review.rating);
  const [editComment, setEditComment] = useState(review.comment || "");

  // --- Local States: Performer Reply ---
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState(review.reply || "");

  // --- Mutations ---
  const editReviewMut = useEditReview();
  const deleteReviewMut = useDeleteReview();
  const replyMut = useReplyToReview();
  const deleteReplyMut = useDeleteReplyToReview();

  // --- Handlers: Customer ---
  const handleSaveReviewEdit = () => {
    editReviewMut.mutate(
      {
        reviewId: review.id,
        targetId: review.targetId,
        rating: editRating,
        comment: editComment,
      },
      {
        onSuccess: () => {
          setIsEditingReview(false);
          toast({ title: "Отзыв успешно обновлен", variant: "success" });
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Ошибка при обновлении отзыва",
          });
        },
      },
    );
  };

  const handleDeleteReview = () => {
    if (hasReply) {
      return toast({
        variant: "destructive",
        title: "Невозможно удалить",
        description:
          "Исполнитель уже ответил на этот отзыв. Вы можете только изменить его.",
      });
    }
    if (confirm("Вы уверены, что хотите удалить этот отзыв навсегда?")) {
      deleteReviewMut.mutate(
        { reviewId: review.id, targetId: review.targetId },
        {
          onSuccess: () => toast({ title: "Отзыв удален", variant: "success" }),
          onError: () =>
            toast({ variant: "destructive", title: "Ошибка удаления" }),
        },
      );
    }
  };

  // --- Handlers: Performer ---
  const handleSaveReply = () => {
    replyMut.mutate(
      { reviewId: review.id, targetId: review.targetId, replyText },
      {
        onSuccess: () => {
          setIsReplying(false);
          toast({ title: "Ответ успешно сохранен", variant: "success" });
        },
        onError: () => {
          toast({ variant: "destructive", title: "Ошибка сохранения ответа" });
        },
      },
    );
  };

  const handleDeleteReply = () => {
    if (confirm("Вы уверены, что хотите удалить свой ответ?")) {
      deleteReplyMut.mutate(
        { reviewId: review.id, targetId: review.targetId },
        {
          onSuccess: () => {
            setIsReplying(false);
            setReplyText("");
            toast({ title: "Ответ удален", variant: "success" });
          },
          onError: () =>
            toast({ variant: "destructive", title: "Ошибка удаления ответа" }),
        },
      );
    }
  };

  // --- Time & Edit Tag Calculation ---
  // A review is considered edited if the updatedAt time is more than 10 seconds after createdAt
  const isEdited =
    review.updatedAt &&
    new Date(review.updatedAt).getTime() -
      new Date(review.createdAt).getTime() >
      10000;
  const isReplyEdited = review.replyUpdatedAt;

  return (
    <div className="bg-muted/10 border border-border/50 rounded-3xl p-6 transition-all hover:bg-muted/20">
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-start mb-4">
        {/* Author Info */}
        <div className="flex gap-4 items-center">
          <Avatar className="w-12 h-12">
            <AvatarImage
              src={getImageUrl(
                review.author?.profilePicture || review.author?.image,
              )}
            />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {review.author?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>

          <div>
            <h4 className="font-bold text-[16px] text-foreground">
              {review.author?.name || "Пользователь"}
            </h4>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {/* Stars */}
              <div className="flex gap-0.5 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-4 h-4",
                      i < (isEditingReview ? editRating : review.rating)
                        ? "fill-current"
                        : "text-muted-foreground/30",
                    )}
                  />
                ))}
              </div>
              {/* Date & Edit Badge */}
              <span className="text-xs text-muted-foreground md:ml-2">
                {review.createdAt
                  ? format(new Date(review.createdAt), "d MMMM yyyy", {
                      locale: ru,
                    })
                  : ""}
                {isEdited && (
                  <span className="italic ml-1.5 opacity-70">(изменено)</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Action Menu (Only visible to Author or Profile Owner) */}
        {(isAuthor || isOwnProfile) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 rounded-xl shadow-lg"
            >
              {/* Customer Actions */}
              {isAuthor && !isEditingReview && (
                <>
                  <DropdownMenuItem
                    onClick={() => setIsEditingReview(true)}
                    className="cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4 mr-2" /> Редактировать
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDeleteReview}
                    className={cn(
                      "cursor-pointer text-destructive focus:bg-destructive/10",
                      hasReply && "opacity-50 cursor-not-allowed",
                    )}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Удалить{" "}
                    {hasReply && "(Запрещено)"}
                  </DropdownMenuItem>
                </>
              )}

              {/* Performer Actions */}
              {isOwnProfile && !isReplying && (
                <>
                  <DropdownMenuItem
                    onClick={() => setIsReplying(true)}
                    className="cursor-pointer"
                  >
                    {hasReply ? (
                      <>
                        <Edit3 className="w-4 h-4 mr-2" /> Изменить ответ
                      </>
                    ) : (
                      <>
                        <Reply className="w-4 h-4 mr-2" /> Ответить
                      </>
                    )}
                  </DropdownMenuItem>

                  {hasReply && (
                    <DropdownMenuItem
                      onClick={handleDeleteReply}
                      className="cursor-pointer text-destructive focus:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Удалить ответ
                    </DropdownMenuItem>
                  )}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* ================= REVIEW BODY ================= */}
      {isEditingReview ? (
        <div className="space-y-3 bg-white p-4 rounded-2xl border shadow-sm animate-in fade-in">
          {/* Editable Stars */}
          <div className="flex gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                onClick={() => setEditRating(star)}
                className={cn(
                  "w-7 h-7 cursor-pointer transition-colors",
                  star <= editRating
                    ? "fill-amber-400 text-amber-400 hover:text-amber-500"
                    : "text-muted-foreground/30 hover:text-amber-200",
                )}
              />
            ))}
          </div>

          <Textarea
            value={editComment}
            onChange={(e) => setEditComment(e.target.value)}
            className="bg-muted/20 border-transparent rounded-xl min-h-[100px] text-[15px]"
            placeholder="Опишите ваши впечатления..."
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="ghost"
              className="rounded-xl font-semibold"
              onClick={() => {
                setIsEditingReview(false);
                setEditComment(review.comment || "");
                setEditRating(review.rating);
              }}
              disabled={editReviewMut.isPending}
            >
              Отмена
            </Button>
            <Button
              onClick={handleSaveReviewEdit}
              disabled={editReviewMut.isPending || !editComment.trim()}
              className="rounded-xl font-semibold"
            >
              {editReviewMut.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Сохранить"
              )}
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-[15px] text-foreground/90 leading-relaxed whitespace-pre-wrap pl-1 md:pl-16">
          {review.comment}
        </p>
      )}

      {/* ================= PERFORMER REPLY SECTION ================= */}
      {(hasReply || isReplying) && (
        <div className="mt-5 ml-4 md:ml-16 pl-4 border-l-2 border-primary/20 animate-in fade-in slide-in-from-left-2">
          {isReplying ? (
            <div className="space-y-3 bg-white p-4 rounded-2xl border shadow-sm">
              <Label className="text-xs font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider mb-2">
                <Reply className="w-3.5 h-3.5" /> Ваш ответ
              </Label>

              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Напишите публичный ответ заказчику..."
                className="bg-muted/20 border-transparent rounded-xl min-h-[100px] text-[14px]"
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  className="rounded-xl font-semibold"
                  onClick={() => {
                    setIsReplying(false);
                    setReplyText(review.reply || "");
                  }}
                  disabled={replyMut.isPending}
                >
                  Отмена
                </Button>
                <Button
                  onClick={handleSaveReply}
                  disabled={!replyText.trim() || replyMut.isPending}
                  className="rounded-xl bg-primary text-white font-semibold"
                >
                  {replyMut.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Опубликовать"
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-white/60 rounded-2xl p-4 border border-border/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Reply className="w-4 h-4 text-primary" /> Ответ исполнителя
                </span>
                <span className="text-xs text-muted-foreground">
                  {review.replyCreatedAt
                    ? format(new Date(review.replyCreatedAt), "d MMM yyyy", {
                        locale: ru,
                      })
                    : ""}
                  {isReplyEdited && (
                    <span className="italic ml-1.5 opacity-70">(изменено)</span>
                  )}
                </span>
              </div>
              <p className="text-[14px] text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {review.reply}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
