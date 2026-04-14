"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/utils/api-client";

// Import your Chat Detail Screen component
import ChatDetailScreen from "@/components/chat/ChatDetailScreen";

export default function ChatRoomPage() {
  const { partnerId } = useParams() as { partnerId: string };
  const { data: session, status } = useSession();
  const router = useRouter();

  const [partnerName, setPartnerName] = useState<string>("Загрузка...");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Wait until NextAuth has finished checking the session
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    // Fetch the partner's basic info so we can display their name in the header
    const fetchPartnerInfo = async () => {
      try {
        // Replaced raw axios with your custom apiRequest to automatically attach Bearer tokens
        const data = await apiRequest<{ name?: string }>({
          method: "GET",
          url: `/api/users/${partnerId}`,
        });

        setPartnerName(data.name || "Пользователь");
      } catch (error) {
        console.error("Failed to fetch partner info:", error);
        setPartnerName("Пользователь");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPartnerInfo();
  }, [status, partnerId, router]);

  const handleBack = () => {
    // Navigate back to the chat list
    router.push("/chat");
  };

  // Show a loading state while fetching auth status or partner name
  if (status === "loading" || isLoading) {
    return (
      <div className="flex flex-col h-[100dvh] items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary w-10 h-10 mb-4" />
        <p className="text-muted-foreground font-medium">Подключение...</p>
      </div>
    );
  }

  // Note: Your ChatDetailScreen uses `fixed inset-0`, so it will automatically
  // take up the full screen and cover any underlying layout components (like BottomNav).
  return (
    <ChatDetailScreen
      partnerId={partnerId}
      partnerName={partnerName}
      onBack={handleBack}
    />
  );
}
