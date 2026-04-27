// "use client";

// import { useState, useEffect, useCallback, useRef } from "react";
// import { useSearchParams, useRouter } from "next/navigation";
// import { useSession } from "next-auth/react";
// import { useChatStore } from "@/store/useChatStore";

// // --- API Services ---
// import {
//   usePerformerProfile,
//   useUpdatePerformerProfile,
//   useAddGalleryItem,
//   useRemoveGalleryItem,
//   useAddAudioTrack,
//   useRemoveAudioTrack,
//   useAddCertificate,
//   useRemoveCertificate,
//   useAddFeedPost,
//   useDeleteFeedPost,
//   useTogglePostVisibility,
//   useLikeFeedPost,
//   useAddFeedComment,
// } from "@/services/performer";
// import {
//   isFavorite as checkIsFavorite,
//   addToFavorites,
//   removeFromFavorites,
// } from "@/services/favorites";
// import { useReviews } from "@/services/reviews";
// import { getSiteSettings } from "@/services/settings";
// import { apiRequest } from "@/utils/api-client";
// import { useToast } from "@/hooks/use-toast";
// import { format } from "date-fns";
// import { ru } from "date-fns/locale";

// // --- UI Components ---
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogDescription,
//   DialogFooter,
//   DialogClose,
// } from "@/components/ui/dialog";
// import { Label } from "@/components/ui/label";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Button } from "@/components/ui/button";
// import { Textarea } from "@/components/ui/textarea";
// import { Badge } from "@/components/ui/badge";
// import { Input } from "@/components/ui/input";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Separator } from "@/components/ui/separator";
// import {
//   User,
//   Loader2,
//   CalendarIcon,
//   Edit3,
//   Wallet,
//   PlusCircle,
//   CreditCard,
//   Music,
//   Trash2,
//   MapPin,
//   MessageCircle,
//   Heart,
//   Video,
//   Image as ImageIcon,
//   ChefHat,
//   Link as LinkIcon,
//   Youtube,
//   Send as SendIcon,
//   CheckCircle2,
//   Banknote,
//   EyeOff,
//   Eye,
//   Send,
//   Award,
//   FileText,
//   LayoutGrid,
//   X,
//   ChevronDown,
//   ChevronRight,
//   Globe,
// } from "lucide-react";

// // --- Custom Components ---
// import GalleryManager from "@/components/performer-profile/GalleryManager";
// import ReviewsSection from "@/components/performer-profile/ReviewsSection";
// import CalendarSection from "@/components/performer-profile/CalendarSection";
// import AudioManager from "@/components/performer-profile/AudioManager";
// import AudioUploadDialog from "@/components/performer-profile/AudioUploadDialog";
// import FileUploadDialog from "@/components/performer-profile/FileUploadDialog";
// import AgencyDashboard from "@/components/performer-profile/AgencyDashboard";
// import SubscriptionStatusCard from "@/components/profile/SubscriptionStatusCard";
// import { cn } from "@/utils/utils";

// const API_BASE =
//   process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8800";

// const getImageUrl = (path: string | undefined | null) => {
//   if (!path) return "";
//   if (path.startsWith("http")) return path;
//   return `${API_BASE}${path}`;
// };

// // Types for Category Dialog
// interface SubCategory {
//   id: string;
//   name: string;
// }
// interface SiteCategory {
//   id: string;
//   name: string;
//   subCategories?: SubCategory[];
// }

// export default function PerformerProfileClient() {
//   const searchParams = useSearchParams();
//   const { data: session, status: authStatus } = useSession();
//   const router = useRouter();
//   const { toast } = useToast();
//   const [feedFiles, setFeedFiles] = useState<File[]>([]);
//   const [feedPreviews, setFeedPreviews] = useState<
//     { url: string; type: string }[]
//   >([]);

//   // 🚨 REFS FOR FILE UPLOADS
//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const backgroundInputRef = useRef<HTMLInputElement>(null);
//   const profileInputRef = useRef<HTMLInputElement>(null);

//   const [isUploadingBackground, setIsUploadingBackground] = useState(false);
//   const [isUploadingProfile, setIsUploadingProfile] = useState(false);

//   const PRESET_AMOUNTS = [500, 1000, 2000, 5000];
//   const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
//   const [topUpAmount, setTopUpAmount] = useState<string>("1000");
//   const [isProcessingTopUp, setIsProcessingTopUp] = useState(false);

//   const urlProfileId = searchParams.get("id");
//   const sessionUser = session?.user;
//   const targetProfileId =
//     urlProfileId ||
//     (sessionUser?.role === "performer" ? sessionUser?.id : null);
//   const isOwnProfile = !!(
//     sessionUser?.id && targetProfileId === sessionUser.id
//   );

//   const {
//     data: profile,
//     isLoading: isProfileLoading,
//     isError,
//     refetch: refetchProfile,
//   } = usePerformerProfile(targetProfileId || null);

//   const isOnlineInStore = useChatStore((state) => {
//     if (!targetProfileId) return false;
//     const users = state.onlineUsers;
//     // Safely check both Set and Array just in case
//     if (typeof users?.has === "function") return users.has(targetProfileId);
//     if (Array.isArray(users)) return users.includes(targetProfileId);
//     return false;
//   });

//   const isPerformerOnline = isOwnProfile || isOnlineInStore;
//   const { data: reviews = [] } = useReviews(targetProfileId || null);

//   // --- Role Intelligence ---
//   const rolesArray = profile?.roles?.map((r) => r.toLowerCase()) || [];
//   const isAudioHeavy = rolesArray.some(
//     (r) =>
//       r.includes("dj") ||
//       r.includes("вокал") ||
//       r.includes("певец") ||
//       r.includes("музыкант"),
//   );
//   const isVisualHeavy = rolesArray.some(
//     (r) =>
//       r.includes("танц") ||
//       r.includes("шоу") ||
//       r.includes("фото") ||
//       r.includes("видео"),
//   );
//   const isChef = rolesArray.some(
//     (r) => r.includes("повар") || r.includes("кейтеринг"),
//   );

//   // --- State ---
//   const [isFavorite, setIsFavorite] = useState(false);
//   const [walletBalance, setWalletBalance] = useState<number>(0);
//   const [newPostText, setNewPostText] = useState("");
//   const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(
//     null,
//   );
//   const [commentText, setCommentText] = useState("");

//   const [portfolioFilter, setPortfolioFilter] = useState<
//     "all" | "photo" | "audio" | "docs"
//   >("all");

//   // Dialog States
//   const [isGalleryDialogOpen, setIsGalleryDialogOpen] = useState(false);
//   const [isAudioDialogOpen, setIsAudioDialogOpen] = useState(false);
//   const [isCertificateDialogOpen, setIsCertificateDialogOpen] = useState(false);

//   // 🚨 Category State
//   const [adminCategories, setAdminCategories] = useState<SiteCategory[]>([]);
//   const [tempSelectedRoles, setTempSelectedRoles] = useState<string[]>([]);
//   const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
//   const [isSavingCategories, setIsSavingCategories] = useState(false);

//   // Mutations
//   const addGalleryItemMutation = useAddGalleryItem();
//   const removeGalleryItemMutation = useRemoveGalleryItem();
//   const addAudioMutation = useAddAudioTrack();
//   const removeAudioMutation = useRemoveAudioTrack();
//   const addCertificateMutation = useAddCertificate();
//   const removeCertificateMutation = useRemoveCertificate();
//   const updateMutation = useUpdatePerformerProfile();
//   const addFeedPostMutation = useAddFeedPost();
//   const deleteFeedPostMutation = useDeleteFeedPost();
//   const toggleVisibilityMutation = useTogglePostVisibility();
//   const likeMutation = useLikeFeedPost();
//   const commentMutation = useAddFeedComment();

//   // --- CATEGORY HANDLERS ---
//   useEffect(() => {
//     if (isOwnProfile) {
//       getSiteSettings()
//         .then((settings) => {
//           if (settings?.siteCategories)
//             setAdminCategories(settings.siteCategories);
//         })
//         .catch(console.error);
//     }
//   }, [isOwnProfile]);

//   useEffect(() => {
//     if (profile && isCategoryDialogOpen) {
//       setTempSelectedRoles(profile.roles || []);
//     }
//   }, [profile, isCategoryDialogOpen]);

//   const handleCategoryToggle = (category: SiteCategory, isChecked: boolean) => {
//     if (isChecked) {
//       // 🚨 One Main Category Rule: Overwrite everything with this new category
//       setTempSelectedRoles([category.name]);
//     } else {
//       // Uncheck clears everything
//       setTempSelectedRoles([]);
//     }
//   };

