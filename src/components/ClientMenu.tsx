// "use client";

// import Link from "next/link";
// import { useIsMobile } from "@/hooks/use-mobile";
// import { signOut } from "next-auth/react"; // Import signOut
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
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Menu, User, LogOut, LayoutDashboard } from "lucide-react";
// import React, { useState, useEffect } from "react";

// interface ClientMenuProps {
//   isLoggedIn: boolean;
//   userRole: "customer" | "performer" | "admin" | "support" | "partner" | null;
//   userImage?: string | null;
//   onOpenChange?: (open: boolean) => void;
//   className?: string;
// }

// const ClientMenu: React.FC<ClientMenuProps> = ({
//   isLoggedIn,
//   userRole,
//   userImage,
//   onOpenChange,
// }) => {
//   const isMobile = useIsMobile();
//   const [isMenuOpen, setIsMenuOpen] = useState(false);
//   const [isClient, setIsClient] = useState(false);

//   useEffect(() => {
//     setIsClient(true);
//   }, []);

//   // --- Logic: Determine Profile Link based on Role ---
//   const getProfileLink = () => {
//     switch (userRole) {
//       case "performer":
//         return "/performer-profile";
//       case "customer":
//         return "/customer-profile";
//       case "partner":
//         return "/partner-dashboard";
//       case "admin":
//         return "/admin";
//       case "support":
//         return "/support";
//       default:
//         return "/";
//     }
//   };

//   const profileHref = getProfileLink();

//   // --- Logic: Handle Logout ---
//   const handleLogout = () => {
//     signOut({ callbackUrl: "/login" }); // Redirect to login after logout
//   };

//   // --- Menu Config ---
//   const menuLinks = [
//     { href: "/search", label: "Поиск", alwaysVisible: true },
//     { href: "/pricing", label: "Тарифы", alwaysVisible: true },
//     { href: "/compare", label: "Сравнение", alwaysVisible: true },
//     { href: "/about", label: "О нас", alwaysVisible: true },
//     { href: "/blog", label: "Блог", alwaysVisible: true },
//     { href: "/login", label: "Войти", guestOnly: true },
//     {
//       href: "/register-performer",
//       label: "Стать исполнителем",
//       guestOnly: true,
//     },
//     { href: "/register-customer", label: "Стать заказчиком", guestOnly: true },
//     { href: "/favorites", label: "Избранное", role: "customer" },
//     { href: "/admin", label: "Админ", role: "admin" },
//     { href: "/partner-dashboard", label: "Кабинет партнера", role: "partner" },
//   ];

//   const closeMenu = () => setIsMenuOpen(false);

//   if (!isClient) return null;

//   const filteredLinks = menuLinks.filter((link) => {
//     if (link.alwaysVisible) return true;
//     if (link.guestOnly) return !isLoggedIn;
//     if (link.role) return isLoggedIn && userRole === link.role;
//     return false;
//   });

//   // --- Component: Profile Dropdown Avatar ---
//   const ProfileDropdown = () => (
//     <DropdownMenu>
//       <DropdownMenuTrigger asChild>
//         <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
//           <Avatar className="h-9 w-9 transition-opacity hover:opacity-80 border border-border">
//             <AvatarImage
//               src={userImage || ""}
//               alt="Profile"
//               className="object-cover"
//             />
//             <AvatarFallback className="bg-primary/10 text-primary">
//               <User className="h-4 w-4" />
//             </AvatarFallback>
//           </Avatar>
//         </Button>
//       </DropdownMenuTrigger>
//       <DropdownMenuContent className="w-56" align="end" forceMount>
//         <DropdownMenuLabel className="font-normal">
//           <div className="flex flex-col space-y-1">
//             <p className="text-sm font-medium leading-none">Мой аккаунт</p>
//             <p className="text-xs leading-none text-muted-foreground capitalize">
//               {userRole === "performer"
//                 ? "Исполнитель"
//                 : userRole === "customer"
//                   ? "Заказчик"
//                   : userRole}
//             </p>
//           </div>
//         </DropdownMenuLabel>
//         <DropdownMenuSeparator />

