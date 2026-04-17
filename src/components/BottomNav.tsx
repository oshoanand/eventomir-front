"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Home,
  Search,
  CalendarDays,
  User,
  MessageCircle,
  MessageCircleMore,
} from "lucide-react";
import { cn } from "@/utils/utils";
import MobileProfileDrawer from "./MobileProfileDrawer";
import { useChatStore } from "@/store/useChatStore";

export default function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Read unread count from Zustand store
  const totalUnreadCount = useChatStore((state) => state.totalUnreadCount);

  // ALWAYS intercept the Profile click to open the side drawer
  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent standard navigation
    setIsDrawerOpen(true); // Open the side drawer
  };

  // Base navigation items (always visible)
  const navItems = [
    { name: "Главная", href: "/", icon: Home },
    { name: "Поиск", href: "/search", icon: Search },
    { name: "Афиша", href: "/events", icon: CalendarDays },
  ];

  // If the user is logged in, insert the Chat tab
  if (session) {
    navItems.push({ name: "Чаты", href: "/chat", icon: MessageCircleMore });
  }

  // Profile tab is always the last item
  navItems.push({ name: "Профиль", href: "#", icon: User });

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/85 backdrop-blur-xl border-t border-border pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const isProfileTab = item.name === "Профиль";

            // Highlight logic: if the drawer is open, force the Profile tab to be active.
            // Also keep it active if we are actually on a profile, login, or register page.
            const isActive = isProfileTab
              ? isDrawerOpen ||
                pathname.includes("profile") ||
                pathname === "/login" ||
                pathname.includes("register")
              : (item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href)) && !isDrawerOpen;

            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={isProfileTab ? handleProfileClick : undefined}
                className="relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-200 active:scale-95 touch-manipulation"
              >
                <div
                  className={cn(
                    "p-1.5 rounded-full transition-all duration-300 relative", // Added relative here for badge positioning
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                      "h-6 w-6 transition-all duration-300",
                      isActive && "fill-primary/20 scale-110",
                    )}
                  />

                  {/* UNREAD BADGE INDICATOR */}
                  {item.name === "Чаты" && totalUnreadCount > 0 && (
                    <span className="absolute -top-1 -right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground ring-2 ring-background animate-in zoom-in">
                      {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] tracking-wide transition-all duration-300",
                    isActive
                      ? "font-bold text-primary"
                      : "font-medium text-muted-foreground",
                  )}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* The Native Android-style Drawer Component */}
      <MobileProfileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  );
}
