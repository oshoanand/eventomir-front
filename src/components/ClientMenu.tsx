// "use client";
// import React, { useState, useEffect } from "react";
// import Link from "next/link";
// import { useIsMobile } from "@/hooks/use-mobile";
// import { signOut } from "next-auth/react";
// import {
//   Sheet,
//   SheetContent,
//   SheetDescription,
//   SheetHeader,
//   SheetTitle,
//   SheetTrigger,
// } from "@/components/ui/sheet";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { Button } from "@/components/ui/button";
// import {
//   Menu,
//   ChevronDown,
//   User,
//   LogOut,
//   Heart,
//   Settings,
//   Briefcase,
//   Handshake,
//   Bell,
//   Ticket,
//   Calendar,
//   AlertCircle,
// } from "lucide-react";

// import { useNotification } from "@/components/providers/NotificationProvider";

// interface ClientMenuProps {
//   isLoggedIn: boolean;
//   userRole: "customer" | "performer" | "partner" | null;
//   userImage?: string | null;
//   onOpenChange?: (open: boolean) => void;
//   className?: string;
// }

// const ClientMenu: React.FC<ClientMenuProps> = ({
//   isLoggedIn,
//   userRole,
//   onOpenChange,
// }) => {
//   const isMobile = useIsMobile();
//   const [isMenuOpen, setIsMenuOpen] = useState(false);
//   const [isClient, setIsClient] = useState(false);
//   const { unreadCount } = useNotification();

//   useEffect(() => {
//     setIsClient(true);
//   }, []);

//   if (!isClient) return null;

//   const closeMenu = () => setIsMenuOpen(false);

//   const handleLogout = () => {
//     signOut({ callbackUrl: "/login" });
//     closeMenu();
//   };

//   const partnerAppUrl =
//     process.env.NEXT_PUBLIC_PARTNER_APP_URL || "http://localhost:3001";

//   const navLinks = [
//     { href: "/events", label: "Афиша" },
//     { href: "/search", label: "Поиск" },
//     { href: "/pricing", label: "Тарифы" },
//     { href: "/compare", label: "Сравнение" },
//     { href: "/blog", label: "Блог" },
//   ];

//   // --- Redirect to completion page if user has no role ---
//   const getProfileLink = () => {
//     if (isLoggedIn && !userRole) {
//       return {
//         href: "/complete-registration",
//         label: "Завершить регистрацию",
//         isPending: true,
//       };
//     }

//     switch (userRole) {
//       case "customer":
//         return {
//           href: "/customer-profile",
//           label: "Мой профиль",
//           isPending: false,
//         };
//       case "performer":
//         return {
//           href: "/performer-profile",
//           label: "Мой профиль",
//           isPending: false,
//         };
//       default:
//         return { href: "/", label: "Профиль", isPending: false };
//     }
//   };
//   const profileLink = getProfileLink();

//   const NotificationBell = () => (
//     <Link
//       href="/notifications"
//       className="relative flex items-center justify-center h-10 w-10 rounded-full hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all duration-200"
//     >
//       <Bell className="h-[20px] w-[20px]" strokeWidth={2} />
//       {unreadCount > 0 && (
//         <span className="absolute top-[6px] right-[8px] flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground ring-2 ring-background shadow-sm">
//           {unreadCount > 9 ? "9+" : unreadCount}
//         </span>
//       )}
//       <span className="sr-only">Уведомления</span>
//     </Link>
//   );

