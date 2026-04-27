"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Socket } from "socket.io-client";
import { useSession } from "next-auth/react";
import { useChatStore } from "@/store/useChatStore";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  // We keep this as a Set for backward compatibility with your UI components,
  // mapping it automatically from the highly reactive Record in Zustand.
  onlineUsers: Set<string>;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, status } = useSession();

  const socket = useChatStore((state) => state.socket);
  const connectSocket = useChatStore((state) => state.connectSocket);
  const disconnectSocket = useChatStore((state) => state.disconnectSocket);
  const onlineUsersRecord = useChatStore((state) => state.onlineUsers);

  const [isConnected, setIsConnected] = useState(false);

  // 1. Connection Lifecycle Management
  useEffect(() => {
    // Only connect if the session is fully authenticated
    if (status === "authenticated" && session?.user?.id) {
      connectSocket(session.user.id);
    }

    // Clean up on unmount or when session invalidates
    return () => {
      // In React 18 Strict mode this runs immediately, but our store logic
      // handles rapid reconnects flawlessly without leaking listeners.
      if (status === "unauthenticated") {
        disconnectSocket();
      }
    };
  }, [session?.user?.id, status, connectSocket, disconnectSocket]);

  // 2. Track connection status dynamically
  useEffect(() => {
    if (!socket) return;

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    setIsConnected(socket.connected);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [socket]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        // Dynamically convert Record to Set so existing components don't break
        onlineUsers: new Set(Object.keys(onlineUsersRecord)),
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
