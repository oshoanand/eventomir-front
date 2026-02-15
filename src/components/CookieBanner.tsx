"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { cn } from "@/utils/utils";
import { Cookie } from "lucide-react";

const COOKIE_CONSENT_KEY = "eventomir_cookie_consent"; // Key for localStorage // Ключ для localStorage

/**
 * Note: Cookie consent logic is currently stored in localStorage.
 * Check compliance with regulations and consider migrating to the backend if necessary.
 */
const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false); // Banner visibility state // Состояние видимости баннера

  useEffect(() => {
    // Check consent only on the client after mounting
    // Проверяем согласие только на клиенте после монтирования
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    // Show banner if consent is not yet given (or not configured)
    // Показываем баннер, если согласие еще не дано (или не настроено)
    if (!consent) {
      setIsVisible(true);
    }
  }, []); // Empty dependency array ensures this runs only once on mount // Пустой массив зависимостей гарантирует выполнение только один раз при монтировании

  // Handler for the "Accept" button click
  // Обработчик нажатия кнопки "Принять"
  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted"); // Save consent status as 'accepted' // Сохраняем согласие 'accepted'
    setIsVisible(false); // Hide the banner // Скрываем баннер
  };

  // Handler for the "Configure" button click (placeholder)
  // Обработчик нажатия кнопки "Настроить" (заглушка)
  // Placeholder: Cookie configuration functionality is not yet implemented.
  const handleConfigure = () => {
    // Implement cookie configuration logic (e.g., open a modal)
    // Реализовать логику настройки cookies (открытие модального окна и т.д.)
    // For now, just hide the banner and save status as 'configured'
    // Пока просто скрываем баннер и сохраняем статус 'configured'
    localStorage.setItem(COOKIE_CONSENT_KEY, "configured");
    setIsVisible(false);
    console.log("Запрошена настройка Cookies (заглушка)"); // Cookie configuration requested (placeholder)
  };

  // Don't render the banner if it shouldn't be visible
  // Не рендерим баннер, если он не должен быть видимым
  if (!isVisible) {
    return null;
  }

  return (
    <Card
      className={cn(
        "fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-50 w-auto max-w-lg shadow-lg border-primary/20", // Positioning and styling // Позиционирование и стили
        "transition-transform duration-500 ease-in-out", // Appearance/disappearance animation // Анимация появления/скрытия
        isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0", // Classes for animation // Классы для анимации
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Cookie className="h-5 w-5 text-primary" />
          Использование Cookies {/* Cookie Usage */}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm pb-4">
        {/* Updated banner text */}
        {/* Обновленный текст баннера */}
        <p>
          Мы используем файлы cookie для улучшения работы сайта Eventomir и
          вашего взаимодействия с ним. Продолжая использовать сайт, вы
          соглашаетесь с нашими{" "}
          {/* We use cookies to improve the performance of the Eventomir site and your interaction with it. By continuing to use the site, you agree to our */}
          <Link href="/documents" className="underline hover:text-primary">
            условиями использования и политиками
          </Link>
          . {/* terms of use and policies */}
        </p>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleConfigure}>
          Настроить
        </Button>{" "}
        {/* Configure */}
        <Button variant="destructive" size="sm" onClick={handleAccept}>
          Принять
        </Button>{" "}
        {/* Accept */}
      </CardFooter>
    </Card>
  );
};

export default CookieBanner;
