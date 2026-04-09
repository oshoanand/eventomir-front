"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/utils/api-client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Loader2, MessageSquare } from "lucide-react";
import { useSocket } from "@/components/providers/SocketProvider";

interface ChatListItem {
  id: string;
  updatedAt: string;
  unreadCount: number;
  participants: {
    id: string;
    name: string;
    profile_picture?: string;
  }[];
  messages: {
    content: string;
    createdAt: string;
  }[];
}

interface ChatListProps {
  currentUserId: string;
  onSelectChat: (chatId: string, name: string, image?: string) => void;
  activeChatId?: string;
}

export default function ChatList({
  currentUserId,
  onSelectChat,
  activeChatId,
}: ChatListProps) {
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Pull onlineUsers from the socket context
  const { socket, onlineUsers } = useSocket();

  // --- 1. Fetch Inbox on Mount ---
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const data = await apiRequest<ChatListItem[]>({
          method: "get",
          url: "/api/chats",
        });
        setChats(data);
      } catch (error) {
        console.error("Error fetching inbox:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [activeChatId]); // Refetch when active chat changes to sync read counts

  // --- 2. Real-time Inbox Updates ---
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg: any) => {
      setChats((prevChats) => {
        let chatExists = false;

        const updatedChats = prevChats.map((chat) => {
          if (chat.id === msg.chatId) {
            chatExists = true;
            return {
              ...chat,
              updatedAt: new Date().toISOString(),
              unreadCount: chat.id === activeChatId ? 0 : chat.unreadCount + 1,
              messages: [
                {
                  content: msg.message.content,
                  createdAt: msg.message.createdAt,
                },
              ],
            };
          }
          return chat;
        });

        return updatedChats.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );
      });
    };

    socket.on("receive_message", handleNewMessage);
    return () => {
      socket.off("receive_message", handleNewMessage);
    };
  }, [socket, activeChatId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Загрузка чатов...</p>
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-3 opacity-60">
        <div className="bg-muted p-4 rounded-full">
          <MessageSquare className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">Список чатов пуст</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full max-h-[600px] pr-4">
      <div className="space-y-2 p-1">
        {chats.map((chat) => {
          const otherUser = chat.participants.find(
            (p) => p.id !== currentUserId,
          );

          // Fallbacks for deleted accounts
          const displayName = otherUser?.name || "Удаленный профиль";
          const displayImage = otherUser?.profile_picture || undefined;

          const lastMessage = chat.messages[0];
          const isActive = chat.id === activeChatId;

          // 2. Check if the other user is currently online
          const isOnline = otherUser && onlineUsers.includes(otherUser.id);

          return (
            <button
              key={chat.id}
              onClick={() => onSelectChat(chat.id, displayName, displayImage)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border ${
                isActive
                  ? "bg-primary/5 border-primary/20 shadow-sm"
                  : "bg-card hover:bg-secondary/50 border-transparent"
              }`}
            >
              <div className="relative">
                <Avatar className="h-12 w-12 border border-border/50">
                  <AvatarImage src={displayImage} />
                  <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                    {otherUser ? displayName.charAt(0).toUpperCase() : "?"}
                  </AvatarFallback>
                </Avatar>

                {/* 3. Conditionally render the green dot based on isOnline state */}
                {isOnline && (
                  <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background shadow-sm" />
                )}
              </div>

              <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-center mb-1">
                  <span
                    className={`font-semibold text-sm truncate pr-2 ${!otherUser ? "italic text-muted-foreground" : ""}`}
                  >
                    {displayName}
                  </span>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {format(new Date(chat.updatedAt), "HH:mm", { locale: ru })}
                  </span>
                </div>

                <div className="flex justify-between items-center gap-2">
                  <p
                    className={`text-xs truncate flex-1 text-left ${
                      chat.unreadCount > 0 && !isActive
                        ? "text-foreground font-bold"
                        : "text-muted-foreground"
                    }`}
                  >
                    {lastMessage ? lastMessage.content : "Начните общение..."}
                  </p>

                  {chat.unreadCount > 0 && !isActive && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                      {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
