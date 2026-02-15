"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
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
  LogOut,
  User,
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
// 1. Ensure this component is imported
import SubscriptionStatusCard from "@/components/profile/SubscriptionStatusCard";

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

// --- Main Component ---
const CustomerProfilePage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  // --- 1. Data Fetching Hooks (TanStack Query) ---
  const {
    data: profile,
    isLoading: isProfileLoading,
    error: profileError,
  } = useCustomerProfile();

  const { data: orderHistory = [], isLoading: isHistoryLoading } =
    useCustomerOrders();

  const { data: paidRequests = [], isLoading: isRequestsLoading } =
    useCustomerRequestsQuery(session?.user?.id || "");

  const updateProfileMutation = useUpdateCustomerProfile();

  // --- 2. State Management ---
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

  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  // --- 3. Effects ---
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

  // --- 4. Forms ---
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

  // --- 5. Handlers ---
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
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
        onSuccess: (updatedData: any) => {
          setIsEditing(false);
          setProfilePictureFile(null);
          toast({
            title: "Профиль обновлен",
            description: "Ваши данные успешно сохранены.",
          });
        },
        onError: (error: any) => {
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

  // --- 6. Loading Skeletons ---
  const ProfileSkeleton = () => (
    <Card>
      <CardHeader className="flex flex-col items-center text-center">
        <Skeleton className="h-24 w-24 rounded-full mb-4" />
        <Skeleton className="h-6 w-40 mb-2" />
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex items-center gap-3">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <Skeleton className="h-4 w-36" />
        </div>
        <div className="flex items-center gap-3">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <Skeleton className="h-4 w-28" />
        </div>
      </CardContent>
    </Card>
  );

  const ListSkeleton = () => (
    <div className="space-y-4">
      {[1, 2].map((i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // --- 7. Main Render ---
  if (status === "loading" || isProfileLoading) {
    return (
      <div className="container mx-auto py-10">
        <ProfileSkeleton />
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
    <div className="container mx-auto py-10 space-y-8 max-w-4xl">
      {/* --- Profile Card --- */}
      <Card>
        <CardHeader className="flex flex-col items-center text-center relative">
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
                    <Button variant="ghost" size="icon" title="Сменить пароль">
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
                              <FormLabel>Подтвердите новый пароль</FormLabel>
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
                            {isChangingPassword ? "Смена..." : "Сменить пароль"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
                {/* Logout Profile */}
                <Button variant="ghost" size="icon" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
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

          <div className="relative mb-4 mt-12">
            <Avatar className="h-24 w-24 border-2 border-primary">
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
            {isEditing && (
              <label
                htmlFor="profilePictureInput"
                className="absolute bottom-0 right-0 bg-secondary text-secondary-foreground rounded-full p-1 cursor-pointer hover:bg-secondary/80 transition-colors"
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
            <CardTitle>{profile.name}</CardTitle>
          )}
          <CardDescription>{profile.email}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <Phone className="h-4 w-4 text-muted-foreground" />
            {isEditing ? (
              <Input
                name="phone"
                value={formData.phone || ""}
                onChange={handleFormChange}
                placeholder="+7..."
                className="max-w-[200px]"
              />
            ) : (
              <span>{formatPhoneNumber(profile.phone) || "Не указан"}</span>
            )}
          </div>
          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            {isEditing ? (
              <Input
                name="city"
                value={formData.city || ""}
                onChange={handleFormChange}
                placeholder="Город"
                className="max-w-[200px]"
              />
            ) : (
              <span>{profile.city || "Не указан"}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* --- Subscription Section (New) --- */}
      <SubscriptionStatusCard />

      {/* --- Paid Requests Section --- */}
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" /> Мои платные запросы
            </CardTitle>
            <CardDescription>Запросы, видимые исполнителям.</CardDescription>
          </div>
          <Link href="/create-request">
            <Button variant="destructive">Создать новый</Button>
          </Link>
        </CardHeader>
        <CardContent>
          {isRequestsLoading ? (
            <ListSkeleton />
          ) : paidRequests.length === 0 ? (
            <p className="text-center text-muted-foreground">
              У вас пока нет активных запросов.
            </p>
          ) : (
            <div className="space-y-4">
              {paidRequests.map((request) => (
                <Card key={request.id}>
                  <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                    <div className="col-span-2 space-y-1">
                      <p className="font-medium">
                        {request.serviceDescription}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {request.category}{" "}
                        {request.city ? `• ${request.city}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Создан:{" "}
                        {format(request.createdAt, "d MMMM yyyy", {
                          locale: ru,
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          request.status === "open" ? "default" : "secondary"
                        }
                      >
                        {request.status === "open" ? "Открыт" : "Закрыт"}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-2">
                        Просмотров: {request.views}
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" /> История заказов
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isHistoryLoading ? (
            <ListSkeleton />
          ) : orderHistory.length === 0 ? (
            <p className="text-center text-muted-foreground">
              История заказов пуста.
            </p>
          ) : (
            <div className="space-y-4">
              {orderHistory.map((order) => (
                <Card key={order.id}>
                  <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                    <div className="space-y-1">
                      <Link
                        href={`/performer-profile?id=${order.performerId}`}
                        className="font-medium hover:underline"
                      >
                        {order.performerName}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {order.service}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm">
                        {format(order.date, "d MMMM yyyy, HH:mm", {
                          locale: ru,
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.price
                          ? `${order.price.toLocaleString()} руб.`
                          : "Цена не указана"}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          order.status === "completed" ? "outline" : "default"
                        }
                      >
                        {order.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerProfilePage;
