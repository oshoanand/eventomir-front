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
  price: number;
  date: string; // ISO string when fetched from the backend (e.g., "2026-03-10T19:00:00.000Z")
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

  // Relational Data (Replaced the old performerId)
  hostId?: string | null;
  host?: EventHost | null;

  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

// Payload for creating/updating an event (excludes fields controlled by the backend)
export type EventPayload = Omit<
  Event,
  "id" | "host" | "createdAt" | "updatedAt" | "availableTickets"
>;

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

// --- Performer (Private) API Fetchers ---

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
export function useEventQuery(id: string | number | undefined) {
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

// --- React Query Hooks (Performer Management) ---

/**
 * Hook to fetch events hosted by the current logged-in performer.
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
      // Invalidate both the performer's list and the public list
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
      // Also optionally invalidate the specific event cache
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
