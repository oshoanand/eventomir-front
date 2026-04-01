// "use client";

// import Link from "next/link";
// import { Separator } from "@/components/ui/separator";
// import { Skeleton } from "@/components/ui/skeleton";
// import { Send } from "lucide-react";
// import { useSession } from "next-auth/react";
// import { VkontakteIcon, TelegramIcon } from "@/components/icons";

// import { useSiteSettings } from "@/components/providers/SiteThemeProvider";

// const Footer = () => {
//   const settings = useSiteSettings();
//   const { status } = useSession();
//   const currentYear = new Date().getFullYear();
//   const isLoading = !settings;

//   const isLoggedIn = status === "authenticated";

//   const contacts = settings?.contacts;

//   return (
//     <footer className="bg-muted text-muted-foreground py-8 mt-16">
//       <div className="container mx-auto px-4">
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-y-8 md:gap-x-8">
//           {/* Section 1: About Us */}
//           <div>
//             <h3 className="text-lg font-semibold text-foreground mb-4">
//               {settings?.siteName || "Eventomir"}
//             </h3>
//             <p className="text-sm">
//               Платформа для поиска и бронирования лучших исполнителей для ваших
//               мероприятий.
//             </p>
//           </div>

//           {/* Section 2: Quick Links */}
//           <div>
//             <h3 className="text-lg font-semibold text-foreground mb-4">
//               Навигация
//             </h3>
//             <nav className="flex flex-col space-y-2 text-sm">
//               <Link href="/" className="hover:text-foreground hover:underline">
//                 Главная
//               </Link>
//               <Link
//                 href="/search"
//                 className="hover:text-foreground hover:underline"
//               >
//                 Поиск
//               </Link>
//               <Link
//                 href="/pricing"
//                 className="hover:text-foreground hover:underline"
//               >
//                 Тарифы
//               </Link>
//               <Link
//                 href="/blog"
//                 className="hover:text-foreground hover:underline"
//               >
//                 Блог
//               </Link>
//               <Link
//                 href="/about"
//                 className="hover:text-foreground hover:underline"
//               >
//                 О нас
//               </Link>
//             </nav>
//           </div>

//           {/* Section 3: For Users */}
//           <div>
//             <h3 className="text-lg font-semibold text-foreground mb-4">
//               Пользователям
//             </h3>
//             <nav className="flex flex-col space-y-2 text-sm">
//               {/* Conditional rendering based on auth status */}
//               {!isLoggedIn && (
//                 <>
//                   <Link
//                     href="/login"
//                     className="hover:text-foreground hover:underline"
//                   >
//                     Войти
//                   </Link>
//                   <Link
//                     href="/register-customer"
//                     className="hover:text-foreground hover:underline"
//                   >
//                     Регистрация заказчика
//                   </Link>
//                   <Link
//                     href="/register-performer"
//                     className="hover:text-foreground hover:underline"
//                   >
//                     Регистрация исполнителя
//                   </Link>
//                 </>
//               )}
//               <Link
//                 href="/partnership"
//                 className="hover:text-foreground hover:underline"
//               >
//                 Партнерская программа
//               </Link>
//               <Link
//                 href="/documents"
//                 className="hover:text-foreground hover:underline"
//               >
//                 Документы
//               </Link>
//             </nav>
//           </div>

//           {/* Section 4: Contacts & Social Media */}
//           <div>
//             <h3 className="text-lg font-semibold text-foreground mb-4">
//               Контакты
//             </h3>
//             <div className="text-sm space-y-2">
//               {isLoading ? (
//                 <>
//                   <Skeleton className="h-4 w-40" />
//                   <Skeleton className="h-4 w-32" />
//                 </>
//               ) : (
//                 <>
//                   <p>Email: {contacts?.email || "[Ваш Email]"}</p>
//                   <p>Телефон: {contacts?.phone || "[Ваш Телефон]"}</p>
//                 </>
//               )}
//             </div>
//             <div className="flex space-x-4 mt-4">
//               {isLoading ? (
//                 <>
//                   <Skeleton className="h-5 w-5 rounded-full" />
//                   <Skeleton className="h-5 w-5 rounded-full" />
//                 </>
//               ) : (
//                 <>
//                   {contacts?.vkLink && (
//                     <Link
//                       href={contacts.vkLink}
//                       aria-label="VK"
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="text-muted-foreground hover:text-foreground"
//                     >
//                       <VkontakteIcon className="w-8 h-8" />
//                     </Link>
//                   )}
//                   {contacts?.telegramLink && (
//                     <Link
//                       href={contacts.telegramLink}
//                       aria-label="Telegram"
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="text-muted-foreground hover:text-foreground"
//                     >
//                       <TelegramIcon className="w-8 h-8" />
//                     </Link>
//                   )}
//                 </>
//               )}
//             </div>
//           </div>
//         </div>
//         <Separator className="my-8 bg-border" />
//         <div className="text-center text-xs">
//           <p>
//             &copy; {currentYear} ООО {settings?.siteName || "Eventomir"}. Все
//             права защищены. 18+
//           </p>
//         </div>
//       </div>
//     </footer>
//   );
// };

