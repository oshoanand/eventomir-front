"use client";

import { apiRequest } from "@/utils/api-client";

/**
 * Represents the denormalized data for a performer stored in a user's favorites list.
 */
export interface FavoritePerformer {
  id: string; // This is the performer's user ID
  name: string;
  image?: string | null; // 🚨 FIX: Changed from profilePicture to match backend
  city?: string | null;
  roles?: string[];
}

/**
 * Adds a performer to a customer's favorites list.
 */
export const addToFavorites = async (
  customerId: string,
  performer: FavoritePerformer,
): Promise<{ message: string }> => {
  return apiRequest({
    method: "POST",
    url: `/api/users/${customerId}/favorites`,
    data: { performer },
  });
};

/**
 * Removes a performer from a customer's favorites list.
 */
export const removeFromFavorites = async (
  customerId: string,
  performerId: string,
): Promise<{ success: boolean }> => {
  return apiRequest({
    method: "DELETE",
    url: `/api/users/${customerId}/favorites/${performerId}`,
  });
};

/**
 * Checks if a specific performer is in a customer's favorites list.
 */
export const isFavorite = async (
  customerId: string,
  performerId: string,
): Promise<boolean> => {
  try {
    const data = await apiRequest<{ isFavorite: boolean }>({
      method: "GET",
      url: `/api/users/${customerId}/favorites/${performerId}`,
    });
    return data.isFavorite === true;
  } catch (error) {
    console.error("Error in isFavorite check:", error);
    return false; // Safely default to false
  }
};

/**
 * Retrieves all favorite performers for a given customer.
 */
export const getFavorites = async (
  customerId: string,
): Promise<FavoritePerformer[]> => {
  return apiRequest({
    method: "GET",
    url: `/api/users/${customerId}/favorites`,
  });
};
