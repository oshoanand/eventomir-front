"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

// Services
import {
  PerformerProfile,
  GalleryItem,
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

// Components
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
import { User, Star, BookOpen, Gem, Loader2, CalendarIcon } from "lucide-react";

import ChatDialog from "@/components/ChatDialog";
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
  <div className="space-y-8 container max-w-5xl mx-auto py-10 px-4">
    <Skeleton className="h-64 w-full rounded-xl" />
    <div className="flex flex-col md:flex-row gap-8">
      <div className="w-full md:w-1/3 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
      <div className="w-full md:w-2/3 space-y-4">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-60 w-full" />
      </div>
    </div>
  </div>
);

export default function PerformerProfilePage() {
  const searchParams = useSearchParams();
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const { toast } = useToast();

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

  // --- Local State ---
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<PerformerProfile>>({});
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(
    null,
  );
  const [backgroundPictureFile, setBackgroundPictureFile] =
    useState<File | null>(null);

  const [isFavorite, setIsFavorite] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [bookingDetails, setBookingDetails] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState("");

  const [isGalleryDialogOpen, setIsGalleryDialogOpen] = useState(false);
  const [editingGalleryItem, setEditingGalleryItem] =
    useState<GalleryItem | null>(null);
  const [isCertificateDialogOpen, setIsCertificateDialogOpen] = useState(false);
  const [isLetterDialogOpen, setIsLetterDialogOpen] = useState(false);

  // --- Effects ---
  useEffect(() => {
    if (profile) {
      setFormData(profile);
      if (sessionUser?.role === "customer") {
        checkIsFavorite(sessionUser.id, profile.id).then(setIsFavorite);
      }
    }
  }, [profile, sessionUser]);

  // --- Handlers ---

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fileType: "profilePicture" | "backgroundPicture",
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (fileType === "profilePicture") setProfilePictureFile(file);
      else setBackgroundPictureFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          [fileType]: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = () => {
    if (!profile) return;
    setIsEditing(false);
    updateMutation.mutate(
      {
        performerId: profile.id,
        data: { ...formData, profilePictureFile, backgroundPictureFile },
      },
      {
        onSuccess: () => {
          toast({ title: "Профиль обновлен" });
          setProfilePictureFile(null);
          setBackgroundPictureFile(null);
        },
        onError: () => {
          toast({ variant: "destructive", title: "Ошибка сохранения" });
          setIsEditing(true);
        },
      },
    );
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData(profile || {});
    setProfilePictureFile(null);
    setBackgroundPictureFile(null);
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

  const handleBookingAction = (
    requestId: string,
    action: "accept" | "reject",
  ) => {
    if (!profile) return;
    const mutation =
      action === "accept" ? acceptBookingMutation : rejectBookingMutation;
    mutation.mutate(
      { performerId: profile.id, requestId },
      {
        onSuccess: () =>
          toast({
            title: `Запрос ${action === "accept" ? "принят" : "отклонен"}`,
          }),
        onError: () => toast({ variant: "destructive", title: "Ошибка" }),
      },
    );
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
    try {
      const chatId = await createOrGetChat(sessionUser.id, profile.id);
      setCurrentChatId(chatId);
      setIsChatOpen(true);
    } catch (e) {
      toast({ variant: "destructive", title: "Ошибка чата" });
    }
  };

  // Content Wrappers
  const handleAddGalleryItem = async (
    file: File,
    title: string,
    description: string,
  ) => {
    if (!profile) return false;
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
      <div className="container mx-auto py-20 text-center space-y-4">
        <h2 className="text-2xl font-semibold">Профиль не найден</h2>
        <Button onClick={() => router.push("/")} variant="outline">
          На главную
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
      <div className="container max-w-6xl mx-auto py-8 px-4 space-y-8">
        {/* Header Section */}
        <ProfileHeader
          profile={profile}
          isOwnProfile={isOwnProfile}
          isEditing={isEditing}
          formData={formData}
          isFavorite={isFavorite}
          onEditToggle={() => setIsEditing(!isEditing)}
          onSaveChanges={handleSaveChanges}
          onCancelEdit={handleCancelEdit}
          onFileChange={handleFileChange}
          setFormData={setFormData}
          onToggleFavorite={handleToggleFavorite}
          onOpenChat={handleOpenChat}
          onDeleteProfile={handleDeleteProfile}
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

        {/* Content Tabs */}
        <Tabs defaultValue="about" className="w-full">
          <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2 border-b mb-6">
            <TabsList className="w-full justify-start h-auto p-0 bg-transparent gap-2 overflow-x-auto">
              <TabsTrigger
                value="about"
                className="data-[state=active]:bg-secondary rounded-full px-4 py-2"
              >
                <User className="mr-2 h-4 w-4" />О себе
              </TabsTrigger>
              <TabsTrigger
                value="portfolio"
                className="data-[state=active]:bg-secondary rounded-full px-4 py-2"
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Портфолио
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="data-[state=active]:bg-secondary rounded-full px-4 py-2"
              >
                <Star className="mr-2 h-4 w-4" />
                Отзывы
              </TabsTrigger>

              {isOwnProfile && (
                <>
                  <TabsTrigger
                    value="bookings"
                    className="data-[state=active]:bg-secondary rounded-full px-4 py-2"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Брони
                  </TabsTrigger>
                  <TabsTrigger
                    value="subscription"
                    className="data-[state=active]:bg-secondary rounded-full px-4 py-2"
                  >
                    <Gem className="mr-2 h-4 w-4" />
                    Подписка
                  </TabsTrigger>
                  <TabsTrigger
                    value="calendar"
                    className="data-[state=active]:bg-secondary rounded-full px-4 py-2"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    Календарь
                  </TabsTrigger>
                </>
              )}
            </TabsList>
          </div>

          <div className="grid grid-cols-1 gap-8">
            <TabsContent
              value="about"
              className="m-0 focus-visible:outline-none"
            >
              <AboutSection
                profile={profile}
                isEditing={isEditing}
                formData={formData}
                setFormData={setFormData}
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
                isEditing={isEditing}
                onAddOrEdit={(item) => {
                  setEditingGalleryItem(item);
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
                currentUserRole={sessionUser?.role as any}
                currentCustomerId={sessionUser?.id || ""}
                currentCustomerName={sessionUser?.name || "Guest"}
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
                    onBookingAction={handleBookingAction}
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

      {/* --- Modals --- */}
      <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Забронировать исполнителя</DialogTitle>
            <DialogDescription>
              Укажите дату и детали вашего мероприятия.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-center border rounded-md p-4">
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

      {isChatOpen && sessionUser && (
        <ChatDialog
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          chatId={currentChatId}
          performerName={profile.name}
          currentUserId={sessionUser.id}
          performerId={profile.id}
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
