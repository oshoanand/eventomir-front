"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useNotification } from "@/context/NotificationContext";
import { acceptBookingRequest, rejectBookingRequest } from "@/services/booking";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { cn } from "@/utils/utils";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import {
  Bell,
  CheckCheck,
  Briefcase,
  Star,
  UserCheck,
  XCircle,
  CalendarCheck,
  DollarSign,
  Info,
  Check,
  X,
  Loader2,
} from "lucide-react";

// --- Helper: Get Icon by Notification Type ---
const getNotificationIcon = (type?: string) => {
  const safeType = type?.toLowerCase() || "info";

  if (safeType.includes("booking"))
    return <CalendarCheck className="h-5 w-5 text-blue-500" />;
  if (safeType.includes("request"))
    return <Briefcase className="h-5 w-5 text-purple-500" />;
  if (safeType.includes("review"))
    return <Star className="h-5 w-5 text-yellow-500" />;
  if (safeType.includes("profile"))
    return <UserCheck className="h-5 w-5 text-orange-500" />;
  if (safeType.includes("payment") || safeType.includes("subscription"))
    return <DollarSign className="h-5 w-5 text-green-500" />;
  if (safeType.includes("error") || safeType.includes("reject"))
    return <XCircle className="h-5 w-5 text-red-500" />;
  if (safeType.includes("success") || safeType.includes("accept"))
    return <CheckCheck className="h-5 w-5 text-green-500" />;

  return <Bell className="h-5 w-5 text-gray-400" />;
};

const NotificationsPage = () => {
  const { data: session } = useSession();
  const { notifications, markAsRead, markAllAsRead, unreadCount } =
    useNotification();
  const { toast } = useToast();

  // --- Local State for Actions ---
  // Tracks which specific booking ID is currently submitting (for spinner)
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  // Tracks which bookings have been acted upon in this session (to hide buttons immediately)
  const [actionedIds, setActionedIds] = useState<Set<string>>(new Set());

  // --- Handlers ---

  const handleBookingAction = async (
    notificationId: string,
    bookingId: string,
    action: "accept" | "reject",
  ) => {
    if (!session?.user?.id) return;

    // 1. Set Loading State
    setProcessingIds((prev) => new Set(prev).add(bookingId));

    try {
      if (action === "accept") {
        await acceptBookingRequest(bookingId, session.user.id);
        toast({
          title: "Заказ принят",
          description: "Клиент получил уведомление о подтверждении.",
        });
      } else {
        await rejectBookingRequest(bookingId, session.user.id);
        toast({
          title: "Заказ отклонен",
          description: "Клиент уведомлен об отказе.",
        });
      }

      // 2. Mark notification as read automatically since we acted on it
      await markAsRead(notificationId);

      // 3. Mark locally as "done" so buttons disappear
      setActionedIds((prev) => new Set(prev).add(bookingId));
    } catch (error) {
      console.error("Booking action failed", error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось обновить статус бронирования.",
      });
    } finally {
      // 4. Remove Loading State
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(bookingId);
        return next;
      });
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast({ title: "Все уведомления прочитаны" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось выполнить действие.",
      });
    }
  };

  // --- Render ---

  return (
    <div className="container mx-auto py-10 max-w-3xl">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row justify-between items-center bg-muted/20 pb-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" /> Уведомления
              {unreadCount > 0 && (
                <span className="bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </CardTitle>
            <CardDescription>
              История событий и запросы на бронирование.
            </CardDescription>
          </div>

          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Прочитать все
            </Button>
          )}
        </CardHeader>

        <CardContent className="p-0">
          <ScrollArea className="h-[70vh]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Info className="h-12 w-12 mb-4 opacity-20" />
                <p>У вас пока нет уведомлений.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notification) => {
                  // --- Logic to determine if we show Action Buttons ---
                  const bookingId = notification.data?.bookingId;
                  const isBookingRequest =
                    notification.type === "BOOKING_REQUEST" && !!bookingId;

                  // Check loading/actioned states
                  const isProcessing =
                    !!bookingId && processingIds.has(bookingId);
                  const isActioned = !!bookingId && actionedIds.has(bookingId);

                  // Check if the notification implies the action is already done (e.g. historical notification)
                  // Assuming backend might send status in data, e.g. { status: 'CONFIRMED' }
                  const isAlreadyProcessedDB =
                    notification.data?.status &&
                    notification.data.status !== "PENDING";

                  const showActions =
                    isBookingRequest && !isActioned && !isAlreadyProcessedDB;

                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        "flex items-start space-x-4 p-4 transition-all duration-200 hover:bg-muted/40",
                        !notification.isRead
                          ? "bg-blue-50/50 dark:bg-blue-900/10 border-l-4 border-l-blue-500"
                          : "opacity-80",
                      )}
                      // Clicking the container marks it as read
                      onClick={() =>
                        !notification.isRead &&
                        handleMarkAsRead(notification.id)
                      }
                    >
                      {/* Icon */}
                      <div className="mt-1 flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-start">
                          <p
                            className={cn(
                              "text-sm",
                              !notification.isRead
                                ? "font-semibold text-foreground"
                                : "text-muted-foreground",
                            )}
                          >
                            {notification.message}
                          </p>

                          <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                            {formatDistanceToNow(
                              new Date(notification.createdAt),
                              {
                                addSuffix: true,
                                locale: ru,
                              },
                            )}
                          </span>
                        </div>

                        {/* --- ACTION BUTTONS (Only for Pending Bookings) --- */}
                        {showActions && (
                          <div
                            className="flex gap-3 pt-2"
                            onClick={(e) => e.stopPropagation()} // Prevent triggering parent click (mark as read)
                          >
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 h-8 text-xs px-3"
                              onClick={() =>
                                handleBookingAction(
                                  notification.id,
                                  bookingId,
                                  "accept",
                                )
                              }
                              disabled={isProcessing}
                            >
                              {isProcessing ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : (
                                <Check className="h-3 w-3 mr-1" />
                              )}
                              Принять
                            </Button>

                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-8 text-xs px-3"
                              onClick={() =>
                                handleBookingAction(
                                  notification.id,
                                  bookingId,
                                  "reject",
                                )
                              }
                              disabled={isProcessing}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Отклонить
                            </Button>

                            {/* Deep link to full booking details */}
                            <Link
                              href={`/performer-profile?tab=bookings`}
                              className="ml-auto"
                            >
                              <Button
                                variant="link"
                                size="sm"
                                className="h-8 text-xs text-muted-foreground"
                              >
                                Подробнее &rarr;
                              </Button>
                            </Link>
                          </div>
                        )}

                        {/* Status Feedback if actioned */}
                        {(isActioned || isAlreadyProcessedDB) &&
                          isBookingRequest && (
                            <p className="text-xs text-muted-foreground font-medium italic pt-1 flex items-center gap-1">
                              <CheckCheck className="h-3 w-3" /> Статус обновлен
                            </p>
                          )}

                        {/* "New" Indicator Dot */}
                        {!notification.isRead && !showActions && (
                          <div className="flex items-center gap-2 pt-1">
                            <span className="inline-block h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-xs text-blue-500 font-medium">
                              Новое
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsPage;
