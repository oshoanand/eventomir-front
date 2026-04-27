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
  features: Record<string, any>;
  isActive: boolean;
}

export interface UserSubscription {
  id: string;
  planId: string;
  planName?: string;
  isActive: boolean;
  autoRenew: boolean;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
  startDate: string | Date;
  endDate: string | Date | null;
  pricePaid?: number;
}

export interface PaymentResponse {
  checkoutUrl: string;
}

export interface PromoValidationResponse {
  valid: boolean;
  discountAmount: number;
  finalPrice: number;
}

// --- API Functions ---

export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  return await apiRequest<SubscriptionPlan[]>({
    method: "get",
    url: "/api/payments/plans",
  });
};

export const getCurrentSubscription =
  async (): Promise<UserSubscription | null> => {
    try {
      return await apiRequest<UserSubscription>({
        method: "get",
        url: "/api/payments/me/subscription",
      });
    } catch (error) {
      return null;
    }
  };

export const purchaseSubscription = async (
  planId: string,
  interval: BillingInterval,
  paymentMethod: "card" | "wallet" | "invoice",
  promoCode?: string,
): Promise<PaymentResponse> => {
  return await apiRequest<PaymentResponse>({
    method: "post",
    url: `/api/payments/${planId}/purchase`,
    data: { interval, paymentMethod, promoCode },
  });
};

export const topUpWallet = async (amount: number): Promise<PaymentResponse> => {
  return await apiRequest<PaymentResponse>({
    method: "post",
    url: "/api/payments/wallet/topup",
    data: { amount },
  });
};

export const validatePromoCode = async (
  code: string,
  planId: string,
  interval: BillingInterval,
): Promise<PromoValidationResponse> => {
  return await apiRequest<PromoValidationResponse>({
    method: "post",
    url: "/api/promo-codes/validate",
    data: { code, planId, interval },
  });
};

export const getPaidRequestPrice = async (): Promise<number> => {
  const response = await apiRequest<{ price: number }>({
    method: "get",
    url: "/api/payments/request-price",
  });
  return response.price;
};
