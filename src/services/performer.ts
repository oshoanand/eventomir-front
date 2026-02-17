"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/utils/api-client";
import { BookingRequest } from "@/services/booking";

export type ModerationStatus = "pending_approval" | "approved" | "rejected";

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

// Payment/Subscription stub (adjust path as needed)
export interface SubscriptionPlanDetails {
  id: string;
  name: string;
}

export interface Review {
  id: string;
  performerId: string;
  customerName: string;
  rating: number;
  comment?: string;
  date: Date; // The backend likely sends this as a string, frontend needs Date
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
  subscriptionPlanId: SubscriptionPlanDetails["id"];
  subscriptionEndDate: Date | null;
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
  reviews?: Review[];
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

// --- API FUNCTIONS (Internal/Private) ---

const mapProfileFromPublicView = (data: any): Partial<PerformerProfile> => ({
  id: data.id,
  name: data.name,
  companyName: data.company_name,
  description: data.description,
  profilePicture: data.profile_picture,
  backgroundPicture: data.background_picture,
  roles: data.roles || [],
  city: data.city,
  priceRange: data.price_range,
  latitude: data.latitude,
  longitude: data.longitude,
  accountType: data.account_type,
  moderationStatus: data.moderation_status,
  parentAgencyId: data.parent_agency_id,
  details: data.details,
});

const mapProfileFromPrivateTable = (data: any): PerformerProfile => {
  return {
    id: data.id,
    name: data.name,
    companyName: data.company_name,
    accountType: data.account_type,
    inn: data.inn,
    description: data.description,
    contactPhone: data.phone,
    contactEmail: data.email,
    email: data.email,
    profilePicture: data.profile_picture,
    profilePictureAltText: data.profile_picture_alt_text,
    backgroundPicture: data.background_picture,
    backgroundPictureAltText: data.background_picture_alt_text,
    roles: data.roles || [],
    city: data.city,
    priceRange: data.price_range,
    latitude: data.latitude,
    longitude: data.longitude,
    profileMetaTitle: data.profile_meta_title,
    profileMetaDescription: data.profile_meta_description,
    profileKeywords: data.profile_keywords,
    subscriptionPlanId: data.subscription_plan_id,
    subscriptionEndDate: data.subscription_end_date
      ? new Date(data.subscription_end_date)
      : null,
    moderationStatus: data.moderation_status,
    parentAgencyId: data.parent_agency_id,
    subProfileIds: data.sub_profile_ids || [],
    details: data.details || {},
    gallery:
      data.gallery_items
        ?.map((item: any) => ({
          id: item.id,
          title: item.title,
          imageUrls: item.image_urls,
          description: item.description,
          metaTitle: item.meta_title,
          metaDescription: item.meta_description,
          keywords: item.keywords,
          imageAltText: item.image_alt_text,
          moderationStatus: item.moderation_status,
        }))
        .filter((item: GalleryItem) => item.moderationStatus === "approved") ||
      [], // Only show approved items
    certificates:
      data.certificates?.filter(
        (item: Certificate) => item.moderationStatus === "approved",
      ) || [],
    recommendationLetters:
      data.recommendation_letters?.filter(
        (item: RecommendationLetter) => item.moderationStatus === "approved",
      ) || [],
    bookedDates:
      data.bookings
        ?.filter((b: any) => b.status === "confirmed")
        .map((b: any) => new Date(b.date)) || [],
    bookingRequests:
      data.bookings?.map((b: any) => ({
        id: b.id,
        date: new Date(b.date),
        customerId: b.customer_id,
        customerName: b.customer_name,
        status: b.status,
        details: b.details,
        price: b.price,
        service: b.service,
        performerId: b.performer_id,
      })) || [],
  };
};

const fetchPerformerProfileFn = async (
  performerId: string,
): Promise<PerformerProfile> => {
  return await apiRequest<PerformerProfile>({
    method: "get",
    url: `/api/performers/profile/${performerId}`,
  });
};

const updatePerformerProfileFn = async ({
  performerId,
  data,
}: {
  performerId: string;
  data: UpdatePerformerProfileParams;
}): Promise<PerformerProfile> => {
  const formData = new FormData();

  // Basic Text Fields
  if (data.name) formData.append("name", data.name);
  if (data.description) formData.append("description", data.description);
  if (data.city) formData.append("city", data.city);
  if (data.contactPhone) formData.append("phone", data.contactPhone);

  // Arrays (Roles)
  if (data.roles) {
    formData.append("roles", JSON.stringify(data.roles));
  }

  // Files
  if (data.profilePictureFile) {
    formData.append("profilePicture", data.profilePictureFile);
  }
  if (data.backgroundPictureFile) {
    formData.append("backgroundPicture", data.backgroundPictureFile);
  }

  // Handle dynamic price range or other fields if needed
  if (data.priceRange) {
    formData.append("priceRange", JSON.stringify(data.priceRange));
  }

  return await apiRequest<PerformerProfile>({
    method: "patch",
    url: `/api/performers/${performerId}`,
    data: formData,
    headers: { "Content-Type": undefined }, // Let browser set boundary
  });
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

// -- Content Management (Gallery/Docs) --

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

// --- PUBLIC EXPORTED FUNCTIONS (Non-Hook) ---

/**
 * Search Performers (Used by React Query or direct call)
 */
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

/**
 * Fetch Batch Performers by ID (Used for Compare/Favorites)
 */
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
      // Refresh profile data
      queryClient.invalidateQueries({
        queryKey: ["performer", "profile", variables.performerId],
      });
      // Optionally update cache directly
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

// -- Search Hook --
export const useSearchPerformers = (searchParams: Record<string, any>) => {
  return useQuery({
    queryKey: ["performers", "search", searchParams],
    queryFn: () => searchPerformersApi(searchParams),
    staleTime: 1000 * 60 * 5,
    placeholderData: (prev) => prev,
  });
};

// -- Content Hooks --

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

export const getPerformerProfile = async (
  performerId: string,
): Promise<PerformerProfile | null> => {
  console.log(`Загрузка профиля исполнителя ${performerId}...`);

  try {
    // 1. Call the Node.js API
    // The Backend now handles the logic:
    // It checks the session cookies. If the user is the owner/admin,
    // it returns the full profile (with pending items/bookings).
    // Otherwise, it returns only public approved data.
    const data = await apiRequest<PerformerProfile>({
      method: "get",
      url: `/api/performers/${performerId}`,
    });

    if (!data) {
      return null;
    }

    // 2. Hydrate Dates
    // JSON serialization converts Date objects to strings.
    // We must convert them back to Date objects for the UI components (Calendar, etc.) to work.
    const hydratedProfile: PerformerProfile = {
      ...data,
      // Convert booked dates strings to Date objects
      bookedDates: data.bookedDates?.map((date: any) => new Date(date)) || [],

      // If the backend returns booking requests (for the owner), hydrate those dates
      bookingRequests: data.bookingRequests?.map((req: any) => ({
        ...req,
        eventDate: new Date(req.eventDate),
        createdAt: new Date(req.createdAt),
      })),

      // Hydrate review dates if present
      reviews: data.reviews?.map((review: any) => ({
        ...review,
        date: new Date(review.date),
      })),
    };

    return hydratedProfile;
  } catch (error) {
    console.error(`Ошибка загрузки профиля исполнителя ${performerId}:`, error);
    return null;
  }
};
