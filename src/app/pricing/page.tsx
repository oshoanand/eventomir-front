"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/utils";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  getSubscriptionPlans,
  getCurrentSubscription,
  initiateCheckout,
  SubscriptionPlan,
  BillingInterval,
  UserSubscription,
} from "@/services/payment";

const PricingPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // --- State ---
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSub, setCurrentSub] = useState<UserSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [interval, setInterval] = useState<BillingInterval>("month");

  // Check for payment status in URL
  const paymentStatus = searchParams.get("status");

  // --- Effects ---

  // 1. Handle Payment Success/Error Feedback from URL
  useEffect(() => {
    if (paymentStatus === "success") {
      toast({
        title: "Оплата прошла успешно!",
        description: "Ваша подписка была успешно обновлена.",
        variant: "default",
        className: "bg-green-600 text-white border-green-700",
      });
      // Clean URL without reloading
      router.replace("/pricing");
    } else if (paymentStatus === "error") {
      toast({
        variant: "destructive",
        title: "Ошибка оплаты",
        description:
          "Произошла ошибка при обработке платежа. Попробуйте снова.",
      });
    }
  }, [paymentStatus, router, toast]);

  // 2. Fetch Data (Plans & Current Subscription)
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Run fetches in parallel
        const [fetchedPlans, fetchedSub] = await Promise.all([
          getSubscriptionPlans(),
          status === "authenticated"
            ? getCurrentSubscription()
            : Promise.resolve(null),
        ]);

        setPlans(fetchedPlans);
        setCurrentSub(fetchedSub);
      } catch (error) {
        console.error("Failed to load pricing data:", error);
        toast({
          variant: "destructive",
          title: "Ошибка",
          description: "Не удалось загрузить тарифные планы.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [status, toast]);

  // --- Handlers ---

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    // 1. Auth Check
    if (status === "unauthenticated") {
      toast({
        title: "Требуется авторизация",
        description: "Пожалуйста, войдите в систему или зарегистрируйтесь.",
      });
      router.push(`/login?callbackUrl=/pricing`);
      return;
    }

    // 2. Determine Price based on selected interval
    const { price } = getPriceDetails(plan);

    // 3. Handle Free/Zero Price Logic
    // If it's free or user is just switching to a free tier
    if (price === 0 || plan.tier === "FREE") {
      // If user already has this specific free plan active, do nothing (handled by button disable)
      // Otherwise, redirect to profile or specific activation logic
      router.push("/performer-profile");
      return;
    }

    // 4. Initiate Payment
    setProcessingPlanId(plan.id);
    try {
      // Pass plan ID and the selected interval (month, year, etc.)
      const { checkoutUrl } = await initiateCheckout(plan.id, interval);

      // Redirect to Payment Gateway
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось перейти к оплате. Попробуйте позже.",
      });
      setProcessingPlanId(null);
    }
  };

  // --- Helpers ---

  const getPriceDetails = (plan: SubscriptionPlan) => {
    let price = plan.priceMonthly;
    let periodLabel = "/ мес";
    let savingsPercent = 0;

    if (interval === "half_year" && plan.priceHalfYearly) {
      price = plan.priceHalfYearly;
      periodLabel = "/ 6 мес";
      // Calculate savings vs (Monthly * 6)
      const theoretical = plan.priceMonthly * 6;
      if (theoretical > 0) {
        savingsPercent = Math.round(
          ((theoretical - price) / theoretical) * 100,
        );
      }
    } else if (interval === "year" && plan.priceYearly) {
      price = plan.priceYearly;
      periodLabel = "/ год";
      // Calculate savings vs (Monthly * 12)
      const theoretical = plan.priceMonthly * 12;
      if (theoretical > 0) {
        savingsPercent = Math.round(
          ((theoretical - price) / theoretical) * 100,
        );
      }
    }

    return { price, periodLabel, savingsPercent };
  };

  // --- Render Components ---

  const PlanSkeleton = () => (
    <Card className="flex flex-col h-[500px]">
      <CardHeader className="p-6 space-y-4">
        <Skeleton className="h-8 w-1/2 mx-auto" />
        <Skeleton className="h-4 w-3/4 mx-auto" />
      </CardHeader>
      <CardContent className="p-6 flex-grow space-y-6">
        <Skeleton className="h-12 w-1/3 mx-auto" />
        <div className="space-y-3 pt-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      </CardContent>
      <CardFooter className="p-6">
        <Skeleton className="h-12 w-full" />
      </CardFooter>
    </Card>
  );

  return (
    <div className="container mx-auto py-16 px-4">
      <div className="text-center mb-10 space-y-4">
        <h1 className="text-3xl lg:text-5xl font-bold tracking-tight">
          Тарифные планы
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
          {currentSub
            ? "Управляйте вашей текущей подпиской или выберите новый уровень возможностей."
            : "Выберите план, который лучше всего подходит для ваших задач."}
        </p>
      </div>

      {/* --- BILLING CYCLE TOGGLE --- */}
      <div className="flex justify-center mb-12">
        <div className="inline-flex items-center p-1 bg-muted rounded-full border">
          <button
            onClick={() => setInterval("month")}
            className={cn(
              "px-6 py-2 rounded-full text-sm font-medium transition-all duration-200",
              interval === "month"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Ежемесячно
          </button>
          <button
            onClick={() => setInterval("half_year")}
            className={cn(
              "px-6 py-2 rounded-full text-sm font-medium transition-all duration-200",
              interval === "half_year"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            6 Месяцев
          </button>
          <button
            onClick={() => setInterval("year")}
            className={cn(
              "px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 relative",
              interval === "year"
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Годовой
            <span className="absolute -top-3 -right-2 bg-green-600 text-[10px] text-white px-1.5 py-0.5 rounded-full shadow-sm animate-pulse">
              Выгодно
            </span>
          </button>
        </div>
      </div>

      {/* Success Alert */}
      {paymentStatus === "success" && (
        <Alert className="mb-8 max-w-3xl mx-auto border-green-500 bg-green-50 dark:bg-green-900/20">
          <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-green-800 dark:text-green-300 font-semibold">
            Успешно!
          </AlertTitle>
          <AlertDescription className="text-green-700 dark:text-green-400">
            Подписка оформлена. Теперь вы можете пользоваться всеми
            преимуществами.
          </AlertDescription>
        </Alert>
      )}

      {/* --- PLANS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start max-w-7xl mx-auto">
        {isLoading ? (
          <>
            <PlanSkeleton />
            <PlanSkeleton />
            <PlanSkeleton />
          </>
        ) : (
          plans.map((plan) => {
            const isPremium = plan.tier === "PREMIUM";
            const isProcessing = processingPlanId === plan.id;

            // Logic: Is this the user's current plan?
            const isCurrentPlan =
              currentSub?.planId === plan.id && currentSub?.status === "ACTIVE";

            // Logic: Does user have ANY active subscription?
            const hasActiveSubscription =
              !!currentSub && currentSub.status === "ACTIVE";

            // Calculate Price & Savings based on Interval
            const { price, periodLabel, savingsPercent } =
              getPriceDetails(plan);

            // Handle missing prices for certain intervals
            const isPriceAvailable = price !== undefined && price !== null;

            return (
              <Card
                key={plan.id}
                className={cn(
                  "flex flex-col h-full transition-all duration-300 relative",
                  // Styling logic
                  isCurrentPlan
                    ? "border-2 border-green-500 bg-green-50/10 shadow-md"
                    : isPremium
                      ? "border-2 border-primary shadow-lg scale-105 z-10"
                      : "border-muted hover:shadow-xl",
                  !isPriceAvailable &&
                    "opacity-60 grayscale pointer-events-none",
                )}
              >
                {/* Badges */}
                {isCurrentPlan && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center z-20">
                    <Badge className="bg-green-600 hover:bg-green-700 text-white border-0 px-4 py-1 text-sm shadow-sm">
                      Ваш текущий тариф
                    </Badge>
                  </div>
                )}

                {!isCurrentPlan && isPremium && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center z-20">
                    <Badge className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 border-0 px-4 py-1 text-sm shadow-sm flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> Рекомендуемый
                    </Badge>
                  </div>
                )}

                <CardHeader className="p-6 text-center pt-8">
                  <CardTitle className="text-2xl font-bold">
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="mt-2 h-10 flex items-center justify-center">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6 flex-grow flex flex-col items-center">
                  {isPriceAvailable ? (
                    <div className="text-center mb-6">
                      <div className="flex items-end justify-center gap-1">
                        <span className="text-4xl font-extrabold tracking-tight">
                          {price === 0
                            ? "Бесплатно"
                            : `${price.toLocaleString("ru-RU")} ₽`}
                        </span>
                        {price > 0 && (
                          <span className="text-muted-foreground font-medium mb-1">
                            {periodLabel}
                          </span>
                        )}
                      </div>

                      {savingsPercent > 0 && (
                        <div className="mt-2">
                          <Badge
                            variant="secondary"
                            className="text-green-600 bg-green-100 dark:bg-green-900/30 border-green-200"
                          >
                            Экономия {savingsPercent}%
                          </Badge>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center mb-8 h-[60px] flex items-center justify-center text-muted-foreground">
                      Нет тарифа для этого периода
                    </div>
                  )}

                  <ul className="space-y-4 text-sm w-full text-left pl-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-1 mt-0.5 flex-shrink-0">
                          <Check className="h-3 w-3 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-muted-foreground leading-snug">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="p-6 mt-auto">
                  <Button
                    className={cn(
                      "w-full font-bold h-12 text-base shadow-sm",
                      isCurrentPlan
                        ? "opacity-100 cursor-default" // Active Plan Style
                        : isPremium
                          ? "bg-primary hover:bg-primary/90"
                          : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                    )}
                    size="lg"
                    onClick={() => handleSubscribe(plan)}
                    disabled={
                      isProcessing ||
                      status === "loading" ||
                      !isPriceAvailable ||
                      isCurrentPlan
                    }
                    variant={isCurrentPlan ? "outline" : "default"}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Обработка...
                      </>
                    ) : isCurrentPlan ? (
                      "Тариф активен"
                    ) : hasActiveSubscription ? (
                      "Изменить тариф" // Logic: If user has ANY sub but not this one
                    ) : price === 0 ? (
                      "Начать бесплатно"
                    ) : (
                      "Выбрать тариф"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>

      {/* --- SUPPORT LINK --- */}
      <div className="text-center mt-20 p-8 bg-muted/30 rounded-xl max-w-4xl mx-auto border border-dashed">
        <h3 className="font-semibold text-lg mb-2">Нужна помощь с выбором?</h3>
        <p className="text-muted-foreground mb-4">
          Свяжитесь с нашей поддержкой, и мы подберем индивидуальные условия для
          вашего бизнеса.
        </p>
        <Button variant="link" asChild className="text-primary font-semibold">
          <a href="/support">Написать в поддержку &rarr;</a>
        </Button>
      </div>
    </div>
  );
};

export default PricingPage;
