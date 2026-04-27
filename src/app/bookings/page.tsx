"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

import {
  useMyBookings,
  usePerformerReply,
  useCustomerCancel,
  usePayBooking,
  BookingRequest,
  BookingStatus,
} from "@/services/booking";
import { useToast } from "@/hooks/use-toast";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/utils/utils";

// --- STATUS BADGE CONFIG ---
const StatusBadge = ({ status }: { status: BookingStatus }) => {
  const config = {
    PENDING_PERFORMER_APPROVAL: {
      label: "Ожидает ответа исполнителя",
      color: "bg-amber-100 text-amber-700 border-amber-200",
      icon: Clock,
    },
    PENDING_CUSTOMER_PAYMENT: {
      label: "Ожидает вашей оплаты",
      color: "bg-blue-100 text-blue-700 border-blue-200",
      icon: CreditCard,
    },
    CONFIRMED: {
      label: "Подтверждено (Оплачено)",
      color: "bg-indigo-100 text-indigo-700 border-indigo-200",
      icon: CheckCircle2,
    },
    FULFILLED: {
      label: "Выполнено",
      color: "bg-emerald-100 text-emerald-700 border-emerald-200",
      icon: CheckCircle2,
    },
    REJECTED_BY_PERFORMER: {
      label: "Отклонено исполнителем",
      color: "bg-red-100 text-red-700 border-red-200",
      icon: XCircle,
    },
    CANCELLED_BY_CUSTOMER: {
      label: "Отменено клиентом",
      color: "bg-red-100 text-red-700 border-red-200",
      icon: XCircle,
    },
    DISPUTED: {
      label: "Спор",
      color: "bg-rose-100 text-rose-700 border-rose-200",
      icon: ShieldAlert,
    },
  };

  const {
    label,
    color,
    icon: Icon,
  } = config[status] || config.PENDING_PERFORMER_APPROVAL;

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
        color,
      )}
    >
      <Icon className="w-3 h-3 mr-1" /> {label}
    </span>
  );
};

