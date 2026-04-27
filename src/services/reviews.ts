"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/utils/api-client";

// --- Interfaces ---

export interface ReviewAuthor {
  id: string;
  name: string;
  image?: string;
  profilePicture?: string;
  profile_picture?: string;
  role: string;
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  reply?: string;

  replyCreatedAt?: string;
  reply_created_at?: string;
  replyUpdatedAt?: string;
  reply_updated_at?: string;

  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;

  authorId?: string;
  author_id?: string;
  targetId?: string;
  target_id?: string;

  author?: ReviewAuthor;
  user?: ReviewAuthor;
}

// --- Payload Interfaces ---

export interface CreateReviewPayload {
  targetId: string;
  rating: number;
  comment: string;
}

export interface ReplyReviewPayload {
  reviewId: string;
  replyText: string;
  targetId: string;
}

export interface DeleteReviewPayload {
  reviewId: string;
  targetId: string;
}

export interface DeleteReplyPayload {
  reviewId: string;
  targetId: string;
}

export interface EditReviewPayload {
  reviewId: string;
  rating: number;
  comment: string;
  targetId: string;
}

// --- API Functions (Internal) ---

const fetchReviewsForTargetFn = async (userId: string): Promise<Review[]> => {
  const response = await apiRequest<any>({
    method: "GET", // Normalized to uppercase
    url: `/api/reviews/target/${userId}`,
  });

  // Ensure an array is ALWAYS returned.
  if (Array.isArray(response)) return response;
  if (response?.reviews && Array.isArray(response.reviews))
    return response.reviews;
  if (response?.data && Array.isArray(response.data)) return response.data;

  return [];
};

const createReviewFn = async (data: CreateReviewPayload): Promise<Review> => {
  return await apiRequest<Review>({
    method: "POST",
    url: "/api/reviews",
    data,
  });
};

const replyToReviewFn = async ({
  reviewId,
  replyText,
}: ReplyReviewPayload): Promise<Review> => {
  return await apiRequest<Review>({
    method: "PATCH",
    url: `/api/reviews/${reviewId}/reply`,
    data: { replyText },
  });
};

const deleteReviewFn = async ({
  reviewId,
}: DeleteReviewPayload): Promise<void> => {
  return await apiRequest<void>({
    method: "DELETE",
    url: `/api/reviews/${reviewId}`,
  });
};

const deleteReplyFn = async ({
  reviewId,
}: DeleteReplyPayload): Promise<void> => {
  return await apiRequest<void>({
    method: "DELETE",
    url: `/api/reviews/${reviewId}/reply`,
  });
};

const editReviewFn = async ({
  reviewId,
  rating,
  comment,
}: EditReviewPayload): Promise<Review> => {
  return await apiRequest<Review>({
    method: "PATCH",
    url: `/api/reviews/${reviewId}`,
    data: { rating, comment },
  });
};

// --- React Query Hooks (Exported) ---

export const useReviews = (targetId: string | null) => {
  return useQuery({
    queryKey: ["reviews", "target", targetId],
    queryFn: () => fetchReviewsForTargetFn(targetId!),
    enabled: !!targetId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};

export const useSubmitReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createReviewFn,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["reviews", "target", variables.targetId],
      });
    },
  });
};

export const useReplyToReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: replyToReviewFn,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["reviews", "target", variables.targetId],
      });
    },
  });
};

export const useDeleteReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteReviewFn,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["reviews", "target", variables.targetId],
      });
    },
  });
};

export const useEditReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: editReviewFn,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["reviews", "target", variables.targetId],
      });
    },
  });
};

export const useDeleteReplyToReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteReplyFn,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["reviews", "target", variables.targetId],
      });
    },
  });
};
