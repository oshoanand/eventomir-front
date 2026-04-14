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
  Banknote,
  Clock,
  User,
  QrCode,
  CalendarDays,
} from "lucide-react";

import { apiRequest } from "@/utils/api-client";
import { cn } from "@/utils/utils";

// --- Types ---
interface Attendee {
  orderId: string;
  name: string;
  email: string;
  ticketCount: number;
  isUsed: boolean;
  enteredAt: string | null;
  purchaseDate: string;
}

interface EventStats {
  totalSold: number;
  revenue: number;
  checkedIn: number;
  capacity: number;
}

export default function EventAttendeesPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const eventId = params.id as string;

  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAttendees = async () => {
      try {
        const response = await apiRequest<{
          stats: EventStats;
          attendees: Attendee[];
        }>({
          method: "get",
          url: `/api/events/${eventId}/attendees`,
        });

        setStats(response.stats);
        setAttendees(response.attendees);
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
            Статистика продаж и контроль входа.
          </p>
        </div>

        {/* Floating Scan Button for Mobile */}
        <Button
          onClick={() => router.push(`/manage-events/${eventId}/scan`)}
          className="w-full sm:w-auto rounded-xl font-bold h-12 shadow-md sm:h-10"
        >
          <QrCode className="mr-2 h-5 w-5" /> Сканер билетов
        </Button>
      </div>

      {/* --- STATS DASHBOARD --- */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-blue-500/10 to-transparent">
            <CardHeader className="p-4 sm:p-5 space-y-0 pb-1">
              <CardTitle className="text-xs sm:text-sm font-semibold text-muted-foreground flex justify-between">
                Продано
                <Ticket className="h-4 w-4 text-blue-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-0">
              <div className="text-xl sm:text-2xl font-black text-foreground">
                {stats.totalSold}{" "}
                <span className="text-muted-foreground text-sm font-bold">
                  / {stats.capacity}
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 font-medium">
                {Math.round((stats.totalSold / stats.capacity) * 100) || 0}%
                заполнено
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-green-500/10 to-transparent">
            <CardHeader className="p-4 sm:p-5 space-y-0 pb-1">
              <CardTitle className="text-xs sm:text-sm font-semibold text-muted-foreground flex justify-between">
                Доход
                <Banknote className="h-4 w-4 text-green-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-0">
              <div className="text-xl sm:text-2xl font-black text-foreground">
                {stats.revenue.toLocaleString("ru-RU")}{" "}
                <span className="text-sm font-bold opacity-70">₽</span>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 font-medium">
                Успешные оплаты
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-orange-500/10 to-transparent">
            <CardHeader className="p-4 sm:p-5 space-y-0 pb-1">
              <CardTitle className="text-xs sm:text-sm font-semibold text-muted-foreground flex justify-between">
                Вошли (Check-in)
                <CheckCircle className="h-4 w-4 text-orange-500" />
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-5 pt-0">
              <div className="text-xl sm:text-2xl font-black text-foreground">
                {stats.checkedIn}
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 font-medium">
                Осталось: {stats.totalSold - stats.checkedIn} гостей
              </p>
            </CardContent>
          </Card>

          {/* Desktop Scan Shortcut (Hidden on mobile as it has a dedicated button above) */}
          <Card
            className="hidden md:flex bg-primary/5 hover:bg-primary/10 transition-colors border-dashed border-2 cursor-pointer flex-col items-center justify-center rounded-2xl"
            onClick={() => router.push(`/manage-events/${eventId}/scan`)}
          >
            <Button
              variant="link"
              className="font-bold text-primary h-auto p-0 flex flex-col gap-2"
            >
              <QrCode className="h-8 w-8" />
              Сканировать вход
            </Button>
          </Card>
        </div>
      )}

      {/* --- ATTENDEES LIST/TABLE --- */}
      <Card className="shadow-sm rounded-3xl border-border/50 overflow-hidden mb-20 md:mb-0">
        <CardHeader className="border-b bg-background px-5 sm:px-6 py-5">
          <CardTitle className="text-lg font-bold">История покупок</CardTitle>
        </CardHeader>
        <CardContent className="p-0 bg-muted/5 sm:bg-background">
          {/* ========================================================= */}
          {/* MOBILE VIEW (Cards) - Visible only below md */}
          {/* ========================================================= */}
          <div className="md:hidden flex flex-col">
            {attendees.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-background">
                <Users className="h-10 w-10 opacity-20 mb-3" />
                <p className="font-medium text-sm">
                  Проданных билетов пока нет.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {attendees.map((attendee) => (
                  <div
                    key={attendee.orderId}
                    className={cn(
                      "p-4 bg-background transition-colors",
                      attendee.isUsed && "bg-muted/30",
                    )}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <User className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[15px] truncate text-foreground leading-tight">
                            {attendee.name || "Гость"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate font-medium mt-0.5">
                            {attendee.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <div className="bg-muted/30 rounded-xl p-2.5 flex flex-col justify-center">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                          Билеты
                        </span>
                        <span className="text-sm font-bold flex items-center gap-1.5">
                          <Ticket className="h-3.5 w-3.5 text-primary" />{" "}
                          {attendee.ticketCount} шт.
                        </span>
                      </div>
                      <div className="bg-muted/30 rounded-xl p-2.5 flex flex-col justify-center">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                          Покупка
                        </span>
                        <span className="text-xs font-semibold flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                          {format(
                            new Date(attendee.purchaseDate),
                            "dd.MM, HH:mm",
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-3">
                      {attendee.isUsed ? (
                        <>
                          <Badge
                            variant="secondary"
                            className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 rounded-lg px-2.5 font-bold text-[11px]"
                          >
                            <CheckCircle className="h-3 w-3 mr-1.5" /> Вход
                            выполнен
                          </Badge>
                          <span className="text-xs font-bold text-muted-foreground">
                            {attendee.enteredAt
                              ? format(new Date(attendee.enteredAt), "HH:mm")
                              : "—"}
                          </span>
                        </>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-muted-foreground border-border/60 bg-transparent rounded-lg px-2.5 font-bold text-[11px]"
                        >
                          <Clock className="h-3 w-3 mr-1.5" /> Ожидается
                        </Badge>
                      )}
                    </div>
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
                  <TableHead>Кол-во билетов</TableHead>
                  <TableHead>Дата покупки</TableHead>
                  <TableHead>Статус входа</TableHead>
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
                          На это мероприятие пока нет проданных билетов.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  attendees.map((attendee) => (
                    <TableRow
                      key={attendee.orderId}
                      className={cn(
                        "bg-background",
                        attendee.isUsed && "bg-muted/10",
                      )}
                    >
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            <User className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-bold text-[14px] leading-tight text-foreground">
                              {attendee.name || "Гость"}
                            </p>
                            <p className="text-[12px] font-medium text-muted-foreground mt-0.5">
                              {attendee.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="font-bold text-[14px] flex items-center gap-1.5 text-foreground">
                          <Ticket className="h-4 w-4 text-primary" />
                          {attendee.ticketCount} шт.
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-[13px] font-medium text-muted-foreground">
                          {format(
                            new Date(attendee.purchaseDate),
                            "dd MMM yyyy, HH:mm",
                            { locale: ru },
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        {attendee.isUsed ? (
                          <Badge
                            variant="secondary"
                            className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0 font-bold px-2 py-0.5 text-[11px]"
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
                        )}
                      </TableCell>

                      <TableCell className="pr-6 text-right">
                        <div className="text-[13px] font-bold text-muted-foreground">
                          {attendee.enteredAt
                            ? format(new Date(attendee.enteredAt), "HH:mm", {
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
