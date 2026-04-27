"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

// --- API Services ---
import {
  PerformerProfile,
  useUpdatePerformerProfile,
} from "@/services/performer";
import { addToFavorites, removeFromFavorites } from "@/services/favorites";
import { cn } from "@/utils/utils";

// --- UI Components ---
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MapPin,
  Edit3,
  Heart,
  MessageCircle,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  Info,
  Send as SendIcon,
  Youtube,
  Globe,
} from "lucide-react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8800";

const getImageUrl = (path: string | undefined | null) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path}`;
};

// --- Props Interface ---
interface ProfileHeaderProps {
  profile: PerformerProfile;
  isOwnProfile: boolean;
  isPerformerOnline: boolean;
  isFavorite: boolean;
  setIsFavorite: React.Dispatch<React.SetStateAction<boolean>>;
  sessionUser: any;
  requireAuth: (actionCallback: () => void) => void;
}

export default function ProfileHeader({
  profile,
  isOwnProfile,
  isPerformerOnline,
  isFavorite,
  setIsFavorite,
  sessionUser,
  requireAuth,
}: ProfileHeaderProps) {
  const router = useRouter();
  const { toast } = useToast();
  const updateMutation = useUpdatePerformerProfile();

  // Refs for file inputs
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);

  // Upload States
  const [isUploadingBackground, setIsUploadingBackground] = useState(false);
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);

  // --- IMAGE UPLOAD HANDLERS ---
  const handleBackgroundChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    if (!file.type.startsWith("image/")) {
      return toast({ variant: "destructive", title: "Выберите изображение" });
    }
    if (file.size > 5 * 1024 * 1024) {
      return toast({
        variant: "destructive",
        title: "Файл слишком большой (макс. 5МБ)",
      });
    }

    setIsUploadingBackground(true);
    try {
      await updateMutation.mutateAsync({
        performerId: profile.id,
        data: { backgroundPictureFile: file },
      });
      toast({ variant: "default", title: "Обложка успешно обновлена!" });
    } catch (error) {
      toast({ variant: "destructive", title: "Ошибка при загрузке обложки" });
    } finally {
      setIsUploadingBackground(false);
      if (backgroundInputRef.current) backgroundInputRef.current.value = "";
    }
  };

  const handleProfileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    if (!file.type.startsWith("image/")) {
      return toast({ variant: "destructive", title: "Выберите изображение" });
    }
    if (file.size > 5 * 1024 * 1024) {
      return toast({
        variant: "destructive",
        title: "Файл слишком большой (макс. 5МБ)",
      });
    }

    setIsUploadingProfile(true);
    try {
      await updateMutation.mutateAsync({
        performerId: profile.id,
        data: { profilePictureFile: file },
      });
      toast({ variant: "default", title: "Аватар успешно обновлен!" });
    } catch (error) {
      toast({ variant: "destructive", title: "Ошибка при загрузке аватара" });
    } finally {
      setIsUploadingProfile(false);
      if (profileInputRef.current) profileInputRef.current.value = "";
    }
  };

  // --- FAVORITE HANDLER ---
  const handleToggleFavorite = () => {
    requireAuth(async () => {
      if (!profile || !sessionUser) return;
      try {
        if (isFavorite) {
          await removeFromFavorites(sessionUser.id, profile.id);
          toast({ description: "Удалено из избранного" });
        } else {
          await addToFavorites(sessionUser.id, {
            id: profile.id,
            name: profile.name,
            image: profile.profilePicture || "",
            city: profile.city,
            roles: profile.roles,
          });
          toast({ description: "Добавлено в избранное", variant: "success" });
        }
        setIsFavorite(!isFavorite);
      } catch (e) {
        toast({ variant: "destructive", title: "Ошибка сохранения" });
      }
    });
  };

  return (
    <div
      className={cn(
        "container mx-auto px-0 md:px-4",
        isOwnProfile ? "max-w-5xl" : "max-w-4xl",
      )}
    >
      {/* === COVER PHOTO === */}
      <div className="relative h-48 md:h-72 w-full bg-gradient-to-r from-muted to-muted/50 group overflow-hidden md:rounded-b-2xl">
        {profile.backgroundPicture ? (
          <img
            src={getImageUrl(profile.backgroundPicture)}
            className="w-full h-full object-cover transition-opacity duration-300"
            alt="Cover"
            style={{ opacity: isUploadingBackground ? 0.5 : 1 }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
            <ImageIcon className="w-16 h-16" />
          </div>
        )}

        {isOwnProfile && (
          <>
            <input
              type="file"
              ref={backgroundInputRef}
              onChange={handleBackgroundChange}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => backgroundInputRef.current?.click()}
              disabled={isUploadingBackground}
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white border-0 backdrop-blur-md transition-all"
            >
              {isUploadingBackground ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                  Обновление...
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4 mr-2" /> Изменить обложку
                </>
              )}
            </Button>
          </>
        )}
      </div>

      {/* === PROFILE HEADER INFO === */}
      <div className="px-4 md:px-8 pb-8 relative flex flex-col md:flex-row gap-6 items-center md:items-start">
        {/* Avatar & Social Links Column */}
        <div className="flex flex-col items-center gap-4 shrink-0 -mt-16 md:-mt-12 z-10">
          {/* Avatar Widget */}
          <div
            className={cn("relative group", isOwnProfile && "cursor-pointer")}
            onClick={() =>
              isOwnProfile &&
              !isUploadingProfile &&
              profileInputRef.current?.click()
            }
          >
            <Avatar
              className={cn(
                "w-32 h-32 md:w-44 md:h-44 border-4 border-white shadow-lg bg-white transition-opacity",
                isUploadingProfile && "opacity-50",
              )}
            >
              <AvatarImage
                src={getImageUrl(profile.profilePicture)}
                className="object-cover"
              />
              <AvatarFallback className="text-5xl font-bold bg-primary/10 text-primary">
                {profile.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            {isOwnProfile && (
              <>
                <input
                  type="file"
                  ref={profileInputRef}
                  onChange={handleProfileChange}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  {isUploadingProfile ? (
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  ) : (
                    <Edit3 className="w-8 h-8 text-white" />
                  )}
                </div>
              </>
            )}
          </div>

          {/* Social Links Widget (Under Photo in Public View) */}
          {!isOwnProfile &&
            profile.socialLinks &&
            Object.keys(profile.socialLinks).length > 0 && (
              <div className="flex gap-2 items-center justify-center">
                {profile.socialLinks.vk && (
                  <a
                    href={profile.socialLinks.vk}
                    target="_blank"
                    rel="noreferrer"
                    className="w-8 h-8 rounded-full bg-[#0077FF]/10 text-[#0077FF] flex items-center justify-center hover:bg-[#0077FF]/20 transition-colors"
                  >
                    <span className="font-bold text-[10px]">VK</span>
                  </a>
                )}
                {profile.socialLinks.telegram && (
                  <a
                    href={profile.socialLinks.telegram}
                    target="_blank"
                    rel="noreferrer"
                    className="w-8 h-8 rounded-full bg-[#24A1DE]/10 text-[#24A1DE] flex items-center justify-center hover:bg-[#24A1DE]/20 transition-colors"
                  >
                    <SendIcon className="w-4 h-4" />
                  </a>
                )}
                {profile.socialLinks.youtube && (
                  <a
                    href={profile.socialLinks.youtube}
                    target="_blank"
                    rel="noreferrer"
                    className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                  >
                    <Youtube className="w-4 h-4" />
                  </a>
                )}
                {profile.socialLinks.website && (
                  <a
                    href={profile.socialLinks.website}
                    target="_blank"
                    rel="noreferrer"
                    className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                  </a>
                )}
              </div>
            )}
        </div>

        {/* Info Block */}
        <div className="flex-1 w-full mt-2 md:mt-4 text-center md:text-left">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-4">
            {/* Main Details */}
            <div className="flex flex-col items-center md:items-start">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
                  {profile.name}
                </h1>
                {profile.moderationStatus === "APPROVED" && (
                  <CheckCircle2 className="w-6 h-6 text-blue-500" />
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm font-medium">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="w-4 h-4" />{" "}
                  {profile.city || "Город не указан"}
                </span>
                <span className="text-muted-foreground/30">•</span>
                <span
                  className={cn(
                    "flex items-center gap-1.5 transition-colors",
                    isPerformerOnline
                      ? "text-emerald-600"
                      : "text-muted-foreground/70",
                  )}
                >
                  <span className="relative flex h-2.5 w-2.5 items-center justify-center">
                    {isPerformerOnline && (
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    )}
                    <span
                      className={cn(
                        "relative inline-flex h-2.5 w-2.5 rounded-full transition-colors",
                        isPerformerOnline
                          ? "bg-emerald-500"
                          : "bg-muted-foreground/40",
                      )}
                    />
                  </span>
                  {isPerformerOnline ? "Онлайн" : "Был(а) недавно"}
                </span>
              </div>

              {/* Badges & Price (Public View) */}
              {!isOwnProfile && (
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-3">
                  {profile.roles?.map((r: string) => (
                    <Badge
                      key={r}
                      variant="secondary"
                      className="bg-primary/10 text-primary border-transparent font-bold rounded-lg px-2.5 py-1"
                    >
                      {r}
                    </Badge>
                  ))}

                  {/* Price right after Categories */}
                  {profile.priceRange &&
                    profile.priceRange.length > 0 &&
                    profile.priceRange[0] > 0 && (
                      <Badge
                        variant="outline"
                        className="bg-muted text-foreground border-border/50 font-bold rounded-lg px-3 py-1"
                      >
                        Стоимость от{" "}
                        {profile.priceRange[0].toLocaleString("ru-RU")} ₽
                      </Badge>
                    )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col items-center md:items-end gap-3 w-full md:w-auto mt-2 md:mt-0">
              <div className="flex w-full md:w-auto gap-2">
                {!isOwnProfile ? (
                  <>
                    <Button
                      className="flex-1 md:flex-none rounded-xl font-bold shadow-sm"
                      onClick={() =>
                        requireAuth(() => router.push(`/chat/${profile.id}`))
                      }
                    >
                      <MessageCircle className="w-4 h-4 mr-2" /> Написать
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 md:flex-none rounded-xl font-bold text-primary border-primary hover:bg-primary/5"
                      onClick={() =>
                        requireAuth(() =>
                          router.push(
                            `/booking-request?performerId=${profile.id}`,
                          ),
                        )
                      }
                    >
                      Забронировать
                    </Button>
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={handleToggleFavorite}
                      className="rounded-xl shrink-0"
                    >
                      <Heart
                        className={cn(
                          "w-5 h-5 transition-colors",
                          isFavorite
                            ? "fill-red-500 text-red-500"
                            : "text-foreground",
                        )}
                      />
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full md:w-auto rounded-xl font-bold shadow-sm"
                    onClick={() => router.push("/settings")}
                  >
                    <Edit3 className="w-4 h-4 mr-2" /> Настройки
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Public View: About Section */}
          {!isOwnProfile && (
            <div className="mt-6 animate-in fade-in slide-in-from-bottom-2 text-left">
              <div className="bg-muted/20 border border-border/40 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary" /> О себе
                </h3>
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                  {profile.description || "Информация пока не заполнена."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
