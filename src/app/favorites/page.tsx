"use client";

import { useState, useEffect } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, MessageSquare, Star } from "lucide-react";
import { getFavorites, removeFromFavorites, FavoritePerformer } from "@/services/favorites";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton // Импорт скелетона

const FavoritesPage = () => {
    const [favorites, setFavorites] = useState<FavoritePerformer[]>([]); // State for favorite performers // Состояние для избранных исполнителей
    const [isLoading, setIsLoading] = useState(true); // Loading state // Состояние загрузки
    const { toast } = useToast(); // Hook for notifications // Хук для уведомлений

    // TODO: Get current user ID (customer) from authentication context
    // TODO: Получить ID текущего пользователя (заказчика) из контекста аутентификации
    const currentUserId = 'cust456'; // Placeholder for customer ID // Заглушка для ID заказчика

    useEffect(() => {
        // Function to fetch favorite performers
        // Функция для получения избранных исполнителей
        const fetchFavorites = async () => {
            setIsLoading(true);
            try {
                const favoritePerformers = await getFavorites(currentUserId);
                setFavorites(favoritePerformers);
            } catch (error) {
                console.error("Ошибка загрузки избранного:", error); // Error loading favorites:
                toast({
                    variant: "destructive",
                    title: "Ошибка", // Error
                    description: "Не удалось загрузить список избранного.", // Could not load favorites list.
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchFavorites();
    }, [currentUserId, toast]); // Dependencies: currentUserId, toast // Зависимости: currentUserId, toast

    // Handler to remove a performer from favorites
    // Обработчик удаления исполнителя из избранного
    const handleRemoveFavorite = async (performerId: string, performerName: string) => {
        try {
            await removeFromFavorites(currentUserId, performerId);
            setFavorites(prev => prev.filter(p => p.id !== performerId)); // Update local state // Обновляем локальное состояние
            toast({
                title: "Удалено из избранного", // Removed from favorites
                description: `${performerName} удален(а) из вашего списка избранного.`, // ${performerName} removed from your favorites list.
                variant: "destructive"
            });
        } catch (error) {
            console.error("Ошибка удаления из избранного:", error); // Error removing from favorites:
            toast({
                variant: "destructive",
                title: "Ошибка", // Error
                description: "Не удалось удалить исполнителя из избранного.", // Could not remove performer from favorites.
            });
        }
    };

    // Skeleton component for the favorite card
    // Компонент для отображения скелетона карточки
    const FavoriteCardSkeleton = () => (
        <Card>
            <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" /> {/* Avatar Skeleton */}
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" /> {/* Name Skeleton */}
                        <Skeleton className="h-3 w-24" /> {/* City Skeleton */}
                        <div className="flex flex-wrap gap-1">
                             <Skeleton className="h-4 w-16 rounded-full" /> {/* Role Skeleton */}
                             <Skeleton className="h-4 w-20 rounded-full" /> {/* Role Skeleton */}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-8 w-8" /> {/* Message Button Skeleton */}
                    <Skeleton className="h-8 w-8" /> {/* Remove Button Skeleton */}
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="container mx-auto py-10">
            <Card>
                <CardHeader>
                    <CardTitle>Избранные исполнители</CardTitle> {/* Favorite Performers */}
                    <CardDescription>
                        Здесь отображаются исполнители, которых вы добавили в избранное. {/* Performers you've added to your favorites are displayed here. */}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isLoading ? (
                        // Display skeletons while loading
                        // Отображение скелетонов во время загрузки
                        <>
                            <FavoriteCardSkeleton />
                            <FavoriteCardSkeleton />
                            <FavoriteCardSkeleton />
                        </>
                    ) : favorites.length === 0 ? (
                        // Message if no favorites
                        // Сообщение, если нет избранных
                        <p className="text-center text-muted-foreground">
                            Вы еще не добавили ни одного исполнителя в избранное. {/* You haven't added any performers to favorites yet. */}
                        </p>
                    ) : (
                        // Display list of favorites
                        // Отображение списка избранного
                        favorites.map((performer) => (
                            <Card key={performer.id}>
                                <CardContent className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-4 flex-grow overflow-hidden">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={performer.profilePicture} alt={performer.name} />
                                            <AvatarFallback>{performer.name.substring(0, 1).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-grow min-w-0"> {/* Added min-w-0 for proper wrapping */} {/* Добавлено min-w-0 для корректного переноса */}
                                            {/* Link to performer profile */}
                                            {/* Ссылка на профиль исполнителя */}
                                            <Link href={`/performer-profile?id=${performer.id}`} className="hover:underline">
                                                <h3 className="font-semibold truncate">{performer.name}</h3>
                                            </Link>
                                            {performer.city && (
                                                <p className="text-sm text-muted-foreground truncate">{performer.city}</p>
                                            )}
                                            {/* Display roles */}
                                            {/* Отображение ролей */}
                                            {performer.roles && performer.roles.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {performer.roles.map(role => (
                                                        <Badge key={role} variant="secondary" className="text-xs">{role}</Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 ml-4 flex-shrink-0">
                                         {/* "Write" button (navigate to chat) */}
                                         {/* Кнопка "Написать" (переход в чат) */}
                                        {/* TODO: Implement opening chat */}
                                        {/* TODO: Реализовать открытие чата */}
                                        <Button variant="outline" size="icon" title="Написать"> {/* Write */}
                                            <MessageSquare className="h-4 w-4" />
                                            <span className="sr-only">Написать</span> {/* Write */}
                                        </Button>
                                        {/* "Remove from favorites" button */}
                                        {/* Кнопка "Удалить из избранного" */}
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            onClick={() => handleRemoveFavorite(performer.id, performer.name)}
                                            title="Удалить из избранного" // Remove from favorites
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Удалить из избранного</span> {/* Remove from favorites */}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default FavoritesPage;