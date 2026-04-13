"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Users,
  PlusCircle,
  Edit,
  Trash2,
  Calendar as CalendarIcon,
  RefreshCw,
  Lock,
  Info,
  ChevronRight,
} from "lucide-react";

// Types & Services
import { PerformerProfile } from "@/services/performer";
import { BookingRequest } from "@/services/booking";
import {
  getAgencySpecialists,
  deleteSpecialist,
  getAgencyBookings,
} from "@/services/agency";

// 🚨 IMPORT TARIFF HOOK
import { useTariff } from "@/hooks/use-tariff";
import { cn } from "@/utils/utils";

// Child Components
import SpecialistFormDialog from "@/components/SpecialistFormDialog";
import BookingsSection from "./BookingsSection";

interface AgencyDashboardProps {
  profile: PerformerProfile;
}

const AgencyDashboard = ({ profile }: AgencyDashboardProps) => {
  const router = useRouter();
  const { toast } = useToast();

  // --- State ---
  const [subProfiles, setSubProfiles] = useState<PerformerProfile[]>([]);
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSpecialist, setEditingSpecialist] =
    useState<PerformerProfile | null>(null);

  // 🚨 INIT TARIFF
  const {
    getLimit,
    canPerformAction,
    isLoading: isTariffLoading,
  } = useTariff();
  const currentSpecialistCount = subProfiles.length;

  // Assume we set a feature limit called 'maxAgencySpecialists' in the admin panel.
  // If not set, default to 3.
  const maxSpecialists = getLimit("maxAgencySpecialists") || 3;
  const canAddMoreSpecialists = canPerformAction(
    "maxAgencySpecialists",
    currentSpecialistCount,
  );

  // --- Data Fetching ---
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [specialistsData, bookingsData] = await Promise.all([
        getAgencySpecialists(),
        getAgencyBookings(),
      ]);

      setSubProfiles(specialistsData);
      setBookingRequests(bookingsData);
    } catch (error) {
      console.error("Agency Load Error:", error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось загрузить данные агентства.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Handlers ---
  const handleOpenForm = (specialist: PerformerProfile | null) => {
    // 🚨 ENFORCE LIMITS
    if (!specialist && !canAddMoreSpecialists) {
      toast({
        variant: "destructive",
        title: "Лимит достигнут",
        description: `Вы не можете добавить более ${maxSpecialists} специалистов на текущем тарифе.`,
      });
      return;
    }

    setEditingSpecialist(specialist);
    setIsFormOpen(true);
  };

  const handleFormSubmit = () => {
    fetchData();
    setIsFormOpen(false);
    setEditingSpecialist(null);
    toast({
      variant: "success" as any,
      title: "Успешно",
      description: "Список специалистов обновлен.",
    });
  };

  const handleRemoveSubProfile = async (subProfileId: string) => {
    try {
      await deleteSpecialist(subProfileId);
      toast({
        title: "Специалист удален",
        description:
          "Профиль специалиста был успешно удален из вашего агентства.",
      });
      fetchData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка удаления",
        description: error.message || "Не удалось удалить специалиста.",
      });
    }
  };

  const handleBookingRefresh = async () => {
    await new Promise((r) => setTimeout(r, 500));
    fetchData();
  };

  // --- Skeletons ---
  const SubProfileSkeleton = () => (
    <Card className="rounded-2xl border-muted/50">
      <CardHeader className="flex flex-row items-center gap-4">
        <Skeleton className="h-14 w-14 rounded-full shrink-0" />
        <div className="space-y-2.5 w-full">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </CardHeader>
      <CardFooter className="justify-end gap-2 border-t pt-4 pb-4 bg-muted/10">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </CardFooter>
    </Card>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 1. Dashboard Header */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-black border-none shadow-xl text-white rounded-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <CardHeader className="relative z-10 px-8 py-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <CardTitle className="text-3xl md:text-4xl font-extrabold tracking-tight">
                Панель агентства
              </CardTitle>
              <CardDescription className="text-slate-300 text-base md:text-lg mt-2 font-medium">
                Управление специалистами и заказами агентства{" "}
                <span className="text-white font-bold">"{profile.name}"</span>
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="lg"
              onClick={fetchData}
              disabled={isLoading}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Обновить данные
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* 2. Specialists Management Section */}
      <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b bg-muted/20 pb-6 pt-6 gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              Ваши специалисты
              {!isLoading && (
                <Badge
                  variant="secondary"
                  className="ml-2 bg-blue-50 text-blue-700 border-blue-200"
                >
                  {currentSpecialistCount} / {maxSpecialists}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-2 text-base">
              Управляйте профилями исполнителей, работающих от вашего имени.
            </CardDescription>
          </div>
          <Button
            onClick={() => handleOpenForm(null)}
            size="lg"
            className="w-full sm:w-auto shadow-sm"
          >
            {canAddMoreSpecialists ? (
              <PlusCircle className="mr-2 h-5 w-5" />
            ) : (
              <Lock className="mr-2 h-5 w-5 text-white/80" />
            )}
            Добавить специалиста
          </Button>
        </CardHeader>

        <CardContent className="pt-8 bg-card">
          {/* 🚨 UX/UI Upgrade: Subscription Limit Warning */}
          {!canAddMoreSpecialists && !isLoading && !isTariffLoading && (
            <Alert className="mb-8 border-orange-200 bg-orange-50 text-orange-900 dark:bg-orange-950/30 dark:text-orange-200 dark:border-orange-900 rounded-xl">
              <Info className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <AlertTitle className="font-bold text-base">
                Лимит специалистов исчерпан
              </AlertTitle>
              <AlertDescription className="text-sm mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <span>
                  Вы добавили максимальное количество специалистов (
                  {maxSpecialists}) для вашего текущего тарифа.
                </span>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="bg-white hover:bg-orange-100 border-orange-200 text-orange-700 font-semibold w-full sm:w-auto"
                >
                  <Link href="/pricing">
                    Улучшить тариф <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <SubProfileSkeleton />
              <SubProfileSkeleton />
              <SubProfileSkeleton />
            </div>
          ) : subProfiles.length === 0 ? (
            <div className="text-center py-16 bg-muted/10 rounded-2xl border-2 border-dashed border-border/50">
              <div className="bg-muted p-4 rounded-full w-fit mx-auto mb-4">
                <Users className="h-10 w-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-xl font-bold mb-2">Специалистов пока нет</h3>
              <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                Вы еще не добавили ни одного профиля. Добавьте своих
                сотрудников, чтобы клиенты могли бронировать их услуги.
              </p>
              <Button
                onClick={() => handleOpenForm(null)}
                size="lg"
                className="shadow-sm"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Добавить первого специалиста
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subProfiles.map((sub) => (
                <Card
                  key={sub.id}
                  className="overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 rounded-2xl border-border/50 group"
                >
                  <CardHeader className="flex flex-row items-center gap-4 pb-4">
                    <Avatar className="h-16 w-16 border-2 border-background shadow-md">
                      <AvatarImage
                        src={sub.profilePicture}
                        alt={sub.name}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                        {sub.name.substring(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="overflow-hidden">
                      <CardTitle
                        className="text-lg font-bold truncate group-hover:text-primary transition-colors"
                        title={sub.name}
                      >
                        {sub.name}
                      </CardTitle>
                      <CardDescription className="text-sm truncate mt-1">
                        {sub.roles?.join(", ") || "Роли не указаны"}
                      </CardDescription>
                    </div>
                  </CardHeader>

                  <CardContent className="pb-4">
                    <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Статус:
                      </span>
                      <Badge
                        variant={
                          sub.moderationStatus === "approved"
                            ? "secondary"
                            : sub.moderationStatus === "pending_approval"
                              ? "outline"
                              : "destructive"
                        }
                        className={cn(
                          "text-xs font-semibold px-2.5 py-0.5",
                          sub.moderationStatus === "approved"
                            ? "bg-green-100 text-green-700 hover:bg-green-200 border-green-200"
                            : "",
                        )}
                      >
                        {sub.moderationStatus === "approved"
                          ? "Активен"
                          : sub.moderationStatus === "pending_approval"
                            ? "На модерации"
                            : "Отклонен"}
                      </Badge>
                    </div>
                  </CardContent>

                  <CardFooter className="bg-muted/10 pt-4 pb-4 justify-between gap-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-white hover:bg-muted font-semibold"
                      onClick={() =>
                        router.push(`/performer-profile?id=${sub.id}`)
                      }
                    >
                      Профиль
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 border bg-white hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                        title="Редактировать"
                        onClick={() => handleOpenForm(sub)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 border bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                            title="Удалить"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Удалить специалиста?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-base">
                              Это действие необратимо. Профиль{" "}
                              <strong className="text-foreground">
                                {sub.name}
                              </strong>{" "}
                              будет удален, и он больше не будет отображаться в
                              поиске от имени вашего агентства.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="mt-4">
                            <AlertDialogCancel className="rounded-xl">
                              Отмена
                            </AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-red-600 hover:bg-red-700 rounded-xl"
                              onClick={() => handleRemoveSubProfile(sub.id)}
                            >
                              Да, удалить
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Specialist Form Dialog */}
      <SpecialistFormDialog
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingSpecialist(null);
        }}
        agencyId={profile.id}
        onFormSubmit={handleFormSubmit}
        existingSpecialist={editingSpecialist}
        agencyRoles={profile.roles || []}
      />

      {/* 4. Bookings Section */}
      <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-muted/20 pb-6 pt-6">
          <CardTitle className="flex items-center gap-2 text-2xl">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
              <CalendarIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            Входящие запросы
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Единый центр управления бронированиями для всех специалистов вашего
            агентства.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-8">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : (
            <BookingsSection
              bookingRequests={bookingRequests}
              onBookingAction={handleBookingRefresh}
              isAgencyView={true}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AgencyDashboard;
