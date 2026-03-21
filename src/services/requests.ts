"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/utils/api-client";

// ==========================================
// 1. TYPES & INTERFACES
// ==========================================

export interface PaidRequest {
  id: string;
  customerId: string;
  category: string;
  serviceDescription: string;
  city?: string;
  budget?: string;
  createdAt: Date;
  status: "OPEN" | "CLOSED" | "PENDING_PAYMENT";
  views: number;
  responses: number;
  customer?: {
    name: string;
    profile_picture?: string;
  };
}

export interface CreateRequestParams {
  customerId: string;
  category: string;
  serviceDescription: string;
  budget?: string;
  city?: string;
  paymentMethod: "wallet" | "gateway"; // 🚨 NEW: Required for the new backend logic
}

export interface CreateRequestResponse {
  success: boolean;
  message?: string;
  requiresGateway: boolean;
  paymentUrl?: string; // Present if requiresGateway is true
}

export interface PerformerFeedParams {
  performerId: string;
  performerRoles: string[];
  performerCity?: string;
}

// ==========================================
// 2. API FUNCTIONS (Private)
// ==========================================

/**
 * Creates a new paid request (Handles both Wallet and Gateway logic).
 */
const createPaidRequestFn = async (
  data: CreateRequestParams,
): Promise<CreateRequestResponse> => {
  // We return the raw response here so the UI component can handle
  // the intelligent routing (Toast vs Redirect)
  return await apiRequest<CreateRequestResponse>({
    method: "post",
    url: "/api/requests",
    data: data,
  });
};

/**
 * Fetches requests created by the authenticated customer.
 */
const getRequestsByCustomerFn = async (): Promise<PaidRequest[]> => {
  // 🚨 SECURITY FIX: We no longer pass customerId in the URL.
  // The backend extracts it securely from the verifyAuth token.
  const data = await apiRequest<any[]>({
    method: "get",
    url: `/api/requests/customer`,
  });

  // Map backend response (ISO strings) to frontend objects (Date objects)
  return data.map((req: any) => ({
    ...req,
    createdAt: new Date(req.createdAt),
    budget: req.budget || undefined,
    city: req.city || undefined,
  }));
};

/**
 * Fetches relevant requests for a performer feed.
 */
const getPaidRequestsForPerformerFn = async ({
  performerRoles,
  performerCity,
}: Omit<PerformerFeedParams, "performerId">): Promise<PaidRequest[]> => {
  const params: Record<string, any> = {
    roles: performerRoles.join(","),
  };

  if (performerCity) {
    params.city = performerCity;
  }

  const data = await apiRequest<any[]>({
    method: "get",
    url: "/api/requests/feed",
    params: params,
  });

  return data.map((req: any) => ({
    ...req,
    createdAt: new Date(req.createdAt),
  }));
};

// ==========================================
// 3. REACT QUERY HOOKS (Public)
// ==========================================

/**
 * Hook to create a new paid request.
 * Automatically invalidates 'customerRequests' query to refresh the list after creation.
 */
export function useCreatePaidRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPaidRequestFn,
    onSuccess: () => {
      // Invalidate the cache so the customer's profile dashboard updates immediately
      queryClient.invalidateQueries({
        queryKey: ["requests", "customer"],
      });
    },
  });
}

/**
 * Hook to fetch requests for the logged-in customer.
 */
export function useCustomerRequestsQuery(customerId?: string) {
  return useQuery({
    queryKey: ["requests", "customer"],
    queryFn: getRequestsByCustomerFn,
    enabled: !!customerId, // Only run if we know the user is loaded
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

/**
 * Hook to fetch the feed for a performer.
 */
export function usePerformerRequestsFeedQuery(params: PerformerFeedParams) {
  return useQuery({
    queryKey: ["requests", "feed", params.performerRoles, params.performerCity],
    queryFn: () =>
      getPaidRequestsForPerformerFn({
        performerRoles: params.performerRoles,
        performerCity: params.performerCity,
      }),
    enabled: params.performerRoles.length > 0, // Only fetch if roles are defined
    staleTime: 1000 * 60 * 2, // Cache feed for 2 minutes
  });
}
