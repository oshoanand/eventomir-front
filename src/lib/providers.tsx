"use client";

import * as React from "react";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type SiteSettings } from "@/services/settings";
import ClientLayout from "@/components/ClientLayout";
import { NotificationProvider } from "@/context/NotificationContext";

export const SettingsContext = React.createContext<SiteSettings | null>(null);

// The Providers component now simply receives the settings and provides them
export function Providers({
  children,
  initialSettings,
}: {
  children: React.ReactNode;
  initialSettings: SiteSettings | null;
}) {
  const [queryClient] = React.useState(() => new QueryClient());

  // If for some reason settings are not available, we could show a loader,
  // but they should always be passed from the server layout.
  if (!initialSettings) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Загрузка сайта...</p>
      </div>
    );
  }

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
          <SettingsContext.Provider value={initialSettings}>
            <ClientLayout>{children}</ClientLayout>
          </SettingsContext.Provider>
        </NotificationProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
