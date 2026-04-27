"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

import {
  useFinancialSummary,
  useTransactions,
  useEscrowPayments,
  usePayouts,
  useRequestPayout,
  EscrowStatus,
  TransactionType,
  PayoutStatus,
} from "@/services/finance";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/utils/utils";

// --- HELPERS ---
const formatMoney = (amount: number) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(amount);

const EscrowBadge = ({ status }: { status: EscrowStatus }) => {
  const config = {
    AWAITING_PAYMENT: {
      label: "Ожидает оплаты",
      color: "bg-gray-100 text-gray-700",
    },
    HELD: {
      label: "Заморожено (Безопасная сделка)",
      color: "bg-blue-100 text-blue-700",
    },
    RELEASED: { label: "Выплачено", color: "bg-emerald-100 text-emerald-700" },
    REFUNDED: { label: "Возвращено", color: "bg-amber-100 text-amber-700" },
    DISPUTED: { label: "Спор", color: "bg-red-100 text-red-700" },
  };
  const { label, color } = config[status];
  return (
    <span
      className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold", color)}
    >
      {label}
    </span>
  );
};

export default function MyFinancePage() {
  const { status: authStatus } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const { data: summary, isLoading: isLoadingSummary } = useFinancialSummary();
  const { data: transactions } = useTransactions();
  const { data: escrows } = useEscrowPayments();
  const { data: payouts } = usePayouts();
  const requestPayoutMut = useRequestPayout();

  // Payout Modal State
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [paymentDetails, setPaymentDetails] = useState("");

  // Route Protection
  if (authStatus === "loading" || isLoadingSummary) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (authStatus === "unauthenticated") {
    router.push("/login");
    return null;
  }

  const handlePayoutSubmit = () => {
    const amountNum = Number(payoutAmount);
    if (!amountNum || amountNum <= 0)
      return toast({
        variant: "destructive",
        title: "Введите корректную сумму",
      });
    if (amountNum > (summary?.walletBalance || 0))
      return toast({ variant: "destructive", title: "Недостаточно средств" });
    if (!paymentDetails.trim())
      return toast({ variant: "destructive", title: "Укажите реквизиты" });

    requestPayoutMut.mutate(
      { amount: amountNum, paymentDetails },
      {
        onSuccess: () => {
          toast({ title: "Заявка на вывод успешно создана" });
          setIsPayoutModalOpen(false);
          setPayoutAmount("");
          setPaymentDetails("");
        },
        onError: (err: any) =>
          toast({
            variant: "destructive",
            title: "Ошибка",
            description: err.response?.data?.message,
          }),
      },
    );
  };

  return (
    <div className="bg-muted/10 min-h-screen pb-20 pt-10">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Финансы</h1>
            <p className="text-muted-foreground mt-1">
              Управление балансом, безопасными сделками и историей операций.
            </p>
          </div>

          {summary?.userRoles.isPerformer && (
            <Button
              onClick={() => setIsPayoutModalOpen(true)}
              className="rounded-xl font-bold h-12 shadow-sm"
              disabled={summary.walletBalance <= 0}
            >
              <Wallet className="w-4 h-4 mr-2" /> Вывести средства
            </Button>
          )}
        </div>

        {/* --- SUMMARY CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="rounded-3xl border-border/40 shadow-sm bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Доступный баланс
                  </p>
                  <h2 className="text-3xl font-bold text-foreground">
                    {formatMoney(summary?.walletBalance || 0)}
                  </h2>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/40 shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Заморожено (Безопасная сделка)
                  </p>
                  <h2 className="text-2xl font-bold text-foreground">
                    {formatMoney(summary?.heldInEscrow || 0)}
                  </h2>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Средства будут зачислены после завершения мероприятий.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/40 shadow-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    {summary?.userRoles.isPerformer
                      ? "Заработано всего"
                      : "Потрачено всего"}
                  </p>
                  <h2 className="text-2xl font-bold text-foreground">
                    {formatMoney(
                      (summary?.userRoles.isPerformer
                        ? summary.totalEarned
                        : summary?.totalSpent) || 0,
                    )}
                  </h2>
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  {summary?.userRoles.isPerformer ? (
                    <ArrowDownRight className="w-5 h-5" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- TABS --- */}
        <Tabs defaultValue="transactions" className="w-full">
          <TabsList className="mb-6 bg-white p-1 rounded-2xl shadow-sm border border-border/50">
            <TabsTrigger
              value="transactions"
              className="rounded-xl px-6 py-2.5 font-semibold"
            >
              История операций
            </TabsTrigger>
            <TabsTrigger
              value="escrow"
              className="rounded-xl px-6 py-2.5 font-semibold"
            >
              Безопасные сделки
            </TabsTrigger>
            {summary?.userRoles.isPerformer && (
              <TabsTrigger
                value="payouts"
                className="rounded-xl px-6 py-2.5 font-semibold"
              >
                Выводы средств
              </TabsTrigger>
            )}
          </TabsList>

          {/* TAB 1: TRANSACTIONS */}
          <TabsContent value="transactions" className="animate-in fade-in">
            <Card className="rounded-3xl border-border/40 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                {transactions && transactions.length > 0 ? (
                  <div className="divide-y divide-border/50">
                    {transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="p-4 sm:p-6 flex items-center justify-between hover:bg-muted/20 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                              ["PAYOUT", "PAYMENT"].includes(tx.type)
                                ? "bg-red-500/10 text-red-500"
                                : "bg-emerald-500/10 text-emerald-500",
                            )}
                          >
                            {["PAYOUT", "PAYMENT"].includes(tx.type) ? (
                              <ArrowUpRight className="w-5 h-5" />
                            ) : (
                              <ArrowDownRight className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-sm sm:text-base">
                              {tx.description}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(
                                new Date(tx.createdAt),
                                "d MMMM yyyy, HH:mm",
                                { locale: ru },
                              )}
                            </p>
                          </div>
                        </div>
                        <div
                          className={cn(
                            "font-bold text-base sm:text-lg whitespace-nowrap",
                            ["PAYOUT", "PAYMENT"].includes(tx.type)
                              ? "text-foreground"
                              : "text-emerald-600",
                          )}
                        >
                          {["PAYOUT", "PAYMENT"].includes(tx.type) ? "-" : "+"}
                          {formatMoney(tx.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center text-muted-foreground">
                    История операций пуста.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: ESCROW */}
          <TabsContent value="escrow" className="animate-in fade-in">
            <Card className="rounded-3xl border-border/40 shadow-sm overflow-hidden">
              <CardContent className="p-0">
                {escrows && escrows.length > 0 ? (
                  <div className="divide-y divide-border/50">
                    {escrows.map((escrow) => (
                      <div
                        key={escrow.id}
                        className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/20 transition-colors"
                      >
                        <div>
                          <p className="font-semibold text-sm sm:text-base mb-1">
                            Бронь #
                            {escrow.booking?.id.split("-")[0].toUpperCase()}
                            <span className="mx-2 text-muted-foreground font-normal">
                              |
                            </span>
                            {summary?.userRoles.isPerformer
                              ? `Клиент: ${escrow.booking?.customer?.name}`
                              : `Исполнитель: ${escrow.booking?.performer?.user.name}`}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>
                              Дата ивента:{" "}
                              {escrow.booking?.date
                                ? format(
                                    new Date(escrow.booking.date),
                                    "d MMM yyyy",
                                    { locale: ru },
                                  )
                                : "—"}
                            </span>
                            <EscrowBadge status={escrow.escrowStatus} />
                          </div>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="font-bold text-lg">
                            {formatMoney(
                              summary?.userRoles.isPerformer
                                ? escrow.netAmount
                                : escrow.amount,
                            )}
                          </p>
                          {escrow.escrowStatus === "HELD" &&
                            escrow.releaseEligible && (
                              <p className="text-[11px] text-muted-foreground flex items-center justify-start sm:justify-end gap-1 mt-1">
                                <Clock className="w-3 h-3" /> Выплата после{" "}
                                {format(
                                  new Date(escrow.releaseEligible),
                                  "dd.MM.yy HH:mm",
                                )}
                              </p>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                    <ShieldCheck className="w-12 h-12 text-muted-foreground/30 mb-3" />
                    <p>Нет активных безопасных сделок.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: PAYOUTS (Performers Only) */}
          {summary?.userRoles.isPerformer && (
            <TabsContent value="payouts" className="animate-in fade-in">
              <Card className="rounded-3xl border-border/40 shadow-sm overflow-hidden">
                <CardContent className="p-0">
                  {payouts && payouts.length > 0 ? (
                    <div className="divide-y divide-border/50">
                      {payouts.map((payout) => (
                        <div
                          key={payout.id}
                          className="p-4 sm:p-6 flex items-center justify-between hover:bg-muted/20 transition-colors"
                        >
                          <div>
                            <p className="font-semibold text-sm sm:text-base">
                              Вывод средств на счет
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(
                                new Date(payout.createdAt),
                                "d MMMM yyyy, HH:mm",
                                { locale: ru },
                              )}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-1 bg-muted/30 px-2 py-1 rounded inline-block">
                              Реквизиты:{" "}
                              {payout.paymentDetails?.substring(0, 20)}...
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg mb-1">
                              {formatMoney(payout.amount)}
                            </p>
                            {payout.status === "PENDING" && (
                              <span className="text-xs font-semibold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                                В обработке
                              </span>
                            )}
                            {payout.status === "PAID" && (
                              <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                                Выплачено
                              </span>
                            )}
                            {payout.status === "REJECTED" && (
                              <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                                Отклонено
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 text-center text-muted-foreground">
                      История выводов пуста.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* --- PAYOUT MODAL --- */}
        <Dialog open={isPayoutModalOpen} onOpenChange={setIsPayoutModalOpen}>
          <DialogContent className="rounded-3xl p-6 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                Вывод средств
              </DialogTitle>
              <DialogDescription>
                Доступно для вывода:{" "}
                <span className="font-bold text-foreground">
                  {formatMoney(summary?.walletBalance || 0)}
                </span>
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-5">
              <div className="space-y-2">
                <Label>Сумма вывода (₽)</Label>
                <Input
                  type="number"
                  placeholder="Например: 15000"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="rounded-xl h-12 bg-muted/20 text-lg font-semibold"
                />
              </div>
              <div className="space-y-2">
                <Label>Банковские реквизиты (Номер счета / карты)</Label>
                <Textarea
                  placeholder="Укажите номер карты, БИК, корр. счет и ФИО получателя"
                  value={paymentDetails}
                  onChange={(e) => setPaymentDetails(e.target.value)}
                  className="rounded-xl bg-muted/20 min-h-[100px]"
                />
              </div>
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Заявки на вывод обрабатываются финансовым отделом в течение
                  1-3 рабочих дней.
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setIsPayoutModalOpen(false)}
                className="rounded-xl h-11 w-full sm:w-auto"
              >
                Отмена
              </Button>
              <Button
                onClick={handlePayoutSubmit}
                disabled={
                  requestPayoutMut.isPending || !payoutAmount || !paymentDetails
                }
                className="rounded-xl h-11 font-bold w-full sm:w-auto"
              >
                {requestPayoutMut.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Создать заявку
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
