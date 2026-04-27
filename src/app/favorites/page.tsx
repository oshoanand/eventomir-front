"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
import {
  getFavorites,
  removeFromFavorites,
  FavoritePerformer,
} from "@/services/favorites";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

const FavoritesPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [favorites, setFavorites] = useState<FavoritePerformer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const currentUserId = session?.user?.id;

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!currentUserId) {
        if (status === "unauthenticated") setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const favoritePerformers = await getFavorites(currentUserId);
        setFavorites(favoritePerformers);
      } catch (error) {
        console.error("Ошибка загрузки избранного:", error);
        toast({
          variant: "destructive",
          title: "Ошибка",
          description: "Не удалось загрузить список избранного.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
  }, [currentUserId, status, toast]);

  const handleRemoveFavorite = async (
    performerId: string,
    performerName: string,
  ) => {
    if (!currentUserId) return;

    try {
      await removeFromFavorites(currentUserId, performerId);
      setFavorites((prev) => prev.filter((p) => p.id !== performerId));
      toast({
        title: "Удалено из избранного",
        description: `${performerName} удален(а) из вашего списка избранного.`,
        variant: "success",
      });
    } catch (error) {
      console.error("Ошибка удаления из избранного:", error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось удалить исполнителя из избранного.",
      });
    }
  };

  const FavoriteCardSkeleton = () => (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
            <div className="flex flex-wrap gap-1">
              <Skeleton className="h-4 w-16 rounded-full" />
              <Skeleton className="h-4 w-20 rounded-full" />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </CardContent>
    </Card>
  );

  // If still verifying authentication, show skeletons
  if (status === "loading") {
    return (
      <div className="container max-w-4xl mx-auto py-10 px-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-4">
            <FavoriteCardSkeleton />
            <FavoriteCardSkeleton />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-10 px-4">
      <Card className="rounded-[2rem] shadow-sm border-border/50">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Избранные исполнители
          </CardTitle>
          <CardDescription className="text-base">
            Здесь отображаются исполнители, которых вы добавили в избранное.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <>
              <FavoriteCardSkeleton />
              <FavoriteCardSkeleton />
              <FavoriteCardSkeleton />
            </>
          ) : favorites.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center border-2 border-dashed rounded-2xl bg-muted/5">
              <Star className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-lg font-bold text-foreground mb-1">
                Список пуст
              </p>
              <p className="text-muted-foreground">
                Вы еще не добавили ни одного исполнителя в избранное.
              </p>
            </div>
          ) : (
            favorites.map((performer) => (
              <Card
                key={performer.id}
                className="rounded-2xl shadow-sm hover:shadow-md transition-all"
              >
                <CardContent className="flex items-center justify-between p-4 md:p-5">
                  <div className="flex items-center gap-4 flex-grow overflow-hidden">
                    <Avatar className="h-14 w-14 border border-border/50 shadow-sm">
                      <AvatarImage
                        src={performer.image || undefined}
                        alt={performer.name}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {performer.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-grow min-w-0">
                      <Link
                        href={`/performer-profile?id=${performer.id}`}
                        className="hover:text-primary transition-colors"
                      >
                        <h3 className="font-bold text-lg leading-tight truncate">
                          {performer.name}
                        </h3>
                      </Link>
                      {performer.city && (
                        <p className="text-sm font-medium text-muted-foreground truncate mt-0.5">
                          {performer.city}
                        </p>
                      )}
                      {performer.roles && performer.roles.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {performer.roles.slice(0, 3).map((role) => (
                            <Badge
                              key={role}
                              variant="secondary"
                              className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5"
                            >
                              {role}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="rounded-xl h-10 w-10 bg-primary/10 text-primary hover:bg-primary/20"
                      title="Написать"
                      onClick={() => router.push(`/chat/${performer.id}`)}
                    >
                      <MessageSquare className="h-5 w-5" />
                      <span className="sr-only">Написать</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-xl h-10 w-10 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-transparent transition-colors"
                      onClick={() =>
                        handleRemoveFavorite(performer.id, performer.name)
                      }
                      title="Удалить из избранного"
                    >
                      <Trash2 className="h-5 w-5" />
                      <span className="sr-only">Удалить из избранного</span>
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
