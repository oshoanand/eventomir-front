// services/agency.ts
import { apiRequest } from "@/utils/api-client";
import { PerformerProfile } from "./performer";
import { BookingRequest } from "./booking";

/**
 * Fetches all specialists belonging to the authenticated agency.
 */
export const getAgencySpecialists = async (): Promise<PerformerProfile[]> => {
  return await apiRequest<PerformerProfile[]>({
    method: "get",
    url: "/api/agency/specialists",
  });
};

/**
 * Creates or updates a specialist profile.
 */
export const saveSpecialist = async (data: Partial<PerformerProfile>) => {
  return await apiRequest({
    method: "post",
    url: "/api/agency/specialists",
    data,
  });
};

/**
 * Deletes a specialist from the agency.
 */
export const deleteSpecialist = async (id: string) => {
  return await apiRequest({
    method: "delete",
    url: `/api/agency/specialists/${id}`,
  });
};

/**
 * Fetches all bookings for the agency's specialists.
 */
export const getAgencyBookings = async (): Promise<BookingRequest[]> => {
  const data = await apiRequest<any[]>({
    method: "get",
    url: "/api/agency/bookings",
  });

  // Hydrate dates
  return data.map((b) => ({
    ...b,
    eventDate: new Date(b.date),
    createdAt: new Date(b.createdAt),
  }));
};
