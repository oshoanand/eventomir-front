// "use client";

// import React, {
//   createContext,
//   useContext,
//   useEffect,
//   useState,
//   ReactNode,
// } from "react";
// import { io, Socket } from "socket.io-client";
// import { useRouter } from "next/navigation";
// import { useToast } from "@/hooks/use-toast";
// // Import the new types
// import {
//   NotificationContextType,
//   NotificationItem,
//   BookingPayload,
// } from "@/types/notification";

// const NotificationContext = createContext<NotificationContextType | undefined>(
//   undefined,
// );

// const SOCKET_URL =
//   process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8800";

// interface NotificationProviderProps {
//   children: ReactNode;
// }

// export const NotificationProvider: React.FC<NotificationProviderProps> = ({
//   children,
// }) => {
//   const [socket, setSocket] = useState<Socket | null>(null);
//   // Update state type to accept both Jobs and Tokens
//   const [notifications, setNotifications] = useState<NotificationItem[]>([]);
//   const [unreadCount, setUnreadCount] = useState<number>(0);

//   const { toast } = useToast();
//   const router = useRouter();

//   // Helper function to play sound
//   const playNotificationSound = () => {
//     try {
//       const audio = new Audio("/sounds/notification.wav");
//       audio.play().catch((e) => console.log("Audio play blocked", e));
//     } catch (error) {
//       console.error("Audio error:", error);
//     }
//   };

//   useEffect(() => {
//     const newSocket: Socket = io(SOCKET_URL, {
//       transports: ["websocket"],
//     });

//     setSocket(newSocket);

//     newSocket.on("connect", () => {
//       console.log("✅ Admin Panel: Connected to Live Server");
//     });

//     // --- 1. LISTENER: NEW TOKEN ---
//     newSocket.on("notification", (payload: BookingPayload) => {
//       console.log("🔔 New Token:", payload);

//       // Ensure type is set
//       const item: BookingPayload = { ...payload, type: "BOOKING" };

//       setNotifications((prev) => [item, ...prev]);
//       setUnreadCount((prev) => prev + 1);
//       playNotificationSound();

//       toast({
//         title: payload.status,
//         description: payload.description,
//         variant: "success",
//         duration: 8000,
//         action: {
//           label: "View",
//           onClick: () => router.push("/notification"),
//         },
//       });
//     });

//     return () => {
//       newSocket.disconnect();
//     };
//   }, [toast, router]);

//   const markAllAsRead = () => {
//     setUnreadCount(0);
//   };

//   return (
//     <NotificationContext.Provider
//       value={{
//         notifications,
//         unreadCount,
//         markAllAsRead,
//         socket,
//       }}
//     >
//       {children}
//     </NotificationContext.Provider>
//   );
// };

// export const useNotification = (): NotificationContextType => {
//   const context = useContext(NotificationContext);
//   if (!context) {
//     throw new Error(
//       "useNotification must be used within a NotificationProvider",
//     );
//   }
//   return context;
// };

"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/services/notifications";

// Define strict types here or import from your types file
export interface NotificationItem {
  id: string;
  type: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  markAllAsRead: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  socket: Socket | null;
  isConnected: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

const SOCKET_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8800";

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { data: session, status } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const { toast } = useToast();
  const router = useRouter();

  const userId = session?.user?.id;
  const isAuthenticated = status === "authenticated";

  // 1. Fetch Initial Notifications via API
  useEffect(() => {
    if (isAuthenticated && userId) {
      const fetchInitialData = async () => {
        try {
          const data = await getNotifications(userId);
          setNotifications(data);
          setUnreadCount(data.filter((n) => !n.isRead).length);
        } catch (error) {
          console.error("Failed to load notifications:", error);
        }
      };
      fetchInitialData();
    } else {
      // Reset if logged out
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, userId]);

  // 2. Initialize Socket Connection
  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    // Initialize Socket
    const newSocket: Socket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(newSocket);

    // Socket Event Listeners
    newSocket.on("connect", () => {
      console.log("✅ Socket Connected:", newSocket.id);
      setIsConnected(true);

      // CRITICAL: Join the user's specific room
      newSocket.emit("join_room", userId);
    });

    newSocket.on("disconnect", () => {
      console.log("❌ Socket Disconnected");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket Connection Error:", err.message);
    });

    // Handle Incoming Notification
    newSocket.on("notification", (payload: any) => {
      console.log("🔔 Real-time Notification:", payload);

      // Create a normalized notification object
      // (Ensure backend payload matches NotificationItem structure or map it here)
      const newNotification: NotificationItem = {
        id: payload.data?.bookingId || Date.now().toString(), // Fallback ID
        type: payload.type || "SYSTEM",
        message: payload.message,
        data: payload.data,
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Play Sound
      try {
        const audio = new Audio("/sounds/notification.wav");
        audio.play().catch(() => {}); // Ignore autoplay errors
      } catch (e) {}

      // Show Toast
      toast({
        title: "Новое уведомление",
        description: payload.message,
        duration: 5000,
        action: (
          <div
            className="cursor-pointer font-bold text-sm"
            onClick={() => router.push("/notifications")}
          >
            Просмотр
          </div>
        ) as any, // Cast to avoid strict type issues with toast action
      });
    });

    // Cleanup on unmount or user change
    return () => {
      newSocket.off("connect");
      newSocket.off("disconnect");
      newSocket.off("notification");
      newSocket.disconnect();
    };
  }, [isAuthenticated, userId, toast, router]);

  const markAsRead = async (id: string) => {
    // Optimistic Update: Update UI immediately
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    // Update unread count
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      // Sync with Server
      await markNotificationAsRead(id);
    } catch (error) {
      console.error("Failed to mark as read on server");
    }
  };

  // 3. Helper Actions
  const markAllAsRead = useCallback(async () => {
    // Optimistic Update
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

    try {
      await markAllNotificationsAsRead();
    } catch (error) {
      console.error("Failed to mark read on server");
      // Revert on error if critical, or just silently fail
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAllAsRead,
        markAsRead,
        socket,
        isConnected,
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
