"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RatingStars } from "@/components/ui/rating-stars"; // Import stars component // Импорт компонента звезд
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useSubmitReview } from "@/services/reviews"; // Use the new React Query hook
import { Loader2 } from "lucide-react";

// Form validation schema // Схема валидации формы
const formSchema = z.object({
  rating: z.number().min(1, "Оценка обязательна").max(5), // Rating is required // Оценка обязательна
  comment: z
    .string()
    .max(1000, "Комментарий не должен превышать 1000 символов")
    .optional(), // Comment should not exceed 1000 characters // Комментарий не должен превышать 1000 символов
});

type ReviewFormValues = z.infer<typeof formSchema>;

interface ReviewFormProps {
  targetId: string; // ID of the user receiving the review (Generic)
  authorId: string; // ID of the user writing the review
  authorName: string; // Name of the user writing the review
  onSubmitSuccess?: () => void; // Optional callback function after successful submission
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  targetId,
  authorId, // Note: The backend extracts this from the token now, but it's good to keep in props for reference
  authorName,
  onSubmitSuccess,
}) => {
  const { toast } = useToast(); // Hook for notifications // Хук для уведомлений

  // Use the new mutation hook
  const submitReviewMutation = useSubmitReview();

  // Initialize form using react-hook-form // Инициализация формы с помощью react-hook-form
  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rating: 0, // Initial rating value // Начальное значение рейтинга
      comment: "",
    },
  });

  // Form submission handler // Обработчик отправки формы
  const onSubmit = (data: ReviewFormValues) => {
    // Check if a rating was selected // Проверка, что оценка была выбрана
    if (data.rating === 0) {
      form.setError("rating", {
        type: "manual",
        message: "Пожалуйста, выберите оценку.",
      }); // Please select a rating.
      return;
    }

    submitReviewMutation.mutate(
      {
        targetId,
        rating: data.rating,
        comment: data.comment || "",
      },
      {
        onSuccess: () => {
          // Show success notification // Показываем уведомление об успехе
          toast({
            variant: "success",
            title: "Отзыв добавлен", // Review added
            description: "Спасибо за ваш отзыв!", // Thank you for your review!
          });

          form.reset({ rating: 0, comment: "" }); // Reset the form // Сброс формы

          // Call the success callback if provided // Вызываем колбэк при успехе, если он есть
          if (onSubmitSuccess) {
            onSubmitSuccess();
          }
        },
        onError: (error: any) => {
          console.error("Ошибка добавления отзыва:", error); // Error adding review
          // Show error notification // Показываем уведомление об ошибке
          toast({
            variant: "destructive",
            title: "Ошибка", // Error
            description:
              error.response?.data?.message ||
              "Не удалось добавить отзыв. Попробуйте позже.",
          });
        },
      },
    );
  };

  const isSubmitting = submitReviewMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Rating selection field */} {/* Поле для выбора рейтинга */}
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ваша оценка</FormLabel> {/* Your Rating */}
              <FormControl>
                {/* Use RatingStars component for input */}
                {/* Используем компонент RatingStars для ввода */}
                <RatingStars
                  value={field.value}
                  onValueChange={(newValue) => field.onChange(newValue)} // Update form value on click // Обновляем значение формы при клике
                  readOnly={isSubmitting} // Disable when submitting // Отключить во время отправки
                  size={24} // Increase star size // Увеличим размер звезд
                  className="mt-1"
                />
              </FormControl>
              <FormMessage /> {/* Display validation errors */}{" "}
              {/* Отображение ошибок валидации */}
            </FormItem>
          )}
        />
        {/* Comment input field */} {/* Поле для ввода комментария */}
        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ваш комментарий (необязательно)</FormLabel>{" "}
              {/* Your Comment (optional) */}
              <FormControl>
                <Textarea
                  placeholder="Поделитесь вашими впечатлениями..." // Share your impressions...
                  {...field}
                  disabled={isSubmitting} // Disable when submitting // Отключить во время отправки
                  className="bg-background"
                />
              </FormControl>
              <FormMessage /> {/* Display validation errors */}{" "}
              {/* Отображение ошибок валидации */}
            </FormItem>
          )}
        />
        {/* Submit button */} {/* Кнопка отправки */}
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isSubmitting} variant="destructive">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Отправка..." : "Отправить отзыв"}{" "}
            {/* Sending... / Submit Review */}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ReviewForm;
