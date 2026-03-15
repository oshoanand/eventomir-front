"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Edit,
  Trash2,
  PlusCircle,
  Image as ImageIcon,
  Info,
} from "lucide-react";
import type { GalleryItem } from "@/services/performer";
import { cn } from "@/utils/utils";

interface GalleryManagerProps {
  gallery: GalleryItem[];
  isOwnProfile: boolean; // Replaced isEditing with isOwnProfile
  onAddOrEdit: (item: GalleryItem | null) => void;
  onDelete: (id: string) => void;
}

const GalleryManager: React.FC<GalleryManagerProps> = ({
  gallery,
  isOwnProfile,
  onAddOrEdit,
  onDelete,
}) => {
  console.log(gallery);
  return (
    <Card className="relative overflow-hidden border shadow-sm">
      <CardHeader className="flex flex-row justify-between items-center bg-muted/20 border-b pb-4 pt-4">
        <div className="flex items-center gap-2">
          <CardTitle className="text-xl font-bold">Портфолио</CardTitle>
          {isOwnProfile && gallery.length > 0 && (
            <span className="text-xs text-muted-foreground flex items-center ml-2">
              <Info className="h-3 w-3 mr-1" />
              До 15 МБ / файл
            </span>
          )}
        </div>

        {/* Add Button - Only shows for owner */}
        {isOwnProfile && gallery.length > 0 && (
          <Button size="sm" onClick={() => onAddOrEdit(null)} className="h-8">
            <PlusCircle className="mr-2 h-4 w-4" />
            Добавить работу
          </Button>
        )}
      </CardHeader>

      <CardContent className="pt-6">
        {gallery.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {gallery.map((item) => (
              <div
                key={item.id}
                className="relative group overflow-hidden rounded-xl border bg-muted/30"
              >
                <img
                  src={item.image_urls[0]}
                  alt={item.image_alt_text || item.title}
                  className="object-cover aspect-square w-full transition-transform duration-300 group-hover:scale-105"
                  data-ai-hint="portfolio gallery image"
                />

                {/* Hover Overlay */}
                <div
                  className={cn(
                    "absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-4",
                    isOwnProfile ? "justify-between" : "justify-end",
                  )}
                >
                  {/* Edit/Delete Controls for Owner */}
                  {isOwnProfile && (
                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 bg-white/20 hover:bg-white/40 text-white border-none backdrop-blur-sm"
                        onClick={() => onAddOrEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8 backdrop-blur-sm bg-destructive/80 hover:bg-destructive"
                        onClick={() => onDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {/* Title and Description */}
                  <div className="text-white mt-auto">
                    <h4 className="font-bold truncate text-sm">{item.title}</h4>
                    <p className="text-xs line-clamp-2 text-white/80 mt-1">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-12 px-4 border-2 border-dashed rounded-xl bg-muted/10">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-bold mb-2">
              В портфолио пока нет работ
            </h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
              {isOwnProfile
                ? "Добавьте фотографии своих лучших работ, чтобы привлечь больше заказчиков."
                : "Исполнитель еще не загрузил примеры своих работ."}
            </p>

            {isOwnProfile && (
              <div className="flex flex-col items-center gap-2">
                <Button onClick={() => onAddOrEdit(null)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Загрузить фото
                </Button>
                <span className="text-xs text-muted-foreground flex items-center">
                  <Info className="h-3 w-3 mr-1" />
                  Максимальный размер файла: 15 МБ
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GalleryManager;
