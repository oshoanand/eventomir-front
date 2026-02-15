// "use client";

// import Link from "next/link";
// import { useIsMobile } from "@/hooks/use-mobile";
// import {
//   Sheet,
//   SheetContent,
//   SheetDescription,
//   SheetHeader,
//   SheetTitle,
//   SheetTrigger,
// } from "@/components/ui/sheet";
// import { Button } from "@/components/ui/button";
// import { Menu } from "@/components/icons";
// import React, { useState, useEffect } from "react";

// interface ClientMenuProps {
//   isLoggedIn: boolean;
//   userRole: "customer" | "performer" | "admin" | "support" | "partner" | null;
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

//   // Updated menu links, added partner dashboard
//   const menuLinks = [
//     { href: "/admin", label: "Админ", adminOnly: true, authRequired: true },
//     { href: "/search", label: "Поиск" },
//     { href: "/pricing", label: "Тарифы" },
//     { href: "/compare", label: "Сравнение" },
//     { href: "/about", label: "О нас" },
//     { href: "/blog", label: "Блог" },
//     {
//       href: "/favorites",
//       label: "Избранное",
//       authRequired: true,
//       customerOnly: true,
//     },
//     { href: "/login", label: "Войти", authRequired: false },
//     {
//       href: "/register-performer",
//       label: "Стать исполнителем",
//       authRequired: false,
//     },
//     {
//       href: "/register-customer",
//       label: "Стать заказчиком",
//       authRequired: false,
//     },
//     {
//       href: "/performer-profile",
//       label: "Профиль исполнителя",
//       authRequired: true,
//       performerOnly: true,
//     },
//     {
//       href: "/customer-profile",
//       label: "Профиль заказчика",
//       authRequired: true,
//       customerOnly: true,
//     },
//     {
//       href: "/support",
//       label: "Профиль поддержки",
//       authRequired: true,
//       supportOnly: true,
//     },
//     {
//       href: "/partner-dashboard",
//       label: "Кабинет партнера",
//       authRequired: true,
//       partnerOnly: true,
//     },
//   ];

//   const [isClient, setIsClient] = useState(false);

//   useEffect(() => {
//     setIsClient(true);
//   }, []);

//   const closeMenu = () => setIsMenuOpen(false);

//   if (!isClient) {
//     return null;
//   }

//   const filteredMenuLinks = menuLinks.filter((link) => {
//     if (link.adminOnly && userRole !== "admin") return false;
//     if (link.supportOnly && userRole !== "support") return false;
//     if (link.performerOnly && userRole !== "performer") return false;
//     if (link.customerOnly && userRole !== "customer") return false;
//     if (link.partnerOnly && userRole !== "partner") return false;
//     if (link.authRequired === true && !isLoggedIn) return false;
//     if (link.authRequired === false && isLoggedIn) return false;
//     return true;
//   });

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
//         <SheetContent side="left" className="w-3/4 bg-secondary">
//           <SheetHeader>
//             <SheetTitle>Меню</SheetTitle>
//             <SheetDescription>Навигация по сайту.</SheetDescription>
//           </SheetHeader>
//           <nav className="grid gap-4 py-4">
//             {filteredMenuLinks.map((link) => (
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
//         </SheetContent>
//       </Sheet>
//     );
//   }

//   return (
//     <nav className={`flex items-center gap-4`}>
//       {filteredMenuLinks.map((link) => (
//         <Link
//           key={link.href}
//           href={link.href}
//           className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
//         >
//           {link.label}
//         </Link>
//       ))}
//     </nav>
//   );
// };

// export default ClientMenu;
"use client";

import Link from "next/link";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, User } from "lucide-react"; // Assuming you have lucide-react or similar icons
import React, { useState, useEffect } from "react";

interface ClientMenuProps {
  isLoggedIn: boolean;
  userRole: "customer" | "performer" | "admin" | "support" | "partner" | null;
  userImage?: string | null; // Added to support profile image display
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

  // Define the base path for the profile based on role
  const getProfileLink = () => {
    switch (userRole) {
      case "performer":
        return "/performer-profile";
      case "customer":
        return "/customer-profile";
      case "partner":
        return "/partner-dashboard";
      case "admin":
        return "/admin";
      case "support":
        return "/support";
      default:
        return "/";
    }
  };

  const profileHref = getProfileLink();

  const menuLinks = [
    // --- Always Visible ---
    { href: "/search", label: "Поиск", alwaysVisible: true },
    { href: "/pricing", label: "Тарифы", alwaysVisible: true },
    { href: "/compare", label: "Сравнение", alwaysVisible: true },
    { href: "/about", label: "О нас", alwaysVisible: true },
    { href: "/blog", label: "Блог", alwaysVisible: true },

    // --- Guest Only (Visible if NOT logged in) ---
    { href: "/login", label: "Войти", guestOnly: true },
    {
      href: "/register-performer",
      label: "Стать исполнителем",
      guestOnly: true,
    },
    { href: "/register-customer", label: "Стать заказчиком", guestOnly: true },

    // --- Role Specific (Text links that might appear in the list) ---
    { href: "/favorites", label: "Избранное", role: "customer" },
    { href: "/admin", label: "Админ", role: "admin" },
    { href: "/partner-dashboard", label: "Кабинет партнера", role: "partner" },
  ];

  const closeMenu = () => setIsMenuOpen(false);

  if (!isClient) return null;

  // Filter links based on authentication state and role
  const filteredLinks = menuLinks.filter((link) => {
    // 1. Always visible links
    if (link.alwaysVisible) return true;

    // 2. Guest only links (Login/Register)
    if (link.guestOnly) {
      return !isLoggedIn; // Only show if user is NOT logged in
    }

    // 3. Role specific links
    if (link.role) {
      return isLoggedIn && userRole === link.role;
    }

    return false;
  });

  // Reusable Profile Avatar Component
  const ProfileAvatar = () => (
    <Link
      href={profileHref}
      onClick={closeMenu}
      className="flex items-center gap-2"
    >
      <Avatar className="h-8 w-8 transition-opacity hover:opacity-80">
        <AvatarImage
          src={userImage || ""}
          alt="Profile"
          className="object-cover"
        />
        <AvatarFallback className="bg-primary/10 text-primary">
          <User className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      {/* Show text label next to avatar only on Mobile */}
      {isMobile && <span className="text-lg font-medium">Мой профиль</span>}
    </Link>
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

        <SheetContent side="left" className="w-3/4 bg-secondary">
          <SheetHeader>
            <SheetTitle>Меню</SheetTitle>
            <SheetDescription>Навигация по сайту.</SheetDescription>
          </SheetHeader>
          <nav className="grid gap-4 py-4">
            {/* Render Links */}
            {filteredLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-2 py-1 text-lg rounded hover:bg-accent hover:text-accent-foreground"
                onClick={closeMenu}
              >
                {link.label}
              </Link>
            ))}

            {/* Render Profile Avatar at the bottom of mobile menu if logged in */}
            {isLoggedIn && (
              <div className="mt-4 border-t pt-4 px-2">
                <ProfileAvatar />
              </div>
            )}
          </nav>
        </SheetContent>
      </Sheet>
    );
  }

  // --- DESKTOP VIEW ---
  return (
    <nav className="flex items-center gap-6">
      {/* Render Text Links */}
      {filteredLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          {link.label}
        </Link>
      ))}

      {/* Render Profile Avatar if logged in */}
      {isLoggedIn && (
        <div className="ml-2">
          <ProfileAvatar />
        </div>
      )}
    </nav>
  );
};

export default ClientMenu;