//   const toggleTempRole = (subRoleName: string) => {
//     setTempSelectedRoles((prev) =>
//       prev.includes(subRoleName)
//         ? prev.filter((r) => r !== subRoleName)
//         : [...prev, subRoleName],
//     );
//   };

//   const handleSaveCategories = async () => {
//     if (!profile) return;
//     setIsSavingCategories(true);
//     try {
//       await updateMutation.mutateAsync({
//         performerId: profile.id,
//         data: { roles: tempSelectedRoles },
//       });
//       toast({ title: "Специализации успешно обновлены!" });
//       setIsCategoryDialogOpen(false);
//     } catch (error) {
//       toast({ variant: "destructive", title: "Ошибка сохранения" });
//     } finally {
//       setIsSavingCategories(false);
//     }
//   };

//   // --- IMAGE UPLOAD HANDLERS ---
//   const handleBackgroundChange = async (
//     e: React.ChangeEvent<HTMLInputElement>,
//   ) => {
//     const file = e.target.files?.[0];
//     if (!file || !profile) return;

//     if (!file.type.startsWith("image/")) {
//       return toast({
//         variant: "destructive",
//         title: "Пожалуйста, выберите изображение",
//       });
//     }
//     if (file.size > 5 * 1024 * 1024) {
//       return toast({
//         variant: "destructive",
//         title: "Файл слишком большой (макс. 5МБ)",
//       });
//     }

//     setIsUploadingBackground(true);
//     try {
//       await updateMutation.mutateAsync({
//         performerId: profile.id,
//         data: { backgroundPictureFile: file },
//       });
//       toast({ variant: "default", title: "Обложка успешно обновлена!" });
//     } catch (error) {
//       toast({ variant: "destructive", title: "Ошибка при загрузке обложки" });
//     } finally {
//       setIsUploadingBackground(false);
//       if (backgroundInputRef.current) backgroundInputRef.current.value = "";
//     }
//   };

//   const handleProfileChange = async (
//     e: React.ChangeEvent<HTMLInputElement>,
//   ) => {
//     const file = e.target.files?.[0];
//     if (!file || !profile) return;

//     if (!file.type.startsWith("image/")) {
//       return toast({
//         variant: "destructive",
//         title: "Пожалуйста, выберите изображение",
//       });
//     }
//     if (file.size > 5 * 1024 * 1024) {
//       return toast({
//         variant: "destructive",
//         title: "Файл слишком большой (макс. 5МБ)",
//       });
//     }

//     setIsUploadingProfile(true);
//     try {
//       await updateMutation.mutateAsync({
//         performerId: profile.id,
//         data: { profilePictureFile: file },
//       });
//       toast({ variant: "default", title: "Аватар успешно обновлен!" });
//     } catch (error) {
//       toast({ variant: "destructive", title: "Ошибка при загрузке аватара" });
//     } finally {
//       setIsUploadingProfile(false);
//       if (profileInputRef.current) profileInputRef.current.value = "";
//     }
//   };

//   // --- FEED UPLOAD HANDLERS ---
//   const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (!e.target.files) return;
//     const files = Array.from(e.target.files);
//     const validFiles: File[] = [];
//     let hasVideo = feedFiles.some((f) => f.type.startsWith("video/"));

//     for (const file of files) {
//       if (file.type.startsWith("image/")) {
//         if (file.size > 5 * 1024 * 1024) {
//           toast({
//             variant: "destructive",
//             title: `Файл ${file.name} превышает 5МБ`,
//           });
//           continue;
//         }
//         validFiles.push(file);
//       } else if (file.type.startsWith("video/")) {
//         if (hasVideo) {
//           toast({
//             variant: "destructive",
//             title: "В один пост можно добавить только одно видео",
//           });
//           continue;
//         }
//         if (file.size > 15 * 1024 * 1024) {
//           toast({
//             variant: "destructive",
//             title: `Видео ${file.name} превышает 15МБ`,
//           });
//           continue;
//         }
//         validFiles.push(file);
//         hasVideo = true;
//       }
//     }

//     if (validFiles.length > 0) {
//       setFeedFiles((prev) => [...prev, ...validFiles]);
//       const newPreviews = validFiles.map((f) => ({
//         url: URL.createObjectURL(f),
//         type: f.type,
//       }));
//       setFeedPreviews((prev) => [...prev, ...newPreviews]);
//     }
//     e.target.value = "";
//   };

//   const removeFeedFile = (index: number) => {
//     URL.revokeObjectURL(feedPreviews[index].url);
//     setFeedFiles((prev) => prev.filter((_, i) => i !== index));
//     setFeedPreviews((prev) => prev.filter((_, i) => i !== index));
//   };

//   const handlePostFeed = () => {
//     if (!profile) return;
//     if (!newPostText.trim() && feedFiles.length === 0) return;

//     addFeedPostMutation.mutate(
//       { performerId: profile.id, text: newPostText, files: feedFiles },
//       {
//         onSuccess: () => {
//           toast({ title: "Запись опубликована!" });
//           setNewPostText("");
//           setFeedFiles([]);
//           setFeedPreviews([]);
//         },
//         onError: (err: any) => {
//           toast({
//             variant: "destructive",
//             title: err.message || "Ошибка публикации",
//           });
//         },
//       },
//     );
//   };

//   // --- OTHER HANDLERS ---
//   const handleTopUp = async () => {
//     const amount = parseInt(topUpAmount, 10);
//     if (isNaN(amount) || amount < 100) {
//       toast({
//         variant: "destructive",
//         title: "Некорректная сумма",
//         description: "Минимальная сумма пополнения — 100 ₽",
//       });
//       return;
//     }

//     setIsProcessingTopUp(true);
//     try {
//       const response = await apiRequest<{ paymentUrl: string }>({
//         method: "post",
//         url: "/api/wallet/topup/performer",
//         data: { amount },
//       });

//       if (response.paymentUrl) {
//         toast({ variant: "default", title: "Переход к оплате..." });
//         window.location.href = response.paymentUrl;
//       }
//     } catch (error: any) {
//       toast({
//         variant: "destructive",
//         title: "Ошибка",
//         description:
//           error.message || "Не удалось создать платеж. Попробуйте позже.",
//       });
//     } finally {
//       setIsProcessingTopUp(false);
//     }
//   };

//   const handleCommentSubmit = (postId: string) => {
//     if (!sessionUser)
//       return toast({
//         variant: "destructive",
//         title: "Войдите, чтобы комментировать",
//       });
//     if (!commentText.trim()) return;

//     commentMutation.mutate(
//       { postId, text: commentText },
//       {
//         onSuccess: () => {
//           toast({ title: "Комментарий добавлен" });
//           setCommentText("");
//           setActiveCommentPostId(null);
//         },
//         onError: () =>
//           toast({
//             variant: "destructive",
//             title: "Ошибка добавления комментария",
//           }),
//       },
//     );
//   };

//   const handleToggleFavorite = async () => {
//     if (!profile || !sessionUser) return;
//     try {
//       if (isFavorite) {
//         await removeFromFavorites(sessionUser.id, profile.id);
//         toast({ description: "Удалено из избранного" });
//       } else {
//         await addToFavorites(sessionUser.id, {
//           id: profile.id,
//           name: profile.name,
//           profilePicture: profile.profilePicture || "",
//           city: profile.city,
//           roles: profile.roles,
//         });
//         toast({ description: "Добавлено в избранное" });
//       }
//       setIsFavorite(!isFavorite);
//     } catch (e) {
//       toast({ variant: "destructive", title: "Ошибка" });
//     }
//   };

//   const fetchWallet = useCallback(async () => {
//     if (!isOwnProfile) return;
//     try {
//       const data = await apiRequest<{ walletBalance: number }>({
//         method: "get",
//         url: "/api/users/me",
//       });
//       setWalletBalance(data.walletBalance || 0);
//     } catch (error) {
//       console.error("Failed to fetch wallet", error);
//     }
//   }, [isOwnProfile]);

//   useEffect(() => {
//     fetchWallet();
//   }, [fetchWallet]);

//   useEffect(() => {
//     if (profile && sessionUser?.role === "customer") {
//       checkIsFavorite(sessionUser.id, profile.id).then(setIsFavorite);
//     }
//   }, [profile, sessionUser]);

//   // --- Render ---
//   if (isProfileLoading || authStatus === "loading") {
//     return (
//       <div className="p-20 text-center font-medium text-muted-foreground flex flex-col items-center">
//         <Loader2 className="w-8 h-8 animate-spin mb-4" />
//         Загрузка профиля...
//       </div>
//     );
//   }

//   if (isError || !profile) {
//     return (
//       <div className="text-center py-20 font-bold text-2xl">
//         Профиль не найден
//       </div>
//     );
//   }

//   if (isOwnProfile && profile.accountType === "agency" && !urlProfileId) {
//     return <AgencyDashboard profile={profile} />;
//   }

