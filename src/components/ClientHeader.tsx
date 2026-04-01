// // "use client";

// // import Link from "next/link";
// // import React, { useState } from "react";
// // import dynamic from "next/dynamic";
// // import { useSession } from "next-auth/react";
// // import { Button } from "@/components/ui/button";
// // import { Search } from "lucide-react";
// // import { useRouter } from "next/navigation";
// // import { Input } from "@/components/ui/input";

// // const ClientMenu = dynamic(() => import("@/components/ClientMenu"), {
// //   ssr: false,
// // });

// // function ClientHeader() {
// //   const { data: session, status } = useSession();
// //   const isLoggedIn = status === "authenticated";
// //   const userRole = session?.user?.role as any;
// //   const userImage = session?.user?.image;

// //   const router = useRouter();
// //   const [searchQuery, setSearchQuery] = useState("");

// //   // Handle global search submission
// //   const handleSearch = (e: React.FormEvent) => {
// //     e.preventDefault();
// //     if (searchQuery.trim()) {
// //       router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
// //     } else {
// //       router.push("/search");
// //     }
// //   };

// //   return (
// //     <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm transition-all duration-300">
// //       <div className="container mx-auto flex h-16 items-center justify-between px-4">
// //         {/* Left Section: Logo & Desktop Search */}
// //         <div className="flex items-center gap-6 w-full md:w-auto">
// //           <Link
// //             href="/"
// //             className="text-xl font-bold tracking-tighter text-foreground hover:text-primary transition-colors"
// //           >
// //             Eventomir
// //           </Link>

// //           {/* Desktop Search Bar */}
// //           <form
// //             onSubmit={handleSearch}
// //             className="hidden md:flex relative group w-[280px] lg:w-[320px]"
// //           >
// //             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
// //             <Input
// //               type="search"
// //               placeholder="Найти исполнителя, услугу или город..."
// //               className="w-full rounded-full bg-muted/50 pl-10 pr-4 border-transparent focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-all"
// //               value={searchQuery}
// //               onChange={(e) => setSearchQuery(e.target.value)}
// //             />
// //           </form>
// //         </div>

// //         {/* Right Section: Icons & Menu */}
// //         <div className="flex items-center gap-1 sm:gap-2">
// //           {/* Mobile Search Icon (Hidden on Desktop) */}
// //           <Link href="/search" className="md:hidden">
// //             <Button
// //               variant="ghost"
// //               size="icon"
// //               className="text-muted-foreground hover:text-foreground rounded-full"
// //             >
// //               <Search className="h-5 w-5" />
// //               <span className="sr-only">Поиск</span>
// //             </Button>
// //           </Link>

// //           <ClientMenu
// //             isLoggedIn={isLoggedIn}
// //             userRole={userRole}
// //             userImage={userImage}
// //           />
// //         </div>
// //       </div>
// //     </header>
// //   );
// // }

// // export default ClientHeader;

// "use client";

// import Link from "next/link";
// import React, { useState, useEffect, useContext } from "react";
// import dynamic from "next/dynamic";
// import { useSession } from "next-auth/react";
// import { useRouter } from "next/navigation";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Search, Bell } from "lucide-react";
// import { SettingsContext } from "@/lib/providers";
// import { getCurrentUser } from "@/services/auth";
// import { getNotifications } from "@/services/notifications";

// const ClientMenu = dynamic(() => import("@/components/ClientMenu"), {
//   ssr: false,
// });

// function ClientHeader() {
//   const settings = useContext(SettingsContext);
//   const router = useRouter();

//   const { data: session, status } = useSession();
//   const isLoggedIn = status === "authenticated";
//   const userRole = session?.user?.role as any;
//   const userImage = session?.user?.image;

//   // const [isLoggedIn, setIsLoggedIn] = useState(false);
//   // const [userRole, setUserRole] = useState<
//   //   "customer" | "performer" | "admin" | "support" | "partner" | null
//   // >(null);
//   // const [userImage, setUserImage] = useState<string | null>(null);
//   const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
//   const [searchQuery, setSearchQuery] = useState("");

//   // // Проверка сессии и уведомлений на клиенте
//   // useEffect(() => {
//   //   const checkUserSession = async () => {
//   //     try {
//   //       const user = await getCurrentUser();
//   //       if (user) {
//   //         setIsLoggedIn(true);
//   //         setUserRole(user.role as any);
//   //         setUserImage(user.avatar || user.image || null); // Адаптируйте под вашу модель юзера

