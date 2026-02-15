// "use client";

// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { apiRequest } from "@/utils/api-client";
// import type { SubscriptionPlanDetails } from "./payment";

// // --- TYPE DEFINITIONS ---

// export type ModerationStatus = "pending_approval" | "approved" | "rejected";

// export interface BookingRequest {
//   id: string;
//   date: Date;
//   customerId: string;
//   customerName: string;
//   status: "pending" | "confirmed" | "rejected" | "cancelled_by_customer";
//   details?: string;
//   price?: number;
//   service?: string;
//   performerId: string;
//   performerName?: string;
// }

// export interface GalleryItem {
//   id: string;
//   title: string;
//   imageUrls: string[];
//   description: string;
//   metaTitle?: string;
//   metaDescription?: string;
//   keywords?: string;
//   imageAltText?: string;
//   imageFiles?: File[] | null;
//   moderationStatus: ModerationStatus;
// }

// export interface Certificate {
//   id: string;
//   fileUrl: string;
//   description?: string;
//   moderationStatus: ModerationStatus;
// }

// export interface RecommendationLetter {
//   id: string;
//   fileUrl: string;
//   description?: string;
//   moderationStatus: ModerationStatus;
// }

// export interface PerformerProfileBase {
//   id: string;
//   name: string;
//   companyName?: string;
//   accountType:
//     | "selfEmployed"
//     | "individualEntrepreneur"
//     | "legalEntity"
//     | "agency";
//   inn: string;
//   description: string;
//   contactPhone: string;
//   contactEmail: string;
//   email: string;
//   profilePicture?: string;
//   profilePictureAltText?: string;
//   backgroundPicture?: string;
//   backgroundPictureAltText?: string;
//   roles: string[];
//   city: string;
//   priceRange?: number[];
//   latitude?: number;
//   longitude?: number;
//   profileMetaTitle?: string;
//   profileMetaDescription?: string;
//   profileKeywords?: string;
//   subscriptionPlanId: SubscriptionPlanDetails["id"];
//   subscriptionEndDate: Date | null;
//   moderationStatus: ModerationStatus;
//   parentAgencyId?: string;
//   parentAgencyName?: string;
//   subProfileIds?: string[];
// }

// export type PerformerRoleDetails = {
//   /* ... */
// };

// export interface PerformerProfile extends PerformerProfileBase {
//   details?: PerformerRoleDetails;
//   gallery?: GalleryItem[];
//   bookedDates?: Date[];
//   bookingRequests?: BookingRequest[];
//   selectedDates?: Date[];
//   certificates?: Certificate[];
//   recommendationLetters?: RecommendationLetter[];
// }

// // Type for updating profile
// export type UpdatePerformerProfileParams = Partial<
//   Omit<PerformerProfile, "id" | "email" | "accountType" | "inn">
// > & {
//   profilePictureFile?: File | null;
//   backgroundPictureFile?: File | null;
// };

// // --- API FUNCTIONS (Private) ---

// const fetchPerformerProfileFn = async (
//   performerId: string,
// ): Promise<PerformerProfile> => {
//   return await apiRequest<PerformerProfile>({
//     method: "get",
//     url: `/api/performers/profile/${performerId}`,
//   });
// };

// const updatePerformerProfileFn = async ({
//   performerId,
//   data,
// }: {
//   performerId: string;
//   data: UpdatePerformerProfileParams;
// }): Promise<PerformerProfile> => {
//   const formData = new FormData();

//   if (data.name) formData.append("name", data.name);
//   if (data.description) formData.append("description", data.description);
//   if (data.city) formData.append("city", data.city);
//   if (data.contactPhone) formData.append("phone", data.contactPhone);

//   if (data.roles) {
//     formData.append("roles", JSON.stringify(data.roles));
//   }

//   if (data.profilePictureFile) {
//     formData.append("profilePicture", data.profilePictureFile);
//   }
//   if (data.backgroundPictureFile) {
//     formData.append("backgroundPicture", data.backgroundPictureFile);
//   }

//   return await apiRequest<PerformerProfile>({
//     method: "patch",
//     url: `/api/performers/${performerId}`,
//     data: formData,
//     headers: { "Content-Type": undefined },
//   });
// };

// const deletePerformerProfileFn = async (performerId: string): Promise<void> => {
//   return await apiRequest<void>({
//     method: "delete",
//     url: `/api/performers/${performerId}`,
//   });
// };

