import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/lib/providers";
import { getSiteSettings } from "@/services/settings";
import type { SiteSettings } from "@/types/globals.d";

// SEO metadata
export const metadata: Metadata = {
  title: {
    default: "Eventomir: Платформа для поиска исполнителей на мероприятия",
    template: "%s | Eventomir",
  },
  description:
    "Найдите лучших фотографов, диджеев, ведущих, поваров, транспорт и других профессионалов для вашего мероприятия в России на Eventomir. Удобный поиск, отзывы, портфолио.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:9003",
  ),
  alternates: {
    canonical: "/",
    languages: {
      "ru-RU": "/",
    },
  },
  openGraph: {
    title: "Eventomir: Найдите лучших исполнителей для мероприятий",
    description:
      "Платформа для поиска фотографов, DJ, ведущих и других профессионалов для свадьбы, дня рождения, корпоратива.",
    url: "/",
    siteName: "Eventomir",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Логотип Eventomir",
      },
    ],
    locale: "ru_RU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Eventomir: Найдите лучших исполнителей для мероприятий",
    description:
      "Платформа для поиска фотографов, DJ, ведущих и других профессионалов для свадьбы, дня рождения, корпоратива.",
    images: {
      url: "/og-image.png",
      alt: "Логотип Eventomir",
    },
  },
  keywords: [
    "организация мероприятий",
    "поиск исполнителей",
    "фотограф на свадьбу",
    "DJ на праздник",
    "ведущий на корпоратив",
    "кейтеринг",
    "декор мероприятий",
    "аренда транспорта",
    "артисты",
    "планирование событий",
    "Eventomir",
    "ивентомир",
    "заказ артистов",
    "организация праздников",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "ВАШ_КОД_ВЕРИФИКАЦИИ_GOOGLE",
    yandex: "ВАШ_КОД_ВЕРИФИКАЦИИ_ЯНДЕКС",
  },
  manifest: "/manifest.json",
  authors: [{ name: "Eventomir Team", url: "https://eventomir.ru" }],
  creator: "Eventomir Team",
  publisher: "Eventomir",
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  // Settings are now fetched without a Supabase client.
  // This means they will come from the hardcoded defaults in the settings service.
  const siteSettings: SiteSettings = await getSiteSettings();

  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased flex flex-col min-h-screen">
        <Providers initialSettings={siteSettings}>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