//         {/* Option 1: Profile Dashboard */}
//         <DropdownMenuItem asChild>
//           <Link
//             href={profileHref}
//             onClick={closeMenu}
//             className="cursor-pointer"
//           >
//             <LayoutDashboard className="mr-2 h-4 w-4" />
//             <span>Личный кабинет</span>
//           </Link>
//         </DropdownMenuItem>

//         <DropdownMenuSeparator />

//         {/* Option 2: Logout */}
//         <DropdownMenuItem
//           onClick={handleLogout}
//           className="text-red-600 focus:text-red-600 cursor-pointer"
//         >
//           <LogOut className="mr-2 h-4 w-4" />
//           <span>Выйти</span>
//         </DropdownMenuItem>
//       </DropdownMenuContent>
//     </DropdownMenu>
//   );

//   // --- MOBILE VIEW ---
//   if (isMobile) {
//     return (
//       <Sheet
//         open={isMenuOpen}
//         onOpenChange={(open) => {
//           setIsMenuOpen(open);
//           if (onOpenChange) onOpenChange(open);
//         }}
//       >
//         <SheetTrigger asChild>
//           <Button variant="ghost" size="icon">
//             <Menu className="h-5 w-5" />
//           </Button>
//         </SheetTrigger>

//         <SheetContent side="left" className="w-3/4 bg-secondary flex flex-col">
//           <SheetHeader>
//             <SheetTitle>Меню</SheetTitle>
//             <SheetDescription>Навигация по сайту.</SheetDescription>
//           </SheetHeader>

//           <nav className="grid gap-4 py-4 flex-1">
//             {filteredLinks.map((link) => (
//               <Link
//                 key={link.href}
//                 href={link.href}
//                 className="block px-2 py-1 text-lg rounded hover:bg-accent hover:text-accent-foreground"
//                 onClick={closeMenu}
//               >
//                 {link.label}
//               </Link>
//             ))}
//           </nav>

//           {/* Profile at the bottom of mobile menu */}
//           {isLoggedIn && (
//             <div className="border-t pt-4 px-2 pb-4">
//               <div className="flex items-center justify-between">
//                 <span className="text-sm font-medium text-muted-foreground">
//                   Профиль
//                 </span>
//                 <ProfileDropdown />
//               </div>
//             </div>
//           )}
//         </SheetContent>
//       </Sheet>
//     );
//   }

//   // --- DESKTOP VIEW ---
//   return (
//     <nav className="flex items-center gap-6">
//       {filteredLinks.map((link) => (
//         <Link
//           key={link.href}
//           href={link.href}
//           className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
//         >
//           {link.label}
//         </Link>
//       ))}

//       {isLoggedIn && (
//         <div className="ml-2">
//           <ProfileDropdown />
//         </div>
//       )}
//     </nav>
//   );
// };

// export default ClientMenu;

"use client";

import Link from "next/link";
import { useIsMobile } from "@/hooks/use-mobile";
import { signOut } from "next-auth/react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, User, LogOut, LayoutDashboard } from "lucide-react";
import React, { useState, useEffect } from "react";