export default function MyBookingsPage() {
  const { status: authStatus } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const { data, isLoading } = useMyBookings();
  const performerReplyMut = usePerformerReply();
  const customerCancelMut = useCustomerCancel();
  const payBookingMut = usePayBooking();

  // Dialog States
  const [activeBooking, setActiveBooking] = useState<BookingRequest | null>(
    null,
  );
  const [dialogType, setDialogType] = useState<"ACCEPT" | "REJECT" | null>(
    null,
  );
  const [fee, setFee] = useState("");
  const [reason, setReason] = useState("");

  const closeDialogs = () => {
    setActiveBooking(null);
    setDialogType(null);
    setFee("");
    setReason("");
  };

  // --- HANDLERS ---
  const handlePerformerReply = () => {
    if (!activeBooking || !dialogType) return;

    if (dialogType === "ACCEPT" && (!fee || Number(fee) <= 0)) {
      return toast({
        variant: "destructive",
        title: "Укажите сумму гонорара.",
      });
    }
    if (dialogType === "REJECT" && !reason.trim()) {
      return toast({
        variant: "destructive",
        title: "Укажите причину отказа.",
      });
    }

    performerReplyMut.mutate(
      {
        bookingId: activeBooking.id,
        action: dialogType,
        agreedFee: dialogType === "ACCEPT" ? Number(fee) : undefined,
        rejectionReason: dialogType === "REJECT" ? reason : undefined,
      },
      {
        onSuccess: () => {
          toast({
            title:
              dialogType === "ACCEPT"
                ? "Гонорар отправлен клиенту!"
                : "Бронирование отклонено.",
          });
          closeDialogs();
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

  const handleCustomerCancel = (bookingId: string) => {
    if (!confirm("Вы уверены, что хотите отменить бронирование?")) return;
    customerCancelMut.mutate(
      { bookingId },
      {
        onSuccess: () => toast({ title: "Бронирование отменено." }),
        onError: () =>
          toast({ variant: "destructive", title: "Ошибка отмены." }),
      },
    );
  };

  const handleCustomerPay = (bookingId: string) => {
    payBookingMut.mutate(
      { bookingId },
      {
        onSuccess: (res) => {
          if (res.checkoutUrl) window.location.href = res.checkoutUrl; // Redirect to Escrow Provider
        },
        onError: (err: any) =>
          toast({
            variant: "destructive",
            title: "Ошибка оплаты",
            description: err.response?.data?.message,
          }),
      },
    );
  };

  if (authStatus === "loading" || isLoading) {
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

  // --- REUSABLE CARD ---
  const BookingCard = ({
    booking,
    type,
  }: {
    booking: BookingRequest;
    type: "made" | "received";
  }) => {
    const targetName =
      type === "made" ? booking.performer?.user.name : booking.customer?.name;
    const targetImage =
      type === "made" ? booking.performer?.user.image : booking.customer?.image;
    const targetInfo =
      type === "made" ? booking.performer?.user.city : booking.customer?.email;

    return (
      <Card className="rounded-3xl shadow-sm border-border/40 overflow-hidden mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row justify-between gap-6">
            <div className="flex gap-4">
              <Avatar className="w-14 h-14 border">
                <AvatarImage src={targetImage || ""} />
                <AvatarFallback>{targetName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="space-y-1.5">
                <h4 className="font-bold text-lg">{targetName}</h4>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4" />
                  {format(new Date(booking.date), "d MMMM yyyy, HH:mm", {
                    locale: ru,
                  })}
                </p>
                {targetInfo && (
                  <p className="text-sm text-muted-foreground">{targetInfo}</p>
                )}
                <div className="pt-2">
                  <StatusBadge status={booking.status} />
                </div>
              </div>
            </div>

            <div className="flex-1 lg:ml-8 space-y-4">
              <div className="bg-muted/20 p-4 rounded-2xl border border-border/50">
                <p className="text-sm font-bold mb-2">Детали:</p>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                  {booking.details}
                </p>

                {booking.agreedFee && (
                  <div className="mt-4 pt-4 border-t border-border/50 flex justify-between items-center bg-primary/5 p-3 rounded-xl border-primary/20">
                    <span className="text-sm font-semibold text-primary">
                      Гонорар:
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {booking.agreedFee.toLocaleString("ru-RU")} ₽
                    </span>
                  </div>
                )}
                {booking.rejectionReason && (
                  <div className="mt-4 pt-4 border-t border-border/50 bg-destructive/5 p-3 rounded-xl border-destructive/20">
                    <span className="text-sm font-semibold text-destructive block mb-1">
                      Причина отказа:
                    </span>
                    <span className="text-sm text-destructive">
                      {booking.rejectionReason}
                    </span>
                  </div>
                )}
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-wrap gap-2 justify-end pt-2">
                {/* PERFORMER ACTIONS */}
                {type === "received" &&
                  booking.status === "PENDING_PERFORMER_APPROVAL" && (
                    <>
                      <Button
                        variant="outline"
                        className="rounded-xl border-destructive text-destructive hover:bg-destructive/5"
                        onClick={() => {
                          setActiveBooking(booking);
                          setDialogType("REJECT");
                        }}
                      >
                        Отклонить
                      </Button>
                      <Button
                        className="rounded-xl font-bold"
                        onClick={() => {
                          setActiveBooking(booking);
                          setDialogType("ACCEPT");
                        }}
                      >
                        Оценить и принять
                      </Button>
                    </>
                  )}

                {/* CUSTOMER ACTIONS */}
                {type === "made" &&
                  booking.status === "PENDING_CUSTOMER_PAYMENT" && (
                    <>
                      <Button
                        variant="outline"
                        className="rounded-xl border-border"
                        onClick={() => handleCustomerCancel(booking.id)}
                        disabled={customerCancelMut.isPending}
                      >
                        Отказаться
                      </Button>
                      <Button
                        className="rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700"
                        onClick={() => handleCustomerPay(booking.id)}
                        disabled={payBookingMut.isPending}
                      >
                        {payBookingMut.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <CreditCard className="w-4 h-4 mr-2" />
                        )}
                        Оплатить (Безопасная сделка)
                      </Button>
                    </>
                  )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="bg-muted/10 min-h-screen pb-20 pt-10">
      <div className="container max-w-5xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Мои бронирования
          </h1>
          <p className="text-muted-foreground mt-2">
            Управление вашими выступлениями и заказами
          </p>
        </div>

        {data?.isPerformer ? (
          <Tabs defaultValue="received" className="w-full">
            <TabsList className="mb-8 bg-white p-1 rounded-2xl shadow-sm border border-border/50">
              <TabsTrigger
                value="received"
                className="rounded-xl px-8 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold"
              >
                Входящие заявки
                {data.received.filter(
                  (b) => b.status === "PENDING_PERFORMER_APPROVAL",
                ).length > 0 && (
                  <span className="ml-2 bg-white text-primary px-2 py-0.5 rounded-full text-xs font-bold">
                    {
                      data.received.filter(
                        (b) => b.status === "PENDING_PERFORMER_APPROVAL",
                      ).length
                    }
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="made"
                className="rounded-xl px-8 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold"
              >
                Мои заказы
              </TabsTrigger>
            </TabsList>

            <TabsContent value="received" className="animate-in fade-in">
              {data.received.length > 0 ? (
                data.received.map((b) => (
                  <BookingCard key={b.id} booking={b} type="received" />
                ))
              ) : (
                <p className="text-center py-12 text-muted-foreground">
                  Нет входящих заявок.
                </p>
              )}
            </TabsContent>
            <TabsContent value="made" className="animate-in fade-in">
              {data.made.length > 0 ? (
                data.made.map((b) => (
                  <BookingCard key={b.id} booking={b} type="made" />
                ))
              ) : (
                <p className="text-center py-12 text-muted-foreground">
                  Вы еще не делали заказов.
                </p>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="animate-in fade-in">
            {data?.made.length ? (
              data.made.map((b) => (
                <BookingCard key={b.id} booking={b} type="made" />
              ))
            ) : (
              <p className="text-center py-12 text-muted-foreground">
                У вас пока нет бронирований.
              </p>
            )}
          </div>
        )}

        {/* --- DIALOGS FOR PERFORMERS --- */}
        <Dialog
          open={!!activeBooking && !!dialogType}
          onOpenChange={closeDialogs}
        >
          <DialogContent className="rounded-3xl p-6 sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                {dialogType === "ACCEPT"
                  ? "Оценить выступление"
                  : "Отклонить заявку"}
              </DialogTitle>
              <DialogDescription>
                {dialogType === "ACCEPT"
                  ? "Укажите итоговую стоимость ваших услуг. Клиент должен будет оплатить эту сумму для подтверждения брони."
                  : "Пожалуйста, укажите причину, по которой вы не можете принять этот заказ."}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-4">
              {dialogType === "ACCEPT" && (
                <div className="space-y-2">
                  <Label>Ваш гонорар (₽)</Label>
                  <Input
                    type="number"
                    placeholder="Например: 50000"
                    value={fee}
                    onChange={(e) => setFee(e.target.value)}
                    className="rounded-xl h-12 bg-muted/20"
                  />
                </div>
              )}
              {dialogType === "REJECT" && (
                <div className="space-y-2">
                  <Label>Причина отказа</Label>
                  <Textarea
                    placeholder="Например: В этот день я на гастролях..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="rounded-xl bg-muted/20 min-h-[100px]"
                  />
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="ghost"
                onClick={closeDialogs}
                className="rounded-xl h-11 w-full sm:w-auto"
              >
                Отмена
              </Button>
              <Button
                onClick={handlePerformerReply}
                disabled={
                  performerReplyMut.isPending ||
                  (dialogType === "ACCEPT" && !fee) ||
                  (dialogType === "REJECT" && !reason)
                }
                variant={dialogType === "REJECT" ? "destructive" : "default"}
                className="rounded-xl h-11 font-bold w-full sm:w-auto"
              >
                {performerReplyMut.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : dialogType === "ACCEPT" ? (
                  "Отправить клиенту"
                ) : (
                  "Отклонить"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
