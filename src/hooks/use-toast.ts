"use client";

import * as React from "react";
import { toast as sonnerToast, type ExternalToast } from "sonner";
import { cn } from "@/utils/utils";

// --- Типизация ---

type ToastAction = {
  label: string | React.ReactNode;
  onClick: () => void;
};

type ToastProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: "default" | "destructive" | "success";
  action?: ToastAction;
} & ExternalToast;

// --- Основная функция toast ---

function toast({
  title,
  description,
  variant,
  action,
  className,
  ...props
}: ToastProps) {
  // Конфигурация для разных вариантов
  const commonProps = {
    description,
    action,
    ...props,
  };

  if (variant === "destructive") {
    return sonnerToast.error(title, {
      ...commonProps,
      className: cn(
        "!bg-red-100 !border-red-200 !text-red-800 dark:!bg-red-900/30 dark:!border-red-900 dark:!text-red-200 rounded-2xl shadow-lg",
        className,
      ),
    });
  }

  if (variant === "success") {
    return sonnerToast.success(title, {
      ...commonProps,
      className: cn(
        "!bg-green-100 !border-green-200 !text-green-800 dark:!bg-green-900/30 dark:!border-green-900 dark:!text-green-200 rounded-2xl shadow-lg",
        className,
      ),
    });
  }

  // Дефолтный вариант
  return sonnerToast(title, {
    ...commonProps,
    className: cn("rounded-2xl shadow-lg border-border", className),
  });
}

// --- Хук useToast ---

function useToast() {
  return {
    /**
     * Стандартное уведомление (Default, Success, Destructive)
     */
    toast,

    /**
     * Продвинутый метод для обработки асинхронных операций.
     * Автоматически меняет иконки (спиннер -> галочка/крестик).
     */
    promise: <T>(
      promise: Promise<T>,
      data: {
        loading: string | React.ReactNode;
        success: string | ((data: T) => string | React.ReactNode);
        error: string | ((error: any) => string | React.ReactNode);
      },
    ) => {
      return sonnerToast.promise(promise, {
        loading: data.loading,
        success: data.success,
        error: data.error,
        className: "rounded-2xl shadow-lg border-border font-medium",
      });
    },

    /**
     * Принудительное закрытие уведомления по ID
     */
    dismiss: (toastId?: string | number) => sonnerToast.dismiss(toastId),
  };
}

export { useToast, toast };
