"use client";

import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "next-auth/react";
import { VkontakteIcon, TelegramIcon } from "@/components/icons";
import { useSiteSettings } from "@/components/providers/SiteThemeProvider";
import { Mail, Phone, MapPin, ExternalLink } from "lucide-react";

const Footer = () => {
  const settings = useSiteSettings();
  const { status } = useSession();
  const currentYear = new Date().getFullYear();
  const isLoading = !settings;

  const isLoggedIn = status === "authenticated";
  const contacts = settings?.contacts;
  const siteName = settings?.siteName || "Eventomir";

  return (
    <footer className="bg-background border-t border-border/50 pt-12 md:pt-16 pb-6 md:pb-8 mt-auto">
      <div className="container mx-auto px-5 md:px-8">
        {/* Mobile: 2-col grid | Desktop: 4-col grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 md:gap-8">
          {/* Section 1: Brand & About (Takes full width on mobile) */}
          <div className="col-span-2 lg:col-span-1 space-y-5 md:space-y-6 pr-4">
            <div className="flex items-center">
              <span className="text-2xl md:text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                {siteName}
              </span>
            </div>
            <p className="text-xs mb-4">
              ООО «АМУЛЕТ КОМПАНИ»
              <br />
              ИНН: 6319258622
              <br />
              ОГРН: 1226300038360
            </p>
            <p className="text-sm">
              Платформа для поиска и бронирования лучших исполнителей для ваших
              мероприятий.
            </p>
          </div>

          {/* Section 2: Quick Links (Takes half width on mobile) */}
          <div className="col-span-1 space-y-4 md:space-y-6">
            <h3 className="text-[13px] md:text-sm font-bold uppercase tracking-wider text-foreground">
              Навигация
            </h3>
            <nav className="flex flex-col space-y-1.5 md:space-y-3 text-[15px] md:text-sm font-medium text-muted-foreground">
              <Link
                href="/"
                className="hover:text-primary transition-colors py-1 md:py-0 inline-block w-fit"
              >
                Главная
              </Link>
              <Link
                href="/search"
                className="hover:text-primary transition-colors py-1 md:py-0 inline-block w-fit"
              >
                Поиск услуг
              </Link>
              <Link
                href="/pricing"
                className="hover:text-primary transition-colors py-1 md:py-0 inline-block w-fit"
              >
                Тарифы
              </Link>
              <Link
                href="/blog"
                className="hover:text-primary transition-colors py-1 md:py-0 inline-block w-fit"
              >
                Блог и статьи
              </Link>
              <Link
                href="/about"
                className="hover:text-primary transition-colors py-1 md:py-0 inline-block w-fit"
              >
                О компании
              </Link>
            </nav>
          </div>

          {/* Section 3: For Users (Takes half width on mobile) */}
          <div className="col-span-1 space-y-4 md:space-y-6">
            <h3 className="text-[13px] md:text-sm font-bold uppercase tracking-wider text-foreground">
              Пользователям
            </h3>
            <nav className="flex flex-col space-y-1.5 md:space-y-3 text-[15px] md:text-sm font-medium text-muted-foreground">
              {!isLoggedIn && (
                <>
                  <Link
                    href="/register-customer"
                    className="hover:text-primary transition-colors py-1 md:py-0 inline-block w-fit"
                  >
                    Я заказчик
                  </Link>
                  <Link
                    href="/register-performer"
                    className="hover:text-primary transition-colors py-1 md:py-0 inline-block w-fit"
                  >
                    Я исполнитель
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
                className="hover:text-primary transition-colors py-1 md:py-0 flex items-center gap-1.5 w-fit"
              >
                Партнерам <ExternalLink className="h-3 w-3 opacity-50" />
              </Link>
              <Link
                href="/documents"
                className="hover:text-primary transition-colors py-1 md:py-0 inline-block w-fit"
              >
                Документы
              </Link>
            </nav>
          </div>

          {/* Section 4: Contacts (Takes full width on mobile) */}
          <div className="col-span-2 lg:col-span-1 space-y-4 md:space-y-6 lg:pl-4">
            <h3 className="text-[13px] md:text-sm font-bold uppercase tracking-wider text-foreground">
              Контакты
            </h3>
            <div className=" text-[15px] md:text-sm font-medium text-muted-foreground">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-5 w-[80%]" />
                  <Skeleton className="h-5 w-[60%]" />
                </div>
              ) : (
                <>
                  {contacts?.email && (
                    <a
                      href={`mailto:${contacts.email}`}
                      className="flex items-center gap-3 hover:text-primary transition-colors group pt-2 -ml-2 rounded-lg hover:bg-muted/50 w-fit"
                    >
                      <div className="bg-primary/10 p-2 rounded-full text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Mail className="h-4 w-4 shrink-0" />
                      </div>
                      <span className="font-semibold">{contacts.email}</span>
                    </a>
                  )}
                  {contacts?.phone && (
                    <a
                      href={`tel:${contacts.phone}`}
                      className="flex items-center gap-3 hover:text-primary transition-colors group pt-2 -ml-2 rounded-lg hover:bg-muted/50 w-fit"
                    >
                      <div className="bg-primary/10 p-2 rounded-full text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Phone className="h-4 w-4 shrink-0" />
                      </div>
                      <span className="font-semibold">{contacts.phone}</span>
                    </a>
                  )}
                  <div className="flex items-center gap-2 pt-2 -ml-2">
                    {isLoading ? (
                      <div className="flex gap-3">
                        <Skeleton className="h-11 w-11 rounded-full" />
                        <Skeleton className="h-11 w-11 rounded-full" />
                      </div>
                    ) : (
                      <>
                        {contacts?.vkLink && (
                          <Link
                            href={contacts.vkLink}
                            aria-label="VK"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-8 w-8 shrink-0 flex items-center justify-center rounded-full bg-primary/10 hover:bg-primary hover:text-primary-foreground transition-all duration-300"
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
                            className="h-8 w-8 shrink-0 flex items-center justify-center rounded-full bg-primary/10 hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                          >
                            <TelegramIcon className="w-5 h-5" />
                          </Link>
                        )}
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <Separator className="my-8 md:my-10 bg-border/50" />

        {/* Bottom Footer: Column-reverse on mobile so copyright is last */}
        <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-6 text-sm text-muted-foreground font-medium text-center md:text-left">
          <p className="opacity-80 text-[13px] md:text-sm">
            &copy; {currentYear} ООО «{siteName}». Все права защищены.{" "}
            <span className="px-2 py-0.5 bg-muted rounded border border-border/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 shadow-sm">
              18+
            </span>
          </p>

          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6">
            <Link
              href="/documents#privacy"
              className="hover:text-primary transition-colors underline-offset-4 hover:underline"
            >
              Конфиденциальность
            </Link>
            <Link
              href="/documents#terms"
              className="hover:text-primary transition-colors underline-offset-4 hover:underline"
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
