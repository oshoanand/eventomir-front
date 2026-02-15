"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Trash2,
  PlusCircle,
  BookCheck as BookCheckIcon,
} from "@/components/icons";
import type { RecommendationLetter } from "@/services/performer";

interface RecommendationsManagerProps {
  letters: RecommendationLetter[];
  isEditing: boolean;
  onAdd: () => void;
  onDelete: (id: string) => void;
}

const RecommendationsManager: React.FC<RecommendationsManagerProps> = ({
  letters,
  isEditing,
  onAdd,
  onDelete,
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle className="flex items-center gap-2">
          <BookCheckIcon className="h-5 w-5 text-primary" />
          Благодарственные письма
        </CardTitle>
        {isEditing && (
          <Button size="sm" variant="outline" onClick={onAdd}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Добавить
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {letters.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {letters.map((letter) => (
              <div
                key={letter.id}
                className="relative group flex items-center gap-3 border p-3 rounded-md"
              >
                <a
                  href={letter.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-grow flex items-center gap-3"
                >
                  <BookCheckIcon className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                  <p className="text-sm truncate">
                    {letter.description || "Благодарственное письмо"}
                  </p>
                </a>
                {isEditing && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onDelete(letter.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">
            Исполнитель пока не добавил благодарственные письма.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default RecommendationsManager;
