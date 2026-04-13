"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { useSocket } from "@/components/providers/SocketProvider";
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
} from "@/services/performer";
import {
  isFavorite as checkIsFavorite,
  addToFavorites,
  removeFromFavorites,
} from "@/services/favorites";
import { createOrGetChat } from "@/services/chat";
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
} from "lucide-react";

import ChatDialog from "@/components/chat/ChatDialog";
import AgencyDashboard from "@/components/performer-profile/AgencyDashboard";
import ProfileHeader from "@/components/performer-profile/ProfileHeader";
import AboutSection from "@/components/performer-profile/AboutSection";
import GalleryManager from "@/components/performer-profile/GalleryManager";
import ReviewsSection from "@/components/performer-profile/ReviewsSection";
import BookingsSection from "@/components/performer-profile/BookingsSection";
import CalendarSection from "@/components/performer-profile/CalendarSection";
import FileUploadDialog from "@/components/performer-profile/FileUploadDialog";

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
  <div className="space-y-8 container max-w-5xl mx-auto py-10 px-4 animate-pulse">
    <Skeleton className="h-64 w-full rounded-2xl" />
    <div className="flex flex-col md:flex-row gap-8">
      <div className="w-full md:w-1/3 space-y-4">
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
      <div className="w-full md:w-2/3 space-y-4">
        <Skeleton className="h-10 w-1/2 rounded-lg" />
        <Skeleton className="h-60 w-full rounded-lg" />
      </div>
    </div>
  </div>
);

