"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, PlusCircle, Award } from "@/components/icons";
import type { Certificate } from "@/services/performer";

interface CertificatesManagerProps {
  certificates: Certificate[];
  isEditing: boolean;
  onAdd: () => void;
  onDelete: (id: string) => void;
}

const CertificatesManager: React.FC<CertificatesManagerProps> = ({
  certificates,
  isEditing,
  onAdd,
  onDelete,
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-center">
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Сертификаты и награды
        </CardTitle>
        {isEditing && (
          <Button size="sm" variant="outline" onClick={onAdd}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Добавить
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {certificates.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="relative group flex items-center gap-3 border p-3 rounded-md"
              >
                <a
                  href={cert.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-grow flex items-center gap-3"
                >
                  <Award className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                  <p className="text-sm truncate">
                    {cert.description || "Сертификат"}
                  </p>
                </a>
                {isEditing && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onDelete(cert.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">
            Исполнитель пока не добавил сертификаты.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default CertificatesManager;
