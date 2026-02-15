'use client'; // Directive for client hook // Директива для клиентского хука

import * as React from 'react';

/**
 * Custom React hook to check if the component is mounted.
 * Returns true after the component has mounted on the client-side.
 * Useful for avoiding hydration errors by conditionally rendering client-only content.
 *
 * Кастомный React хук для проверки, смонтирован ли компонент.
 * Возвращает true после того, как компонент смонтирован на стороне клиента.
 * Полезен для избежания ошибок гидратации путем условного рендеринга контента только на клиенте.
 *
 * @returns {boolean} - True if the component is mounted, false otherwise (during SSR or before mount). // True, если компонент смонтирован, иначе false (во время SSR или до монтирования).
 */
export function useMounted(): boolean {
  // State to track mount status, initialized to false // Состояние для отслеживания статуса монтирования, инициализировано false
  const [mounted, setMounted = React.useState<boolean>(false);

  // Effect runs only once after the initial render on the client
  // Эффект выполняется только один раз после первоначального рендера на клиенте
  React.useEffect(() => {
    // Set mounted state to true // Устанавливаем состояние монтирования в true
    setMounted(true);
  }, []); // Empty dependency array ensures this runs only once // Пустой массив зависимостей гарантирует выполнение только один раз

  return mounted; // Return the mounted status // Возвращаем статус монтирования
}
