"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

// Icons
import {
  ArrowLeft,
  Users,
  Ticket,
  CheckCircle,
  Clock,
  User,
  QrCode,
  CalendarDays,
  XCircle,
} from "lucide-react";

import { apiRequest } from "@/utils/api-client";
import { cn } from "@/utils/utils";

// --- Types ---
// Updated to match the new Invitation/RSVP model from the backend
interface Attendee {
  id: string;
  eventId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string | null;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  ticketToken: string;
  isCheckedIn: boolean;
  checkInTime: string | null;
  createdAt: string;
}

interface EventStats {
  totalAccepted: number;
  totalRejected: number;
  totalPending: number;
  checkedIn: number;
}

export default function EventAttendeesPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const eventId = params.id as string;

  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [stats, setStats] = useState<EventStats>({
    totalAccepted: 0,
    totalRejected: 0,
    totalPending: 0,
    checkedIn: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAttendees = async () => {
      try {
        // Fetch the raw invitations list from the backend
        const response = await apiRequest<Attendee[]>({
          method: "get",
          url: `/api/events/${eventId}/attendees`,
        });

        setAttendees(response);

        // Calculate stats on the frontend for maximum flexibility
        const calculatedStats = response.reduce(
          (acc, attendee) => {
            if (attendee.status === "ACCEPTED") acc.totalAccepted += 1;
            if (attendee.status === "REJECTED") acc.totalRejected += 1;
            if (attendee.status === "PENDING") acc.totalPending += 1;
            if (attendee.isCheckedIn) acc.checkedIn += 1;
            return acc;
          },
          { totalAccepted: 0, totalRejected: 0, totalPending: 0, checkedIn: 0 },
        );

        setStats(calculatedStats);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Ошибка загрузки",
          description: "Не удалось загрузить список гостей.",
        });
        // If unauthorized or not host, kick them back
        if (error.response?.status === 403) {
          router.push("/manage-events");
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (eventId) fetchAttendees();
  }, [eventId, router, toast]);

  if (isLoading) {
    return (
      <div className="flex flex-col p-4 sm:p-10 max-w-6xl mx-auto space-y-6 bg-muted/10 min-h-screen pt-safe">
        <Skeleton className="h-10 w-48 mb-4 sm:mb-8 rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Skeleton className="h-24 sm:h-32 w-full rounded-2xl" />
          <Skeleton className="h-24 sm:h-32 w-full rounded-2xl" />
          <Skeleton className="h-24 sm:h-32 w-full rounded-2xl" />
          <Skeleton className="h-24 sm:h-32 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-96 w-full rounded-3xl" />
      </div>
    );
  }

  // Helper for Status Badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACCEPTED":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-0">
            Подтвердил(а)
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge
            variant="destructive"
            className="bg-red-100 text-red-700 hover:bg-red-200 border-0"
          >
            Отказ
          </Badge>
        );
      case "PENDING":
      default:
        return (
          <Badge
            variant="outline"
            className="text-muted-foreground border-border/60"
          >
            Ожидает
          </Badge>
        );
    }
  };

  return (
    <div className="container mx-auto py-6 sm:py-10 px-4 sm:px-6 max-w-6xl animate-in fade-in bg-muted/10 min-h-screen pt-safe">
      <Button
        variant="ghost"
        className="mb-6 -ml-2 sm:-ml-4 rounded-xl text-muted-foreground hover:text-foreground"
        onClick={() => router.push("/manage-events")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Назад к событиям
      </Button>

      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-2 tracking-tight">
            <Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            Список гостей
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1.5 font-medium">
            Статистика откликов (RSVP) и контроль входа.
          </p>
        </div>

        {/* Floating Scan Button */}
        <Button
          onClick={() => router.push(`/manage-events/${eventId}/scan`)}
          className="w-full sm:w-auto rounded-xl font-bold h-12 shadow-md sm:h-10"
        >
          <QrCode className="mr-2 h-5 w-5" /> Сканер билетов
        </Button>
      </div>

      {/* --- STATS DASHBOARD --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-blue-500/10 to-transparent">
          <CardHeader className="p-4 sm:p-5 space-y-0 pb-1">
            <CardTitle className="text-xs sm:text-sm font-semibold text-muted-foreground flex justify-between">
              Подтвердили
              <CheckCircle className="h-4 w-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0">
            <div className="text-xl sm:text-2xl font-black text-foreground">
              {stats.totalAccepted}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 font-medium">
              Будут на мероприятии
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-orange-500/10 to-transparent">
          <CardHeader className="p-4 sm:p-5 space-y-0 pb-1">
            <CardTitle className="text-xs sm:text-sm font-semibold text-muted-foreground flex justify-between">
              Ожидают ответа
              <Clock className="h-4 w-4 text-orange-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0">
            <div className="text-xl sm:text-2xl font-black text-foreground">
              {stats.totalPending}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 font-medium">
              Еще не решили
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-emerald-500/10 to-transparent">
          <CardHeader className="p-4 sm:p-5 space-y-0 pb-1">
            <CardTitle className="text-xs sm:text-sm font-semibold text-muted-foreground flex justify-between">
              Вошли (Check-in)
              <QrCode className="h-4 w-4 text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0">
            <div className="text-xl sm:text-2xl font-black text-foreground">
              {stats.checkedIn}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 font-medium">
              Осталось: {stats.totalAccepted - stats.checkedIn} гостей
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-red-500/10 to-transparent">
          <CardHeader className="p-4 sm:p-5 space-y-0 pb-1">
            <CardTitle className="text-xs sm:text-sm font-semibold text-muted-foreground flex justify-between">
              Отказались
              <XCircle className="h-4 w-4 text-red-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0">
            <div className="text-xl sm:text-2xl font-black text-foreground">
              {stats.totalRejected}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 font-medium">
              Не смогут прийти
            </p>
          </CardContent>
        </Card>
      </div>

      {/* --- ATTENDEES LIST/TABLE --- */}
      <Card className="shadow-sm rounded-3xl border-border/50 overflow-hidden mb-20 md:mb-0">
        <CardHeader className="border-b bg-background px-5 sm:px-6 py-5">
          <CardTitle className="text-lg font-bold">
            Список приглашенных
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 bg-muted/5 sm:bg-background">
          {/* ========================================================= */}
          {/* MOBILE VIEW (Cards) - Visible only below md */}
          {/* ========================================================= */}
          <div className="md:hidden flex flex-col">
            {attendees.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-background">
                <Users className="h-10 w-10 opacity-20 mb-3" />
                <p className="font-medium text-sm">Список гостей пока пуст.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {attendees.map((attendee) => (
                  <div
                    key={attendee.id}
                    className={cn(
                      "p-4 bg-background transition-colors",
                      attendee.isCheckedIn && "bg-emerald-50/50",
                    )}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <User className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[15px] truncate text-foreground leading-tight">
                            {attendee.guestName || "Без имени"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate font-medium mt-0.5">
                            {attendee.guestEmail}
                          </p>
                          {attendee.guestPhone && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {attendee.guestPhone}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <div className="bg-muted/30 rounded-xl p-2.5 flex flex-col justify-center">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                          Статус RSVP
                        </span>
                        <div className="text-sm font-bold flex items-center gap-1.5">
                          {getStatusBadge(attendee.status)}
                        </div>
                      </div>
                      <div className="bg-muted/30 rounded-xl p-2.5 flex flex-col justify-center">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                          Отклик получен
                        </span>
                        <span className="text-xs font-semibold flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                          {format(new Date(attendee.createdAt), "dd.MM, HH:mm")}
                        </span>
                      </div>
                    </div>

                    {/* Check-in Status Area */}
                    {attendee.status === "ACCEPTED" && (
                      <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-3">
                        {attendee.isCheckedIn ? (
                          <>
                            <Badge
                              variant="secondary"
                              className="bg-emerald-100 text-emerald-700 border-0 rounded-lg px-2.5 font-bold text-[11px]"
                            >
                              <CheckCircle className="h-3 w-3 mr-1.5" /> Вход
                              выполнен
                            </Badge>
                            <span className="text-xs font-bold text-muted-foreground">
                              {attendee.checkInTime
                                ? format(
                                    new Date(attendee.checkInTime),
                                    "HH:mm",
                                  )
                                : "—"}
                            </span>
                          </>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-muted-foreground border-border/60 bg-transparent rounded-lg px-2.5 font-bold text-[11px]"
                          >
                            <Clock className="h-3 w-3 mr-1.5" /> Ожидается
                            прибытие
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* DESKTOP VIEW (Table) - Visible only on md and up */}
          {/* ========================================================= */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6 h-12">Гость</TableHead>
                  <TableHead>Отклик (RSVP)</TableHead>
                  <TableHead>Дата отклика</TableHead>
                  <TableHead>Вход (Check-in)</TableHead>
                  <TableHead className="pr-6 text-right">Время входа</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendees.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-16 text-muted-foreground bg-background"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-8 w-8 opacity-20" />
                        <p className="font-medium text-sm">
                          Список гостей пока пуст. Поделитесь ссылкой на
                          мероприятие!
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  attendees.map((attendee) => (
                    <TableRow
                      key={attendee.id}
                      className={cn(
                        "bg-background",
                        attendee.isCheckedIn && "bg-emerald-50/30",
                        attendee.status === "REJECTED" && "opacity-60",
                      )}
                    >
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <User className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-bold text-[14px] leading-tight text-foreground">
                              {attendee.guestName || "Без имени"}
                            </p>
                            <p className="text-[12px] font-medium text-muted-foreground mt-0.5">
                              {attendee.guestEmail}
                            </p>
                            {attendee.guestPhone && (
                              <p className="text-[11px] text-muted-foreground/80 mt-0.5">
                                {attendee.guestPhone}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>{getStatusBadge(attendee.status)}</TableCell>

                      <TableCell>
                        <div className="text-[13px] font-medium text-muted-foreground">
                          {format(
                            new Date(attendee.createdAt),
                            "dd MMM yyyy, HH:mm",
                            { locale: ru },
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        {attendee.status === "ACCEPTED" ? (
                          attendee.isCheckedIn ? (
                            <Badge
                              variant="secondary"
                              className="bg-emerald-100 text-emerald-700 border-0 font-bold px-2 py-0.5 text-[11px]"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" /> Вошел
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-muted-foreground bg-transparent border-border/60 font-bold px-2 py-0.5 text-[11px]"
                            >
                              <Clock className="h-3 w-3 mr-1" /> Ожидается
                            </Badge>
                          )
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            —
                          </span>
                        )}
                      </TableCell>

                      <TableCell className="pr-6 text-right">
                        <div className="text-[13px] font-bold text-muted-foreground">
                          {attendee.checkInTime
                            ? format(new Date(attendee.checkInTime), "HH:mm", {
                                locale: ru,
                              })
                            : "—"}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
