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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
          <div className="space-y-4">
            {orderHistory.map((order) => {
              const isOnline = onlineUsers.has(order.performerId);
              const statusConfig = getStatusDetails(order.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={order.id}
                  className="bg-background rounded-2xl p-5 border border-border/60 shadow-sm hover:shadow-md hover:border-primary/20 transition-all group flex flex-col gap-4 relative overflow-hidden"
                >
                  <div
                    className={cn(
                      "absolute left-0 top-0 bottom-0 w-1.5",
                      statusConfig.color.split(" ")[0],
                    )}
                  />

                  <div className="flex justify-between items-start gap-4 pl-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border-2 border-background shadow-sm shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary font-black text-lg">
                          {getInitials(order.performerName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <Link
                          href={`/performer-profile?id=${order.performerId}`}
                          className="font-bold hover:text-primary transition-colors flex items-center gap-1.5 text-[15px] leading-tight"
                        >
                          {order.performerName}
                          {isOnline && (
                            <span
                              className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20"
                              title="В сети"
                            />
                          )}
                        </Link>
                        <p className="text-[13px] font-medium text-muted-foreground mt-0.5 flex items-center gap-1.5">
                          <Briefcase className="h-3 w-3" /> {order.service}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-black text-lg text-foreground whitespace-nowrap">
                        {order.price
                          ? `${order.price.toLocaleString("ru-RU")} ₽`
                          : "Договорная"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-between items-center pt-3 border-t border-border/50 gap-3 pl-2">
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 flex items-center gap-1.5 border",
                          statusConfig.color,
                        )}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig.label}
                      </Badge>

                      <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {format(order.date, "d MMM yyyy", { locale: ru })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-8 rounded-full px-4 font-bold text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors shadow-none"
                        onClick={() => handleOpenChat(order.performerId)}
                      >
                        <MessageCircle className="h-3.5 w-3.5 mr-1.5" /> Чат
                      </Button>
                      <Link href={`/my-bookings`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
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
