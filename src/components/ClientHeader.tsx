// "use client";

// import Link from "next/link";
// import React, { useState, useEffect, useContext } from "react";
// import dynamic from "next/dynamic";
// import { useSession } from "next-auth/react";
// import { Button } from "@/components/ui/button";
// import { Bell } from "@/components/icons";
// import { Badge } from "@/components/ui/badge";
// // import { SettingsContext } from '@/lib/providers';
// import { getNotifications } from "@/services/notifications";

// const ClientMenu = dynamic(() => import("@/components/ClientMenu"), {
//   ssr: false,
// });

// function ClientHeader() {
//   // const settings = useContext(SettingsContext);
//   const { data: session, status } = useSession();
//   const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

//   const isLoggedIn = status === "authenticated";
//   const userRole = session?.user?.role as any;

//   useEffect(() => {
//     if (isLoggedIn && session?.user?.id) {
//       const fetchNotifications = async () => {
//         try {
//           const notifications = await getNotifications(session.user.id);
//           setUnreadNotificationsCount(
//             notifications.filter((n) => !n.read).length,
//           );
//         } catch (error) {
//           console.warn("Failed to fetch notifications on client.");
//         }
//       };
//       fetchNotifications();
//     }
//   }, [isLoggedIn, session?.user?.id]);

//   return (
//     <header className="bg-secondary text-secondary-foreground py-4">
//       <div className="container mx-auto flex justify-between items-center px-4">
//         <Link href="/" className="text-lg font-semibold">
//           Eventomir
//         </Link>

//         <div className="flex items-center gap-4">
//           <ClientMenu isLoggedIn={isLoggedIn} userRole={userRole} />

//           {isLoggedIn && (
//             <Link href="/notifications">
//               <Button variant="ghost" size="icon" className="relative">
//                 <Bell className="h-5 w-5" />
//                 {unreadNotificationsCount > 0 && (
//                   <Badge
//                     variant="destructive"
//                     className="absolute -top-1 -right-1 h-4 w-4 min-w-4 p-0 flex items-center justify-center rounded-full text-xs"
//                   >
//                     {unreadNotificationsCount > 9
//                       ? "9+"
//                       : unreadNotificationsCount}
//                   </Badge>
//                 )}
//                 <span className="sr-only">Уведомления</span>
//               </Button>
//             </Link>
//           )}
//         </div>
//       </div>
//     </header>
//   );
// }

// export default ClientHeader;

"use client";

import Link from "next/link";
import React from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNotification } from "@/context/NotificationContext";

const ClientMenu = dynamic(() => import("@/components/ClientMenu"), {
  ssr: false,
});

function ClientHeader() {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";
  const userRole = session?.user?.role as any;
  const userImage = session?.user?.image; // Assuming you have image in session

  // Consume Context
  const { unreadCount } = useNotification();

  return (
    <header className="bg-secondary text-secondary-foreground py-4 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto flex justify-between items-center px-4">
        <Link href="/" className="text-lg font-semibold">
          Eventomir
        </Link>

        <div className="flex items-center gap-4">
          <ClientMenu
            isLoggedIn={isLoggedIn}
            userRole={userRole}
            userImage={userImage}
          />

          {isLoggedIn && (
            <Link href="/notifications">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-4 w-4 min-w-[16px] p-0 flex items-center justify-center rounded-full text-[10px]"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
                <span className="sr-only">Уведомления</span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export default ClientHeader;
