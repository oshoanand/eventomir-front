"use client";

import { PerformerProfile } from "@/services/performer";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  MapPin,
  Edit2,
  Heart,
  MessageCircle,
  CalendarCheck,
  LogOut,
  Camera,
  DollarSign,
  Share2,
  Trash2,
} from "lucide-react";
import { cn } from "@/utils/utils";

interface ProfileHeaderProps {
  profile: PerformerProfile;
  isOwnProfile: boolean;
  isEditing: boolean;
  formData: Partial<PerformerProfile>;
  isFavorite: boolean;
  onEditToggle: () => void;
  onSaveChanges: () => void;
  onCancelEdit: () => void;
  onFileChange: (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "profilePicture" | "backgroundPicture",
  ) => void;
  setFormData: React.Dispatch<React.SetStateAction<Partial<PerformerProfile>>>;
  onToggleFavorite: () => void;
  onOpenChat: () => void;
  onDeleteProfile: () => void;

  onBook: () => void;
  getImageUrl: (path: string | undefined | null) => string;
}

export default function ProfileHeader({
  profile,
  isOwnProfile,
  isEditing,
  formData,
  isFavorite,
  onEditToggle,
  onSaveChanges,
  onCancelEdit,
  onFileChange,
  setFormData,
  onToggleFavorite,
  onOpenChat,
  onDeleteProfile,

  onBook,
  getImageUrl,
}: ProfileHeaderProps) {
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
            className="w-24 h-8"
            placeholder="от"
            value={formData.priceRange?.[0] || ""}
            onChange={(e) =>
              setFormData((p) => ({
                ...p,
                priceRange: [Number(e.target.value), p.priceRange?.[1] || 0],
              }))
            }
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="number"
            className="w-24 h-8"
            placeholder="до"
            value={formData.priceRange?.[1] || ""}
            onChange={(e) =>
              setFormData((p) => ({
                ...p,
                priceRange: [p.priceRange?.[0] || 0, Number(e.target.value)],
              }))
            }
          />
          <span className="text-sm text-muted-foreground">₽</span>
        </div>
      );
    }

    const minPrice = profile.priceRange?.[0];
    const maxPrice = profile.priceRange?.[1];

    if (typeof minPrice !== "number") return null;

    return (
      <div className="flex items-center gap-1.5 text-lg font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-full border border-emerald-100 dark:border-emerald-900 mt-2 w-fit">
        <DollarSign className="h-4 w-4" />
        <span>
          {minPrice === maxPrice
            ? `${minPrice.toLocaleString()} ₽`
            : `от ${minPrice.toLocaleString()} ₽`}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-card rounded-xl border shadow-sm overflow-hidden relative group">
      {/* --- Cover Image --- */}
      <div className="h-48 md:h-64 bg-muted relative">
        {formData.backgroundPicture || profile.backgroundPicture ? (
          <img
            src={
              isEditing && formData.backgroundPicture
                ? formData.backgroundPicture
                : getImageUrl(profile.backgroundPicture)
            }
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800" />
        )}

        {isEditing && (
          <label className="absolute top-4 right-4 cursor-pointer z-10">
            <div className="bg-black/50 hover:bg-black/70 text-white px-3 py-1.5 rounded-md flex items-center gap-2 text-sm transition-colors backdrop-blur-sm">
              <Camera className="h-4 w-4" />
              <span>Изменить обложку</span>
            </div>
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={(e) => onFileChange(e, "backgroundPicture")}
            />
          </label>
        )}
      </div>

      <div className="px-6 pb-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* --- Avatar Section (Updated Positioning) --- */}
          <div className="-mt-16 md:-mt-20 relative flex-shrink-0 mx-auto md:mx-0">
            <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-background shadow-lg bg-background">
              <AvatarImage
                src={
                  isEditing && formData.profilePicture
                    ? formData.profilePicture
                    : getImageUrl(profile.profilePicture)
                }
                className="object-cover"
              />
              <AvatarFallback className="text-4xl font-bold text-muted-foreground bg-muted">
                {profile.name?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
              {isEditing && (
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full cursor-pointer transition-colors hover:bg-black/60 z-10">
                  <Camera className="h-10 w-10 opacity-90" />
                  <span className="sr-only">Изменить фото</span>
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => onFileChange(e, "profilePicture")}
                  />
                </label>
              )}
            </Avatar>

            {/* CENTERED CAMERA ICON */}
            {/* {isEditing && (
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full cursor-pointer transition-colors hover:bg-black/60 z-10">
                <Camera className="h-10 w-10 opacity-90" />
                <span className="sr-only">Изменить фото</span>
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => onFileChange(e, "profilePicture")}
                />
              </label>
            )} */}
          </div>

          {/* --- Main Info --- */}
          <div className="flex-1 pt-2 text-center md:text-left space-y-4">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-2">
                {/* Name & Roles */}
                <div className="space-y-1">
                  {isEditing ? (
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, name: e.target.value }))
                      }
                      className="text-2xl font-bold w-full md:w-80 text-center md:text-left"
                      placeholder="Ваше имя"
                    />
                  ) : (
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                      {profile.name}
                    </h1>
                  )}

                  <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                    {profile.roles?.map((role) => (
                      <Badge
                        key={role}
                        variant="secondary"
                        className="px-2 py-0.5 text-xs font-medium"
                      >
                        {role}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {isEditing ? (
                    <Input
                      value={formData.city}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, city: e.target.value }))
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
                        onClick={onSaveChanges}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Сохранить
                      </Button>
                      <Button variant="outline" onClick={onCancelEdit}>
                        Отмена
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onEditToggle}
                      >
                        <Edit2 className="h-4 w-4 mr-2" /> Редактировать
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive/90"
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
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.href);
                        }}
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
