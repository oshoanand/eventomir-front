"use client";

import { getSession } from "next-auth/react";
import { apiRequest } from "@/utils/api-client"; // Helper for authenticated requests

// --- Interfaces ---

// Определяем форму результата для действий аутентификации
export interface AuthActionResult {
  success: boolean;
  message: string;
}

// Определяем структуру данных для регистрации исполнителя
interface PerformerRegistrationData {
  accountType: string;
  email: string;
  name: string;
  companyName?: string;
  phone: string;
  inn?: string;
  city: string;
}

// Define the data structure for customer registration
interface CustomerRegistrationData {
  accountType: string;
  email: string;
  name: string;
  companyName?: string;
  inn?: string;
  phone: string;
  city: string;
}

// Defines the structure of the user object we expect from the session.
export interface CurrentUser {
  id: string;
  name?: string | null;
  email?: string | null;
  role: string;
}

// --- Constants ---

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8800";

// --- Registration Functions (Public) ---

export const registerPerformerWithVerification = async (
  performerData: PerformerRegistrationData,
  password: string,
  referralId: string | null,
): Promise<AuthActionResult> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/auth/register-performer`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          performerData,
          password,
          referralId,
        }),
      },
    );

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.message || "Произошла ошибка при регистрации.",
      };
    }

    return result as AuthActionResult;
  } catch (error) {
    console.error("Network or unexpected error during registration:", error);
    return {
      success: false,
      message:
        "Не удалось связаться с сервером. Проверьте ваше интернет-соединение.",
    };
  }
};

export const registerCustomerWithVerification = async (
  customerData: CustomerRegistrationData,
  password: string,
): Promise<AuthActionResult> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register-customer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customerData,
        password,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.message || "An error occurred during registration.",
      };
    }

    return result as AuthActionResult;
  } catch (error) {
    console.error(
      "Network or unexpected error during customer registration:",
      error,
    );
    return {
      success: false,
      message:
        "Could not connect to the server. Please check your internet connection.",
    };
  }
};

// --- Session Functions ---

/**
 * Retrieves the current user's session from the client-side using NextAuth.
 * @returns A promise that resolves to the CurrentUser object or null if not authenticated.
 */
export const getCurrentUser = async (): Promise<CurrentUser | null> => {
  try {
    const session = await getSession();

    if (!session || !session.user) {
      return null;
    }

    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
    };
  } catch (error) {
    console.error("Error fetching current user session:", error);
    return null;
  }
};

// --- Account Management Functions (Authenticated) ---

/**
 * Changes the user's password.
 * Uses apiRequest to automatically handle the Authorization header.
 */
export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<AuthActionResult> => {
  try {
    // 1. Define what the backend response looks like
    interface ChangePasswordResponse {
      message?: string;
    }

    // 2. Cast the result to that interface
    const result = (await apiRequest({
      method: "post",
      url: "/api/auth/change-password",
      data: {
        userId,
        currentPassword,
        newPassword,
      },
    })) as ChangePasswordResponse;

    return {
      success: true,
      message: result.message || "Пароль успешно изменен.",
    };
  } catch (error: any) {
    console.error("Change password error:", error);
    // Extract error message from backend response if available
    // Note: ensure your apiRequest throws an error object that actually has .response.data
    // If apiRequest abstracts that away, you might need just error.message
    const msg =
      error.response?.data?.message ||
      error.message ||
      "Не удалось сменить пароль.";

    return {
      success: false,
      message: typeof msg === "string" ? msg : "Произошла неизвестная ошибка",
    };
  }
};

/**
 * Deletes the user's account.
 * Uses apiRequest to automatically handle the Authorization header.
 */
export const deleteUserAccount = async (
  userId: string,
): Promise<AuthActionResult> => {
  interface DeleteResponse {
    message?: string;
  }
  try {
    const result = (await apiRequest({
      method: "delete",
      url: `/api/auth/account/${userId}`,
    })) as DeleteResponse;

    return {
      success: true,
      message: result.message || "Аккаунт успешно удален.",
    };
  } catch (error: any) {
    console.error("Delete account error:", error);
    const msg =
      error.response?.data?.message ||
      error.message ||
      "Не удалось удалить аккаунт.";
    return {
      success: false,
      message: msg,
    };
  }
};