export default function PerformerProfilePage() {
  const searchParams = useSearchParams();
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const { onlineUsers } = useSocket() || { onlineUsers: [] };
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

  const isPerformerOnline = profile ? onlineUsers.includes(profile.id) : false;
  const { data: reviews = [] } = useReviews(targetProfileId || null);

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

  const [isFavorite, setIsFavorite] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [bookingDetails, setBookingDetails] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState("");

  const [isGalleryDialogOpen, setIsGalleryDialogOpen] = useState(false);
  const [isCertificateDialogOpen, setIsCertificateDialogOpen] = useState(false);
  const [isLetterDialogOpen, setIsLetterDialogOpen] = useState(false);

  const [isTopUpDialogOpen, setIsTopUpDialogOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<number | "">("");
  const [isProcessingTopUp, setIsProcessingTopUp] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);

  // 🚨 EVALUATE TARGET PERFORMER'S SUBSCRIPTION FEATURES
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
            variant: "success" as any,
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
        variant: "success" as any,
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
            toast({ variant: "success" as any, title: "Изменения сохранены" });
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
          variant: "success" as any,
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

    try {
      const chatId = await createOrGetChat(profile.id);
      setCurrentChatId(chatId);
      setIsChatOpen(true);
    } catch (e) {
      toast({ variant: "destructive", title: "Ошибка чата" });
    }
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
      toast({ variant: "success" as any, title: "Фото добавлено" });
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
      toast({ variant: "success" as any, title: "Добавлено" });
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
      toast({ variant: "success" as any, title: "Добавлено" });
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

  // 🚨 CORRECTED AGENCY VIEW ROUTING
  // If the user owns the profile AND it's an agency AND they aren't looking at a specific sub-profile ID
  if (isOwnProfile && profile.accountType === "agency" && !urlProfileId) {
    return (
      <div className="container mx-auto py-10 px-4 max-w-7xl">
        <AgencyDashboard profile={profile} />
      </div>
    );
  }

  return (
    <>
      <div className="container max-w-5xl mx-auto py-8 px-4 space-y-8 animate-in fade-in">
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
        <div className="bg-card border shadow-sm rounded-xl p-6 relative group">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <Tags className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold">Специализации и Категории</h3>
            </div>
            {isOwnProfile && (
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-black"
                onClick={() => setIsCategoryDialogOpen(true)}
              >
                <Edit3 className="h-4 w-4 mr-2" /> Редактировать
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.roles && profile.roles.length > 0 ? (
              profile.roles.map((role) => (
                <Badge
                  key={role}
                  variant="secondary"
                  className="px-3 py-1.5 text-sm bg-primary/10 text-primary border-transparent"
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
          <div className="sticky top-[60px] z-30 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 py-4 border-b mb-6 shadow-sm rounded-t-xl px-2">
            <TabsList className="w-full justify-start h-auto p-1 bg-muted/50 gap-2 overflow-x-auto rounded-lg">
              <TabsTrigger
                value="about"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-4 py-2.5 transition-all"
              >
                <User className="mr-2 h-4 w-4" /> О себе
              </TabsTrigger>
              <TabsTrigger
                value="portfolio"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-4 py-2.5 transition-all"
              >
                <BookOpen className="mr-2 h-4 w-4" /> Портфолио
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-4 py-2.5 transition-all"
              >
                <Star className="mr-2 h-4 w-4 text-[#facc15]" /> Отзывы
                {reviews.length > 0 && (
                  <span className="ml-1.5 text-xs bg-[#facc15] text-muted-foreground font-medium bg-muted px-1.5 py-0.5 rounded-full">
                    {reviews.length}
                  </span>
                )}
              </TabsTrigger>

              {isOwnProfile && (
                <>
                  <TabsTrigger
                    value="bookings"
                    className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-4 py-2.5 transition-all"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" /> Брони
                  </TabsTrigger>
                  <TabsTrigger
                    value="subscription"
                    className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-4 py-2.5 transition-all"
                  >
                    <Gem className="mr-2 h-4 w-4 text-yellow-600" /> Подписка
                  </TabsTrigger>
                  <TabsTrigger
                    value="wallet"
                    className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-4 py-2.5 transition-all"
                  >
                    <Wallet className="mr-2 h-4 w-4 text-blue-600" /> Кошелек
                  </TabsTrigger>
                  <TabsTrigger
                    value="calendar"
                    className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-4 py-2.5 transition-all"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" /> Календарь
                  </TabsTrigger>
                </>
              )}
            </TabsList>
          </div>

          <div className="grid grid-cols-1 gap-8 pb-20">
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
              className="m-0 focus-visible:outline-none"
            >
              <GalleryManager
                gallery={profile.gallery || []}
                isOwnProfile={isOwnProfile}
                onAddOrEdit={() => {
                  const currentCount = profile.gallery?.length || 0;
                  if (
                    isOwnProfile &&
                    !canPerformAction("maxPhotoUpload", currentCount)
                  ) {
                    toast({
                      variant: "destructive",
                      title: "Лимит достигнут",
                      description: `Ваш тариф позволяет загрузить не более ${getLimit("maxPhotoUpload")} фото. Перейдите во вкладку "Подписка", чтобы обновить план.`,
                    });
                    return;
                  }
                  setIsGalleryDialogOpen(true);
                }}
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
              className="m-0 focus-visible:outline-none"
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
                  className="m-0 focus-visible:outline-none"
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
                  className="m-0 focus-visible:outline-none"
                >
                  <div className="w-full">
                    <h2 className="text-2xl font-bold tracking-tight mb-6">
                      Ваша подписка
                    </h2>
                    <SubscriptionStatusCard />
                  </div>
                </TabsContent>

                {/* --- WALLET DASHBOARD --- */}
                <TabsContent
                  value="wallet"
                  className="m-0 focus-visible:outline-none"
                >
                  <div className="max-w-3xl">
                    <h2 className="text-2xl font-bold tracking-tight mb-6">
                      Мой кошелек
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                          <p className="text-blue-100 text-sm font-medium mb-1">
                            Баланс счета
                          </p>
                          <h3 className="text-5xl font-extrabold tracking-tight mb-6">
                            {walletBalance.toLocaleString("ru-RU")} ₽
                          </h3>
                          <Button
                            onClick={() => setIsTopUpDialogOpen(true)}
                            className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-6 border-0 shadow-sm"
                          >
                            <PlusCircle className="mr-2 h-4 w-4" /> Пополнить
                          </Button>
                        </div>
                        <Wallet className="absolute -bottom-6 -right-6 h-48 w-48 text-white opacity-10" />
                      </div>
                      <div className="border rounded-2xl p-6 flex flex-col justify-center bg-card text-muted-foreground shadow-sm">
                        <CreditCard className="h-10 w-10 mb-4 opacity-50" />
                        <h4 className="font-semibold text-foreground mb-1">
                          Удобная оплата
                        </h4>
                        <p className="text-sm">
                          Используйте средства кошелька для мгновенной оплаты
                          подписок или продвижения профиля без комиссий шлюза.
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent
                  value="calendar"
                  className="m-0 focus-visible:outline-none"
                >
                  <CalendarSection profile={profile} />
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>
      </div>

      {/* --- MODALS --- */}

      <Dialog open={isTopUpDialogOpen} onOpenChange={setIsTopUpDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Пополнение кошелька</DialogTitle>
            <DialogDescription>
              Введите сумму, на которую хотите пополнить счет.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Сумма пополнения (₽)</Label>
              <Input
                type="number"
                min="100"
                placeholder="Например: 1500"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(Number(e.target.value))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsTopUpDialogOpen(false)}
              disabled={isProcessingTopUp}
            >
              Отмена
            </Button>
            <Button
              onClick={handleTopUpSubmit}
              disabled={isProcessingTopUp || !topUpAmount}
            >
              {isProcessingTopUp ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              Перейти к оплате
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Специализации</DialogTitle>
            <DialogDescription>
              Выберите основные категории и уточните услуги (подкатегории),
              которые вы оказываете.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
            {adminCategories.length > 0 ? (
              adminCategories.map((category) => {
                const isCategorySelected = tempSelectedRoles.includes(
                  category.name,
                );
                return (
                  <div
                    key={category.id}
                    className={`flex flex-col border rounded-lg p-4 transition-all duration-300 ${
                      isCategorySelected
                        ? "bg-muted/30 border-primary/40 shadow-sm"
                        : "hover:bg-muted/10"
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id={`cat-${category.id}`}
                        checked={isCategorySelected}
                        onCheckedChange={(checked) =>
                          handleCategoryToggle(category, !!checked)
                        }
                      />
                      <Label
                        htmlFor={`cat-${category.id}`}
                        className="text-base font-semibold leading-none cursor-pointer w-full flex justify-between items-center"
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
                        <div className="ml-7 flex flex-col space-y-3 mt-4 pt-3 border-t border-dashed animate-in slide-in-from-top-2 fade-in duration-200">
                          {category.subCategories.map((sub) => (
                            <div
                              key={sub.id}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`sub-${sub.id}`}
                                checked={tempSelectedRoles.includes(sub.name)}
                                onCheckedChange={() => toggleTempRole(sub.name)}
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
              <div className="col-span-full text-center py-8 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                Загрузка категорий...
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Отмена</Button>
            </DialogClose>
            <Button
              onClick={handleSaveCategories}
              disabled={isSavingCategories}
            >
              {isSavingCategories && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Забронировать исполнителя</DialogTitle>
            <DialogDescription>
              Укажите дату и детали вашего мероприятия.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-center border rounded-md p-4 bg-muted/10">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) =>
                  date < new Date() ||
                  !!profile.bookedDates?.some(
                    (d) => new Date(d).toDateString() === date.toDateString(),
                  )
                }
                initialFocus
              />
            </div>
            <Textarea
              placeholder="Опишите детали (время, место, формат)..."
              value={bookingDetails}
              onChange={(e) => setBookingDetails(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">Отмена</Button>
            </DialogClose>
            <Button
              onClick={handleSubmitBooking}
              disabled={createBookingMutation.isPending || !selectedDate}
            >
              {createBookingMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Отправить запрос
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Real-Time Chat Dialog */}
      {isChatOpen && sessionUser && currentChatId && (
        <ChatDialog
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          chatId={currentChatId}
          performerName={profile.name || "Исполнитель"}
          currentUserId={sessionUser.id}
          performerImage={getImageUrl(profile.profilePicture)}
        />
      )}

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
        </>
      )}
    </>
  );
}
