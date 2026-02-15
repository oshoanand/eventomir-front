// "use client";

// import { useToast } from "@/hooks/use-toast"; // Import the useToast hook // Импорт хука useToast
// import {
//   Toast,
//   ToastClose,
//   ToastDescription,
//   ToastProvider,
//   ToastTitle,
//   ToastViewport,
// } from "@/components/ui/toast"; // Import Toast UI components // Импорт UI компонентов Toast

// // Toaster component: Renders the toasts managed by the useToast hook
// // Компонент Toaster: Рендерит тосты, управляемые хуком useToast
// export function Toaster() {
//   // Get the current list of toasts from the hook // Получаем текущий список тостов из хука
//   const { toasts } = useToast();

//   return (
//     <ToastProvider>
//       {/* Map through the toasts array and render each Toast component */}
//       {/* Итерируем по массиву тостов и рендерим каждый компонент Toast */}
//       {toasts.map(function ({ id, title, description, action, ...props }) {
//         return (
//           <Toast key={id} {...props}>
//             {" "}
//             {/* Unique key for each toast */}{" "}
//             {/* Уникальный ключ для каждого тоста */}
//             <div className="grid gap-1">
//               {" "}
//               {/* Grid layout for title and description */}{" "}
//               {/* Grid расположение для заголовка и описания */}
//               {title && <ToastTitle>{title}</ToastTitle>}{" "}
//               {/* Render title if provided */}{" "}
//               {/* Рендерим заголовок, если предоставлен */}
//               {description && (
//                 <ToastDescription>{description}</ToastDescription>
//               )}{" "}
//               {/* Render description if provided */}{" "}
//               {/* Рендерим описание, если предоставлено */}
//             </div>
//             {action} {/* Render the action element (button) if provided */}{" "}
//             {/* Рендерим элемент действия (кнопку), если предоставлен */}
//             <ToastClose /> {/* Render the close button */}{" "}
//             {/* Рендерим кнопку закрытия */}
//           </Toast>
//         );
//       })}
//       {/* Viewport component defines where toasts appear on the screen */}
//       {/* Компонент Viewport определяет, где тосты появляются на экране */}
//       <ToastViewport />
//     </ToastProvider>
//   );
// }

"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="system"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-black group-[.toaster]:border-gray-200 group-[.toaster]:shadow-lg dark:group-[.toaster]:bg-zinc-950 dark:group-[.toaster]:text-white dark:group-[.toaster]:border-zinc-800",
          description:
            "group-[.toast]:text-gray-500 dark:group-[.toast]:text-gray-400",
          actionButton:
            "group-[.toast]:bg-black group-[.toast]:text-white dark:group-[.toast]:bg-white dark:group-[.toast]:text-black",
          cancelButton:
            "group-[.toast]:bg-gray-100 group-[.toast]:text-gray-500 dark:group-[.toast]:bg-zinc-800 dark:group-[.toast]:text-gray-400",
        },
      }}
      {...props}
    />
  );
}