// const createBookingRequestFn = async ({
//   performerId,
//   requestData,
// }: {
//   performerId: string;
//   requestData: Omit<
//     BookingRequest,
//     "id" | "status" | "performerId" | "performerName"
//   >;
// }): Promise<BookingRequest> => {
//   return await apiRequest<BookingRequest>({
//     method: "post",
//     url: "/api/bookings",
//     data: { ...requestData, performerId },
//   });
// };

// const acceptBookingRequestFn = async ({
//   performerId,
//   requestId,
// }: {
//   performerId: string;
//   requestId: string;
// }): Promise<void> => {
//   return await apiRequest<void>({
//     method: "patch",
//     url: `/api/bookings/${requestId}/accept`,
//     data: { performerId },
//   });
// };

// const rejectBookingRequestFn = async ({
//   performerId,
//   requestId,
// }: {
//   performerId: string;
//   requestId: string;
// }): Promise<void> => {
//   return await apiRequest<void>({
//     method: "patch",
//     url: `/api/bookings/${requestId}/reject`,
//     data: { performerId },
//   });
// };

// // -- Gallery Functions --
// const addGalleryItemFn = async ({
//   performerId,
//   file,
//   title,
//   description,
// }: {
//   performerId: string;
//   file: File;
//   title: string;
//   description: string;
// }): Promise<GalleryItem> => {
//   const formData = new FormData();
//   formData.append("file", file);
//   formData.append("title", title);
//   formData.append("description", description);

//   return await apiRequest<GalleryItem>({
//     method: "post",
//     url: `/api/performers/${performerId}/gallery`,
//     data: formData,
//     headers: { "Content-Type": undefined },
//   });
// };

// const removeGalleryItemFn = async ({
//   performerId,
//   itemId,
// }: {
//   performerId: string;
//   itemId: string;
// }): Promise<void> => {
//   return await apiRequest<void>({
//     method: "delete",
//     url: `/api/performers/${performerId}/gallery/${itemId}`,
//   });
// };

// // -- Certificate Functions --
// const addCertificateFn = async ({
//   performerId,
//   file,
//   description,
// }: {
//   performerId: string;
//   file: File;
//   description: string;
// }): Promise<Certificate> => {
//   const formData = new FormData();
//   formData.append("file", file);
//   formData.append("description", description || "");

//   return await apiRequest<Certificate>({
//     method: "post",
//     url: `/api/performers/${performerId}/certificates`,
//     data: formData,
//     headers: { "Content-Type": undefined },
//   });
// };

// const removeCertificateFn = async ({
//   performerId,
//   itemId,
// }: {
//   performerId: string;
//   itemId: string;
// }): Promise<void> => {
//   return await apiRequest<void>({
//     method: "delete",
//     url: `/api/performers/${performerId}/certificates/${itemId}`,
//   });
// };

// // -- Recommendation Letter Functions --
// const addRecommendationLetterFn = async ({
//   performerId,
//   file,
//   description,
// }: {
//   performerId: string;
//   file: File;
//   description: string;
// }): Promise<RecommendationLetter> => {
//   const formData = new FormData();
//   formData.append("file", file);
//   formData.append("description", description);

//   return await apiRequest<RecommendationLetter>({
//     method: "post",
//     url: `/api/performers/${performerId}/letters`,
//     data: formData,
//     headers: { "Content-Type": undefined },
//   });
// };

// const removeRecommendationLetterFn = async ({
//   performerId,
//   itemId,
// }: {
//   performerId: string;
//   itemId: string;
// }): Promise<void> => {
//   return await apiRequest<void>({
//     method: "delete",
//     url: `/api/performers/${performerId}/letters/${itemId}`,
//   });
// };

// // --- REACT QUERY HOOKS (Public Exports) ---

// export const usePerformerProfile = (performerId: string | null) => {
//   return useQuery({
//     queryKey: ["performer", "profile", performerId],
//     queryFn: () => fetchPerformerProfileFn(performerId!),
//     enabled: !!performerId,
//     staleTime: 1000 * 60 * 5,
//   });
// };

// export const useUpdatePerformerProfile = () => {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: updatePerformerProfileFn,
//     onSuccess: (_, variables) => {
//       queryClient.invalidateQueries({
//         queryKey: ["performer", "profile", variables.performerId],
//       });
//     },
//   });
// };

// export const useDeletePerformerProfile = () => {
//   return useMutation({
//     mutationFn: deletePerformerProfileFn,
//   });
// };

// export const useCreateBookingRequest = () => {
//   return useMutation({
//     mutationFn: createBookingRequestFn,
//   });
// };

