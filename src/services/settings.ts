import { cache } from "react";

export interface SiteSettings {
  siteName: string;
  logoUrl?: string;
  logoAltText?: string;
  faviconUrl?: string;
  fontFamily: string;
  contacts: {
    email?: string;
    phone?: string;
    vkLink?: string;
    telegramLink?: string;
  };
  theme: {
    preset?: string;
    radius?: string;
  };
  //  Now includes the 'link' property required for navigation
  siteCategories: Array<{
    id: string;
    name: string;
    icon: string;
    link: string;
  }>;
  pageSpecificSEO: Array<{
    path: string;
    title: string;
    description: string;
    keywords: string;
  }>;
}

const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8800";

/**
 * Fetches the global site settings from the backend.
 * Uses Next.js data cache to revalidate every 60 seconds, preventing unnecessary API calls.
 */
export const getSiteSettings = cache(async (): Promise<SiteSettings | null> => {
  try {
    const res = await fetch(`${API_URL}/api/settings/general`, {
      next: { revalidate: 60 }, // Revalidate cache every 60 seconds
    });

    if (!res.ok) throw new Error("Failed to fetch settings");

    return res.json();
  } catch (error) {
    console.error("Error fetching site settings:", error);
    return null;
  }
});
