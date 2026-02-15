"use client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

/**
 * A helper function to process API responses.
 */
const handleResponse = async (response: Response) => {
  if (response.status === 204) return { success: true }; // For DELETE requests

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `API Error: ${response.status}`);
  }
  return data;
};

/**
 * Represents the denormalized data for a performer stored in a user's favorites list.
 */
export interface FavoritePerformer {
  id: string; // This is the performer's ID
  name: string;
  profilePicture?: string;
  city?: string;
  roles?: string[];
}

/**
 * Adds a performer to a customer's favorites list.
 * @param customerId The ID of the user adding the favorite.
 * @param performer The performer data to be added.
 */
export const addToFavorites = async (
  customerId: string,
  performer: FavoritePerformer,
): Promise<any> => {
  const response = await fetch(
    `${API_BASE_URL}/api/users/${customerId}/favorites`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ performer }),
    },
  );
  return handleResponse(response);
};

/**
 * Removes a performer from a customer's favorites list.
 * @param customerId The ID of the user removing the favorite.
 * @param performerId The ID of the performer to remove.
 */
export const removeFromFavorites = async (
  customerId: string,
  performerId: string,
): Promise<{ success: true }> => {
  const response = await fetch(
    `${API_BASE_URL}/api/users/${customerId}/favorites/${performerId}`,
    {
      method: "DELETE",
    },
  );
  return handleResponse(response);
};

/**
 * Checks if a specific performer is in a customer's favorites list.
 * @param customerId The ID of the user.
 * @param performerId The ID of the performer to check.
 * @returns A boolean indicating if the performer is a favorite.
 */
export const isFavorite = async (
  customerId: string,
  performerId: string,
): Promise<boolean> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/users/${customerId}/favorites/${performerId}`,
    );
    if (response.status === 404) return false; // Not found means not a favorite
    if (!response.ok) throw new Error("Failed to check favorite status");

    const data = await response.json();
    return data.isFavorite === true;
  } catch (error) {
    console.error("Error in isFavorite check:", error);
    return false; // Default to false on error
  }
};

/**
 * Retrieves all favorite performers for a given customer.
 * @param customerId The ID of the user.
 * @returns An array of favorite performer objects.
 */
export const getFavorites = async (
  customerId: string,
): Promise<FavoritePerformer[]> => {
  const response = await fetch(
    `${API_BASE_URL}/api/users/${customerId}/favorites`,
  );
  return handleResponse(response);
};