// export const useAcceptBookingRequest = () => {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: acceptBookingRequestFn,
//     onSuccess: (_, variables) => {
//       queryClient.invalidateQueries({
//         queryKey: ["performer", "profile", variables.performerId],
//       });
//     },
//   });
// };

// export const useRejectBookingRequest = () => {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: rejectBookingRequestFn,
//     onSuccess: (_, variables) => {
//       queryClient.invalidateQueries({
//         queryKey: ["performer", "profile", variables.performerId],
//       });
//     },
//   });
// };

// // -- Gallery Hooks --
// export const useAddGalleryItem = () => {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: addGalleryItemFn,
//     onSuccess: (_, variables) => {
//       queryClient.invalidateQueries({
//         queryKey: ["performer", "profile", variables.performerId],
//       });
//     },
//   });
// };

// export const useRemoveGalleryItem = () => {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: removeGalleryItemFn,
//     onSuccess: (_, variables) => {
//       queryClient.invalidateQueries({
//         queryKey: ["performer", "profile", variables.performerId],
//       });
//     },
//   });
// };

// // -- Certificate Hooks --
// export const useAddCertificate = () => {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: addCertificateFn,
//     onSuccess: (_, variables) => {
//       queryClient.invalidateQueries({
//         queryKey: ["performer", "profile", variables.performerId],
//       });
//     },
//   });
// };

// export const useRemoveCertificate = () => {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: removeCertificateFn,
//     onSuccess: (_, variables) => {
//       queryClient.invalidateQueries({
//         queryKey: ["performer", "profile", variables.performerId],
//       });
//     },
//   });
// };

// // -- Letter Hooks --
// export const useAddRecommendationLetter = () => {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: addRecommendationLetterFn,
//     onSuccess: (_, variables) => {
//       queryClient.invalidateQueries({
//         queryKey: ["performer", "profile", variables.performerId],
//       });
//     },
//   });
// };

// export const useRemoveRecommendationLetter = () => {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: removeRecommendationLetterFn,
//     onSuccess: (_, variables) => {
//       queryClient.invalidateQueries({
//         queryKey: ["performer", "profile", variables.performerId],
//       });
//     },
//   });
// };

// export const searchPerformersApi = async (
//   params: Record<string, any>,
// ): Promise<PerformerProfile[]> => {
//   const query = new URLSearchParams();

//   // Helper to append only existing values and format arrays as comma-separated strings
//   // This matches your backend logic: services.split(',')
//   Object.keys(params).forEach((key) => {
//     const value = params[key];
//     if (value !== null && value !== undefined && value !== "") {
//       if (Array.isArray(value)) {
//         if (value.length > 0) query.append(key, value.join(","));
//       } else {
//         query.append(key, value.toString());
//       }
//     }
//   });

//   // Use apiRequest to handle Base URL and Auth headers automatically
//   return await apiRequest<PerformerProfile[]>({
//     method: "get",
//     url: `/api/performers/search?${query.toString()}`,
//   });
// };

// // --- REACT QUERY HOOK ---

// export const useSearchPerformers = (
//   searchParams: Record<string, any>,
//   isEnabled: boolean = true,
// ) => {
//   return useQuery({
//     // Include params in queryKey so it refetches automatically when filters change
//     queryKey: ["performers", "search", searchParams],
//     queryFn: () => searchPerformersApi(searchParams),
//     enabled: isEnabled, // Control when the search runs
//     staleTime: 1000 * 60 * 5, // Cache results for 5 minutes
//     retry: 1,
//   });
// };

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/utils/api-client";
import { BookingRequest } from "@/services/booking";

export type ModerationStatus = "pending_approval" | "approved" | "rejected";

// export interface BookingRequest {
//   id: string;
//   date: Date;
//   customerId: string;
//   customerName: string;
//   status: "pending" | "confirmed" | "rejected" | "cancelled_by_customer";
//   details?: string;
//   price?: number;
//   service?: string;
//   performerId: string;
//   performerName?: string;
// }

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
  [key: string]: any; // specific details like { "Транспорт": { type: "Bus" } }
};

export interface PerformerProfile extends PerformerProfileBase {
  details?: PerformerRoleDetails;
  gallery?: GalleryItem[];
  bookedDates?: Date[];
  bookingRequests?: BookingRequest[];
  selectedDates?: Date[];
  certificates?: Certificate[];
  recommendationLetters?: RecommendationLetter[];
}

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
