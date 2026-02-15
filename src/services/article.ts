"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/utils/api-client";

// --- TYPE DEFINITIONS ---

export interface Article {
  id: string;
  title: string;
  content: string; // HTML content
  slug: string;
  media_url?: string;
  media_type?: "image" | "video" | "link";
  image_alt_text?: string;
  meta_title?: string;
  meta_description?: string;
  keywords?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateArticleDTO = Omit<Article, "id" | "createdAt" | "updatedAt">;
export type UpdateArticleDTO = Partial<CreateArticleDTO>;

// --- API FUNCTIONS (Internal) ---

const fetchArticlesFn = async (): Promise<Article[]> => {
  return await apiRequest<Article[]>({
    method: "get",
    url: "/api/articles",
  });
};

const fetchArticleBySlugFn = async (slug: string): Promise<Article> => {
  return await apiRequest<Article>({
    method: "get",
    url: `/api/articles/${slug}`,
  });
};

const createArticleFn = async (data: CreateArticleDTO): Promise<Article> => {
  return await apiRequest<Article>({
    method: "post",
    url: "/api/articles",
    data,
  });
};

const updateArticleFn = async ({
  id,
  data,
}: {
  id: string;
  data: UpdateArticleDTO;
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

// --- REACT QUERY HOOKS (Public) ---

// 1. Hook to fetch all active articles (Public List)
export const useArticles = () => {
  return useQuery({
    queryKey: ["articles"],
    queryFn: fetchArticlesFn,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// 2. Hook to fetch a single article by slug (Public Detail)
export const useArticle = (slug: string) => {
  return useQuery({
    queryKey: ["articles", slug],
    queryFn: () => fetchArticleBySlugFn(slug),
    enabled: !!slug, // Only fetch if slug exists
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};

// 3. Admin: Create Article
export const useCreateArticle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createArticleFn,
    onSuccess: () => {
      // Invalidate list to show new article
      queryClient.invalidateQueries({ queryKey: ["articles"] });
    },
  });
};

// 4. Admin: Update Article
export const useUpdateArticle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateArticleFn,
    onSuccess: (updatedArticle) => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      // Also update the specific article cache if it exists
      queryClient.invalidateQueries({
        queryKey: ["articles", updatedArticle.slug],
      });
    },
  });
};

// 5. Admin: Delete Article
export const useDeleteArticle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteArticleFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
    },
  });
};
