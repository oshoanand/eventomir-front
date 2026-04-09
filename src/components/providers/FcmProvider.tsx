"use client";

import { useEffect, useState } from "react";
import useFcmToken from "@/hooks/useFCMToken";

export default function FcmProvider() {
  const [isSwReady, setIsSwReady] = useState(false);

  useEffect(() => {
    // 1. Check if we are in the browser and Service Workers are supported
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // 2. 🚨 CRITICAL: Wait for the Service Worker to be fully registered and active
      // before letting Firebase attempt to generate a push token.
      navigator.serviceWorker.ready
        .then(() => {
          // Once the promise resolves, we know it's safe to fire the FCM hook
          setIsSwReady(true);
        })
        .catch((error) => {
          console.error(
            "❌ FCM Provider: Service Worker ready check failed:",
            error,
          );
        });
    }
  }, []);

  // 3. Only run the FCM logic once the Service Worker is guaranteed to be ready.
  // If it's not ready yet, render nothing and wait.
  if (isSwReady) {
    return <FcmTokenRunner />;
  }

  return null;
}

// --- INNER COMPONENT ---
// We isolate the hook in this child component so it doesn't execute
// until the parent conditionally renders it.
function FcmTokenRunner() {
  // This hook handles permission requests, token syncing, and foreground listeners
  useFcmToken();

  // This component renders nothing visually, it just runs the background logic
  return null;
}
