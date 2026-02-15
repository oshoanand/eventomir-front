"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { getReviewsByPerformer, type Review } from "@/services/reviews"; // Import service and type // Импорт сервиса и типа
import { RatingStars } from "@/components/ui/rating-stars"; // Import stars component // Импорт компонента звезд
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Avatar component // Аватар
import { format } from "date-fns"; // For date formatting // Для форматирования даты
import { ru } from 'date-fns/locale'; // Russian locale // Русская локаль
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Card components // Компоненты карточки
import { Skeleton } from "@/components/ui/skeleton"; // For skeleton loading // Для скелетной загрузки
import { Separator } from "@/components/ui/separator"; // Separator component // Компонент разделителя

interface ReviewListProps {
  performerId: string; // ID of the performer whose reviews are displayed // ID исполнителя, чьи отзывы отображаем
}

const ReviewList: React.FC<ReviewListProps> = ({ performerId }) => {
  const [reviews, setReviews] = useState<Review[]>([]); // State for reviews // Состояние для отзывов
  const [isLoading, setIsLoading] = useState(true); // Loading state // Состояние загрузки
  const [error, setError] = useState<string | null>(null); // Error state // Состояние ошибки

  // Fetch reviews when the component mounts or performerId changes
  // Получаем отзывы при монтировании компонента или изменении performerId
  useEffect(() => {
    const fetchReviews = async () => {
      if (!performerId) return;
      setIsLoading(true);
      setError(null);
      try {
        const fetchedReviews = await getReviewsByPerformer(performerId);
        setReviews(fetchedReviews);
      } catch (err) {
        console.error("Ошибка загрузки отзывов:", err); // Error loading reviews:
        setError("Не удалось загрузить отзывы."); // Could not load reviews.
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [performerId]); // Reload when performerId changes // Перезагрузка при смене performerId

  // Function to generate initials // Функция для генерации инициалов
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  // Component to display a single review item // Компонент для отображения одного отзыва
  const ReviewItem: React.FC<{review: Review}> = ({ review }) => (
    <div className="flex items-start space-x-4 py-4">
      {/* Customer Avatar */} {/* Аватар заказчика */}
      <Avatar>
        {/* TODO: Replace with actual customer avatar URL if available */}
        {/* TODO: Заменить на реальный URL аватара заказчика, если он есть */}
        {/* <AvatarImage src={review.customerAvatarUrl} alt={review.customerName} /> */}
        <AvatarFallback>{getInitials(review.customerName)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          {/* Customer Name */} {/* Имя заказчика */}
          <p className="font-medium">{review.customerName}</p>
          {/* Rating Stars */} {/* Рейтинг */}
          <RatingStars value={review.rating} readOnly size={16} />
        </div>
         {/* Review Comment */} {/* Комментарий */}
        <p className="text-sm text-muted-foreground">{review.comment}</p>
         {/* Review Date */} {/* Дата отзыва */}
        <p className="text-xs text-muted-foreground pt-1">
          {format(new Date(review.timestamp), 'd MMMM yyyy', { locale: ru })}
        </p>
      </div>
    </div>
  );

  // Component for skeleton loading state // Компонент для скелетной загрузки
  const ReviewSkeleton = () => (
      <div className="flex items-start space-x-4 py-4">
          <Skeleton className="h-10 w-10 rounded-full" /> {/* Avatar Skeleton */}
          <div className="flex-1 space-y-2">
              <div className="flex justify-between">
                   <Skeleton className="h-4 w-1/4" /> {/* Name Skeleton */}
                   <Skeleton className="h-4 w-16" /> {/* Rating Skeleton */} {/* Skeleton for stars */}
              </div>
               <Skeleton className="h-4 w-3/4" /> {/* Comment Skeleton */}
               <Skeleton className="h-3 w-1/5" /> {/* Date Skeleton */}
          </div>
      </div>
  );


  return (
    <Card>
      <CardHeader>
        <CardTitle>Отзывы ({reviews.length})</CardTitle> {/* Reviews */}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          // Display skeletons while loading
          // Отображение скелетонов во время загрузки
          <div className="space-y-4">
             <ReviewSkeleton />
             <Separator />
             <ReviewSkeleton />
             <Separator />
             <ReviewSkeleton />
          </div>
        ) : error ? (
           // Display error message
           // Отображение сообщения об ошибке
          <p className="text-destructive">{error}</p>
        ) : reviews.length === 0 ? (
           // Message if no reviews exist
           // Сообщение, если отзывов нет
          <p className="text-muted-foreground">Отзывов пока нет.</p> // No reviews yet.
        ) : (
           // Display the list of reviews
           // Отображение списка отзывов
          <div className="divide-y divide-border">
            {reviews.map((review, index) => (
               // Add Separator between reviews, except for the last one
               // Добавляем Separator между отзывами, кроме последнего
               <React.Fragment key={review.id}>
                   <ReviewItem review={review} />
                   {index < reviews.length - 1 &&  <Separator />}
               </React.Fragment>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReviewList;
