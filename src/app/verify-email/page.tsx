"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

// UI Components (Shadcn)
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

// Separate component for logic to allow Suspense wrapping
const VerifyEmailContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get token from ?token=...
  // Получаем токен из query параметров
  const token = searchParams.get("token");

  const [verificationStatus, setVerificationStatus] = useState<
    "loading" | "success" | "error"
  >("loading");
  const [message, setMessage] = useState<string>("Проверяем ваш токен...");

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setMessage("Токен верификации не найден.");
        setVerificationStatus("error");
        return;
      }

      try {
        // Call your Backend API
        // Вызываем ваш Backend API
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/verify-email?token=${token}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          },
        );

        const data = await response.json();
        console.log(data);

        if (response.ok) {
          setVerificationStatus("success");
          setMessage("Email успешно подтвержден! Перенаправляем...");

          // Optional: Auto redirect after 3 seconds
          // Опционально: авто-редерект через 3 секунды
          setTimeout(() => {
            router.push("/login");
          }, 3000);
        } else {
          setVerificationStatus("error");
          setMessage(
            data.message || "Ошибка верификации. Ссылка могла устареть.",
          );
        }
      } catch (error) {
        console.error("Ошибка верификации email:", error);
        setMessage("Произошла ошибка сети. Попробуйте позже.");
        setVerificationStatus("error");
      }
    };

    verifyToken();
  }, [token, router]);

  return (
    <div className="container mx-auto py-20 flex justify-center min-h-screen items-center">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle>Верификация Email</CardTitle>
          <CardDescription>
            Подтверждение вашего адреса электронной почты.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {/* Loading State */}
          {verificationStatus === "loading" && (
            <div className="flex flex-col items-center gap-4 py-6">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">{message}</p>
            </div>
          )}

          {/* Success State */}
          {verificationStatus === "success" && (
            <Alert
              variant="default"
              className="bg-green-50 border-green-300 text-green-800"
            >
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div className="ml-2">
                <AlertTitle>Успешно!</AlertTitle>
                <AlertDescription>{message}</AlertDescription>
              </div>
              <Button
                asChild
                className="mt-4 w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <Link href="/login">Перейти ко входу</Link>
              </Button>
            </Alert>
          )}

          {/* Error State */}
          {verificationStatus === "error" && (
            <Alert
              variant="destructive"
              className="bg-red-50 border-red-300 text-red-800"
            >
              <XCircle className="h-5 w-5 text-red-600" />
              <div className="ml-2">
                <AlertTitle>Ошибка!</AlertTitle>
                <AlertDescription>{message}</AlertDescription>
              </div>

              {/* Link to Resend Page */}
              {/* Ссылка на страницу повторной отправки */}
              <Button
                asChild
                variant="outline"
                className="mt-4 w-full border-red-200 hover:bg-red-100 text-red-800"
              >
                <Link href="/auth/resend-verification">
                  Отправить новую ссылку
                </Link>
              </Button>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Export wrapped in Suspense
// Экспорт обернутый в Suspense
const VerifyEmailPage = () => {
  return (
    <Suspense
      fallback={<div className="flex justify-center py-20">Загрузка...</div>}
    >
      <VerifyEmailContent />
    </Suspense>
  );
};

export default VerifyEmailPage;
