"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  Award,
  BookCheck as BookCheckIcon,
} from "@/components/icons";
import type {
  PerformerProfile,
  Certificate,
  RecommendationLetter,
} from "@/services/performer";
import CertificatesManager from "./CertificatesManager";
import RecommendationsManager from "./RecommendationsManager";

interface AboutSectionProps {
  profile: PerformerProfile;
  isEditing: boolean;
  formData: Partial<PerformerProfile>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<PerformerProfile>>>;
  onAddCertificate: () => void;
  onDeleteCertificate: (id: string) => void;
  onAddLetter: () => void;
  onDeleteLetter: (id: string) => void;
}

const AboutSection: React.FC<AboutSectionProps> = ({
  profile,
  isEditing,
  formData,
  setFormData,
  onAddCertificate,
  onDeleteCertificate,
  onAddLetter,
  onDeleteLetter,
}) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Описание</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Textarea
              value={formData.description || ""}
              onChange={(e) =>
                setFormData((p) => ({ ...p, description: e.target.value }))
              }
              className="min-h-[150px]"
              placeholder="Расскажите о себе, своем опыте и услугах..."
            />
          ) : (
            <p className="text-muted-foreground whitespace-pre-wrap">
              {profile.description || "Исполнитель пока не добавил описание."}
            </p>
          )}
        </CardContent>
      </Card>

      <CertificatesManager
        certificates={profile.certificates || []}
        isEditing={isEditing}
        onAdd={onAddCertificate}
        onDelete={onDeleteCertificate}
      />

      <RecommendationsManager
        letters={profile.recommendationLetters || []}
        isEditing={isEditing}
        onAdd={onAddLetter}
        onDelete={onDeleteLetter}
      />
    </div>
  );
};

export default AboutSection;
