"use client";

import { MessageCircle } from "lucide-react";
import { useUnreadCount } from "@/hooks/use-unread-count";

export function NavbarChatBadge() {
  const { count } = useUnreadCount();

  return (
    <div className="relative p-2 hover:bg-secondary rounded-full cursor-pointer">
      <MessageCircle className="h-6 w-6 text-muted-foreground" />

      {count > 0 && (
        <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white ring-2 ring-background">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </div>
  );
}
