"use client";
import { apiRequest } from "@/utils/api-client";

// --- Type Definitions ---
export type SubscriptionTier = "FREE" | "STANDARD" | "PREMIUM";
export type BillingInterval = "month" | "half_year" | "year";

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  tier: SubscriptionTier;
  priceMonthly: number;
  priceHalfYearly?: number | null;
  priceYearly?: number | null;
  // 🚨 CRITICAL FIX: Updated from string[] to Record<string, any> to support the JSON Feature Matrix
  features: Record<string, any>;
  isActive: boolean;
}

export interface UserSubscription {
  id: string;
  planId: string;
  planName?: string; // Convenient to have mapped from backend

  // 🚨 FIX: Aligning with your Prisma schema fields
  isActive: boolean;
  autoRenew: boolean;

  // Status mapped for the frontend UI logic
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
  startDate: string | Date;
  endDate: string | Date | null;
  pricePaid?: number;
}

export interface PaymentResponse {
  checkoutUrl: string;
}

// --- API Functions ---

/**
 * Fetches all active subscription plans from the backend.
 * Endpoint: GET /api/payments/plans
 */
export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  return await apiRequest<SubscriptionPlan[]>({
    method: "get",
    url: "/api/payments/plans",
  });
};

/**
 * Fetches the current active subscription for the logged-in user.
 * Endpoint: GET /api/payments/me/subscription
 */
export const getCurrentSubscription =
  async (): Promise<UserSubscription | null> => {
    try {
      return await apiRequest<UserSubscription>({
        method: "get",
        url: "/api/payments/me/subscription",
      });
    } catch (error) {
      // Return null silently if 404 (user has no active subscription) or 401
      return null;
    }
  };

/**
 * Initiates a checkout session for a specific plan.
 * Endpoint: POST /api/payments/checkout
 *
 * @param planId - The ID of the subscription plan to purchase.
 * @param interval - The billing interval for the subscription.
 * @param paymentMethod - The preferred payment method ("card" or "wallet").
 * @returns An object containing the checkoutUrl.
 */
export const initiateCheckout = async (
  planId: string,
  interval: BillingInterval = "month",
  paymentMethod: "card" | "wallet" = "card",
): Promise<PaymentResponse> => {
  return await apiRequest<PaymentResponse>({
    method: "post",
    url: "/api/payments/checkout",
    data: { planId, interval, paymentMethod },
  });
};

/**
 * Fetches the dynamic price for a Paid Request creation.
 * Endpoint: GET /api/payments/request-price
 */
export const getPaidRequestPrice = async (): Promise<number> => {
  const response = await apiRequest<{ price: number }>({
    method: "get",
    url: "/api/payments/request-price",
  });
  return response.price;
};
