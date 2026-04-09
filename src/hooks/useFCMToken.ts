"use client";

import { useEffect, useRef } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "@/lib/firebase";
import { apiRequest } from "@/utils/api-client";
import { toast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";

const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_KEY;

export default function useFCMToken() {
  const { data: session, status } = useSession();
  const syncedTokenRef = useRef<string | null>(null);

  useEffect(() => {
    // 🚨 1. Wait until the user is fully logged in
    if (status !== "authenticated" || !session?.user) return;

    const syncFCMWithBackend = async () => {
      try {
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
          // 2. Request Notification Permission
          const permission = await Notification.requestPermission();

          if (permission === "granted") {
            const msg = await messaging();
            if (!msg) return;

            // 3. Wait for the Service Worker to be active
            const registration = await navigator.serviceWorker.ready;

            // 4. Generate the Firebase Device Token
            const currentToken = await getToken(msg, {
              vapidKey: VAPID_KEY,
              serviceWorkerRegistration: registration,
            });

            // 5. Send to backend ONLY if it hasn't been synced yet this session
            if (currentToken && syncedTokenRef.current !== currentToken) {
              // This hits the route we built, which saves the token AND subscribes to the topic!
              await apiRequest({
                method: "POST",
                url: "/api/fcm/save-fcm",
                data: { token: currentToken },
              });

              syncedTokenRef.current = currentToken;
              console.log("✅ FCM Token synced and subscribed to topics");
            }

            // 6. Setup Foreground Message Listener (Live Toasts)
            onMessage(msg, (payload) => {
              toast({
                variant: "success",
                title:
                  payload.notification?.title ||
                  payload.data?.title ||
                  "Новое уведомление",
                description: payload.notification?.body || payload.data?.body,
              });
            });
          }
        }
      } catch (error) {
        console.error("❌ Error syncing FCM token:", error);
      }
    };

    syncFCMWithBackend();
  }, [session, status]);
}
