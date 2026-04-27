"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/utils/api-client";
import { UserSubscription } from "@/services/payment";
import { FeedPost } from "@/services/feed";
import { BookingRequest } from "@/services/booking";

export type ModerationStatus = "PENDING" | "APPROVED" | "REJECTED";

// --- INTERFACES ---
export interface SocialLinks {
  vk?: string;
  telegram?: string;
  youtube?: string;
  website?: string;
}

export interface BankDetails {
  id?: string;
  type: "CARD" | "ACCOUNT";
  bankName: string;
  cardType?: string;
  bik?: string;
  corrAccount?: string;
  inn?: string;
  kpp?: string;
  accountNumber: string;
  isDefault?: boolean;
}

export interface GalleryItem {
  id: string;
  title: string;
  imageUrls: string[];
  description: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
  imageAltText?: string;
  imageFiles?: File[] | null;
  moderationStatus: ModerationStatus;
}

export interface Certificate {
  id: string;
  fileUrl: string;
  description?: string;
  moderationStatus: ModerationStatus;
}

export interface RecommendationLetter {
  id: string;
  fileUrl: string;
  description?: string;
  moderationStatus: ModerationStatus;
}

export interface Review {
  id: string;
  performerId: string;
  customerName: string;
  rating: number;
  comment?: string;
  date: Date;
}

export interface AudioTrack {
  id: string;
  performerId: string;
  title: string;
  fileUrl: string;
  createdAt: string;
}

export interface PerformerProfileBase {
  id: string;
  name: string;
  companyName?: string;
  accountType:
    | "selfEmployed"
    | "individualEntrepreneur"
    | "legalEntity"
    | "agency";
  inn: string;
  description: string;
  contactPhone: string;
  phone?: string;
  contactEmail: string;
  email: string;
  profilePicture?: string;
  profilePictureAltText?: string;
  backgroundPicture?: string;
  backgroundPictureAltText?: string;
  roles: string[];
  city: string;
  address: string;
  priceRange?: number[];
  latitude?: number;
  longitude?: number;
  profileMetaTitle?: string;
  profileMetaDescription?: string;
  profileKeywords?: string;
  socialLinks?: SocialLinks;
  bankDetails?: BankDetails[];
  subscriptionPlanId?: string | null;
  subscriptionEndDate?: Date | null;
  moderationStatus: ModerationStatus;
  parentAgencyId?: string;
  parentAgencyName?: string;
  subProfileIds?: string[];
}

export type PerformerRoleDetails = {
  Артисты?: ArtistDetails;
  Повар?: CookDetails;
  Транспорт?: TransportDetails;
  Ресторан?: RestaurantDetails;
};

export interface PerformerProfile extends PerformerProfileBase {
  details?: PerformerRoleDetails;
  gallery?: GalleryItem[];
  bookedDates?: Date[];
  bookingRequests?: BookingRequest[];
  selectedDates?: Date[];
  certificates?: Certificate[];
  recommendationLetters?: RecommendationLetter[];
  audioTracks?: AudioTrack[];
  feedPosts?: FeedPost[];
  reviews?: Review[];
  isVip?: boolean;
  subscription?: UserSubscription | null;
}

export type TransportDetails = {
  type: string;
  capacity: string;
  services: string[];
  budget: string;
  eventStyles: string[];
};

export type RestaurantDetails = {
  cuisine: string;
  capacity: string;
  services: string[];
  budget: string;
  eventStyles: string[];
};

export type CookDetails = {
  specialization: string;
  skillLevel: string;
  serviceFormat: string[];
  budget: string;
  eventStyles: string[];
};

export type ArtistDetails = {
  genre: string;
  skillLevel: string;
  performanceFormat: string;
  budget: string;
  locationType: string;
  eventStyles: string[];
};

export interface PerformerWithRating extends PerformerProfile {
  averageRating: number | null;
}

export type UpdatePerformerProfileParams = Partial<
  Omit<PerformerProfile, "id" | "email" | "accountType" | "inn" | "feedPosts">
> & {
  profilePictureFile?: File | null;
  backgroundPictureFile?: File | null;
};

// --- UTILITY: HYDRATE DATES ---
const hydrateProfileDates = (data: any): PerformerProfile => {
  if (!data) return data;

  return {
    ...data,
    subscriptionEndDate: data.subscriptionEndDate
      ? new Date(data.subscriptionEndDate)
      : null,
    bookedDates: Array.isArray(data.bookedDates)
      ? data.bookedDates.map((d: string) => new Date(d))
      : [],
    bookingRequests: Array.isArray(data.bookingRequests)
      ? data.bookingRequests.map((req: any) => ({
          ...req,
          date: req.date
            ? new Date(req.date)
            : new Date(req.eventDate || Date.now()),
          createdAt: req.createdAt ? new Date(req.createdAt) : new Date(),
        }))
      : [],
    reviews: Array.isArray(data.reviews)
      ? data.reviews.map((review: any) => ({
          ...review,
          date: review.date ? new Date(review.date) : new Date(),
        }))
      : [],
    feedPosts: Array.isArray(data.feedPosts)
      ? data.feedPosts.map((post: any) => ({
          ...post,
          createdAt: new Date(post.createdAt),
          comments: Array.isArray(post.comments)
            ? post.comments.map((c: any) => ({
                ...c,
                createdAt: new Date(c.createdAt),
              }))
            : [],
        }))
      : [],
  };
};

