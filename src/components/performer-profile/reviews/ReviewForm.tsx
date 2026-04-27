"use client";

import { useState } from "react";
import { useSubmitReview } from "@/services/reviews";
import { useToast } from "@/hooks/use-toast";

// --- UI Components ---
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Loader2, Send } from "lucide-react";
import { cn } from "@/utils/utils";

interface ReviewFormProps {
  targetId: string;
  authorId: string;
  authorName: string;
  onSubmitSuccess?: () => void;
}

export default function ReviewForm({
  targetId,
  authorId,
  authorName,
  onSubmitSuccess,
}: ReviewFormProps) {
  const { toast } = useToast();
  const submitMut = useSubmitReview();

  // Local State
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast({
        variant: "destructive",
        title: "Оценка обязательна",
        description: "Пожалуйста, выберите количество звезд от 1 до 5.",
      });
      return;
    }

    if (!comment.trim()) {
      toast({
        variant: "destructive",
        title: "Текст обязателен",
        description: "Пожалуйста, напишите пару слов о вашем опыте.",
      });
      return;
    }

    submitMut.mutate(
      { targetId, rating, comment },
      {
        onSuccess: () => {
          toast({
            title: "Успешно!",
            description: "Ваш отзыв опубликован.",
          });
          // Reset form
          setRating(0);
          setHoverRating(0);
          setComment("");
          // Notify parent to refresh or hide form
          if (onSubmitSuccess) onSubmitSuccess();
        },
        onError: (error: any) => {
          toast({
            variant: "destructive",
            title: "Ошибка",
            description:
              error.message || "Не удалось отправить отзыв. Попробуйте позже.",
          });
        },
      },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in">
      {/* --- Star Rating Interactive Selector --- */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-foreground">
          Ваша оценка <span className="text-destructive">*</span>
        </Label>
        <div
          className="flex gap-1"
          onMouseLeave={() => setHoverRating(0)} // Reset hover effect when mouse leaves container
        >
          {[1, 2, 3, 4, 5].map((star) => {
            const isActive = star <= (hoverRating || rating);
            return (
              <button
                key={star}
                type="button"
                className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                onMouseEnter={() => setHoverRating(star)}
                onClick={() => setRating(star)}
              >
                <Star
                  className={cn(
                    "w-8 h-8 transition-colors",
                    isActive
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/30 hover:text-amber-200",
                  )}
                />
              </button>
            );
          })}
        </div>
        {rating === 0 && (
          <p className="text-xs text-muted-foreground">
            Нажмите на звезды, чтобы оценить
          </p>
        )}
      </div>

      {/* --- Comment Textarea --- */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-foreground">
          Текст отзыва <span className="text-destructive">*</span>
        </Label>
        <Textarea
          placeholder="Опишите ваши впечатления от работы со специалистом. Что понравилось? Были ли минусы?"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="min-h-[120px] resize-none rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/50 text-[15px]"
          disabled={submitMut.isPending}
        />
      </div>

      {/* --- Submit Button --- */}
      <Button
        type="submit"
        className="w-full h-12 rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
        disabled={submitMut.isPending || rating === 0 || !comment.trim()}
      >
        {submitMut.isPending ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Отправка...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" /> Опубликовать отзыв
          </>
        )}
      </Button>
    </form>
  );
}
