"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/utils/api-client";

// --- TYPE DEFINITIONS ---

export interface ArticleComment {
  id: string;
  content: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  user: {
    id: string;
    name: string;
    image?: string;
  };
  parentId?: string | null;
  replies?: ArticleComment[];
}

export interface Article {
  id: string;
  title: string;
  content: string; // HTML content
  slug: string;
  media_url?: string;
  media_type?: "image" | "video" | "link" | string;
  image_alt_text?: string;
  meta_title?: string;
  meta_description?: string;
  keywords?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  // Relations & Aggregations added from backend
  _count?: {
    likes: number;
    comments: number;
  };
  userHasLiked?: boolean;
  comments?: ArticleComment[];
}

export type CreateArticleDTO = Omit<
  Article,
  "id" | "createdAt" | "updatedAt" | "_count" | "userHasLiked" | "comments"
>;
export type UpdateArticleDTO = Partial<CreateArticleDTO>;

// --- API FUNCTIONS (Internal) ---

const fetchArticlesFn = async (): Promise<Article[]> => {
  return await apiRequest<Article[]>({
    method: "get",
    url: "/api/articles",
  });
};

const fetchArticleBySlugFn = async (
  slug: string,
  userId?: string,
): Promise<Article> => {
  const url = userId
    ? `/api/articles/${slug}?userId=${userId}`
    : `/api/articles/${slug}`;
  return await apiRequest<Article>({
    method: "get",
    url: url,
  });
};

// Accepts FormData for Multer file uploads or JSON DTO
const createArticleFn = async (
  data: FormData | CreateArticleDTO,
): Promise<Article> => {
  return await apiRequest<Article>({
    method: "post",
    url: "/api/articles",
    data,
  });
};

// Accepts FormData for Multer file uploads or JSON DTO
const updateArticleFn = async ({
  id,
  data,
}: {
  id: string;
  data: FormData | UpdateArticleDTO;
}): Promise<Article> => {
  return await apiRequest<Article>({
    method: "patch",
    url: `/api/articles/${id}`,
    data,
  });
};

const deleteArticleFn = async (id: string): Promise<void> => {
  return await apiRequest<void>({
    method: "delete",
    url: `/api/articles/${id}`,
  });
};

// --- USER ACTIONS (Likes & Comments) ---

const toggleLikeFn = async (
  articleId: string,
): Promise<{ message: string; liked: boolean }> => {
  return await apiRequest({
    method: "post",
    url: `/api/articles/${articleId}/like`,
  });
};

const addCommentFn = async ({
  articleId,
  content,
  parentId,
}: {
  articleId: string;
  content: string;
  parentId?: string;
}) => {
  return await apiRequest({
    method: "post",
    url: `/api/articles/${articleId}/comments`,
    data: { content, parentId },
  });
};

// --- ADMIN MODERATION ---

const fetchAdminCommentsFn = async (status: string = "pending") => {
  return await apiRequest<ArticleComment[]>({
    method: "get",
    url: `/api/articles/admin/comments?status=${status}`,
  });
};

const moderateCommentFn = async ({
  commentId,
  status,
}: {
  commentId: string;
  status: "approved" | "rejected";
}) => {
  return await apiRequest({
    method: "patch",
    url: `/api/articles/admin/comments/${commentId}`,
    data: { status },
  });
};

// ==========================================
// REACT QUERY HOOKS
// ==========================================

// 1. Hook to fetch all active articles (Public List)
export const useArticlesQuery = () => {
  return useQuery({
    queryKey: ["articles", "public"],
    queryFn: fetchArticlesFn,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// 2. Hook to fetch a single article by slug (Public Detail)
// Added userId parameter to check if the current user liked it
export const useBlogQuery = (slug: string, userId?: string) => {
  return useQuery({
    queryKey: ["article", slug, userId],
    queryFn: () => fetchArticleBySlugFn(slug, userId),
    enabled: !!slug, // Only fetch if slug exists
    staleTime: 1000 * 60 * 5,
  });
};

// 3. User: Toggle Like
export const useToggleLikeMutation = (slug: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleLikeFn,
    onSuccess: () => {
      // Invalidate the specific article to refresh like count & heart status
      queryClient.invalidateQueries({ queryKey: ["article", slug] });
    },
  });
};

// 4. User: Add Comment
export const useAddCommentMutation = () => {
  return useMutation({
    mutationFn: addCommentFn,
    // We don't necessarily invalidate the article here because the comment is "pending"
    // and won't show up until the admin approves it anyway.
  });
};

// 5. Admin: Fetch Pending Comments
export const useAdminCommentsQuery = (status: string = "pending") => {
  return useQuery({
    queryKey: ["admin", "comments", status],
    queryFn: () => fetchAdminCommentsFn(status),
  });
};

// 6. Admin: Moderate Comment
export const useModerateCommentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: moderateCommentFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "comments"] });
      // Clear the public article cache so the approved comment appears immediately
      queryClient.invalidateQueries({ queryKey: ["article"] });
    },
  });
};

// 7. Admin: Create Article
export const useCreateArticle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createArticleFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
    },
  });
};

// 8. Admin: Update Article
export const useUpdateArticle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateArticleFn,
    onSuccess: (updatedArticle) => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      queryClient.invalidateQueries({
        queryKey: ["article", updatedArticle.slug],
      });
    },
  });
};

// 9. Admin: Delete Article
export const useDeleteArticle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteArticleFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
    },
  });
};
