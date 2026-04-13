"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Edit,
  Trash2,
  PlusCircle,
  Image as ImageIcon,
  Info,
  Lock,
} from "lucide-react";
import type { GalleryItem } from "@/services/performer";
import { cn } from "@/utils/utils";
import { useTariff } from "@/hooks/use-tariff";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface GalleryManagerProps {
  gallery: GalleryItem[];
  isOwnProfile: boolean;
  onAddOrEdit: (item: GalleryItem | null) => void;
  onDelete: (id: string) => void;
}

const GalleryManager: React.FC<GalleryManagerProps> = ({
  gallery,
  isOwnProfile,
  onAddOrEdit,
  onDelete,
}) => {
  // 🚨 INJECT TARIFF HOOK
  const { getLimit, canPerformAction, isLoading } = useTariff();

  const currentCount = gallery.length;
  // Get the numerical limit from the JSON Feature Matrix (defaults to 3 if free)
  const maxPhotos = getLimit("maxPhotoUpload");
  const canUploadMore = canPerformAction("maxPhotoUpload", currentCount);

  return (
    <Card className="relative overflow-hidden border shadow-sm rounded-2xl">
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-muted/20 border-b pb-4 pt-5 gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl font-bold">Портфолио</CardTitle>
          </div>

          {/* 🚨 UI UPGRADE: Show Usage Tracker for Owner */}
          {isOwnProfile && !isLoading && (
            <span
              className={cn(
                "text-sm font-medium mt-1.5 flex items-center",
                !canUploadMore ? "text-destructive" : "text-muted-foreground",
              )}
            >
              Загружено: {currentCount} / {maxPhotos}
            </span>
          )}
        </div>

        {/* Add Button - Only shows for owner */}
        {isOwnProfile && currentCount > 0 && (
          <Button
            size="sm"
            onClick={() => onAddOrEdit(null)}
            className="h-9"
            // If they can't upload more, we don't disable the button.
            // We let them click it so the parent component can show the "Upgrade Plan" toast.
          >
            {canUploadMore ? (
              <PlusCircle className="mr-2 h-4 w-4" />
            ) : (
              <Lock className="mr-2 h-4 w-4 text-white/80" />
            )}
            Добавить работу
          </Button>
        )}
      </CardHeader>

      <CardContent className="pt-6">
        {/* 🚨 UI UPGRADE: Inline Limit Warning */}
        {isOwnProfile && !canUploadMore && currentCount > 0 && (
          <Alert className="mb-6 border-orange-200 bg-orange-50 text-orange-900 dark:bg-orange-950/30 dark:text-orange-200 dark:border-orange-900">
            <Info className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <AlertTitle className="font-semibold">Лимит исчерпан</AlertTitle>
            <AlertDescription className="text-sm mt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span>
                Вы достигли максимального количества фотографий ({maxPhotos})
                для вашего текущего тарифа.
              </span>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="bg-white hover:bg-orange-100 border-orange-200 text-orange-700 dark:bg-transparent dark:hover:bg-orange-900/50 w-full sm:w-auto"
              >
                <Link href="/pricing">Улучшить тариф</Link>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {currentCount > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {gallery.map((item) => (
              <div
                key={item.id}
                className="relative group overflow-hidden rounded-xl border bg-muted/30 aspect-square"
              >
                <img
                  src={item.image_urls[0]}
                  alt={item.image_alt_text || item.title}
                  className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                />

                {/* Hover Overlay */}
                <div
                  className={cn(
                    "absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col p-4",
                    isOwnProfile ? "justify-between" : "justify-end",
                  )}
                >
                  {/* Edit/Delete Controls for Owner */}
                  {isOwnProfile && (
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 bg-white/20 hover:bg-white/40 text-white border-none backdrop-blur-sm transition-colors"
                        onClick={() => onAddOrEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8 backdrop-blur-sm bg-red-600/80 hover:bg-red-600 transition-colors"
                        onClick={() => onDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {/* Title and Description */}
                  <div className="text-white mt-auto transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <h4 className="font-bold truncate text-sm">{item.title}</h4>
                    {item.description && (
                      <p className="text-xs line-clamp-2 text-white/70 mt-1.5 font-medium leading-tight">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16 px-4 border-2 border-dashed rounded-xl bg-muted/10">
            <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground/30 mb-5" />
            <h3 className="text-xl font-bold mb-2">
              В портфолио пока нет работ
            </h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-8">
              {isOwnProfile
                ? "Добавьте фотографии своих лучших работ, чтобы привлечь больше заказчиков и повысить рейтинг профиля."
                : "Исполнитель еще не загрузил примеры своих работ."}
            </p>

            {isOwnProfile && (
              <div className="flex flex-col items-center gap-3">
                <Button
                  size="lg"
                  onClick={() => onAddOrEdit(null)}
                  // Still clickable so it triggers the warning toast if they somehow have 0 limit
                >
                  {canUploadMore ? (
                    <PlusCircle className="mr-2 h-5 w-5" />
                  ) : (
                    <Lock className="mr-2 h-5 w-5 text-white/80" />
                  )}
                  Загрузить первую работу
                </Button>
                <div className="flex flex-col items-center gap-1 mt-2 text-xs text-muted-foreground font-medium">
                  <span className="flex items-center">
                    <Info className="h-3.5 w-3.5 mr-1.5" />
                    Максимальный размер файла: 15 МБ
                  </span>
                  {!isLoading && (
                    <span>Доступно по тарифу: {maxPhotos} фото</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GalleryManager;
