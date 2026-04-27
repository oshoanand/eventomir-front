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
    phone?: string; // 🚨 ADDED: Required for viewing single requests
  };
}

export interface CreateRequestParams {
  category: string;
  serviceDescription: string;
  budget?: string;
  city?: string;
  paymentMethod: "wallet" | "gateway";
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
  const data = await apiRequest<any[]>({
    method: "get",
    url: `/api/requests/customer`,
  });

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

// 🚨 ADDED: Fetch Single Request
const getRequestByIdFn = async (id: string): Promise<PaidRequest> => {
  const data = await apiRequest<any>({
    method: "get",
    url: `/api/requests/${id}`,
  });

  return {
    ...data,
    createdAt: new Date(data.createdAt),
  };
};

// 🚨 ADDED: Close/Archive Request
const closeRequestFn = async (id: string): Promise<PaidRequest> => {
  const data = await apiRequest<any>({
    method: "patch",
    url: `/api/requests/${id}/close`,
  });

  return {
    ...data,
    createdAt: new Date(data.createdAt),
  };
};

// ==========================================
// 3. REACT QUERY HOOKS (Public)
// ==========================================

/**
 * Hook to create a new paid request.
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
    enabled: !!customerId,
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
    enabled: params.performerRoles.length > 0,
    staleTime: 1000 * 60 * 2, // Cache feed for 2 minutes
  });
}

/**
 * 🚨 ADDED: Hook to fetch a single request by ID.
 */
export function useRequestByIdQuery(id: string) {
  return useQuery({
    queryKey: ["requests", "detail", id],
    queryFn: () => getRequestByIdFn(id),
    enabled: !!id,
    // Short stale time because views might increment
    staleTime: 1000 * 30,
  });
}

/**
 * 🚨 ADDED: Hook to close a request.
 */
export function useCloseRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: closeRequestFn,
    onSuccess: (updatedRequest) => {
      // 1. Update the specific request detail cache
      queryClient.setQueryData(
        ["requests", "detail", updatedRequest.id],
        updatedRequest,
      );

      // 2. Invalidate the customer's request list so it shows as CLOSED
      queryClient.invalidateQueries({
        queryKey: ["requests", "customer"],
      });

      // 3. Invalidate public feed so it disappears for performers
      queryClient.invalidateQueries({
        queryKey: ["requests", "feed"],
      });
    },
  });
}
