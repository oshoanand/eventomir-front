"use client";

import { useState, useEffect, Suspense } from "react";
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
import { Check, Loader2, Sparkles, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/utils";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

import {
  getSubscriptionPlans,
  getCurrentSubscription,
  SubscriptionPlan,
  BillingInterval,
  UserSubscription,
} from "@/services/payment";
import { apiRequest } from "@/utils/api-client";

// --- 1. Skeletons ---
const PlanSkeleton = () => (
  <Card className="flex flex-col h-[650px] border-muted/50 rounded-2xl">
    <CardHeader className="p-8 space-y-4">
      <Skeleton className="h-8 w-1/2 mx-auto" />
      <Skeleton className="h-4 w-3/4 mx-auto" />
    </CardHeader>
    <CardContent className="p-8 flex-grow space-y-8">
      <Skeleton className="h-16 w-2/3 mx-auto" />
      <div className="space-y-5 pt-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-5 w-full" />
        ))}
      </div>
    </CardContent>
    <CardFooter className="p-8 mt-auto">
      <Skeleton className="h-14 w-full" />
    </CardFooter>
  </Card>
);

// Helper to map backend JSON keys to readable Russian text (Fallback for legacy data)
const FEATURE_TRANSLATIONS: Record<string, string> = {
  maxPhotoUpload: "Макс. фотографий",
  emailSupport: "Поддержка по Email",
  chatSupport: "Поддержка в Чате",
  telephonicSupport: "Телефонная поддержка",
  prioritySupport: "Приоритетная поддержка",
  profileSeo: "SEO настройка профиля",
  profileMarketing: "Маркетинг профиля",
  portfolioPromotion: "Продвижение портфолио",
};

