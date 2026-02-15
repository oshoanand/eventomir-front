"use client";

import * as React from "react";
import { useState } from "react";
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
import { addReview } from "@/services/reviews"; // Import review service // Импорт сервиса отзывов

// Form validation schema // Схема валидации формы
const formSchema = z.object({
  rating: z.number().min(1, "Оценка обязательна").max(5), // Rating is required // Оценка обязательна
  comment: z.string().max(1000, "Комментарий не должен превышать 1000 символов").optional(), // Comment should not exceed 1000 characters // Комментарий не должен превышать 1000 символов
});

type ReviewFormValues = z.infer<typeof formSchema>;

interface ReviewFormProps {
  performerId: string; // ID of the performer being reviewed // ID исполнителя, для которого оставляется отзыв
  customerId: string; // ID of the customer (get from authentication) // ID заказчика (получать из аутентификации)
  customerName: string; // Name of the customer (get from authentication) // Имя заказчика (получать из аутентификации)
  onSubmitSuccess?: () => void; // Optional callback function after successful submission // Необязательная функция обратного вызова после успешной отправки
}

const ReviewForm: React.FC<ReviewFormProps> = ({
  performerId,
  customerId,
  customerName,
  onSubmitSuccess,
}) => {
  const { toast } = useToast(); // Hook for notifications // Хук для уведомлений
  const [isSubmitting, setIsSubmitting] = useState(false); // Submission state // Состояние отправки

  // Initialize form using react-hook-form // Инициализация формы с помощью react-hook-form
  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rating: 0, // Initial rating value // Начальное значение рейтинга
      comment: "",
    },
  });

  // Form submission handler // Обработчик отправки формы
  const onSubmit = async (data: ReviewFormValues) => {
     // Check if a rating was selected // Проверка, что оценка была выбрана
     if (data.rating === 0) {
        form.setError("rating", { type: "manual", message: "Пожалуйста, выберите оценку." }); // Please select a rating.
        return;
    }
    setIsSubmitting(true); // Set submitting state // Устанавливаем состояние отправки
    try {
      // Call the addReview service function // Вызываем функцию сервиса addReview
      await addReview({
        performerId,
        customerId,
        customerName, // Pass customer name // Передаем имя заказчика
        rating: data.rating,
        comment: data.comment || "", // Pass empty string if comment is not entered // Передаем пустую строку, если комментарий не введен
      });
      // Show success notification // Показываем уведомление об успехе
      toast({
        title: "Отзыв добавлен", // Review added
        description: "Спасибо за ваш отзыв!", // Thank you for your review!
      });
      form.reset(); // Reset the form // Сброс формы
      // Call the success callback if provided // Вызываем колбэк при успехе, если он есть
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (error) {
      console.error("Ошибка добавления отзыва:", error); // Error adding review:
      // Show error notification // Показываем уведомление об ошибке
      toast({
        variant: "destructive",
        title: "Ошибка", // Error
        description: "Не удалось добавить отзыв. Попробуйте позже.", // Could not add review. Try again later.
      });
    } finally {
      setIsSubmitting(false); // Reset submitting state // Сбрасываем состояние отправки
    }
  };

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
              <FormMessage /> {/* Display validation errors */} {/* Отображение ошибок валидации */}
            </FormItem>
          )}
        />

        {/* Comment input field */} {/* Поле для ввода комментария */}
        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ваш комментарий (необязательно)</FormLabel> {/* Your Comment (optional) */}
              <FormControl>
                <Textarea
                  placeholder="Поделитесь вашими впечатлениями..." // Share your impressions...
                  {...field}
                  disabled={isSubmitting} // Disable when submitting // Отключить во время отправки
                />
              </FormControl>
              <FormMessage /> {/* Display validation errors */} {/* Отображение ошибок валидации */}
            </FormItem>
          )}
        />

        {/* Submit button */} {/* Кнопка отправки */}
        <Button type="submit" disabled={isSubmitting} variant="destructive">
          {isSubmitting ? "Отправка..." : "Отправить отзыв"} {/* Sending... / Submit Review */}
        </Button>
      </form>
    </Form>
  );
};

export default ReviewForm;
