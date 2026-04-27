"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/utils/api-client";

// --- INTERFACES ---

export interface FeedComment {
  id: string;
  text: string;
  createdAt: Date;
  user: { id: string; name: string; image: string | null };
}

export interface FeedPost {
  id: string;
  performerId: string;
  text?: string;
  imageUrls?: string[];
  videoUrl?: string;
  isPublic: boolean;
  likesCount: number;
  commentsCount: number;
  isLikedByMe?: boolean;
  comments?: FeedComment[];
  createdAt: Date;
}

// --- API FUNCTIONS ---

const addFeedPostFn = async ({
  performerId,
  text,
  files,
}: {
  performerId: string;
  text: string;
  files?: File[];
}): Promise<FeedPost> => {
  const formData = new FormData();
  formData.append("text", text);
  if (files && files.length > 0) {
    files.forEach((f) => formData.append("files", f));
  }
  return await apiRequest<FeedPost>({
    method: "post",
    url: `/api/feeds/${performerId}`,
    data: formData,
    headers: { "Content-Type": undefined },
  });
};

const deleteFeedPostFn = async ({
  performerId,
  postId,
}: {
  performerId: string;
  postId: string;
}): Promise<void> => {
  return await apiRequest<void>({
    method: "delete",
    url: `/api/feeds/${performerId}/posts/${postId}`,
  });
};

const toggleFeedPostVisibilityFn = async ({
  performerId,
  postId,
}: {
  performerId: string;
  postId: string;
}): Promise<void> => {
  return await apiRequest<void>({
    method: "patch",
    url: `/api/feeds/${performerId}/posts/${postId}/visibility`,
  });
};

const likeFeedPostFn = async ({
  postId,
}: {
  postId: string;
}): Promise<void> => {
  return await apiRequest<void>({
    method: "post",
    url: `/api/feeds/posts/${postId}/like`,
  });
};

const addFeedCommentFn = async ({
  postId,
  text,
}: {
  postId: string;
  text: string;
}): Promise<FeedComment> => {
  return await apiRequest<FeedComment>({
    method: "post",
    url: `/api/feeds/posts/${postId}/comments`,
    data: { text },
  });
};

const editFeedCommentFn = async ({
  commentId,
  text,
}: {
  commentId: string;
  text: string;
}): Promise<FeedComment> => {
  return await apiRequest<FeedComment>({
    method: "patch",
    url: `/api/feeds/comments/${commentId}`,
    data: { text },
  });
};

const deleteFeedCommentFn = async ({
  commentId,
}: {
  commentId: string;
}): Promise<void> => {
  return await apiRequest<void>({
    method: "delete",
    url: `/api/feeds/comments/${commentId}`,
  });
};

// --- REACT QUERY HOOKS ---

export const useAddFeedPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addFeedPostFn,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["performer", "profile", variables.performerId],
      });
    },
  });
};

export const useDeleteFeedPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteFeedPostFn,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["performer", "profile", variables.performerId],
      });
    },
  });
};

export const useTogglePostVisibility = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleFeedPostVisibilityFn,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["performer", "profile", variables.performerId],
      });
    },
  });
};

export const useLikeFeedPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: likeFeedPostFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performer", "profile"] });
    },
  });
};

export const useAddFeedComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addFeedCommentFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performer", "profile"] });
    },
  });
};

export const useEditFeedComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: editFeedCommentFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performer", "profile"] });
    },
  });
};

export const useDeleteFeedComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteFeedCommentFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["performer", "profile"] });
    },
  });
};