// --- 2. Inner Component ---
const PricingContent = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSub, setCurrentSub] = useState<UserSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>("month");

  const paymentStatus = searchParams.get("subscription");
  const b2bPaymentStatus = searchParams.get("b2b_payment"); // NEW: For B2B callback tracking

  // Handle Payment Feedback
  useEffect(() => {
    if (paymentStatus === "success") {
      toast({
        title: "Оплата прошла успешно!",
        description: "Ваша подписка была успешно обновлена.",
        variant: "default",
      });
      router.replace("/pricing");
    } else if (paymentStatus === "error" || paymentStatus === "failed") {
      toast({
        variant: "destructive",
        title: "Ошибка оплаты",
        description:
          "Произошла ошибка при обработке платежа. Попробуйте снова.",
      });
      router.replace("/pricing");
    } else if (paymentStatus === "success_b2b") {
      // Custom toast for Invoice generation
      toast({
        title: "Счет успешно сформирован!",
        description:
          "Мы отправили счет на вашу электронную почту. Подписка будет активирована после поступления средств.",
        variant: "default",
      });
      router.replace("/pricing");
    }

    // Handle standard B2B Tinkoff callbacks if they use the b2b_payment parameter
    if (b2bPaymentStatus === "success") {
      toast({
        title: "Счет успешно сформирован!",
        description: "Инструкции по оплате отправлены на ваш Email.",
        variant: "default",
      });
      router.replace("/pricing");
    } else if (b2bPaymentStatus === "failed") {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось сформировать счет на оплату.",
      });
      router.replace("/pricing");
    }
  }, [paymentStatus, b2bPaymentStatus, router, toast]);

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const promises: Promise<any>[] = [getSubscriptionPlans()];

        if (status === "authenticated") {
          promises.push(getCurrentSubscription());
        } else {
          promises.push(Promise.resolve(null));
        }

        const [fetchedPlans, fetchedSub] = await Promise.all(promises);

        setPlans(fetchedPlans);
        setCurrentSub(fetchedSub);
      } catch (error) {
        console.error("Failed to load pricing data:", error);
        toast({
          variant: "destructive",
          title: "Ошибка",
          description: "Не удалось загрузить данные тарифов.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [status, toast]);

  // Pricing Logic
  const getPriceDetails = (plan: SubscriptionPlan) => {
    let price = plan.priceMonthly;
    let periodLabel = "/ мес";
    let savingsPercent = 0;

    if (
      billingInterval === "half_year" &&
      plan.priceHalfYearly !== null &&
      plan.priceHalfYearly !== undefined
    ) {
      price = plan.priceHalfYearly;
      periodLabel = "/ 6 мес";
      const theoretical = plan.priceMonthly * 6;
      if (theoretical > 0) {
        savingsPercent = Math.round(
          ((theoretical - price) / theoretical) * 100,
        );
      }
    } else if (
      billingInterval === "year" &&
      plan.priceYearly !== null &&
      plan.priceYearly !== undefined
    ) {
      price = plan.priceYearly;
      periodLabel = "/ год";
      const theoretical = plan.priceMonthly * 12;
      if (theoretical > 0) {
        savingsPercent = Math.round(
          ((theoretical - price) / theoretical) * 100,
        );
      }
    }

    return { price, periodLabel, savingsPercent };
  };

  const handleSubscribeClick = (plan: SubscriptionPlan) => {
    if (status === "unauthenticated") {
      toast({
        title: "Требуется авторизация",
        description: "Пожалуйста, войдите в систему или зарегистрируйтесь.",
      });
      router.push(`/login?callbackUrl=/pricing`);
      return;
    }

    const { price } = getPriceDetails(plan);

    if (price === 0 || plan.tier === "FREE") {
      router.push("/performer-profile");
      return;
    }

    // 🚨 ROBUST FIX: Redirect directly to the dedicated checkout page
    router.push(
      `/subscription/checkout?planId=${plan.id}&interval=${billingInterval}`,
    );
  };

  return (
    <div className="container mx-auto py-16 px-4 animate-in fade-in duration-700">
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-3xl lg:text-5xl font-bold tracking-tight">
          Тарифные планы
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-muted-foreground">
          {currentSub
            ? "Управляйте вашей текущей подпиской или выберите новый уровень возможностей."
            : "Выберите план, который лучше всего подходит для ваших задач."}
        </p>
      </div>

      {/* BILLING CYCLE TOGGLE */}
      <div className="flex justify-center mb-4 md:mb-16">
        <div className="flex sm:inline-flex w-full md:max-w-[360px] mx-auto items-center p-1 sm:p-1.5 bg-muted/50 rounded-full border shadow-sm">
          <button
            onClick={() => setBillingInterval("month")}
            className={cn(
              "flex-1 sm:flex-none px-1 sm:px-6 py-2 sm:py-2.5 rounded-full text-[11px] sm:text-sm font-semibold transition-all duration-300 whitespace-nowrap",
              billingInterval === "month"
                ? "bg-primary shadow-md text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="hidden sm:inline">Ежемесячно</span>
            <span className="sm:hidden">1 мес.</span>
          </button>

          <button
            onClick={() => setBillingInterval("half_year")}
            className={cn(
              "flex-1 sm:flex-none px-1 sm:px-6 py-2 sm:py-2.5 rounded-full text-[11px] sm:text-sm font-semibold transition-all duration-300 whitespace-nowrap",
              billingInterval === "half_year"
                ? "bg-primary shadow-md text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="hidden sm:inline">6 Месяцев</span>
            <span className="sm:hidden">6 мес.</span>
          </button>

          <button
            onClick={() => setBillingInterval("year")}
            className={cn(
              "flex-1 sm:flex-none px-1 sm:px-6 py-2 sm:py-2.5 rounded-full text-[11px] sm:text-sm font-semibold transition-all duration-300 relative whitespace-nowrap",
              billingInterval === "year"
                ? "bg-primary shadow-md text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="hidden sm:inline">Годовой</span>
            <span className="sm:hidden">1 год</span>

            <span className="absolute -top-2.5 -right-1 sm:-top-3 sm:-right-3 bg-gradient-to-r from-emerald-500 to-green-600 text-[8px] sm:text-[10px] font-bold text-white px-1.5 sm:px-2 py-0.5 rounded-full shadow-sm animate-pulse z-10">
              Выгодно
            </span>
          </button>
        </div>
      </div>

      {/* PLANS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-8 items-start max-w-7xl mx-auto">
        {isLoading ? (
          <>
            <PlanSkeleton />
            <PlanSkeleton />
            <PlanSkeleton />
          </>
        ) : (
          plans
            .filter((p) => p.isActive)
            .map((plan) => {
              const isPremium = plan.tier === "PREMIUM";
              const isCurrentPlan =
                currentSub?.planId === plan.id &&
                currentSub?.status === "ACTIVE";
              const hasActiveSubscription =
                !!currentSub && currentSub.status === "ACTIVE";

              const { price, periodLabel, savingsPercent } =
                getPriceDetails(plan);
              const isPriceAvailable = price !== undefined && price !== null;

              // 🚨 ROBUST FIX: Parse Rich Feature Objects AND Fallback to Flat
              const displayFeatures = Object.entries(plan.features || {})
                .map(([key, rawValue]) => {
                  const isRichObject =
                    rawValue &&
                    typeof rawValue === "object" &&
                    !Array.isArray(rawValue);

                  const actualValue = isRichObject
                    ? (rawValue as any).value
                    : rawValue;
                  const actualLabel =
                    isRichObject && (rawValue as any).label
                      ? (rawValue as any).label
                      : FEATURE_TRANSLATIONS[key] || key;

                  let included = false;
                  let displayLabel = actualLabel;

                  if (typeof actualValue === "boolean") {
                    included = actualValue;
                  } else if (typeof actualValue === "number") {
                    included = actualValue > 0;
                    displayLabel = `${actualLabel}: ${actualValue > 0 ? actualValue : "Нет"}`;
                  } else {
                    included = !!actualValue;
                    displayLabel = `${actualLabel}: ${actualValue}`;
                  }

                  return { label: displayLabel, included };
                })
                .sort((a, b) => Number(b.included) - Number(a.included));

              return (
                <Card
                  key={plan.id}
                  className={cn(
                    "flex flex-col h-full transition-all duration-500 relative rounded-2xl",
                    isCurrentPlan
                      ? "border-2 border-emerald-500 bg-emerald-50/10 shadow-xl scale-[1.02] z-20"
                      : isPremium
                        ? "border-2 border-primary shadow-2xl scale-105 z-10"
                        : "border-border/60 hover:shadow-xl hover:-translate-y-1 bg-card",
                    !isPriceAvailable &&
                      "opacity-60 grayscale pointer-events-none",
                  )}
                >
                  {/* Badges */}
                  {isCurrentPlan && (
                    <div className="absolute -top-4 left-0 right-0 flex justify-center z-30">
                      <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-1.5 text-xs font-bold shadow-md uppercase tracking-wider rounded-full">
                        Текущий тариф
                      </Badge>
                    </div>
                  )}

                  {!isCurrentPlan && isPremium && (
                    <div className="absolute -top-4 left-0 right-0 flex justify-center z-30">
                      <Badge className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 px-5 py-1.5 text-xs font-bold shadow-md uppercase tracking-wider flex items-center gap-1.5 rounded-full">
                        <Sparkles className="h-3.5 w-3.5" /> Хит продаж
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="p-8 text-center pb-6">
                    <CardTitle className="text-3xl font-extrabold text-foreground/90">
                      {plan.name}
                    </CardTitle>
                    <CardDescription className="mt-3 min-h-[48px] flex items-start justify-center text-sm leading-relaxed">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="px-8 pb-8 flex-grow flex flex-col items-center">
                    {isPriceAvailable ? (
                      <div className="text-center mb-8 w-full border-b border-border/50 pb-8">
                        <div className="flex items-baseline justify-center gap-1.5">
                          <span className="text-5xl font-black tracking-tighter">
                            {price === 0 ? "0" : price.toLocaleString("ru-RU")}
                          </span>
                          <span className="text-2xl font-bold text-muted-foreground mr-1">
                            ₽
                          </span>
                          {price > 0 && (
                            <span className="text-muted-foreground font-medium">
                              {periodLabel}
                            </span>
                          )}
                        </div>

                        {savingsPercent > 0 && (
                          <div className="mt-4">
                            <Badge
                              variant="secondary"
                              className="text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 px-3 py-1 rounded-full text-xs font-bold"
                            >
                              Экономия {savingsPercent}%
                            </Badge>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center mb-8 h-[90px] flex items-center justify-center text-muted-foreground border-b border-border/50 pb-8 w-full">
                        Нет тарифа для этого периода
                      </div>
                    )}

                    {/* FEATURE MATRIX DISPLAY */}
                    <ul className="space-y-3.5 text-[15px] w-full text-left font-medium">
                      {displayFeatures.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3.5">
                          <div
                            className={cn(
                              "rounded-full p-1 mt-0.5 flex-shrink-0 transition-colors",
                              feature.included
                                ? "bg-primary/10"
                                : "bg-muted/50",
                            )}
                          >
                            {feature.included ? (
                              <Check className="h-4 w-4 text-primary" />
                            ) : (
                              <X className="h-4 w-4 text-muted-foreground/40" />
                            )}
                          </div>
                          <span
                            className={cn(
                              "leading-snug pt-0.5 transition-all duration-200",
                              feature.included
                                ? "text-foreground"
                                : "text-muted-foreground/50 line-through decoration-muted-foreground/30",
                            )}
                          >
                            {feature.label}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="p-8 mt-auto pt-0">
                    <Button
                      className={cn(
                        "w-full font-bold h-14 text-base shadow-sm transition-all rounded-xl",
                        isCurrentPlan
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 cursor-default"
                          : isPremium
                            ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md hover:-translate-y-0.5"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-md hover:-translate-y-0.5",
                      )}
                      onClick={() => handleSubscribeClick(plan)}
                      disabled={
                        status === "loading" ||
                        !isPriceAvailable ||
                        isCurrentPlan
                      }
                      variant={isCurrentPlan ? "outline" : "default"}
                    >
                      {isCurrentPlan
                        ? "Тариф активен"
                        : hasActiveSubscription
                          ? "Сменить тариф"
                          : price === 0
                            ? "Начать бесплатно"
                            : "Выбрать тариф"}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })
        )}
      </div>
    </div>
  );
};

const PricingPage = () => {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto py-16 px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            <PlanSkeleton />
            <PlanSkeleton />
            <PlanSkeleton />
          </div>
        </div>
      }
    >
      <PricingContent />
    </Suspense>
  );
};

export default PricingPage;