//   return (
//     <div className="bg-[#EDEEF0] min-h-screen pb-20 font-sans selection:bg-primary/20">
//       {/* 1. COVER & HEADER */}

//       <div className="bg-white border-b border-border/40 shadow-sm">
//         <div className="container max-w-5xl mx-auto px-0 md:px-4">
//           <div className="relative h-48 md:h-64 w-full bg-gradient-to-r from-muted to-muted/50 group overflow-hidden md:rounded-b-2xl">
//             {profile.backgroundPicture ? (
//               <img
//                 src={getImageUrl(profile.backgroundPicture)}
//                 className="w-full h-full object-cover transition-opacity duration-300"
//                 alt="Cover"
//                 style={{ opacity: isUploadingBackground ? 0.5 : 1 }}
//               />
//             ) : (
//               <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/30">
//                 <ImageIcon className="w-16 h-16" />
//               </div>
//             )}

//             {isOwnProfile && (
//               <>
//                 <input
//                   type="file"
//                   ref={backgroundInputRef}
//                   onChange={handleBackgroundChange}
//                   accept="image/jpeg,image/png,image/webp"
//                   className="hidden"
//                 />
//                 <Button
//                   variant="secondary"
//                   size="sm"
//                   onClick={() => backgroundInputRef.current?.click()}
//                   disabled={isUploadingBackground}
//                   className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white border-0 backdrop-blur-md transition-all"
//                 >
//                   {isUploadingBackground ? (
//                     <>
//                       <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
//                       Обновление...
//                     </>
//                   ) : (
//                     <>
//                       <Edit3 className="w-4 h-4 mr-2" /> Изменить обложку
//                     </>
//                   )}
//                 </Button>
//               </>
//             )}
//           </div>

//           <div className="px-4 md:px-8 pb-6 relative flex flex-col md:flex-row gap-4 md:gap-6 items-center md:items-end -mt-16 md:-mt-12">
//             {/* 🚨 PROFILE PICTURE AVATAR */}
//             <div
//               className={cn("relative group", isOwnProfile && "cursor-pointer")}
//               onClick={() =>
//                 isOwnProfile &&
//                 !isUploadingProfile &&
//                 profileInputRef.current?.click()
//               }
//             >
//               <Avatar
//                 className={cn(
//                   "w-32 h-32 md:w-40 md:h-40 border-4 border-white shadow-md bg-white transition-opacity",
//                   isUploadingProfile && "opacity-50",
//                 )}
//               >
//                 <AvatarImage
//                   src={getImageUrl(profile.profilePicture)}
//                   className="object-cover"
//                 />
//                 <AvatarFallback className="text-4xl font-bold bg-primary/10 text-primary">
//                   {profile.name?.charAt(0)}
//                 </AvatarFallback>
//               </Avatar>

//               {isOwnProfile && (
//                 <>
//                   <input
//                     type="file"
//                     ref={profileInputRef}
//                     onChange={handleProfileChange}
//                     accept="image/jpeg,image/png,image/webp"
//                     className="hidden"
//                   />
//                   <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
//                     {isUploadingProfile ? (
//                       <Loader2 className="w-8 h-8 text-white animate-spin" />
//                     ) : (
//                       <Edit3 className="w-8 h-8 text-white" />
//                     )}
//                   </div>
//                 </>
//               )}
//             </div>

//             <div className="flex-1 text-center md:text-left mb-2">
//               <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
//                 <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
//                   {profile.name}
//                 </h1>
//                 {profile.moderationStatus === "APPROVED" && (
//                   <CheckCircle2 className="w-6 h-6 text-blue-500" />
//                 )}
//               </div>
//               <p className="text-muted-foreground font-medium text-sm flex items-center justify-center md:justify-start gap-1.5">
//                 <MapPin className="w-4 h-4" />{" "}
//                 {profile.city || "Город не указан"}
//                 <span className="mx-2 text-muted-foreground/30">•</span>
//                 <span
//                   className={cn(
//                     "flex items-center gap-1.5 text-sm font-medium transition-colors",
//                     isPerformerOnline
//                       ? "text-emerald-600"
//                       : "text-muted-foreground/80",
//                   )}
//                 >
//                   <span className="relative flex h-2.5 w-2.5 items-center justify-center">
//                     {/* Pulsing ring (only renders when online) */}
//                     {isPerformerOnline && (
//                       <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
//                     )}

//                     {/* Solid inner dot */}
//                     <span
//                       className={cn(
//                         "relative inline-flex h-2.5 w-2.5 rounded-full transition-colors",
//                         isPerformerOnline
//                           ? "bg-emerald-500"
//                           : "bg-muted-foreground/40",
//                       )}
//                     />
//                   </span>
//                   {isPerformerOnline ? "Онлайн" : "Был(а) недавно"}
//                 </span>
//               </p>
//             </div>

//             <div className="flex w-full md:w-auto gap-3 mb-2">
//               {!isOwnProfile ? (
//                 <>
//                   <Button
//                     className="flex-1 md:flex-none rounded-xl h-11 px-6 font-bold"
//                     onClick={() => router.push(`/chat/${profile.id}`)}
//                   >
//                     <MessageCircle className="w-4 h-4 mr-2" /> Написать
//                   </Button>
//                   <Button
//                     variant="outline"
//                     className="flex-1 md:flex-none rounded-xl h-11 px-6 font-bold text-primary border-primary hover:bg-primary/5"
//                   >
//                     <CalendarIcon className="w-4 h-4 mr-2" /> Забронировать
//                   </Button>
//                   <Button
//                     variant="secondary"
//                     size="icon"
//                     onClick={handleToggleFavorite}
//                     className="rounded-xl h-11 w-11 shrink-0"
//                   >
//                     <Heart
//                       className={cn(
//                         "w-5 h-5 transition-colors",
//                         isFavorite
//                           ? "fill-red-500 text-red-500"
//                           : "text-foreground",
//                       )}
//                     />
//                   </Button>
//                 </>
//               ) : (
//                 <Button
//                   variant="outline"
//                   className="w-full md:w-auto rounded-xl h-11 px-6 font-bold"
//                   onClick={() => router.push("/settings")}
//                 >
//                   <Edit3 className="w-4 h-4 mr-2" /> Настройки профиля
//                 </Button>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* 2. MAIN DASHBOARD */}
//       <div className="container max-w-5xl mx-auto px-4 mt-6 flex flex-col md:flex-row gap-6">
//         {/* --- LEFT COLUMN --- */}
//         <div className="flex-1 space-y-6 min-w-0">
//           <Tabs defaultValue="wall" className="w-full">
//             <TabsList className="w-full bg-white justify-start h-14 p-1.5 shadow-sm rounded-2xl gap-1 overflow-x-auto no-scrollbar border border-border/40">
//               <TabsTrigger
//                 value="wall"
//                 className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-xl px-5 py-2.5 font-bold text-sm"
//               >
//                 Стена
//               </TabsTrigger>
//               <TabsTrigger
//                 value="portfolio"
//                 className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-xl px-5 py-2.5 font-bold text-sm"
//               >
//                 Портфолио
//               </TabsTrigger>

//               {isOwnProfile && (
//                 <>
//                   <TabsTrigger
//                     value="subscription"
//                     className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-xl px-5 py-2.5 font-bold text-sm"
//                   >
//                     Подписка
//                   </TabsTrigger>
//                   <TabsTrigger
//                     value="finance"
//                     className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-xl px-5 py-2.5 font-bold text-sm"
//                   >
//                     Финансы
//                   </TabsTrigger>
//                   <TabsTrigger
//                     value="reviews"
//                     className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-xl px-5 py-2.5 font-bold text-sm"
//                   >
//                     Отзывы{" "}
//                     {reviews.length > 0 && (
//                       <span className="ml-2 opacity-50">{reviews.length}</span>
//                     )}
//                   </TabsTrigger>
//                 </>
//               )}
//             </TabsList>

//             <div className="mt-6">
//               {/* === WALL / FEED === */}
//               <TabsContent
//                 value="wall"
//                 className="space-y-6 focus-visible:outline-none"
//               >
//                 {/* Create Post Widget (Owner Only) */}
//                 {isOwnProfile && (
//                   <div className="bg-white rounded-2xl p-4 shadow-sm border border-border/40 animate-in fade-in">
//                     <div className="flex gap-3">
//                       <Avatar className="w-10 h-10">
//                         <AvatarImage
//                           src={getImageUrl(profile.profilePicture)}
//                         />
//                         <AvatarFallback>
//                           {profile.name?.charAt(0)}
//                         </AvatarFallback>
//                       </Avatar>
//                       <div className="flex-1 min-w-0">
//                         <Textarea
//                           placeholder="Что у вас нового?"
//                           className="min-h-[80px] bg-muted/20 border-transparent focus-visible:ring-0 focus-visible:bg-muted/40 resize-none text-base rounded-xl mb-3"
//                           value={newPostText}
//                           onChange={(e) => setNewPostText(e.target.value)}
//                         />

