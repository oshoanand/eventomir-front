import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/lib/providers";
import { getSiteSettings } from "@/services/settings";
import type { SiteSettings } from "@/types/globals.d";
import { Suspense } from "react";

// SEO metadata dynamically generated from Admin Panel settings
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  // Extract variables with safe fallbacks
  const siteName = settings?.siteName || "Eventomir";
  const favicon = settings?.faviconUrl || "/favicon.ico";
  const logo = settings?.logoUrl || "/images/og-image.png";

  return {
    title: {
      default: `${siteName}: Платформа для поиска исполнителей на мероприятия`,
      template: `%s | ${siteName}`,
    },
    description: `Найдите лучших фотографов, диджеев, ведущих, поваров, транспорт и других профессионалов для вашего мероприятия в России на ${siteName}. Удобный поиск, отзывы, портфолио.`,
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:9003",
    ),
    alternates: {
      canonical: "/",
      languages: {
        "ru-RU": "/",
      },
    },
    // Dynamic Favicon Injection
    icons: {
      icon: favicon,
      apple: favicon,
    },
    openGraph: {
      title: `${siteName}: Найдите лучших исполнителей для мероприятий`,
      description:
        "Платформа для поиска фотографов, DJ, ведущих и других профессионалов для свадьбы, дня рождения, корпоратива.",
      url: "/",
      siteName: siteName,
      images: [
        {
          url: logo, // Dynamic Logo for social media previews
          width: 1200,
          height: 630,
          alt: `Логотип ${siteName}`,
        },
      ],
      locale: "ru_RU",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${siteName}: Найдите лучших исполнителей для мероприятий`,
      description:
        "Платформа для поиска фотографов, DJ, ведущих и других профессионалов для свадьбы, дня рождения, корпоратива.",
      images: {
        url: logo, // Dynamic Logo
        alt: `Логотип ${siteName}`,
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
      siteName, // Add dynamic site name to keywords
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
    authors: [{ name: `${siteName} Team`, url: "/" }],
    creator: `${siteName} Team`,
    publisher: siteName,
  };
}

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  // Fetch settings on the server side
  const settings = await getSiteSettings();

  return (
    <html
      lang="ru"
      translate="no"
      className="notranslate"
      suppressHydrationWarning
    >
      <head>
        <meta name="google" content="notranslate" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* Base fallback font. The actual font chosen in the Admin Panel 
            will override this via the SiteThemeProvider CSS variable injection */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased flex flex-col min-h-screen">
        {/* Pass the fetched settings down to the Providers (and thus to SiteThemeProvider) */}
        <Providers initialSettings={settings}>
          <Suspense>{children}</Suspense>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
