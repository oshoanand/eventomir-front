"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/utils/api-client"; // Your axios/fetch wrapper
import { useSession } from "next-auth/react";

// --- Types ---
export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  profilePicture: string;
  role: string;
  unreadNotifications?: number;
}

export interface OrderHistoryItem {
  id: string;
  performerId: string;
  performerName: string;
  service: string;
  date: Date;
  status: string;
  price: number;
}

export type UpdateProfileParams = Partial<CustomerProfile> & {
  profilePictureFile?: File;
};

// --- API Functions ---

const fetchProfile = async (): Promise<CustomerProfile> => {
  return await apiRequest({ method: "get", url: "/api/customers/profile" });
};

const updateProfile = async (data: Partial<CustomerProfile>): Promise<any> => {
  return await apiRequest({
    method: "put",
    url: "/api/customers/profile",
    data,
  });
};

const updateProfileFn = async (
  data: UpdateProfileParams,
): Promise<CustomerProfile> => {
  const formData = new FormData();

  // Append text fields
  if (data.name) formData.append("name", data.name);
  if (data.phone) formData.append("phone", data.phone);
  if (data.city) formData.append("city", data.city);

  // Append file
  if (data.profilePictureFile) {
    formData.append("profile_image", data.profilePictureFile);
  }

  // Debug: Log the entries to ensure file is present before sending
  // for (let [key, value] of formData.entries()) {
  //   console.log(`${key}: ${value}`);
  // }

  const response = await apiRequest<CustomerProfile>({
    method: "put",
    url: "/api/customers/profile",
    data: formData,
    // CRITICAL FIX: Explicitly unset Content-Type so browser sets the boundary
    headers: {
      "Content-Type": undefined,
    },
  });

  return response;
};

const fetchOrderHistory = async (): Promise<OrderHistoryItem[]> => {
  // 1. Tell TypeScript the response is an array of objects
  const data = await apiRequest<any[]>({
    // <--- Add <any[]> generic here
    method: "get",
    url: "/api/customers/orders",
  });

  // Now 'data' is typed as any[], so .map() works
  return data.map((item) => ({
    ...item,
    date: new Date(item.date), // Convert ISO string to Date
  }));
};

// --- Hooks ---

export const useCustomerProfile = () => {
  const { data: session } = useSession();
  return useQuery({
    queryKey: ["customer", "profile"],
    queryFn: fetchProfile,
    enabled: !!session?.user?.accessToken, // Only fetch if logged in
  });
};

export const useUpdateCustomerProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfileFn,
    onSuccess: (updatedProfile) => {
      // 1. Invalidate to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ["customer", "profile"] });

      // 2. Optimistically update the cache (optional but provides instant feedback)
      queryClient.setQueryData(["customer", "profile"], updatedProfile);
    },
  });
};

export const useCustomerOrders = () => {
  const { data: session } = useSession();
  return useQuery({
    queryKey: ["customer", "orders"],
    queryFn: fetchOrderHistory,
    enabled: !!session?.user?.accessToken,
  });
};
