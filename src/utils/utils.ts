import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper to format 9876543211 -> +7 (987) 654 32-11
export const formatMobile = (mobile: string) => {
  // Remove non-digit characters just in case
  const clean = mobile.replace(/\D/g, "");

  // Check if it's a valid length (usually 10 digits for RU mobile without country code)
  // If user stored full 11 digits starting with 7 or 8, handle accordingly
  let body = clean;
  if (clean.length === 11) {
    body = clean.substring(1); // Remove leading 7 or 8
  }

  if (body.length === 10) {
    return `+7 (${body.substring(0, 3)}) ${body.substring(3, 6)} ${body.substring(6, 8)}-${body.substring(8, 10)}`;
  }

  // Fallback if format is unexpected
  return mobile;
};
