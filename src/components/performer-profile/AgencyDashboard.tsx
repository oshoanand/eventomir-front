"use client";

import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";

// Types & Services
import { PerformerProfile } from "@/services/performer";
import { BookingRequest } from "@/services/booking";
// IMPORTS FROM NEW ROBUST AGENCY SERVICE
import {
  getAgencySpecialists,
  deleteSpecialist,
  getAgencyBookings,
} from "@/services/agency";

// Child Components
import SpecialistFormDialog from "@/components/SpecialistFormDialog";
import BookingsSection from "./BookingsSection";

const AgencyDashboard = ({ profile }: { profile: PerformerProfile }) => {
  // --- State ---
  const [subProfiles, setSubProfiles] = useState<PerformerProfile[]>([]);
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSpecialist, setEditingSpecialist] =
    useState<PerformerProfile | null>(null);

  const { toast } = useToast();

  // --- Data Fetching ---
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Robust: Fetch specialized agency data in parallel
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

  // Initial Load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Handlers ---

  const handleOpenForm = (specialist: PerformerProfile | null) => {
    setEditingSpecialist(specialist);
    setIsFormOpen(true);
  };

  const handleFormSubmit = () => {
    // Refresh data after create/update
    fetchData();
    setIsFormOpen(false);
    setEditingSpecialist(null);
    toast({
      title: "Успешно",
      description: "Список специалистов обновлен.",
    });
  };

  const handleRemoveSubProfile = async (subProfileId: string) => {
    try {
      // Call the robust backend endpoint
      await deleteSpecialist(subProfileId);

      toast({
        title: "Специалист удален",
        description:
          "Профиль специалиста был успешно удален из вашего агентства.",
      });

      // Optimistic update or refetch
      fetchData();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка удаления",
        description: error.message || "Не удалось удалить специалиста.",
      });
    }
  };

  // Wrapper to handle status changes in the booking section
  const handleBookingRefresh = async () => {
    // Wait briefly for DB consistency then refetch
    await new Promise((r) => setTimeout(r, 500));
    fetchData();
  };

  // --- Skeletons ---
  const SubProfileSkeleton = () => (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
      </CardHeader>
      <CardFooter className="justify-end gap-2">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </CardFooter>
    </Card>
  );

  // --- Render ---
  return (
    <div className="space-y-8">
      {/* 1. Dashboard Header */}
      <Card className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 border-none shadow-md">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-3xl font-bold text-primary">
                Панель агентства
              </CardTitle>
              <CardDescription className="text-lg mt-2">
                Управление специалистами и заказами агентства "{profile.name}"
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Обновить
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* 2. Specialists Management Section */}
      <Card>
        <CardHeader className="flex flex-row justify-between items-center border-b pb-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Users className="h-5 w-5 text-blue-600" />
              Ваши специалисты ({subProfiles.length})
            </CardTitle>
            <CardDescription className="mt-1">
              Управляйте профилями исполнителей, работающих от вашего имени.
            </CardDescription>
          </div>
          <Button onClick={() => handleOpenForm(null)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Добавить специалиста
          </Button>
        </CardHeader>

        <CardContent className="pt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <SubProfileSkeleton />
              <SubProfileSkeleton />
              <SubProfileSkeleton />
            </div>
          ) : subProfiles.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed">
              <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-muted-foreground">
                Вы еще не добавили ни одного специалиста.
              </p>
              <Button variant="link" onClick={() => handleOpenForm(null)}>
                Добавить первого специалиста
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subProfiles.map((sub) => (
                <Card
                  key={sub.id}
                  className="overflow-hidden hover:shadow-md transition-shadow"
                >
                  <CardHeader className="flex flex-row items-center gap-4 pb-3">
                    <Avatar className="h-14 w-14 border-2 border-white shadow-sm">
                      <AvatarImage
                        src={sub.profilePicture}
                        alt={sub.name}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {sub.name.substring(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="overflow-hidden">
                      <CardTitle
                        className="text-base font-semibold truncate"
                        title={sub.name}
                      >
                        {sub.name}
                      </CardTitle>
                      <CardDescription className="text-xs truncate">
                        {sub.roles.join(", ") || "Нет ролей"}
                      </CardDescription>
                    </div>
                  </CardHeader>

                  <CardContent className="pb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        Статус:
                      </span>
                      <Badge
                        variant={
                          sub.moderationStatus === "approved"
                            ? "secondary" // Greenish in default themes usually, or customize
                            : sub.moderationStatus === "pending_approval"
                              ? "outline"
                              : "destructive"
                        }
                        className={`text-xs ${sub.moderationStatus === "approved" ? "bg-green-100 text-green-700 hover:bg-green-200 border-green-200" : ""}`}
                      >
                        {sub.moderationStatus === "approved"
                          ? "Активен"
                          : sub.moderationStatus === "pending_approval"
                            ? "На проверке"
                            : "Отклонен"}
                      </Badge>
                    </div>
                  </CardContent>

                  <CardFooter className="bg-slate-50/50 pt-3 pb-3 justify-end gap-2 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      title="Редактировать"
                      onClick={() => handleOpenForm(sub)}
                    >
                      <Edit className="h-4 w-4 text-slate-600" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                          title="Удалить"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Удалить специалиста?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Это действие необратимо. Профиль{" "}
                            <strong>{sub.name}</strong> будет удален, а история
                            заказов может быть потеряна.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Отмена</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => handleRemoveSubProfile(sub.id)}
                          >
                            Удалить
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
        // Pass agency roles to help filter suggestions if needed
        agencyRoles={profile.roles}
      />

      {/* 4. Bookings Section */}
      <Card>
        <CardHeader className="border-b pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <CalendarIcon className="h-5 w-5 text-purple-600" />
            Входящие запросы
          </CardTitle>
          <CardDescription>
            Мониторинг запросов на бронирование для всех специалистов агентства.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <BookingsSection
              bookingRequests={bookingRequests}
              // Pass the refresh handler.
              // Note: Ensure BookingsSection calls this prop after accepting/rejecting
              onBookingAction={handleBookingRefresh}
              isAgencyView={true} // Optional: Pass a flag if you want to show which Specialist is booked in the table
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AgencyDashboard;
