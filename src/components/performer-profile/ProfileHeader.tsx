"use client";

import { useState, useEffect } from "react";
import { PerformerProfile } from "@/services/performer";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast"; // <-- Added for Share feedback
import {
  MapPin,
  Edit2,
  Heart,
  MessageCircle,
  CalendarCheck,
  Camera,
  DollarSign,
  Share2,
  Trash2,
  Check,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/utils/utils";

interface ProfileHeaderProps {
  profile: PerformerProfile;
  isOwnProfile: boolean;
  isFavorite: boolean;
  isOnline?: boolean;

  onPartialUpdate: (
    dataToUpdate: Partial<PerformerProfile>,
    files?: {
      profilePictureFile?: File | null;
      backgroundPictureFile?: File | null;
    },
  ) => Promise<void>;
  onToggleFavorite: () => void;
  onOpenChat: () => void;
  onDeleteProfile: () => void;
  onBook: () => void;
  getImageUrl: (path: string | undefined | null) => string;
}

export default function ProfileHeader({
  profile,
  isOwnProfile,
  isFavorite,
  isOnline = false,
  onPartialUpdate,
  onToggleFavorite,
  onOpenChat,
  onDeleteProfile,
  onBook,
  getImageUrl,
}: ProfileHeaderProps) {
  const { toast } = useToast();

  // --- Local Edit State ---
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // File Upload Loading States
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  // Temporary draft data for text fields
  const [draftData, setDraftData] = useState({
    name: profile.name || "",
    city: profile.city || "",
    priceRange: profile.priceRange || [0, 0],
  });

  // Sync draft data if the profile updates from outside
  useEffect(() => {
    if (!isEditing) {
      setDraftData({
        name: profile.name || "",
        city: profile.city || "",
        priceRange: profile.priceRange || [0, 0],
      });
    }
  }, [profile, isEditing]);

  // --- Handlers ---
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onPartialUpdate({
        name: draftData.name,
        city: draftData.city,
        priceRange: draftData.priceRange,
      });
      setIsEditing(false);
    } catch (error) {
      // Errors are handled by the parent's toast notification
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDraftData({
      name: profile.name || "",
      city: profile.city || "",
      priceRange: profile.priceRange || [0, 0],
    });
    setIsEditing(false);
  };

  // Immediate upload for avatar and cover images
  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "profilePicture" | "backgroundPicture",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === "profilePicture") setIsUploadingAvatar(true);
    else setIsUploadingCover(true);

    try {
      await onPartialUpdate({}, { [`${type}File`]: file });
    } finally {
      if (type === "profilePicture") setIsUploadingAvatar(false);
      else setIsUploadingCover(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Ссылка скопирована",
        description: "Ссылка на профиль скопирована в буфер обмена.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось скопировать ссылку.",
      });
    }
  };

  // --- Logic for Price Display ---
  const renderPriceField = () => {
    if (isEditing) {
      return (
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm font-medium text-muted-foreground">
            Цена:
          </span>
          <Input
            type="number"
            min="0"
            className="w-24 h-8"
            placeholder="от"
            value={draftData.priceRange?.[0] || ""}
            onChange={(e) =>
              setDraftData((p) => ({
                ...p,
                priceRange: [
                  parseInt(e.target.value) || 0,
                  p.priceRange?.[1] || 0,
                ],
              }))
            }
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="number"
            min="0"
            className="w-24 h-8"
            placeholder="до"
            value={draftData.priceRange?.[1] || ""}
            onChange={(e) =>
              setDraftData((p) => ({
                ...p,
                priceRange: [
                  p.priceRange?.[0] || 0,
                  parseInt(e.target.value) || 0,
                ],
              }))
            }
          />
          <span className="text-sm text-muted-foreground">₽</span>
        </div>
      );
    }

    const minPrice = profile.priceRange?.[0] || 0;
    const maxPrice = profile.priceRange?.[1] || 0;

    // Don't show the badge at all if there's no price range set yet
    if (minPrice === 0 && maxPrice === 0) return null;

    return (
      <div className="flex items-center gap-1.5 text-lg font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-100 dark:border-emerald-900 mt-2 w-fit">
        {/* <DollarSign className="h-4 w-4" /> */}
        <span>
          {minPrice === maxPrice && minPrice > 0
            ? `${minPrice.toLocaleString()} ₽`
            : minPrice > 0
              ? `от ${minPrice.toLocaleString()} ₽`
              : "По запросу"}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-card rounded-xl border shadow-sm overflow-hidden relative group">
      {/* --- Cover Image --- */}
      <div className="h-48 md:h-64 bg-muted relative group/cover">
        {profile.backgroundPicture ? (
          <img
            src={getImageUrl(profile.backgroundPicture)}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800" />
        )}

        {/* Immediate Upload for Cover */}
        {isOwnProfile && (
          <label className="absolute top-4 right-4 cursor-pointer z-10 opacity-0 group-hover/cover:opacity-100 transition-opacity">
            <div className="bg-black/60 hover:bg-black/80 text-white px-3 py-1.5 rounded-md flex items-center gap-2 text-sm transition-colors backdrop-blur-md shadow-sm">
              {isUploadingCover ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              <span>
                {isUploadingCover ? "Загрузка..." : "Изменить обложку"}
              </span>
            </div>
            <input
              type="file"
              hidden
              accept="image/*"
              disabled={isUploadingCover}
              onChange={(e) => handleFileChange(e, "backgroundPicture")}
            />
          </label>
        )}
      </div>

      <div className="px-6 pb-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* --- Avatar Section --- */}
          <div className="-mt-16 md:-mt-20 relative flex-shrink-0 mx-auto md:mx-0 group/avatar">
            <div className="relative">
              <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-background shadow-lg bg-background">
                <AvatarImage
                  src={getImageUrl(profile.profilePicture)}
                  className="object-cover"
                />
                <AvatarFallback className="text-4xl font-bold text-muted-foreground bg-muted">
                  {profile.name?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>

                {/* Immediate Upload for Avatar */}
                {isOwnProfile && (
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full cursor-pointer transition-all opacity-0 group-hover/avatar:opacity-100 hover:bg-black/60 z-30 backdrop-blur-[2px]">
                    {isUploadingAvatar ? (
                      <Loader2 className="h-10 w-10 animate-spin" />
                    ) : (
                      <>
                        <Camera className="h-10 w-10 opacity-90 drop-shadow-md" />
                        <span className="sr-only">Изменить фото</span>
                      </>
                    )}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      disabled={isUploadingAvatar}
                      onChange={(e) => handleFileChange(e, "profilePicture")}
                    />
                  </label>
                )}
              </Avatar>

              {/* ONLINE STATUS INDICATOR */}
              <span
                className={cn(
                  "absolute bottom-2 right-2 md:bottom-4 md:right-4 h-5 w-5 md:h-6 md:w-6 rounded-full border-4 border-background z-20 transition-all duration-300 shadow-sm",
                  isOnline ? "bg-green-500" : "bg-gray-300",
                )}
                title={isOnline ? "В сети" : "Не в сети"}
              />
            </div>
          </div>

          {/* --- Main Info --- */}
          <div className="flex-1 pt-2 text-center md:text-left space-y-4">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-2">
                {/* Name */}
                <div className="space-y-1">
                  {isEditing ? (
                    <Input
                      value={draftData.name}
                      onChange={(e) =>
                        setDraftData((p) => ({ ...p, name: e.target.value }))
                      }
                      className="text-xl font-bold w-full md:w-80 text-center md:text-left h-10"
                      placeholder="Ваше имя"
                    />
                  ) : (
                    <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
                      <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        {profile.name || "Безымянный исполнитель"}
                      </h1>
                      {isOnline && (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 px-2 py-0.5 h-6"
                        >
                          Онлайн
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Location */}
                <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground mt-2">
                  <MapPin className="h-4 w-4" />
                  {isEditing ? (
                    <Input
                      value={draftData.city}
                      onChange={(e) =>
                        setDraftData((p) => ({ ...p, city: e.target.value }))
                      }
                      className="h-8 w-40"
                      placeholder="Город"
                    />
                  ) : (
                    <span className="text-sm">
                      {profile.city || "Город не указан"}
                    </span>
                  )}
                </div>

                {/* Price Field */}
                <div className="flex justify-center md:justify-start">
                  {renderPriceField()}
                </div>
              </div>

              {/* --- Action Buttons --- */}
              <div className="flex flex-wrap gap-2 justify-center md:justify-end items-start min-w-[200px]">
                {isOwnProfile ? (
                  isEditing ? (
                    <div className="flex gap-2">
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
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit2 className="h-4 w-4 mr-2" /> Редактировать
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={onDeleteProfile}
                        title="Удалить профиль"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col gap-2 w-full sm:w-auto">
                    <Button
                      size="lg"
                      className="w-full sm:w-auto shadow-md"
                      onClick={onBook}
                    >
                      <CalendarCheck className="mr-2 h-4 w-4" />
                      Забронировать
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={onOpenChat}
                      >
                        <MessageCircle className="mr-2 h-4 w-4" /> Чат
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={onToggleFavorite}
                        className={cn(
                          isFavorite && "text-red-500 border-red-200 bg-red-50",
                        )}
                      >
                        <Heart
                          className={cn(
                            "h-4 w-4",
                            isFavorite && "fill-current",
                          )}
                        />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleShare} // <-- Fixed
                        title="Поделиться"
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
