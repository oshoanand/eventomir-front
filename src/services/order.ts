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
  imageUrl: string | null;
}

/**
 * Unified Ticket Interface:
 * Matches the structure expected by app/tickets/page.tsx
 */
export interface UnifiedTicket {
  id: string;
  type: "ORDER" | "INVITATION"; // Identifies the source model
  title: string;
  date: string;
  time: string | null;
  city: string;
  address: string | null;
  imageUrl: string | null;
  status: string; // "PAYMENT_SUCCESS", "ACCEPTED", "CANCELLED", etc.
  isUsed: boolean;
  ticketCount: number;
  eventId: string;
  totalPrice?: number; // Only for Paid Orders
  createdAt: string;
}

export interface PurchasePayload {
  eventId: string;
  ticketCount: number;
}

// --- API Fetchers ---

/**
 * Fetches all orders for the Admin Panel.
 */
export const getAdminOrders = async (): Promise<UnifiedTicket[]> => {
  return await apiRequest({
    method: "get",
    url: "/api/orders",
  });
};

/**
 * Fetches unified ticket history (Paid + Free) for the logged-in user.
 */
export const getMyOrders = async (): Promise<UnifiedTicket[]> => {
  return await apiRequest({
    method: "get",
    url: "/api/orders/my",
  });
};

/**
 * Initiates the ticket purchase process.
 * Returns the Tinkoff Payment Gateway URL for redirection.
 */
export const purchaseTicketsAPI = async (
  payload: PurchasePayload,
): Promise<{ paymentUrl: string }> => {
  try {
    // Correct endpoint based on our backend routes
    return await apiRequest({
      method: "post",
      url: `/api/events/${payload.eventId}/purchase`,
      data: {
        ticketCount: payload.ticketCount,
      },
    });
  } catch (error: any) {
    console.error("Purchase API error:", error);
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "Ошибка при создании заказа";
    throw new Error(errorMessage);
  }
};

/**
 * Submits a free RSVP invitation
 */
export const submitRSVPAPI = async (
  eventId: string,
  payload: {
    guestName: string;
    guestEmail: string;
    guestPhone?: string;
    status: "ACCEPTED" | "REJECTED";
  },
): Promise<{ ticketToken?: string; message: string }> => {
  return await apiRequest({
    method: "post",
    url: `/api/events/${eventId}/rsvp`,
    data: payload,
  });
};

/**
 * NEW: Processes, downloads, or prints a ticket PDF
 */
export const processTicketPDF = async (
  ticket: UnifiedTicket,
  action: "download" | "print",
  accessToken?: string, // Pass the session accessToken if your backend requires Bearer auth for fetches
): Promise<void> => {
  const endpoint =
    ticket.type === "ORDER"
      ? `/api/orders/${ticket.id}/pdf`
      : `/api/invitations/${ticket.id}/pdf`;

  const headers: HeadersInit = {};
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL || ""}${endpoint}`,
    { headers },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch PDF");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);

  if (action === "print") {
    const printWindow = window.open(url, "_blank");
    if (printWindow) {
      printWindow.onload = () => printWindow.print();
    }
  } else {
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Ticket_${ticket.title.replace(/\s+/g, "_")}.pdf`,
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  // Cleanup URL object after action
  setTimeout(() => window.URL.revokeObjectURL(url), 100);
};

// --- React Query Hooks ---

/**
 * Hook to fetch all tickets/orders for the Admin Panel.
 */
export function useAdminOrdersQuery() {
  return useQuery({
    queryKey: ["orders", "admin"],
    queryFn: getAdminOrders,
  });
}

/**
 * Hook to fetch tickets belonging to the currently authenticated user.
 */
export function useMyOrdersQuery(isAuthenticated: boolean) {
  return useQuery({
    queryKey: ["orders", "my"],
    queryFn: getMyOrders,
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // Cache results for 5 minutes
  });
}

/**
 * Hook to initiate ticket purchase.
 */
export function usePurchaseTicketsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: purchaseTicketsAPI,
    onSuccess: () => {
      // Invalidate all relevant keys to refresh UI
      queryClient.invalidateQueries({ queryKey: ["orders", "my"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["orders", "admin"] });
    },
  });
}

/**
 * Hook to handle free RSVPs
 */
export function useRSVPMutation(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: Parameters<typeof submitRSVPAPI>[1]) =>
      submitRSVPAPI(eventId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", "my"] });
      queryClient.invalidateQueries({ queryKey: ["events", eventId] });
      queryClient.invalidateQueries({
        queryKey: ["events", eventId, "attendees"],
      });
    },
  });
}
