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
  Mail,
  Lock,
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
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-16 w-16 bg-muted rounded-full mb-6"></div>
          <div className="h-4 w-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  // --- ALREADY LOGGED IN STATE ---
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
      <div className="min-h-[calc(100vh-80px)]  flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-500">
        {/* Added md:max-w-[380px] for compact desktop card */}
        <Card className="w-full max-w-md md:max-w-[380px] text-center shadow-none md:shadow-xl border-none md:border-border/50 rounded-3xl md:rounded-2xl overflow-hidden">
          {/* Tighter desktop padding */}
          <CardHeader className="pb-4 pt-8 md:pt-8">
            <div className="mx-auto bg-amber-100/80 text-amber-600 h-20 w-20 md:h-16 md:w-16 flex items-center justify-center rounded-full mb-6 ring-8 ring-amber-50">
              <AlertCircle className="h-10 w-10 md:h-8 md:w-8" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Вы уже вошли
            </CardTitle>
            <CardDescription className="text-base md:text-sm mt-2">
              Вы авторизованы на платформе как <strong>{roleLabel}</strong>{" "}
              <br />
              <span className="text-muted-foreground opacity-80">
                ({session.user?.email})
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-8 md:px-8 md:pb-8">
            <div className="p-4 md:p-3 bg-muted/40 rounded-xl text-sm md:text-xs text-muted-foreground mb-6 md:mb-4 leading-relaxed">
              Чтобы войти в другой аккаунт, вам необходимо сначала выйти из
              текущего профиля.
            </div>
            <Button
              variant="default"
              onClick={() => signOut({ redirect: false })}
              className="w-full h-12 md:h-10 rounded-xl md:rounded-lg font-semibold shadow-sm"
            >
              <LogOut className="mr-2 h-5 w-5 md:h-4 md:w-4" /> Выйти из
              аккаунта
            </Button>
            <Button
              variant="outline"
              asChild
              className="w-full h-12 md:h-10 rounded-xl md:rounded-lg font-semibold"
            >
              <Link href={profileLink}>
                Вернуться в профиль{" "}
                <ArrowRight className="ml-2 h-5 w-5 md:h-4 md:w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- PARTNER REDIRECT STATE ---
  if (partnerTransferUrl && partnerTransferUrl !== "success") {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-500">
        <Card className="w-full max-w-md md:max-w-[380px] text-center shadow-none md:shadow-xl border-none md:border-border/50 rounded-3xl md:rounded-2xl overflow-hidden">
          <CardHeader className="pb-4 pt-8 md:pt-8">
            <div className="mx-auto bg-green-100/80 text-green-600 h-20 w-20 md:h-16 md:w-16 flex items-center justify-center rounded-full mb-6 ring-8 ring-green-50">
              <ShieldCheck className="h-10 w-10 md:h-8 md:w-8" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Авторизация успешна
            </CardTitle>
            <CardDescription className="text-base md:text-sm mt-2 leading-relaxed">
              Вы вошли как партнер. Кабинет находится на специализированной
              платформе.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-8 md:px-8 md:pb-8">
            <Button
              onClick={() => {
                window.open(partnerTransferUrl, "_blank");
                setPartnerTransferUrl("success");
                router.push("/");
              }}
              className="w-full h-12 md:h-10 rounded-xl md:rounded-lg text-md md:text-sm font-semibold mt-4 shadow-sm"
            >
              Перейти в панель партнера{" "}
              <ExternalLink className="ml-2 h-5 w-5 md:h-4 md:w-4" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setPartnerTransferUrl(null);
                form.reset();
              }}
              className="w-full h-12 md:h-10 rounded-xl md:rounded-lg mt-4 font-semibold text-muted-foreground hover:bg-muted/50"
            >
              Вернуться назад
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- MAIN LOGIN STATE ---
  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4 md:p-4 bg-muted/10 md:bg-transparent">
      {/* 1. COMPACT WIDTH: max-w-[420px] on mobile -> max-w-[380px] on desktop */}
      <Card className="w-full max-w-[420px] md:max-w-[380px] shadow-none md:shadow-xl border-none md:border-border/50 rounded-[2rem] md:rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        {/* 2. COMPACT PADDING: pt-8/pb-4 on desktop instead of pt-10/pb-6 */}
        <CardHeader className="space-y-2 md:space-y-1.5 pt-8 md:pt-8 pb-6 md:pb-4 text-center">
          {/* Tighter text sizing on desktop */}
          <CardTitle className="text-3xl md:text-2xl font-extrabold tracking-tight">
            С возвращением
          </CardTitle>
          <CardDescription className="text-base md:text-sm font-medium">
            Войдите в свой аккаунт Eventomir
          </CardDescription>
        </CardHeader>

        {/* 3. COMPACT PADDING: px-8/pb-8 on desktop */}
        <CardContent className="px-6 pb-8 md:px-8 md:pb-8">
          <Form {...form}>
            {/* Tighter vertical spacing between inputs */}
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-5 md:space-y-2"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold ml-1 text-sm md:text-xs text-foreground/80">
                      Email
                    </FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 md:h-4 md:w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        {/* 4. COMPACT INPUT HEIGHT: h-12 -> h-10 on desktop */}
                        <Input
                          placeholder="example@mail.com"
                          {...field}
                          type="email"
                          disabled={isAnyLoading}
                          className="pl-11 md:pl-10 h-12 md:h-10 rounded-xl md:rounded-lg bg-muted/40 focus:bg-background transition-all border-muted-foreground/20 text-base md:text-sm"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="ml-1 text-xs" />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold ml-1 text-sm md:text-xs text-foreground/80">
                      Пароль
                    </FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 md:h-4 md:w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                          placeholder="••••••••"
                          {...field}
                          type="password"
                          disabled={isAnyLoading}
                          className="pl-11 md:pl-10 h-12 md:h-10 rounded-xl md:rounded-lg bg-muted/40 focus:bg-background transition-all border-muted-foreground/20 text-base md:text-sm"
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="ml-1 text-xs" />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-1 md:pt-0">
                <Link
                  href="/forgot-password"
                  className="text-sm md:text-xs font-semibold text-muted-foreground hover:text-primary transition-colors underline-offset-4 hover:underline"
                >
                  Забыли пароль?
                </Link>
              </div>

              {/* Tighter submit button */}
              <Button
                type="submit"
                disabled={isAnyLoading}
                className="w-full h-12 md:h-10 rounded-xl md:rounded-lg font-bold text-base md:text-sm shadow-md hover:shadow-lg transition-all"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-5 w-5 md:h-4 md:w-4 animate-spin" />
                ) : null}
                {isSubmitting ? "Вход..." : "Войти"}
              </Button>
            </form>
          </Form>

          {/* Tighter separator margins */}
          <div className="relative my-8 md:my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground font-semibold tracking-wider text-[10px] md:text-[11px]">
                Или войти через
              </span>
            </div>
          </div>

          {/* Tighter vertical spacing between OAuth buttons */}
          <div className="flex flex-col space-y-3 md:space-y-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuthLogin("google")}
              disabled={isAnyLoading}
              className="w-full h-12 md:h-10 rounded-xl md:rounded-lg bg-white text-black hover:bg-gray-50 border-gray-200 shadow-sm relative overflow-hidden transition-all"
            >
              {loadingProvider === "google" ? (
                <Loader2 className="w-5 h-5 md:w-4 md:h-4 animate-spin absolute left-4 text-muted-foreground" />
              ) : (
                <GoogleIcon className="w-5 h-5 md:w-4 md:h-4 absolute left-4" />
              )}
              <span className="font-semibold text-base md:text-sm">
                Продолжить с Google
              </span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuthLogin("yandex")}
              disabled={isAnyLoading}
              className="w-full h-12 md:h-10 rounded-xl md:rounded-lg bg-white text-black hover:bg-gray-50 border-gray-200 shadow-sm relative overflow-hidden transition-all"
            >
              {loadingProvider === "yandex" ? (
                <Loader2 className="w-5 h-5 md:w-4 md:h-4 animate-spin absolute left-4 text-muted-foreground" />
              ) : (
                <YandexIcon className="w-5 h-5 md:w-4 md:h-4 absolute left-4" />
              )}
              <span className="font-semibold text-base md:text-sm">
                Продолжить с Яндекс
              </span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuthLogin("vk")}
              disabled={isAnyLoading}
              className="w-full h-12 md:h-10 rounded-xl md:rounded-lg bg-[#0077FF] text-white hover:bg-[#0077FF]/90 border-transparent shadow-sm relative overflow-hidden transition-all"
            >
              {loadingProvider === "vk" ? (
                <Loader2 className="w-6 h-6 md:w-5 md:h-5 animate-spin absolute left-4 text-white" />
              ) : (
                <VkontakteIcon className="w-6 h-6 md:w-5 md:h-5 absolute left-4 fill-white text-white" />
              )}
              <span className="font-semibold text-base md:text-sm">
                Продолжить с ВКонтакте
              </span>
            </Button>
          </div>

          <div className="mt-8 md:mt-6 text-center text-sm md:text-xs font-medium text-muted-foreground">
            Нет аккаунта?{" "}
            <Link
              href="/register-customer"
              className="text-foreground font-bold hover:text-primary transition-colors underline-offset-4 hover:underline"
            >
              Заказчик
            </Link>
            {" или "}
            <Link
              href="/register-performer"
              className="text-foreground font-bold hover:text-primary transition-colors underline-offset-4 hover:underline"
            >
              Исполнитель
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