// --- API FUNCTIONS (Internal/Private) ---

const fetchPerformerProfileFn = async (
  performerId: string,
): Promise<PerformerProfile> => {
  const data = await apiRequest<any>({
    method: "get",
    url: `/api/performers/profile/${performerId}`,
  });
  return hydrateProfileDates(data);
};

const updatePerformerProfileFn = async ({
  performerId,
  data,
}: {
  performerId: string;
  data: UpdatePerformerProfileParams;
}): Promise<PerformerProfile> => {
  const formData = new FormData();

  if (data.name) formData.append("name", data.name);
  if (data.description) formData.append("description", data.description);
  if (data.city) formData.append("city", data.city);
  if (data.address) formData.append("address", data.address);
  if (data.phone) formData.append("phone", data.phone);
  else if (data.contactPhone) formData.append("phone", data.contactPhone);

  if (data.roles) formData.append("roles", JSON.stringify(data.roles));
  if (data.priceRange)
    formData.append("priceRange", JSON.stringify(data.priceRange));
  if (data.socialLinks)
    formData.append("socialLinks", JSON.stringify(data.socialLinks));
  if (data.bankDetails)
    formData.append("bankDetails", JSON.stringify(data.bankDetails));

  if (data.profilePictureFile)
    formData.append("profilePicture", data.profilePictureFile);
  if (data.backgroundPictureFile)
    formData.append("backgroundPicture", data.backgroundPictureFile);

  const response = await apiRequest<any>({
    method: "patch",
    url: `/api/performers/${performerId}`,
    data: formData,
    headers: { "Content-Type": undefined },
  });

  return hydrateProfileDates(response);
};

const deletePerformerProfileFn = async (performerId: string): Promise<void> => {
  return await apiRequest<void>({
    method: "delete",
    url: `/api/performers/${performerId}`,
  });
};

const addGalleryItemFn = async ({
  performerId,
  file,
  title,
  description,
}: {
  performerId: string;
  file: File;
  title: string;
  description: string;
}): Promise<GalleryItem> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", title);
  formData.append("description", description);

  return await apiRequest<GalleryItem>({
    method: "post",
    url: `/api/performers/${performerId}/gallery`,
    data: formData,
    headers: { "Content-Type": undefined },
  });
};

const removeGalleryItemFn = async ({
  performerId,
  itemId,
}: {
  performerId: string;
  itemId: string;
}): Promise<void> => {
  return await apiRequest<void>({
    method: "delete",
    url: `/api/performers/${performerId}/gallery/${itemId}`,
  });
};

const addCertificateFn = async ({
  performerId,
  file,
  description,
}: {
  performerId: string;
  file: File;
  description: string;
}): Promise<Certificate> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("description", description || "");

  return await apiRequest<Certificate>({
    method: "post",
    url: `/api/performers/${performerId}/certificates`,
    data: formData,
    headers: { "Content-Type": undefined },
  });
};

const removeCertificateFn = async ({
  performerId,
  itemId,
}: {
  performerId: string;
  itemId: string;
}): Promise<void> => {
  return await apiRequest<void>({
    method: "delete",
    url: `/api/performers/${performerId}/certificates/${itemId}`,
  });
};

const addRecommendationLetterFn = async ({
  performerId,
  file,
  description,
}: {
  performerId: string;
  file: File;
  description: string;
}): Promise<RecommendationLetter> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("description", description);

  return await apiRequest<RecommendationLetter>({
    method: "post",
    url: `/api/performers/${performerId}/letters`,
    data: formData,
    headers: { "Content-Type": undefined },
  });
};

const removeRecommendationLetterFn = async ({
  performerId,
  itemId,
}: {
  performerId: string;
  itemId: string;
}): Promise<void> => {
  return await apiRequest<void>({
    method: "delete",
    url: `/api/performers/${performerId}/letters/${itemId}`,
  });
};

const addAudioTrackFn = async ({
  performerId,
  file,
  title,
}: {
  performerId: string;
  file: File;
  title: string;
}): Promise<AudioTrack> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", title);
  formData.append("performerId", performerId);

  return await apiRequest<AudioTrack>({
    method: "post",
    url: `/api/performers/audio`,
    data: formData,
    headers: { "Content-Type": undefined },
  });
};

const removeAudioTrackFn = async ({
  trackId,
}: {
  performerId: string;
  trackId: string;
}): Promise<void> => {
  return await apiRequest<void>({
    method: "delete",
    url: `/api/performers/audio/${trackId}`,
  });
};

const updatePerformerCalendarFn = async ({
  performerId,
  bookedDates,
}: {
  performerId: string;
  bookedDates: Date[];
}): Promise<{ bookedDates: Date[] }> => {
  return await apiRequest<{ bookedDates: Date[] }>({
    method: "patch",
    url: `/api/performers/${performerId}/calendar`,
    data: { bookedDates },
  });
};

