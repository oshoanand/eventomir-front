"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Home, Search, CalendarDays, User } from "lucide-react";
import { cn } from "@/utils/utils";

export default function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Dynamically route the user to the correct profile or login page
  const profileLink = !session
    ? "/login"
    : session.user?.role === "performer"
      ? "/performer-profile"
      : "/customer-profile";

  const navItems = [
    { name: "Главная", href: "/", icon: Home },
    { name: "Поиск", href: "/search", icon: Search },
    { name: "Афиша", href: "/events", icon: CalendarDays },
    { name: "Профиль", href: profileLink, icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/85 backdrop-blur-xl border-t border-border pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.2)]">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          // Strict match for home, partial match for others to keep them highlighted in sub-routes
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className="relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-200 active:scale-95 touch-manipulation"
            >
              <div
                className={cn(
                  "p-1.5 rounded-full transition-all duration-300",
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
  );
}
