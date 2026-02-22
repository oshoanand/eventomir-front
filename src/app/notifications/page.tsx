"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useNotification } from "@/context/NotificationContext";
// Import ChatDialog components to open chat from here
import ChatDialog from "@/components/ChatDialog";
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
  MessageCircle, // Import icon
} from "lucide-react";

// --- Helper: Get Icon by Notification Type ---
const getNotificationIcon = (type?: string) => {
  const safeType = type?.toLowerCase() || "info";

  if (safeType.includes("booking"))
    return <CalendarCheck className="h-5 w-5 text-blue-500" />;
  if (safeType.includes("chat") || safeType.includes("message"))
    return <MessageCircle className="h-5 w-5 text-emerald-500" />; // New Icon
  // ... existing icons ...
  if (safeType.includes("request"))
    return <Briefcase className="h-5 w-5 text-purple-500" />;
  if (safeType.includes("review"))
    return <Star className="h-5 w-5 text-yellow-500" />;
  if (safeType.includes("profile"))
    return <UserCheck className="h-5 w-5 text-orange-500" />;
  if (safeType.includes("payment"))
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
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [actionedIds, setActionedIds] = useState<Set<string>>(new Set());

  // --- New: Chat Dialog State ---
  const [chatState, setChatState] = useState({
    isOpen: false,
    chatId: "",
    partnerName: "",
  });
  const handleBookingAction = async (
    notificationId: string,
    bookingId: string,
    action: "accept" | "reject",
  ) => {
    // 1. Security Check: Ensure user is logged in
    if (!session?.user?.id) return;

    // 2. Set Loading State (Shows spinner on the specific button)
    setProcessingIds((prev) => new Set(prev).add(bookingId));

    try {
      // 3. Call the API based on action type
      if (action === "accept") {
        await acceptBookingRequest(bookingId, session.user.id);
        toast({
          title: "Заказ принят ✅",
          description: "Клиент получил уведомление о подтверждении.",
          className: "bg-green-50 border-green-200 text-green-900",
        });
      } else {
        await rejectBookingRequest(bookingId, session.user.id);
        toast({
          title: "Заказ отклонен",
          description: "Клиент уведомлен об отказе.",
        });
      }

      // 4. Mark the notification as read automatically
      // We do this because acting on the request essentially "reads" it.
      await markAsRead(notificationId);

      // 5. Update Local State to hide buttons
      // This adds the ID to a set that hides the buttons and shows "Status updated" text
      setActionedIds((prev) => new Set(prev).add(bookingId));
    } catch (error) {
      console.error("Booking action failed", error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description:
          "Не удалось обновить статус бронирования. Попробуйте позже.",
      });
    } finally {
      // 6. Cleanup: Remove the loading state regardless of success/error
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
      // 1. Call Context Method
      // This updates the global state (sets unreadCount to 0 and marks all items as read)
      await markAllAsRead();

      // 2. Show Success Feedback
      toast({
        title: "Все прочитано ✅",
        description: "Все уведомления отмечены как прочитанные.",
        // Optional: Custom styling for a cleaner look
        className: "bg-background border-border",
      });
    } catch (error) {
      console.error("Failed to mark all as read:", error);

      // 3. Error Handling
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось обновить статус уведомлений.",
      });
    }
  };

  const handleOpenChat = (notification: any) => {
    if (notification.data?.chatId) {
      setChatState({
        isOpen: true,
        chatId: notification.data.chatId,
        partnerName: notification.data.senderName || "User",
      });
      handleMarkAsRead(notification.id); // Mark as read when opening
    }
  };

  // --- Render ---

  return (
    <>
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
              <CardDescription>История событий и сообщения.</CardDescription>
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
                    // --- Logic for Actions ---
                    const bookingId = notification.data?.bookingId;
                    const isBookingRequest =
                      notification.type === "BOOKING_REQUEST" && !!bookingId;
                    const isChatMessage = notification.type === "CHAT_MESSAGE"; // New Check

                    // ... (Keep existing loading/actioned logic) ...
                    const isProcessing =
                      !!bookingId && processingIds.has(bookingId);
                    const isActioned =
                      !!bookingId && actionedIds.has(bookingId);
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
                        onClick={() =>
                          !notification.isRead &&
                          handleMarkAsRead(notification.id.toString())
                        }
                      >
                        {/* Icon */}
                        <div className="mt-1 flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col">
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
                              {/* Show preview for chats */}
                              {isChatMessage && notification.data?.preview && (
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 italic">
                                  "{notification.data.preview}"
                                </p>
                              )}
                            </div>

                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                              {formatDistanceToNow(
                                new Date(notification.createdAt),
                                { addSuffix: true, locale: ru },
                              )}
                            </span>
                          </div>

                          {/* --- CHAT ACTION --- */}
                          {isChatMessage && (
                            <div className="pt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs gap-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenChat(notification);
                                }}
                              >
                                <MessageCircle className="h-3 w-3" />
                                Ответить
                              </Button>
                            </div>
                          )}

                          {/* --- BOOKING ACTIONS (Keep existing) --- */}
                          {showActions && (
                            <div
                              className="flex gap-3 pt-2"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 h-8 text-xs px-3"
                                onClick={() =>
                                  handleBookingAction(
                                    notification.id.toString(),
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
                                    notification.id.toString(),
                                    bookingId,
                                    "reject",
                                  )
                                }
                                disabled={isProcessing}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Отклонить
                              </Button>
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

                          {/* Status Feedback */}
                          {(isActioned || isAlreadyProcessedDB) &&
                            isBookingRequest && (
                              <p className="text-xs text-muted-foreground font-medium italic pt-1 flex items-center gap-1">
                                <CheckCheck className="h-3 w-3" /> Статус
                                обновлен
                              </p>
                            )}

                          {/* New Indicator */}
                          {!notification.isRead &&
                            !showActions &&
                            !isChatMessage && (
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

      {/* Render Chat Dialog locally for this page */}
      {chatState.isOpen && session?.user?.id && (
        <ChatDialog
          isOpen={chatState.isOpen}
          onClose={() => setChatState((prev) => ({ ...prev, isOpen: false }))}
          chatId={chatState.chatId}
          performerName={chatState.partnerName}
          currentUserId={session.user.id}
        />
      )}
    </>
  );
};

export default NotificationsPage;
