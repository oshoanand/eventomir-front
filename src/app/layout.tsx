import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";
import { getSiteSettings } from "@/services/settings";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";

// --- VIEWPORT CONFIGURATION (Next.js 14+ Standard) ---
// This strict configuration is what prevents the app from zooming
// in when tapping inputs, giving it a true native feel.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Critical for Native App Feel (prevents zoom on input focus)
  colorScheme: "light dark",
};

// --- SEO & OPEN GRAPH METADATA ---
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  // 1. Core Variables with Safe Fallbacks
  const siteName = settings?.siteName || "Eventomir";
  const defaultDescription = `Найдите лучших фотографов, диджеев, ведущих, поваров, транспорт и других профессионалов для вашего мероприятия в России на ${siteName}.`;

  // 2. Absolute URLs for Social Cards
  // WhatsApp and Telegram strictly require absolute URLs for images.
  const appDomain =
    process.env.NEXT_PUBLIC_BASE_URL || "https://app.eventomir.ru";
  const favicon = settings?.faviconUrl || "/favicon.ico";

  // Best Practice: If logoUrl is empty, fallback to a specific 1200x630 OG image in your public folder
  const ogImage = settings?.logoUrl || "/images/og-image.png";

  return {
    metadataBase: new URL(appDomain),
    title: {
      default: `${siteName} — Платформа для поиска исполнителей на мероприятия`,
      template: `%s | ${siteName}`,
    },
    description: defaultDescription,
    applicationName: siteName,
    authors: [{ name: `${siteName} Team`, url: appDomain }],
    generator: "Next.js",
    keywords: [
      "организация мероприятий",
      "поиск исполнителей",
      "фотограф на свадьбу",
      "DJ на праздник",
      "ведущий на корпоратив",
      "аренда транспорта",
      siteName,
    ],
    creator: `${siteName} Team`,
    publisher: siteName,
    formatDetection: {
      telephone: true,
      address: true,
      email: true,
    },

    // --- OPEN GRAPH (Facebook, WhatsApp, LinkedIn) ---
    openGraph: {
      type: "website",
      locale: "ru_RU",
      url: "/",
      title: `${siteName} — Ваш гид в мире событий`,
      description: defaultDescription,
      siteName: siteName,
      images: [
        {
          url: ogImage,
          width: 1200, // Optimal width for large cards
          height: 630, // Optimal height for large cards
          alt: `Логотип и баннер ${siteName}`,
          type: "image/png", // Helps WhatsApp parse the image faster
        },
      ],
    },

    // --- TWITTER / TELEGRAM CARDS ---
    twitter: {
      card: "summary_large_image", // Forces a large, beautiful image card (not a tiny square)
      title: `${siteName} — Поиск профи для мероприятий`,
      description: defaultDescription,
      images: [ogImage],
      creator: "@eventomir", // Optional: Add your Twitter handle if you have one
    },

    // --- ICONS & PWA ---
    icons: {
      icon: favicon,
      shortcut: favicon,
      apple: favicon, // Essential for iOS Home Screen sharing
    },
    manifest: "/manifest.json",

    // --- ROBOTS & SEARCH ENGINES ---
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large", // Tells Google to show large image snippets
        "max-snippet": -1,
      },
    },

    // --- VERIFICATION ---
    verification: {
      google: "ВАШ_КОД_ВЕРИФИКАЦИИ_GOOGLE", // Replace in production
      yandex: "ВАШ_КОД_ВЕРИФИКАЦИИ_ЯНДЕКС", // Replace in production
    },

    // Canonical links prevent duplicate content penalties
    alternates: {
      canonical: "/",
      languages: {
        "ru-RU": "/",
      },
    },
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
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      {/* NATIVE UX: Added select-none to base body, overridden inside specific components */}
      <body className="antialiased flex flex-col min-h-screen font-sans">
        <Providers initialSettings={settings}>
          <AnalyticsTracker />
          {children}
        </Providers>
      </body>
    </html>
  );
}