//   // --- МОБИЛЬНОЕ МЕНЮ ---
//   if (isMobile) {
//     return (
//       <div className="flex items-center gap-1">
//         {isLoggedIn && <NotificationBell />}
//         <Sheet
//           open={isMenuOpen}
//           onOpenChange={(open) => {
//             setIsMenuOpen(open);
//             if (onOpenChange) onOpenChange(open);
//           }}
//         >
//           <SheetTrigger asChild>
//             <Button variant="ghost" size="icon" className="hover:bg-muted/50">
//               <Menu className="h-6 w-6" />
//             </Button>
//           </SheetTrigger>
//           <SheetContent
//             side="left"
//             className="w-[300px] sm:w-[400px] flex flex-col"
//           >
//             <SheetHeader className="text-left border-b pb-4">
//               <SheetTitle>Навигация</SheetTitle>
//               <SheetDescription>
//                 Управляйте вашим событием вместе с Eventomir
//               </SheetDescription>
//             </SheetHeader>
//             <nav className="flex flex-col gap-4 py-6 flex-1 overflow-y-auto">
//               <div className="space-y-1">
//                 <p className="text-xs font-semibold text-muted-foreground uppercase px-2 mb-2">
//                   Разделы
//                 </p>
//                 {navLinks.map((link) => (
//                   <Link
//                     key={link.href}
//                     href={link.href}
//                     className="block px-3 py-2.5 text-base font-medium rounded-md hover:bg-accent transition-colors"
//                     onClick={closeMenu}
//                   >
//                     {link.label}
//                   </Link>
//                 ))}
//               </div>

//               <DropdownMenuSeparator />

//               {!isLoggedIn ? (
//                 <div className="space-y-3 pt-2">
//                   <p className="text-xs font-semibold text-muted-foreground uppercase px-2">
//                     Личный кабинет
//                   </p>
//                   <Button
//                     asChild
//                     variant="outline"
//                     className="w-full justify-start h-11"
//                     onClick={closeMenu}
//                   >
//                     <Link href="/login">Войти</Link>
//                   </Button>
//                   <div className="grid grid-cols-1 gap-2 pt-2">
//                     <p className="text-xs font-semibold text-muted-foreground uppercase px-2 mt-2">
//                       Регистрация
//                     </p>
//                     <Button
//                       asChild
//                       variant="destructive"
//                       className="w-full justify-start h-11"
//                       onClick={closeMenu}
//                     >
//                       <Link href="/register-customer">
//                         <User className="mr-2 h-4 w-4" /> Стать заказчиком
//                       </Link>
//                     </Button>
//                     <Button
//                       asChild
//                       variant="secondary"
//                       className="w-full justify-start h-11"
//                       onClick={closeMenu}
//                     >
//                       <Link href="/register-performer">
//                         <Briefcase className="mr-2 h-4 w-4" /> Стать
//                         исполнителем
//                       </Link>
//                     </Button>
//                     <Button
//                       asChild
//                       variant="ghost"
//                       className="w-full justify-start h-11 text-muted-foreground"
//                       onClick={closeMenu}
//                     >
//                       <Link href="/partnership">
//                         <Handshake className="mr-2 h-4 w-4" /> Партнерам
//                       </Link>
//                     </Button>
//                   </div>
//                 </div>
//               ) : (
//                 <div className="space-y-1 pt-2">
//                   <p className="text-xs font-semibold text-muted-foreground uppercase px-2 mb-2">
//                     Ваш аккаунт
//                   </p>
//                   <Link
//                     href={profileLink.href}
//                     className="flex items-center px-3 py-2.5 font-medium rounded-md focus:text-destructive focus:bg-destructive/10 cursor-pointer transition-colors"
//                     onClick={closeMenu}
//                   >
//                     {profileLink.isPending ? (
//                       <AlertCircle className="mr-2 h-4 w-4 text-destructive" />
//                     ) : (
//                       <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
//                     )}
//                     <span
//                       className={
//                         profileLink.isPending ? "text-destructive" : ""
//                       }
//                     >
//                       {profileLink.label}
//                     </span>
//                   </Link>

//                   {/* Both Customers and Performers can see "My Tickets" */}
//                   {userRole && (
//                     <Link
//                       href="/tickets"
//                       className="flex items-center px-3 py-2.5 text-base font-medium rounded-md hover:bg-accent transition-colors"
//                       onClick={closeMenu}
//                     >
//                       <Ticket className="mr-2 h-4 w-4 text-primary" /> Мои
//                       билеты
//                     </Link>
//                   )}

//                   {/* Only Customers see Favorites */}
//                   {userRole === "customer" && (
//                     <Link
//                       href="/favorites"
//                       className="flex items-center px-3 py-2.5 text-base font-medium rounded-md hover:bg-accent transition-colors"
//                       onClick={closeMenu}
//                     >
//                       <Heart className="mr-2 h-4 w-4 text-red-500" /> Избранное
//                     </Link>
//                   )}