// --- PUBLIC EXPORTED FUNCTIONS (Non-Hook) ---

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export const getPerformersPaginated = async (
  params: Record<string, any>,
): Promise<PaginatedResult<PerformerProfile>> => {
  const query = new URLSearchParams();
  Object.keys(params).forEach((key) => {
    const value = params[key];
    if (value !== undefined && value !== null && value !== "") {
      if (Array.isArray(value)) {
        if (value.length > 0) query.append(key, value.join(","));
      } else {
        query.append(key, String(value));
      }
    }
  });

  return await apiRequest<PaginatedResult<PerformerProfile>>({
    method: "get",
    url: `/api/search/performers?${query.toString()}`,
  });
};

export const searchPerformersApi = async (
  params: Record<string, any>,
): Promise<PerformerProfile[]> => {
  const query = new URLSearchParams();
  Object.keys(params).forEach((key) => {
    const value = params[key];
    if (value !== null && value !== undefined && value !== "") {
      if (Array.isArray(value)) {
        if (value.length > 0) query.append(key, value.join(","));
      } else {
        query.append(key, value.toString());
      }
    }
  });

  return await apiRequest<PerformerProfile[]>({
    method: "get",
    url: `/api/performers/search?${query.toString()}`,
  });
};

export const getPerformersByIds = async (
  ids: string[],
): Promise<PerformerWithRating[]> => {
  if (!ids || ids.length === 0) return [];
  const idsParam = ids.join(",");

  return await apiRequest<PerformerWithRating[]>({
    method: "get",
    url: `/api/performers/batch?ids=${idsParam}`,
  });
};

export const getPerformerProfile = async (
  performerId: string,
): Promise<PerformerProfile | null> => {
  try {
    const data = await apiRequest<any>({
      method: "get",
      url: `/api/performers/${performerId}`,
    });
    if (!data) return null;
    return hydrateProfileDates(data);
  } catch (error) {
    console.error(`Ошибка загрузки профиля исполнителя ${performerId}:`, error);
    return null;
  }
};

// --- REACT QUERY HOOKS (Public) ---

export const usePerformerProfile = (performerId: string | null) => {
  return useQuery({
    queryKey: ["performer", "profile", performerId],
    queryFn: () => fetchPerformerProfileFn(performerId!),
    enabled: !!performerId,
    staleTime: 1000 * 60 * 5,
  });
};

export const useUpdatePerformerProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatePerformerProfileFn,
    onSuccess: (updatedProfile, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["performer", "profile", variables.performerId],
      });
      queryClient.setQueryData(
        ["performer", "profile", variables.performerId],
        updatedProfile,
      );
    },
  });
};

export const useDeletePerformerProfile = () => {
  return useMutation({
    mutationFn: deletePerformerProfileFn,
  });
};

export const useSearchPerformers = (searchParams: Record<string, any>) => {
  return useQuery({
    queryKey: ["performers", "search", searchParams],
    queryFn: () => searchPerformersApi(searchParams),
    staleTime: 1000 * 60 * 5,
    placeholderData: (prev) => prev,
  });
};

export const useAddGalleryItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addGalleryItemFn,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["performer", "profile", variables.performerId],
      });
    },
  });
};

export const useRemoveGalleryItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeGalleryItemFn,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["performer", "profile", variables.performerId],
      });
    },
  });
};

export const useAddCertificate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addCertificateFn,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["performer", "profile", variables.performerId],
      });
    },
  });
};

export const useRemoveCertificate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeCertificateFn,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["performer", "profile", variables.performerId],
      });
    },
  });
};

export const useAddRecommendationLetter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addRecommendationLetterFn,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["performer", "profile", variables.performerId],
      });
    },
  });
};

export const useRemoveRecommendationLetter = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeRecommendationLetterFn,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["performer", "profile", variables.performerId],
      });
    },
  });
};

export const useAddAudioTrack = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addAudioTrackFn,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["performer", "profile", variables.performerId],
      });
    },
  });
};

export const useRemoveAudioTrack = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeAudioTrackFn,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["performer", "profile", variables.performerId],
      });
    },
  });
};

export const useUpdatePerformerCalendar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePerformerCalendarFn,
    // Optimistic UI Update for instant feedback
    onMutate: async (newCalendarData) => {
      await queryClient.cancelQueries({
        queryKey: ["performer", "profile", newCalendarData.performerId],
      });
      const previousProfile = queryClient.getQueryData([
        "performer",
        "profile",
        newCalendarData.performerId,
      ]);

      queryClient.setQueryData(
        ["performer", "profile", newCalendarData.performerId],
        (old: any) => ({
          ...old,
          bookedDates: newCalendarData.bookedDates,
        }),
      );

      return { previousProfile };
    },
    onError: (err, newCalendarData, context) => {
      // Revert if the API call fails
      queryClient.setQueryData(
        ["performer", "profile", newCalendarData.performerId],
        context?.previousProfile,
      );
    },
    onSettled: (data, error, variables) => {
      // Sync strictly with backend afterwards
      queryClient.invalidateQueries({
        queryKey: ["performer", "profile", variables.performerId],
      });
    },
  });
};