interface ClientMenuProps {
  isLoggedIn: boolean;
  userRole: "customer" | "performer" | "admin" | "support" | null;
  userImage?: string | null;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

const ClientMenu: React.FC<ClientMenuProps> = ({
  isLoggedIn,
  userRole,
  userImage,
  onOpenChange,
}) => {
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const getProfileLink = () => {
    switch (userRole) {
      case "performer":
        return "/performer-profile";
      case "customer":
        return "/customer-profile";
      case "admin":
        return "/admin";
      case "support":
        return "/support";
      default:
        return "/";
    }
  };

  const profileHref = getProfileLink();

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  // Environment variable for the partner app, defaulting to localhost:3001
  const partnerAppUrl =
    process.env.NEXT_PUBLIC_PARTNER_APP_URL || "http://localhost:3001";

  // --- Menu Config ---
  // Added "external: true" for the partner link
  const menuLinks = [
    { href: "/search", label: "Поиск", alwaysVisible: true },
    { href: "/pricing", label: "Тарифы", alwaysVisible: true },
    { href: "/favorites", label: "Избранное", role: "customer" },
    { href: "/compare", label: "Сравнение", alwaysVisible: true },
    { href: "/about", label: "О нас", alwaysVisible: true },
    { href: "/blog", label: "Блог", alwaysVisible: true },
    { href: "/login", label: "Войти", guestOnly: true },
    {
      href: "/register-performer",
      label: "Стать исполнителем",
      guestOnly: true,
    },
    { href: "/register-customer", label: "Стать заказчиком", guestOnly: true },
    {
      href: partnerAppUrl,
      label: "Партнерам",
      guestOnly: true,
      external: true, // Flag to render as standard <a> tag
    },

    { href: "/admin", label: "Админ", role: "admin" },
  ];

  const closeMenu = () => setIsMenuOpen(false);

  if (!isClient) return null;

  const filteredLinks = menuLinks.filter((link) => {
    if (link.alwaysVisible) return true;
    if (link.guestOnly) return !isLoggedIn;
    if (link.role) return isLoggedIn && userRole === link.role;
    return false;
  });

  const ProfileDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
          <Avatar className="h-9 w-9 transition-opacity hover:opacity-80 border border-border">
            <AvatarImage
              src={userImage || ""}
              alt="Profile"
              className="object-cover"
            />
            <AvatarFallback className="bg-primary/10 text-primary">
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Мой аккаунт</p>
            <p className="text-xs leading-none text-muted-foreground capitalize">
              {userRole === "performer"
                ? "Исполнитель"
                : userRole === "customer"
                  ? "Заказчик"
                  : userRole}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link
            href={profileHref}
            onClick={closeMenu}
            className="cursor-pointer"
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Личный кабинет</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleLogout}
          className="text-red-600 focus:text-red-600 cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Выйти</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // --- MOBILE VIEW ---
  if (isMobile) {
    return (
      <Sheet
        open={isMenuOpen}
        onOpenChange={(open) => {
          setIsMenuOpen(open);
          if (onOpenChange) onOpenChange(open);
        }}
      >
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>

        <SheetContent side="left" className="w-3/4 bg-secondary flex flex-col">
          <SheetHeader>
            <SheetTitle>Меню</SheetTitle>
            <SheetDescription>Навигация по сайту.</SheetDescription>
          </SheetHeader>

          <nav className="grid gap-4 py-4 flex-1">
            {filteredLinks.map((link) => {
              const mobileClasses =
                "block px-2 py-1 text-lg rounded hover:bg-accent hover:text-accent-foreground";

              // Render standard <a> tag for external partner link
              if (link.external) {
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    className={mobileClasses}
                    onClick={closeMenu}
                  >
                    {link.label}
                  </a>
                );
              }

              // Render Next.js <Link> for internal routes
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={mobileClasses}
                  onClick={closeMenu}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {isLoggedIn && (
            <div className="border-t pt-4 px-2 pb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Профиль
                </span>
                <ProfileDropdown />
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    );
  }

  // --- DESKTOP VIEW ---
  return (
    <nav className="flex items-center gap-6">
      {filteredLinks.map((link) => {
        const desktopClasses =
          "text-sm font-medium text-muted-foreground transition-colors hover:text-primary";

        // Render standard <a> tag for external partner link
        if (link.external) {
          return (
            <a key={link.href} href={link.href} className={desktopClasses}>
              {link.label}
            </a>
          );
        }

        // Render Next.js <Link> for internal routes
        return (
          <Link key={link.href} href={link.href} className={desktopClasses}>
            {link.label}
          </Link>
        );
      })}

      {isLoggedIn && (
        <div className="ml-2">
          <ProfileDropdown />
        </div>
      )}
    </nav>
  );
};

export default ClientMenu;
