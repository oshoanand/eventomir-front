"use client";

// Note: This service handles client-side comparison logic using localStorage.
// For persistent and synced comparison, consider moving this logic to the backend.
// Примечание: Этот сервис обрабатывает логику сравнения на стороне клиента, используя localStorage.
// Для постоянного и синхронизированного сравнения рассмотрите возможность переноса этой логики на бэкенд.

const COMPARE_STORAGE_KEY = 'eventomir_compare_list'; // Key for localStorage // Ключ для localStorage

// Adds a performer to the comparison list in localStorage.
// Добавляет исполнителя в список сравнения в localStorage.
export const addToCompare = (performerId: string): boolean => {
  if (typeof window === 'undefined') return false; // Return false if window is not defined (SSR) // Возвращаем false, если window не определено (SSR)

  try {
    const currentList = getCompareList(); // Get the current list // Получаем текущий список
    if (!currentList.includes(performerId)) { // Add only if not already present // Добавляем, только если еще не присутствует
      const newList = [...currentList, performerId];
      localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(newList)); // Save the updated list // Сохраняем обновленный список
    }
    return true; // Return true on success // Возвращаем true при успехе
  } catch (error) {
    console.error("Ошибка добавления в список сравнения:", error); // Error adding to comparison list:
    return false; // Return false on error // Возвращаем false при ошибке
  }
};

// Removes a performer from the comparison list in localStorage.
// Удаляет исполнителя из списка сравнения в localStorage.
export const removeFromCompare = (performerId: string): boolean => {
  if (typeof window === 'undefined') return false; // Return false if window is not defined (SSR) // Возвращаем false, если window не определено (SSR)

  try {
    const currentList = getCompareList(); // Get the current list // Получаем текущий список
    const newList = currentList.filter(id => id !== performerId); // Filter out the performer to remove // Фильтруем исполнителя для удаления
    localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(newList)); // Save the updated list // Сохраняем обновленный список
    return true; // Return true on success // Возвращаем true при успехе
  } catch (error) {
    console.error("Ошибка удаления из списка сравнения:", error); // Error removing from comparison list:
    return false; // Return false on error // Возвращаем false при ошибке
  }
};

// Retrieves the comparison list from localStorage.
// Получает список сравнения из localStorage.
export const getCompareList = (): string[] => {
  if (typeof window === 'undefined') return []; // Return empty array if window is not defined (SSR) // Возвращаем пустой массив, если window не определено (SSR)

  try {
    const storedList = localStorage.getItem(COMPARE_STORAGE_KEY); // Get the stored list // Получаем сохраненный список
    return storedList ? JSON.parse(storedList) : []; // Parse JSON or return empty array // Парсим JSON или возвращаем пустой массив
  } catch (error) {
    console.error("Ошибка получения списка сравнения:", error); // Error getting comparison list:
    return []; // Return empty array on error // Возвращаем пустой массив при ошибке
  }
};

// Clears the entire comparison list from localStorage.
// Очищает весь список сравнения из localStorage.
export const clearCompareList = (): boolean => {
  if (typeof window === 'undefined') return false; // Return false if window is not defined (SSR) // Возвращаем false, если window не определено (SSR)

  try {
    localStorage.removeItem(COMPARE_STORAGE_KEY); // Remove the list from localStorage // Удаляем список из localStorage
    return true; // Return true on success // Возвращаем true при успехе
  } catch (error) {
    console.error("Ошибка очистки списка сравнения:", error); // Error clearing comparison list:
    return false; // Return false on error // Возвращаем false при ошибке
  }
};
