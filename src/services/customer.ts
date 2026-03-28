"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/utils/api-client";
import { useSession } from "next-auth/react";

// ==========================================
// 1. STRICT TYPES & INTERFACES
// ==========================================

export interface SubscriptionPlan {
  id: string;
  name: string;
  features: string[];
}

export interface UserSubscription {
  id: string;
  isActive: boolean;
  endDate: string | Date | null;
  plan: SubscriptionPlan;
}

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  profilePicture: string;
  role: string;
  walletBalance: number;
  subscription?: UserSubscription | null;
  unreadNotifications?: number;
}

export interface OrderHistoryItem {
  id: string;
  performerId: string;
  performerName: string;
  service: string;
  date: Date;
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | string;
  price: number;
}

// Explicitly define what can be updated. We Omit sensitive/read-only fields.
export type UpdateProfileParams = Partial<
  Omit<
    CustomerProfile,
    "id" | "email" | "role" | "walletBalance" | "subscription"
  >
> & {
  profilePictureFile?: File | null;
};

// ==========================================
// 2. API CALLS
// ==========================================

const fetchProfile = async (): Promise<CustomerProfile> => {
  return await apiRequest<CustomerProfile>({
    method: "get",
    url: "/api/customers/profile",
  });
};

const updateProfile = async (
  data: UpdateProfileParams,
): Promise<CustomerProfile> => {
  const formData = new FormData();

  // 🚨 FIX: Safely append text fields by checking for undefined.
  // This allows users to successfully send empty strings to clear out optional fields like 'city' or 'phone'.
  if (data.name !== undefined) formData.append("name", data.name);
  if (data.phone !== undefined) formData.append("phone", data.phone);
  if (data.city !== undefined) formData.append("city", data.city);

  // Safely append file
  if (data.profilePictureFile) {
    formData.append("profile_image", data.profilePictureFile);
  }

  return await apiRequest<CustomerProfile>({
    method: "put",
    url: "/api/customers/profile",
    data: formData,
    // CRITICAL: Unsetting Content-Type forces the browser (Fetch/Axios)
    // to automatically set 'multipart/form-data' with the correct secure boundary.
    headers: {
      "Content-Type": undefined,
    },
  });
};

const fetchOrderHistory = async (): Promise<OrderHistoryItem[]> => {
  const data = await apiRequest<any[]>({
    method: "get",
    url: "/api/customers/orders",
  });

  // Ensure dates are parsed correctly into JS Date objects
  return data.map((item) => ({
    ...item,
    date: new Date(item.date),
  }));
};

// ==========================================
// 3. TANSTACK REACT QUERY HOOKS
// ==========================================

export const useCustomerProfile = () => {
  const { status } = useSession();

  return useQuery({
    queryKey: ["customer", "profile"],
    queryFn: fetchProfile,
    // 🚨 SECURITY: Only execute the query if NextAuth explicitly confirms the user is logged in
    enabled: status === "authenticated",
    // Optimization: Don't refetch on every tiny render, data stays fresh for 5 mins
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateCustomerProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (updatedProfile) => {
      // 1. Optimistically update the cache for instant UI feedback without reloading
      queryClient.setQueryData(["customer", "profile"], updatedProfile);

      // 2. Invalidate to trigger a background refetch just to be 100% in sync
      queryClient.invalidateQueries({ queryKey: ["customer", "profile"] });
    },
  });
};

export const useCustomerOrders = () => {
  const { status } = useSession();

  return useQuery({
    queryKey: ["customer", "orders"],
    queryFn: fetchOrderHistory,
    enabled: status === "authenticated",
  });
};
