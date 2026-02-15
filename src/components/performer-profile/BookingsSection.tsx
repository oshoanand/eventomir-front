"use client";

import { BookingRequest } from "@/services/booking";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  Check,
  X,
  Clock,
  User,
  MessageSquare,
  CalendarDays,
} from "lucide-react";

interface BookingsSectionProps {
  bookingRequests: BookingRequest[];
  onBookingAction: (requestId: string, action: "accept" | "reject") => void;
}

const getStatusBadge = (status: string) => {
  // Normalize status for comparison
  const s = status?.toUpperCase() || "PENDING";

  switch (s) {
    case "CONFIRMED":
      return (
        <Badge className="bg-green-600 hover:bg-green-700">Подтверждено</Badge>
      );
    case "REJECTED":
      return <Badge variant="destructive">Отклонено</Badge>;
    case "CANCELLED_BY_CUSTOMER":
      return <Badge variant="secondary">Отменено клиентом</Badge>;
    case "PENDING":
    default:
      return (
        <Badge variant="outline" className="text-yellow-600 border-yellow-600">
          Ожидает
        </Badge>
      );
  }
};

export default function BookingsSection({
  bookingRequests,
  onBookingAction,
}: BookingsSectionProps) {
  // Sort bookings: Pending first, then by date descending
  const sortedBookings = [...bookingRequests].sort((a, b) => {
    const statusA = a.status?.toUpperCase() || "PENDING";
    const statusB = b.status?.toUpperCase() || "PENDING";

    if (statusA === "PENDING" && statusB !== "PENDING") return -1;
    if (statusA !== "PENDING" && statusB === "PENDING") return 1;

    // Safety check for dates
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });

  console.log(sortedBookings);

  if (!bookingRequests || bookingRequests.length === 0) {
    return (
      <Card className="text-center py-12">
        <div className="flex flex-col items-center justify-center text-muted-foreground">
          <CalendarDays className="h-12 w-12 mb-4 opacity-20" />
          <h3 className="text-lg font-medium">Нет заявок</h3>
          <p>У вас пока нет запросов на бронирование.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          История бронирований
          <span className="ml-auto text-sm font-normal text-muted-foreground">
            Всего: {bookingRequests.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[600px] px-6">
          <div className="space-y-6 pb-6">
            {sortedBookings.map((booking, index) => (
              <div key={booking.id}>
                <div className="flex flex-col md:flex-row gap-4 md:items-start justify-between">
                  {/* Left: Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays className="h-4 w-4" />
                      <span className="font-medium text-foreground">
                        {booking.date
                          ? format(
                              new Date(booking.date),
                              "d MMMM yyyy (EEEE)",
                              { locale: ru },
                            )
                          : "Дата не указана"}
                      </span>
                      {booking.date && (
                        <>
                          <span>&bull;</span>
                          <span>{format(new Date(booking.date), "HH:mm")}</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">
                        {booking.customerName || "Заказчик"}
                      </span>
                    </div>

                    {booking.details && (
                      <div className="flex gap-2 text-sm bg-muted/30 p-3 rounded-md mt-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <p className="italic text-muted-foreground">
                          "{booking.details}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right: Status & Actions */}
                  <div className="flex flex-col items-end gap-3 min-w-[140px]">
                    {getStatusBadge(booking.status)}

                    {/* Action Buttons only for Pending */}
                    {booking.status === "PENDING" && (
                      <div className="flex gap-2 mt-1">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 h-8"
                          onClick={() => onBookingAction(booking.id, "accept")}
                        >
                          <Check className="h-4 w-4 mr-1" /> Принять
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-8"
                          onClick={() => onBookingAction(booking.id, "reject")}
                        >
                          <X className="h-4 w-4 mr-1" /> Откл.
                        </Button>
                      </div>
                    )}

                    {/* Price hint if available */}
                    {booking.price && (
                      <span className="text-sm font-medium">
                        {booking.price.toLocaleString()} ₽
                      </span>
                    )}
                  </div>
                </div>

                {index < sortedBookings.length - 1 && (
                  <Separator className="my-6" />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
