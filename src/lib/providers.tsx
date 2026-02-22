"use client";

import * as React from "react";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type SiteSettings } from "@/services/settings";
import ClientLayout from "@/components/ClientLayout";

// Providers
import { SocketProvider } from "@/components/providers/socket-provider";
import { NotificationProvider } from "@/context/NotificationContext";
import { ClientNotificationProvider } from "@/components/providers/ClientNotificationProvider";
import { SiteThemeProvider } from "@/components/providers/SiteThemeProvider";

export { SettingsContext } from "@/components/providers/SiteThemeProvider";

export function Providers({
  children,
  initialSettings,
}: {
  children: React.ReactNode;
  initialSettings: SiteSettings | null;
}) {
  const [queryClient] = React.useState(() => new QueryClient());

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
        <SocketProvider>
          <NotificationProvider>
            <ClientNotificationProvider>
              <SiteThemeProvider settings={initialSettings}>
                <ClientLayout>{children}</ClientLayout>
              </SiteThemeProvider>
            </ClientNotificationProvider>
          </NotificationProvider>
        </SocketProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
