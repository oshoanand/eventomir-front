"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useSocket } from "@/components/providers/SocketProvider";
import { apiRequest } from "@/utils/api-client";
import {
  NotificationContextType,
  NotificationItem,
} from "@/types/notification";

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const { socket } = useSocket();
  const { toast } = useToast();
  const router = useRouter();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // --- Audio Helper ---
  const playNotificationSound = useCallback(() => {
    try {
      const audio = new Audio("/sounds/notification.wav");
      audio.play().catch((e) => console.log("Audio play blocked", e));
    } catch (error) {
      console.error("Audio error:", error);
    }
  }, []);

  // --- 1. Fetch Initial Notification History from Database ---
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await apiRequest<NotificationItem[]>({
          method: "GET",
          url: "/api/notifications",
        });

        if (Array.isArray(data)) {
          setNotifications(data);
          setUnreadCount(data.filter((n) => !n.isRead).length);
        }
      } catch (error) {
        console.error("Failed to fetch initial notifications:", error);
      }
    };

    fetchNotifications();
  }, []); // Runs once on mount

  // --- 2. Real-Time Socket Listeners ---
  useEffect(() => {
    if (!socket) return;

    const handleNotification = (payload: any) => {
      console.log("🔔 Received Notification:", payload);

      const type = payload.type || "SYSTEM";
      const data = payload.data || {};

      // Extract title safely (from root or nested data)
      const title = payload.title || data.title || "Уведомление";
      const message = payload.message || payload.body || "Новое сообщение";

      // Time Check (Prevents spam on page refresh when socket dumps history)
      const notifTime = payload.createdAt
        ? new Date(payload.createdAt).getTime()
        : Date.now();
      const isOldMessage = Date.now() - notifTime > 10000; // Older than 10 seconds

      // Handle "CHAT_MESSAGE" type
      if (type === "CHAT_MESSAGE") {
        const chatItem: NotificationItem = {
          id: payload.id || crypto.randomUUID(),
          type: "CHAT_MESSAGE",
          message: message || `Новое сообщение от ${data?.senderName}`,
          isRead: false,
          createdAt: payload.createdAt || new Date().toISOString(),
          data: {
            chatId: data?.chatId,
            senderName: data?.senderName,
            preview: data?.preview,
            url: data?.url || `/chat/${data?.chatId}`,
          },
        };

        setNotifications((prev) => [chatItem, ...prev]);
      }
      // Handle Generic/System/Booking types
      else {
        const genericItem: NotificationItem = {
          id: payload.id || crypto.randomUUID(),
          type: type,
          message: message,
          isRead: false,
          createdAt: payload.createdAt || new Date().toISOString(),
          data: data,
        };

        setNotifications((prev) => [genericItem, ...prev]);
        setUnreadCount((prev) => prev + 1);

        // Only play sound and show interactive toast for NEW notifications
        if (!isOldMessage) {
          playNotificationSound();

          // Map booking statuses to visual variants
          let variant: "default" | "success" | "destructive" = "default";
          if (type === "BOOKING_ACCEPTED" || type === "SUCCESS")
            variant = "success";
          if (
            type === "BOOKING_REJECTED" ||
            type === "BOOKING_CANCELLED" ||
            type === "FAILED"
          )
            variant = "destructive";

          toast({
            variant: variant,
            title: title,
            description: message,
            // Deep-link action button for Sonner
            action: data?.url
              ? {
                  label: "Открыть",
                  onClick: () => router.push(data.url),
                }
              : undefined,
          });
        }
      }
    };

    // Map specific message notifications to our generic handler
    const handleSpecificMessage = (payload: any) => {
      handleNotification({
        type: "CHAT_MESSAGE",
        id: crypto.randomUUID(),
        message: `Сообщение от ${payload.senderName}`,
        createdAt: new Date().toISOString(),
        data: {
          chatId: payload.chatId,
          senderName: payload.senderName,
          preview: payload.preview,
        },
      });
    };

    // Attach Listeners
    socket.on("notification", handleNotification);
    socket.on("message_notification", handleSpecificMessage);

    return () => {
      socket.off("notification", handleNotification);
      socket.off("message_notification", handleSpecificMessage);
    };
  }, [socket, toast, router, playNotificationSound]);

  // --- 3. Mark Read Logic (Optimistic UI Updates) ---
  // Note: The actual database PATCH requests are handled inside the NotificationsPage
  // to keep this provider lean, but we update the UI instantly here.

  const markAllAsRead = () => {
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id === id && !n.isRead) {
          // Prevent negative count
          setUnreadCount((c) => Math.max(0, c - 1));
          return { ...n, isRead: true };
        }
        return n;
      }),
    );
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAllAsRead,
        markAsRead,
        socket,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider",
    );
  }
  return context;
};
