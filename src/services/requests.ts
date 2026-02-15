"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/utils/api-client";

// --- Types ---

interface CreateRequestResponse {
  success: boolean;
  message: string;
  request: {
    id: string;
    customerId: string;
    category: string;
    serviceDescription: string;
    city?: string | null;
    budget?: string | null;
    createdAt: string; // Backend returns ISO string
    status: "open" | "closed";
    views: number;
    responses: number;
  };
}

export interface PaidRequest {
  id: string;
  customerId?: string;
  category: string;
  serviceDescription: string;
  city?: string;
  budget?: string;
  createdAt: Date;
  status: "open" | "closed";
  views: number;
  responses: number;
}

export interface CreateRequestParams {
  customerId: string;
  category: string;
  serviceDescription: string;
  budget?: string;
  city?: string;
}

export interface PerformerFeedParams {
  performerId: string;
  performerRoles: string[];
  performerCity?: string;
}

// --- API Functions (Private) ---

/**
 * Creates a new paid request.
 */
const createPaidRequestFn = async (
  data: CreateRequestParams,
): Promise<PaidRequest> => {
  const result = (await apiRequest({
    method: "post",
    url: "/api/requests",
    data: data,
  })) as CreateRequestResponse;

  // Transform ISO string to Date object
  return {
    ...result.request,
    createdAt: new Date(result.request.createdAt), // Convert string to Date
    // Handle potential nulls from backend
    city: result.request.city || undefined,
    budget: result.request.budget || undefined,
  };
};

/**
 * Fetches requests created by a specific customer.
 */
const getRequestsByCustomerFn = async (
  customerId: string,
): Promise<PaidRequest[]> => {
  const data = (await apiRequest({
    method: "get",
    url: `/api/requests/customer/${customerId}`,
  })) as any[];

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
  // Construct query params object
  // Note: apiRequest should handle array params (e.g. roles[]) or you might need to join them
  const params: Record<string, any> = {
    roles: performerRoles.join(","), // Simple comma separation for the backend
  };

  if (performerCity) {
    params.city = performerCity;
  }

  const data = (await apiRequest({
    method: "get",
    url: "/api/requests/feed", // Ensure this route exists in your backend
    params: params,
  })) as any[];

  return data.map((req: any) => ({
    ...req,
    createdAt: new Date(req.createdAt),
  }));
};

// --- React Query Hooks (Public) ---

/**
 * Hook to create a new paid request.
 * Automatically invalidates 'customerRequests' query to refresh the list after creation.
 */
export function useCreatePaidRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPaidRequestFn,
    onSuccess: (newRequest) => {
      // Invalidate the cache for the specific customer so their list updates immediately
      if (newRequest.customerId) {
        queryClient.invalidateQueries({
          queryKey: ["requests", "customer", newRequest.customerId],
        });
      }
    },
  });
}

/**
 * Hook to fetch requests for a specific customer.
 */
export function useCustomerRequestsQuery(customerId: string) {
  return useQuery({
    queryKey: ["requests", "customer", customerId],
    queryFn: () => getRequestsByCustomerFn(customerId),
    enabled: !!customerId, // Only run if customerId is provided
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

export interface CreateRequestParams {
  customerId: string;
  category: string;
  serviceDescription: string;
  budget?: string;
  city?: string;
}
