"use client";

import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Send } from "lucide-react";
import { useSession } from "next-auth/react"; // <-- Import useSession

import { useSiteSettings } from "@/components/providers/SiteThemeProvider";

const VkontakteIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    fill="currentColor"
    viewBox="0 0 16 16"
  >
    <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05S0 3.603 0 8.049c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H10.28V16c3.824-.604 6.75-3.934 6.75-7.951" />
  </svg>
);

const Footer = () => {
  const settings = useSiteSettings();
  const { status } = useSession(); // <-- Get session status
  const currentYear = new Date().getFullYear();
  const isLoading = !settings;

  const isLoggedIn = status === "authenticated"; // <-- Check if logged in

  const contacts = settings?.contacts;

  return (
    <footer className="bg-muted text-muted-foreground py-8 mt-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-y-8 md:gap-x-8">
          {/* Section 1: About Us */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {settings?.siteName || "Eventomir"}
            </h3>
            <p className="text-sm">
              Платформа для поиска и бронирования лучших исполнителей для ваших
              мероприятий.
            </p>
          </div>

          {/* Section 2: Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Навигация
            </h3>
            <nav className="flex flex-col space-y-2 text-sm">
              <Link href="/" className="hover:text-foreground hover:underline">
                Главная
              </Link>
              <Link
                href="/search"
                className="hover:text-foreground hover:underline"
              >
                Поиск
              </Link>
              <Link
                href="/pricing"
                className="hover:text-foreground hover:underline"
              >
                Тарифы
              </Link>
              <Link
                href="/blog"
                className="hover:text-foreground hover:underline"
              >
                Блог
              </Link>
              <Link
                href="/about"
                className="hover:text-foreground hover:underline"
              >
                О нас
              </Link>
            </nav>
          </div>

          {/* Section 3: For Users */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Пользователям
            </h3>
            <nav className="flex flex-col space-y-2 text-sm">
              {/* Conditional rendering based on auth status */}
              {!isLoggedIn && (
                <>
                  <Link
                    href="/login"
                    className="hover:text-foreground hover:underline"
                  >
                    Войти
                  </Link>
                  <Link
                    href="/register-customer"
                    className="hover:text-foreground hover:underline"
                  >
                    Регистрация заказчика
                  </Link>
                  <Link
                    href="/register-performer"
                    className="hover:text-foreground hover:underline"
                  >
                    Регистрация исполнителя
                  </Link>
                </>
              )}
              <Link
                href="/partnership"
                className="hover:text-foreground hover:underline"
              >
                Партнерская программа
              </Link>
              <Link
                href="/documents"
                className="hover:text-foreground hover:underline"
              >
                Документы
              </Link>
            </nav>
          </div>

          {/* Section 4: Contacts & Social Media */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Контакты
            </h3>
            <div className="text-sm space-y-2">
              {isLoading ? (
                <>
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-32" />
                </>
              ) : (
                <>
                  <p>Email: {contacts?.email || "[Ваш Email]"}</p>
                  <p>Телефон: {contacts?.phone || "[Ваш Телефон]"}</p>
                </>
              )}
            </div>
            <div className="flex space-x-4 mt-4">
              {isLoading ? (
                <>
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-5 w-5 rounded-full" />
                </>
              ) : (
                <>
                  {contacts?.vkLink && (
                    <Link
                      href={contacts.vkLink}
                      aria-label="VK"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <VkontakteIcon />
                    </Link>
                  )}
                  {contacts?.telegramLink && (
                    <Link
                      href={contacts.telegramLink}
                      aria-label="Telegram"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Send size={20} />
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        <Separator className="my-8 bg-border" />
        <div className="text-center text-xs">
          <p>
            &copy; {currentYear} {settings?.siteName || "Eventomir"}. Все права
            защищены.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
