"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/utils/api-client";

// --- INTERFACES ---

export type BookingStatus =
  | "PENDING_PERFORMER_APPROVAL"
  | "REJECTED_BY_PERFORMER"
  | "PENDING_CUSTOMER_PAYMENT"
  | "CANCELLED_BY_CUSTOMER"
  | "CONFIRMED"
  | "FULFILLED"
  | "DISPUTED";

export interface BookingRequest {
  id: string;
  performerId: string;
  customerId: string;
  date: string;
  details: string;
  agreedFee?: number | null;
  rejectionReason?: string | null;
  status: BookingStatus;
  createdAt: string;

  // Exists if the booking was MADE by the user
  performer?: {
    user: { name: string; image: string | null; city: string | null };
  };

  // Exists if the booking was RECEIVED by the user
  customer?: {
    name: string;
    email: string;
    image: string | null;
    phone: string | null;
  };
}

export interface MyBookingsResponse {
  made: BookingRequest[];
  received: BookingRequest[];
  isPerformer: boolean;
}

export interface CreateBookingPayload {
  performerId: string;
  date: string;
  details: string;
}

// --- API FUNCTIONS ---

const createBookingRequestFn = async (
  requestData: CreateBookingPayload,
): Promise<BookingRequest> => {
  return await apiRequest<BookingRequest>({
    method: "post",
    url: "/api/bookings",
    data: requestData,
  });
};

const getMyBookingsFn = async (): Promise<MyBookingsResponse> => {
  return await apiRequest<MyBookingsResponse>({
    method: "get",
    url: "/api/bookings/my",
  });
};

const performerReplyFn = async ({
  bookingId,
  action,
  agreedFee,
  rejectionReason,
}: {
  bookingId: string;
  action: "ACCEPT" | "REJECT";
  agreedFee?: number;
  rejectionReason?: string;
}): Promise<void> => {
  return await apiRequest<void>({
    method: "patch",
    url: `/api/bookings/${bookingId}/performer-reply`,
    data: { action, agreedFee, rejectionReason },
  });
};

const customerCancelFn = async ({
  bookingId,
}: {
  bookingId: string;
}): Promise<void> => {
  return await apiRequest<void>({
    method: "patch",
    url: `/api/bookings/${bookingId}/customer-cancel`,
  });
};

const payBookingFn = async ({
  bookingId,
}: {
  bookingId: string;
}): Promise<{ checkoutUrl: string }> => {
  return await apiRequest<{ checkoutUrl: string }>({
    method: "post",
    url: `/api/bookings/${bookingId}/pay`,
  });
};

// --- REACT QUERY HOOKS ---

export const useCreateBookingRequest = () => {
  return useMutation({ mutationFn: createBookingRequestFn });
};

export const useMyBookings = () => {
  return useQuery({
    queryKey: ["my-bookings"],
    queryFn: getMyBookingsFn,
  });
};

export const usePerformerReply = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: performerReplyFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["performer", "profile"] });
    },
  });
};

export const useCustomerCancel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: customerCancelFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
    },
  });
};

export const usePayBooking = () => {
  return useMutation({ mutationFn: payBookingFn });
};
