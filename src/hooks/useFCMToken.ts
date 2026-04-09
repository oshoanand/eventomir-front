"use client";

import { useEffect, useState, useRef } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { messaging } from "@/lib/firebase";
import { apiRequest } from "@/utils/api-client";
import { toast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";

// Project Settings > Cloud Messaging > Web configuration
const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_KEY;

const useFcmToken = () => {
  const { data: session, status } = useSession();
  const [notificationPermissionStatus, setNotificationPermissionStatus] =
    useState<NotificationPermission | "default">("default");

  // Ref to prevent spamming the backend with duplicate token syncs during re-renders
  const syncedTokenRef = useRef<string | null>(null);

  // --- 1. TOKEN RETRIEVAL & SYNC ---
  useEffect(() => {
    // Wait until NextAuth has fully loaded the session
    if (status === "loading") return;

    const retrieveToken = async () => {
      try {
        if (!VAPID_KEY) {
          console.error(
            "❌ FCM VAPID_KEY is missing from environment variables!",
          );
          return;
        }

        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
          // 1. Check/Request Permission
          const permission = await Notification.requestPermission();
          setNotificationPermissionStatus(permission);

          if (permission === "granted") {
            const msg = await messaging();
            if (!msg) return;

            // 2. Wait for your specific PWA Service Worker to be fully active
            const registration = await navigator.serviceWorker.ready;

            // 3. Get Token (Explicitly binding it to your PWA worker)
            const currentToken = await getToken(msg, {
              vapidKey: VAPID_KEY,
              serviceWorkerRegistration: registration,
            });

            if (currentToken) {
              // 4. Send to Backend ONLY if logged in and NOT already synced
              if (session?.user && syncedTokenRef.current !== currentToken) {
                await syncTokenWithBackend(currentToken, session.user.phone);
                syncedTokenRef.current = currentToken; // Mark as synced
              }
            }
          }
        }
      } catch (error) {
        console.error(
          "❌ An error occurred while retrieving FCM token:",
          error,
        );
      }
    };

    retrieveToken();
  }, [session, status]);

  // --- 2. FOREGROUND LISTENER ---
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupForegroundListener = async () => {
      try {
        const msg = await messaging();
        if (!msg) return;

        // Capture the unsubscribe function to prevent memory leaks
        unsubscribe = onMessage(msg, (payload) => {
          console.log("🔔 Foreground Message:", payload);
          toast({
            title: payload.notification?.title || "Новое уведомление",
            description: payload.notification?.body,
            variant: "default",
          });
        });
      } catch (error) {
        console.error("❌ Error setting up FCM foreground listener:", error);
      }
    };

    setupForegroundListener();

    // Cleanup the listener when the component unmounts
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [toast]); // Include toast in dependency array to satisfy React exhaustive-deps rules

  return { notificationPermissionStatus };
};

/**
 * Sends token to backend. Backend handles DB save AND Topic Subscriptions.
 */
async function syncTokenWithBackend(token: string, mobile?: string | null) {
  try {
    await apiRequest({
      method: "POST",
      url: "/api/fcm/save-fcm",
      data: { token, mobile },
    });
    console.log("✅ FCM Token synced with backend");
  } catch (error) {
    console.error("❌ Failed to sync FCM token:", error);
  }
}

export default useFcmToken;
