"use client";

import { apiRequest } from "@/utils/api-client";

// --- Types ---

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "REJECTED"
  | "CANCELLED_BY_CUSTOMER";

export interface BookingRequest {
  id: string;
  date: Date | string;
  details?: string;
  status: BookingStatus;
  customerId: string;
  customerName?: string;
  performerId: string;
  performerName?: string;
  price?: number;
  service?: string;
  createdAt?: string;
}

export interface CreateBookingPayload {
  performerId: string;
  requestData: {
    date: Date;
    customerId: string;
    customerName?: string;
    details?: string;
  };
}

// --- API Functions ---

/**
 * Creates a new booking request.
 * Used by the Customer on the Performer's profile.
 */
export const createBookingRequest = async ({
  performerId,
  requestData,
}: CreateBookingPayload): Promise<BookingRequest> => {
  return await apiRequest<BookingRequest>({
    method: "post",
    url: "/api/bookings",
    data: {
      performerId,
      ...requestData,
    },
  });
};

/**
 * Accepts a booking request.
 * Used by the Performer via Dashboard or Notifications.
 */
export const acceptBookingRequest = async (
  requestId: string,
  performerId: string,
): Promise<BookingRequest> => {
  return await apiRequest<BookingRequest>({
    method: "patch",
    url: `/api/bookings/${requestId}/accept`,
    data: { performerId },
  });
};

/**
 * Rejects a booking request.
 * Used by the Performer via Dashboard or Notifications.
 */
export const rejectBookingRequest = async (
  requestId: string,
  performerId: string,
): Promise<BookingRequest> => {
  return await apiRequest<BookingRequest>({
    method: "patch",
    url: `/api/bookings/${requestId}/reject`,
    data: { performerId },
  });
};

/**
 * Fetches a single booking details (Optional helper).
 */
export const getBookingById = async (
  bookingId: string,
): Promise<BookingRequest> => {
  return await apiRequest<BookingRequest>({
    method: "get",
    url: `/api/bookings/${bookingId}`,
  });
};
