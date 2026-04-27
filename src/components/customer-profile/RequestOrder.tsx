"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/utils/utils";
import {
  Send,
  PlusCircle,
  MapPin,
  MessageCircle,
  History,
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  ChevronRight,
  Briefcase,
} from "lucide-react";

// --- Interfaces ---
interface RequestOrderProps {
  paidRequests: any[];
  isRequestsLoading: boolean;
  orderHistory: any[];
  isHistoryLoading: boolean;
  onlineUsers: Set<string>;
  handleOpenChat: (userId: string) => void;
}

// --- Helpers ---
const getInitials = (name: string) =>
  name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "??";

const getStatusDetails = (status: string) => {
  const map: Record<string, { label: string; color: string; icon: any }> = {
    PENDING_PERFORMER_APPROVAL: {
      label: "Ожидает ответа исполнителя",
      color: "bg-amber-100 text-amber-700 border-amber-200",
      icon: Clock,
    },
    PENDING_CUSTOMER_PAYMENT: {
      label: "Ожидает оплаты",
      color: "bg-blue-100 text-blue-700 border-blue-200",
      icon: Clock,
    },
    CONFIRMED: {
      label: "Подтвержден",
      color: "bg-indigo-100 text-indigo-700 border-indigo-200",
      icon: CheckCircle2,
    },
    FULFILLED: {
      label: "Выполнен",
      color: "bg-emerald-100 text-emerald-700 border-emerald-200",
      icon: CheckCircle2,
    },
    CANCELLED_BY_CUSTOMER: {
      label: "Отменен вами",
      color: "bg-red-100 text-red-700 border-red-200",
      icon: XCircle,
    },
    REJECTED_BY_PERFORMER: {
      label: "Отклонен исполнителем",
      color: "bg-red-100 text-red-700 border-red-200",
      icon: XCircle,
    },
    DISPUTED: {
      label: "Открыт спор",
      color: "bg-rose-100 text-rose-800 border-rose-300",
      icon: ShieldAlert,
    },
  };

  return (
    map[status] || {
      label: status,
      color: "bg-muted text-muted-foreground border-border",
      icon: History,
    }
  );
};

