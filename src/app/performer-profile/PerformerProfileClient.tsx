"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

// --- Global Zustand Store ---
import { useChatStore } from "@/store/useChatStore";

import {
  PerformerProfile,
  usePerformerProfile,
  useUpdatePerformerProfile,
  useDeletePerformerProfile,
  useCreateBookingRequest,
  useAcceptBookingRequest,
  useRejectBookingRequest,
  useAddGalleryItem,
  useRemoveGalleryItem,
  useAddCertificate,
  useRemoveCertificate,
  useAddRecommendationLetter,
  useRemoveRecommendationLetter,
  useAddAudioTrack,
  useRemoveAudioTrack,
} from "@/services/performer";
import {
  isFavorite as checkIsFavorite,
  addToFavorites,
  removeFromFavorites,
} from "@/services/favorites";
import { getSiteSettings } from "@/services/settings";
import { useReviews } from "@/services/reviews";
import { apiRequest } from "@/utils/api-client";
import { useTariff } from "@/hooks/use-tariff";

// --- Components ---
import SubscriptionStatusCard from "@/components/profile/SubscriptionStatusCard";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  User,
  Star,
  BookOpen,
  Gem,
  Loader2,
  CalendarIcon,
  Edit3,
  Tags,
  Wallet,
  PlusCircle,
  CreditCard,
  ChevronRight,
  ChevronDown,
  Music,
  Trash2,
} from "lucide-react";

import AgencyDashboard from "@/components/performer-profile/AgencyDashboard";
import ProfileHeader from "@/components/performer-profile/ProfileHeader";
import AboutSection from "@/components/performer-profile/AboutSection";
import GalleryManager from "@/components/performer-profile/GalleryManager";
import ReviewsSection from "@/components/performer-profile/ReviewsSection";
import BookingsSection from "@/components/performer-profile/BookingsSection";
import CalendarSection from "@/components/performer-profile/CalendarSection";
import FileUploadDialog from "@/components/performer-profile/FileUploadDialog";
import { cn } from "@/utils/utils";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8800";

