"use client"; // Makes ClientLayout a client component // Делаем ClientLayout клиентским компонентом

import React from 'react';
import ClientHeader from "@/components/ClientHeader";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner"; // Import CookieBanner // Импорт CookieBanner
import { usePathname } from 'next/navigation'; // Import usePathname // Импортируем usePathname

// Client layout, includes header and footer
// This component wraps child elements and adds ClientHeader and Footer
// 'use client' is necessary because ClientHeader and Footer use client hooks/components
// Клиентский макет, включающий заголовок и футер
// Этот компонент обертывает дочерние элементы и добавляет ClientHeader и Footer
// Пометка 'use client' необходима, так как ClientHeader и Footer используют клиентские хуки/компоненты
const ClientLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname(); // Get the current path // Получаем текущий путь

  // Can add logic to not display header/footer on certain pages
  // Можно добавить логику, чтобы не отображать хедер/футер на определенных страницах
  // const hideHeaderFooter = pathname === '/some-special-page';

  return (
    // Correctly wrap children in a React fragment or a div
    // Корректно оборачиваем дочерние элементы во фрагмент React или div
    <>
      {/* { !hideHeaderFooter && <ClientHeader /> } */}
      <ClientHeader /> {/* Display header */} {/* Отображаем хедер */}
      <main className="flex-grow">{children}</main> {/* Render main content with flex-grow */} {/* Отображаем основное содержимое с flex-grow */}
      {/* { !hideHeaderFooter && <Footer /> } */}
      <Footer /> {/* Display footer */} {/* Отображаем футер */}
      <CookieBanner /> {/* Add cookie banner */} {/* Добавляем баннер cookie */}
    </>
  );
};

export default ClientLayout;
