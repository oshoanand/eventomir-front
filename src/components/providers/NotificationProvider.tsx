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
import { useSocket } from "@/components/providers/socket-provider";
import {
  NotificationContextType,
  NotificationItem,
  TokenPayload,
  JobPayload,
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

      // --- A. Handle "TOKEN" type ---
      if (type === "TOKEN") {
        const item: TokenPayload = { ...data, type: "TOKEN" };
        setNotifications((prev) => [item, ...prev]);
        setUnreadCount((prev) => prev + 1);
        playNotificationSound();

        toast({
          title: "New Token Generated 🎟️",
          description: `Token: ${data.tokenCode}`,
          variant: "success",
          duration: 8000,
          action: {
            label: "View",
            onClick: () => router.push("/tokens"),
          },
        });
      }

      // --- B. Handle "JOB" type ---
      else if (type === "JOB") {
        const item: JobPayload = { ...data, type: "JOB" };
        setNotifications((prev) => [item, ...prev]);
        setUnreadCount((prev) => prev + 1);
        playNotificationSound();

        toast({
          title: "New Job Posted 🚛",
          description: `${data.location} | ${data.cost}₽`,
          variant: "default",
          duration: 8000,
          action: {
            label: "Jobs",
            onClick: () => router.push("/jobs"),
          },
        });
      }

      // --- C. Handle "CHAT_MESSAGE" type ---
      else if (type === "CHAT_MESSAGE") {
        const chatItem: NotificationItem = {
          id: payload.id || Date.now().toString(),
          type: "CHAT_MESSAGE",
          message: payload.message || `Новое сообщение от ${data?.senderName}`,
          isRead: false,
          createdAt: new Date().toISOString(),
          data: {
            chatId: data?.chatId,
            senderName: data?.senderName,
            preview: data?.preview,
          },
        };

        // 🚨 FIX: We add it to the dropdown list, but we DO NOT increment `unreadCount`
        // Chat messages use their own DB count! We also don't play sound here.
        setNotifications((prev) => [chatItem, ...prev]);
      }

      // --- D. Handle Generic/System types ---
      else {
        setNotifications((prev) => [
          { ...payload, id: Date.now().toString() },
          ...prev,
        ]);
        setUnreadCount((prev) => prev + 1);
        playNotificationSound();

        toast({
          title: payload.message || "Уведомление",
          description: "Новое сообщение от системы",
        });
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
