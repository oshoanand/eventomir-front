"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/utils/api-client";

// --- INTERFACES ---

export type TransactionType = "PAYMENT" | "TOPUP" | "REFUND" | "PAYOUT";
export type EscrowStatus =
  | "AWAITING_PAYMENT"
  | "HELD"
  | "RELEASED"
  | "REFUNDED"
  | "DISPUTED";
export type PayoutStatus =
  | "PENDING"
  | "APPROVED"
  | "PAID"
  | "REJECTED"
  | "CANCELLED";

export interface FinancialSummary {
  walletBalance: number;
  totalEarned?: number; // For performers/partners
  totalSpent?: number; // For customers
  heldInEscrow: number; // Funds currently frozen for bookings
  userRoles: {
    isCustomer: boolean;
    isPerformer: boolean;
    isPartner: boolean;
  };
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  description: string;
  createdAt: string;
}

export interface EscrowPayment {
  id: string;
  amount: number;
  netAmount: number;
  escrowStatus: EscrowStatus;
  releaseEligible: string | null;
  createdAt: string;
  booking?: {
    id: string;
    date: string;
    performer?: { user: { name: string } };
    customer?: { name: string };
  };
}

export interface PayoutRequest {
  id: string;
  amount: number;
  status: PayoutStatus;
  paymentDetails: string | null;
  createdAt: string;
}

// --- API FUNCTIONS ---

const getFinancialSummaryFn = async (): Promise<FinancialSummary> => {
  return await apiRequest<FinancialSummary>({
    method: "get",
    url: "/api/finance/summary",
  });
};

const getTransactionsFn = async (): Promise<Transaction[]> => {
  return await apiRequest<Transaction[]>({
    method: "get",
    url: "/api/finance/transactions",
  });
};

const getEscrowPaymentsFn = async (): Promise<EscrowPayment[]> => {
  return await apiRequest<EscrowPayment[]>({
    method: "get",
    url: "/api/finance/escrow",
  });
};

const getPayoutsFn = async (): Promise<PayoutRequest[]> => {
  return await apiRequest<PayoutRequest[]>({
    method: "get",
    url: "/api/finance/payouts",
  });
};

const requestPayoutFn = async (payload: {
  amount: number;
  paymentDetails: string;
}): Promise<void> => {
  return await apiRequest<void>({
    method: "post",
    url: "/api/finance/payouts",
    data: payload,
  });
};

// --- REACT QUERY HOOKS ---

export const useFinancialSummary = () =>
  useQuery({
    queryKey: ["finance", "summary"],
    queryFn: getFinancialSummaryFn,
  });
export const useTransactions = () =>
  useQuery({
    queryKey: ["finance", "transactions"],
    queryFn: getTransactionsFn,
  });
export const useEscrowPayments = () =>
  useQuery({ queryKey: ["finance", "escrow"], queryFn: getEscrowPaymentsFn });
export const usePayouts = () =>
  useQuery({ queryKey: ["finance", "payouts"], queryFn: getPayoutsFn });

export const useRequestPayout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: requestPayoutFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance"] }); // Refresh all finance data
    },
  });
};
