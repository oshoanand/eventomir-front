"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/utils/api-client";

// --- Types ---

export interface EventHost {
  id: string;
  name: string;
  email?: string;
}

export interface Event {
  id: string;
  title: string;
  category: string;

  // New Privacy & Payment Fields
  type: "PUBLIC" | "PRIVATE";
  paymentType: "FREE" | "PAID";
  price: number;
  discountPrice?: number;

  date: string; // ISO string when fetched from the backend
  time?: string | null;
  city: string;
  address?: string | null;
  imageUrl: string;
  description?: string | null;

  // Ticket Data
  totalTickets: number;
  availableTickets: number;

  // State
  status: "active" | "draft" | "cancelled" | "completed" | string;

  // Relational Data
  hostId?: string | null;
  host?: EventHost | null;

  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

// Payload for creating/updating an event (excludes backend-controlled fields)
export type EventPayload = Omit<
  Event,
  "id" | "host" | "createdAt" | "updatedAt" | "availableTickets"
> & { availableTickets?: number };

// --- New Types for RSVP & Ticketing ---

export interface Attendee {
  id: string;
  eventId: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  ticketToken: string;
  isCheckedIn: boolean;
  checkInTime?: string | null;
  createdAt: string;
}

export interface RSVPPayload {
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  status: "ACCEPTED" | "REJECTED";
}

// --- Public API Fetchers ---

/**
 * Fetches all active events from the backend via api-client.
 */
export const getEvents = async (): Promise<Event[]> => {
  try {
    const response = await apiRequest({
      method: "get",
      url: "/api/events",
    });
    return response as Event[];
  } catch (error) {
    console.error("Error fetching events:", error);
    return []; // Return an empty array as a safe fallback
  }
};

/**
 * Fetches a single event by ID.
 */
export const getEventById = async (
  id: string | number,
): Promise<Event | null> => {
  try {
    const response = await apiRequest({
      method: "get",
      url: `/api/events/${id}`,
    });
    return response as Event;
  } catch (error) {
    console.error(`Error fetching event ${id}:`, error);
    return null;
  }
};

// --- Host (Private) API Fetchers ---

export const getMyHostedEvents = async (): Promise<Event[]> => {
  const response = await apiRequest({
    method: "get",
    url: "/api/events/hosted",
  });
  return response as Event[];
};

export const createEventAPI = async (data: EventPayload): Promise<Event> => {
  const response = await apiRequest({
    method: "post",
    url: "/api/events",
    data,
  });
  return response as Event;
};

export const updateEventAPI = async ({
  id,
  data,
}: {
  id: string;
  data: Partial<EventPayload>;
}): Promise<Event> => {
  const response = await apiRequest({
    method: "put",
    url: `/api/events/${id}`,
    data,
  });
  return response as Event;
};

export const deleteEventAPI = async (id: string): Promise<void> => {
  await apiRequest({
    method: "delete",
    url: `/api/events/${id}`,
  });
};

// --- RSVP & Ticketing API Fetchers ---

export const getEventAttendeesAPI = async (
  eventId: string,
): Promise<Attendee[]> => {
  const response = await apiRequest({
    method: "get",
    url: `/api/events/${eventId}/attendees`,
  });
  return response as Attendee[];
};

export const submitRSVPAPI = async ({
  eventId,
  data,
}: {
  eventId: string;
  data: RSVPPayload;
}): Promise<{ ticketToken?: string; message: string }> => {
  const response = await apiRequest({
    method: "post",
    url: `/api/events/${eventId}/rsvp`,
    data,
  });
  return response as { ticketToken?: string; message: string };
};

export const checkInGuestAPI = async (data: {
  ticketToken: string;
  eventId: string;
}): Promise<{ success: boolean; message: string; guestName?: string }> => {
  const response = await apiRequest({
    method: "post",
    url: `/api/events/checkin`,
    data,
  });
  return response as { success: boolean; message: string; guestName?: string };
};

// --- React Query Hooks (Public) ---

/**
 * Hook to fetch the list of all events.
 * Caches the data for 60 seconds.
 */
export function useEventsQuery() {
  return useQuery({
    queryKey: ["events", "all"],
    queryFn: getEvents,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch a single event by ID (e.g., for an Event Details page).
 */
export function useEventQuery(id: string | undefined) {
  return useQuery({
    queryKey: ["events", id],
    queryFn: () => {
      if (!id) throw new Error("ID is required");
      return getEventById(id);
    },
    enabled: !!id,
    staleTime: 60 * 1000,
  });
}

/**
 * Uploads an image to the server and returns the public URL.
 */
export const uploadEventImageAPI = async (
  formData: FormData,
): Promise<{ url: string; fileName?: string }> => {
  const response = await apiRequest({
    method: "post",
    url: "/api/events/upload", // Make sure you create this route on your Node.js backend!
    data: formData,
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response as { url: string; fileName?: string };
};

// --- React Query Hooks (Host Management) ---

/**
 * Hook to fetch events hosted by the current logged-in user.
 */
export function useMyHostedEventsQuery(
  isAuthenticated: boolean,
  isPerformer: boolean,
) {
  return useQuery({
    queryKey: ["events", "hosted"],
    queryFn: getMyHostedEvents,
    enabled: isAuthenticated && isPerformer,
  });
}

export function useCreateEventMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEventAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useUpdateEventMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateEventAPI,
    onSuccess: (updatedEvent) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["events", updatedEvent.id] });
    },
  });
}

export function useDeleteEventMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteEventAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

// --- React Query Hooks (RSVP & Ticketing) ---

/**
 * Hook to fetch attendees for a specific event (Host only).
 */
export function useEventAttendeesQuery(eventId: string) {
  return useQuery({
    queryKey: ["events", eventId, "attendees"],
    queryFn: () => getEventAttendeesAPI(eventId),
    enabled: !!eventId,
  });
}

/**
 * Hook for a guest to submit an RSVP.
 */
export function useSubmitRSVPMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitRSVPAPI,
    onSuccess: (_, variables) => {
      // Invalidate the specific event to update available tickets
      queryClient.invalidateQueries({
        queryKey: ["events", variables.eventId],
      });
    },
  });
}

/**
 * Hook for the host to check-in a guest using their QR Code ticket token.
 */
export function useCheckInGuestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: checkInGuestAPI,
    onSuccess: (_, variables) => {
      // Invalidate the attendees list so the UI reflects the checked-in status
      queryClient.invalidateQueries({
        queryKey: ["events", variables.eventId, "attendees"],
      });
    },
  });
}

/**
 * Hook to handle image uploading with loading states.
 */
export function useUploadImageMutation() {
  return useMutation({
    mutationFn: uploadEventImageAPI,
  });
}
