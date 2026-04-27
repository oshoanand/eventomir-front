"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react"; // <-- Added

// --- API & Services ---
import { useUpdatePerformerProfile } from "@/services/performer";
import { getSiteSettings } from "@/services/settings";
import { useToast } from "@/hooks/use-toast";

// --- UI Components ---
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  User,
  Edit3,
  Link as LinkIcon,
  Youtube,
  Send as SendIcon,
  CalendarIcon,
  Loader2,
  ChevronDown,
  ChevronRight,
  Globe,
} from "lucide-react";
import { cn } from "@/utils/utils";

// --- Custom Components ---
import CalendarSection from "@/components/performer-profile/CalendarSection";

// --- Interfaces ---
interface SubCategory {
  id: string;
  name: string;
}
interface SiteCategory {
  id: string;
  name: string;
  subCategories?: SubCategory[];
}

export default function ProfileSidebar({ profile }: { profile: any }) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession(); // <-- Added
  const updateMutation = useUpdatePerformerProfile();

  // Determine if the current viewer owns this profile
  const isOwnProfile = Boolean(
    session?.user?.id && session.user.id === profile?.id,
  );

  // --- Category Modal State ---
  const [adminCategories, setAdminCategories] = useState<SiteCategory[]>([]);
  const [tempSelectedRoles, setTempSelectedRoles] = useState<string[]>([]);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isSavingCategories, setIsSavingCategories] = useState(false);

  useEffect(() => {
    getSiteSettings()
      .then((settings) => {
        if (settings?.siteCategories)
          setAdminCategories(settings.siteCategories);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (profile && isCategoryDialogOpen) {
      setTempSelectedRoles(profile.roles || []);
    }
  }, [profile, isCategoryDialogOpen]);

  // --- Handlers ---
  const handleCategoryToggle = (category: SiteCategory, isChecked: boolean) => {
    if (isChecked) {
      setTempSelectedRoles([category.name]);
    } else {
      setTempSelectedRoles([]);
    }
  };

  const toggleTempRole = (subRoleName: string) => {
    setTempSelectedRoles((prev) =>
      prev.includes(subRoleName)
        ? prev.filter((r) => r !== subRoleName)
        : [...prev, subRoleName],
    );
  };

  const handleSaveCategories = async () => {
    if (!profile) return;
    setIsSavingCategories(true);
    try {
      await updateMutation.mutateAsync({
        performerId: profile.id,
        data: { roles: tempSelectedRoles },
      });
      toast({ variant: "default", title: "Специализации успешно обновлены!" });
      setIsCategoryDialogOpen(false);
    } catch (error) {
      toast({ variant: "destructive", title: "Ошибка сохранения" });
    } finally {
      setIsSavingCategories(false);
    }
  };

  return (
    <div className="w-full md:w-[320px] shrink-0 space-y-6">
      {/* --- 1. About / Info Widget --- */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-border/40">
        <h3 className="font-bold text-[16px] mb-5 flex items-center gap-2">
          <User className="w-5 h-5 text-primary" /> Подробная информация
        </h3>

        <div className="space-y-4">
          <div className="text-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground block text-[13px]">
                Услуги:
              </span>
              {isOwnProfile && (
                <button
                  onClick={() => setIsCategoryDialogOpen(true)}
                  className="text-primary hover:underline text-xs font-semibold flex items-center"
                >
                  <Edit3 className="w-3 h-3 mr-1" /> Изменить
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {profile.roles && profile.roles.length > 0 ? (
                profile.roles.map((r: string) => (
                  <Badge
                    key={r}
                    variant="secondary"
                    className="border border-primary bg-primary/10 text-foreground font-medium rounded-md"
                  >
                    {r}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground italic">
                  Не указано
                </span>
              )}
            </div>
          </div>

          {profile.priceRange && profile.priceRange.length > 0 && (
            <>
              <Separator />
              <div className="text-sm">
                <span className="text-muted-foreground block text-[13px] mb-1">
                  Прайс:
                </span>
                <span className="font-semibold text-foreground text-base">
                  от {profile.priceRange[0].toLocaleString("ru-RU")} ₽
                </span>
              </div>
            </>
          )}

          <Separator />

          <div className="text-sm">
            <span className="text-muted-foreground block text-[13px] mb-1">
              О себе:
            </span>
            <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
              {profile.description || "Информация пока не заполнена."}
            </p>
          </div>
        </div>

        {isOwnProfile && (
          <Button
            variant="outline"
            className="w-full mt-6 rounded-xl text-sm font-bold h-11 border-border/60 hover:bg-muted/50"
            onClick={() => router.push("/settings")}
          >
            Редактировать инфо
          </Button>
        )}
      </div>

      {/* --- 2. Social Links Widget --- */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-border/40">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-[16px] flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-primary" /> Контакты и сети
          </h3>
          {isOwnProfile && (
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-full text-muted-foreground hover:text-foreground"
              onClick={() => router.push("/settings")}
            >
              <Edit3 className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className="space-y-1">
          {profile.socialLinks?.vk && (
            <a
              href={profile.socialLinks.vk}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 p-2.5 rounded-full hover:bg-muted/50 transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-[#0077FF]/10 text-[#0077FF] flex items-center justify-center">
                <span className="font-bold text-[10px]">VK</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground group-hover:text-[#0077FF] transition-colors">
                  ВКонтакте
                </p>
                <p className="text-sm font-medium text-primary">
                  {profile.socialLinks.vk}
                </p>
              </div>
            </a>
          )}

          {profile.socialLinks?.telegram && (
            <a
              href={profile.socialLinks.telegram}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 p-2.5 rounded-full hover:bg-muted/50 transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-[#24A1DE]/10 text-[#24A1DE] flex items-center justify-center">
                <SendIcon className="w-4 h-4" />
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground group-hover:text-[#24A1DE] transition-colors">
                  Telegram
                </p>
                <p className="text-sm font-medium text-primary">
                  {profile.socialLinks.telegram}
                </p>
              </div>
            </a>
          )}

          {profile.socialLinks?.youtube && (
            <a
              href={profile.socialLinks.youtube}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 p-2.5 rounded-full hover:bg-muted/50 transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
                <Youtube className="w-4 h-4" />
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground group-hover:text-red-500 transition-colors">
                  YouTube
                </p>
                <p className="text-sm font-medium text-primary">
                  {profile.socialLinks.youtube}
                </p>
              </div>
            </a>
          )}

          {profile.socialLinks?.website && (
            <a
              href={profile.socialLinks.website}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 p-2.5 rounded-full hover:bg-muted/50 transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
                <Globe className="w-4 h-4" />
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground group-hover:text-red-500 transition-colors">
                  Веб-сайт
                </p>
                <p className="text-sm font-medium text-primary">
                  {profile.socialLinks.website}
                </p>
              </div>
            </a>
          )}

          {(!profile.socialLinks ||
            Object.keys(profile.socialLinks).length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-2">
              Ссылки не указаны.
            </p>
          )}
        </div>
      </div>

      {/* --- 3. Calendar Widget --- */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-border/40 overflow-hidden">
        <h3 className="font-bold text-[16px] mb-5 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-primary" /> График занятости
        </h3>
        {/* 🚨 FIX: Removed scale/pointer-events hacks so calendar functions normally */}
        <div className="w-full">
          <CalendarSection profile={profile} isOwnProfile={isOwnProfile} />
        </div>
      </div>

      {/* ========================================== */}
      {/* CATEGORY SELECTION MODAL */}
      {/* ========================================== */}
      <Dialog
        open={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}
      >
        <DialogContent className="sm:max-w-xl rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Специализации
            </DialogTitle>
            <DialogDescription>
              Выберите одну основную категорию и уточните услуги.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
            {adminCategories.length > 0 ? (
              adminCategories.map((category) => {
                const isCategorySelected = tempSelectedRoles.includes(
                  category.name,
                );
                const isAnotherMainSelected = tempSelectedRoles.some((role) =>
                  adminCategories.some(
                    (c) => c.name === role && c.name !== category.name,
                  ),
                );

                return (
                  <div
                    key={category.id}
                    className={cn(
                      "flex flex-col border rounded-2xl p-4 transition-all duration-300",
                      isCategorySelected
                        ? "bg-primary/5 border-primary/40 shadow-sm ring-1 ring-primary/20"
                        : isAnotherMainSelected
                          ? "opacity-50 grayscale-[0.5] hover:opacity-100 hover:grayscale-0 border-border/50"
                          : "hover:bg-muted/50 border-border/50",
                    )}
                  >
                    <div
                      className="flex items-start space-x-3 cursor-pointer group"
                      onClick={() =>
                        handleCategoryToggle(category, !isCategorySelected)
                      }
                    >
                      <div
                        className={cn(
                          "mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                          isCategorySelected
                            ? "border-primary bg-primary"
                            : "border-primary/50 group-hover:border-primary",
                        )}
                      >
                        {isCategorySelected && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>

                      <Label className="text-[15px] font-bold leading-tight cursor-pointer w-full flex justify-between items-center pointer-events-none">
                        {category.name}
                        {category.subCategories &&
                          category.subCategories.length > 0 &&
                          (isCategorySelected ? (
                            <ChevronDown className="h-4 w-4 text-primary" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          ))}
                      </Label>
                    </div>

                    {isCategorySelected &&
                      category.subCategories &&
                      category.subCategories.length > 0 && (
                        <div className="ml-8 flex flex-col space-y-3 mt-4 pt-3 border-t border-dashed border-primary/20 animate-in slide-in-from-top-2 fade-in duration-200">
                          {category.subCategories.map((sub: any) => (
                            <div
                              key={sub.id}
                              className="flex items-center space-x-3"
                            >
                              <Checkbox
                                id={`sub-${sub.id}`}
                                checked={tempSelectedRoles.includes(sub.name)}
                                onCheckedChange={() => toggleTempRole(sub.name)}
                                className="rounded-sm border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                              />
                              <Label
                                htmlFor={`sub-${sub.id}`}
                                className="text-sm font-medium leading-none cursor-pointer text-foreground/80 hover:text-foreground transition-colors"
                              >
                                {sub.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-8 text-muted-foreground font-medium">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                Загрузка категорий...
              </div>
            )}
          </div>

          <DialogFooter className="mt-2 gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button
                variant="outline"
                className="rounded-xl h-11 w-full sm:w-auto"
              >
                Отмена
              </Button>
            </DialogClose>
            <Button
              onClick={handleSaveCategories}
              disabled={isSavingCategories || tempSelectedRoles.length === 0}
              className="rounded-xl h-11 font-bold w-full sm:w-auto"
            >
              {isSavingCategories && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
