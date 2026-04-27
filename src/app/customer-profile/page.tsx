"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/utils/api-client";

// --- Global Zustand Store ---
import { useChatStore } from "@/store/useChatStore";

// --- Custom Hooks & Services ---
import {
  useCustomerProfile,
  useUpdateCustomerProfile,
  useCustomerOrders,
  CustomerProfile,
} from "@/services/customer";
import { useCustomerRequestsQuery } from "@/services/requests";

// --- Extracted Modular Components ---
import { ProfileHeader } from "@/components/customer-profile/ProfileHeader";
import { ProfileEditForm } from "@/components/customer-profile/ProfileEditForm";
import { WalletSection } from "@/components/customer-profile/WalletSection";
import { RequestOrder } from "@/components/customer-profile/RequestOrder";

// --- Extended Profile Type ---
interface ExtendedCustomerProfile extends CustomerProfile {
  backgroundPicture?: string;
  address?: string;

  moderationStatus?: "APPROVED" | "PENDING" | "REJECTED";
}

export default function CustomerProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // --- Data Fetching ---
  const {
    data: profile,
    isLoading: isProfileLoading,
    refetch: refetchProfile,
  } = useCustomerProfile();
  const { data: orderHistory = [], isLoading: isHistoryLoading } =
    useCustomerOrders();
  const { data: paidRequests = [], isLoading: isRequestsLoading } =
    useCustomerRequestsQuery(session?.user?.id);

  const updateProfileMutation = useUpdateCustomerProfile();

  // --- UI & Form State ---
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<ExtendedCustomerProfile>>(
    {},
  );
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(
    null,
  );
  const [backgroundPictureFile, setBackgroundPictureFile] =
    useState<File | null>(null);

  // --- Wallet State ---
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<string>("1000");
  const [isToppingUp, setIsToppingUp] = useState(false);

  // =========================================================================
  // Ensure the logged-in customer is added to onlineUsers
  // =========================================================================

  const onlineUsersRecord = useChatStore((state) => state.onlineUsers);

  // Convert the Record to a Set so child components like RequestOrder don't break
  const onlineUsers = new Set(Object.keys(onlineUsersRecord));

  // Check the Record directly for O(1) speed
  const isCustomerOnline = profile ? !!onlineUsersRecord[profile.id] : false;
  useEffect(() => {
    if (session?.user?.id) {
      useChatStore.setState((state) => {
        // Check if the user is already marked true in the object
        if (state.onlineUsers[session.user.id]) return state;

        // Spread the existing object and append the new user ID
        return {
          onlineUsers: {
            ...state.onlineUsers,
            [session.user.id]: true,
          },
        };
      });
    }
  }, [session?.user?.id]);

  // --- Effects ---
  useEffect(() => {
    if (profile) setFormData(profile);
  }, [profile]);

  useEffect(() => {
    const topupStatus = searchParams.get("topup");
    const paymentStatus = searchParams.get("payment");

    if (topupStatus === "success") {
      toast({
        title: "Обработка платежа...",
        description: "Ожидаем подтверждение от банка.",
      });
      let attempts = 0;
      const pollInterval = setInterval(() => {
        attempts++;
        refetchProfile();
        if (attempts >= 4) {
          clearInterval(pollInterval);
          toast({
            title: "Баланс обновлен!",
            description: "Средства успешно зачислены.",
            variant: "default",
          });
        }
      }, 1500);
      router.replace("/customer-profile", { scroll: false });
      return () => clearInterval(pollInterval);
    }

    if (topupStatus === "failed") {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Платеж был отклонен.",
      });
      router.replace("/customer-profile", { scroll: false });
    }

    if (paymentStatus === "success") {
      toast({
        title: "Успешно!",
        description: "Заявка оплачена и опубликована.",
      });
      router.replace("/customer-profile", { scroll: false });
    }
  }, [searchParams, toast, router, refetchProfile]);

  // =========================================================================
  // 🚨 INSTANT SAVE: Profile Picture
  // =========================================================================
  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 1. Instant local visual update
      const reader = new FileReader();
      reader.onloadend = () =>
        setFormData({ ...formData, profilePicture: reader.result as string });
      reader.readAsDataURL(file);

      // 2. Instant API upload
      toast({ title: "Загрузка фото..." });
      updateProfileMutation.mutate(
        { profilePictureFile: file },
        {
          onSuccess: () =>
            toast({
              variant: "success",
              title: "Фото профиля успешно обновлено!",
            }),
          onError: () =>
            toast({
              variant: "destructive",
              title: "Ошибка при загрузке фото.",
            }),
        },
      );
    }
  };

  // =========================================================================
  // 🚨 INSTANT SAVE: Background Cover Picture
  // =========================================================================
  const handleBackgroundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 1. Instant local visual update
      const reader = new FileReader();
      reader.onloadend = () =>
        setFormData({
          ...formData,
          backgroundPicture: reader.result as string,
        });
      reader.readAsDataURL(file);

      // 2. Instant API upload
      toast({ title: "Загрузка обложки..." });
      updateProfileMutation.mutate(
        { backgroundPictureFile: file },
        {
          onSuccess: () =>
            toast({
              variant: "success",
              title: "Обложка профиля успешно обновлена!",
            }),
          onError: () =>
            toast({
              variant: "destructive",
              title: "Ошибка при загрузке обложки.",
            }),
        },
      );
    }
  };

  const handleTopUpWallet = async () => {
    const amount = Number(topUpAmount);
    if (!amount || amount <= 0)
      return toast({
        variant: "destructive",
        title: "Введите корректную сумму.",
      });
    setIsToppingUp(true);
    try {
      const response = await apiRequest<{ paymentUrl: string }>({
        method: "post",
        url: "/api/wallet/topup/customer",
        data: { amount },
      });
      if (response.paymentUrl) window.location.href = response.paymentUrl;
    } catch {
      toast({ variant: "destructive", title: "Не удалось создать платеж." });
    } finally {
      setIsToppingUp(false);
    }
  };

  const handleOpenChat = (targetUserId: string) => {
    if (targetUserId === session?.user?.id) {
      return toast({
        variant: "destructive",
        title: "Вы не можете написать себе",
      });
    }
    router.push(`/chat/${targetUserId}`);
  };

  // --- Loading State ---
  if (status === "loading" || isProfileLoading) {
    return (
      <div className="container max-w-5xl mx-auto py-10 px-4 space-y-6">
        <Skeleton className="h-64 w-full rounded-[2rem]" />
        <Skeleton className="h-32 w-full rounded-[2rem]" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96 w-full rounded-[2rem]" />
          <Skeleton className="h-96 w-full rounded-[2rem]" />
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-muted/10 pb-20 pt-4 md:pt-8">
      <div className="container max-w-4xl mx-auto px-4 space-y-6 md:space-y-8">
        <ProfileHeader
          profile={profile}
          formData={formData}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          isCustomerOnline={isCustomerOnline}
          handlePictureChange={handlePictureChange}
          handleBackgroundChange={handleBackgroundChange}
          profilePictureFile={profilePictureFile}
          backgroundPictureFile={backgroundPictureFile}
        />

        {/* EDIT FORM (For Text Data Only) */}
        {isEditing && (
          <ProfileEditForm
            initialData={profile}
            onSubmit={(formValues) => {
              // Submit ONLY text fields, as images are now saved instantly
              updateProfileMutation.mutate(formValues, {
                onSuccess: () => {
                  setIsEditing(false);
                  toast({
                    variant: "default",
                    title: "Личные данные успешно сохранены",
                  });
                },
                onError: () =>
                  toast({
                    variant: "destructive",
                    title: "Ошибка сохранения данных",
                  }),
              });
            }}
            isPending={updateProfileMutation.isPending}
            setIsEditing={setIsEditing}
          />
        )}

        <WalletSection
          profile={profile}
          isTopUpOpen={isTopUpOpen}
          setIsTopUpOpen={setIsTopUpOpen}
          topUpAmount={topUpAmount}
          setTopUpAmount={setTopUpAmount}
          handleTopUpWallet={handleTopUpWallet}
          isToppingUp={isToppingUp}
        />

        <RequestOrder
          paidRequests={paidRequests}
          isRequestsLoading={isRequestsLoading}
          orderHistory={orderHistory}
          isHistoryLoading={isHistoryLoading}
          onlineUsers={onlineUsers}
          handleOpenChat={handleOpenChat}
        />
      </div>
    </div>
  );
}
