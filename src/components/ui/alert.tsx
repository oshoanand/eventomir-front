import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/utils/utils";

// Define alert variants using class-variance-authority
// Определяем варианты alert с помощью class-variance-authority
const alertVariants = cva(
  // Base styles for the alert container
  // Базовые стили для контейнера alert
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      // Define different visual variants
      // Определяем различные визуальные варианты
      variant: {
        default: "bg-background text-foreground", // Default style // Стиль по умолчанию
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive", // Destructive (error) style // Стиль destructive (ошибка)
      },
    },
    defaultVariants: {
      variant: "default", // Set the default variant // Устанавливаем вариант по умолчанию
    },
  },
);

// Alert component definition
// Определение компонента Alert
const Alert = React.forwardRef<
  HTMLDivElement, // The type of the DOM element the ref points to // Тип DOM-элемента, на который указывает ref
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants> // Props: HTML attributes + variant props // Пропсы: HTML атрибуты + пропсы вариантов
>(
  (
    { className, variant, ...props },
    ref, // Props: HTML attributes + variant props // Пропсы: HTML атрибуты + пропсы вариантов
  ) => (
    <div
      ref={ref} // Forward the ref // Перенаправляем ref
      role="alert" // ARIA role for accessibility // Роль ARIA для доступности
      className={cn(alertVariants({ variant }), className)} // Combine base variant styles with custom classes // Объединяем базовые стили варианта с кастомными классами
      {...props} // Spread remaining props // Распространяем остальные пропсы
    />
  ),
);
Alert.displayName = "Alert"; // Set display name for debugging // Устанавливаем имя для отладки

// AlertTitle component definition // Определение компонента AlertTitle
const AlertTitle = React.forwardRef<
  HTMLParagraphElement, // DOM element type // Тип DOM-элемента
  React.HTMLAttributes<HTMLHeadingElement> // Props type // Тип пропсов
>(({ className, ...props }, ref) => (
  // Using <h5> for semantic heading, adjust if needed // Используем <h5> для семантического заголовка, измените при необходимости
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)} // Base styles // Базовые стили
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle"; // Set display name // Устанавливаем имя

// AlertDescription component definition // Определение компонента AlertDescription
const AlertDescription = React.forwardRef<
  HTMLParagraphElement, // DOM element type // Тип DOM-элемента
  React.HTMLAttributes<HTMLParagraphElement> // Props type // Тип пропсов
>(({ className, ...props }, ref) => (
  // The main description text of the alert // Основной текст описания alert
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)} // Base styles // Базовые стили
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription"; // Set display name // Устанавливаем имя

// Export the components // Экспортируем компоненты
export { Alert, AlertTitle, AlertDescription };
