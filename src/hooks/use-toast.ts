// "use client"; // Client hook directive // Директива для клиентского хука

// // Inspired by react-hot-toast library
// // Вдохновлено библиотекой react-hot-toast
// import * as React from "react";

// import type {
//   ToastActionElement, // Type for the toast action element // Тип для элемента действия в тосте
//   ToastProps, // Type for Toast component props // Тип для пропсов компонента Toast
// } from "@/components/ui/toast";

// // Limit on the number of toasts displayed simultaneously
// // Лимит на количество одновременно отображаемых тостов
// const TOAST_LIMIT = 1;
// // Delay before removing the toast from the DOM after hiding
// // Задержка перед удалением тоста из DOM после его скрытия
// const TOAST_REMOVE_DELAY = 1000000; // Set to a large value so toasts are not removed automatically // Установлено большое значение, чтобы тосты не удалялись автоматически

// // Type for the toast object in the toaster state
// // Тип для объекта тоста в стейте тостера
// type ToasterToast = ToastProps & {
//   id: string; // Unique identifier for the toast // Уникальный идентификатор тоста
//   title?: React.ReactNode; // Toast title // Заголовок тоста
//   description?: React.ReactNode; // Toast description // Описание тоста
//   action?: ToastActionElement; // Action element (button) // Элемент действия (кнопка)
// };

// // Action types for the reducer
// // Типы действий для редюсера
// const actionTypes = {
//   ADD_TOAST: "ADD_TOAST", // Add a toast // Добавить тост
//   UPDATE_TOAST: "UPDATE_TOAST", // Update a toast // Обновить тост
//   DISMISS_TOAST: "DISMISS_TOAST", // Hide a toast (start removal process) // Скрыть тост (начать процесс удаления)
//   REMOVE_TOAST: "REMOVE_TOAST", // Remove a toast from the state // Удалить тост из стейта
// } as const;

// let count = 0; // Counter for generating unique IDs // Счетчик для генерации уникальных ID

// // Function to generate a unique ID // Функция для генерации уникального ID
// function genId() {
//   count = (count + 1) % Number.MAX_SAFE_INTEGER;
//   return count.toString();
// }

// type ActionType = typeof actionTypes; // Type for action types // Тип для типов действий

// // Type for the action object // Тип для объекта действия
// type Action =
//   | {
//       type: ActionType["ADD_TOAST"];
//       toast: ToasterToast;
//     }
//   | {
//       type: ActionType["UPDATE_TOAST"];
//       toast: Partial<ToasterToast>; // Update can be partial // Обновление может быть частичным
//     }
//   | {
//       type: ActionType["DISMISS_TOAST"];
//       toastId?: ToasterToast["id"]; // ID of the toast to dismiss (optional, if dismissing all) // ID тоста для скрытия (опционально, если скрываем все)
//     }
//   | {
//       type: ActionType["REMOVE_TOAST"];
//       toastId?: ToasterToast["id"]; // ID of the toast to remove (optional, if removing all) // ID тоста для удаления (опционально, если удаляем все)
//     };

// // Interface for the toaster state // Интерфейс для стейта тостера
// interface State {
//   toasts: ToasterToast[]; // Array of active toasts // Массив активных тостов
// }

// // Map to store toast removal timeouts // Map для хранения таймаутов удаления тостов
// const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

// // Function to add a toast to the removal queue // Функция добавления тоста в очередь на удаление
// const addToRemoveQueue = (toastId: string) => {
//   // If a timeout already exists, do nothing // Если таймаут уже существует, ничего не делаем
//   if (toastTimeouts.has(toastId)) {
//     return;
//   }

//   // Set a timeout to remove the toast // Устанавливаем таймаут для удаления тоста
//   const timeout = setTimeout(() => {
//     toastTimeouts.delete(toastId); // Remove the timeout from the Map // Удаляем таймаут из Map
//     // Dispatch an action to remove the toast from the state // Диспатчим действие для удаления тоста из стейта
//     dispatch({
//       type: "REMOVE_TOAST",
//       toastId: toastId,
//     });
//   }, TOAST_REMOVE_DELAY);

//   // Store the timeout in the Map // Сохраняем таймаут в Map
//   toastTimeouts.set(toastId, timeout);
// };

// // Reducer function to manage the toast state // Редюсер для управления состоянием тостов
// export const reducer = (state: State, action: Action): State => {
//   switch (action.type) {
//     // Add a new toast // Добавление нового тоста
//     case "ADD_TOAST":
//       return {
//         ...state,
//         // Add the new toast to the beginning and slice to the limit // Добавляем новый тост в начало массива и обрезаем до лимита
//         toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
//       };

//     // Update an existing toast // Обновление существующего тоста
//     case "UPDATE_TOAST":
//       return {
//         ...state,
//         // Update the toast with the matching ID // Обновляем тост с соответствующим ID
//         toasts: state.toasts.map((t) =>
//           t.id === action.toast.id ? { ...t, ...action.toast } : t,
//         ),
//       };

//     // Dismiss a toast (start removal process) // Скрытие тоста (начало процесса удаления)
//     case "DISMISS_TOAST": {
//       const { toastId } = action;

