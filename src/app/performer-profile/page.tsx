"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { useSocket } from "@/components/providers/socket-provider";
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
import {
  User,
  Star,
  BookOpen,
  Gem,
  Loader2,
  CalendarIcon,
  Edit3,
  Tags,
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

  // Safe destructuring of socket context
  const { onlineUsers } = useSocket() || { onlineUsers: [] };

  // --- Identity Logic ---
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

  // --- Data Fetching ---
  const {
    data: profile,
    isLoading: isProfileLoading,
    isError,
    refetch: refetchProfile,
  } = usePerformerProfile(targetProfileId || null);

  // Real-time online status check
  const isPerformerOnline = profile ? onlineUsers.includes(profile.id) : false;

  const { data: reviews = [] } = useReviews(targetProfileId || null);

  // --- Dynamic Categories State ---
  const [adminCategories, setAdminCategories] = useState<string[]>([]);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [tempSelectedRoles, setTempSelectedRoles] = useState<string[]>([]);
  const [isSavingCategories, setIsSavingCategories] = useState(false);

  // --- Mutations ---
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

  // --- Local UI State ---
  const [isFavorite, setIsFavorite] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [bookingDetails, setBookingDetails] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState("");

  const [isGalleryDialogOpen, setIsGalleryDialogOpen] = useState(false);
  const [isCertificateDialogOpen, setIsCertificateDialogOpen] = useState(false);
  const [isLetterDialogOpen, setIsLetterDialogOpen] = useState(false);

  // --- Effects ---
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
        if (settings?.siteCategories)
          setAdminCategories(settings.siteCategories.map((c) => c.name));
      })
      .catch(console.error);
  }, []);

  // --- UNIVERSAL PARTIAL UPDATE HANDLER ---
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
            toast({ variant: "success", title: "Изменения сохранены" });
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

  const toggleTempRole = (roleName: string) => {
    setTempSelectedRoles((prev) =>
      prev.includes(roleName)
        ? prev.filter((r) => r !== roleName)
        : [...prev, roleName],
    );
  };

  // --- Interactions ---
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
        toast({ description: "Добавлено в избранное" });
      }
      setIsFavorite(!isFavorite);
    } catch (e) {
      toast({ variant: "destructive", title: "Ошибка" });
    }
  };

  const handleOpenChat = async () => {
    if (!profile || !sessionUser) {
      toast({ variant: "destructive", title: "Войдите в систему" });
      return;
    }
    if (profile.id === sessionUser.id) {
      toast({
        variant: "destructive",
        title: "Вы не можете отправить сообщение самому себе",
      });
      return;
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
    if (!profile || !selectedDate || !sessionUser) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Войдите и выберите дату",
      });
      return;
    }
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

    // 15MB limit
    const maxSizeInBytes = 15 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      toast({
        variant: "destructive",
        title: "Файл слишком большой",
        description: "Размер файла не должен превышать 15 МБ.",
      });
      return false;
    }

    try {
      await addGalleryItemMutation.mutateAsync({
        performerId: profile.id,
        file,
        title,
        description,
      });
      toast({ title: "Фото добавлено" });
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
      toast({ title: "Добавлено" });
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
      toast({ title: "Добавлено" });
      return true;
    } catch {
      return false;
    }
  };

  // --- Render ---
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

  if (isOwnProfile && profile.accountType === "agency") {
    return (
      <div className="container mx-auto py-10">
        <AgencyDashboard profile={profile} />
      </div>
    );
  }

  return (
    <>
      <div className="container max-w-5xl mx-auto py-8 px-4 space-y-8">
        {/* --- HEADER SECTION --- */}
        <ProfileHeader
          profile={profile}
          isOwnProfile={isOwnProfile}
          isFavorite={isFavorite}
          isOnline={isPerformerOnline}
          onPartialUpdate={handlePartialUpdate}
          onDeleteProfile={handleDeleteProfile}
          onToggleFavorite={handleToggleFavorite}
          onOpenChat={handleOpenChat}
          onBook={() => {
            if (!sessionUser) {
              toast({ variant: "destructive", title: "Войдите в систему" });
              router.push("/login");
              return;
            }
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
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
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
                  <div className="max-w-3xl">
                    <h2 className="text-2xl font-bold tracking-tight mb-6">
                      Ваша подписка
                    </h2>
                    <SubscriptionStatusCard />
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

      {/* 1. Category Edit Dialog */}
      <Dialog
        open={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Специализации</DialogTitle>
            <DialogDescription>
              Выберите категории, в которых вы оказываете услуги.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
            {adminCategories.length > 0 ? (
              adminCategories.map((category) => (
                <div
                  key={category}
                  className="flex items-start space-x-2 border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    id={`cat-${category}`}
                    checked={tempSelectedRoles.includes(category)}
                    onCheckedChange={() => toggleTempRole(category)}
                  />
                  <Label
                    htmlFor={`cat-${category}`}
                    className="text-sm font-medium leading-none cursor-pointer w-full"
                  >
                    {category}
                  </Label>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-8 text-muted-foreground">
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
              Сохранить изменения
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Booking Dialog */}
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
              className="resize-none"
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

      {/* 3. Real-Time Chat Dialog */}
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

      {/* 4. Upload Dialogs */}
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
