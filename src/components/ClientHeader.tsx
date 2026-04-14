"use client";

import Link from "next/link";
import React, { useState, useContext } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Bell } from "lucide-react";
import { SettingsContext } from "@/components/providers/Providers";

const ClientMenu = dynamic(() => import("@/components/ClientMenu"), {
  ssr: false,
});

function ClientHeader() {
  const settings = useContext(SettingsContext);
  const router = useRouter();

  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";
  const userRole = session?.user?.role as any;
  const userImage = session?.user?.image;
  const userName = session?.user?.name as any;

  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/search");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70 transition-all duration-300 shadow-sm md:shadow-none border-b border-transparent md:border-border">
      <div className="container mx-auto flex h-14 md:h-16 items-center justify-between px-4 lg:px-8">
        {/* Left: Logo & Desktop Search */}
        <div className="flex items-center gap-6 md:gap-10 w-full md:w-auto">
          <Link
            href="/"
            className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70 transition-colors"
          >
            {settings?.siteName || "Eventomir"}
          </Link>

          {/* Search bar is only visible on desktop (lg:flex) */}
          <form
            onSubmit={handleSearch}
            className="hidden lg:flex relative group w-[300px] xl:w-[450px]"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              type="search"
              placeholder="Кого вы ищете?"
              className="w-full rounded-full bg-muted/40 hover:bg-muted/60 pl-11 pr-4 border-transparent focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all h-10 shadow-inner"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>

        {/* Right Side: Notifications & Desktop Profile Menu */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* MOBILE NOTIFICATION BELL (Only visible on mobile if logged in) */}
          {isLoggedIn && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden relative group flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 hover:bg-primary/20 transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
              onClick={() => router.push("/notifications")} // Adjust this route to your actual notifications page
            >
              <Bell
                className="h-4 w-4 text-primary transition-transform duration-300 group-hover:scale-110"
                strokeWidth={2}
              />
              {/* Optional: Add an unread badge here if you have that data */}
              {/* <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive border-2 border-background"></span> */}
              <span className="sr-only">Уведомления</span>
            </Button>
          )}

          {/* DESKTOP PROFILE MENU (Hidden on mobile) */}
          <div className="hidden md:flex items-center gap-4">
            <ClientMenu
              isLoggedIn={isLoggedIn}
              userRole={userRole}
              userImage={userImage}
              userName={userName}
            />
          </div>
        </div>
      </div>
    </header>
  );
}

export default ClientHeader;
