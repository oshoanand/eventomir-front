"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Edit3, Check, X, Loader2 } from "lucide-react";
import type { PerformerProfile } from "@/services/performer";
import CertificatesManager from "./CertificatesManager";
import RecommendationsManager from "./RecommendationsManager";

interface AboutSectionProps {
  profile: PerformerProfile;
  isOwnProfile: boolean;
  onPartialUpdate: (data: Partial<PerformerProfile>) => Promise<void>;
  onAddCertificate: () => void;
  onDeleteCertificate: (id: string) => void;
  onAddLetter: () => void;
  onDeleteLetter: (id: string) => void;
}

const AboutSection: React.FC<AboutSectionProps> = ({
  profile,
  isOwnProfile,
  onPartialUpdate,
  onAddCertificate,
  onDeleteCertificate,
  onAddLetter,
  onDeleteLetter,
}) => {
  // Local state for editing just the description
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draftDescription, setDraftDescription] = useState(
    profile.description || "",
  );

  // Sync draft description if profile updates externally
  useEffect(() => {
    if (!isEditingDescription) {
      setDraftDescription(profile.description || "");
    }
  }, [profile.description, isEditingDescription]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Send only the description to the modular update handler
      await onPartialUpdate({ description: draftDescription });
      setIsEditingDescription(false);
    } catch (error) {
      // The parent component handles the error toast
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDraftDescription(profile.description || "");
    setIsEditingDescription(false);
  };

  return (
    <div className="space-y-6">
      {/* Description Card */}
      <Card className="relative group overflow-hidden border shadow-sm">
        <CardHeader className="flex flex-row justify-between items-center bg-muted/20 border-b pb-4 pt-4">
          <CardTitle className="text-xl font-bold">О себе</CardTitle>

          {/* Edit Button - Only shows for owner when not already editing */}
          {isOwnProfile && !isEditingDescription && (
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary h-8"
              onClick={() => setIsEditingDescription(true)}
            >
              <Edit3 className="h-4 w-4 mr-2" /> Редактировать
            </Button>
          )}
        </CardHeader>

        <CardContent className="pt-6">
          {isEditingDescription ? (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <Textarea
                value={draftDescription}
                onChange={(e) => setDraftDescription(e.target.value)}
                className="min-h-[150px] resize-none focus-visible:ring-primary/20 bg-background"
                placeholder="Расскажите о себе, своем опыте и предоставляемых услугах..."
                disabled={isSaving}
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4 mr-2" /> Отмена
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Сохранить
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed text-sm md:text-base">
              {profile.description || "Исполнитель пока не добавил описание."}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Certificates & Recommendations */}
      {/* Passing isOwnProfile as isEditing allows the owner to always add/delete documents seamlessly */}
      <CertificatesManager
        certificates={profile.certificates || []}
        isEditing={isOwnProfile}
        onAdd={onAddCertificate}
        onDelete={onDeleteCertificate}
      />

      <RecommendationsManager
        letters={profile.recommendationLetters || []}
        isEditing={isOwnProfile}
        onAdd={onAddLetter}
        onDelete={onDeleteLetter}
      />
    </div>
  );
};

export default AboutSection;