//                         {/* MEDIA PREVIEWS */}
//                         {feedPreviews.length > 0 && (
//                           <div className="flex flex-wrap gap-3 mb-3">
//                             {feedPreviews.map((preview, idx) => (
//                               <div
//                                 key={idx}
//                                 className="relative w-20 h-20 rounded-xl overflow-hidden border border-border"
//                               >
//                                 {preview.type.startsWith("image/") ? (
//                                   <img
//                                     src={preview.url}
//                                     alt="Preview"
//                                     className="w-full h-full object-cover"
//                                   />
//                                 ) : (
//                                   <video
//                                     src={preview.url}
//                                     className="w-full h-full object-cover"
//                                     muted
//                                   />
//                                 )}
//                                 <button
//                                   onClick={() => removeFeedFile(idx)}
//                                   className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-red-500 transition-colors"
//                                 >
//                                   <X className="w-3 h-3" />
//                                 </button>
//                               </div>
//                             ))}
//                           </div>
//                         )}

//                         <div className="flex justify-between items-center">
//                           <div className="flex gap-1">
//                             <input
//                               type="file"
//                               ref={fileInputRef}
//                               onChange={handleFileSelect}
//                               accept="image/*,video/mp4,video/quicktime,video/x-msvideo"
//                               multiple
//                               className="hidden"
//                             />
//                             <Button
//                               variant="ghost"
//                               size="sm"
//                               onClick={() => fileInputRef.current?.click()}
//                               className="text-muted-foreground hover:bg-muted rounded-lg px-3"
//                             >
//                               <ImageIcon className="w-4 h-4 mr-2" /> Фото /
//                               Видео
//                             </Button>
//                           </div>