const getImageUrl = (path: string | undefined | null) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path}`;
};

interface SubCategory {
  id: string;
  name: string;
}

interface SiteCategory {
  id: string;
  name: string;
  subCategories?: SubCategory[];
}

const ProfileSkeleton = () => (
  <div className="flex flex-col p-4 space-y-6 pt-safe min-h-screen bg-muted/10">
    <Skeleton className="h-64 w-full rounded-3xl" />
    <Skeleton className="h-32 w-full rounded-3xl" />
    <Skeleton className="h-60 w-full rounded-3xl" />
  </div>
);

const TOP_UP_PRESETS = [500, 1000, 2000, 5000];

export default function PerformerProfileClient() {
  const searchParams = useSearchParams();
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const onlineUsers = useChatStore((state) => state.onlineUsers);
  const { canPerformAction, getLimit } = useTariff();

  const urlProfileId = searchParams.get("id");
  const sessionUser = session?.user;
  const targetProfileId = urlProfileId
    ? urlProfileId
    : sessionUser?.role === "performer"
      ? sessionUser?.id
      : null;
  const isOwnProfile = !!(
    sessionUser?.id && targetProfileId === sessionUser.id
  );

  const {
    data: profile,
    isLoading: isProfileLoading,
    isError,
    refetch: refetchProfile,
  } = usePerformerProfile(targetProfileId || null);

  const isPerformerOnline = profile ? onlineUsers.has(profile.id) : false;
  const { data: reviews = [] } = useReviews(targetProfileId || null);

  // Check if the user is a DJ to conditionally render the audio upload section
  const isDJ = profile?.roles?.some(
    (role) => role.toLowerCase() === "dj" || role.toLowerCase() === "диджей",
  );

  const [adminCategories, setAdminCategories] = useState<SiteCategory[]>([]);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [tempSelectedRoles, setTempSelectedRoles] = useState<string[]>([]);
  const [isSavingCategories, setIsSavingCategories] = useState(false);

  const updateMutation = useUpdatePerformerProfile();
  const deleteMutation = useDeletePerformerProfile();
  const createBookingMutation = useCreateBookingRequest();
  const acceptBookingMutation = useAcceptBookingRequest();
  const rejectBookingMutation = useRejectBookingRequest();

  const addGalleryItemMutation = useAddGalleryItem();
  const removeGalleryItemMutation = useRemoveGalleryItem();
  const addCertificateMutation = useAddCertificate();
  const removeCertificateMutation = useRemoveCertificate();
  const addLetterMutation = useAddRecommendationLetter();
  const removeLetterMutation = useRemoveRecommendationLetter();

  // NEW: Audio Mutations
  const addAudioMutation = useAddAudioTrack();
  const removeAudioMutation = useRemoveAudioTrack();

  const [isFavorite, setIsFavorite] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [bookingDetails, setBookingDetails] = useState("");

  const [isGalleryDialogOpen, setIsGalleryDialogOpen] = useState(false);
  const [isCertificateDialogOpen, setIsCertificateDialogOpen] = useState(false);
  const [isLetterDialogOpen, setIsLetterDialogOpen] = useState(false);
  const [isAudioDialogOpen, setIsAudioDialogOpen] = useState(false);

  const [isTopUpDialogOpen, setIsTopUpDialogOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<string>("1000");
  const [isProcessingTopUp, setIsProcessingTopUp] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);

  const targetSub = (profile as any)?.subscription;
  const targetFeatures = targetSub?.plan?.features;
  let performerHasChat = false;

  if (targetFeatures && typeof targetFeatures.chatSupport !== "undefined") {
    performerHasChat = !!targetFeatures.chatSupport;
  } else {
    performerHasChat =
      targetSub?.planId === "STANDARD" || targetSub?.planId === "PREMIUM";
  }

  const fetchWallet = useCallback(async () => {
    if (!isOwnProfile) return;
    try {
      const data = await apiRequest<{ walletBalance: number }>({
        method: "get",
        url: "/api/users/me",
      });
      setWalletBalance(data.walletBalance || 0);
    } catch (error) {
      console.error("Failed to fetch wallet balance", error);
    }
  }, [isOwnProfile]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  useEffect(() => {
    if (profile) {
      setTempSelectedRoles(profile.roles || []);
      if (sessionUser?.role === "customer") {
        checkIsFavorite(sessionUser.id, profile.id).then(setIsFavorite);
      }
    }
  }, [profile, sessionUser]);

  useEffect(() => {
    getSiteSettings()
      .then((settings) => {
        if (settings?.siteCategories) {
          setAdminCategories(settings.siteCategories);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (profile && isOwnProfile) {
      if (profile.subscription?.status === "EXPIRED") {
        setTimeout(() => {
          toast({
            variant: "destructive",
            title: "Срок действия тарифа истек",
            description: `Действие вашего тарифа завершено. Перейдите во вкладку "Подписка", чтобы обновить план.`,
          });
        }, 1000);
      }
    }
  }, [profile, isOwnProfile, toast]);

  useEffect(() => {
    const topupStatus = searchParams.get("topup");
    const paymentStatus = searchParams.get("payment");

    if (topupStatus === "success") {
      toast({
        title: "Обработка платежа...",
        description: "Ожидаем подтверждение от банка. Пожалуйста, подождите...",
      });

      let attempts = 0;
      const pollInterval = setInterval(() => {
        attempts++;
        refetchProfile();
        fetchWallet();

        if (attempts >= 4) {
          clearInterval(pollInterval);
          toast({
            title: "Баланс обновлен!",
            description: "Средства успешно зачислены на ваш кошелек.",
            variant: "default",
          });
        }
      }, 1500);

      router.replace("/performer-profile", { scroll: false });
      return () => clearInterval(pollInterval);
    }

    if (topupStatus === "failed") {
      toast({
        variant: "destructive",
        title: "Ошибка оплаты",
        description: "Платеж был отклонен или отменен банком.",
      });
      router.replace("/performer-profile", { scroll: false });
    }

    if (paymentStatus === "success") {
      toast({
        title: "Успешно!",
        description: "Заявка успешно оплачена и опубликована.",
        variant: "default",
      });
      router.replace("/performer-profile", { scroll: false });
    }
  }, [searchParams, toast, router, refetchProfile, fetchWallet]);

  const handlePartialUpdate = async (
    dataToUpdate: Partial<PerformerProfile>,
    files?: {
      profilePictureFile?: File | null;
      backgroundPictureFile?: File | null;
    },
  ): Promise<void> => {
    if (!profile) return Promise.reject("No profile loaded");
    return new Promise((resolve, reject) => {
      updateMutation.mutate(
        { performerId: profile.id, data: { ...dataToUpdate, ...files } },
        {
          onSuccess: () => {
            toast({ variant: "default", title: "Изменения сохранены" });
            resolve();
          },
          onError: (error) => {
            toast({ variant: "destructive", title: "Ошибка сохранения" });
            reject(error);
          },
        },
      );
    });
  };

  const handleSaveCategories = async () => {
    setIsSavingCategories(true);
    try {
      await handlePartialUpdate({ roles: tempSelectedRoles });
      setIsCategoryDialogOpen(false);
    } finally {
      setIsSavingCategories(false);
    }
  };

  const handleCategoryToggle = (category: SiteCategory, isChecked: boolean) => {
    if (isChecked) {
      setTempSelectedRoles((prev) => [...prev, category.name]);
    } else {
      const subNames = category.subCategories?.map((s) => s.name) || [];
      setTempSelectedRoles((prev) =>
        prev.filter((r) => r !== category.name && !subNames.includes(r)),
      );
    }
  };

  const toggleTempRole = (roleName: string) => {
    setTempSelectedRoles((prev) =>
      prev.includes(roleName)
        ? prev.filter((r) => r !== roleName)
        : [...prev, roleName],
    );
  };

  const handleDeleteProfile = () => {
    if (!profile || !isOwnProfile) return;
    if (confirm("Вы уверены? Это действие необратимо.")) {
      deleteMutation.mutate(profile.id, {
        onSuccess: () => {
          toast({ title: "Профиль удален" });
          router.push("/");
        },
        onError: () =>
          toast({ variant: "destructive", title: "Ошибка удаления" }),
      });
    }
  };

  const handleToggleFavorite = async () => {
    if (!profile || !sessionUser) return;
    try {
      if (isFavorite) {
        await removeFromFavorites(sessionUser.id, profile.id);
        toast({ description: "Удалено из избранного" });
      } else {
        await addToFavorites(sessionUser.id, {
          id: profile.id,
          name: profile.name,
          profilePicture: profile.profilePicture || "",
          city: profile.city,
          roles: profile.roles,
        });
        toast({
          variant: "default",
          description: "Добавлено в избранное",
        });
      }
      setIsFavorite(!isFavorite);
    } catch (e) {
      toast({ variant: "destructive", title: "Ошибка" });
    }
  };

  const handleOpenChat = async () => {
    if (!profile || !sessionUser) {
      return toast({ variant: "destructive", title: "Войдите в систему" });
    }
    if (profile.id === sessionUser.id) {
      return toast({
        variant: "destructive",
        title: "Вы не можете отправить сообщение самому себе",
      });
    }
    if (!performerHasChat && !isOwnProfile) {
      return toast({
        variant: "destructive",
        title: "Чат недоступен",
        description:
          "Тарифный план данного исполнителя не поддерживает личные сообщения.",
      });
    }
    router.push(`/chat/${profile.id}`);
  };

  const handleSubmitBooking = () => {
    if (!profile || !selectedDate || !sessionUser)
      return toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Войдите и выберите дату",
      });
    createBookingMutation.mutate(
      {
        performerId: profile.id,
        requestData: {
          date: selectedDate,
          customerId: sessionUser.id,
          customerName: sessionUser.name || "Customer",
          details: bookingDetails,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Запрос отправлен" });
          setIsBookingOpen(false);
          setBookingDetails("");
          setSelectedDate(undefined);
        },
        onError: () =>
          toast({ variant: "destructive", title: "Ошибка отправки" }),
      },
    );
  };

  const handleAddGalleryItem = async (
    file: File,
    title: string,
    description: string,
  ) => {
    if (!profile) return false;

    const currentCount = profile.gallery?.length || 0;
    if (isOwnProfile && !canPerformAction("maxPhotoUpload", currentCount)) {
      toast({
        variant: "destructive",
        title: "Лимит достигнут",
        description: `Вы достигли максимального количества фото (${getLimit("maxPhotoUpload")}) для вашего тарифа.`,
      });
      return false;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Файл слишком большой" });
      return false;
    }
    try {
      await addGalleryItemMutation.mutateAsync({
        performerId: profile.id,
        file,
        title,
        description,
      });
      toast({ variant: "default", title: "Фото добавлено" });
      return true;
    } catch {
      return false;
    }
  };

  const handleAddCertificateWrapper = async (
    file: File,
    description: string,
  ) => {
    if (!profile) return false;
    try {
      await addCertificateMutation.mutateAsync({
        performerId: profile.id,
        file,
        description,
      });
      toast({ variant: "default", title: "Добавлено" });
      return true;
    } catch {
      return false;
    }
  };

  const handleAddLetterWrapper = async (file: File, description: string) => {
    if (!profile) return false;
    try {
      await addLetterMutation.mutateAsync({
        performerId: profile.id,
        file,
        description,
      });
      toast({ variant: "default", title: "Добавлено" });
      return true;
    } catch {
      return false;
    }
  };

  const handleTopUpSubmit = async () => {
    const amount = Number(topUpAmount);
    if (!amount || amount <= 0) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Введите корректную сумму.",
      });
      return;
    }

    setIsProcessingTopUp(true);
    try {
      const response = await apiRequest<{ paymentUrl: string }>({
        method: "post",
        url: "/api/wallet/topup/performer",
        data: { amount },
      });

      if (response.paymentUrl) {
        toast({ title: "Переход к оплате..." });
        window.location.href = response.paymentUrl;
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось создать платеж. Попробуйте позже.",
      });
    } finally {
      setIsProcessingTopUp(false);
    }
  };

  if (isProfileLoading || authStatus === "loading") return <ProfileSkeleton />;
  if (isError || !profile) {
    return (
      <div className="container mx-auto py-20 flex flex-col items-center justify-center space-y-4">
        <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center text-muted-foreground mb-4">
          ?
        </div>
        <h2 className="text-2xl font-bold">Профиль не найден</h2>
        <Button
          onClick={() => router.push("/")}
          variant="default"
          className="mt-4"
        >
          Вернуться на главную
        </Button>
      </div>
    );
  }

  if (isOwnProfile && profile.accountType === "agency" && !urlProfileId) {
    return (
      <div className="flex flex-col min-h-screen bg-muted/10 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-10 pt-4 md:pt-10">
        <div className="container mx-auto max-w-5xl px-4">
          <AgencyDashboard profile={profile} />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col min-h-screen bg-muted/10 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-10 pt-4 md:pt-10">
        <div className="container max-w-5xl mx-auto px-4 space-y-6">
          <ProfileHeader
            profile={profile}
            isOwnProfile={isOwnProfile}
            isFavorite={isFavorite}
            isOnline={isPerformerOnline}
            performerHasChat={performerHasChat}
            onPartialUpdate={handlePartialUpdate}
            onDeleteProfile={handleDeleteProfile}
            onToggleFavorite={handleToggleFavorite}
            onOpenChat={handleOpenChat}
            onBook={() => {
              if (!sessionUser) return router.push("/login");
              setIsBookingOpen(true);
            }}
            getImageUrl={getImageUrl}
          />

          {/* --- CATEGORY SECTION --- */}
          <div className="bg-background rounded-3xl p-6 shadow-sm border border-border/50 relative group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <Tags className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold">Специализации</h3>
              </div>
              {isOwnProfile && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary font-bold px-2 rounded-full hover:bg-primary/10"
                  onClick={() => setIsCategoryDialogOpen(true)}
                >
                  <Edit3 className="h-4 w-4 mr-1.5" /> Редактировать
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.roles && profile.roles.length > 0 ? (
                profile.roles.map((role) => (
                  <Badge
                    key={role}
                    variant="secondary"
                    className="px-3 py-1.5 text-[13px] bg-primary/10 text-primary border-transparent rounded-lg font-semibold"
                  >
                    {role}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Категории пока не указаны.
                </p>
              )}
            </div>
          </div>

          {/* --- TABS SECTION --- */}
          <Tabs defaultValue="about" className="w-full">
            <div className="sticky top-[60px] md:top-[70px] z-30 bg-muted/10 backdrop-blur-xl pb-4 pt-2 -mx-4 px-4 sm:mx-0 sm:px-0 transition-all">
              <TabsList className="w-full justify-start h-auto p-1.5 bg-background/60 shadow-sm border border-border/50 gap-2 overflow-x-auto rounded-2xl no-scrollbar flex-nowrap">
                <TabsTrigger
                  value="about"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-xl px-4 py-2.5 transition-all font-semibold text-sm whitespace-nowrap"
                >
                  <User className="mr-2 h-4 w-4" /> О себе
                </TabsTrigger>
                <TabsTrigger
                  value="portfolio"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-xl px-4 py-2.5 transition-all font-semibold text-sm whitespace-nowrap"
                >
                  <BookOpen className="mr-2 h-4 w-4" /> Портфолио
                </TabsTrigger>
                <TabsTrigger
                  value="reviews"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-xl px-4 py-2.5 transition-all font-semibold text-sm whitespace-nowrap"
                >
                  <Star className="mr-2 h-4 w-4" /> Отзывы
                  {reviews.length > 0 && (
                    <span className="ml-2 text-xs bg-background/20 px-1.5 py-0.5 rounded-full">
                      {reviews.length}
                    </span>
                  )}
                </TabsTrigger>

                {isOwnProfile && (
                  <>
                    <TabsTrigger
                      value="bookings"
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-xl px-4 py-2.5 transition-all font-semibold text-sm whitespace-nowrap"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" /> Брони
                    </TabsTrigger>
                    <TabsTrigger
                      value="subscription"
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-xl px-4 py-2.5 transition-all font-semibold text-sm whitespace-nowrap"
                    >
                      <Gem className="mr-2 h-4 w-4" /> Подписка
                    </TabsTrigger>
                    <TabsTrigger
                      value="wallet"
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-xl px-4 py-2.5 transition-all font-semibold text-sm whitespace-nowrap"
                    >
                      <Wallet className="mr-2 h-4 w-4" /> Кошелек
                    </TabsTrigger>
                    <TabsTrigger
                      value="calendar"
                      className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-xl px-4 py-2.5 transition-all font-semibold text-sm whitespace-nowrap"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" /> Календарь
                    </TabsTrigger>
                  </>
                )}
              </TabsList>
            </div>

            <div className="grid grid-cols-1 gap-8 mt-2">
              <TabsContent
                value="about"
                className="m-0 focus-visible:outline-none animate-in fade-in duration-300"
              >
                <AboutSection
                  profile={profile}
                  isOwnProfile={isOwnProfile}
                  onPartialUpdate={handlePartialUpdate}
                  onAddCertificate={() => setIsCertificateDialogOpen(true)}
                  onDeleteCertificate={(id) =>
                    removeCertificateMutation.mutate({
                      performerId: profile.id,
                      itemId: id,
                    })
                  }
                  onAddLetter={() => setIsLetterDialogOpen(true)}
                  onDeleteLetter={(id) =>
                    removeLetterMutation.mutate({
                      performerId: profile.id,
                      itemId: id,
                    })
                  }
                />
              </TabsContent>

              <TabsContent
                value="portfolio"
                className="m-0 focus-visible:outline-none animate-in fade-in duration-300"
              >
                {/* --- DJ AUDIO SECTION --- */}
                {isDJ && (
                  <div className="mb-8 bg-background rounded-3xl p-6 shadow-sm border border-border/50">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <Music className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-bold">Аудиозаписи</h3>
                      </div>
                      {isOwnProfile && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary font-bold px-2 rounded-full hover:bg-primary/10"
                          onClick={() => setIsAudioDialogOpen(true)}
                        >
                          <PlusCircle className="h-4 w-4 mr-1.5" /> Добавить
                          трек
                        </Button>
                      )}
                    </div>

                    <div className="space-y-3">
                      {(profile as any).audioTracks &&
                      (profile as any).audioTracks.length > 0 ? (
                        (profile as any).audioTracks.map((track: any) => (
                          <div
                            key={track.id}
                            className="flex items-center gap-4 bg-muted/30 p-3 rounded-2xl border border-border/50"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-[15px] truncate mb-1.5 text-foreground">
                                {track.title}
                              </p>
                              <audio
                                controls
                                className="w-full h-10 rounded-full outline-none"
                              >
                                <source
                                  src={getImageUrl(track.file_url)}
                                  type="audio/mpeg"
                                />
                                Ваш браузер не поддерживает элемент{" "}
                                <code>audio</code>.
                              </audio>
                            </div>
                            {isOwnProfile && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:bg-destructive/10 shrink-0"
                                onClick={() =>
                                  removeAudioMutation.mutate({
                                    performerId: profile.id,
                                    trackId: track.id,
                                  })
                                }
                              >
                                <Trash2 className="w-5 h-5" />
                              </Button>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="border border-dashed border-border/60 rounded-2xl p-6 flex flex-col items-center justify-center text-center text-muted-foreground bg-muted/10">
                          <Music className="h-8 w-8 mb-2 opacity-20" />
                          <p className="text-sm font-medium">
                            Треки пока не загружены.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <GalleryManager
                  gallery={profile.gallery || []}
                  isOwnProfile={isOwnProfile}
                  onAddOrEdit={() => setIsGalleryDialogOpen(true)}
                  onDelete={(id) =>
                    removeGalleryItemMutation.mutate({
                      performerId: profile.id,
                      itemId: id,
                    })
                  }
                />
              </TabsContent>

              <TabsContent
                value="reviews"
                className="m-0 focus-visible:outline-none animate-in fade-in duration-300"
              >
                <ReviewsSection
                  profileId={profile.id}
                  currentUserRole={sessionUser?.role as string | null}
                  currentUserId={sessionUser?.id || null}
                  currentUserName={sessionUser?.name || null}
                  onReviewSubmit={() => refetchProfile()}
                />
              </TabsContent>

              {isOwnProfile && (
                <>
                  <TabsContent
                    value="bookings"
                    className="m-0 focus-visible:outline-none animate-in fade-in duration-300"
                  >
                    <BookingsSection
                      bookingRequests={profile.bookingRequests || []}
                      onBookingAction={(id, action) =>
                        action === "accept"
                          ? acceptBookingMutation.mutate({
                              performerId: profile.id,
                              requestId: id,
                            })
                          : rejectBookingMutation.mutate({
                              performerId: profile.id,
                              requestId: id,
                            })
                      }
                    />
                  </TabsContent>

                  <TabsContent
                    value="subscription"
                    className="m-0 focus-visible:outline-none animate-in fade-in duration-300"
                  >
                    <div className="w-full">
                      <SubscriptionStatusCard />
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="wallet"
                    className="m-0 focus-visible:outline-none animate-in fade-in duration-300"
                  >
                    <div className="max-w-3xl space-y-6">
                      <div className="rounded-3xl bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground shadow-lg relative overflow-hidden">
                        <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />
                        <div className="absolute -left-6 -bottom-6 w-24 h-24 rounded-full bg-black/10 blur-xl pointer-events-none" />
                        <Wallet className="absolute right-4 top-1/2 -translate-y-1/2 h-32 w-32 opacity-[0.07] pointer-events-none" />
                        <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                          <div>
                            <p className="text-primary-foreground/80 font-medium text-sm flex items-center gap-2">
                              <Wallet className="h-4 w-4" /> Баланс кошелька
                            </p>
                            <div className="text-4xl font-black mt-1 tracking-tight">
                              {walletBalance.toLocaleString("ru-RU")}{" "}
                              <span className="text-2xl font-bold opacity-80">
                                ₽
                              </span>
                            </div>
                          </div>
                          <Button
                            onClick={() => setIsTopUpDialogOpen(true)}
                            className="w-full bg-background/20 hover:bg-background/30 text-primary-foreground backdrop-blur-md border-0 rounded-2xl h-12 font-bold shadow-none active:scale-[0.98] transition-all"
                          >
                            <PlusCircle className="mr-2 h-5 w-5" /> Пополнить
                          </Button>
                        </div>
                      </div>
                      <div className="border border-border/50 rounded-3xl p-6 flex flex-col justify-center bg-background shadow-sm">
                        <CreditCard className="h-10 w-10 mb-4 text-primary/50" />
                        <h4 className="font-bold text-lg text-foreground mb-1">
                          Удобная оплата
                        </h4>
                        <p className="text-sm text-muted-foreground font-medium">
                          Используйте средства кошелька для мгновенной оплаты
                          подписок или продвижения профиля без комиссий.
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent
                    value="calendar"
                    className="m-0 focus-visible:outline-none animate-in fade-in duration-300"
                  >
                    <CalendarSection profile={profile} />
                  </TabsContent>
                </>
              )}
            </div>
          </Tabs>
        </div>
      </div>

      {/* --- MODALS --- */}
      <Dialog open={isTopUpDialogOpen} onOpenChange={setIsTopUpDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Сумма пополнения
            </DialogTitle>
            <DialogDescription>
              Выберите или введите сумму (₽)
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-5">
            <div className="grid grid-cols-2 gap-3">
              {TOP_UP_PRESETS.map((amount) => (
                <Button
                  key={amount}
                  type="button"
                  variant={
                    topUpAmount === amount.toString() ? "default" : "outline"
                  }
                  className={cn(
                    "h-14 rounded-2xl font-bold text-lg transition-all",
                    topUpAmount === amount.toString()
                      ? "shadow-md"
                      : "border-border/60 bg-muted/30",
                  )}
                  onClick={() => setTopUpAmount(amount.toString())}
                >
                  {amount}
                </Button>
              ))}
            </div>
            <div className="relative">
              <Input
                type="number"
                placeholder="Другая сумма"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                className="h-14 rounded-2xl text-lg font-bold pl-4 pr-12 bg-muted/30 border-border/60"
              />
              <span className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                ₽
              </span>
            </div>
          </div>
          <Button
            onClick={handleTopUpSubmit}
            disabled={isProcessingTopUp}
            className="w-full h-14 rounded-2xl font-bold text-lg mt-2"
          >
            {isProcessingTopUp ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <CreditCard className="mr-2 h-5 w-5" />
            )}
            Оплатить
          </Button>
        </DialogContent>
      </Dialog>

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
              Выберите основные категории и уточните услуги (подкатегории).
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
            {adminCategories.length > 0 ? (
              adminCategories.map((category) => {
                const isCategorySelected = tempSelectedRoles.includes(
                  category.name,
                );
                return (
                  <div
                    key={category.id}
                    className={`flex flex-col border rounded-2xl p-4 transition-all duration-300 ${isCategorySelected ? "bg-primary/5 border-primary/40 shadow-sm" : "hover:bg-muted/50 border-border/50"}`}
                  >
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id={`cat-${category.id}`}
                        checked={isCategorySelected}
                        onCheckedChange={(checked) =>
                          handleCategoryToggle(category, !!checked)
                        }
                        className="mt-0.5 rounded-md"
                      />
                      <Label
                        htmlFor={`cat-${category.id}`}
                        className="text-[15px] font-bold leading-tight cursor-pointer w-full flex justify-between items-center"
                      >
                        {category.name}
                        {category.subCategories &&
                          category.subCategories.length > 0 &&
                          (isCategorySelected ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          ))}
                      </Label>
                    </div>
                    {isCategorySelected &&
                      category.subCategories &&
                      category.subCategories.length > 0 && (
                        <div className="ml-7 flex flex-col space-y-3 mt-4 pt-3 border-t border-dashed border-border animate-in slide-in-from-top-2 fade-in duration-200">
                          {category.subCategories.map((sub) => (
                            <div
                              key={sub.id}
                              className="flex items-center space-x-3"
                            >
                              <Checkbox
                                id={`sub-${sub.id}`}
                                checked={tempSelectedRoles.includes(sub.name)}
                                onCheckedChange={() => toggleTempRole(sub.name)}
                                className="rounded-sm"
                              />
                              <Label
                                htmlFor={`sub-${sub.id}`}
                                className="text-sm font-medium leading-none cursor-pointer"
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
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />{" "}
                Загрузка категорий...
              </div>
            )}
          </div>
          <DialogFooter className="mt-2 gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="rounded-xl h-11">
                Отмена
              </Button>
            </DialogClose>
            <Button
              onClick={handleSaveCategories}
              disabled={isSavingCategories}
              className="rounded-xl h-11 font-bold"
            >
              {isSavingCategories && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}{" "}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Dialogs */}
      {isOwnProfile && (
        <>
          <FileUploadDialog
            isOpen={isCertificateDialogOpen}
            onClose={() => setIsCertificateDialogOpen(false)}
            title="Загрузить сертификат"
            description="Файл формата JPG, PNG или PDF"
            onFileUpload={handleAddCertificateWrapper}
          />
          <FileUploadDialog
            isOpen={isLetterDialogOpen}
            onClose={() => setIsLetterDialogOpen(false)}
            title="Загрузить рекомендацию"
            description="Файл формата JPG, PNG или PDF"
            onFileUpload={handleAddLetterWrapper}
          />
          <FileUploadDialog
            isOpen={isGalleryDialogOpen}
            onClose={() => setIsGalleryDialogOpen(false)}
            title="Добавить в портфолио"
            description="Загрузите качественное фото вашей работы"
            onFileUpload={(file, desc) =>
              handleAddGalleryItem(file, "Новая работа", desc)
            }
          />
          {/* NEW: Audio File Upload Dialog */}
          <FileUploadDialog
            isOpen={isAudioDialogOpen}
            onClose={() => setIsAudioDialogOpen(false)}
            title="Загрузить аудио трек"
            description="Файл формата MP3 или WAV"
            accept="audio/*"
            onFileUpload={async (file, title) => {
              if (!profile) return false;
              try {
                await addAudioMutation.mutateAsync({
                  performerId: profile.id,
                  file,
                  title,
                });
                toast({ variant: "default", title: "Трек успешно загружен" });
                return true;
              } catch {
                return false;
              }
            }}
          />
        </>
      )}
    </>
  );
}
