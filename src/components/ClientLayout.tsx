"use client";

import React, { useEffect } from "react";
import ClientHeader from "@/components/ClientHeader";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import BottomNav from "@/components/BottomNav";
import { usePathname } from "next/navigation";

const ClientLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  // 1. Define the condition: Check if the current URL includes '/chat'
  const isChatRoute = pathname.includes("/chat");

  // Prevent the "pull-to-refresh" web bounce effect for a strict native app feel
  useEffect(() => {
    document.body.style.overscrollBehaviorY = "none";
    return () => {
      document.body.style.overscrollBehaviorY = "auto";
    };
  }, []);

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background w-full overflow-x-hidden">
      {/* 2. Conditionally render the Header */}
      {!isChatRoute && <ClientHeader />}

      {/* Ensure main content doesn't get stuck behind the mobile bottom nav */}
      <main className="flex-grow pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0 relative w-full">
        {children}
      </main>

      {/* Hide the traditional large web footer on mobile. 
          Also optionally hiding it on chat routes for a cleaner desktop chat UI */}
      <div className="hidden md:block">{!isChatRoute && <Footer />}</div>

      <CookieBanner />

      {/* BottomNav remains visible. (The ChatDetailScreen's fixed inset-0 overlay will naturally cover it when a specific chat opens) */}
      <BottomNav />
    </div>
  );
};

export default ClientLayout;
