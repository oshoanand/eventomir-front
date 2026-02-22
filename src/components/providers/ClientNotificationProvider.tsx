"use client";

import React, { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react"; // 1. Import useSession
import { useSocket } from "@/components/providers/socket-provider";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle } from "lucide-react";

// 2. Import ChatDialog
import ChatDialog from "@/components/ChatDialog";

export const ClientNotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { data: session } = useSession(); // 3. Get Session for currentUserId
  const { socket } = useSocket();
  const { toast } = useToast();
  const router = useRouter();

  // 4. Global Chat State
  const [chatState, setChatState] = useState({
    isOpen: false,
    chatId: "",
    partnerName: "",
  });

  // Helper to play notification sound
  const playSound = useCallback(() => {
    try {
      const audio = new Audio("/sounds/notification.wav");
      audio.play().catch((e) => console.log("Audio autoplay blocked", e));
    } catch (error) {
      console.error("Audio error", error);
    }
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleMessageNotification = (payload: {
      chatId: string;
      senderName: string;
      preview: string;
    }) => {
      console.log("🔔 New Message Notification:", payload);

      playSound();

      toast({
        title: `Сообщение от ${payload.senderName}`,
        description: payload.preview,
        duration: 5000,
        action: {
          label: (
            <div className="flex items-center gap-2 font-medium">
              <MessageCircle className="h-4 w-4" />
              Ответить
            </div>
          ),
          // 5. Update State on Click
          onClick: () => {
            console.log("Opening chat via toast:", payload.chatId);
            setChatState({
              isOpen: true,
              chatId: payload.chatId,
              partnerName: payload.senderName,
            });
          },
        },
      });
    };

    socket.on("message_notification", handleMessageNotification);

    return () => {
      socket.off("message_notification", handleMessageNotification);
    };
  }, [socket, toast, playSound]);

  return (
    <>
      {children}

      {/* 6. Render the Global Chat Dialog */}
      {chatState.isOpen && session?.user?.id && (
        <ChatDialog
          isOpen={chatState.isOpen}
          onClose={() => setChatState((prev) => ({ ...prev, isOpen: false }))}
          chatId={chatState.chatId}
          performerName={chatState.partnerName}
          currentUserId={session.user.id}
          // Optional: If you have senderId in payload, pass it here for avatar logic
          // performerId={payload.senderId}
        />
      )}
    </>
  );
};
