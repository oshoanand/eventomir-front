"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/utils/api-client";

// --- Types ---

export interface OrderEvent {
  id: string;
  title: string;
  date: string;
  time?: string | null;
  city: string;
  address?: string | null;
  imageUrl: string;
}

export interface OrderData {
  id: string;
  userId: string;
  ticketCount: number;
  totalPrice: number;
  status: string; // e.g., "pending", "completed", "cancelled"
  createdAt: string;
  event: OrderEvent;
}

export interface PurchasePayload {
  eventId: string;
  userId: string;
  ticketCount: number;
}

// --- API Fetchers ---

/**
 * Fetches all orders for the Admin Panel.
 */
export const getAdminOrders = async (): Promise<OrderData[]> => {
  const response = await apiRequest({
    method: "get",
    url: "/api/orders",
  });
  return response as OrderData[];
};

/**
 * Fetches personal ticket history for the logged-in user.
 */
export const getMyOrders = async (): Promise<OrderData[]> => {
  const response = await apiRequest({
    method: "get",
    url: "/api/orders/my",
  });
  return response as OrderData[];
};

/**
 * Initiates the ticket purchase process.
 * Returns the Tinkoff Payment Gateway URL for redirection.
 */
export const purchaseTicketsAPI = async (
  payload: PurchasePayload,
): Promise<string> => {
  try {
    // We cast to `any` because the response object contains the specific Tinkoff URL
    const response: any = await apiRequest({
      method: "post",
      url: `/api/events/${payload.eventId}/purchase`,
      data: {
        userId: payload.userId,
        ticketCount: payload.ticketCount,
      },
    });

    // Check if the backend successfully returned the Tinkoff payment URL
    if (response && response.paymentUrl) {
      return response.paymentUrl;
    }

    throw new Error("Не удалось получить ссылку на оплату от банка.");
  } catch (error: any) {
    console.error("Purchase API error:", error);
    // Safely extract the error message whether it comes from Axios, Fetch, or a standard Error
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Ошибка при создании заказа";
    throw new Error(errorMessage);
  }
};

// --- React Query Hooks ---

/**
 * Hook to fetch all orders for the Admin Panel.
 */
export function useAdminOrdersQuery() {
  return useQuery({
    queryKey: ["orders", "admin"],
    queryFn: getAdminOrders,
  });
}

/**
 * Hook to fetch tickets belonging to the currently authenticated user.
 * @param isAuthenticated - Prevents the query from running if the user is not logged in.
 */
export function useMyOrdersQuery(isAuthenticated: boolean) {
  return useQuery({
    queryKey: ["orders", "my"],
    queryFn: getMyOrders,
    enabled: isAuthenticated, // Only fetch if the user session is active
  });
}

/**
 * Hook to initiate ticket purchase.
 * Automatically invalidates caches to refresh UI (e.g., showing the new "pending" order).
 */
export function usePurchaseTicketsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: purchaseTicketsAPI,
    onSuccess: () => {
      // Invalidate queries so that the user's "My Tickets" list and
      // the event's available ticket count instantly update to reflect the pending reservation.
      queryClient.invalidateQueries({ queryKey: ["orders", "my"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["orders", "admin"] });
    },
  });
}
