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

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (payload: any) => {
      console.log("🔔 Received Notification:", payload);

      const { type, data } = payload;

      // 🚨 1. Time Check (Prevents spam on page refresh when socket dumps history)
      const notifTime = payload.createdAt
        ? new Date(payload.createdAt).getTime()
        : Date.now();
      const isOldMessage = Date.now() - notifTime > 10000; // Older than 10 seconds

      // Handle "CHAT_MESSAGE" type ---
      if (type === "CHAT_MESSAGE") {
        const chatItem: NotificationItem = {
          id: payload.id || Date.now().toString(),
          type: "CHAT_MESSAGE",
          message: payload.message || `Новое сообщение от ${data?.senderName}`,
          isRead: false,
          createdAt: payload.createdAt || new Date().toISOString(),
          data: {
            chatId: data?.chatId,
            senderName: data?.senderName,
            preview: data?.preview,
            url: data?.url || `/chat/${data?.chatId}`, // Ensure easy deep linking
          },
        };

        // We add it to the dropdown list, but we DO NOT increment `unreadCount`
        // Chat messages use their own DB count! We also don't play sound here.
        setNotifications((prev) => [chatItem, ...prev]);
      }

      // Handle Generic/System types ---
      else {
        // 🚨 2. Safely map to the NotificationItem interface
        const genericItem: NotificationItem = {
          id: payload.id || Date.now().toString(),
          type: type || "SYSTEM",
          message: payload.message || payload.body || "Системное уведомление",
          isRead: false,
          createdAt: payload.createdAt || new Date().toISOString(),
          data: data || {},
        };

        setNotifications((prev) => [genericItem, ...prev]);
        setUnreadCount((prev) => prev + 1);

        // 🚨 3. Only play sound and show toast if it's a NEW notification
        if (!isOldMessage) {
          playNotificationSound();
          toast({
            variant: "success",
            title: payload.title || "Уведомление",
            description:
              payload.message || payload.body || "Новое сообщение от системы",
          });
        }
      }
    };

    // Attach Listeners
    socket.on("notification", handleNotification);

    // Map specific message notifications to our generic handler
    const handleSpecificMessage = (payload: any) => {
      handleNotification({
        type: "CHAT_MESSAGE",
        id: Date.now().toString(),
        message: `Сообщение от ${payload.senderName}`,
        createdAt: new Date().toISOString(),
        data: {
          chatId: payload.chatId,
          senderName: payload.senderName,
          preview: payload.preview,
        },
      });
    };

    socket.on("message_notification", handleSpecificMessage);

    return () => {
      socket.off("notification", handleNotification);
      socket.off("message_notification", handleSpecificMessage);
    };
  }, [socket, toast, router, playNotificationSound]);

  // --- Mark Read Logic ---
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