//                           <Button
//                             onClick={handlePostFeed}
//                             disabled={
//                               addFeedPostMutation.isPending ||
//                               (!newPostText.trim() && feedFiles.length === 0)
//                             }
//                             className="rounded-xl px-6 font-bold shadow-sm"
//                           >
//                             {addFeedPostMutation.isPending ? (
//                               <Loader2 className="w-4 h-4 animate-spin" />
//                             ) : (
//                               "Опубликовать"
//                             )}
//                           </Button>
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 {profile.feedPosts && profile.feedPosts.length > 0 ? (
//                   profile.feedPosts.map((post) => (
//                     <div
//                       key={post.id}
//                       className={cn(
//                         "bg-white rounded-2xl p-5 shadow-sm border border-border/40 transition-opacity animate-in fade-in",
//                         !post.isPublic && "opacity-70",
//                       )}
//                     >
//                       <div className="flex items-center gap-3 mb-4">
//                         <Avatar className="w-10 h-10">
//                           <AvatarImage
//                             src={getImageUrl(profile.profilePicture)}
//                           />
//                         </Avatar>
//                         <div className="flex-1">
//                           <h4 className="font-bold text-[15px]">
//                             {profile.name}
//                           </h4>
//                           <p className="text-xs text-muted-foreground">
//                             {format(new Date(post.createdAt), "d MMM в HH:mm", {
//                               locale: ru,
//                             })}
//                           </p>
//                         </div>

//                         {isOwnProfile && (
//                           <div className="flex items-center gap-2">
//                             <Button
//                               variant="ghost"
//                               size="sm"
//                               onClick={() =>
//                                 toggleVisibilityMutation.mutate({
//                                   performerId: profile.id,
//                                   postId: post.id,
//                                 })
//                               }
//                               className="text-muted-foreground hover:bg-muted rounded-lg"
//                             >
//                               {post.isPublic ? (
//                                 <Eye className="w-4 h-4" />
//                               ) : (
//                                 <EyeOff className="w-4 h-4 text-destructive" />
//                               )}
//                             </Button>
//                             <Button
//                               variant="ghost"
//                               size="sm"
//                               onClick={() =>
//                                 deleteFeedPostMutation.mutate({
//                                   performerId: profile.id,
//                                   postId: post.id,
//                                 })
//                               }
//                               className="text-destructive hover:bg-red-50 rounded-lg"
//                             >
//                               <Trash2 className="w-4 h-4" />
//                             </Button>
//                           </div>
//                         )}
//                       </div>

//                       {post.text && (
//                         <p className="text-[15px] text-foreground/90 leading-relaxed mb-4 whitespace-pre-wrap">
//                           {post.text}
//                         </p>
//                       )}

//                       {/* Video Render */}
//                       {post.videoUrl && (
//                         <video
//                           src={getImageUrl(post.videoUrl)}
//                           controls
//                           className="w-full rounded-xl mb-4 max-h-[400px] bg-black"
//                         />
//                       )}

//                       {/* Image Render */}
//                       {post.imageUrls && post.imageUrls.length > 0 && (
//                         <div
//                           className={cn(
//                             "grid gap-2 mb-4",
//                             post.imageUrls.length > 1
//                               ? "grid-cols-2"
//                               : "grid-cols-1",
//                           )}
//                         >
//                           {post.imageUrls.map((img, i) => (
//                             <img
//                               key={i}
//                               src={getImageUrl(img)}
//                               alt="Post media"
//                               className="rounded-xl w-full h-auto max-h-[400px] object-cover"
//                             />
//                           ))}
//                         </div>
//                       )}

//                       <Separator className="mb-3" />

//                       <div className="flex gap-4">
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           onClick={() => {
//                             if (!sessionUser)
//                               return toast({
//                                 title: "Войдите в систему",
//                                 variant: "destructive",
//                               });
//                             likeMutation.mutate({ postId: post.id });
//                           }}
//                           className={cn(
//                             "font-medium rounded-lg transition-colors",
//                             post.isLikedByMe
//                               ? "text-red-500 hover:text-red-600 hover:bg-red-50"
//                               : "text-muted-foreground hover:bg-muted",
//                           )}
//                         >
//                           <Heart
//                             className={cn(
//                               "w-5 h-5 mr-1.5",
//                               post.isLikedByMe && "fill-red-500",
//                             )}
//                           />{" "}
//                           {post.likesCount}
//                         </Button>
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           onClick={() =>
//                             setActiveCommentPostId(
//                               activeCommentPostId === post.id ? null : post.id,
//                             )
//                           }
//                           className="text-muted-foreground font-medium rounded-lg"
//                         >
//                           <MessageCircle className="w-5 h-5 mr-1.5" />{" "}
//                           {post.commentsCount}
//                         </Button>
//                       </div>

//                       {/* Comments Section */}
//                       {activeCommentPostId === post.id && (
//                         <div className="mt-4 pt-4 border-t animate-in fade-in slide-in-from-top-2">
//                           <div className="space-y-4 mb-4 max-h-60 overflow-y-auto custom-scrollbar">
//                             {post.comments?.map((comment) => (
//                               <div key={comment.id} className="flex gap-3">
//                                 <Avatar className="w-8 h-8 shrink-0">
//                                   <AvatarImage
//                                     src={getImageUrl(comment.user.image)}
//                                   />
//                                   <AvatarFallback>
//                                     {comment.user.name.charAt(0)}
//                                   </AvatarFallback>
//                                 </Avatar>
//                                 <div className="bg-muted/40 p-3 rounded-2xl rounded-tl-none">
//                                   <p className="font-bold text-sm mb-0.5">
//                                     {comment.user.name}
//                                   </p>
//                                   <p className="text-sm text-foreground/90">
//                                     {comment.text}
//                                   </p>
//                                 </div>
//                               </div>
//                             ))}
//                             {(!post.comments || post.comments.length === 0) && (
//                               <p className="text-sm text-muted-foreground text-center py-2">
//                                 Нет комментариев. Будьте первыми!
//                               </p>
//                             )}
//                           </div>

//                           <div className="flex gap-2">
//                             <Input
//                               placeholder="Написать комментарий..."
//                               className="rounded-xl bg-muted/20"
//                               value={commentText}
//                               onChange={(e) => setCommentText(e.target.value)}
//                               onKeyDown={(e) => {
//                                 if (e.key === "Enter")
//                                   handleCommentSubmit(post.id);
//                               }}
//                             />
//                             <Button
//                               size="icon"
//                               onClick={() => handleCommentSubmit(post.id)}
//                               className="rounded-xl shrink-0"
//                               disabled={
//                                 !commentText.trim() || commentMutation.isPending
//                               }
//                             >
//                               <Send className="w-4 h-4" />
//                             </Button>
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                   ))
//                 ) : (
//                   <div className="bg-white rounded-2xl p-10 text-center text-muted-foreground border border-border/40">
//                     <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
//                     <p>На стене пока нет записей.</p>
//                   </div>
//                 )}
//               </TabsContent>

//               {/* === DYNAMIC PORTFOLIO === */}
//               <TabsContent
//                 value="portfolio"
//                 className="space-y-6 focus-visible:outline-none"
//               >
//                 <div className="bg-white p-2 rounded-2xl shadow-sm border border-border/40 flex gap-2 overflow-x-auto no-scrollbar">
//                   <Button
//                     variant={portfolioFilter === "all" ? "default" : "ghost"}
//                     onClick={() => setPortfolioFilter("all")}
//                     className="rounded-xl h-9 text-sm font-semibold shrink-0"
//                   >
//                     <LayoutGrid className="w-4 h-4 mr-2" /> Все материалы
//                   </Button>
//                   <Button
//                     variant={portfolioFilter === "photo" ? "default" : "ghost"}
//                     onClick={() => setPortfolioFilter("photo")}
//                     className="rounded-xl h-9 text-sm font-semibold shrink-0"
//                   >
//                     <ImageIcon className="w-4 h-4 mr-2" />{" "}
//                     {isChef ? "Блюда и Меню" : "Фотогалерея"}
//                   </Button>
//                   {isAudioHeavy && (
//                     <Button
//                       variant={
//                         portfolioFilter === "audio" ? "default" : "ghost"
//                       }
//                       onClick={() => setPortfolioFilter("audio")}
//                       className="rounded-xl h-9 text-sm font-semibold shrink-0"
//                     >
//                       <Music className="w-4 h-4 mr-2" /> Аудио / Миксы
//                     </Button>
//                   )}
//                   <Button
//                     variant={portfolioFilter === "docs" ? "default" : "ghost"}
//                     onClick={() => setPortfolioFilter("docs")}
//                     className="rounded-xl h-9 text-sm font-semibold shrink-0"
//                   >
//                     <Award className="w-4 h-4 mr-2" /> Награды / Документы
//                   </Button>
//                 </div>

//                 {/* 1. AUDIO SECTION */}
//                 {(portfolioFilter === "all" || portfolioFilter === "audio") &&
//                   isAudioHeavy && (
//                     <div className="bg-white rounded-2xl p-6 shadow-sm border border-border/40 animate-in fade-in slide-in-from-bottom-4">
//                       <div className="flex items-center justify-between mb-6">
//                         <div className="flex items-center gap-2">
//                           <div className="p-2 bg-primary/10 rounded-lg text-primary">
//                             <Music className="w-5 h-5" />
//                           </div>
//                           <h2 className="text-xl font-bold">Аудио и Демо</h2>
//                         </div>
//                         {isOwnProfile && (
//                           <Button
//                             variant="outline"
//                             size="sm"
//                             onClick={() => setIsAudioDialogOpen(true)}
//                             className="rounded-xl h-9 font-semibold text-primary border-primary/30 hover:bg-primary/5"
//                           >
//                             <PlusCircle className="w-4 h-4 mr-2" /> Загрузить
//                             трек
//                           </Button>
//                         )}
//                       </div>
//                       <AudioManager
//                         tracks={(profile as any).audioTracks || []}
//                         isOwnProfile={isOwnProfile}
//                         onAddClick={() => setIsAudioDialogOpen(true)}
//                         onDelete={(trackId) =>
//                           removeAudioMutation.mutate({
//                             performerId: profile.id,
//                             trackId,
//                           })
//                         }
//                         getImageUrl={getImageUrl}
//                       />
//                     </div>
//                   )}

//                 {/* 2. PHOTO GALLERY SECTION */}
//                 {(portfolioFilter === "all" || portfolioFilter === "photo") && (
//                   <div className="bg-white rounded-2xl p-6 shadow-sm border border-border/40 animate-in fade-in slide-in-from-bottom-4">
//                     <div className="flex items-center justify-between mb-6">
//                       <div className="flex items-center gap-2">
//                         <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
//                           <ImageIcon className="w-5 h-5" />
//                         </div>
//                         <h2 className="text-xl font-bold">
//                           {isChef
//                             ? "Подача и Блюда"
//                             : isVisualHeavy
//                               ? "Шоу и Выступления"
//                               : "Фотогалерея"}
//                         </h2>
//                       </div>
//                       {isOwnProfile && (
//                         <Button
//                           variant="outline"
//                           size="sm"
//                           onClick={() => setIsGalleryDialogOpen(true)}
//                           className="rounded-xl h-9 font-semibold text-blue-600 border-blue-200 hover:bg-blue-50"
//                         >
//                           <PlusCircle className="w-4 h-4 mr-2" /> Добавить фото
//                         </Button>
//                       )}
//                     </div>
//                     <GalleryManager
//                       gallery={profile.gallery || []}
//                       isOwnProfile={isOwnProfile}
//                       onAddOrEdit={() => setIsGalleryDialogOpen(true)}
//                       onDelete={(id) =>
//                         removeGalleryItemMutation.mutate({
//                           performerId: profile.id,
//                           itemId: id,
//                         })
//                       }
//                     />
//                   </div>
//                 )}

//                 {/* 3. DOCUMENTS & CERTIFICATES SECTION */}
//                 {(portfolioFilter === "all" || portfolioFilter === "docs") && (
//                   <div className="bg-white rounded-2xl p-6 shadow-sm border border-border/40 animate-in fade-in slide-in-from-bottom-4">
//                     <div className="flex items-center justify-between mb-6">
//                       <div className="flex items-center gap-2">
//                         <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
//                           <Award className="w-5 h-5" />
//                         </div>
//                         <h2 className="text-xl font-bold">
//                           {isChef
//                             ? "Санкнижки и Дипломы"
//                             : "Сертификаты и Награды"}
//                         </h2>
//                       </div>
//                       {isOwnProfile && (
//                         <Button
//                           variant="outline"
//                           size="sm"
//                           onClick={() => setIsCertificateDialogOpen(true)}
//                           className="rounded-xl h-9 font-semibold text-amber-600 border-amber-200 hover:bg-amber-50"
//                         >
//                           <PlusCircle className="w-4 h-4 mr-2" /> Загрузить
//                           документ
//                         </Button>
//                       )}
//                     </div>

//                     {profile.certificates && profile.certificates.length > 0 ? (
//                       <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
//                         {profile.certificates.map((cert) => (
//                           <div
//                             key={cert.id}
//                             className="relative group rounded-xl overflow-hidden border border-border/50 bg-muted/20 aspect-[3/4]"
//                           >
//                             <img
//                               src={getImageUrl(cert.fileUrl)}
//                               alt={cert.description || "Документ"}
//                               className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
//                             />
//                             <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
//                               <p className="text-white text-xs font-medium line-clamp-2">
//                                 {cert.description}
//                               </p>
//                               {isOwnProfile && (
//                                 <Button
//                                   variant="destructive"
//                                   size="sm"
//                                   className="w-full mt-2 h-7 text-xs"
//                                   onClick={() =>
//                                     removeCertificateMutation.mutate({
//                                       performerId: profile.id,
//                                       itemId: cert.id,
//                                     })
//                                   }
//                                 >
//                                   Удалить
//                                 </Button>
//                               )}
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                     ) : (
//                       <div className="p-8 border-2 border-dashed border-border/60 rounded-xl text-center text-muted-foreground bg-muted/10">
//                         <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" />
//                         <p className="font-medium text-sm">
//                           Документы пока не загружены.
//                         </p>
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </TabsContent>

//               {/* === REVIEWS === */}
//               <TabsContent
//                 value="reviews"
//                 className="focus-visible:outline-none"
//               >
//                 <div className="bg-white rounded-2xl p-6 shadow-sm border border-border/40">
//                   <ReviewsSection
//                     profileId={profile.id}
//                     currentUserRole={sessionUser?.role as string | null}
//                     currentUserId={sessionUser?.id || null}
//                     currentUserName={sessionUser?.name || null}
//                     onReviewSubmit={() => refetchProfile()}
//                   />
//                 </div>
//               </TabsContent>

//               {/* === SUBSCRIPTION (OWNER ONLY) === */}
//               {isOwnProfile && (
//                 <TabsContent
//                   value="subscription"
//                   className="focus-visible:outline-none"
//                 >
//                   <SubscriptionStatusCard />
//                 </TabsContent>
//               )}

//               {/* === FINANCE & BANKING (OWNER ONLY) === */}
//               {isOwnProfile && (
//                 <TabsContent
//                   value="finance"
//                   className="space-y-6 focus-visible:outline-none"
//                 >
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     {/* Platform Wallet */}
//                     <div className="bg-gradient-to-br from-orange-600 to-orange-500 rounded-2xl p-6 shadow-md text-white relative overflow-hidden">
//                       <Wallet className="absolute right-[-20px] bottom-[-20px] w-40 h-40 opacity-10 pointer-events-none" />
//                       <p className="text-white font-medium mb-2 relative z-10">
//                         Баланс кошелька Eventomir
//                       </p>
//                       <h3 className="text-4xl font-black mb-6 relative z-10">
//                         {walletBalance.toLocaleString("ru-RU")}{" "}
//                         <span className="text-2xl text-white">₽</span>
//                       </h3>
//                       <Button
//                         onClick={() => setIsTopUpModalOpen(true)}
//                         className="w-full bg-white text-black hover:bg-gray-200 font-bold rounded-xl h-12 relative z-10 transition-colors"
//                       >
//                         Пополнить баланс
//                       </Button>
//                     </div>

//                     {/* Bank Requisites */}
//                     <div className="bg-white rounded-2xl p-6 shadow-sm border border-border/40 flex flex-col h-full">
//                       <div className="flex items-center gap-2 mb-4">
//                         <Banknote className="w-5 h-5 text-green-600" />
//                         <h3 className="font-bold text-lg">
//                           Платежные реквизиты
//                         </h3>
//                       </div>
//                       <p className="text-sm text-muted-foreground mb-4">
//                         Укажите реквизиты для получения выплат за заказы. Мы
//                         поддерживаем переводы на карты РФ и счета ИП/ООО.
//                       </p>

//                       <div className="space-y-4 mt-auto">
//                         {profile.bankDetails &&
//                         profile.bankDetails.length > 0 ? (
//                           profile.bankDetails.map((bank, idx) => (
//                             <div
//                               key={idx}
//                               className="p-3 border rounded-xl flex items-center justify-between"
//                             >
//                               <div className="flex items-center gap-3">
//                                 <div className="w-10 h-6 bg-blue-100 rounded flex items-center justify-center text-[10px] font-bold text-blue-800">
//                                   {bank.cardType || "CARD"}
//                                 </div>
//                                 <div>
//                                   <p className="text-sm font-bold">
//                                     ••••{" "}
//                                     {bank.accountNumber?.slice(-4) || "****"}
//                                   </p>
//                                   <p className="text-xs text-muted-foreground">
//                                     {bank.bankName}
//                                   </p>
//                                 </div>
//                               </div>
//                               {bank.isDefault && (
//                                 <Badge
//                                   variant="outline"
//                                   className="bg-green-50 text-green-600 border-green-200"
//                                 >
//                                   Основная
//                                 </Badge>
//                               )}
//                             </div>
//                           ))
//                         ) : (
//                           <div className="p-3 border border-dashed rounded-xl text-center text-sm text-muted-foreground bg-muted/20">
//                             Реквизиты пока не добавлены
//                           </div>
//                         )}

//                         <Button
//                           variant="outline"
//                           onClick={() => router.push("/settings")}
//                           className="w-full border-dashed rounded-xl h-12 font-bold text-muted-foreground hover:text-foreground"
//                         >
//                           <PlusCircle className="w-4 h-4 mr-2" /> Добавить карту
//                           или счет
//                         </Button>
//                       </div>
//                     </div>
//                   </div>
//                 </TabsContent>
//               )}
//             </div>
//           </Tabs>
//         </div>

//         {/* --- RIGHT COLUMN (SIDEBAR) --- */}
//         <div className="w-full md:w-[320px] shrink-0 space-y-6">
//           {/* About / Info Widget */}
//           <div className="bg-white rounded-2xl p-5 shadow-sm border border-border/40">
//             <h3 className="font-bold text-[15px] mb-4 flex items-center gap-2">
//               <User className="w-4 h-4 text-primary" /> Подробная информация
//             </h3>

//             <div className="space-y-4">
//               <div className="text-sm">
//                 <div className="flex items-center justify-between mb-1.5">
//                   <span className="text-muted-foreground block text-[13px]">
//                     Услуги:
//                   </span>
//                   {isOwnProfile && (
//                     <button
//                       onClick={() => setIsCategoryDialogOpen(true)}
//                       className="text-primary hover:underline text-xs font-semibold flex items-center"
//                     >
//                       <Edit3 className="w-3 h-3 mr-1" /> Изменить
//                     </button>
//                   )}
//                 </div>
//                 <div className="flex flex-wrap gap-1.5">
//                   {profile.roles?.map((r) => (
//                     <Badge
//                       key={r}
//                       variant="secondary"
//                       className="bg-primary/20  border-primary hover:bg-muted/80 text-foreground font-medium rounded-md"
//                     >
//                       {r}
//                     </Badge>
//                   ))}
//                   {(!profile.roles || profile.roles.length === 0) && (
//                     <span className="text-xs text-muted-foreground italic">
//                       Не указано
//                     </span>
//                   )}
//                 </div>
//               </div>

//               {profile.priceRange && profile.priceRange.length > 0 && (
//                 <>
//                   <Separator />
//                   <div className="text-sm">
//                     <span className="text-muted-foreground block text-[13px] mb-1">
//                       Прайс:
//                     </span>
//                     <span className="font-semibold text-primary text-base">
//                       от {profile.priceRange[0].toLocaleString("ru-RU")} ₽
//                     </span>
//                   </div>
//                 </>
//               )}

//               <Separator />
//               <div className="text-sm">
//                 <span className="text-muted-foreground block text-[13px] mb-1">
//                   О себе:
//                 </span>
//                 <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
//                   {profile.description || "Информация пока не заполнена."}
//                 </p>
//               </div>
//             </div>

//             {isOwnProfile && (
//               <Button
//                 variant="outline"
//                 className="w-full mt-5 rounded-xl text-sm font-semibold h-10"
//                 onClick={() => router.push("/settings")}
//               >
//                 Редактировать инфо
//               </Button>
//             )}
//           </div>

//           {/* Social Links Widget */}
//           <div className="bg-white rounded-2xl p-5 shadow-sm border border-border/40">
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="font-bold text-[15px] flex items-center gap-2">
//                 <LinkIcon className="w-4 h-4 text-primary" /> Контакты и сети
//               </h3>
//               {isOwnProfile && (
//                 <Button
//                   variant="ghost"
//                   size="icon"
//                   className="w-8 h-8 rounded-full"
//                   onClick={() => router.push("/settings")}
//                 >
//                   <Edit3 className="w-4 h-4" />
//                 </Button>
//               )}
//             </div>

//             <div className="space-y-3">
//               {profile.socialLinks?.vk && (
//                 <a
//                   href={profile.socialLinks.vk}
//                   target="_blank"
//                   rel="noreferrer"
//                   className="flex items-center gap-3 px-2 py-1 rounded-xl hover:bg-muted/50 transition-colors group border border-transparent hover:border-border"
//                 >
//                   <div className="w-8 h-8 rounded-lg bg-[#0077FF]/10 text-[#0077FF] flex items-center justify-center">
//                     <span className="font-bold text-xs">VK</span>
//                   </div>
//                   <div className="flex-1 min-w-0">
//                     <p className="text-sm font-semibold text-foreground group-hover:text-[#0077FF] transition-colors">
//                       ВКонтакте
//                     </p>
//                     <p className="text-primary text-xs font-medium ">
//                       {profile.socialLinks.vk}
//                     </p>
//                   </div>
//                 </a>
//               )}

//               {profile.socialLinks?.telegram && (
//                 <a
//                   href={profile.socialLinks.telegram}
//                   target="_blank"
//                   rel="noreferrer"
//                   className="flex items-center gap-3 px-2 py-1 rounded-xl hover:bg-muted/50 transition-colors group border border-transparent hover:border-border"
//                 >
//                   <div className="w-8 h-8 rounded-lg bg-[#24A1DE]/10 text-[#24A1DE] flex items-center justify-center">
//                     <SendIcon className="w-4 h-4" />
//                   </div>
//                   <div className="flex-1 min-w-0">
//                     <p className="text-sm font-semibold text-foreground group-hover:text-[#24A1DE] transition-colors">
//                       Telegram
//                     </p>
//                     <p className="text-primary text-xs font-medium ">
//                       {profile.socialLinks.telegram}
//                     </p>
//                   </div>
//                 </a>
//               )}

//               {profile.socialLinks?.youtube && (
//                 <a
//                   href={profile.socialLinks.youtube}
//                   target="_blank"
//                   rel="noreferrer"
//                   className="flex items-center gap-3 px-2 py-1 rounded-xl hover:bg-muted/50 transition-colors group border border-transparent hover:border-border"
//                 >
//                   <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center">
//                     <Youtube className="w-4 h-4" />
//                   </div>
//                   <div className="flex-1 min-w-0">
//                     <p className="text-sm font-semibold text-foreground group-hover:text-red-500 transition-colors">
//                       YouTube
//                     </p>
//                     <p className="text-primary text-xs font-medium ">
//                       {profile.socialLinks.youtube}
//                     </p>
//                   </div>
//                 </a>
//               )}

//               {profile.socialLinks?.website && (
//                 <a
//                   href={profile.socialLinks.website}
//                   target="_blank"
//                   rel="noreferrer"
//                   className="flex items-center gap-3 px-2 py-1 rounded-xl hover:bg-muted/50 transition-colors group border border-transparent hover:border-border"
//                 >
//                   <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center">
//                     <Globe className="w-4 h-4" />
//                   </div>
//                   <div className="flex-1 min-w-0">
//                     <p className="text-sm font-semibold text-foreground group-hover:text-red-500 transition-colors">
//                       Веб-сайт
//                     </p>
//                     <p className="text-primary text-xs font-medium ">
//                       {profile.socialLinks.website}
//                     </p>
//                   </div>
//                 </a>
//               )}

//               {(!profile.socialLinks ||
//                 Object.keys(profile.socialLinks).length === 0) && (
//                 <p className="text-sm text-muted-foreground text-center py-2">
//                   Ссылки не указаны.
//                 </p>
//               )}
//             </div>
//           </div>

//           {/* Calendar Widget */}
//           <div className="bg-white rounded-2xl p-5 shadow-sm border border-border/40 overflow-hidden">
//             <h3 className="font-bold text-[15px] mb-4 flex items-center gap-2">
//               <CalendarIcon className="w-4 h-4 text-primary" /> График занятости
//             </h3>
//             <div className="scale-90 origin-top-left w-[110%] pointer-events-none">
//               <CalendarSection profile={profile} />
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* --- MODALS --- */}
//       {isOwnProfile && (
//         <>
//           <AudioUploadDialog
//             isOpen={isAudioDialogOpen}
//             onClose={() => setIsAudioDialogOpen(false)}
//             title="Загрузить аудио трек"
//             description="Файл формата MP3 или WAV"
//             accept="audio/mpeg, audio/wav"
//             onFileUpload={async (file, title) => {
//               if (!profile) return false;
//               try {
//                 await addAudioMutation.mutateAsync({
//                   performerId: profile.id,
//                   file,
//                   title,
//                 });
//                 toast({ variant: "default", title: "Трек успешно загружен" });
//                 return true;
//               } catch {
//                 return false;
//               }
//             }}
//           />
//           <FileUploadDialog
//             isOpen={isGalleryDialogOpen}
//             onClose={() => setIsGalleryDialogOpen(false)}
//             title="Добавить в портфолио"
//             description="Загрузите качественное фото или афишу"
//             onFileUpload={async (file, desc) => {
//               if (!profile) return false;
//               try {
//                 await addGalleryItemMutation.mutateAsync({
//                   performerId: profile.id,
//                   file,
//                   title: "Портфолио",
//                   description: desc,
//                 });
//                 toast({ variant: "default", title: "Фото загружено" });
//                 return true;
//               } catch {
//                 return false;
//               }
//             }}
//           />
//           <FileUploadDialog
//             isOpen={isCertificateDialogOpen}
//             onClose={() => setIsCertificateDialogOpen(false)}
//             title="Загрузить документ"
//             description="Скан диплома, сертификата или награды (JPG/PNG/PDF)"
//             onFileUpload={async (file, desc) => {
//               if (!profile) return false;
//               try {
//                 await addCertificateMutation.mutateAsync({
//                   performerId: profile.id,
//                   file,
//                   description: desc,
//                 });
//                 toast({ variant: "default", title: "Документ добавлен" });
//                 return true;
//               } catch {
//                 return false;
//               }
//             }}
//           />

//           {/* 🚨 CATEGORY SELECTION MODAL */}
//           <Dialog
//             open={isCategoryDialogOpen}
//             onOpenChange={setIsCategoryDialogOpen}
//           >
//             <DialogContent className="sm:max-w-xl rounded-3xl p-6">
//               <DialogHeader>
//                 <DialogTitle className="text-xl font-bold">
//                   Специализации
//                 </DialogTitle>
//                 <DialogDescription>
//                   Выберите одну основную категорию и уточните услуги
//                   (подкатегории).
//                 </DialogDescription>
//               </DialogHeader>

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
//                 {adminCategories.length > 0 ? (
//                   adminCategories.map((category) => {
//                     const isCategorySelected = tempSelectedRoles.includes(
//                       category.name,
//                     );
//                     const isAnotherMainSelected = tempSelectedRoles.some(
//                       (role) =>
//                         adminCategories.some(
//                           (c) => c.name === role && c.name !== category.name,
//                         ),
//                     );

//                     return (
//                       <div
//                         key={category.id}
//                         className={`flex flex-col border rounded-2xl p-4 transition-all duration-300 ${
//                           isCategorySelected
//                             ? "bg-primary/5 border-primary/40 shadow-sm ring-1 ring-primary/20"
//                             : isAnotherMainSelected
//                               ? "opacity-50 grayscale-[0.5] hover:opacity-100 hover:grayscale-0 border-border/50"
//                               : "hover:bg-muted/50 border-border/50"
//                         }`}
//                       >
//                         <div
//                           className="flex items-start space-x-3 cursor-pointer group"
//                           onClick={() =>
//                             handleCategoryToggle(category, !isCategorySelected)
//                           }
//                         >
//                           <div
//                             className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
//                               isCategorySelected
//                                 ? "border-primary bg-primary"
//                                 : "border-primary/50 group-hover:border-primary"
//                             }`}
//                           >
//                             {isCategorySelected && (
//                               <div className="w-2 h-2 bg-white rounded-full" />
//                             )}
//                           </div>

//                           <Label className="text-[15px] font-bold leading-tight cursor-pointer w-full flex justify-between items-center pointer-events-none">
//                             {category.name}
//                             {category.subCategories &&
//                               category.subCategories.length > 0 &&
//                               (isCategorySelected ? (
//                                 <ChevronDown className="h-4 w-4 text-primary" />
//                               ) : (
//                                 <ChevronRight className="h-4 w-4 text-muted-foreground" />
//                               ))}
//                           </Label>
//                         </div>

//                         {/* Subcategories (Only visible if Main Category is selected) */}
//                         {isCategorySelected &&
//                           category.subCategories &&
//                           category.subCategories.length > 0 && (
//                             <div className="ml-8 flex flex-col space-y-3 mt-4 pt-3 border-t border-dashed border-primary/20 animate-in slide-in-from-top-2 fade-in duration-200">
//                               {category.subCategories.map((sub: any) => (
//                                 <div
//                                   key={sub.id}
//                                   className="flex items-center space-x-3"
//                                 >
//                                   <Checkbox
//                                     id={`sub-${sub.id}`}
//                                     checked={tempSelectedRoles.includes(
//                                       sub.name,
//                                     )}
//                                     onCheckedChange={() =>
//                                       toggleTempRole(sub.name)
//                                     }
//                                     className="rounded-sm border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
//                                   />
//                                   <Label
//                                     htmlFor={`sub-${sub.id}`}
//                                     className="text-sm font-medium leading-none cursor-pointer text-foreground/80 hover:text-foreground transition-colors"
//                                   >
//                                     {sub.name}
//                                   </Label>
//                                 </div>
//                               ))}
//                             </div>
//                           )}
//                       </div>
//                     );
//                   })
//                 ) : (
//                   <div className="col-span-full text-center py-8 text-muted-foreground font-medium">
//                     <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />{" "}
//                     Загрузка категорий...
//                   </div>
//                 )}
//               </div>

//               <DialogFooter className="mt-2 gap-2 sm:gap-0">
//                 <DialogClose asChild>
//                   <Button
//                     variant="outline"
//                     className="rounded-xl h-11 w-full sm:w-auto"
//                   >
//                     Отмена
//                   </Button>
//                 </DialogClose>
//                 <Button
//                   onClick={handleSaveCategories}
//                   disabled={
//                     isSavingCategories || tempSelectedRoles.length === 0
//                   }
//                   className="rounded-xl h-11 font-bold w-full sm:w-auto"
//                 >
//                   {isSavingCategories && (
//                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                   )}{" "}
//                   Сохранить
//                 </Button>
//               </DialogFooter>
//             </DialogContent>
//           </Dialog>
//         </>
//       )}

//       {/* TOP UP MODAL DIALOG */}
//       <Dialog open={isTopUpModalOpen} onOpenChange={setIsTopUpModalOpen}>
//         <DialogContent className="sm:max-w-md rounded-[2rem] p-0 overflow-hidden border-0 shadow-2xl text-white">
//           <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white">
//             <DialogHeader>
//               <DialogTitle className="text-2xl font-bold flex items-center gap-2">
//                 <Wallet className="w-6 h-6 text-emerald-400" />
//                 Пополнение кошелька
//               </DialogTitle>
//               <DialogDescription className="text-slate-300 mt-2">
//                 Текущий баланс:{" "}
//                 <strong className="text-white">
//                   {walletBalance.toLocaleString("ru-RU")} ₽
//                 </strong>
//               </DialogDescription>
//             </DialogHeader>
//           </div>

//           <div className="p-8 space-y-6 bg-background text-slate-600">
//             <div className="space-y-3">
//               <Label className="font-bold text-muted-foreground">
//                 Выберите сумму или введите свою
//               </Label>
//               <div className="grid grid-cols-2 gap-2">
//                 {PRESET_AMOUNTS.map((amt) => (
//                   <Button
//                     key={amt}
//                     type="button"
//                     variant={
//                       topUpAmount === amt.toString() ? "default" : "outline"
//                     }
//                     className={cn(
//                       "rounded-xl h-12 font-bold transition-all",
//                       topUpAmount === amt.toString()
//                         ? "shadow-md"
//                         : "bg-muted/30 border-transparent hover:border-border",
//                     )}
//                     onClick={() => setTopUpAmount(amt.toString())}
//                   >
//                     {amt.toLocaleString("ru-RU")} ₽
//                   </Button>
//                 ))}
//               </div>
//             </div>

//             <div className="relative">
//               <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
//                 ₽
//               </span>
//               <Input
//                 type="number"
//                 value={topUpAmount}
//                 onChange={(e) => setTopUpAmount(e.target.value)}
//                 className="pl-9 h-14 text-lg font-bold rounded-xl bg-muted/30 focus-visible:ring-primary border-border/60"
//                 placeholder="Сумма пополнения"
//               />
//             </div>

//             <Button
//               className="w-full h-14 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
//               onClick={handleTopUp}
//               disabled={
//                 isProcessingTopUp || !topUpAmount || parseInt(topUpAmount) < 100
//               }
//             >
//               {isProcessingTopUp ? (
//                 <>
//                   <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Переход к
//                   оплате...
//                 </>
//               ) : (
//                 `Пополнить картой`
//               )}
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }

"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useChatStore } from "@/store/useChatStore";

import { usePerformerProfile } from "@/services/performer";
import { isFavorite as checkIsFavorite } from "@/services/favorites";
import { useReviews } from "@/services/reviews";

// UI
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Image as ImageIcon } from "lucide-react";
import { cn } from "@/utils/utils";

