"use client";

import { useEffect, useState, useRef } from "react";
import { useSocket } from "@/components/providers/socket-provider";
// 1. Import your API utility
import { apiRequest } from "@/utils/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, User, Check, Clock, AlertCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  isRead?: boolean;
  status?: "sending" | "sent" | "error";
}

interface ChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  performerName: string;
  currentUserId: string;
  performerId?: string;
  performerImage?: string;
}

export default function ChatDialog({
  isOpen,
  onClose,
  chatId,
  performerName,
  currentUserId,
  performerImage,
}: ChatDialogProps) {
  const { socket } = useSocket();
  const { toast } = useToast();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- 2. Fetch Chat History on Open ---
  useEffect(() => {
    if (isOpen && chatId) {
      const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
          // apiRequest automatically adds Auth headers and BaseURL
          const data = await apiRequest<Message[]>({
            method: "get",
            url: `/api/chats/${chatId}/messages`,
          });
          setMessages(data);
        } catch (error) {
          console.error("Failed to fetch messages", error);
          toast({
            variant: "destructive",
            title: "Ошибка",
            description: "Не удалось загрузить историю сообщений",
          });
        } finally {
          setIsLoadingHistory(false);
        }
      };

      fetchHistory();
    }
  }, [isOpen, chatId, toast]);

  // --- 3. Real-Time Listener (Socket.io) ---
  useEffect(() => {
    if (!socket || !chatId) return;

    // Join Room
    socket.emit("join_chat", chatId);

    const handleReceiveMessage = (msg: any) => {
      // Logic Check: Ensure message belongs to THIS chat
      if (msg.chatId === chatId) {
        setMessages((prev) => {
          const exists = prev.find((m) => m.id === msg.id);
          if (exists) return prev;
          // Mark incoming as 'sent'
          return [...prev, { ...msg, status: "sent" }];
        });
      }
    };

    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      // socket.emit("leave_chat", chatId);
    };
  }, [socket, chatId]);

  // --- 4. Auto-Scroll to Bottom ---
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // --- 5. Send Message Handler ---
  const handleSend = async () => {
    if (!newMessage.trim()) return;

    const tempId = Date.now().toString();
    const content = newMessage.trim();

    // Optimistic Update
    const optimisticMsg: Message = {
      id: tempId,
      content: content,
      senderId: currentUserId,
      createdAt: new Date().toISOString(),
      status: "sending",
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage("");
    setIsSending(true);

    try {
      // Call API using apiRequest
      const savedMsg = await apiRequest<Message>({
        method: "post",
        url: `/api/chats/${chatId}/messages`,
        data: { content },
      });

      // Success: Update temporary message with real data
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...savedMsg, status: "sent" } : m,
        ),
      );
    } catch (error) {
      console.error("Send error", error);

      // Error: Mark message as error so user can retry or see failure
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, status: "error" } : m)),
      );

      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось отправить сообщение",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] h-[80vh] sm:h-[600px] flex flex-col p-0 gap-0 overflow-hidden bg-background">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b bg-secondary/20">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-border">
              <AvatarImage src={performerImage} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {performerName?.charAt(0).toUpperCase() || (
                  <User className="h-5 w-5" />
                )}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col justify-center">
              <DialogTitle className="text-base font-semibold leading-none mb-1">
                {performerName}
              </DialogTitle>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                В сети
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4 bg-slate-50/50 dark:bg-black/20">
          {isLoadingHistory ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground opacity-50 space-y-2 mt-10">
              <div className="bg-muted p-4 rounded-full">
                <User className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-sm">История сообщений пуста</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, index) => {
                const isMe = msg.senderId === currentUserId;
                return (
                  <div
                    key={msg.id || index}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[80%]`}
                    >
                      <div
                        className={`px-4 py-2 rounded-2xl text-sm shadow-sm ${
                          isMe
                            ? "bg-primary text-primary-foreground rounded-tr-none"
                            : "bg-white dark:bg-zinc-900 border rounded-tl-none"
                        } ${msg.status === "error" ? "border-red-500 border-2" : ""}`}
                      >
                        <p className="leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 mt-1 px-1">
                        <span className="text-[10px] text-muted-foreground opacity-70">
                          {format(new Date(msg.createdAt), "HH:mm")}
                        </span>
                        {isMe && (
                          <span className="text-muted-foreground">
                            {msg.status === "sending" ? (
                              <Clock className="h-3 w-3 animate-pulse" />
                            ) : msg.status === "error" ? (
                              <AlertCircle className="h-3 w-3 text-red-500" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <DialogFooter className="p-3 border-t bg-background">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex w-full items-center gap-2"
          >
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Напишите сообщение..."
              className="flex-1 rounded-full px-4 border-muted-foreground/20 focus-visible:ring-1"
              autoFocus
            />
            <Button
              type="submit"
              size="icon"
              disabled={!newMessage.trim() || isSending}
              className="rounded-full h-10 w-10 shrink-0 shadow-sm"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4 ml-0.5" />
              )}
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
