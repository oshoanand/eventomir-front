"use client";

import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "next-auth/react";
import { VkontakteIcon, TelegramIcon } from "@/components/icons";
import { useSiteSettings } from "@/components/providers/SiteThemeProvider";
import { Mail, Phone, ExternalLink } from "lucide-react";

const Footer = () => {
  const settings = useSiteSettings();
  const { status } = useSession();
  const currentYear = new Date().getFullYear();
  const isLoading = !settings;

  const isLoggedIn = status === "authenticated";
  const contacts = settings?.contacts;
  const siteName = settings?.siteName || "Eventomir";

  return (
    <footer className="bg-background border-t border-border/40 pt-16 pb-8 mt-auto overflow-hidden relative">
      {/* Subtle background glow for modern feel */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="container mx-auto px-5 md:px-8 flex flex-col items-center text-center z-10 relative">
        {/* --- BRAND & DESCRIPTION --- */}
        <div className="mb-10 max-w-xl">
          <Link href="/" className="inline-block mb-4">
            <span className="text-3xl md:text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              {siteName}
            </span>
          </Link>
          <p className="text-base text-muted-foreground leading-relaxed">
            Платформа для поиска и бронирования лучших исполнителей для ваших
            мероприятий. Создавайте незабываемые события вместе с
            профессионалами.
          </p>
        </div>

        {/* --- HORIZONTAL NAVIGATION --- */}
        <nav className="flex flex-wrap justify-center items-center gap-x-8 gap-y-4 mb-10 text-[15px] font-semibold text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors">
            Главная
          </Link>
          <Link href="/search" className="hover:text-primary transition-colors">
            Поиск услуг
          </Link>
          <Link
            href="/pricing"
            className="hover:text-primary transition-colors"
          >
            Тарифы
          </Link>
          <Link href="/blog" className="hover:text-primary transition-colors">
            Блог
          </Link>
          <Link href="/about" className="hover:text-primary transition-colors">
            О компании
          </Link>
          {!isLoggedIn && (
            <>
              <Link
                href="/register-customer"
                className="hover:text-primary transition-colors"
              >
                Заказчикам
              </Link>
              <Link
                href="/register-performer"
                className="hover:text-primary transition-colors"
              >
                Исполнителям
              </Link>
            </>
          )}
          <Link
            href={
              process.env.NEXT_PUBLIC_PARTNER_APP_URL ||
              "https://partner.eventomir.ru"
            }
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors flex items-center gap-1.5"
          >
            Партнерам <ExternalLink className="h-3.5 w-3.5 opacity-60" />
          </Link>
        </nav>

        {/* --- CONTACT PILLS & SOCIALS --- */}
        <div className="flex flex-wrap justify-center items-center gap-4 mb-16">
          {isLoading ? (
            <div className="flex gap-4">
              <Skeleton className="h-12 w-48 rounded-full" />
              <Skeleton className="h-12 w-48 rounded-full" />
            </div>
          ) : (
            <>
              {contacts?.email && (
                <a
                  href={`mailto:${contacts.email}`}
                  className="flex items-center gap-2.5 px-5 py-2.5 bg-muted/40 hover:bg-primary/10 hover:text-primary border border-border/50 hover:border-primary/20 rounded-full transition-all duration-300 font-medium text-sm"
                >
                  <Mail className="h-4 w-4" />
                  {contacts.email}
                </a>
              )}
              {contacts?.phone && (
                <a
                  href={`tel:${contacts.phone}`}
                  className="flex items-center gap-2.5 px-5 py-2.5 bg-muted/40 hover:bg-primary/10 hover:text-primary border border-border/50 hover:border-primary/20 rounded-full transition-all duration-300 font-medium text-sm"
                >
                  <Phone className="h-4 w-4" />
                  {contacts.phone}
                </a>
              )}
              <div className="flex items-center gap-2 ml-2">
                {contacts?.vkLink && (
                  <Link
                    href={contacts.vkLink}
                    aria-label="VK"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 w-10 flex items-center justify-center rounded-full bg-muted/40 hover:bg-[#0077FF] hover:text-white border border-border/50 transition-all duration-300"
                  >
                    <VkontakteIcon className="w-5 h-5" />
                  </Link>
                )}
                {contacts?.telegramLink && (
                  <Link
                    href={contacts.telegramLink}
                    aria-label="Telegram"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 w-10 flex items-center justify-center rounded-full bg-muted/40 hover:bg-[#24A1DE] hover:text-white border border-border/50 transition-all duration-300"
                  >
                    <TelegramIcon className="w-5 h-5" />
                  </Link>
                )}
              </div>
            </>
          )}
        </div>

        {/* --- BOTTOM LEGAL ROW --- */}
        <div className="w-full pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-muted-foreground font-medium">
          <div className="flex items-center gap-3">
            <p>
              &copy; {currentYear} ООО «АМУЛЕТ КОМПАНИ». Все права защищены.
            </p>
            <span className="px-2 py-0.5 bg-muted/50 rounded-md border border-border/50 text-[10px] font-black uppercase tracking-widest">
              18+
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 opacity-80">
            <span>ИНН: 6319258622</span>
            <span>ОГРН: 1226300038360</span>
          </div>

          <div className="flex items-center gap-6">
            <Link
              href="/documents#privacy"
              className="hover:text-foreground transition-colors"
            >
              Конфиденциальность
            </Link>
            <Link
              href="/documents#terms"
              className="hover:text-foreground transition-colors"
            >
              Условия использования
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