//                   {/* Only Performers see Manage Events */}
//                   {userRole === "performer" && (
//                     <Link
//                       href="/manage-events"
//                       className="flex items-center px-3 py-2.5 text-base font-medium rounded-md hover:bg-accent transition-colors"
//                       onClick={closeMenu}
//                     >
//                       <Calendar className="mr-2 h-4 w-4 text-primary" /> Мои
//                       мероприятия
//                     </Link>
//                   )}

//                   <button
//                     className="flex w-full items-center text-left px-3 py-2.5 mt-2 text-base font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors"
//                     onClick={handleLogout}
//                   >
//                     <LogOut className="mr-2 h-4 w-4" /> Выйти
//                   </button>
//                 </div>
//               )}
//             </nav>
//           </SheetContent>
//         </Sheet>
//       </div>
//     );
//   }

//   // --- ДЕСКТОПНОЕ МЕНЮ ---
//   return (
//     <nav className="flex items-center gap-2 lg:gap-4">
//       <div className="flex items-center gap-1">
//         {navLinks.map((link) => (
//           <Button
//             key={link.href}
//             variant="ghost"
//             asChild
//             className="text-sm font-medium h-9 px-3 text-foreground/80 "
//           >
//             <Link href={link.href}>{link.label}</Link>
//           </Button>
//         ))}
//       </div>

//       <div className="h-6 w-px bg-border mx-2" />

//       {!isLoggedIn ? (
//         <div className="flex items-center gap-3">
//           <Button variant="ghost" asChild className="h-9 px-4 font-medium">
//             <Link href="/login">Войти</Link>
//           </Button>
//           <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <Button
//                 variant="destructive"
//                 className="h-9 px-4 font-medium shadow-md shadow-destructive/20 transition-all hover:shadow-lg hover:-translate-y-0.5"
//               >
//                 Регистрация <ChevronDown className="ml-2 h-4 w-4 opacity-70" />
//               </Button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent align="end" className="w-56">
//               <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
//                 Создать аккаунт
//               </DropdownMenuLabel>
//               <DropdownMenuSeparator />
//               <DropdownMenuItem asChild className="cursor-pointer py-3">
//                 <Link href="/register-customer" className="flex items-center">
//                   <User className="mr-2 h-4 w-4" /> Я заказчик
//                 </Link>
//               </DropdownMenuItem>
//               <DropdownMenuItem asChild className="cursor-pointer py-3">
//                 <Link href="/register-performer" className="flex items-center">
//                   <Briefcase className="mr-2 h-4 w-4" /> Я исполнитель
//                 </Link>
//               </DropdownMenuItem>
//               <DropdownMenuSeparator />
//               <DropdownMenuItem
//                 asChild
//                 className="cursor-pointer py-2 focus:bg-accent rounded-md"
//               >
//                 <Link
//                   href={partnerAppUrl}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="flex items-center text-muted-foreground"
//                 >
//                   <Handshake className="mr-2 h-4 w-4" /> Партнерская программа
//                 </Link>
//               </DropdownMenuItem>
//             </DropdownMenuContent>
//           </DropdownMenu>
//         </div>
//       ) : (
//         <div className="flex items-center gap-3">
//           <NotificationBell />
//           <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <Button
//                 variant="outline"
//                 className={`h-10 gap-2 pl-2 pr-3 rounded-full border-border/60 transition-colors ${
//                   profileLink.isPending
//                     ? "border-destructive text-destructive hover:bg-destructive/10"
//                     : "hover:bg-muted/50"
//                 }`}
//               >
//                 <div
//                   className={`h-7 w-7 rounded-full flex items-center justify-center ${profileLink.isPending ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}
//                 >
//                   {profileLink.isPending ? (
//                     <AlertCircle className="h-4 w-4" />
//                   ) : (
//                     <User className="h-4 w-4" />
//                   )}
//                 </div>
//                 <span className="max-w-[150px] truncate font-medium text-sm">
//                   {profileLink.label}
//                 </span>
//                 <ChevronDown className="h-4 w-4 opacity-50" />
//               </Button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent align="end" className="w-56 p-2">
//               <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
//                 Управление
//               </DropdownMenuLabel>
//               <DropdownMenuSeparator />

