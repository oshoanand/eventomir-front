'use client'; // Directive for client hook // Директива для клиентского хука

import * as React from 'react';

// Type definition for the event listener callback function
// Определение типа для функции обратного вызова слушателя событий
type EventListenerCallback = (event: E) => void;

/**
 * Custom React hook to manage event listeners on a specified target.
 * Automatically adds and removes the listener on mount/unmount or when dependencies change.
 *
 * Кастомный React хук для управления слушателями событий на указанной цели.
 * Автоматически добавляет и удаляет слушатель при монтировании/размонтировании или при изменении зависимостей.
 *
 * @template K - The type of the event name (e.g., 'click', 'keydown'). // Тип имени события (например, 'click', 'keydown').
 * @template T - The type of the event target (e.g., Window, Document, HTMLElement). // Тип цели события (например, Window, Document, HTMLElement).
 * @param {K} eventName - The name of the event to listen for. // Имя события для прослушивания.
 * @param {EventListenerCallback} handler - The callback function to execute when the event occurs. // Функция обратного вызова для выполнения при возникновении события.
 * @param {T | null} [element=global?.window] - The target element to attach the listener to (defaults to window). // Целевой элемент для прикрепления слушателя (по умолчанию window).
 * @param {boolean | AddEventListenerOptions} [options] - Optional event listener options. // Необязательные параметры слушателя событий.
 */
export function useEventListener(
  eventName: K,
  handler: EventListenerCallback, // Handler function type // Тип функции-обработчика
  element?: T | null, // Optional target element // Необязательный целевой элемент
  options?: boolean | AddEventListenerOptions // Optional listener options // Необязательные параметры слушателя
) {
  // Store the handler in a ref to avoid re-adding the listener on every render
  // Сохраняем обработчик в ref, чтобы избежать повторного добавления слушателя при каждом рендере
  const savedHandler = React.useRef(handler);

  // Update the ref whenever the handler changes
  // Обновляем ref всякий раз, когда обработчик изменяется
  React.useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  React.useEffect(() => {
    // Determine the target element (use window if not provided or in SSR)
    // Определяем целевой элемент (используем window, если не предоставлен или при SSR)
    const targetElement: T | Window = element ?? window;

    // Ensure the target element supports addEventListener // Убеждаемся, что целевой элемент поддерживает addEventListener
    if (!(targetElement && targetElement.addEventListener)) {
      return; // Exit if the element is not valid // Выходим, если элемент невалиден
    }

    // Create the event listener function that calls the saved handler
    // Создаем функцию слушателя событий, которая вызывает сохраненный обработчик
    const eventListener: EventListener = (event) => savedHandler.current(event as WindowEventMap[K]);

    // Add the event listener // Добавляем слушатель событий
    targetElement.addEventListener(eventName, eventListener, options);

    // Cleanup function to remove the listener when the component unmounts or dependencies change
    // Функция очистки для удаления слушателя при размонтировании компонента или изменении зависимостей
    // eslint-disable-next-line consistent-return
    return () => {
      targetElement.removeEventListener(eventName, eventListener, options);
    };
  }, [eventName, element, options]); // Re-run the effect if eventName, element, or options change // Перезапускаем эффект, если изменяются eventName, element или options
}
