"use client";

import React from "react";
import ClientHeader from "@/components/ClientHeader";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import { usePathname } from "next/navigation";

const ClientLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  // Can add logic to not display header/footer on certain pages
  // const hideHeaderFooter = pathname === '/some-special-page';

  return (
    // Correctly wrap children in a React fragment or a div
    <>
      <ClientHeader />
      <main className="flex-grow">{children}</main>
      <Footer />
      <CookieBanner />
    </>
  );
};

export default ClientLayout;
