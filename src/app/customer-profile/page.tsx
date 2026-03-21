"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Edit,
  Camera,
  History,
  MapPin,
  Phone,
  Mail,
  KeyRound,
  Send,
  Bell,
  Trash2,
  Wallet,
  PlusCircle,
  MessageCircle,
  Loader2,
  CreditCard,
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
  DialogClose,
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
import { formatPhoneNumber } from "@/utils/helper";
import { apiRequest } from "@/utils/api-client";

// --- Real-Time & Chat Imports ---
import { useSocket } from "@/components/providers/socket-provider";
import ChatDialog from "@/components/chat/ChatDialog";
import { createOrGetChat } from "@/services/chat";

// --- Custom Hooks & Services ---
import {
  useCustomerProfile,
  useUpdateCustomerProfile,
  useCustomerOrders,
  CustomerProfile,
} from "@/services/customer";
import { useCustomerRequestsQuery } from "@/services/requests";
import { changePassword, deleteUserAccount } from "@/services/auth";
import { getNotifications } from "@/services/notifications";

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
  const { toast } = useToast();

  const { onlineUsers } = useSocket() || { onlineUsers: [] };

  // --- Data Fetching Hooks ---
  const { data: profile, isLoading: isProfileLoading } = useCustomerProfile();

  const { data: orderHistory = [], isLoading: isHistoryLoading } =
    useCustomerOrders();

  // NOTE: Passed optional customerId as required by the updated service
  const { data: paidRequests = [], isLoading: isRequestsLoading } =
    useCustomerRequestsQuery(session?.user?.id);

  const updateProfileMutation = useUpdateCustomerProfile();

  const isCustomerOnline = profile ? onlineUsers.includes(profile.id) : false;

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

  // Chat States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState("");
  const [chatPartnerName, setChatPartnerName] = useState("");

  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  // --- Effects ---
  useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  useEffect(() => {
    if (session?.user?.id) {
      getNotifications(session.user.id)
        .then((notifs) => {
          setUnreadNotificationsCount(notifs.filter((n) => !n.isRead).length);
        })
        .catch((err) => console.error("Failed to fetch notifications", err));
    }
  }, [session?.user?.id]);

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
        toast({ title: "Успех", description: result.message });
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
        toast({ title: "Аккаунт удален", description: result.message });
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
      // Calls your new Top Up backend route
      const response = await apiRequest<{ paymentUrl: string }>({
        method: "post",
        url: "/api/wallet/topup",
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

  const handleOpenChat = async (
    targetUserId: string,
    targetUserName: string,
  ) => {
    if (!session?.user?.id) return;
    if (targetUserId === session.user.id) {
      toast({
        variant: "destructive",
        title: "Вы не можете написать самому себе",
      });
      return;
    }

    try {
      const chatId = await createOrGetChat(targetUserId);
      setCurrentChatId(chatId);
      setChatPartnerName(targetUserName);
      setIsChatOpen(true);
    } catch (e) {
      toast({ variant: "destructive", title: "Ошибка чата" });
    }
  };

  // --- Loading Skeletons ---
  if (status === "loading" || isProfileLoading) {
    return (
      <div className="container mx-auto py-10 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-80 w-full md:col-span-2" />
          <Skeleton className="h-80 w-full" />
        </div>
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
    <>
      <div className="container mx-auto py-10 space-y-8 max-w-5xl">
        {/* --- Top Row: Profile & Wallet --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* PROFILE CARD */}
          <Card className="md:col-span-2 relative shadow-sm border-2">
            <CardHeader className="flex flex-col items-center text-center relative pb-2">
              <div className="absolute top-4 right-4 flex gap-2">
                {isEditing ? (
                  <>
                    <Button
                      variant="default"
                      onClick={handleSaveChanges}
                      disabled={updateProfileMutation.isPending}
                      size="sm"
                    >
                      {updateProfileMutation.isPending
                        ? "Сохранение..."
                        : "Сохранить"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData(profile);
                      }}
                      size="sm"
                    >
                      Отмена
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/notifications">
                      <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-4 w-4" />
                        {unreadNotificationsCount > 0 && (
                          <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-3 w-3 p-0 flex items-center justify-center rounded-full text-[10px]"
                          >
                            {unreadNotificationsCount}
                          </Badge>
                        )}
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    {/* Change Password Dialog */}
                    <Dialog
                      open={isChangePasswordOpen}
                      onOpenChange={setIsChangePasswordOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Сменить пароль"
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
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
                            className="space-y-4 py-4"
                          >
                            <FormField
                              control={changePasswordForm.control}
                              name="currentPassword"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Текущий пароль</FormLabel>
                                  <FormControl>
                                    <Input type="password" {...field} />
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
                                    <Input type="password" {...field} />
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
                                  <FormLabel>
                                    Подтвердите новый пароль
                                  </FormLabel>
                                  <FormControl>
                                    <Input type="password" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <DialogFooter>
                              <Button
                                type="submit"
                                variant="destructive"
                                disabled={isChangingPassword}
                              >
                                {isChangingPassword
                                  ? "Смена..."
                                  : "Сменить пароль"}
                              </Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>

                    {/* Delete Account Dialog */}
                    <Dialog
                      open={isDeleteAccountOpen}
                      onOpenChange={setIsDeleteAccountOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="icon"
                          title="Удалить аккаунт"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Удаление аккаунта</DialogTitle>
                          <DialogDescription>
                            Это действие необратимо.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setIsDeleteAccountOpen(false)}
                          >
                            Отмена
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={handleDeleteAccount}
                            disabled={isDeletingAccount}
                          >
                            {isDeletingAccount ? "Удаление..." : "Удалить"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
              </div>

              <div className="relative mb-4 mt-6">
                <Avatar className="h-24 w-24 border-2 border-primary shadow-sm">
                  <AvatarImage
                    src={
                      profilePictureFile
                        ? formData.profilePicture
                        : getImageUrl(profile.profilePicture)
                    }
                    alt={formData.name || profile.name}
                  />
                  <AvatarFallback>
                    {getInitials(formData.name || profile.name)}
                  </AvatarFallback>
                </Avatar>

                {/* ONLINE STATUS INDICATOR */}
                {!isEditing && (
                  <span
                    className={cn(
                      "absolute bottom-1 right-1 h-5 w-5 rounded-full border-2 border-background z-20 transition-all duration-300",
                      isCustomerOnline
                        ? "bg-green-500 animate-pulse"
                        : "bg-gray-300",
                    )}
                    title={isCustomerOnline ? "В сети" : "Не в сети"}
                  />
                )}

                {isEditing && (
                  <label
                    htmlFor="profilePictureInput"
                    className="absolute bottom-0 right-0 bg-secondary text-secondary-foreground rounded-full p-1.5 cursor-pointer hover:bg-secondary/80 transition-colors shadow-sm"
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
                  className="text-xl font-semibold mt-2 text-center max-w-xs"
                  placeholder="Ваше имя"
                />
              ) : (
                <CardTitle className="text-2xl">{profile.name}</CardTitle>
              )}
              <CardDescription className="text-sm">
                {profile.email}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary/70" />
                  {isEditing ? (
                    <Input
                      name="phone"
                      value={formData.phone || ""}
                      onChange={handleFormChange}
                      placeholder="+7..."
                      className="h-8 w-36 text-sm"
                    />
                  ) : (
                    <span className="text-sm font-medium">
                      {formatPhoneNumber(profile.phone) || "Не указан"}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary/70" />
                  {isEditing ? (
                    <Input
                      name="city"
                      value={formData.city || ""}
                      onChange={handleFormChange}
                      placeholder="Город"
                      className="h-8 w-36 text-sm"
                    />
                  ) : (
                    <span className="text-sm font-medium">
                      {profile.city || "Не указан"}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* WALLET CARD */}
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Wallet className="h-24 w-24" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wallet className="h-5 w-5 text-primary" />
                Мой кошелек
              </CardTitle>
              <CardDescription>Доступный баланс</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground my-2">
                {profile.walletBalance?.toLocaleString()}{" "}
                <span className="text-muted-foreground text-2xl">₽</span>
              </div>
            </CardContent>
            <CardFooter>
              <Dialog open={isTopUpOpen} onOpenChange={setIsTopUpOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full font-semibold shadow-sm">
                    <PlusCircle className="mr-2 h-4 w-4" /> Пополнить баланс
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Пополнение кошелька</DialogTitle>
                    <DialogDescription>
                      Выберите сумму или введите свою для пополнения баланса.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="py-4 space-y-4">
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
                            "h-12 text-lg",
                            topUpAmount === amount.toString() &&
                              "ring-2 ring-primary/20",
                          )}
                          onClick={() => setTopUpAmount(amount.toString())}
                        >
                          {amount} ₽
                        </Button>
                      ))}
                    </div>
                    <div className="space-y-2 pt-2">
                      <Label>Другая сумма</Label>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="Введите сумму"
                          value={topUpAmount}
                          onChange={(e) => setTopUpAmount(e.target.value)}
                          className="h-12 text-lg pl-4 pr-12"
                        />
                        <span className="absolute right-4 top-3 text-muted-foreground font-medium">
                          ₽
                        </span>
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsTopUpOpen(false)}
                    >
                      Отмена
                    </Button>
                    <Button onClick={handleTopUpWallet} disabled={isToppingUp}>
                      {isToppingUp ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CreditCard className="mr-2 h-4 w-4" />
                      )}
                      Оплатить
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        </div>

        {/* --- Paid Requests Section --- */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row justify-between items-center border-b pb-4 bg-muted/20">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" /> Мои платные заявки
              </CardTitle>
              <CardDescription className="mt-1">
                Заявки, отправленные исполнителям напрямую.
              </CardDescription>
            </div>
            <Link href="/create-request">
              <Button className="shadow-sm">Создать новую</Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-6">
            {isRequestsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : paidRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/10">
                У вас пока нет активных заявок.
              </div>
            ) : (
              <div className="space-y-4">
                {paidRequests.map((request) => (
                  <Card
                    key={request.id}
                    className="border bg-card hover:bg-muted/10 transition-colors"
                  >
                    <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                      <div className="col-span-2 sm:col-span-3 space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant="secondary"
                            className="bg-primary/10 text-primary hover:bg-primary/20"
                          >
                            {request.category}
                          </Badge>
                          {request.city && (
                            <span className="text-sm text-muted-foreground">
                              • {request.city}
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-sm line-clamp-2">
                          {request.serviceDescription}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Создано:{" "}
                          {format(request.createdAt, "d MMMM yyyy", {
                            locale: ru,
                          })}
                        </p>
                      </div>
                      <div className="text-left sm:text-right flex flex-row sm:flex-col items-center sm:items-end justify-between">
                        <Badge
                          variant={
                            request.status === "OPEN" ? "default" : "outline"
                          }
                          className={
                            request.status === "OPEN"
                              ? "bg-emerald-500 hover:bg-emerald-600"
                              : ""
                          }
                        >
                          {request.status === "OPEN" ? "Открыта" : "Закрыта"}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" /> Просмотров:{" "}
                          {request.views}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* --- Order History Section --- */}
        <Card className="shadow-sm">
          <CardHeader className="border-b pb-4 bg-muted/20">
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" /> История заказов
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {isHistoryLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : orderHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/10">
                История заказов пуста.
              </div>
            ) : (
              <div className="space-y-3">
                {orderHistory.map((order) => {
                  const isPerformerOnline = onlineUsers.includes(
                    order.performerId,
                  );

                  return (
                    <div
                      key={order.id}
                      className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg hover:bg-muted/10 transition-colors gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/performer-profile?id=${order.performerId}`}
                            className="font-semibold text-base hover:text-primary transition-colors flex items-center gap-2"
                          >
                            {order.performerName}
                          </Link>
                          {isPerformerOnline && (
                            <div
                              className="h-2 w-2 rounded-full bg-green-500"
                              title="В сети"
                            />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {order.service}
                        </p>
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs text-primary flex items-center gap-1"
                          onClick={() =>
                            handleOpenChat(
                              order.performerId,
                              order.performerName,
                            )
                          }
                        >
                          <MessageCircle className="h-3 w-3" /> Написать
                          сообщение
                        </Button>
                      </div>

                      <div className="flex flex-row sm:flex-col justify-between sm:justify-center sm:items-end w-full sm:w-auto gap-2">
                        <div className="text-left sm:text-right">
                          <p className="font-medium">
                            {order.price
                              ? `${order.price.toLocaleString()} ₽`
                              : "Договорная"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(order.date, "d MMM yyyy", { locale: ru })}
                          </p>
                        </div>
                        <Badge
                          variant={
                            order.status === "completed"
                              ? "secondary"
                              : "default"
                          }
                        >
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 5. GLOBAL CHAT DIALOG FOR THIS PAGE */}
      {isChatOpen && session?.user && currentChatId && (
        <ChatDialog
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          chatId={currentChatId}
          performerName={chatPartnerName}
          currentUserId={session.user.id}
        />
      )}
    </>
  );
};

export default CustomerProfilePage;
