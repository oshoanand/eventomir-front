"use client";

import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/utils/api-client";

export interface SubscriptionPlanDetails {
  id: "econom" | "standard" | "premium";
  name: string;
  description: string;
  price: {
    monthly: number;
    halfYearly: number;
    yearly: number;
  };
  features: string[];
}

export interface FullPriceConfig {
  plans: SubscriptionPlanDetails[];
  paidRequestPrice: number;
}

const fetchPricingConfig = async (): Promise<FullPriceConfig> => {
  return await apiRequest({
    method: "get",
    url: "/api/pricing",
  });
};

export function usePricingQuery() {
  return useQuery({
    queryKey: ["pricing"],
    queryFn: fetchPricingConfig,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour since pricing doesn't change often
  });
}
