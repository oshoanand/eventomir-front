"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  Banknote,
  PlusCircle,
  Loader2,
  CreditCard,
} from "lucide-react";

// --- API & Hooks ---
import { apiRequest } from "@/utils/api-client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/utils/utils";

// --- UI Components ---
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const PRESET_AMOUNTS = [500, 1000, 2000, 5000];

export default function FinanceTab({ profile }: { profile: any }) {
  const router = useRouter();
  const { toast } = useToast();

  // Encapsulated Local State
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<string>("1000");
  const [isProcessingTopUp, setIsProcessingTopUp] = useState(false);

  // Fetch Wallet Balance dynamically
  const fetchWallet = useCallback(async () => {
    try {
      const data = await apiRequest<{ walletBalance: number }>({
        method: "get",
        url: "/api/users/me",
      });
      setWalletBalance(data.walletBalance || 0);
    } catch (error) {
      console.error("Failed to fetch wallet", error);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  // Payment Handler
  const handleTopUp = async () => {
    const amount = parseInt(topUpAmount, 10);
    if (isNaN(amount) || amount < 100) {
      toast({
        variant: "destructive",
        title: "Некорректная сумма",
        description: "Минимальная сумма пополнения — 100 ₽",
      });
      return;
    }

    setIsProcessingTopUp(true);
    try {
      const response = await apiRequest<{ paymentUrl: string }>({
        method: "post",
        url: "/api/wallet/topup/performer",
        data: { amount },
      });

      if (response.paymentUrl) {
        toast({ variant: "default", title: "Переход к оплате..." });
        // Redirect to YooKassa / Robokassa
        window.location.href = response.paymentUrl;
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description:
          error.message || "Не удалось создать платеж. Попробуйте позже.",
      });
    } finally {
      setIsProcessingTopUp(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Platform Wallet Card */}
        <div className="bg-gradient-to-br from-orange-600 to-orange-500 rounded-3xl p-6 shadow-md text-white relative overflow-hidden">
          <Wallet className="absolute right-[-20px] bottom-[-20px] w-40 h-40 opacity-10 pointer-events-none" />
          <p className="text-white font-medium mb-2 relative z-10">
            Баланс кошелька Eventomir
          </p>
          <h3 className="text-4xl font-black mb-6 relative z-10">
            {walletBalance.toLocaleString("ru-RU")}{" "}
            <span className="text-2xl text-white/80">₽</span>
          </h3>
          <Button
            onClick={() => setIsTopUpModalOpen(true)}
            className="w-full bg-white text-black hover:bg-gray-100 font-bold rounded-xl h-12 relative z-10 transition-colors shadow-sm"
          >
            Пополнить баланс
          </Button>
        </div>

        {/* 2. Bank Requisites Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-border/40 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="w-6 h-6 text-green-600" />
            <h3 className="font-bold text-md">Реквизиты для выплат</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-5">
            Укажите реквизиты для получения выплат за заказы. Мы поддерживаем
            переводы на карты РФ и расчетные счета ИП/ООО.
          </p>

          <div className="space-y-4 mt-auto">
            {profile.bankDetails && profile.bankDetails.length > 0 ? (
              profile.bankDetails.map((bank: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3.5 border border-border/60 rounded-xl flex items-center justify-between bg-muted/10 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-7 bg-blue-100 rounded flex items-center justify-center text-[10px] font-bold text-blue-800 tracking-wider">
                      {bank.cardType || "CARD"}
                    </div>
                    <div>
                      <p className="text-sm font-bold">
                        •••• {bank.accountNumber?.slice(-4) || "****"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {bank.bankName}
                      </p>
                    </div>
                  </div>
                  {bank.isDefault && (
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-600 border-green-200 font-bold"
                    >
                      Основная
                    </Badge>
                  )}
                </div>
              ))
            ) : (
              <div className="p-4 border border-dashed border-border/60 rounded-xl text-center text-sm text-muted-foreground bg-muted/20">
                Реквизиты пока не добавлены
              </div>
            )}

            <Button
              variant="outline"
              onClick={() => router.push("/settings")}
              className="w-full border-dashed border-border/80 rounded-xl h-12 font-bold text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              <PlusCircle className="w-4 h-4 mr-2" /> Настроить реквизиты
            </Button>
          </div>
        </div>
      </div>

      {/* --- TOP UP MODAL DIALOG --- */}
      <Dialog open={isTopUpModalOpen} onOpenChange={setIsTopUpModalOpen}>
        <DialogContent className="sm:max-w-md rounded-[2rem] p-0 overflow-hidden border-0 shadow-2xl">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white relative">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -z-0" />

            <DialogHeader className="relative z-10">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Wallet className="w-6 h-6 text-emerald-400" />
                Пополнение кошелька
              </DialogTitle>
              <DialogDescription className="text-slate-300 mt-2 text-base">
                Текущий баланс:{" "}
                <strong className="text-white text-lg ml-1">
                  {walletBalance.toLocaleString("ru-RU")} ₽
                </strong>
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-6 bg-background text-foreground">
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
                      "rounded-xl h-12 font-bold transition-all border-border/50",
                      topUpAmount === amt.toString()
                        ? "shadow-md bg-primary text-primary-foreground border-transparent"
                        : "bg-muted/30 hover:bg-muted",
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
              className="w-full h-14 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
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
                "Пополнить картой"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
