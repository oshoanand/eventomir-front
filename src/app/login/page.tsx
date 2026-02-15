"use client";
import { signIn, getSession } from "next-auth/react";

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
import { Mail } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
// RadioGroup imports removed as role selection is not needed here
// Импорты RadioGroup удалены, так как выбор роли здесь не нужен

// Login form validation schema, WITHOUT role field (not needed for login)
// Схема валидации формы входа, БЕЗ поля role (оно не нужно для логина)
const formSchema = z.object({
  // email field: string, must be a valid email
  // Поле email: строка, должна быть валидным email
  email: z.string().email({
    message: "Пожалуйста, введите корректный адрес электронной почты.", // Please enter a valid email address.
  }),
  // password field: string, must not be empty
  // Поле password: строка, не должна быть пустой
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters." })
    .regex(/[A-Z]/, { message: "Must contain at least one uppercase letter." }),
});

// Login page component // Компонент страницы входа
const LoginPage = () => {
  // State for tracking form submission // Состояние для отслеживания отправки формы
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Hook for displaying notifications // Хук для отображения уведомлений
  const { toast } = useToast();
  const router = useRouter(); // Initialize router // Инициализация роутера

  // Initialize form using react-hook-form and zodResolver
  // Инициализация формы с помощью react-hook-form и zodResolver
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Form submission handler // Функция обработки отправки формы
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Set submitting flag // Установка флага отправки
    setIsSubmitting(true);
    const { email, password } = values;
    try {
      // Call the login function
      // Вызываем новую функцию логина
      // const result = await loginUser(values.email, values.password);
      const result = await signIn("credentials", {
        redirect: false, // We handle the redirect manually based on the role
        email,
        password,
      });

      if (result?.ok) {
        const session = await getSession();
        const userRole = session?.user?.role;

        let roleDescription = "";
        switch (userRole) {
          case "customer":
            roleDescription = "заказчик";
            break; // customer
          case "performer":
            roleDescription = "исполнитель";
            break; // performer
          case "support":
            roleDescription = "менеджер поддержки";
            break; // support manager
          default:
            roleDescription = "пользователь"; // user
        }

        // Show success notification
        // Показ уведомления об успешном входе
        toast({
          title: "Вход успешен!", // Login successful!
          description: `Вы успешно вошли как ${roleDescription}.`, // You have successfully logged in as ${roleDescription}.
        });

        // Redirect user based on role
        // Перенаправляем пользователя в зависимости от роли
        console.log(userRole);
        if (userRole === "customer") {
          router.push("/customer-profile"); // Navigate to customer profile // Переход в профиль заказчика
        } else if (userRole === "performer") {
          router.push("/performer-profile"); // Navigate to performer profile // Переход в профиль исполнителя
        } else if (userRole === "support") {
          router.push("/support"); // Navigate to support profile // Переход в профиль поддержки
        } else {
          router.push("/"); // Fallback to home page // Запасной вариант - на главную
        }
        // TODO: Save user session information (e.g., in localStorage or context)
        // TODO: Сохранить информацию о сессии пользователя (например, в localStorage или context)
      } else {
        // Show login error notification
        // Показ уведомления об ошибке входа
        toast({
          variant: "destructive",
          title: "Ошибка входа", // Login Error
          description: result?.error, // Show error message from service // Показываем сообщение об ошибке от сервиса
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      // Show generic error notification
      // Показ уведомления об общей ошибке
      toast({
        variant: "destructive",
        title: "Ошибка входа", // Login Error
        description:
          "Произошла непредвиденная ошибка. Пожалуйста, попробуйте еще раз.", // An unexpected error occurred. Please try again.
      });
    } finally {
      // Reset submitting flag // Сброс флага отправки
      setIsSubmitting(false);
    }
  };

  // Google login handler // Обработчик входа через Google
  const handleGoogleLogin = () => {
    // TODO: Implement Google login logic. // TODO: Реализовать логику входа через Google.
    console.log("Attempting Google login...");
    toast({
      title: "Вход через Google", // Login via Google
      description: "Функционал входа через Google будет добавлен позже.", // Google login functionality will be added later.
    });
  };

  // Yandex login handler // Обработчик входа через Яндекс
  const handleYandexLogin = () => {
    // TODO: Implement Yandex login logic. // TODO: Реализовать логику входа через Яндекс.
    console.log("Attempting Yandex login...");
    toast({
      title: "Вход через Яндекс", // Login via Yandex
      description: "Функционал входа через Яндекс будет добавлен позже.", // Yandex login functionality will be added later.
    });
  };

  return (
    <div className="container mx-auto py-10 flex justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Войти</CardTitle> {/* Log In */}
          <CardDescription>
            Войдите в свой аккаунт Eventomir.{" "}
            {/* Log in to your Eventomir account. */}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Login Form */} {/* Форма входа */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Email Field */} {/* Поле Email */}
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
                      />
                    </FormControl>
                    <FormMessage /> {/* Validation error message */}{" "}
                    {/* Сообщение об ошибке валидации */}
                  </FormItem>
                )}
              />
              {/* Password Field */} {/* Поле Пароль */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Пароль</FormLabel> {/* Password */}
                    <FormControl>
                      <Input
                        placeholder="••••••••"
                        {...field}
                        type="password"
                      />
                    </FormControl>
                    <FormMessage /> {/* Validation error message */}{" "}
                    {/* Сообщение об ошибке валидации */}
                  </FormItem>
                )}
              />
              {/* "Forgot Password?" Link */} {/* Ссылка "Забыли пароль?" */}
              <div className="text-right text-sm">
                <Link
                  href="/forgot-password"
                  className="underline text-muted-foreground hover:text-primary"
                >
                  Забыли пароль? {/* Forgot password? */}
                </Link>
              </div>
              {/* "Log In" Button */} {/* Кнопка "Войти" */}
              <Button
                variant="destructive"
                type="submit"
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? "Вход..." : "Войти"}{" "}
                {/* Logging in... / Log In */}
              </Button>
            </form>
          </Form>
          {/* Separator */} {/* Разделитель */}
          <Separator className="my-6" />
          {/* Social Login Buttons */} {/* Кнопки входа через соцсети */}
          <div className="flex flex-col items-center space-y-2">
            {/* Google Button */} {/* Кнопка Google */}
            <Button
              variant="outline"
              onClick={handleGoogleLogin}
              className="w-full"
            >
              {/* Google Icon (inline SVG) */}{" "}
              {/* Иконка Google (inline SVG) */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2 h-4 w-4"
              >
                <path d="M20.91 12A8.83 8.83 0 0 0 3 11.24" />
                <path d="M3.83 19A9 9 0 0 1 21 12" />
                <path d="M15 5A8.91 8.91 0 0 0 3.24 5.83" />
              </svg>
              Войти через Google {/* Log in with Google */}
            </Button>
            {/* Yandex Button */} {/* Кнопка Яндекс */}
            <Button
              variant="outline"
              onClick={handleYandexLogin}
              className="w-full"
            >
              <Mail className="mr-2 h-4 w-4" /> {/* Mail icon */}{" "}
              {/* Иконка почты */}
              Войти через Яндекс {/* Log in with Yandex */}
            </Button>
          </div>
          {/* Registration Links */} {/* Ссылки на регистрацию */}
          <div className="mt-4 text-center text-sm">
            Нет аккаунта? {/* No account? */}
            <Link href="/register-customer" className="underline">
              Зарегистрироваться как заказчик {/* Register as customer */}
            </Link>
            {" или "} {/* or */}
            <Link href="/register-performer" className="underline">
              исполнитель {/* performer */}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Export component // Экспорт компонента
export default LoginPage;
