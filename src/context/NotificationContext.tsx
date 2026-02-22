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
import { useSocket } from "@/components/providers/socket-provider"; // Ensure this path is correct
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
  // 1. Consume the shared socket from the Provider
  const { socket } = useSocket();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const { toast } = useToast();
  const router = useRouter();

  // Helper function to play sound
  const playNotificationSound = useCallback(() => {
    try {
      const audio = new Audio("/sounds/notification.wav");
      audio.play().catch((e) => console.log("Audio play blocked", e));
    } catch (error) {
      console.error("Audio error:", error);
    }
  }, []);

  useEffect(() => {
    // 2. Guard: Wait until the socket is initialized and connected
    if (!socket) return;

    // 3. Define the Main Event Listener
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
      // This handles messages if they come through the generic 'notification' channel
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

        setNotifications((prev) => [chatItem, ...prev]);
        setUnreadCount((prev) => prev + 1);
        // Note: We don't play sound here to avoid double sound with ClientNotificationProvider
      }

      // --- D. Handle Generic/System types ---
      else {
        setNotifications((prev) => [
          { ...payload, id: Date.now().toString() },
          ...prev,
        ]);
        setUnreadCount((prev) => prev + 1);
        toast({
          title: payload.message || "Уведомление",
          description: "Новое сообщение от системы",
        });
      }
    };

    // 4. Attach Listeners

    // Listener 1: Generic 'notification' channel (System, Jobs, Tokens)
    socket.on("notification", handleNotification);

    // Listener 2: Specific 'message_notification' channel (Chat)
    // We map this specific event to our generic handler so it shows up in the list
    socket.on("message_notification", (payload) => {
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
    });

    // 5. Cleanup
    return () => {
      socket.off("notification", handleNotification);
      socket.off("message_notification");
    };
  }, [socket, toast, router, playNotificationSound]);

  const markAllAsRead = () => {
    setUnreadCount(0);
    // Optional: Update all local items to read
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id === id && !n.isRead) {
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
        markAsRead, // Exported so individual items can be clicked
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