//       // ! Side effects ! - Start removal timer // ! Побочные эффекты ! - Запуск таймера удаления
//       if (toastId) {
//         // If an ID is provided, add the specific toast to the removal queue // Если указан ID, добавляем конкретный тост в очередь на удаление
//         addToRemoveQueue(toastId);
//       } else {
//         // If no ID, add all toasts to the removal queue // Если ID не указан, добавляем все тосты в очередь на удаление
//         state.toasts.forEach((toast) => {
//           addToRemoveQueue(toast.id);
//         });
//       }

//       return {
//         ...state,
//         // Set the 'open' flag to false for the dismissed toast(s) // Устанавливаем флаг open в false для скрываемого тоста (или всех)
//         toasts: state.toasts.map((t) =>
//           t.id === toastId || toastId === undefined
//             ? {
//                 ...t,
//                 open: false,
//               }
//             : t,
//         ),
//       };
//     }
//     // Remove a toast from the state // Удаление тоста из стейта
//     case "REMOVE_TOAST":
//       if (action.toastId === undefined) {
//         // If no ID, remove all toasts // Если ID не указан, удаляем все тосты
//         return {
//           ...state,
//           toasts: [],
//         };
//       }
//       // Remove the toast with the matching ID // Удаляем тост с соответствующим ID
//       return {
//         ...state,
//         toasts: state.toasts.filter((t) => t.id !== action.toastId),
//       };
//   }
// };

// // Array of listeners to update components using the hook // Массив слушателей для обновления компонентов, использующих хук
// const listeners: Array<(state: State) => void> = [];

// // Global toast state (stored in memory) // Глобальное состояние тостов (хранится в памяти)
// let memoryState: State = { toasts: [] };

// // Function to dispatch actions and update listeners // Функция для диспетчеризации действий и обновления слушателей
// function dispatch(action: Action) {
//   memoryState = reducer(memoryState, action); // Update the global state // Обновляем глобальное состояние
//   // Notify all listeners // Уведомляем всех слушателей
//   listeners.forEach((listener) => {
//     listener(memoryState);
//   });
// }

// // Type for creating a new toast (without ID) // Тип для создания нового тоста (без ID)
// type Toast = Omit<ToasterToast, "id">;

// // Function to create and display a new toast // Функция для создания и отображения нового тоста
// function toast({ ...props }: Toast) {
//   const id = genId(); // Generate a unique ID // Генерируем уникальный ID

//   // Function to update this specific toast // Функция для обновления этого конкретного тоста
//   const update = (props: ToasterToast) =>
//     dispatch({
//       type: "UPDATE_TOAST",
//       toast: { ...props, id },
//     });
//   // Function to dismiss this specific toast // Функция для скрытия этого конкретного тоста
//   const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

//   // Dispatch action to add the new toast // Диспатчим действие для добавления нового тоста
//   dispatch({
//     type: "ADD_TOAST",
//     toast: {
//       ...props,
//       id,
//       open: true, // Toast is initially open // Тост изначально открыт
//       // Handler for open state change (for closing via button) // Обработчик изменения состояния open (для закрытия по кнопке)
//       onOpenChange: (open: any) => {
//         if (!open) dismiss();
//       },
//     },
//   });

//   // Return an object with the ID, dismiss, and update functions // Возвращаем объект с ID, и функциями dismiss и update
//   return {
//     id: id,
//     dismiss,
//     update,
//   };
// }

// // Hook to use the toaster in components // Хук для использования тостера в компонентах
// function useToast() {
//   // Local component state, synchronized with the global memoryState // Локальное состояние компонента, синхронизированное с глобальным memoryState
//   const [state, setState] = React.useState<State>(memoryState);

//   // Subscribe to global state changes on mount // Подписка на изменения глобального состояния при монтировании
//   React.useEffect(() => {
//     listeners.push(setState);
//     // Unsubscribe on unmount // Отписка при размонтировании
//     return () => {
//       const index = listeners.indexOf(setState);
//       if (index > -1) {
//         listeners.splice(index, 1);
//       }
//     };
//   }, [state]);

//   // Return the current state and the toast/dismiss functions // Возвращаем текущее состояние и функции toast и dismiss
//   return {
//     ...state,
//     toast, // Function to create new toasts // Функция для создания новых тостов
//     dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }), // Function to dismiss toasts // Функция для скрытия тостов
//   };
// }

// // Export the hook and the toast function // Экспорт хука и функции toast
// export { useToast, toast };

"use client";

import { toast as sonnerToast, type ExternalToast } from "sonner";

// Define the shape of the Action used in your app
type ToastAction = {
  label: string;
  onClick: () => void;
};

// Combine Sonner's native props with your custom variants
type ToastProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: "default" | "destructive" | "success";
  action?: ToastAction; // Explicitly adding this for type safety
} & ExternalToast;

function toast({ title, description, variant, action, ...props }: ToastProps) {
  // 1. Handle "Destructive" (Error) Variant
  if (variant === "destructive") {
    return sonnerToast.error(title, {
      description,
      action: action, // Pass the action object directly
      ...props,
    });
  }

  // 2. Handle "Success" Variant (Green)
  if (variant === "success") {
    return sonnerToast.success(title, {
      description,
      action: action,
      ...props,
    });
  }

  // 3. Default Variant (Standard/Black)
  return sonnerToast(title, {
    description,
    action: action,
    ...props,
  });
}

function useToast() {
  return {
    toast,
    // Sonner handles dismiss via ID, which toast() returns
    dismiss: (toastId?: string | number) => sonnerToast.dismiss(toastId),
  };
}

export { useToast, toast };
