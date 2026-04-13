"use client";

import Link from "next/link";
import React, { useState, useContext } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
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
    <header className="sticky top-0 z-50 w-full border-b bg-background/85 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60 transition-all duration-300 shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
        {/* Left: Logo & Desktop Search */}
        <div className="flex items-center gap-6 md:gap-10 w-full md:w-auto">
          <Link
            href="/"
            className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70 transition-colors"
          >
            {settings?.siteName || "Eventomir"}
          </Link>

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

        {/* Right: Desktop Profile Menu */}
        {/* Hidden on mobile (md:flex) because the BottomNav handles mobile profiles */}
        <div className="hidden md:flex items-center gap-4">
          <ClientMenu
            isLoggedIn={isLoggedIn}
            userRole={userRole}
            userImage={userImage}
            userName={userName}
          />
        </div>
      </div>
    </header>
  );
}

export default ClientHeader;