export const RequestOrder = ({
  paidRequests,
  isRequestsLoading,
  orderHistory,
  isHistoryLoading,
  onlineUsers,
  handleOpenChat,
}: RequestOrderProps) => {
  return (
    <div className="grid grid-cols-1 gap-8">
      {/* ========================================== */}
      {/* 1. PAID REQUESTS SECTION                     */}
      {/* ========================================== */}
      <section className="bg-card rounded-[2rem] p-6 md:p-8 shadow-sm border border-border/50 h-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" /> Мои заявки
          </h2>
          <Button
            asChild
            variant="secondary"
            size="sm"
            className="rounded-full font-bold bg-primary/10 text-primary hover:bg-primary/20"
          >
            <Link href="/create-request">
              <PlusCircle className="h-4 w-4 mr-1.5" /> Создать
            </Link>
          </Button>
        </div>

        {isRequestsLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-28 w-full rounded-2xl" />
          </div>
        ) : paidRequests.length === 0 ? (
          <div className="flex flex-col items-center py-10 border-2 border-dashed rounded-2xl text-muted-foreground bg-muted/10">
            <Send className="h-8 w-8 opacity-20 mb-2" />
            <p className="text-sm font-bold">Нет активных заявок</p>
          </div>
        ) : (
          <div className="space-y-4">
            {paidRequests.map((req) => (
              <div
                key={req.id}
                className="bg-background rounded-2xl p-5 border border-border/60 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div
                  className={cn(
                    "absolute left-0 top-0 bottom-0 w-1.5",
                    req.status === "OPEN" ? "bg-emerald-500" : "bg-gray-300",
                  )}
                />
                <div className="flex justify-between mb-3 pl-2">
                  <Badge
                    variant="secondary"
                    className="bg-primary/10 text-primary border-none"
                  >
                    {req.category}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      "border-0 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                      req.status === "OPEN"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {req.status === "OPEN" ? "Открыта" : "Закрыта"}
                  </Badge>
                </div>
                <p className="font-semibold text-[15px] leading-snug line-clamp-2 mb-4 pl-2">
                  {req.serviceDescription}
                </p>
                <div className="flex justify-between text-xs text-muted-foreground font-medium pt-3 border-t border-border/40 pl-2">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {req.city || "Не указан"}
                  </span>
                  <span className="flex items-center gap-1 bg-muted/50 px-2 py-1 rounded-md">
                    <MessageCircle className="h-3.5 w-3.5" /> Просмотров:{" "}
                    {req.views}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ========================================== */}
      {/* 2. ORDER HISTORY SECTION                     */}
      {/* ========================================== */}
      <section className="bg-card rounded-[2rem] p-6 md:p-8 shadow-sm border border-border/50 h-full">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <History className="h-5 w-5 text-primary" /> История заказов
          </h2>
          <Badge
            variant="secondary"
            className="bg-muted text-muted-foreground font-bold"
          >
            {orderHistory.length}
          </Badge>
        </div>

        {isHistoryLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
        ) : orderHistory.length === 0 ? (
          <div className="flex flex-col items-center py-12 border-2 border-dashed border-border/60 rounded-2xl text-muted-foreground bg-muted/10">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <History className="h-8 w-8 opacity-40" />
            </div>
            <p className="font-bold text-foreground">У вас пока нет заказов</p>
            <p className="text-sm mt-1 text-center max-w-[250px]">
              Найдите подходящего исполнителя и создайте свой первый заказ.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {orderHistory.map((order) => {
              const isOnline = onlineUsers.has(order.performerId);
              const statusConfig = getStatusDetails(order.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={order.id}
                  className="bg-background rounded-2xl p-6 border border-border/40 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 group flex flex-col gap-5"
                >
                  {/* --- TOP ROW: Meta Info & Status --- */}
                  <div className="flex justify-between items-start md:items-center gap-4 border-b border-border/40 pb-4">
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs font-semibold text-muted-foreground">
                      <span className="uppercase tracking-wider px-2 py-1 bg-muted/50 rounded-md">
                        ID: {order.id.slice(-6)}
                      </span>
                      <span className="hidden md:inline-block w-1 h-1 rounded-full bg-border" />
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 opacity-70" />
                        {format(order.date, "d MMMM yyyy", { locale: ru })}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "px-3 py-1 text-[11px] uppercase font-bold tracking-wider border flex items-center gap-1.5 rounded-full whitespace-nowrap shrink-0",
                        statusConfig.color,
                      )}
                    >
                      <StatusIcon className="h-3.5 w-3.5" />
                      {statusConfig.label}
                    </Badge>
                  </div>

                  {/* --- MAIN ROW: Performer, Service, Price & Actions --- */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    {/* Left: Performer Details */}
                    <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                      <div className="relative flex items-center justify-center flex-row md:flex-col shrink-0">
                        <Avatar className="h-14 w-14 border border-border/50 shadow-sm">
                          <AvatarFallback className="bg-primary/5 text-primary font-black text-lg">
                            {getInitials(order.performerName)}
                          </AvatarFallback>
                        </Avatar>
                        {isOnline && (
                          <span
                            className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-background shadow-[0_0_8px_1px_#10b981] animate-pulse"
                            title="В сети"
                          />
                        )}
                        <Link
                          href={`/performer-profile?id=${order.performerId}`}
                          className="text-lg font-bold text-foreground hover:text-primary transition-colors leading-tight mb-1"
                        >
                          {order.performerName}
                        </Link>
                      </div>
                      <div className="flex flex-col">
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 line-clamp-1">
                          {order.service}
                        </p>
                      </div>
                    </div>

                    {/* Right: Price & Actions */}
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4 md:gap-2 mt-2 md:mt-0">
                      <div className="text-2xl font-black tracking-tight tabular-nums text-foreground">
                        {order.price
                          ? `${order.price.toLocaleString("ru-RU")} ₽`
                          : "Договорная"}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-9 rounded-xl px-4 font-bold text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors shadow-none"
                          onClick={() => handleOpenChat(order.performerId)}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" /> Написать
                        </Button>
                        <Link href={`/my-bookings`}>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-white hover:border-primary/30 transition-all shadow-none"
                            title="Детали заказа"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
