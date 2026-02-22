"use client";

import { toast as sonnerToast, type ExternalToast } from "sonner";
import { cn } from "@/utils/utils";

// Allow label to be ReactNode (JSX), not just string
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

function toast({
  title,
  description,
  variant,
  action,
  className,
  ...props
}: ToastProps) {
  // 1. Handle "Destructive"
  if (variant === "destructive") {
    return sonnerToast.error(title, {
      description,
      action,
      className: cn(
        "!bg-red-100 !border-red-200 !text-red-800 dark:!bg-red-900/30 dark:!border-red-900 dark:!text-red-200",
        className,
      ),
      ...props,
    });
  }

  // 2. Handle "Success"
  if (variant === "success") {
    return sonnerToast.success(title, {
      description,
      action,
      className: cn(
        "!bg-green-100 !border-green-200 !text-green-800 dark:!bg-green-900/30 dark:!border-green-900 dark:!text-green-200",
        className,
      ),
      ...props,
    });
  }

  // 3. Default Variant
  return sonnerToast(title, {
    description,
    action,
    className,
    ...props,
  });
}

function useToast() {
  return {
    toast,
    dismiss: (toastId?: string | number) => sonnerToast.dismiss(toastId),
  };
}

export { useToast, toast };
