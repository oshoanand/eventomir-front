"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { apiRequest } from "@/utils/api-client";
import { getSubscriptionPlans, SubscriptionPlan } from "@/services/payment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  CreditCard,
  Wallet,
  FileText,
  ArrowLeft,
  Tag,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

// ---------------------------------------------------------------------------
// INNER COMPONENT (Requires Suspense because of useSearchParams)
// ---------------------------------------------------------------------------
function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { status: sessionStatus } = useSession();

  const planId = searchParams.get("planId");
  const interval = searchParams.get("interval");

  const [isLoading, setIsLoading] = useState(true);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [user, setUser] = useState<any>(null);

  // Оплата
  const [selectedMethod, setSelectedMethod] = useState<
    "card" | "wallet" | "invoice"
  >("card");
  const [isProcessing, setIsProcessing] = useState(false);

  // Промокод
  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState<string | null>(null);
  const [isVerifyingPromo, setIsVerifyingPromo] = useState(false);
  const [promoData, setPromoData] = useState<{
    valid: boolean;
    discountAmount: number;
    finalPrice: number;
    code: string;
  } | null>(null);

  // --- NEW: Состояния для пополнения кошелька ---
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<string>("");
  const [isProcessingTopUp, setIsProcessingTopUp] = useState(false);
  const PRESET_AMOUNTS = [500, 1000, 2000, 5000];

  // Загрузка начальных данных
  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login?callbackUrl=/pricing");
      return;
    }

    if (!planId || !interval) {
      router.push("/pricing");
      return;
    }

    const fetchData = async () => {
      try {
        const [plans, userData] = await Promise.all([
          getSubscriptionPlans(),
          apiRequest({ method: "get", url: "/api/users/me" }),
        ]);

        const selected = plans.find((p) => p.id === planId);
        if (!selected) throw new Error("Plan not found");

        setPlan(selected);
        setUser(userData);
      } catch (error) {
        toast({ variant: "destructive", title: "Ошибка загрузки данных" });
        router.push("/pricing");
      } finally {
        setIsLoading(false);
      }
    };

    if (sessionStatus === "authenticated") fetchData();
  }, [planId, interval, sessionStatus, router, toast]);

  // Расчет базовой цены
  let basePrice = 0;
  if (plan) {
    if (interval === "month") basePrice = plan.priceMonthly;
    if (interval === "half_year")
      basePrice = plan.priceHalfYearly || plan.priceMonthly * 6;
    if (interval === "year")
      basePrice = plan.priceYearly || plan.priceMonthly * 12;
  }

  const finalPrice = promoData ? promoData.finalPrice : basePrice;
  const isB2B =
    user &&
    ["individualEntrepreneur", "legalEntity", "agency"].includes(
      user.account_type,
    );
  const isWalletSufficient = user && user.walletBalance >= finalPrice;
  const shortfall = finalPrice - (user?.walletBalance || 0);

  // Обработчик применения промокода
  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setIsVerifyingPromo(true);
    setPromoError(null);
    try {
      const res = await apiRequest<any>({
        method: "post",
        url: "/api/promo-codes/validate",
        data: { code: promoInput.trim(), planId, interval },
      });
      setPromoData({
        valid: true,
        discountAmount: res.discountAmount,
        finalPrice: res.finalPrice,
        code: promoInput.trim(),
      });
      toast({
        variant: "success",
        title: "Промокод применен!",
        className: "bg-green-50 border-green-200",
      });
    } catch (error: any) {
      setPromoData(null);
      setPromoError(error.response?.data?.message || "Неверный промокод");
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.response?.data?.message || "Неверный промокод",
      });
    } finally {
      setIsVerifyingPromo(false);
    }
  };

  // Обработчик оформления заказа
  const handleCheckout = async () => {
    setIsProcessing(true);
    try {
      const response = await apiRequest<any>({
        method: "post",
        url: `/api/payments/${planId}/purchase`,
        data: {
          interval,
          paymentMethod: selectedMethod,
          promoCode: promoData?.code || undefined,
        },
      });

      if (selectedMethod === "invoice") {
        router.push(`/pricing?b2b_payment=success`);
      } else if (selectedMethod === "wallet") {
        router.push(`/pricing?subscription=success`);
      } else {
        // Редирект на Tinkoff
        window.location.href = response.checkoutUrl;
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка оплаты",
        description:
          error.response?.data?.message || "Произошла ошибка при оформлении",
      });
      setIsProcessing(false);
    }
  };

  // --- NEW: Обработчик пополнения кошелька ---
  const handleTopUp = async () => {
    const amount = parseInt(topUpAmount, 10);
    if (!amount || amount < 100) {
      toast({ variant: "destructive", title: "Минимальная сумма — 100 ₽" });
      return;
    }

    setIsProcessingTopUp(true);
    try {
      const response = await apiRequest<any>({
        method: "post",
        url: "/api/payments/wallet/topup",
        data: { amount },
      });

      // Перенаправляем на шлюз Тинькофф для оплаты пополнения
      window.location.href = response.checkoutUrl;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description:
          error.response?.data?.message || "Не удалось инициировать пополнение",
      });
      setIsProcessingTopUp(false);
    }
  };

  // Скелетон загрузки
  if (isLoading) {
    return (
      <div className="container max-w-5xl mx-auto py-16 px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-4">
          <Skeleton className="h-[400px] w-full rounded-3xl" />
        </div>
        <div className="lg:col-span-5">
          <Skeleton className="h-[500px] w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  const intervalLabel =
    interval === "year"
      ? "Годовая подписка"
      : interval === "half_year"
        ? "Подписка на 6 месяцев"
        : "Ежемесячная подписка";

  return (
    <div className="min-h-screen bg-muted/10 pb-20">
      {/* Шапка (Header) */}
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="container max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/pricing"
            className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Назад к тарифам
          </Link>
          <div className="flex items-center text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
            <ShieldCheck className="w-4 h-4 mr-1.5" /> Безопасная оплата
          </div>
        </div>
      </header>

      <div className="container max-w-5xl mx-auto px-4 py-8 md:py-12">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-8">
          Оформление заказа
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* ЛЕВАЯ КОЛОНКА: МЕТОДЫ ОПЛАТЫ */}
          <div className="lg:col-span-7 space-y-6">
            <h2 className="text-xl font-bold">Способ оплаты</h2>

            <div className="grid gap-4">
              {/* ОПЛАТА КАРТОЙ (B2C) */}
              <label
                className={cn(
                  "relative flex cursor-pointer rounded-2xl border-2 p-5 transition-all duration-200",
                  selectedMethod === "card"
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border/60 hover:border-primary/50 bg-card",
                )}
              >
                <div className="flex w-full justify-between items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-100 text-blue-600 p-3 rounded-full shrink-0">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-lg">
                        Банковская карта
                      </p>
                      <p className="text-sm text-muted-foreground font-medium mt-0.5">
                        Tinkoff, Сбербанк, МИР, Visa
                      </p>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0",
                      selectedMethod === "card"
                        ? "border-primary"
                        : "border-muted-foreground/30",
                    )}
                  >
                    {selectedMethod === "card" && (
                      <div className="w-3 h-3 bg-primary rounded-full" />
                    )}
                  </div>
                </div>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  className="sr-only"
                  checked={selectedMethod === "card"}
                  onChange={() => setSelectedMethod("card")}
                />
              </label>

              {/* ОПЛАТА КОШЕЛЬКОМ */}
              <label
                className={cn(
                  "relative flex rounded-2xl border-2 p-5 transition-all duration-200",
                  isWalletSufficient
                    ? "cursor-pointer"
                    : "opacity-60 cursor-not-allowed",
                  selectedMethod === "wallet"
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border/60 bg-card",
                  !isWalletSufficient && "bg-muted/30",
                )}
              >
                <div className="flex w-full justify-between items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "p-3 rounded-full shrink-0",
                        isWalletSufficient
                          ? "bg-emerald-100 text-emerald-600"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Wallet className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-lg flex items-center gap-2">
                        Внутренний кошелек
                      </p>
                      <p className="text-sm text-muted-foreground font-medium mt-0.5">
                        Баланс:{" "}
                        <span className="font-bold text-foreground">
                          {user?.walletBalance.toLocaleString("ru-RU")} ₽
                        </span>
                      </p>
                      {/* Interactive Top-Up Button replaces the old Link */}
                      {!isWalletSufficient && (
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              // Prefill the input with the exact shortfall, or 1000 default
                              setTopUpAmount(
                                shortfall > 0 ? shortfall.toString() : "1000",
                              );
                              setIsTopUpModalOpen(true);
                            }}
                            className="inline-flex items-center text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-full transition-colors"
                          >
                            <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
                            Пополнить на {shortfall.toLocaleString("ru-RU")} ₽
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0",
                      selectedMethod === "wallet"
                        ? "border-primary"
                        : "border-muted-foreground/30",
                    )}
                  >
                    {selectedMethod === "wallet" && (
                      <div className="w-3 h-3 bg-primary rounded-full" />
                    )}
                  </div>
                </div>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="wallet"
                  className="sr-only"
                  disabled={!isWalletSufficient}
                  checked={selectedMethod === "wallet"}
                  onChange={() => setSelectedMethod("wallet")}
                />
              </label>

              {/* ОПЛАТА ПО СЧЕТУ (B2B) */}
              <label
                className={cn(
                  "relative flex rounded-2xl border-2 p-5 transition-all duration-200",
                  isB2B
                    ? "cursor-pointer"
                    : "opacity-60 cursor-not-allowed bg-muted/30",
                  selectedMethod === "invoice"
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border/60 bg-card",
                )}
              >
                <div className="flex w-full justify-between items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "p-3 rounded-full shrink-0",
                        isB2B
                          ? "bg-amber-100 text-amber-600"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-foreground text-lg">
                          Оплата по счету
                        </p>
                        {!isB2B && (
                          <span className="bg-muted-foreground/20 text-muted-foreground text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
                            Только юр. лица
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground font-medium mt-0.5">
                        Счет для ИП и Юр. лиц (без НДС)
                      </p>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0",
                      selectedMethod === "invoice"
                        ? "border-primary"
                        : "border-muted-foreground/30",
                    )}
                  >
                    {selectedMethod === "invoice" && (
                      <div className="w-3 h-3 bg-primary rounded-full" />
                    )}
                  </div>
                </div>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="invoice"
                  className="sr-only"
                  disabled={!isB2B}
                  checked={selectedMethod === "invoice"}
                  onChange={() => setSelectedMethod("invoice")}
                />
              </label>
            </div>
          </div>

          {/* ПРАВАЯ КОЛОНКА: ДЕТАЛИ ЗАКАЗА */}
          <div className="lg:col-span-5">
            <div className="bg-card border border-border/60 shadow-xl shadow-black/5 rounded-[2rem] p-6 sm:p-8 sticky top-24">
              <h2 className="text-xl font-bold mb-6">Ваш заказ</h2>

              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="font-bold text-lg">{plan?.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {intervalLabel}
                  </p>
                </div>
                <p className="font-bold text-lg">
                  {basePrice.toLocaleString("ru-RU")} ₽
                </p>
              </div>

              <div className="border-t border-b border-border/50 py-6 mb-6 space-y-4">
                {/* ПРОМОКОД */}
                {!promoData?.valid ? (
                  <div className="space-y-2">
                    <Label className="text-xs uppercase font-bold text-muted-foreground">
                      Промокод
                    </Label>
                    <div className="flex gap-2">
                      <div className="relative flex-grow">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Введите код"
                          className={cn(
                            "pl-9 h-11 bg-muted/20 transition-colors",
                            promoError &&
                              "border-red-500 focus-visible:ring-red-500",
                          )}
                          value={promoInput}
                          onChange={(e) => {
                            setPromoInput(e.target.value.toUpperCase());
                            if (promoError) setPromoError(null);
                          }}
                          disabled={isVerifyingPromo}
                        />
                      </div>
                      <Button
                        variant="secondary"
                        className="h-11 font-bold"
                        onClick={handleApplyPromo}
                        disabled={!promoInput.trim() || isVerifyingPromo}
                      >
                        {isVerifyingPromo ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Применить"
                        )}
                      </Button>
                    </div>

                    {promoError && (
                      <p className="text-xs text-red-500 font-medium animate-in fade-in slide-in-from-top-1">
                        {promoError}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 text-green-800 p-3 rounded-xl animate-in zoom-in-95">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-bold">
                          Промокод {promoData.code}
                        </p>
                        <p className="text-xs text-green-700">
                          Скидка применена
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-red-700 hover:bg-red-100 hover:text-red-900"
                      onClick={() => {
                        setPromoData(null);
                        setPromoInput("");
                      }}
                    >
                      Удалить
                    </Button>
                  </div>
                )}

                {/* ПОДИТОГ */}
                <div className="space-y-2 text-sm font-medium">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Сумма</span>
                    <span>{basePrice.toLocaleString("ru-RU")} ₽</span>
                  </div>
                  {promoData && (
                    <div className="flex justify-between text-green-600 font-bold">
                      <span>Скидка</span>
                      <span>
                        -{promoData.discountAmount.toLocaleString("ru-RU")} ₽
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* ИТОГ К ОПЛАТЕ */}
              <div className="flex justify-between items-end mb-8">
                <span className="text-lg font-bold">Итого к оплате</span>
                <span className="text-4xl font-black text-primary">
                  {finalPrice.toLocaleString("ru-RU")} ₽
                </span>
              </div>

              <Button
                size="lg"
                className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
                onClick={handleCheckout}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />{" "}
                    Оформление...
                  </>
                ) : (
                  `Оплатить ${finalPrice.toLocaleString("ru-RU")} ₽`
                )}
              </Button>
              <p className="text-center text-xs text-muted-foreground mt-4 leading-relaxed">
                Нажимая кнопку «Оплатить», вы соглашаетесь с условиями <br />{" "}
                <Link href="/terms" className="underline hover:text-primary">
                  оферты
                </Link>{" "}
                и{" "}
                <Link href="/privacy" className="underline hover:text-primary">
                  политикой конфиденциальности
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- NEW: МОДАЛЬНОЕ ОКНО ПОПОЛНЕНИЯ КОШЕЛЬКА --- */}
      <Dialog open={isTopUpModalOpen} onOpenChange={setIsTopUpModalOpen}>
        <DialogContent className="sm:max-w-md rounded-[2rem] p-0 overflow-hidden border-0 shadow-2xl">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Wallet className="w-6 h-6 text-emerald-400" />
                Пополнение кошелька
              </DialogTitle>
              <DialogDescription className="text-slate-300 mt-2">
                Текущий баланс:{" "}
                <strong className="text-white">
                  {user?.walletBalance.toLocaleString("ru-RU")} ₽
                </strong>
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-6 bg-background">
            {shortfall > 0 && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm p-4 rounded-xl flex items-start gap-3">
                <div className="mt-0.5">⚠️</div>
                <p>
                  Для оплаты тарифа вам не хватает{" "}
                  <strong>{shortfall.toLocaleString("ru-RU")} ₽</strong>.
                  Пополните кошелек, чтобы продолжить.
                </p>
              </div>
            )}

            <div className="space-y-3">
              <Label className="font-bold text-muted-foreground">
                Выберите сумму или введите свою
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_AMOUNTS.map((amt) => (
                  <Button
                    key={amt}
                    type="button"
                    variant={
                      topUpAmount === amt.toString() ? "default" : "outline"
                    }
                    className={cn(
                      "rounded-xl h-12 font-bold transition-all",
                      topUpAmount === amt.toString() && "shadow-md",
                    )}
                    onClick={() => setTopUpAmount(amt.toString())}
                  >
                    {amt.toLocaleString("ru-RU")} ₽
                  </Button>
                ))}
              </div>
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">
                ₽
              </span>
              <Input
                type="number"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                className="pl-9 h-14 text-lg font-bold rounded-xl bg-muted/30 focus-visible:ring-primary border-border/60"
                placeholder="Сумма пополнения"
              />
            </div>

            <Button
              className="w-full h-14 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
              onClick={handleTopUp}
              disabled={
                isProcessingTopUp || !topUpAmount || parseInt(topUpAmount) < 100
              }
            >
              {isProcessingTopUp ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Переход к
                  оплате...
                </>
              ) : (
                `Пополнить картой`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MAIN EXPORT (Wraps the component in Suspense)
// ---------------------------------------------------------------------------
export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="container max-w-5xl mx-auto py-16 px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-4">
            <Skeleton className="h-[400px] w-full rounded-3xl" />
          </div>
          <div className="lg:col-span-5">
            <Skeleton className="h-[500px] w-full rounded-3xl" />
          </div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
