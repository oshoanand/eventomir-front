// // TODO: Replace this stub with actual integration with a payment system (e.g., Tinkoff)

// export interface SubscriptionPlanDetails {
//     id: 'econom' | 'standard' | 'premium';
//     name: string;
//     description: string;
//     price: {
//         monthly: number;
//         halfYearly: number;
//         yearly: number;
//     };
//     features: {
//         maxRoles: number | typeof Infinity;
//         profileSeo: boolean;
//         worksSeo: boolean;
//         maxGalleryItems: number | typeof Infinity;
//         maxGalleryItemImages: number;
//         // Add other features as needed
//     };
// }

// export interface SubscriptionPriceConfig {
//     standard: {
//         monthly: number;
//         halfYearly: number;
//         yearly: number;
//     };
//     premium: {
//         monthly: number;
//         halfYearly: number;
//         yearly: number;
//     };
//     paidRequestPrice: number;
// }

// // TODO: Replace with actual data retrieval (e.g., from DB or config file)
// let subscriptionConfig: SubscriptionPriceConfig = {
//     standard: { monthly: 1500, halfYearly: 7200, yearly: 12000 },
//     premium: { monthly: 3000, halfYearly: 15000, yearly: 25000 },
//     paidRequestPrice: 490,
// };

// export const getSubscriptionPlans = async (): Promise<SubscriptionPlanDetails[]> => {
//     console.log("Получение тарифных планов (заглушка)..."); // Fetching subscription plans (stub)...
//     return new Promise((resolve) => {
//         setTimeout(() => {
//             const plans: SubscriptionPlanDetails[] = [
//                 {
//                     id: 'econom',
//                     name: 'Эконом',
//                     description: 'Базовый бесплатный тариф для старта.',
//                     price: { monthly: 0, halfYearly: 0, yearly: 0 },
//                     features: {
//                         maxRoles: 1,
//                         profileSeo: false,
//                         worksSeo: false,
//                         maxGalleryItems: 3,
//                         maxGalleryItemImages: 3
//                     }
//                 },
//                 {
//                     id: 'standard',
//                     name: 'Стандарт',
//                     description: 'Больше возможностей для вашего профиля и привлечения клиентов.',
//                     price: subscriptionConfig.standard,
//                     features: {
//                         maxRoles: 3,
//                         profileSeo: true,
//                         worksSeo: false,
//                         maxGalleryItems: 6,
//                         maxGalleryItemImages: 6
//                     }
//                 },
//                 {
//                     id: 'premium',
//                     name: 'Премиум',
//                     description: 'Максимум функций для продвижения и получения заказов.',
//                     price: subscriptionConfig.premium,
//                     features: {
//                         maxRoles: Infinity,
//                         profileSeo: true,
//                         worksSeo: true,
//                         maxGalleryItems: 15,
//                         maxGalleryItemImages: 15
//                     }
//                 },
//             ];
//             resolve(plans);
//         }, 200);
//     });
// };

// export const getPriceConfig = async (): Promise<SubscriptionPriceConfig> => {
//     console.log("Получение конфигурации цен (заглушка)..."); // Fetching price configuration (stub)...
//     return new Promise((resolve) => {
//         setTimeout(() => {
//             resolve({ ...subscriptionConfig });
//         }, 150);
//     });
// };

// export const updatePriceConfig = async (newConfig: SubscriptionPriceConfig): Promise<void> => {
//     console.log("Обновление конфигурации цен (заглушка)...", newConfig); // Updating price configuration (stub)...
//     return new Promise((resolve) => {
//         setTimeout(() => {
//             subscriptionConfig = { ...newConfig };
//             resolve();
//         }, 300);
//     });
// };

// export const processPayment = async (
//     planId: SubscriptionPlanDetails['id'],
//     duration: 'monthly' | 'halfYearly' | 'yearly',
//     paymentToken: string
// ): Promise<boolean> => {
//     console.log(`Обработка платежа за план ${planId} (${duration}) с токеном ${paymentToken} (заглушка)...`); // Processing payment for plan ${planId} (${duration}) with token ${paymentToken} (stub)...
//     // TODO: Implement integration with the payment system API (e.g., Tinkoff)
//     return new Promise((resolve) => {
//         setTimeout(() => {
//             const paymentSuccess = Math.random() > 0.1;
//             if (paymentSuccess) {
//                 console.log("Платеж прошел успешно."); // Payment successful.
//                 resolve(true);
//             } else {
//                 console.error("Ошибка обработки платежа."); // Error processing payment.
//                 resolve(false);
//             }
//         }, 1000);
//     });
// };

// export const getPaidRequestPrice = async (): Promise<number> => {
//     console.log("Получение цены платного запроса (заглушка)..."); // Fetching paid request price (stub)...
//     return new Promise((resolve) => {
//         setTimeout(() => {
//             resolve(subscriptionConfig.paidRequestPrice);
//         }, 100);
//     });
// };

// export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
//   return await apiRequest<SubscriptionPlan[]>({
//     method: "get",
//     url: "/api/payments/plans", // Updated URL
//   });
// };

// export const initiateCheckout = async (planId: string): Promise<{ checkoutUrl: string }> => {
//   return await apiRequest<{ checkoutUrl: string }>({
//     method: "post",
//     url: "/api/payments/checkout", // Updated URL
//     data: { planId },
//   });
// };

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

  // Updated Price Fields
  priceMonthly: number;
  priceHalfYearly?: number | null;
  priceYearly?: number | null;

  features: string[];
  isActive: boolean;
}

export interface PaymentResponse {
  checkoutUrl: string;
}

export interface UserSubscription {
  id: string;
  planId: string;
  planName: string; // Convenient to have from backend
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
  startDate: string;
  endDate: string | null;
  pricePaid: number;
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
 * Endpoint: GET /api/users/me/subscription
 */
export const getCurrentSubscription =
  async (): Promise<UserSubscription | null> => {
    try {
      return await apiRequest<UserSubscription>({
        method: "get",
        url: "/api/users/me/subscription",
      });
    } catch (error) {
      // Return null if 404 or no subscription
      return null;
    }
  };

/**
 * Initiates a checkout session for a specific plan.
 * Endpoint: POST /api/payments/checkout
 * * @param planId - The ID of the subscription plan to purchase.
 * @returns An object containing the checkoutUrl (e.g., to Stripe/Yookassa or Mock Gateway).
 param interval - The billing interval for the subscription (e.g., "month", "half_year", "year").
 */
export const initiateCheckout = async (
  planId: string,
  interval: BillingInterval = "month",
): Promise<PaymentResponse> => {
  return await apiRequest<PaymentResponse>({
    method: "post",
    url: "/api/payments/checkout",
    data: { planId, interval }, // Send interval to backend
  });
};

export interface PaymentResponse {
  checkoutUrl: string;
}
