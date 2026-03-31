"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getCurrentSubscription, UserSubscription } from "@/services/payment";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Gem, CalendarClock, CreditCard, AlertCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/utils/utils";

export default function SubscriptionStatusCard() {
  const [subscription, setSubscription] = useState<UserSubscription | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSub() {
      try {
        const sub = await getCurrentSubscription();
        setSubscription(sub);
      } catch (e) {
        console.error("Failed to fetch subscription:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchSub();
  }, []);

  if (loading) {
    return <Skeleton className="h-48 w-full rounded-xl" />;
  }

  // --- LOGIC: Determine Expiration ---
  const isExpired =
    subscription?.status === "EXPIRED" ||
    (subscription?.endDate && new Date(subscription.endDate) < new Date());

  // --- LOGIC: Determine if user is on Free plan or has no history ---
  const isFreeOrNone =
    !subscription ||
    (!isExpired &&
      (subscription.planName === "Free" || subscription.planName === "FREE"));

  // 1. STATE: User has no active paid plan (Basic Tier)
  if (isFreeOrNone && !isExpired) {
    return (
      <Card className="border-dashed bg-muted/10">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center space-y-4">
          <div className="p-3 bg-muted rounded-full">
            <Gem className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Базовый тариф (Бесплатно)</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
              Подключите премиум-тариф, чтобы получать больше заказов и
              выделиться среди конкурентов.
            </p>
          </div>
          <Button asChild>
            <Link href="/pricing">Выбрать тариф</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // 2. STATE: User has an active OR expired Premium Plan
  return (
    <div className="space-y-6 w-full">
      {/* Expiration Alert Banner */}
      {isExpired && (
        <Alert
          variant="destructive"
          className="border-red-500 bg-red-50 dark:bg-red-900/10"
        >
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="font-bold text-red-800 dark:text-red-300">
            Подписка истекла
          </AlertTitle>
          <AlertDescription className="text-red-700 dark:text-red-400">
            Ваш тариф &laquo;{subscription?.planName}&raquo; завершился. Профиль
            временно переведен на базовый уровень. Продлите подписку для
            возврата премиум-функций.
          </AlertDescription>
        </Alert>
      )}

      <Card
        className={cn(
          "overflow-hidden shadow-sm transition-all",
          isExpired
            ? "border-red-200 grayscale opacity-90"
            : "border-primary/20",
        )}
      >
        <CardHeader
          className={cn("pb-4", isExpired ? "bg-muted/50" : "bg-primary/5")}
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <CardTitle className="text-xl flex items-center gap-2">
                <Gem
                  className={cn(
                    "h-5 w-5",
                    isExpired ? "text-muted-foreground" : "text-primary",
                  )}
                />
                {subscription?.planName}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {isExpired
                  ? "Действие тарифа завершено"
                  : "Активный тарифный план"}
              </p>
            </div>
            <Badge
              className={
                isExpired ? "bg-destructive" : "bg-green-600 hover:bg-green-700"
              }
            >
              {isExpired ? "Истекла" : "Активна"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-6 grid sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
            <div
              className={cn(
                "p-2 rounded-full",
                isExpired ? "bg-muted" : "bg-blue-100 dark:bg-blue-900/30",
              )}
            >
              <CalendarClock
                className={cn(
                  "h-4 w-4",
                  isExpired ? "text-muted-foreground" : "text-blue-600",
                )}
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                {isExpired ? "Завершилась" : "Следующее списание"}
              </p>
              <p className="font-medium text-sm">
                {subscription?.endDate
                  ? format(new Date(subscription.endDate), "d MMMM yyyy", {
                      locale: ru,
                    })
                  : "Бессрочно"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
            <div
              className={cn(
                "p-2 rounded-full",
                isExpired ? "bg-muted" : "bg-purple-100 dark:bg-purple-900/30",
              )}
            >
              <CreditCard
                className={cn(
                  "h-4 w-4",
                  isExpired ? "text-muted-foreground" : "text-purple-600",
                )}
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Стоимость</p>
              <p className="font-medium text-sm">
                {/* Use optional chaining safely in case pricePaid doesn't exist on all backend responses */}
                {subscription?.pricePaid && subscription.pricePaid > 0
                  ? `${subscription.pricePaid.toLocaleString("ru-RU")} ₽`
                  : "Бесплатно"}
              </p>
            </div>
          </div>

          <div className="sm:col-span-2 mt-2">
            <Button
              variant={isExpired ? "default" : "outline"}
              className="w-full"
              asChild
            >
              <Link href="/pricing">
                {isExpired ? "Продлить подписку" : "Изменить тариф"}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
