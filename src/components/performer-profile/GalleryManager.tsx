"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, PlusCircle } from "@/components/icons";
import type { GalleryItem } from "@/services/performer";

interface GalleryManagerProps {
  gallery: GalleryItem[];
  isEditing: boolean;
  onAddOrEdit: (item: GalleryItem | null) => void;
  onDelete: (id: string) => void;
}

const GalleryManager: React.FC<GalleryManagerProps> = ({
  gallery,
  isEditing,
  onAddOrEdit,
  onDelete,
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle>Галерея работ</CardTitle>
        {isEditing && (
          <Button size="sm" onClick={() => onAddOrEdit(null)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Добавить работу
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {gallery.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {gallery.map((item) => (
              <div key={item.id} className="relative group">
                <img
                  src={item.imageUrls[0]}
                  alt={item.imageAltText || item.title}
                  className="rounded-lg object-cover aspect-square w-full"
                  data-ai-hint="portfolio gallery image"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
                  {isEditing && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => onAddOrEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => onDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {!isEditing && (
                    <div className="text-white text-center p-2">
                      <h4 className="font-bold">{item.title}</h4>
                      <p className="text-xs line-clamp-2">{item.description}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            В галерее пока нет работ.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default GalleryManager;