//               <DropdownMenuItem
//                 asChild
//                 className="cursor-pointer py-2.5 rounded-md focus:text-destructive focus:bg-destructive/10 "
//               >
//                 <Link href={profileLink.href}>
//                   {profileLink.isPending ? (
//                     <AlertCircle className="mr-2 h-4 w-4 text-destructive" />
//                   ) : (
//                     <Settings className="mr-2 h-4 w-4 text-primary" />
//                   )}
//                   <span
//                     className={
//                       profileLink.isPending
//                         ? "text-destructive font-medium"
//                         : ""
//                     }
//                   >
//                     {profileLink.label}
//                   </span>
//                 </Link>
//               </DropdownMenuItem>

//               {/* Both Customers and Performers can see "My Tickets" */}
//               {userRole && (
//                 <DropdownMenuItem
//                   asChild
//                   className="cursor-pointer py-2.5 rounded-md focus:text-destructive focus:bg-destructive/10 "
//                 >
//                   <Link href="/tickets">
//                     <Ticket className="mr-2 h-4 w-4 text-primary" /> Мои билеты
//                   </Link>
//                 </DropdownMenuItem>
//               )}

//               {/* Only Customers see Favorites */}
//               {userRole === "customer" && (
//                 <DropdownMenuItem
//                   asChild
//                   className="cursor-pointer py-2.5 rounded-md focus:text-destructive focus:bg-destructive/10 "
//                 >
//                   <Link href="/favorites">
//                     <Heart className="mr-2 h-4 w-4 text-primary" /> Избранное
//                   </Link>
//                 </DropdownMenuItem>
//               )}

//               {/* Only Performers see Manage Events */}
//               {userRole === "performer" && (
//                 <DropdownMenuItem
//                   asChild
//                   className="cursor-pointer py-2.5 rounded-md"
//                 >
//                   <Link href="/manage-events">
//                     <Calendar className="mr-2 h-4 w-4 text-primary" /> Мои
//                     мероприятия
//                   </Link>
//                 </DropdownMenuItem>
//               )}

//               <DropdownMenuSeparator />
//               <DropdownMenuItem
//                 className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer py-2.5 rounded-md"
//                 onClick={handleLogout}
//               >
//                 <LogOut className="mr-2 h-4 w-4" /> Выйти
//               </DropdownMenuItem>
//             </DropdownMenuContent>
//           </DropdownMenu>
//         </div>
//       )}
//     </nav>
//   );
// };

// export default ClientMenu;

"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useIsMobile } from "@/hooks/use-mobile";
import { signOut } from "next-auth/react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Menu,
  ChevronDown,
  User,
  LogOut,
  Heart,
  Settings,
  Briefcase,
  Bell,
  Ticket,
  Calendar,
  AlertCircle,
  LayoutGrid,
  Search,
} from "lucide-react";

import { useNotification } from "@/components/providers/NotificationProvider";

interface ClientMenuProps {
  isLoggedIn: boolean;
  userRole: "customer" | "performer" | "partner" | null;
  userImage?: string | null;
  onOpenChange?: (open: boolean) => void;
}

