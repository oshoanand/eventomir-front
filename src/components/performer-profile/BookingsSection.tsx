"use client";

import { BookingRequest } from "@/services/booking";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  Check,
  X,
  User,
  MessageSquare,
  CalendarDays,
  Briefcase,
  Phone,
} from "lucide-react";

interface BookingsSectionProps {
  bookingRequests: BookingRequest[];
  onBookingAction: (requestId: string, action: "accept" | "reject") => void;
  isAgencyView?: boolean; // Enable agency features
}

// 🚨 FIX: Updated to support the new detailed backend Escrow/Booking statuses
const getStatusBadge = (status: string) => {
  const s = status?.toUpperCase() || "PENDING";

  switch (s) {
    case "CONFIRMED":
    case "COMPLETED":
    case "PAID":
      return (
        <Badge className="bg-green-600 hover:bg-green-700 shadow-sm">
          Подтверждено
        </Badge>
      );
    case "PENDING_CUSTOMER_PAYMENT":
      return (
        <Badge className="bg-blue-600 hover:bg-blue-700 shadow-sm">
          Ожидает оплаты
        </Badge>
      );
    case "REJECTED":
    case "REJECTED_BY_PERFORMER":
      return <Badge variant="destructive">Отклонено вами</Badge>;
    case "CANCELLED_BY_CUSTOMER":
      return <Badge variant="secondary">Отменено клиентом</Badge>;
    case "PENDING_PERFORMER_APPROVAL":
    case "PENDING":
    default:
      return (
        <Badge
          variant="outline"
          className="text-amber-600 border-amber-500 bg-amber-50"
        >
          Новая заявка
        </Badge>
      );
  }
};

export default function BookingsSection({
  bookingRequests,
  onBookingAction,
  isAgencyView = false,
}: BookingsSectionProps) {
  // 🚨 FIX: Sort bookings using the updated status names
  const sortedBookings = [...bookingRequests].sort((a, b) => {
    const isPendingA = a.status === "PENDING_PERFORMER_APPROVAL";
    const isPendingB = b.status === "PENDING_PERFORMER_APPROVAL";

    if (isPendingA && !isPendingB) return -1;
    if (!isPendingA && isPendingB) return 1;

    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });

  if (!bookingRequests || bookingRequests.length === 0) {
    return (
      <div className="text-center py-12 border rounded-xl bg-slate-50/50 border-dashed">
        <div className="flex flex-col items-center justify-center text-muted-foreground">
          <CalendarDays className="h-12 w-12 mb-4 opacity-20" />
          <h3 className="text-lg font-medium text-foreground">Нет заявок</h3>
          <p className="text-sm mt-1">
            {isAgencyView
              ? "У ваших специалистов пока нет запросов."
              : "У вас пока нет запросов на бронирование."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Card className="h-full border-none shadow-none bg-transparent">
      <CardContent className="p-0">
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-6">
            {sortedBookings.map((booking, index) => {
              // 🚨 FIX: Safely fallback to nested user data depending on how the backend mapped it
              const customerName =
                booking.customer?.name || booking.customer?.name || "Заказчик";
              const customerPhone =
                booking.customer?.phone || booking.customer?.phone;
              const performerName = booking.performer?.user?.name;

              // 🚨 FIX: Support the backend's `agreedFee` field
              const displayPrice =
                (booking as any).agreedFee || booking.agreedFee;

              const isActionable =
                booking.status === "PENDING_PERFORMER_APPROVAL";

              return (
                <div key={booking.id} className="group">
                  <div className="flex flex-col md:flex-row gap-4 md:items-start justify-between">
                    {/* Left: Info */}
                    <div className="space-y-3 flex-1">
                      {/* AGENCY VIEW: Show which Specialist is being booked */}
                      {isAgencyView && booking.performer && (
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant="secondary"
                            className="font-normal bg-purple-100 text-purple-700 hover:bg-purple-200"
                          >
                            <Briefcase className="h-3 w-3 mr-1.5" />
                            Специалист:
                            <span className="font-bold ml-1">
                              {performerName}
                            </span>
                          </Badge>
                        </div>
                      )}

                      {/* Date & Time */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarDays className="h-4 w-4 text-primary" />
                        <span className="font-bold text-foreground text-base">
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
                            <span className="text-border mx-1">|</span>
                            <span className="text-foreground font-medium">
                              {format(new Date(booking.date), "HH:mm")}
                            </span>
                          </>
                        )}
                      </div>

                      {/* Customer Info */}
                      <div className="flex flex-col gap-1.5 bg-muted/30 p-3 rounded-lg border border-border/50">
                        <div className="flex items-center gap-2 text-foreground">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">{customerName}</span>
                        </div>
                        {customerPhone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground ml-6">
                            <Phone className="h-3.5 w-3.5" />
                            <span>{customerPhone}</span>
                          </div>
                        )}
                      </div>

                      {/* Details Message */}
                      {booking.details && (
                        <div className="flex gap-2.5 text-sm bg-primary/5 p-3.5 rounded-lg border-l-2 border-l-primary mt-2">
                          <MessageSquare className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <p className="italic text-foreground/80 break-words max-w-md">
                            "{booking.details}"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Right: Status & Actions */}
                    <div className="flex flex-col items-end gap-3 min-w-[150px]">
                      {getStatusBadge(booking.status)}

                      {/* Action Buttons only for Pending Approval */}
                      {isActionable && (
                        <div className="flex flex-col sm:flex-row gap-2 mt-2 w-full sm:w-auto">
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 h-9 w-full sm:w-auto rounded-lg shadow-sm"
                            onClick={() =>
                              onBookingAction(booking.id, "accept")
                            }
                          >
                            <Check className="h-4 w-4 mr-1.5" /> Принять
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-9 w-full sm:w-auto bg-red-100 text-red-700 hover:bg-red-200 border border-red-200 rounded-lg shadow-none"
                            onClick={() =>
                              onBookingAction(booking.id, "reject")
                            }
                          >
                            <X className="h-4 w-4 mr-1.5" /> Откл.
                          </Button>
                        </div>
                      )}

                      {/* Price hint if available */}
                      {displayPrice ? (
                        <span className="text-lg font-black tracking-tight mt-1 text-foreground">
                          {displayPrice.toLocaleString()} ₽
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {index < sortedBookings.length - 1 && (
                    <Separator className="my-6 bg-border/60" />
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
