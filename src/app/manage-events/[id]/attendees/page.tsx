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
} from "lucide-react";

import { apiRequest } from "@/utils/api-client";

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
      <div className="container mx-auto py-10 max-w-6xl space-y-6">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 max-w-6xl animate-in fade-in">
      <Button
        variant="ghost"
        className="mb-6 -ml-4"
        onClick={() => router.push("/manage-events")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Назад к событиям
      </Button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-8 w-8 text-primary" />
          Список гостей
        </h1>
        <p className="text-muted-foreground mt-1">
          Статистика продаж и контроль входа на мероприятие.
        </p>
      </div>

      {/* --- STATS DASHBOARD --- */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-l-4 border-l-blue-500 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Продано билетов
              </CardTitle>
              <Ticket className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalSold} / {stats.capacity}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((stats.totalSold / stats.capacity) * 100) || 0}%
                заполненности
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Общий доход</CardTitle>
              <Banknote className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.revenue.toLocaleString("ru-RU")} ₽
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Сумма успешных оплат
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Вошли (Check-in)
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.checkedIn}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Осталось: {stats.totalSold - stats.checkedIn} гостей
              </p>
            </CardContent>
          </Card>

          {/* Shortcut to Scanner */}
          <Card
            className="bg-primary/5 hover:bg-primary/10 transition-colors border-dashed border-2 cursor-pointer flex flex-col items-center justify-center min-h-[120px]"
            onClick={() => router.push(`/manage-events/${eventId}/scan`)}
          >
            <Button
              variant="link"
              className="font-semibold text-primary h-auto p-0 flex flex-col gap-2"
            >
              <CheckCircle className="h-8 w-8" />
              Открыть сканер билетов
            </Button>
          </Card>
        </div>
      )}

      {/* --- ATTENDEES TABLE --- */}
      <Card className="shadow-sm">
        <CardHeader className="border-b bg-muted/20 pb-4">
          <CardTitle>История покупок</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Гость</TableHead>
                  <TableHead>Кол-во билетов</TableHead>
                  <TableHead>Дата покупки</TableHead>
                  <TableHead>Статус входа</TableHead>
                  <TableHead className="pr-6">Время входа</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendees.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-16 text-muted-foreground"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-8 w-8 opacity-20" />
                        <p>На это мероприятие пока нет проданных билетов.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  attendees.map((attendee) => (
                    <TableRow
                      key={attendee.orderId}
                      className={attendee.isUsed ? "bg-muted/10" : ""}
                    >
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground">
                            <User className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-semibold">
                              {attendee.name || "Гость"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {attendee.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="font-medium flex items-center gap-1">
                          <Ticket className="h-3 w-3 text-muted-foreground" />
                          {attendee.ticketCount} шт.
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-sm text-muted-foreground">
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
                            className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Вошел
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-muted-foreground"
                          >
                            <Clock className="h-3 w-3 mr-1" />
                            Ожидается
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="pr-6">
                        <div className="text-sm">
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
