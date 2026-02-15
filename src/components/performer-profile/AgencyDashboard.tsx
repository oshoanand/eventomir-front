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
  getPerformersByIds,
  removeSubProfile,
  type PerformerProfile,
  type BookingRequest,
  getBookingsForPerformers,
} from "@/services/performer";
import SpecialistFormDialog from "@/components/SpecialistFormDialog";
import {
  Users,
  PlusCircle,
  Edit,
  Trash2,
  Calendar as CalendarIcon,
} from "@/components/icons";
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
import BookingsSection from "./BookingsSection"; // Re-using this component

const AgencyDashboard = ({ profile }: { profile: PerformerProfile }) => {
  const [subProfiles, setSubProfiles] = useState<PerformerProfile[]>([]);
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSpecialist, setEditingSpecialist] =
    useState<PerformerProfile | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!profile.subProfileIds || profile.subProfileIds.length === 0) {
        setSubProfiles([]);
        setBookingRequests([]);
        return;
      }
      const [subProfilesData, bookingsData] = await Promise.all([
        getPerformersByIds(profile.subProfileIds),
        getBookingsForPerformers(profile.subProfileIds),
      ]);
      setSubProfiles(subProfilesData);
      setBookingRequests(bookingsData);
    } catch (error) {
      console.error("Ошибка загрузки данных агентства:", error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось загрузить данные агентства.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [profile.subProfileIds, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFormSubmit = () => {
    fetchData();
    setIsFormOpen(false);
    setEditingSpecialist(null);
  };

  const handleOpenForm = (specialist: PerformerProfile | null) => {
    setEditingSpecialist(specialist);
    setIsFormOpen(true);
  };

  const handleRemoveSubProfile = async (subProfileId: string) => {
    try {
      await removeSubProfile(profile.id, subProfileId);
      toast({
        title: "Специалист удален",
        description: "Профиль специалиста был успешно удален.",
        variant: "destructive",
      });
      fetchData(); // Refresh the list
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка удаления",
        description: error.message,
      });
    }
  };

  // This is a dummy handler as booking actions are handled inside BookingsSection
  // In a real scenario, you might want to lift the state up or pass a refresh callback.
  const handleBookingAction = async () => {
    toast({
      title: "Обновление...",
      description: "Обновляем список бронирований.",
    });
    await new Promise((res) => setTimeout(res, 1000)); // wait for DB to update
    fetchData();
  };

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

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">
            Панель управления агентства
          </CardTitle>
          <CardDescription>
            Управление специалистами и заказами вашего агентства "{profile.name}
            ".
          </CardDescription>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" /> Ваши специалисты (
              {subProfiles.length})
            </CardTitle>
            <CardDescription>
              Добавляйте и управляйте профилями ваших исполнителей.
            </CardDescription>
          </div>
          <Button onClick={() => handleOpenForm(null)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Добавить специалиста
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <SubProfileSkeleton />
              <SubProfileSkeleton />
            </div>
          ) : subProfiles.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Вы еще не добавили ни одного специалиста.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {subProfiles.map((sub) => (
                <Card key={sub.id}>
                  <CardHeader className="flex flex-row items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={sub.profilePicture} alt={sub.name} />
                      <AvatarFallback>
                        {sub.name.substring(0, 1)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{sub.name}</CardTitle>
                      <CardDescription className="text-xs">
                        {sub.roles.join(", ")}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Badge
                      variant={
                        sub.moderationStatus === "approved"
                          ? "secondary"
                          : sub.moderationStatus === "pending_approval"
                            ? "outline"
                            : "destructive"
                      }
                      className="text-xs"
                    >
                      {sub.moderationStatus === "approved"
                        ? "Одобрен"
                        : sub.moderationStatus === "pending_approval"
                          ? "На модерации"
                          : "Отклонен"}
                    </Badge>
                  </CardContent>
                  <CardFooter className="justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Редактировать"
                      onClick={() => handleOpenForm(sub)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="icon"
                          title="Удалить"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Это действие необратимо. Профиль специалиста "
                            {sub.name}" будет удален.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Отмена</AlertDialogCancel>
                          <AlertDialogAction
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

      <SpecialistFormDialog
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingSpecialist(null);
        }}
        agencyId={profile.id}
        onFormSubmit={handleFormSubmit}
        existingSpecialist={editingSpecialist}
        agencyRoles={profile.roles}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" /> Входящие запросы
          </CardTitle>
          <CardDescription>
            Здесь отображаются все запросы на бронирование для ваших
            специалистов.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Загрузка бронирований...</p>
          ) : (
            <BookingsSection
              bookingRequests={bookingRequests}
              onBookingAction={handleBookingAction}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AgencyDashboard;
