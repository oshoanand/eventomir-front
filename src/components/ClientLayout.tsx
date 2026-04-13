"use client";

import React from "react";
import ClientHeader from "@/components/ClientHeader";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import BottomNav from "@/components/BottomNav"; // <-- Import the new BottomNav
import { usePathname } from "next/navigation";

const ClientLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  return (
    <div className="flex flex-col min-h-screen">
      <ClientHeader />

      {/* pb-20 prevents content from getting stuck under the mobile bottom nav */}
      <main className="flex-grow pb-20 md:pb-0">{children}</main>

      {/* Hide the traditional large web footer on mobile to maintain the native app illusion */}
      <div className="hidden md:block">
        <Footer />
      </div>

      <CookieBanner />

      {/* Render the native-like bottom navigation */}
      <BottomNav />
    </div>
  );
};

export default ClientLayout;
