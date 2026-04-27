"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Wallet, PlusCircle, CreditCard, Loader2 } from "lucide-react";
import { cn } from "@/utils/utils";

// Define the presets used in the component
const TOP_UP_PRESETS = [500, 1000, 2000, 5000];

interface WalletSectionProps {
  profile: {
    walletBalance?: number;
  };
  isTopUpOpen: boolean;
  setIsTopUpOpen: (open: boolean) => void;
  topUpAmount: string;
  setTopUpAmount: (amount: string) => void;
  handleTopUpWallet: () => void;
  isToppingUp: boolean;
}

export const WalletSection = ({
  profile,
  isTopUpOpen,
  setIsTopUpOpen,
  topUpAmount,
  setTopUpAmount,
  handleTopUpWallet,
  isToppingUp,
}: WalletSectionProps) => {
  return (
    <div className="rounded-[2rem] bg-gradient-to-r from-primary to-primary/80 p-8 text-primary-foreground shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="absolute -right-6 -top-6 w-40 h-40 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      <Wallet className="absolute right-10 top-1/2 -translate-y-1/2 h-32 w-32 opacity-[0.08] pointer-events-none" />

      <div className="relative z-10 text-center md:text-left">
        <p className="text-primary-foreground/80 font-semibold text-sm uppercase tracking-wider mb-1">
          Мой кошелек
        </p>
        <div className="text-5xl font-black tracking-tight">
          {profile.walletBalance?.toLocaleString("ru-RU") || 0}{" "}
          <span className="text-3xl opacity-80">₽</span>
        </div>
      </div>

      {/* TOP-UP MODAL */}
      <Dialog open={isTopUpOpen} onOpenChange={setIsTopUpOpen}>
        <DialogTrigger asChild>
          <Button className="w-full md:w-auto bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border-0 rounded-2xl h-14 px-8 font-bold shadow-none transition-all relative z-10">
            <PlusCircle className="mr-2 h-5 w-5" /> Пополнить баланс
          </Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-md rounded-[2rem] p-0 overflow-hidden border-0 shadow-2xl text-white">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Wallet className="w-6 h-6 text-emerald-400" /> Пополнение
                кошелька
              </DialogTitle>
              <DialogDescription className="text-slate-300 mt-2">
                Текущий баланс:{" "}
                <strong className="text-white">
                  {profile.walletBalance?.toLocaleString("ru-RU")} ₽
                </strong>
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="p-8 space-y-6 bg-background">
            <div className="space-y-3">
              <Label className="font-bold text-muted-foreground">
                Выберите сумму или введите свою
              </Label>
              <div className="grid grid-cols-2 gap-2 text-black/90">
                {TOP_UP_PRESETS.map((amt) => (
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
                className="pl-9 h-14 text-lg text-muted-foreground font-bold rounded-xl bg-muted/30 focus-visible:ring-primary border-border/60"
                placeholder="Сумма пополнения"
              />
            </div>

            <Button
              className="w-full h-14 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
              onClick={handleTopUpWallet}
              disabled={
                isToppingUp || !topUpAmount || parseInt(topUpAmount) < 100
              }
            >
              {isToppingUp ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Переход к
                  оплате...
                </>
              ) : (
                <CreditCard className="mr-2 h-5 w-5" />
              )}{" "}
              Пополнить картой
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
