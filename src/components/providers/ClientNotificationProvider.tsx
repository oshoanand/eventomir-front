"use client";

import React, { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useSocket } from "@/components/providers/socket-provider";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle } from "lucide-react";
import { apiRequest } from "@/utils/api-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Imports for our Chat UI
import ChatDialog from "@/components/chat/ChatDialog"; // Adjust path if needed
import ChatList from "@/components/chat/ChatList"; // Adjust path if needed

export const ClientNotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { data: session } = useSession();
  const { socket } = useSocket();
  const { toast } = useToast();
  const router = useRouter();

  // --- Global Chat States ---
  const [chatState, setChatState] = useState({
    isOpen: false,
    chatId: "",
    partnerName: "",
    partnerImage: undefined as string | undefined,
  });

  // NEW: Inbox Modal State and Total Unread Count
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);

  // --- Audio Helper ---
  const playSound = useCallback(() => {
    try {
      const audio = new Audio("/sounds/notification.wav");
      audio.play().catch((e) => console.log("Audio autoplay blocked", e));
    } catch (error) {
      console.error("Audio error", error);
    }
  }, []);

  // --- Fetch Total Unread Count ---
  const fetchUnreadCount = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const res = await apiRequest<{ count: number }>({
        method: "get",
        url: "/api/chats/unread-count",
      });
      setTotalUnread(res.count);
    } catch (e) {
      console.error("Failed to fetch unread count", e);
    }
  }, [session?.user?.id]);

  // Fetch initial count on mount, and re-fetch whenever the user closes a chat
  // (because they likely just read some messages!)
  useEffect(() => {
    if (!chatState.isOpen) {
      fetchUnreadCount();
    }
  }, [chatState.isOpen, fetchUnreadCount]);

  // --- Socket Listener ---
  useEffect(() => {
    if (!socket) return;

    const handleMessageNotification = (payload: {
      chatId: string;
      senderName: string;
      preview: string;
    }) => {
      // 1. If this exact chat is already open, do nothing (user is actively reading)
      if (chatState.isOpen && chatState.chatId === payload.chatId) {
        return;
      }

      // 2. Increment global unread badge instantly
      setTotalUnread((prev) => prev + 1);

      // 3. Play Sound & Show Toast
      playSound();
      toast({
        title: `Сообщение от ${payload.senderName}`,
        description: payload.preview,
        duration: 6000,
        action: {
          label: (
            <div className="flex items-center gap-2 font-medium">
              <MessageCircle className="h-4 w-4" />
              Ответить
            </div>
          ),
          onClick: () => {
            // Close inbox if open, and jump straight into the chat
            setIsInboxOpen(false);
            setChatState({
              isOpen: true,
              chatId: payload.chatId,
              partnerName: payload.senderName,
              partnerImage: undefined,
            });
          },
        },
      });
    };

    socket.on("message_notification", handleMessageNotification);

    return () => {
      socket.off("message_notification", handleMessageNotification);
    };
  }, [socket, toast, playSound, chatState]);

  return (
    <>
      {children}

      {/* --- GLOBAL FLOATING INBOX BUTTON --- */}
      {session?.user?.id && (
        <div className="fixed bottom-6 right-6 z-40">
          <Button
            onClick={() => setIsInboxOpen(true)}
            size="icon"
            className="h-14 w-14 rounded-full shadow-2xl hover:shadow-primary/25 transition-all bg-primary hover:bg-primary/90 relative"
          >
            <MessageCircle className="h-6 w-6 text-primary-foreground" />

            {/* Unread Badge */}
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive border-2 border-background text-[11px] font-bold text-destructive-foreground animate-in zoom-in">
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
          </Button>
        </div>
      )}

      {/* --- INBOX DIALOG (Shows all chats) --- */}
      {session?.user?.id && (
        <Dialog open={isInboxOpen} onOpenChange={setIsInboxOpen}>
          <DialogContent className="sm:max-w-[450px] h-[80vh] flex flex-col p-0 gap-0 overflow-hidden bg-background">
            <DialogHeader className="px-6 py-4 border-b bg-secondary/10">
              <DialogTitle className="flex items-center gap-2 text-lg">
                <MessageCircle className="h-5 w-5 text-primary" />
                Ваши сообщения
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-hidden">
              <ChatList
                currentUserId={session.user.id}
                onSelectChat={(chatId, name, image) => {
                  // When a chat is clicked, close the inbox and open the Chat Dialog
                  setIsInboxOpen(false);
                  setChatState({
                    isOpen: true,
                    chatId,
                    partnerName: name,
                    partnerImage: image,
                  });
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* --- 1-ON-1 CHAT DIALOG --- */}
      {chatState.isOpen && session?.user?.id && (
        <ChatDialog
          isOpen={chatState.isOpen}
          onClose={() => setChatState((prev) => ({ ...prev, isOpen: false }))}
          chatId={chatState.chatId}
          performerName={chatState.partnerName}
          performerImage={chatState.partnerImage}
          currentUserId={session.user.id}
        />
      )}
    </>
  );
};
