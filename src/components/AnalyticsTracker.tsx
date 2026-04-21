"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { apiRequest } from "@/utils/api-client";

export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    // Fire and forget - silent tracking.
    // We intentionally do not await this to avoid blocking the UI thread.
    apiRequest({
      method: "post",
      url: "/api/analytics/track",
      data: { path: pathname },
    }).catch(() => {
      // Silently fail (e.g., if the user is using a strict AdBlocker)
    });
  }, [pathname]);

  return null; // This component is invisible
}