// Extracted Components
import ProfileHeader from "@/components/performer-profile/ProfileHeader";
import FeedTab from "@/components/performer-profile/tabs/FeedTab";
import PortfolioTab from "@/components/performer-profile/tabs/PortfolioTab";
import FinanceTab from "@/components/performer-profile/tabs/FinanceTab";
import ProfileSidebar from "@/components/performer-profile/ProfileSidebar";
import ReviewsSection from "@/components/performer-profile/ReviewsSection";
import CalendarSection from "@/components/performer-profile/CalendarSection";
import SubscriptionStatusCard from "@/components/profile/SubscriptionStatusCard";
import AgencyDashboard from "@/components/performer-profile/AgencyDashboard";
import { useToast } from "@/hooks/use-toast";

export default function PerformerProfileClient() {
  const searchParams = useSearchParams();
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const urlProfileId = searchParams.get("id");
  const sessionUser = session?.user;
  const targetProfileId =
    urlProfileId ||
    (sessionUser?.role === "performer" ? sessionUser?.id : null);
  const isOwnProfile = !!(
    sessionUser?.id && targetProfileId === sessionUser.id
  );

  const {
    data: profile,
    isLoading,
    isError,
    refetch,
  } = usePerformerProfile(targetProfileId || null);

  const isOnlineInStore = useChatStore((state) => {
    if (!targetProfileId) return false;

    return !!state.onlineUsers[targetProfileId];
  });

  const isPerformerOnline = isOwnProfile || isOnlineInStore;

  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (profile && sessionUser?.role === "customer") {
      checkIsFavorite(sessionUser.id, profile.id).then(setIsFavorite);
    }
  }, [profile, sessionUser]);

  const requireAuth = (actionCallback: () => void) => {
    if (authStatus === "unauthenticated" || !sessionUser) {
      toast({ title: "Требуется авторизация", variant: "destructive" });
      router.push("/login");
      return;
    }
    actionCallback();
  };

  if (isLoading || authStatus === "loading")
    return (
      <div className="p-20 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto" />
      </div>
    );
  if (isError || !profile)
    return (
      <div className="text-center py-20 font-bold text-2xl">
        Профиль не найден
      </div>
    );
  if (isOwnProfile && profile.accountType === "agency" && !urlProfileId)
    return <AgencyDashboard profile={profile} />;

  return (
    <div className="bg-white min-h-screen pb-20 font-sans selection:bg-primary/20">
      {/* HEADER SECTION */}
      <ProfileHeader
        profile={profile}
        isOwnProfile={isOwnProfile}
        isPerformerOnline={isPerformerOnline}
        isFavorite={isFavorite}
        setIsFavorite={setIsFavorite}
        sessionUser={sessionUser}
        requireAuth={requireAuth}
      />

      {/* DASHBOARD LAYOUT */}
      <div
        className={cn(
          "container mx-auto px-4 pt-2 md:pt-6  flex flex-col md:flex-row gap-6 pb-12",
          isOwnProfile ? "max-w-5xl" : "max-w-4xl",
        )}
      >
        {/* MAIN COLUMN */}
        <div className="flex-1 min-w-0">
          <Tabs defaultValue="wall" className="w-full">
            <TabsList className="w-full justify-start h-auto p-1.5 bg-white rounded-3xl  shadow-sm border border-border/60  gap-1 overflow-x-auto flex-nowrap no-scrollbar sticky top-4 z-10 mb-4">
              <TabsTrigger
                value="wall"
                className="rounded-md md:rounded-full px-3 py-2 font-bold data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                Стена
              </TabsTrigger>
              <TabsTrigger
                value="portfolio"
                className="rounded-md md:rounded-full px-3 py-2 font-bold data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                Портфолио
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="rounded-md md:rounded-full px-3 py-2 font-bold data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                Отзывы
              </TabsTrigger>
              {!isOwnProfile && (
                <TabsTrigger
                  value="calendar"
                  className="rounded-md md:rounded-full px-3 py-2 font-bold data-[state=active]:bg-primary data-[state=active]:text-white"
                >
                  Занятость
                </TabsTrigger>
              )}
              {isOwnProfile && (
                <>
                  <TabsTrigger
                    value="subscription"
                    className="rounded-md md:rounded-full px-3 py-2 font-bold data-[state=active]:bg-primary data-[state=active]:text-white"
                  >
                    Подписка
                  </TabsTrigger>
                  <TabsTrigger
                    value="finance"
                    className="rounded-md md:rounded-full px-3 py-2 font-bold data-[state=active]:bg-primary data-[state=active]:text-white"
                  >
                    Финансы
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="wall" className="focus-visible:outline-none">
              <FeedTab
                profile={profile}
                isOwnProfile={isOwnProfile}
                sessionUser={sessionUser}
                requireAuth={requireAuth}
              />
            </TabsContent>
            <TabsContent
              value="portfolio"
              className="focus-visible:outline-none"
            >
              <PortfolioTab profile={profile} isOwnProfile={isOwnProfile} />
            </TabsContent>
            <TabsContent value="reviews" className="focus-visible:outline-none">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-border/40">
                <ReviewsSection
                  profileId={profile.id}
                  currentUserRole={sessionUser?.role as string}
                  currentUserId={sessionUser?.id}
                  currentUserName={sessionUser?.name}
                  onReviewSubmit={() => refetch()}
                />
              </div>
            </TabsContent>

            {!isOwnProfile && (
              <TabsContent
                value="calendar"
                className="focus-visible:outline-none"
              >
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-border/40 pointer-events-none">
                  <CalendarSection
                    profile={profile}
                    isOwnProfile={isOwnProfile}
                  />
                </div>
              </TabsContent>
            )}

            {isOwnProfile && (
              <>
                <TabsContent
                  value="subscription"
                  className="focus-visible:outline-none"
                >
                  <SubscriptionStatusCard />
                </TabsContent>
                <TabsContent
                  value="finance"
                  className="focus-visible:outline-none"
                >
                  <FinanceTab profile={profile} />
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>

        {/* SIDEBAR (OWNER ONLY) */}
        {isOwnProfile && <ProfileSidebar profile={profile} />}
      </div>
    </div>
  );
}
