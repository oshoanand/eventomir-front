"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/utils/api-client";

// --- Interfaces ---

export interface ReviewAuthor {
  id: string;
  name: string;
  image?: string; // Standard NextAuth/Prisma field
  profilePicture?: string;
  profile_picture?: string;
  role: string;
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  reply?: string;

  // Flexible mappings to support both camelCase and snake_case based on your backend ORM
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
  user?: ReviewAuthor; // Fallback in case backend populates relation as 'user'
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
  targetId: string; // Needed for cache invalidation
}

export interface DeleteReviewPayload {
  reviewId: string;
  targetId: string; // Needed for cache invalidation
}

export interface DeleteReplyPayload {
  reviewId: string;
  targetId: string; // Needed for cache invalidation
}

export interface EditReviewPayload {
  reviewId: string;
  rating: number;
  comment: string;
  targetId: string; // Needed for cache invalidation
}

// --- API Functions (Internal) ---

const fetchReviewsForTargetFn = async (userId: string): Promise<Review[]> => {
  const response = await apiRequest<any>({
    method: "get",
    url: `/api/reviews/target/${userId}`,
  });

  // 🚨 CRITICAL FIX: Ensure an array is ALWAYS returned.
  // This prevents UI crashes if the backend wraps the response in { data: [...] } or { reviews: [...] }
  if (Array.isArray(response)) return response;
  if (response?.reviews && Array.isArray(response.reviews))
    return response.reviews;
  if (response?.data && Array.isArray(response.data)) return response.data;

  return [];
};

const createReviewFn = async (data: CreateReviewPayload): Promise<Review> => {
  return await apiRequest<Review>({
    method: "post",
    url: "/api/reviews",
    data,
  });
};

const replyToReviewFn = async ({
  reviewId,
  replyText,
}: ReplyReviewPayload): Promise<Review> => {
  return await apiRequest<Review>({
    method: "patch",
    url: `/api/reviews/${reviewId}/reply`,
    data: { replyText },
  });
};

const deleteReviewFn = async ({
  reviewId,
}: DeleteReviewPayload): Promise<void> => {
  return await apiRequest<void>({
    method: "delete",
    url: `/api/reviews/${reviewId}`,
  });
};

const deleteReplyFn = async ({
  reviewId,
}: DeleteReplyPayload): Promise<void> => {
  return await apiRequest<void>({
    method: "delete",
    url: `/api/reviews/${reviewId}/reply`,
  });
};

const editReviewFn = async ({
  reviewId,
  rating,
  comment,
}: EditReviewPayload): Promise<Review> => {
  return await apiRequest<Review>({
    method: "patch",
    url: `/api/reviews/${reviewId}`,
    data: { rating, comment },
  });
};

// --- React Query Hooks (Exported) ---

/**
 * Fetch all reviews where the given user is the target.
 */
export const useReviews = (targetId: string | null) => {
  return useQuery({
    queryKey: ["reviews", "target", targetId],
    queryFn: () => fetchReviewsForTargetFn(targetId!),
    enabled: !!targetId, // Only run if a valid targetId is provided
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
};

/**
 * Submit a new review.
 */
export const useSubmitReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createReviewFn,
    onSuccess: (_, variables) => {
      // Instantly invalidate the reviews cache to refresh the UI
      queryClient.invalidateQueries({
        queryKey: ["reviews", "target", variables.targetId],
      });
    },
  });
};

/**
 * Reply to an existing review (Only for the profile owner).
 */
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

/**
 * Delete a review (Only for the author of the review).
 */
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

/**
 * Edit an existing review (Only for the author of the review).
 */
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

/**
 * Delete a reply to a review.
 */
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