// export default Footer;

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
    <footer className="bg-background border-t border-border/40 pt-16 pb-8 mt-auto">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Section 1: Brand & About */}
          <div className="space-y-6">
            <div className="flex items-center">
              <span className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                {siteName}
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Ведущая платформа для поиска и бронирования лучших исполнителей и
              услуг для вашего идеального мероприятия.
            </p>
            <div className="flex items-center space-x-4 pt-2">
              {isLoading ? (
                <div className="flex gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-10 w-10 rounded-full" />
                </div>
              ) : (
                <>
                  {contacts?.vkLink && (
                    <Link
                      href={contacts.vkLink}
                      aria-label="VK"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-10 w-10 flex items-center justify-center rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-all duration-300"
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
                      className="h-10 w-10 flex items-center justify-center rounded-full bg-muted hover:bg-primary/10 hover:text-primary transition-all duration-300"
                    >
                      <TelegramIcon className="w-5 h-5" />
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Section 2: Quick Links */}
          <div className="space-y-6">
            <h3 className="text-base font-bold uppercase tracking-wider text-foreground">
              Платформа
            </h3>
            <nav className="flex flex-col space-y-3.5 text-sm font-medium text-muted-foreground">
              <Link
                href="/"
                className="hover:text-primary transition-colors flex items-center gap-2 group"
              >
                <span className="h-1 w-1 rounded-full bg-primary/0 group-hover:bg-primary transition-colors" />
                Главная
              </Link>
              <Link
                href="/search"
                className="hover:text-primary transition-colors flex items-center gap-2 group"
              >
                <span className="h-1 w-1 rounded-full bg-primary/0 group-hover:bg-primary transition-colors" />
                Поиск услуг
              </Link>
              <Link
                href="/pricing"
                className="hover:text-primary transition-colors flex items-center gap-2 group"
              >
                <span className="h-1 w-1 rounded-full bg-primary/0 group-hover:bg-primary transition-colors" />
                Тарифы
              </Link>
              <Link
                href="/blog"
                className="hover:text-primary transition-colors flex items-center gap-2 group"
              >
                <span className="h-1 w-1 rounded-full bg-primary/0 group-hover:bg-primary transition-colors" />
                Блог и статьи
              </Link>
              <Link
                href="/about"
                className="hover:text-primary transition-colors flex items-center gap-2 group"
              >
                <span className="h-1 w-1 rounded-full bg-primary/0 group-hover:bg-primary transition-colors" />
                О компании
              </Link>
            </nav>
          </div>

          {/* Section 3: For Users */}
          <div className="space-y-6">
            <h3 className="text-base font-bold uppercase tracking-wider text-foreground">
              Сотрудничество
            </h3>
            <nav className="flex flex-col space-y-3.5 text-sm font-medium text-muted-foreground">
              {!isLoggedIn && (
                <>
                  <Link
                    href="/register-customer"
                    className="hover:text-primary transition-colors flex items-center gap-2 group"
                  >
                    <span className="h-1 w-1 rounded-full bg-primary/0 group-hover:bg-primary transition-colors" />
                    Стать заказчиком
                  </Link>
                  <Link
                    href="/register-performer"
                    className="hover:text-primary transition-colors flex items-center gap-2 group"
                  >
                    <span className="h-1 w-1 rounded-full bg-primary/0 group-hover:bg-primary transition-colors" />
                    Стать исполнителем
                  </Link>
                </>
              )}
              <Link
                href="/partnership"
                className="hover:text-primary transition-colors flex items-center gap-2 group"
              >
                <span className="h-1 w-1 rounded-full bg-primary/0 group-hover:bg-primary transition-colors" />
                Партнерская программа{" "}
                <ExternalLink className="h-3 w-3 opacity-50" />
              </Link>
              <Link
                href="/documents"
                className="hover:text-primary transition-colors flex items-center gap-2 group"
              >
                <span className="h-1 w-1 rounded-full bg-primary/0 group-hover:bg-primary transition-colors" />
                Юридические документы
              </Link>
            </nav>
          </div>

          {/* Section 4: Contacts */}
          <div className="space-y-6">
            <h3 className="text-base font-bold uppercase tracking-wider text-foreground">
              Контакты
            </h3>
            <div className="space-y-4 text-sm font-medium text-muted-foreground">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-5 w-[80%]" />
                  <Skeleton className="h-5 w-[60%]" />
                </div>
              ) : (
                <>
                  {contacts?.email && (
                    <a
                      href={`mailto:${contacts.email}`}
                      className="flex items-start gap-3 hover:text-primary transition-colors"
                    >
                      <Mail className="h-5 w-5 shrink-0 text-primary/70" />
                      <span>{contacts.email}</span>
                    </a>
                  )}
                  {contacts?.phone && (
                    <a
                      href={`tel:${contacts.phone}`}
                      className="flex items-start gap-3 hover:text-primary transition-colors"
                    >
                      <Phone className="h-5 w-5 shrink-0 text-primary/70" />
                      <span>{contacts.phone}</span>
                    </a>
                  )}
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 shrink-0 text-primary/70" />
                    <span className="leading-snug">
                      Россия, онлайн-платформа
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-border/50" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground font-medium">
          <p>
            &copy; {currentYear} ООО «{siteName}». Все права защищены.
          </p>
          <div className="flex items-center gap-6">
            <span className="px-2 py-1 bg-muted rounded-md text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              18+
            </span>
            <Link
              href="/documents#privacy"
              className="hover:text-primary transition-colors"
            >
              Конфиденциальность
            </Link>
            <Link
              href="/documents#terms"
              className="hover:text-primary transition-colors"
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
