"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Edit,
  Camera,
  History,
  MapPin,
  Phone,
  KeyRound,
  Send,
  Trash2,
  Wallet,
  PlusCircle,
  MessageCircle,
  Loader2,
  CreditCard,
  X,
} from "lucide-react";

import { format } from "date-fns";
import { ru } from "date-fns/locale";
import Link from "next/link";
import { cn } from "@/utils/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Badge } from "@/components/ui/badge";
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
import { changePassword, deleteUserAccount } from "@/services/auth";

// --- Validation Schemas ---
const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, { message: "Введите текущий пароль." }),
    newPassword: z.string().min(8, {
      message: "Новый пароль должен содержать не менее 8 символов.",
    }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Новые пароли не совпадают.",
    path: ["confirmPassword"],
  });

const TOP_UP_PRESETS = [500, 1000, 2000, 5000];

// --- Main Component ---
const CustomerProfilePage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Use Zustand store for global online status
  const onlineUsers = useChatStore((state) => state.onlineUsers);

  // --- Data Fetching Hooks ---
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
  const isCustomerOnline = profile ? onlineUsers.has(profile.id) : false;

  // --- State Management ---
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<CustomerProfile>>({});
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(
    null,
  );

  // Dialog States
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Wallet States
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<string>("1000");
  const [isToppingUp, setIsToppingUp] = useState(false);

  // --- Effects ---
  useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  // Handle Redirect from Tinkoff & Webhook Race Conditions
  useEffect(() => {
    const topupStatus = searchParams.get("topup");
    const paymentStatus = searchParams.get("payment");

    if (topupStatus === "success") {
      toast({
        title: "Обработка платежа...",
        description: "Ожидаем подтверждение от банка. Пожалуйста, подождите...",
      });

      let attempts = 0;
      const pollInterval = setInterval(() => {
        attempts++;
        refetchProfile();

        if (attempts >= 4) {
          clearInterval(pollInterval);
          toast({
            title: "Баланс обновлен!",
            description: "Средства успешно зачислены на ваш кошелек.",
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
        title: "Ошибка оплаты",
        description: "Платеж был отклонен или отменен банком.",
      });
      router.replace("/customer-profile", { scroll: false });
    }

    if (paymentStatus === "success") {
      toast({
        title: "Успешно!",
        description: "Заявка успешно оплачена и опубликована.",
        variant: "default",
      });
      router.replace("/customer-profile", { scroll: false });
    }
  }, [searchParams, toast, router, refetchProfile]);

  // --- Forms ---
  const changePasswordForm = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8800";

  const getImageUrl = (path: string | undefined | null) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${API_BASE}${path}`;
  };

  // --- Handlers ---
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePictureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, profilePicture: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = () => {
    if (!profile) return;

    updateProfileMutation.mutate(
      {
        ...formData,
        profilePictureFile: profilePictureFile || undefined,
      },
      {
        onSuccess: () => {
          setIsEditing(false);
          setProfilePictureFile(null);
          toast({
            variant: "success",
            title: "Профиль обновлен",
            description: "Ваши данные успешно сохранены.",
          });
        },
        onError: () => {
          toast({
            variant: "destructive",
            title: "Ошибка",
            description: "Не удалось сохранить изменения.",
          });
        },
      },
    );
  };

  const handleChangePasswordSubmit = async (
    values: z.infer<typeof changePasswordSchema>,
  ) => {
    if (!session?.user?.id) return;
    setIsChangingPassword(true);
    try {
      const result = await changePassword(
        session.user.id,
        values.currentPassword,
        values.newPassword,
      );
      if (result.success) {
        toast({
          variant: "success",
          title: "Успех",
          description: result.message,
        });
        setIsChangePasswordOpen(false);
        changePasswordForm.reset();
      } else {
        toast({
          variant: "destructive",
          title: "Ошибка",
          description: result.message,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось сменить пароль.",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!profile) return;
    setIsDeletingAccount(true);
    try {
      const result = await deleteUserAccount(profile.id);
      if (result.success) {
        toast({
          variant: "success",
          title: "Аккаунт удален",
          description: result.message,
        });
        router.push("/");
      } else {
        toast({
          variant: "destructive",
          title: "Ошибка",
          description: result.message,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось удалить аккаунт.",
      });
    } finally {
      setIsDeletingAccount(false);
      setIsDeleteAccountOpen(false);
    }
  };
  // 1. Helper to format the display value as "+7 999 999 99-99"
  const formatPhoneDisplay = (phone: string) => {
    if (!phone) return "";

    // Extract all digits from the backend string (e.g., "+79991234567" -> "79991234567")
    let digits = phone.replace(/\D/g, "");

    // Strip the country code "7" so we only format the actual 10-digit number
    if (digits.startsWith("7")) {
      digits = digits.substring(1);
    }

    // If there are no user digits left, show nothing (allows placeholder to show)
    if (digits.length === 0) return "";

    // Apply the mask
    let formatted = "+7 ";
    if (digits.length > 0) formatted += digits.substring(0, 3);
    if (digits.length > 3) formatted += " " + digits.substring(3, 6);
    if (digits.length > 6) formatted += " " + digits.substring(6, 8);
    if (digits.length > 8) formatted += "-" + digits.substring(8, 10);

    return formatted;
  };

  // 2. Custom change handler that safely ignores the prefix during deletion
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // If the user completely clears the input, or deletes down to just the prefix
    if (inputValue === "" || inputValue.trim() === "+7" || inputValue === "+") {
      setFormData({ ...formData, phone: "" });
      return;
    }

    // Strip the literal "+7 " prefix BEFORE we extract digits,
    // so we don't accidentally count the country code as a user-typed '7'
    let rawInput = inputValue;
    if (rawInput.startsWith("+7 ")) {
      rawInput = rawInput.substring(3);
    } else if (rawInput.startsWith("+7")) {
      rawInput = rawInput.substring(2);
    }

    // Now extract ONLY the digits the user actually typed
    let digits = rawInput.replace(/\D/g, "");

    // Handle paste scenario (if they paste a full 11-digit number starting with 7 or 8)
    if (
      (digits.startsWith("7") || digits.startsWith("8")) &&
      digits.length >= 11
    ) {
      digits = digits.substring(1);
    }

    // Restrict strictly to 10 digits
    digits = digits.substring(0, 10);

    // Save to state with the +7 prefix ONLY if there are actually digits typed
    const backendFormat = digits.length > 0 ? `+7${digits}` : "";
    setFormData({ ...formData, phone: backendFormat });
  };

  const handleTopUpWallet = async () => {
    const amount = Number(topUpAmount);
    if (!amount || amount <= 0) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Введите корректную сумму.",
      });
      return;
    }

    setIsToppingUp(true);
    try {
      const response = await apiRequest<{ paymentUrl: string }>({
        method: "post",
        url: "/api/wallet/topup/customer",
        data: { amount },
      });

      if (response.paymentUrl) {
        toast({ title: "Переход к оплате..." });
        window.location.href = response.paymentUrl;
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось создать платеж. Попробуйте позже.",
      });
    } finally {
      setIsToppingUp(false);
    }
  };

  // Navigates directly to the global chat room route
  const handleOpenChat = (targetUserId: string) => {
    if (!session?.user?.id) return;
    if (targetUserId === session.user.id) {
      toast({
        variant: "destructive",
        title: "Вы не можете написать самому себе",
      });
      return;
    }
    router.push(`/chat/${targetUserId}`);
  };

  // --- Loading State ---
  if (status === "loading" || isProfileLoading) {
    return (
      <div className="flex flex-col p-4 space-y-6 pt-safe">
        <div className="flex flex-col items-center space-y-4">
          <Skeleton className="h-24 w-24 rounded-full" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-32 w-full rounded-3xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (!profile) return null;

  const getInitials = (name: string) =>
    name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
      : "??";

  return (
    <div className="flex flex-col min-h-screen bg-muted/10 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-10 pt-4 md:pt-10">
      <div className="container mx-auto max-w-3xl px-4 space-y-6">
        {/* --- 1. PROFILE HEADER --- */}
        <div className="flex flex-col items-center relative bg-background rounded-3xl p-6 shadow-sm border border-border/50">
          <div className="absolute top-4 right-4 flex gap-2">
            {isEditing ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsEditing(false);
                  setFormData(profile);
                }}
                className="h-8 w-8 rounded-full bg-muted/50 text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(true)}
                className="h-8 w-8 rounded-full bg-muted/50 hover:bg-muted text-foreground transition-colors"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="relative mb-3 mt-2">
            <Avatar className="h-24 w-24 border-4 border-background shadow-md">
              <AvatarImage
                src={
                  profilePictureFile
                    ? formData.profilePicture
                    : getImageUrl(profile.profilePicture)
                }
                alt={formData.name || profile.name}
                className="object-cover"
              />
              <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                {getInitials(formData.name || profile.name)}
              </AvatarFallback>
            </Avatar>

            {!isEditing && (
              <span
                className={cn(
                  "absolute bottom-1 right-1 h-5 w-5 rounded-full border-4 border-background z-20 transition-all duration-300",
                  isCustomerOnline ? "bg-emerald-500" : "bg-gray-300",
                )}
              />
            )}

            {isEditing && (
              <label
                htmlFor="profilePictureInput"
                className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-transform active:scale-95 shadow-md"
              >
                <Camera className="h-4 w-4" />
                <Input
                  id="profilePictureInput"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePictureChange}
                />
              </label>
            )}
          </div>

          {isEditing ? (
            <Input
              name="name"
              value={formData.name || ""}
              onChange={handleFormChange}
              className="text-xl font-bold mt-2 text-center max-w-[260px] rounded-xl h-11 bg-muted/20 border border-border/60 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
              placeholder="Ваше имя"
            />
          ) : (
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
              {profile.name}
            </h1>
          )}
          <p className="text-sm text-muted-foreground mt-1 font-medium">
            {profile.email}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3  mt-4 w-full justify-center">
            <div className="flex items-center gap-2 bg-muted/40 px-3 py-1.5 rounded-full">
              <Phone className="h-4 w-4 text-primary" />
              {isEditing ? (
                <Input
                  name="phone"
                  value={formatPhoneDisplay(formData.phone || "")}
                  onChange={handlePhoneChange}
                  placeholder="+7 999 999 99-99"
                  className="h-10 w-36 text-[13px] rounded-xl bg-muted/20 border border-border/60 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all font-bold"
                  maxLength={18}
                />
              ) : (
                <span className="text-[13px] font-semibold">
                  {formatPhoneDisplay(profile.phone) || "Телефон не указан"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 bg-muted/40 px-3 py-1.5 rounded-full">
              <MapPin className="h-4 w-4 text-primary" />
              {isEditing ? (
                <Input
                  name="city"
                  value={formData.city || ""}
                  onChange={handleFormChange}
                  placeholder="Город"
                  className="h-10 w-28 text-[13px] rounded-xl bg-muted/20 border border-border/60 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all font-bold"
                />
              ) : (
                <span className="text-[13px] font-semibold">
                  {profile.city || "Город не указан"}
                </span>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="w-full flex flex-col gap-3 mt-6 pt-6 border-t border-border/50">
              <Button
                onClick={handleSaveChanges}
                disabled={updateProfileMutation.isPending}
                className="w-full rounded-xl font-bold h-12 shadow-sm"
              >
                {updateProfileMutation.isPending ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  "Сохранить изменения"
                )}
              </Button>

              <div className="flex gap-2">
                <Dialog
                  open={isChangePasswordOpen}
                  onOpenChange={setIsChangePasswordOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl h-11 text-muted-foreground font-semibold"
                    >
                      <KeyRound className="mr-2 h-4 w-4" /> Пароль
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                      <DialogTitle>Смена пароля</DialogTitle>
                      <DialogDescription>
                        Введите текущий и новый пароль.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...changePasswordForm}>
                      <form
                        onSubmit={changePasswordForm.handleSubmit(
                          handleChangePasswordSubmit,
                        )}
                        className="space-y-4 pt-2"
                      >
                        <FormField
                          control={changePasswordForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Текущий пароль</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  {...field}
                                  className="rounded-xl bg-muted/50"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={changePasswordForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Новый пароль</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  {...field}
                                  className="rounded-xl bg-muted/50"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={changePasswordForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Подтвердите пароль</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  {...field}
                                  className="rounded-xl bg-muted/50"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="submit"
                          className="w-full rounded-xl mt-2"
                          disabled={isChangingPassword}
                        >
                          {isChangingPassword ? "Смена..." : "Сменить пароль"}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>

                <Dialog
                  open={isDeleteAccountOpen}
                  onOpenChange={setIsDeleteAccountOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl h-11 text-destructive hover:bg-destructive/10 font-semibold border-destructive/20"
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Удалить
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-2xl">
                    <DialogHeader>
                      <DialogTitle>Удаление аккаунта</DialogTitle>
                      <DialogDescription>
                        Это действие необратимо. Все ваши данные будут стерты.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-4">
                      <Button
                        variant="outline"
                        className="rounded-xl w-full"
                        onClick={() => setIsDeleteAccountOpen(false)}
                      >
                        Отмена
                      </Button>
                      <Button
                        variant="destructive"
                        className="rounded-xl w-full"
                        onClick={handleDeleteAccount}
                        disabled={isDeletingAccount}
                      >
                        {isDeletingAccount ? "Удаление..." : "Удалить навсегда"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          )}
        </div>

        {/* --- 2. DIGITAL WALLET CARD --- */}
        <div className="rounded-3xl bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground shadow-lg relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -left-6 -bottom-6 w-24 h-24 rounded-full bg-black/10 blur-xl pointer-events-none" />
          <Wallet className="absolute right-4 top-1/2 -translate-y-1/2 h-32 w-32 opacity-[0.07] pointer-events-none" />

          <div className="relative z-10 flex flex-col h-full justify-between gap-6">
            <div>
              <p className="text-primary-foreground/80 font-medium text-sm flex items-center gap-2">
                <Wallet className="h-4 w-4" /> Баланс кошелька
              </p>
              <div className="text-4xl font-black mt-1 tracking-tight">
                {profile.walletBalance?.toLocaleString()}{" "}
                <span className="text-2xl font-bold opacity-80">₽</span>
              </div>
            </div>

            <Dialog open={isTopUpOpen} onOpenChange={setIsTopUpOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-background/20 hover:bg-background/30 text-primary-foreground backdrop-blur-md border-0 rounded-2xl h-12 font-bold shadow-none active:scale-[0.98] transition-all">
                  <PlusCircle className="mr-2 h-5 w-5" /> Пополнить
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md rounded-3xl p-6">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">
                    Сумма пополнения
                  </DialogTitle>
                  <DialogDescription>
                    Выберите или введите сумму (₽)
                  </DialogDescription>
                </DialogHeader>

                <div className="py-2 space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    {TOP_UP_PRESETS.map((amount) => (
                      <Button
                        key={amount}
                        type="button"
                        variant={
                          topUpAmount === amount.toString()
                            ? "default"
                            : "outline"
                        }
                        className={cn(
                          "h-14 rounded-2xl font-bold text-lg transition-all",
                          topUpAmount === amount.toString()
                            ? "shadow-md"
                            : "border-border/60 bg-muted/30",
                        )}
                        onClick={() => setTopUpAmount(amount.toString())}
                      >
                        {amount}
                      </Button>
                    ))}
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="Другая сумма"
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(e.target.value)}
                      className="h-14 rounded-2xl text-lg font-bold pl-4 pr-12 bg-muted/30 border-border/60"
                    />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                      ₽
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleTopUpWallet}
                  disabled={isToppingUp}
                  className="w-full h-14 rounded-2xl font-bold text-lg mt-2"
                >
                  {isToppingUp ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <CreditCard className="mr-2 h-5 w-5" />
                  )}
                  Оплатить
                </Button>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* --- 3. PAID REQUESTS --- */}
        <section className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              Мои заявки
            </h2>
            <Link href="/create-request">
              <Button
                variant="ghost"
                size="sm"
                className="text-primary font-bold px-2 rounded-full hover:bg-primary/10"
              >
                <PlusCircle className="h-4 w-4 mr-1.5" /> Создать
              </Button>
            </Link>
          </div>

          {isRequestsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-28 w-full rounded-3xl" />
              <Skeleton className="h-28 w-full rounded-3xl" />
            </div>
          ) : paidRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 bg-background rounded-3xl border border-dashed border-border/60 text-muted-foreground">
              <Send className="h-10 w-10 opacity-20 mb-3" />
              <p className="font-medium text-sm">У вас нет активных заявок</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paidRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-background rounded-3xl p-5 shadow-sm border border-border/40 active:scale-[0.99] transition-transform"
                >
                  <div className="flex justify-between items-start mb-3">
                    <Badge
                      variant="secondary"
                      className="bg-primary/10 text-primary font-bold rounded-lg px-2.5 py-1"
                    >
                      {request.category}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-full border-0 px-2.5 py-1 font-bold text-[10px] uppercase tracking-wider",
                        request.status === "OPEN"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {request.status === "OPEN" ? "Открыта" : "Закрыта"}
                    </Badge>
                  </div>
                  <p className="font-semibold text-[15px] leading-snug line-clamp-2 text-foreground mb-3">
                    {request.serviceDescription}
                  </p>
                  <div className="flex justify-between items-center text-xs text-muted-foreground font-medium">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />{" "}
                      {request.city || "Не указан"}
                    </span>
                    <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                      <MessageCircle className="h-3.5 w-3.5" /> {request.views}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* --- 4. ORDER HISTORY --- */}
        <section className="space-y-4 pt-2">
          <div className="px-1">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              История заказов
            </h2>
          </div>

          {isHistoryLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full rounded-3xl" />
              <Skeleton className="h-24 w-full rounded-3xl" />
            </div>
          ) : orderHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 bg-background rounded-3xl border border-dashed border-border/60 text-muted-foreground">
              <History className="h-10 w-10 opacity-20 mb-3" />
              <p className="font-medium text-sm">История заказов пуста</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orderHistory.map((order) => {
                const isPerformerOnline = onlineUsers.has(order.performerId);

                return (
                  <div
                    key={order.id}
                    className="bg-background rounded-3xl p-5 shadow-sm border border-border/40"
                  >
                    <div className="flex justify-between items-start mb-2 gap-4">
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/performer-profile?id=${order.performerId}`}
                          className="font-bold text-[15px] text-foreground hover:text-primary transition-colors flex items-center gap-2 truncate"
                        >
                          {order.performerName}
                          {isPerformerOnline && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                          )}
                        </Link>
                        <p className="text-[13px] text-muted-foreground mt-0.5 truncate">
                          {order.service}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-[15px] text-foreground">
                          {order.price
                            ? `${order.price.toLocaleString()} ₽`
                            : "Договорная"}
                        </p>
                        <p className="text-[11px] font-medium text-muted-foreground mt-0.5 uppercase tracking-wider">
                          {order.status}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-border/50">
                      <span className="text-[12px] font-medium text-muted-foreground">
                        {format(order.date, "d MMM yyyy", { locale: ru })}
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="rounded-full h-8 px-4 text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 shadow-none"
                        onClick={() => handleOpenChat(order.performerId)}
                      >
                        <MessageCircle className="h-3.5 w-3.5 mr-1.5" />{" "}
                        Написать
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default CustomerProfilePage;
