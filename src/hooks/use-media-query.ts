'use client'; // Directive for client hook // Директива для клиентского хука

import * as React from 'react';

/**
 * Custom React hook to track the state of a CSS media query.
 * Returns true if the media query matches, false otherwise.
 * Handles server-side rendering gracefully by returning false initially.
 *
 * Кастомный React хук для отслеживания состояния CSS медиа-запроса.
 * Возвращает true, если медиа-запрос совпадает, иначе false.
 * Корректно обрабатывает рендеринг на стороне сервера, возвращая false изначально.
 *
 * @param {string} query - The CSS media query string to match (e.g., '(min-width: 768px)'). // Строка CSS медиа-запроса для сопоставления (например, '(min-width: 768px)').
 * @returns {boolean} - True if the media query matches, false otherwise. // True, если медиа-запрос совпадает, иначе false.
 */
export function useMediaQuery(query: string): boolean {
  // State to store the match status, initialized to false for SSR // Состояние для хранения статуса совпадения, инициализировано false для SSR
  const [value, setValue = React.useState<boolean>(false);

  React.useEffect(() => {
    // This effect runs only on the client side // Этот эффект выполняется только на стороне клиента

    // Function to update the state based on the media query match // Функция для обновления состояния на основе совпадения медиа-запроса
    function onChange(event: MediaQueryListEvent) {
      setValue(event.matches);
    }

    // Create a MediaQueryList object // Создаем объект MediaQueryList
    const result = window.matchMedia(query);
    // Add listener for changes in the media query match state // Добавляем слушатель изменений состояния совпадения медиа-запроса
    result.addEventListener('change', onChange);
    // Set the initial state based on the current match status // Устанавливаем начальное состояние на основе текущего статуса совпадения
    setValue(result.matches);

    // Cleanup function: remove the listener when the component unmounts // Функция очистки: удаляем слушатель при размонтировании компонента
    return () => result.removeEventListener('change', onChange);
  }, [query]); // Re-run the effect if the query string changes // Перезапускаем эффект, если строка запроса изменяется

  return value; // Return the current match status // Возвращаем текущий статус совпадения
}