const ClientMenu: React.FC<ClientMenuProps> = ({
  isLoggedIn,
  userRole,
  onOpenChange,
}) => {
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { unreadCount } = useNotification();

  useEffect(() => setIsClient(true), []);

  if (!isClient) return null;

  const closeMenu = () => setIsMenuOpen(false);
  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
    closeMenu();
  };

  const navLinks = [
    { href: "/events", label: "Афиша", icon: Calendar },
    { href: "/search", label: "Поиск", icon: Search },
    { href: "/pricing", label: "Тарифы", icon: Ticket },
    { href: "/blog", label: "Блог", icon: LayoutGrid },
  ];

  const getProfileLink = () => {
    if (isLoggedIn && !userRole)
      return {
        href: "/complete-registration",
        label: "Завершить регистрацию",
        isPending: true,
      };
    if (userRole === "customer")
      return {
        href: "/customer-profile",
        label: "Мой профиль",
        isPending: false,
      };
    if (userRole === "performer")
      return {
        href: "/performer-profile",
        label: "Мой профиль",
        isPending: false,
      };
    return { href: "/", label: "Профиль", isPending: false };
  };
  const profileLink = getProfileLink();

  const NotificationBell = () => (
    <Link
      href="/notifications"
      className="relative flex items-center justify-center h-10 w-10 rounded-full hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-all"
    >
      <Bell className="h-5 w-5" strokeWidth={2} />
      {unreadCount > 0 && (
        <span className="absolute top-[4px] right-[4px] flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white ring-2 ring-background">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );

  // --- MOBILE MENU ---
  if (isMobile) {
    return (
      <div className="flex items-center gap-1">
        {isLoggedIn && <NotificationBell />}
        <Sheet
          open={isMenuOpen}
          onOpenChange={(open) => {
            setIsMenuOpen(open);
            if (onOpenChange) onOpenChange(open);
          }}
        >
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-10 w-10 hover:bg-muted"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-[85vw] max-w-[400px] flex flex-col p-0 border-l"
          >
            <SheetHeader className="text-left border-b p-6 bg-muted/10">
              <SheetTitle className="text-xl">Меню</SheetTitle>
            </SheetHeader>

            <nav className="flex flex-col px-4 py-6 flex-1 overflow-y-auto gap-8">
              {/* Account / Registration Section */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2 mb-3">
                  Ваш аккаунт
                </p>

                {!isLoggedIn ? (
                  <div className="flex flex-col gap-3">
                    <Button
                      asChild
                      className="w-full h-12 justify-start rounded-xl"
                      onClick={closeMenu}
                    >
                      <Link href="/login">
                        <User className="mr-3 h-5 w-5" /> Войти в профиль
                      </Link>
                    </Button>

                    <div className="border-t my-2 pt-2"></div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2 mb-1">
                      Создать аккаунт
                    </p>

                    <Button
                      asChild
                      variant="outline"
                      className="w-full h-12 justify-start rounded-xl border-primary/20 hover:bg-primary/5"
                      onClick={closeMenu}
                    >
                      <Link href="/register-customer">
                        <User className="mr-3 h-5 w-5 text-primary" /> Я
                        заказчик
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="w-full h-12 justify-start rounded-xl border-primary/20 hover:bg-primary/5"
                      onClick={closeMenu}
                    >
                      <Link href="/register-performer">
                        <Briefcase className="mr-3 h-5 w-5 text-primary" /> Я
                        исполнитель
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link
                      href={profileLink.href}
                      className="flex items-center px-4 py-4 font-medium rounded-xl bg-muted/40 hover:bg-muted transition-colors"
                      onClick={closeMenu}
                    >
                      {profileLink.isPending ? (
                        <AlertCircle className="mr-3 h-5 w-5 text-destructive" />
                      ) : (
                        <Settings className="mr-3 h-5 w-5 text-primary" />
                      )}
                      <span
                        className={`text-lg ${profileLink.isPending ? "text-destructive font-bold" : ""}`}
                      >
                        {profileLink.label}
                      </span>
                    </Link>

                    {userRole && (
                      <Link
                        href="/tickets"
                        className="flex items-center px-4 py-3.5 text-base font-medium rounded-xl hover:bg-muted transition-colors"
                        onClick={closeMenu}
                      >
                        <Ticket className="mr-3 h-5 w-5 text-muted-foreground" />{" "}
                        Мои билеты
                      </Link>
                    )}

                    {userRole === "customer" && (
                      <Link
                        href="/favorites"
                        className="flex items-center px-4 py-3.5 text-base font-medium rounded-xl hover:bg-muted transition-colors"
                        onClick={closeMenu}
                      >
                        <Heart className="mr-3 h-5 w-5 text-red-500" />{" "}
                        Избранное
                      </Link>
                    )}

                    {userRole === "performer" && (
                      <Link
                        href="/manage-events"
                        className="flex items-center px-4 py-3.5 text-base font-medium rounded-xl hover:bg-muted transition-colors"
                        onClick={closeMenu}
                      >
                        <Calendar className="mr-3 h-5 w-5 text-primary" /> Мои
                        мероприятия
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* Navigation Section */}
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2 mb-3">
                  Навигация
                </p>
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center px-4 py-3.5 text-base font-medium rounded-xl hover:bg-muted transition-colors"
                      onClick={closeMenu}
                    >
                      <Icon className="mr-3 h-5 w-5 text-muted-foreground" />{" "}
                      {link.label}
                    </Link>
                  );
                })}
              </div>

              {/* Logout */}
              {isLoggedIn && (
                <div className="mt-auto pt-6 border-t">
                  <button
                    className="flex w-full items-center text-left px-4 py-4 text-base font-medium text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-3 h-5 w-5" /> Выйти из аккаунта
                  </button>
                </div>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  // --- DESKTOP MENU ---
  return (
    <nav className="flex items-center gap-2">
      <div className="flex items-center gap-1 mr-4">
        {navLinks.map((link) => (
          <Button
            key={link.href}
            variant="ghost"
            asChild
            className="text-sm font-semibold h-10 px-4 rounded-full text-foreground/80 hover:text-foreground"
          >
            <Link href={link.href}>{link.label}</Link>
          </Button>
        ))}
      </div>

      <div className="h-6 w-px bg-border mx-2" />

      {!isLoggedIn ? (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            asChild
            className="h-10 px-5 font-semibold rounded-full hover:bg-muted"
          >
            <Link href="/login">Войти</Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="h-10 px-6 font-bold rounded-full shadow-sm hover:shadow-md transition-all">
                Регистрация <ChevronDown className="ml-2 h-4 w-4 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 p-2 rounded-xl mt-2"
            >
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                Кем вы хотите стать?
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem
                asChild
                className="cursor-pointer py-3 rounded-lg focus:bg-muted"
              >
                <Link href="/register-customer" className="flex items-center">
                  <User className="mr-3 h-4 w-4 text-primary" />
                  <span className="font-medium">Я заказчик</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem
                asChild
                className="cursor-pointer py-3 rounded-lg focus:bg-muted"
              >
                <Link href="/register-performer" className="flex items-center">
                  <Briefcase className="mr-3 h-4 w-4 text-primary" />
                  <span className="font-medium">Я исполнитель</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <NotificationBell />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className={`h-10 gap-2 pl-2 pr-3 rounded-full border-border/60 transition-colors ${profileLink.isPending ? "border-destructive text-destructive hover:bg-destructive/10" : "hover:bg-muted/80"}`}
              >
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center ${profileLink.isPending ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}
                >
                  {profileLink.isPending ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </div>
                <span className="max-w-[150px] truncate font-medium text-sm">
                  {profileLink.label}
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 p-2 rounded-xl mt-2"
            >
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                Управление
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem
                asChild
                className="cursor-pointer py-2.5 rounded-lg focus:bg-muted"
              >
                <Link href={profileLink.href}>
                  {profileLink.isPending ? (
                    <AlertCircle className="mr-2 h-4 w-4 text-destructive" />
                  ) : (
                    <Settings className="mr-2 h-4 w-4 text-primary" />
                  )}
                  <span
                    className={
                      profileLink.isPending
                        ? "text-destructive font-medium"
                        : ""
                    }
                  >
                    {profileLink.label}
                  </span>
                </Link>
              </DropdownMenuItem>

              {userRole && (
                <DropdownMenuItem
                  asChild
                  className="cursor-pointer py-2.5 rounded-lg focus:bg-muted"
                >
                  <Link href="/tickets">
                    <Ticket className="mr-2 h-4 w-4 text-muted-foreground" />{" "}
                    Мои билеты
                  </Link>
                </DropdownMenuItem>
              )}

              {userRole === "customer" && (
                <DropdownMenuItem
                  asChild
                  className="cursor-pointer py-2.5 rounded-lg focus:bg-muted"
                >
                  <Link href="/favorites">
                    <Heart className="mr-2 h-4 w-4 text-red-500" /> Избранное
                  </Link>
                </DropdownMenuItem>
              )}

              {userRole === "performer" && (
                <DropdownMenuItem
                  asChild
                  className="cursor-pointer py-2.5 rounded-lg focus:bg-muted"
                >
                  <Link href="/manage-events">
                    <Calendar className="mr-2 h-4 w-4 text-primary" /> Мои
                    мероприятия
                  </Link>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer py-2.5 rounded-lg"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" /> Выйти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </nav>
  );
};

export default ClientMenu;
