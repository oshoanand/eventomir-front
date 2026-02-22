"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: string[]; // List of User IDs currently online
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

const SOCKET_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8800";

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { data: session } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!session?.user?.id) return;

    // 1. Initialize Socket with Auth
    const socketInstance = io(SOCKET_URL, {
      transports: ["websocket"],
      query: { userId: session.user.id },
      reconnectionAttempts: 5,
    });

    setSocket(socketInstance);

    // 2. Connection Events
    socketInstance.on("connect", () => setIsConnected(true));
    socketInstance.on("disconnect", () => setIsConnected(false));

    // 3. Online Status Logic (From Redis)
    socketInstance.on("online_users_list", (users: string[]) => {
      setOnlineUsers(users);
    });

    socketInstance.on(
      "user_status_change",
      ({
        userId,
        status,
      }: {
        userId: string;
        status: "online" | "offline";
      }) => {
        setOnlineUsers((prev) => {
          const set = new Set(prev);
          if (status === "online") set.add(userId);
          else set.delete(userId);
          return Array.from(set);
        });
      },
    );

    return () => {
      socketInstance.disconnect();
    };
  }, [session?.user?.id]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};
