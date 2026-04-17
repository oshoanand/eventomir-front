"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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
  MessageCircleMore,
} from "lucide-react";

import { useNotification } from "@/components/providers/NotificationProvider";
import { useChatStore } from "@/store/useChatStore";

interface ClientMenuProps {
  isLoggedIn: boolean;
  userRole: "customer" | "performer" | "partner" | null;
  userImage?: string | null;
  userName: string;
  onOpenChange?: (open: boolean) => void;
}

const ClientMenu: React.FC<ClientMenuProps> = ({
  isLoggedIn,
  userRole,
  userImage,
  userName,
  onOpenChange,
}) => {
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { unreadCount } = useNotification();
  // Read unread count from Zustand store
  const totalUnreadCount = useChatStore((state) => state.totalUnreadCount);

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
        label: "Личный кабинет",
        isPending: false,
      };
    return { href: "/", label: "Профиль", isPending: false };
  };
  const profileLink = getProfileLink();

  const NotificationBell = () => (
    <Link
      href="/notifications"
      aria-label="Уведомления"
      className="relative group flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 hover:bg-primary/20 transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
    >
      <Bell
        className="h-4 w-4 text-primary transition-transform duration-300 group-hover:scale-110"
        strokeWidth={2}
      />

      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-extrabold text-white shadow-sm ring-2 ring-background animate-in zoom-in duration-300">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );

  const ChatLink = () => (
    <Link
      href="/chat"
      aria-label="Чаты"
      className="relative group flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 hover:bg-primary/20 transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
    >
      <MessageCircleMore
        className="h-4 w-4 text-primary transition-transform duration-300 group-hover:scale-110"
        strokeWidth={2}
      />

      {totalUnreadCount > 0 && (
        <span className="absolute -top-1 -right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground ring-2 ring-background animate-in zoom-in">
          {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
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
              className="relative group flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 hover:bg-primary/20 transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
            >
              <Menu className="h-4 w-4 text-primary transition-transform duration-300 group-hover:scale-110" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-[85vw] max-w-[400px] flex flex-col p-0 border-l"
          >
            <SheetHeader className="text-left border-b p-6 bg-gradient-to-b from-primary/5 to-transparent relative">
              <SheetTitle className="m-0">
                <div className="flex items-center w-full gap-4 relative z-10">
                  {/* 1. Enlarged Avatar with Ring and Shadow */}
                  <div
                    className={`relative h-12 w-12 rounded-full flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-background shadow-sm transition-all ${
                      profileLink.isPending
                        ? "bg-destructive/10 text-destructive ring-destructive/20"
                        : "bg-primary/10 text-primary ring-primary/20"
                    }`}
                  >
                    {profileLink.isPending ? (
                      <AlertCircle className="h-5 w-5" />
                    ) : userImage ? (
                      <Image
                        src={userImage}
                        alt="profile_image"
                        width={48}
                        height={48}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </div>

                  {/* 2. Stacked Typography */}
                  <div className="flex flex-col overflow-hidden">
                    <span className="truncate font-bold text-[17px] leading-tight tracking-tight text-foreground">
                      {userName}
                    </span>
                    <span className="truncate text-xs font-medium text-muted-foreground mt-0.5">
                      Мой профиль
                    </span>
                  </div>
                </div>
              </SheetTitle>
            </SheetHeader>

            <nav className="flex flex-col px-4 py-6 flex-1 overflow-y-auto gap-8">
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
                        <User className="mr-3 h-5 w-5 text-primary" />
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
                        <Ticket className="mr-3 h-5 w-5 text-primary" /> Мои
                        билеты
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
          <ChatLink />
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
                  ) : userImage ? (
                    <Image
                      src={userImage}
                      alt="profile_image"
                      width={28}
                      height={28}
                      className="h-full w-full object-cover rounded-full"
                    />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </div>
                <span className="max-w-[150px] truncate font-medium text-sm">
                  Профиль
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
                    <User className="mr-2 h-4 w-4 text-primary" />
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
                    <Ticket className="mr-2 h-4 w-4 text-primary" /> Мои билеты
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
