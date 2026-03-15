"use client";

import { signIn, getSession, useSession, signOut } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Separator } from "@/components/ui/separator";
import {
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  LogOut,
  ArrowRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Importing our new icons
import { YandexIcon, VkontakteIcon, GoogleIcon } from "@/components/icons";

const formSchema = z.object({
  email: z.string().email({
    message: "Пожалуйста, введите корректный адрес электронной почты.",
  }),
  password: z
    .string()
    .min(8, {
      message:
        "Пароль должен состоять как минимум из 8 символов и одной заглавной латинской буквы.",
    })
    .regex(/[A-Z]/, {
      message: "Должно содержать как минимум одну заглавную букву",
    }),
});

const LoginPage = () => {
  const { data: session, status } = useSession();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [partnerTransferUrl, setPartnerTransferUrl] = useState<string | null>(
    null,
  );

  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  // --- CREDENTIALS LOGIN HANDLER ---
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    const { email, password } = values;

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        if (result.error.includes("PARTNER_REDIRECT")) {
          try {
            const errorData = JSON.parse(result.error);
            let partnerBaseUrl = process.env.NEXT_PUBLIC_PARTNER_APP_URL;
            if (!partnerBaseUrl || partnerBaseUrl.trim() === "") {
              partnerBaseUrl = "http://localhost:3001";
            }
            partnerBaseUrl = partnerBaseUrl.replace(/\/$/, "");

            const targetUrl = `${partnerBaseUrl}/dashboard?v=${errorData.token}`;
            const newWindow = window.open(targetUrl, "_blank");

            if (
              !newWindow ||
              newWindow.closed ||
              typeof newWindow.closed === "undefined"
            ) {
              setPartnerTransferUrl(targetUrl);
            } else {
              setPartnerTransferUrl("success");
              toast({
                variant: "success",
                title: "Авторизация успешна",
                description: "Открытие панели партнера в новой вкладке...",
              });
            }
            return;
          } catch (e) {
            console.error("Failed to parse partner redirect token", e);
          }
        }

        toast({
          variant: "destructive",
          title: "Ошибка входа",
          description: result.error,
        });
      } else if (result?.ok) {
        const currentSession = await getSession();
        const userRole = currentSession?.user?.role;
        let roleDescription =
          userRole === "customer"
            ? "заказчик"
            : userRole === "performer"
              ? "исполнитель"
              : userRole === "support"
                ? "менеджер поддержки"
                : "пользователь";

        toast({
          variant: "success",
          title: "Вход успешен!",
          description: `Вы успешно вошли как ${roleDescription}.`,
        });

        if (userRole === "customer") router.push("/customer-profile");
        else if (userRole === "performer") router.push("/performer-profile");
        else if (userRole === "support") router.push("/support");
        else router.push("/");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Ошибка входа",
        description:
          "Произошла непредвиденная ошибка. Пожалуйста, попробуйте еще раз.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- OAUTH LOGIN HANDLER ---
  const handleOAuthLogin = async (provider: "google" | "yandex" | "vk") => {
    setLoadingProvider(provider);
    try {
      await signIn(provider, { callbackUrl: "/customer-profile" });
    } catch (error) {
      setLoadingProvider(null);
      toast({
        variant: "destructive",
        title: "Ошибка авторизации",
        description: `Не удалось войти через выбранную социальную сеть.`,
      });
    }
  };

  const isAnyLoading = isSubmitting || loadingProvider !== null;

  if (status === "loading") {
    return (
      <div className="container mx-auto py-20 flex justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 bg-muted rounded-full mb-4"></div>
          <div className="h-4 w-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (status === "authenticated") {
    const roleLabel =
      session.user?.role === "customer"
        ? "Заказчик"
        : session.user?.role === "performer"
          ? "Исполнитель"
          : session.user?.role || "Новый пользователь";

    const profileLink =
      session.user?.role === "customer"
        ? "/customer-profile"
        : session.user?.role === "performer"
          ? "/performer-profile"
          : !session.user?.role
            ? "/complete-registration"
            : "/";

    return (
      <div className="container mx-auto py-20 flex justify-center animate-in fade-in zoom-in duration-300">
        <Card className="w-full max-w-md text-center shadow-lg border-primary/20">
          <CardHeader className="pb-4">
            <div className="mx-auto bg-amber-100 text-amber-600 h-16 w-16 flex items-center justify-center rounded-full mb-4">
              <AlertCircle className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl">Вы уже вошли в систему</CardTitle>
            <CardDescription className="text-base mt-2">
              Вы авторизованы на платформе как <strong>{roleLabel}</strong> (
              {session.user?.email}).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-muted/50 rounded-md text-sm text-muted-foreground mb-4">
              Чтобы войти в другой аккаунт (например, в Кабинет Партнера), вам
              необходимо сначала выйти из текущего профиля.
            </div>
            <Button
              variant="default"
              onClick={() => signOut({ redirect: false })}
              className="w-full h-12"
            >
              <LogOut className="mr-2 h-5 w-5" /> Выйти из аккаунта
            </Button>
            <Button variant="outline" asChild className="w-full h-12">
              <Link href={profileLink}>
                Вернуться в профиль <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (partnerTransferUrl && partnerTransferUrl !== "success") {
    return (
      <div className="container mx-auto py-20 flex justify-center animate-in fade-in zoom-in duration-300">
        <Card className="w-full max-w-md text-center shadow-lg border-primary/20">
          <CardHeader className="pb-4">
            <div className="mx-auto bg-green-100 text-green-600 h-16 w-16 flex items-center justify-center rounded-full mb-4">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <CardTitle className="text-2xl">Авторизация успешна</CardTitle>
            <CardDescription className="text-base mt-2">
              Вы вошли как партнер. Кабинет партнера находится на отдельной
              специализированной платформе.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => {
                window.open(partnerTransferUrl, "_blank");
                setPartnerTransferUrl("success");
                router.push("/");
              }}
              className="w-full h-12 text-md mt-2"
            >
              Перейти в панель партнера{" "}
              <ExternalLink className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setPartnerTransferUrl(null);
                form.reset();
              }}
              className="w-full mt-4 text-muted-foreground"
            >
              Вернуться назад
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 flex justify-center">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader>
          <CardTitle>Войти</CardTitle>
          <CardDescription>Войдите в свой аккаунт Eventomir.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="example@mail.com"
                        {...field}
                        type="email"
                        disabled={isAnyLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Пароль</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="••••••••"
                        {...field}
                        type="password"
                        disabled={isAnyLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="text-right text-sm">
                <Link
                  href="/forgot-password"
                  className="underline text-muted-foreground hover:text-primary"
                >
                  Забыли пароль?
                </Link>
              </div>
              <Button
                variant="destructive"
                type="submit"
                disabled={isAnyLoading}
                className="w-full h-11"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : null}
                {isSubmitting ? "Вход..." : "Войти"}
              </Button>
            </form>
          </Form>

          <Separator className="my-6" />

          <div className="flex flex-col items-center space-y-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuthLogin("google")}
              disabled={isAnyLoading}
              className="w-full gap-2 relative h-11 bg-white text-black hover:bg-gray-50 border-gray-300"
            >
              {loadingProvider === "google" ? (
                <Loader2 className="w-5 h-5 animate-spin absolute left-4 text-muted-foreground" />
              ) : (
                <GoogleIcon className="w-5 h-5 " />
              )}
              <span className="font-medium">Войти через Google</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuthLogin("yandex")}
              disabled={isAnyLoading}
              className="w-full gap-2 relative h-11 bg-white text-black hover:bg-gray-50 border-gray-300"
            >
              {loadingProvider === "yandex" ? (
                <Loader2 className="w-5 h-5 animate-spin absolute left-4 text-muted-foreground" />
              ) : (
                <YandexIcon className="w-5 h-5 " />
              )}
              <span className="font-medium">Войти через Яндекс</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuthLogin("vk")}
              disabled={isAnyLoading}
              className="w-full gap-2 relative h-11 bg-[#0077FF] text-white hover:bg-[#0077FF]/90 border-transparent"
            >
              {loadingProvider === "vk" ? (
                <Loader2 className="w-6 h-6 animate-spin absolute left-4 text-white" />
              ) : (
                <VkontakteIcon className="w-6 h-6  fill-white text-white" />
              )}
              <span className="font-medium">Войти через ВКонтакте</span>
            </Button>
          </div>

          <div className="mt-6 text-center text-sm">
            Нет аккаунта?{" "}
            <Link
              href="/register-customer"
              className="underline hover:text-primary"
            >
              Зарегистрироваться как заказчик
            </Link>
            {" или "}
            <Link
              href="/register-performer"
              className="underline hover:text-primary"
            >
              исполнитель
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
