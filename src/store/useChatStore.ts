import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { apiRequest } from "@/utils/api-client"; // <-- Imported your custom API client

interface ChatState {
  socket: Socket | null;
  totalUnreadCount: number;
  onlineUsers: Set<string>;
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
  onlineUsers: new Set(),
  lastSeenMap: {},
  activeChatId: null,
  refreshTrigger: 0,
  typingUser: null,

  connectSocket: (userId: string) => {
    const currentSocket = get().socket;
    if (currentSocket?.connected) return;

    if (currentSocket && !currentSocket.connected) {
      currentSocket.connect();
      return;
    }

    const API_URL =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8800";

    // Initialize socket with authentication
    const socket = io(API_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      auth: { userId }, // Send userId securely during handshake
    });

    // --- SOCKET EVENT LISTENERS ---

    socket.on("connect", () => {
      console.log("✅ Socket Connected");
      get().syncUnreadCount();
    });

    // Receive the initial list of online users directly upon connection
    socket.on("online_users_list", (onlineArray: string[]) => {
      set({ onlineUsers: new Set(onlineArray) });
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

    // Triggered when the partner reads the messages you sent
    socket.on("messages_read_by_recipient", () => {
      set((state) => ({ refreshTrigger: state.refreshTrigger + 1 }));
    });

    // Triggered to sync read status across multiple devices of the SAME user
    socket.on("read_status_synced", () => {
      get().syncUnreadCount();
      set((state) => ({ refreshTrigger: state.refreshTrigger + 1 }));
    });

    // Triggered when a message is deleted
    socket.on("message_deleted", () => {
      set((state) => ({ refreshTrigger: state.refreshTrigger + 1 }));
    });

    // Handle real-time presence updates (login/logout)
    socket.on(
      "user_status_changed",
      ({ userId: changedUserId, isOnline, lastSeen }) => {
        set((state) => {
          const newSet = new Set(state.onlineUsers);
          const newLastSeenMap = { ...state.lastSeenMap };

          if (isOnline) {
            newSet.add(changedUserId);
            // Optional: remove them from lastSeenMap if they are online
            delete newLastSeenMap[changedUserId];
          } else {
            newSet.delete(changedUserId);
            if (lastSeen) {
              newLastSeenMap[changedUserId] = lastSeen;
            }
          }
          return { onlineUsers: newSet, lastSeenMap: newLastSeenMap };
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
    if (socket) socket.disconnect();
    set({
      socket: null,
      totalUnreadCount: 0,
      onlineUsers: new Set(),
      lastSeenMap: {},
      typingUser: null,
      activeChatId: null,
    });
  },

  // Bulk sync from REST API calls (e.g., when loading the chat list page)
  setOnlineStatusBulk: (
    onlineIds: string[],
    lastSeenData: Record<string, string>,
  ) => {
    set({
      onlineUsers: new Set(onlineIds),
      lastSeenMap: lastSeenData,
    });
  },

  syncUnreadCount: async () => {
    try {
      // Replaced raw axios call with your custom apiRequest
      // The apiClient automatically prepends the baseURL and handles the Bearer token
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
