"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useSession } from "next-auth/react";

// UI Components
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

// Icons
import {
  Calendar as CalendarIcon,
  MapPin,
  Clock,
  Ticket,
  ArrowLeft,
  Info,
  CheckCircle2,
  Users,
  ChevronRight,
  Map,
  AlertCircle,
  RefreshCcw,
} from "lucide-react";

// Services & Hooks
import { useEventQuery } from "@/services/events";
import { usePurchaseTicketsMutation } from "@/services/order";

const EventDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Auth Session
  const { data: session, status: sessionStatus } = useSession();

  // Fetch the specific event
  const eventId = params.id as string;
  const { data: event, isLoading, isError } = useEventQuery(eventId);

  // Purchase Mutation (Handles API call to our backend, which returns Tinkoff URL)
  const purchaseMutation = usePurchaseTicketsMutation();

  // Dialog States
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [isFailureOpen, setIsFailureOpen] = useState(false);
  const [ticketCount, setTicketCount] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // Watch for payment=failed in the URL (from Tinkoff callback)
  useEffect(() => {
    if (searchParams.get("payment") === "failed") {
      setIsFailureOpen(true);

      // Clean the URL so the error doesn't persist on page refresh
      // Using window.history to replace state without triggering a Next.js re-render
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams]);

  const handleOpenPurchaseDialog = () => {
    if (sessionStatus === "unauthenticated" || !session?.user) {
      toast({
        title: "Требуется авторизация",
        description: "Пожалуйста, войдите в аккаунт, чтобы купить билет.",
      });
      router.push("/login");
      return;
    }
    setIsFailureOpen(false); // Close failure dialog if it was open
    setIsPurchaseOpen(true);
  };

  const handlePurchase = async () => {
    if (!event || !session?.user?.id) return;

    setIsProcessing(true);
    try {
      // 1. Create a pending order on our backend
      // 2. Our backend talks to Tinkoff and gets a secure payment link
      const paymentUrl = await purchaseMutation.mutateAsync({
        eventId: event.id,
        userId: session.user.id,
        ticketCount: ticketCount,
      });

      // 3. Redirect the user securely to Tinkoff Payment Gateway
      window.location.href = paymentUrl;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message || "Не удалось инициировать оплату.",
      });
      setIsProcessing(false);
    }
  };

  // --- RENDER: LOADING STATE ---
  if (isLoading) {
    return (
      <div className="container mx-auto py-10 space-y-8 animate-in fade-in">
        <Skeleton className="h-[50vh] w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // --- RENDER: ERROR OR NOT FOUND STATE ---
  if (isError || !event) {
    return (
      <div className="container mx-auto py-32 text-center space-y-4">
        <h2 className="text-3xl font-bold text-muted-foreground">
          Мероприятие не найдено
        </h2>
        <p className="text-muted-foreground">
          Возможно, оно было удалено или ссылка устарела.
        </p>
        <Button asChild variant="default" className="mt-4">
          <Link href="/events">Вернуться к афише</Link>
        </Button>
      </div>
    );
  }

  // --- LOGIC STATES ---
  const isSoldOut = event.availableTickets <= 0;
  const isOwnEvent = session?.user?.id === event.hostId;

  // --- RENDER: MAIN PAGE ---
  return (
    <div className="min-h-screen bg-background animate-in fade-in duration-500 pb-20">
      {/* Hero Section */}
      <div className="relative h-[50vh] min-h-[400px] w-full overflow-hidden">
        <img
          src={event.imageUrl}
          alt={event.title}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        <div className="absolute top-6 left-6 z-10">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full shadow-md hover:scale-105 transition-transform"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>

        <div className="absolute bottom-10 left-0 right-0 z-10">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex items-center gap-3 mb-4">
              <Badge className="bg-primary/90 hover:bg-primary text-white border-none">
                {event.category}
              </Badge>
              {isSoldOut && (
                <Badge variant="destructive" className="border-none">
                  SOLD OUT
                </Badge>
              )}
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              {event.title}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-white/90 bg-black/20 p-4 rounded-2xl backdrop-blur-sm w-fit border border-white/10">
              <div className="flex items-center gap-2 font-medium">
                <CalendarIcon className="h-5 w-5 text-primary" />
                <span>
                  {format(new Date(event.date), "d MMMM yyyy", { locale: ru })}
                </span>
              </div>
              {event.time && (
                <div className="flex items-center gap-2 font-medium">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>{event.time}</span>
                </div>
              )}
              <div className="flex items-center gap-2 font-medium">
                <MapPin className="h-5 w-5 text-primary" />
                <span>{event.city}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Content (Left Column) */}
          <div className="lg:col-span-8 space-y-12">
            <section className="space-y-6">
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <Info className="h-8 w-8 text-primary" /> О мероприятии
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed whitespace-pre-wrap">
                {event.description ||
                  "Организатор не предоставил подробного описания."}
              </p>
            </section>

            <Separator />

            <section className="space-y-6">
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <Map className="h-8 w-8 text-primary" /> Место проведения
              </h2>
              <Card className="bg-muted/30 border-none shadow-none">
                <CardContent className="p-6 flex items-start gap-4">
                  <div className="p-3 bg-background rounded-full shrink-0 shadow-sm">
                    <MapPin className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">{event.city}</p>
                    <p className="text-muted-foreground">
                      {event.address ||
                        "Точный адрес будет отправлен после покупки билета"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>

            <Separator />

            <section className="space-y-6">
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" /> Организатор
              </h2>
              <Card className="border-none shadow-md bg-card hover:shadow-lg transition-shadow">
                <CardContent className="flex flex-col sm:flex-row items-center justify-between p-6 gap-6">
                  <div className="flex items-center gap-5 w-full">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl shrink-0">
                      {event.host?.name ? event.host.name.substring(0, 1) : "E"}
                    </div>
                    <div className="flex-grow">
                      <p className="font-bold text-xl">
                        {event.host?.name || "Платформа Eventomir"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Официальный организатор
                      </p>
                    </div>
                  </div>
                  {event.hostId && (
                    <Button
                      variant="outline"
                      className="shrink-0 w-full sm:w-auto"
                      asChild
                    >
                      <Link href={`/performer-profile?id=${event.hostId}`}>
                        Профиль организатора{" "}
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            </section>
          </div>

          {/* Sidebar Purchase Box (Right Column) */}
          <div className="lg:col-span-4">
            <Card className="sticky top-24 shadow-xl border-primary/10 overflow-hidden">
              <div className="h-2 w-full bg-primary" />
              <CardHeader className="bg-muted/30 pb-8">
                <CardTitle className="text-4xl font-bold text-center text-foreground">
                  {event.price > 0
                    ? `${event.price.toLocaleString()} ₽`
                    : "Бесплатно"}
                </CardTitle>
                {event.price > 0 && (
                  <CardDescription className="text-center text-sm uppercase tracking-wider font-semibold mt-2">
                    Цена за 1 билет
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-base">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Электронный билет</span>
                  </div>
                  <div className="flex items-center justify-between text-base">
                    <div className="flex items-center gap-3 font-semibold">
                      <Ticket className="h-5 w-5 text-primary" />
                      <span>Осталось мест:</span>
                    </div>
                    <span
                      className={`font-bold text-lg ${isSoldOut ? "text-destructive" : "text-foreground"}`}
                    >
                      {event.availableTickets} / {event.totalTickets}
                    </span>
                  </div>
                </div>
                <Button
                  size="lg"
                  className="w-full font-bold text-lg h-14 shadow-lg shadow-destructive/20"
                  variant={
                    isSoldOut || isOwnEvent ? "secondary" : "destructive"
                  }
                  onClick={handleOpenPurchaseDialog}
                  disabled={
                    isSoldOut || sessionStatus === "loading" || isOwnEvent
                  }
                >
                  {isOwnEvent
                    ? "Это ваше мероприятие"
                    : isSoldOut
                      ? "Все билеты проданы"
                      : "Купить билет"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* --- PAYMENT FAILURE DIALOG (NEW UX) --- */}
      <Dialog open={isFailureOpen} onOpenChange={setIsFailureOpen}>
        <DialogContent className="sm:max-w-[425px] text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4 mt-2">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">
              Ошибка оплаты
            </DialogTitle>
            <DialogDescription className="text-center text-base pt-2">
              К сожалению, ваш платеж не прошел. Средства{" "}
              <strong>не были списаны</strong> с вашей карты.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/50 p-4 rounded-lg my-4 text-sm text-muted-foreground text-left">
            <ul className="list-disc pl-5 space-y-1">
              <li>Недостаточно средств на карте</li>
              <li>Банк отклонил операцию</li>
              <li>Истекло время сессии оплаты</li>
            </ul>
          </div>
          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button
              className="w-full h-12 text-base font-bold bg-foreground hover:bg-foreground/90"
              onClick={handleOpenPurchaseDialog}
            >
              <RefreshCcw className="mr-2 h-5 w-5" />
              Попробовать снова
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setIsFailureOpen(false)}
            >
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- PURCHASE DIALOG --- */}
      <Dialog open={isPurchaseOpen} onOpenChange={setIsPurchaseOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl">Оформление заказа</DialogTitle>
            <DialogDescription className="text-base pt-2">
              Событие:{" "}
              <span className="font-semibold text-foreground">
                {event.title}
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-8 py-6">
            <div className="space-y-4">
              <Label className="text-base text-center block">
                Количество билетов
              </Label>
              <div className="flex items-center justify-center gap-6">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}
                  disabled={ticketCount <= 1 || isProcessing}
                >
                  -
                </Button>
                <span className="text-3xl font-bold w-12 text-center">
                  {ticketCount}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  onClick={() =>
                    setTicketCount(
                      Math.min(event.availableTickets, ticketCount + 1),
                    )
                  }
                  disabled={
                    ticketCount >= event.availableTickets || isProcessing
                  }
                >
                  +
                </Button>
              </div>
            </div>
            <Separator />
            <div className="flex justify-between items-end">
              <span className="text-muted-foreground font-medium">
                К оплате:
              </span>
              <span className="text-3xl font-bold text-primary">
                {(event.price * ticketCount).toLocaleString()} ₽
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              variant="destructive"
              size="lg"
              className="w-full text-lg h-12"
              onClick={handlePurchase}
              disabled={isProcessing}
            >
              {isProcessing ? "Переход к оплате..." : "Оплатить заказ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventDetailPage;
