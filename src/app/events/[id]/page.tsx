"use client";

import { useState, useEffect, Suspense } from "react";
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
  Loader2,
} from "lucide-react";

// Services & Hooks
import { useEventQuery } from "@/services/events";
import { usePurchaseTicketsMutation, useRSVPMutation } from "@/services/order";

// --- INNER COMPONENT ---
const EventDetailContent = () => {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { data: session, status: sessionStatus } = useSession();

  const eventId = params.id as string;
  const { data: event, isLoading, isError } = useEventQuery(eventId);

  // Mutations
  const purchaseMutation = usePurchaseTicketsMutation();
  const rsvpMutation = useRSVPMutation(eventId);

  // States
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [isFailureOpen, setIsFailureOpen] = useState(false);
  const [ticketCount, setTicketCount] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (searchParams.get("payment") === "failed") {
      setIsFailureOpen(true);
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams]);

  const handleOpenPurchaseDialog = () => {
    if (sessionStatus === "unauthenticated") {
      toast({
        title: "Вход в систему",
        description: "Пожалуйста, войдите, чтобы продолжить.",
      });
      router.push("/login");
      return;
    }

    // Logic: If Free, skip dialog and RSVP immediately
    if (event?.paymentType === "FREE") {
      handleFreeRSVP();
    } else {
      setIsPurchaseOpen(true);
    }
  };

  const handleFreeRSVP = async () => {
    if (!event || !session?.user) return;
    setIsProcessing(true);
    try {
      await rsvpMutation.mutateAsync({
        guestName: session.user.name || "Гость",
        guestEmail: session.user.email || "",
        status: "ACCEPTED",
      });
      toast({
        title: "Успешно! 🎉",
        description: "Вы зарегистрированы на мероприятие.",
      });
      router.push("/tickets");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePurchase = async () => {
    if (!event) return;
    setIsProcessing(true);
    try {
      const { paymentUrl } = await purchaseMutation.mutateAsync({
        eventId: event.id,
        ticketCount: ticketCount,
      });
      window.location.href = paymentUrl;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message,
      });
      setIsProcessing(false);
    }
  };

  if (isLoading) return <LoadingSkeleton />;

  if (isError || !event) {
    return (
      <div className="container mx-auto py-32 text-center space-y-4">
        <h2 className="text-3xl font-bold text-muted-foreground">
          Мероприятие не найдено
        </h2>
        <Button asChild variant="outline">
          <Link href="/events">К афише</Link>
        </Button>
      </div>
    );
  }

  const isSoldOut = event.availableTickets <= 0;
  const isOwnEvent = session?.user?.id === event.hostId;

  return (
    <div className="min-h-screen bg-background animate-in fade-in duration-500 pb-20">
      {/* Hero */}
      <div className="relative h-[45vh] min-h-[400px] w-full overflow-hidden">
        <img
          src={event.imageUrl || "/images/placeholder.jpg"}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-black/40 to-transparent" />
        <div className="absolute top-6 left-6 z-10">
          <Button
            variant="secondary"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full shadow-md"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
        <div className="absolute bottom-10 left-0 right-0 z-10">
          <div className="container mx-auto px-4">
            <Badge className="mb-4 bg-primary text-white border-none">
              {event.category}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight drop-shadow-lg">
              {event.title}
            </h1>
            <div className="flex flex-wrap gap-4 text-white/90">
              <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                <CalendarIcon className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold">
                  {format(new Date(event.date), "d MMMM yyyy", { locale: ru })}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold">{event.city}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-10">
            <section className="prose prose-lg dark:prose-invert max-w-none">
              <h2 className="text-3xl font-black flex items-center gap-3">
                <Info className="text-primary" /> О событии
              </h2>
              <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                {event.description || "Описание ожидается..."}
              </p>
            </section>

            <Separator />

            <section>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Map className="text-primary" /> Где это будет
              </h2>
              <Card className="bg-muted/40 border-none shadow-none rounded-2xl">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-background flex items-center justify-center shadow-sm text-primary">
                    <MapPin />
                  </div>
                  <div>
                    <p className="font-bold">{event.city}</p>
                    <p className="text-sm text-muted-foreground">
                      {event.address ||
                        "Точный адрес доступен после регистрации"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4">
            <Card className="sticky top-24 overflow-hidden rounded-[2rem] border-none shadow-2xl">
              <CardHeader className="bg-primary text-white text-center pb-8">
                <CardTitle className="text-3xl font-black">
                  {event.paymentType === "FREE"
                    ? "Бесплатно"
                    : `${event.price.toLocaleString()} ₽`}
                </CardTitle>
                <CardDescription className="text-white/80 font-bold uppercase tracking-widest text-[10px]">
                  {event.paymentType === "FREE"
                    ? "Вход по регистрации"
                    : "Цена за 1 билет"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="flex justify-between items-center bg-muted/50 p-4 rounded-2xl">
                  <span className="text-sm font-bold">Осталось мест:</span>
                  <span className="font-black text-primary">
                    {event.availableTickets} / {event.totalTickets}
                  </span>
                </div>
                <Button
                  className="w-full h-14 rounded-2xl text-lg font-black shadow-xl transition-all active:scale-95"
                  variant={isSoldOut ? "secondary" : "destructive"}
                  onClick={handleOpenPurchaseDialog}
                  disabled={isSoldOut || isProcessing || isOwnEvent}
                >
                  {isProcessing ? (
                    <Loader2 className="animate-spin mr-2" />
                  ) : (
                    <Ticket className="mr-2" />
                  )}
                  {isOwnEvent
                    ? "Ваше событие"
                    : isSoldOut
                      ? "Мест нет"
                      : event.paymentType === "FREE"
                        ? "Записаться"
                        : "Купить билет"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Payment Failure Dialog */}
      <Dialog open={isFailureOpen} onOpenChange={setIsFailureOpen}>
        <DialogContent className="rounded-[2rem]">
          <div className="flex flex-col items-center text-center p-4">
            <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
              <AlertCircle className="h-10 w-10 text-red-600" />
            </div>
            <DialogTitle className="text-2xl font-black">
              Упс! Ошибка оплаты
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              Платеж был отклонен банком или отменен. Попробуйте еще раз.
            </DialogDescription>
            <Button
              className="w-full mt-8 rounded-xl h-12 font-bold"
              onClick={() => {
                setIsFailureOpen(false);
                setIsPurchaseOpen(true);
              }}
            >
              <RefreshCcw className="mr-2 h-4 w-4" /> Повторить попытку
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Purchase Dialog */}
      <Dialog open={isPurchaseOpen} onOpenChange={setIsPurchaseOpen}>
        <DialogContent className="rounded-[2rem]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">
              Количество билетов
            </DialogTitle>
          </DialogHeader>
          <div className="py-10 flex flex-col items-center gap-8">
            <div className="flex items-center gap-8">
              <Button
                variant="outline"
                size="icon"
                className="h-14 w-14 rounded-full border-2"
                onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}
                disabled={ticketCount <= 1}
              >
                -
              </Button>
              <span className="text-5xl font-black">{ticketCount}</span>
              <Button
                variant="outline"
                size="icon"
                className="h-14 w-14 rounded-full border-2"
                onClick={() =>
                  setTicketCount(
                    Math.min(event.availableTickets, ticketCount + 1),
                  )
                }
                disabled={ticketCount >= event.availableTickets}
              >
                +
              </Button>
            </div>
            <div className="w-full bg-muted/30 p-6 rounded-2xl flex justify-between items-center">
              <span className="font-bold text-muted-foreground">Итого:</span>
              <span className="text-3xl font-black text-primary">
                {(event.price * ticketCount).toLocaleString()} ₽
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button
              className="w-full h-14 rounded-2xl text-lg font-black"
              variant="destructive"
              onClick={handlePurchase}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="animate-spin mr-2" />
              ) : (
                "Перейти к оплате"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Loading Skeleton UI
const LoadingSkeleton = () => (
  <div className="container mx-auto py-10 space-y-8 animate-pulse">
    <div className="h-[45vh] w-full bg-muted rounded-[2rem]" />
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      <div className="lg:col-span-8 space-y-6">
        <div className="h-10 w-1/3 bg-muted rounded-xl" />
        <div className="h-32 w-full bg-muted rounded-xl" />
      </div>
      <div className="lg:col-span-4 h-80 bg-muted rounded-[2rem]" />
    </div>
  </div>
);

// Final Export with Suspense wrapper
export default function EventDetailPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <EventDetailContent />
    </Suspense>
  );
}
