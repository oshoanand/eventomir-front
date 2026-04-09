importScripts(
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js",
);

// 1. Initialize Firebase inside the Service Worker
const firebaseConfig = {
  apiKey: "AIzaSyAEFVxhBdqjvecjA_aj5TAD8lI30NPFglU",
  authDomain: "zepo-c03d7.firebaseapp.com",
  projectId: "zepo-c03d7",
  storageBucket: "zepo-c03d7.firebasestorage.app",
  messagingSenderId: "465436463784",
  appId: "1:465436463784:web:d663dcaf80d8a84d29289d",
  measurementId: "G-5NCKNW2SR4",
};

firebase.initializeApp(firebaseConfig);

// 2. Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

// 3. Handle Background Messages
messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload,
  );

  // 🚨 FIX 1 & 2: Prevent Double Notifications & Crashes
  // If the payload contains a 'notification' object, Firebase's SDK displays it automatically.
  // We only manually show the notification if the backend sent a DATA-ONLY message.
  if (payload.notification) {
    // Return early to let the Firebase SDK handle the UI automatically
    return;
  }

  // Handle DATA-ONLY payloads manually
  const notificationTitle = payload.data?.title || "Новое уведомление";
  const notificationOptions = {
    body: payload.data?.body || "",
    icon: "/icons/icon-192.png", // Make sure this exists in your public folder
    badge: "/icons/badge.png", // Make sure this exists in your public folder
    data: { url: payload.data?.click_action || payload.data?.url || "/" },
  };

  return self.registration.showNotification(
    notificationTitle,
    notificationOptions,
  );
});

// 4. Handle Notification Click (Smart Tab Focusing)
self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  // Determine the URL to open (fallback to root if not provided)
  const urlToOpen = event.notification.data?.url || "/";

  // 🚨 FIX 3: Check if the PWA/Tab is already open. If yes, focus it. If not, open a new window.
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // 1. Check if there is already a window/tab open with the target app
        for (let i = 0; i < windowClients.length; i++) {
          const client = windowClients[i];
          // If the app is open (we check origin to be safe) and can be focused
          if (client.url.includes(self.location.origin) && "focus" in client) {
            // Optionally navigate the existing client to the specific URL
            client.navigate(urlToOpen);
            return client.focus();
          }
        }

        // 2. If no window is open, launch a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      }),
  );
});