//   //         const notifications = await getNotifications(user.id);
//   //         setUnreadNotificationsCount(
//   //           notifications.filter((n: any) => !n.read).length,
//   //         );
//   //       } else {
//   //         setIsLoggedIn(false);
//   //         setUserRole(null);
//   //         setUserImage(null);
//   //       }
//   //     } catch (e) {
//   //       console.warn("Не удалось проверить сессию пользователя на клиенте.");
//   //       setIsLoggedIn(false);
//   //       setUserRole(null);
//   //       setUserImage(null);
//   //     }
//   //   };
//   //   checkUserSession();
//   // }, []);

//   // Обработчик глобального поиска
//   // const handleSearch = (e: React.FormEvent) => {
//   //   e.preventDefault();
//   //   if (searchQuery.trim()) {
//   //     router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
//   //   } else {
//   //     router.push("/search");
//   //   }
//   // };

//   return (
//     <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm transition-all duration-300">
//       <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
//         {/* Левая часть: Логотип и Поиск (Десктоп) */}
//         <div className="flex items-center gap-6 md:gap-10 w-full md:w-auto">
//           <Link
//             href="/"
//             className="text-xl font-bold tracking-tighter text-foreground hover:text-primary transition-colors"
//           >
//             {settings?.siteName || "Eventomir"}
//           </Link>

//           {/* Десктопная строка поиска */}
//           {/* <form
//             onSubmit={handleSearch}
//             className="hidden md:flex relative group w-[280px] lg:w-[400px]"
//           >
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
//             <Input
//               type="search"
//               placeholder="Найти исполнителя, услугу или город..."
//               className="w-full rounded-full bg-muted/50 pl-10 pr-4 border-transparent focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary transition-all"
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//             />
//           </form> */}
//         </div>

//         {/* Правая часть: Иконки и Меню */}
//         <div className="flex items-center gap-1 sm:gap-2">
//           {/* Иконка поиска для мобильных (Скрыта на десктопе) */}
//           <Link href="/search" className="md:hidden">
//             <Button
//               variant="ghost"
//               size="icon"
//               className="text-muted-foreground hover:text-foreground rounded-full"
//             >
//               <Search className="h-5 w-5" />
//               <span className="sr-only">Поиск</span>
//             </Button>
//           </Link>

//           {/* Элегантный колокольчик уведомлений */}
//           {/* {isLoggedIn && (
//             <Link
//               href="/notifications"
//               className="relative flex items-center justify-center h-10 w-10 rounded-full hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all duration-200 mr-1"
//             >
//               <Bell className="h-[20px] w-[20px]" strokeWidth={2} />
//               {unreadNotificationsCount > 0 && (
//                 <span className="absolute top-[6px] right-[8px] flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground ring-2 ring-background shadow-sm">
//                   {unreadNotificationsCount > 9
//                     ? "9+"
//                     : unreadNotificationsCount}
//                 </span>
//               )}
//               <span className="sr-only">Уведомления</span>
//             </Link>
//           )} */}

//           {/* Меню профиля и навигация */}
//           <ClientMenu
//             isLoggedIn={isLoggedIn}
//             userRole={userRole}
//             userImage={userImage} // Передаем картинку, если ClientMenu её поддерживает
//           />
//         </div>
//       </div>
//     </header>
//   );
// }

// export default ClientHeader;

"use client";

import Link from "next/link";
import React, { useState, useContext } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { SettingsContext } from "@/lib/providers";

const ClientMenu = dynamic(() => import("@/components/ClientMenu"), {
  ssr: false,
});

function ClientHeader() {
  const settings = useContext(SettingsContext);
  const router = useRouter();

  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";
  const userRole = session?.user?.role as any;
  const userImage = session?.user?.image;

  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/search");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60 transition-all duration-300">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-6 md:gap-10 w-full md:w-auto">
          <Link
            href="/"
            className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70 transition-colors"
          >
            {settings?.siteName || "Eventomir"}
          </Link>

          <form
            onSubmit={handleSearch}
            className="hidden lg:flex relative group w-[300px] xl:w-[450px]"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              type="search"
              placeholder="Кого вы ищете?"
              className="w-full rounded-full bg-muted/40 hover:bg-muted/80 pl-10 pr-4 border-transparent focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all h-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>

        {/* Right: Mobile Search Icon & Profile Menu */}
        <div className="flex items-center gap-2">
          <Link href="/search" className="lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground rounded-full"
            >
              <Search className="h-5 w-5" />
              <span className="sr-only">Поиск</span>
            </Button>
          </Link>

          {/* User Menu Handles the Logic for Login/Registration */}
          <ClientMenu
            isLoggedIn={isLoggedIn}
            userRole={userRole}
            userImage={userImage}
          />
        </div>
      </div>
    </header>
  );
}

export default ClientHeader;
