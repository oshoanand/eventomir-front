"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/utils/api-client";
import { BookingRequest } from "@/services/booking";
import { UserSubscription } from "@/services/payment";

export type ModerationStatus = "pending_approval" | "approved" | "rejected";

export interface GalleryItem {
  id: string;
  title: string;
  image_urls: string[];
  description: string;
  meta_title?: string;
  meta_description?: string;
  keywords?: string;
  image_alt_text?: string;
  imageFiles?: File[] | null;
  moderation_status: ModerationStatus;
}

export interface Certificate {
  id: string;
  file_url: string; // Updated to match backend mapping if necessary (Prisma outputs file_url)
  description?: string;
  moderation_status: ModerationStatus;
}

export interface RecommendationLetter {
  id: string;
  file_url: string; // Updated to match backend mapping
  description?: string;
  moderation_status: ModerationStatus;
}

export interface Review {
  id: string;
  performerId: string;
  customerName: string;
  rating: number;
  comment?: string;
  date: Date;
}

// NEW: Audio Track Interface
export interface AudioTrack {
  id: string;
  performer_id: string;
  title: string;
  file_url: string;
  created_at: string;
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
  contactEmail: string;
  email: string;
  profilePicture?: string;
  profilePictureAltText?: string;
  backgroundPicture?: string;
  backgroundPictureAltText?: string;
  roles: string[];
  city: string;
  priceRange?: number[];
  latitude?: number;
  longitude?: number;
  profileMetaTitle?: string;
  profileMetaDescription?: string;
  profileKeywords?: string;

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
  audioTracks?: AudioTrack[]; // NEW: Added to profile
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

// Extended type for Comparison/Lists
export interface PerformerWithRating extends PerformerProfile {
  averageRating: number | null;
}

// Type for updating profile (includes optional files)
export type UpdatePerformerProfileParams = Partial<
  Omit<PerformerProfile, "id" | "email" | "accountType" | "inn">
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
          date: req.date ? new Date(req.date) : new Date(req.eventDate),
          createdAt: req.createdAt ? new Date(req.createdAt) : new Date(),
        }))
      : [],
    reviews: Array.isArray(data.reviews)
      ? data.reviews.map((review: any) => ({
          ...review,
          date: review.date ? new Date(review.date) : new Date(),
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
  if (data.contactPhone) formData.append("phone", data.contactPhone);

  if (data.roles) {
    formData.append("roles", JSON.stringify(data.roles));
  }
  if (data.priceRange) {
    formData.append("priceRange", JSON.stringify(data.priceRange));
  }

  if (data.profilePictureFile) {
    formData.append("profilePicture", data.profilePictureFile);
  }
  if (data.backgroundPictureFile) {
    formData.append("backgroundPicture", data.backgroundPictureFile);
  }

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

// -- Booking Functions --

const createBookingRequestFn = async ({
  performerId,
  requestData,
}: {
  performerId: string;
  requestData: Omit<
    BookingRequest,
    "id" | "status" | "performerId" | "performerName"
  >;
}): Promise<BookingRequest> => {
  return await apiRequest<BookingRequest>({
    method: "post",
    url: "/api/bookings",
    data: { ...requestData, performerId },
  });
};

const acceptBookingRequestFn = async ({
  performerId,
  requestId,
}: {
  performerId: string;
  requestId: string;
}): Promise<void> => {
  return await apiRequest<void>({
    method: "patch",
    url: `/api/bookings/${requestId}/accept`,
    data: { performerId },
  });
};

const rejectBookingRequestFn = async ({
  performerId,
  requestId,
}: {
  performerId: string;
  requestId: string;
}): Promise<void> => {
  return await apiRequest<void>({
    method: "patch",
    url: `/api/bookings/${requestId}/reject`,
    data: { performerId },
  });
};

// -- Content Management (Gallery/Docs/Audio) --

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

// NEW: Audio API Functions
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
    headers: { "Content-Type": undefined }, // Axios handles multipart/form-data
  });
};

const removeAudioTrackFn = async ({
  trackId,
}: {
  performerId: string; // Included to match signature for invalidation
  trackId: string;
}): Promise<void> => {
  return await apiRequest<void>({
    method: "delete",
    url: `/api/performers/audio/${trackId}`,
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

export const useCreateBookingRequest = () => {
  return useMutation({
    mutationFn: createBookingRequestFn,
  });
};

export const useAcceptBookingRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: acceptBookingRequestFn,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["performer", "profile", variables.performerId],
      });
    },
  });
};

export const useRejectBookingRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rejectBookingRequestFn,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["performer", "profile", variables.performerId],
      });
    },
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

// NEW: React Query Hooks for Audio
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
