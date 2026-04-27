import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { apiRequest } from "@/utils/api-client";

interface ChatState {
  socket: Socket | null;
  totalUnreadCount: number;
  // Use Record for O(1) fast lookups and perfect React reactivity
  onlineUsers: Record<string, boolean>;
  lastSeenMap: Record<string, string>;
  activeChatId: string | null;
  refreshTrigger: number;
  typingUser: string | null;

  // Actions
  connectSocket: (userId: string) => void;
  disconnectSocket: () => void;
  syncUnreadCount: () => Promise<void>;
  setOnlineStatusBulk: (
    onlineIds: string[],
    lastSeenData: Record<string, string>,
  ) => void;
  setActiveChat: (partnerId: string | null) => void;
  decreaseUnreadCount: (amount: number) => void;
}

// Helper for notification sounds
const playNotificationSound = () => {
  if (typeof window !== "undefined") {
    const audio = new Audio("/sounds/notification.wav");
    audio
      .play()
      .catch(() =>
        console.log("Audio playback blocked until user interaction."),
      );
  }
};

export const useChatStore = create<ChatState>((set, get) => ({
  socket: null,
  totalUnreadCount: 0,
  onlineUsers: {}, // Initialized as empty Record
  lastSeenMap: {},
  activeChatId: null,
  refreshTrigger: 0,
  typingUser: null,

  connectSocket: (userId: string) => {
    const existingSocket = get().socket;

    // If a socket already exists, ensure we don't create duplicates
    if (existingSocket) {
      if (existingSocket.connected) return;
      existingSocket.disconnect(); // Clean up before recreating to avoid ghost listeners
    }

    const API_URL =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8800";

    // Initialize socket
    const socket = io(API_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity, // Robust auto-reconnect
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      auth: { userId }, // Send userId securely during handshake
    });

    // --- SOCKET EVENT LISTENERS ---

    socket.on("connect", () => {
      console.log("✅ Socket Connected");
      get().syncUnreadCount();
    });

    // Receive the initial list of online users directly upon connection
    socket.on("online_users_list", (onlineArray: string[]) => {
      const onlineMap: Record<string, boolean> = {};
      onlineArray.forEach((id) => {
        onlineMap[id] = true;
      });
      set({ onlineUsers: onlineMap });
    });

    socket.on("receive_message", (newMessage) => {
      // Only increment unread & play sound if we are NOT currently looking at this specific chat
      if (get().activeChatId !== newMessage.senderId) {
        get().syncUnreadCount();
        playNotificationSound();
        if ("vibrate" in navigator) navigator.vibrate([200]);
      }
      set((state) => ({ refreshTrigger: state.refreshTrigger + 1 }));
    });

    socket.on("messages_read_by_recipient", () => {
      set((state) => ({ refreshTrigger: state.refreshTrigger + 1 }));
    });

    socket.on("read_status_synced", () => {
      get().syncUnreadCount();
      set((state) => ({ refreshTrigger: state.refreshTrigger + 1 }));
    });

    socket.on("message_deleted", () => {
      set((state) => ({ refreshTrigger: state.refreshTrigger + 1 }));
    });

    // Handle real-time presence updates (login/logout)
    socket.on(
      "user_status_changed",
      ({ userId: changedUserId, isOnline, lastSeen }) => {
        set((state) => {
          const newOnlineUsers = { ...state.onlineUsers };
          const newLastSeenMap = { ...state.lastSeenMap };

          if (isOnline) {
            newOnlineUsers[changedUserId] = true;
            delete newLastSeenMap[changedUserId];
          } else {
            delete newOnlineUsers[changedUserId];
            if (lastSeen) {
              newLastSeenMap[changedUserId] = lastSeen;
            }
          }

          return { onlineUsers: newOnlineUsers, lastSeenMap: newLastSeenMap };
        });
      },
    );

    socket.on("user_typing", ({ senderId }) => {
      if (get().activeChatId === senderId) {
        set({ typingUser: senderId });
      }
    });

    socket.on("user_stopped_typing", () => {
      set({ typingUser: null });
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.removeAllListeners(); // Prevent memory leaks
      socket.disconnect();
    }

    set({
      socket: null,
      totalUnreadCount: 0,
      onlineUsers: {},
      lastSeenMap: {},
      typingUser: null,
      activeChatId: null,
    });
  },

  setOnlineStatusBulk: (
    onlineIds: string[],
    lastSeenData: Record<string, string>,
  ) => {
    const onlineMap: Record<string, boolean> = {};
    onlineIds.forEach((id) => {
      onlineMap[id] = true;
    });

    set({
      onlineUsers: onlineMap,
      lastSeenMap: lastSeenData,
    });
  },

  syncUnreadCount: async () => {
    try {
      const data = await apiRequest<{ totalUnread?: number; count?: number }>({
        method: "GET",
        url: "/api/chats/unread-count",
      });
      set({ totalUnreadCount: data.totalUnread || data.count || 0 });
    } catch (error) {
      console.error("❌ Error syncing unread count:", error);
    }
  },

  setActiveChat: (partnerId: string | null) => {
    if (get().activeChatId === partnerId) return;
    set({ activeChatId: partnerId, typingUser: null });
  },

  decreaseUnreadCount: (amount: number) => {
    set((state) => ({
      totalUnreadCount: Math.max(0, state.totalUnreadCount - amount),
    }));
  },
}));
