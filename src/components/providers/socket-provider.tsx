"use client";
import { useEffect } from "react";
import { io } from "socket.io-client";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function SocketProvider() {
  const { toast } = useToast();
  const router = useRouter();

  const API_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8800";
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user?.id) return;

    const socket = io(API_URL);

    // Join room specifically for this user
    socket.emit("join_room", session.user.id);

    socket.on("notification", (data: any) => {
      // Optional: Play Sound
      try {
        const audio = new Audio("/sounds/notification.mp3");
        audio.play().catch(() => {});
      } catch (e) {}

      toast({
        title: "Уведомление",
        description: data.message,
        variant: "success",
        duration: 10000,
        action: {
          label: "View",
          onClick: () => router.push("/notification"),
        },
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [session, toast]);

  return null;
}
