import { cache } from "react";

// Этот файл содержит функции для работы с настройками сайта НА КЛИЕНТЕ

import type { SiteSettings as SiteSettingsType } from "@/types/globals.d";

// Re-export type for broader use
export type SiteSettings = SiteSettingsType;

const defaultSettings: SiteSettings = {
  siteName: "Eventomir",
  logoUrl: "",
  logoAltText: "Логотип Eventomir",
  faviconUrl: "/favicon.ico",
  theme: {
    backgroundColor: "#f5f5dc",
    primaryColor: "#ffb6c1",
    accentColor: "#ffd700",
  },
  pageSpecificSEO: [
    {
      path: "/",
      title: "Eventomir: Главная страница",
      description:
        "Платформа для поиска лучших исполнителей для вашего мероприятия.",
      keywords: "eventomir, мероприятия, исполнители",
    },
    {
      path: "/partnership",
      title: "Партнерская программа Eventomir",
      description:
        "Зарабатывайте вместе с нами, привлекая талантливых исполнителей на нашу платформу.",
      keywords: "партнерская программа, заработок, рефералы, eventomir",
    },
  ],
  fontFamily: "Arial, sans-serif",
  siteCategories: [
    { id: "1", name: "Фотографы", icon: "Camera" },
    { id: "2", name: "DJ", icon: "Music" },
    { id: "3", name: "Ведущие", icon: "Mic" },
  ],
  partnershipConfig: {
    commissionRate: 15,
    cookieLifetime: 30,
    minPayout: 1000,
  },
  contacts: {
    email: "support@eventomir.ru",
    phone: "+7 (495) 123-45-67",
    vkLink: "https://vk.com/eventomir",
    telegramLink: "https://t.me/eventomir",
  },
};

// NEW: Client-side function to get settings via API route
export const getSiteSettingsClient = async (): Promise<SiteSettings> => {
  try {
    const response = await fetch("/api/settings");
    if (!response.ok) {
      console.error(
        "Ошибка получения настроек сайта (клиент):",
        response.statusText,
      );
      return defaultSettings;
    }
    const settings = await response.json();

    // Merge fetched settings with defaults to ensure all keys are present
    const mergedSettings = { ...defaultSettings, ...settings };

    // Ensure critical nested objects exist
    if (!mergedSettings.pageSpecificSEO)
      mergedSettings.pageSpecificSEO = defaultSettings.pageSpecificSEO;
    if (!mergedSettings.theme) mergedSettings.theme = defaultSettings.theme;

    return mergedSettings;
  } catch (e) {
    console.error(
      "Критическая ошибка при получении настроек сайта на клиенте:",
      e,
    );
  }
  return defaultSettings;
};

// This function is for client-side updates, now calling our API.
export const updateSiteSettings = async (
  settings: Partial<SiteSettings>,
): Promise<void> => {
  try {
    const response = await fetch("/api/settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Ошибка обновления настроек сайта:", errorData.message);
      throw new Error("Не удалось сохранить настройки.");
    }
  } catch (error) {
    console.error("Критическая ошибка при обновлении настроек:", error);
    throw new Error("Не удалось сохранить настройки.");
  }
};

// Функция для загрузки файлов через API
export const uploadFile = async (
  file: File,
  bucket: string,
  path: string = "",
): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("bucket", bucket);
  formData.append("path", path);

  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Не удалось загрузить файл.");
    }

    const result = await response.json();
    return result.publicUrl;
  } catch (error) {
    console.error(`Ошибка загрузки файла в бакет ${bucket}:`, error);
    throw new Error(`Не удалось загрузить файл.`);
  }
};

export const uploadSiteFile = async (
  file: File,
  fileType: "logo" | "favicon",
): Promise<string> => {
  return uploadFile(file, "site-assets", fileType);
};

// This function now returns hardcoded default settings as the dependency on Supabase has been removed.
// The data fetching logic has been commented out but can be restored later.
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  console.warn(
    "Загрузка настроек из базы данных отключена. Используются значения по умолчанию.",
  );
  return defaultSettings;
});
