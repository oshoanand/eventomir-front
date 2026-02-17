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
  Briefcase,
  Phone,
} from "lucide-react";

interface BookingsSectionProps {
  bookingRequests: BookingRequest[];
  onBookingAction: (requestId: string, action: "accept" | "reject") => void;
  isAgencyView?: boolean; // New prop to enable agency features
}

const getStatusBadge = (status: string) => {
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
  isAgencyView = false,
}: BookingsSectionProps) {
  // Sort bookings: Pending first, then by date descending
  const sortedBookings = [...bookingRequests].sort((a, b) => {
    const statusA = a.status?.toUpperCase() || "PENDING";
    const statusB = b.status?.toUpperCase() || "PENDING";

    if (statusA === "PENDING" && statusB !== "PENDING") return -1;
    if (statusA !== "PENDING" && statusB === "PENDING") return 1;

    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });

  if (!bookingRequests || bookingRequests.length === 0) {
    return (
      <div className="text-center py-12 border rounded-md bg-slate-50 border-dashed">
        <div className="flex flex-col items-center justify-center text-muted-foreground">
          <CalendarDays className="h-12 w-12 mb-4 opacity-20" />
          <h3 className="text-lg font-medium">Нет заявок</h3>
          <p>
            {isAgencyView
              ? "У ваших специалистов пока нет запросов."
              : "У вас пока нет запросов на бронирование."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Card className="h-full border-none shadow-none">
      <CardContent className="p-0">
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-6">
            {sortedBookings.map((booking, index) => (
              <div key={booking.id} className="group">
                <div className="flex flex-col md:flex-row gap-4 md:items-start justify-between">
                  {/* Left: Info */}
                  <div className="space-y-3 flex-1">
                    {/* AGENCY VIEW: Show which Specialist is being booked */}
                    {isAgencyView && booking.performerName && (
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="secondary"
                          className="font-normal bg-purple-100 text-purple-700 hover:bg-purple-200"
                        >
                          <Briefcase className="h-3 w-3 mr-1" />
                          Специалист:{" "}
                          <span className="font-semibold ml-1">
                            {booking.performerName}
                          </span>
                        </Badge>
                      </div>
                    )}

                    {/* Date & Time */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarDays className="h-4 w-4 text-primary" />
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
                          <span className="text-muted-foreground/40">|</span>
                          <span className="text-foreground">
                            {format(new Date(booking.date), "HH:mm")}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Customer Info */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">
                          {booking.customerName || "Заказчик"}
                        </span>
                      </div>
                      {/* Show Phone for Agencies */}
                      {booking.customerPhone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground ml-6">
                          <Phone className="h-3 w-3" />
                          <span>{booking.customerPhone}</span>
                        </div>
                      )}
                    </div>

                    {/* Details Message */}
                    {booking.details && (
                      <div className="flex gap-2 text-sm bg-muted/40 p-3 rounded-md border border-l-2 border-l-primary/50">
                        <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                        <p className="italic text-muted-foreground break-words max-w-md">
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
                      <div className="flex flex-col sm:flex-row gap-2 mt-2 w-full sm:w-auto">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 h-8 w-full sm:w-auto"
                          onClick={() => onBookingAction(booking.id, "accept")}
                        >
                          <Check className="h-4 w-4 mr-1" /> Принять
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-8 w-full sm:w-auto bg-red-100 text-red-700 hover:bg-red-200 border-red-200"
                          onClick={() => onBookingAction(booking.id, "reject")}
                        >
                          <X className="h-4 w-4 mr-1" /> Откл.
                        </Button>
                      </div>
                    )}

                    {/* Price hint if available */}
                    {booking.price && (
                      <span className="text-sm font-medium mt-1">
                        ~ {booking.price.toLocaleString()} ₽
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
