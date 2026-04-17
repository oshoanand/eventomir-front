"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Ticket,
  Calendar,
  MapPin,
  Clock,
  Download,
  Printer,
  Loader2,
  ExternalLink,
} from "lucide-react";

import { useMyOrdersQuery } from "@/services/order";

// --- TYPES ---
interface UnifiedTicket {
  id: string;
  type: "ORDER" | "INVITATION";
  title: string;
  date: string;
  time: string | null;
  city: string;
  address: string | null;
  imageUrl: string | null;
  status: string;
  isUsed: boolean;
  ticketCount: number;
  eventId: string;
}

// --- UTILS ---
const getTicketStatus = (ticket: UnifiedTicket) => {
  const now = new Date();
  const eventDate = new Date(ticket.date);
  eventDate.setHours(eventDate.getHours() + 24);

  if (["cancelled", "CANCELLED", "REJECTED"].includes(ticket.status)) {
    return { label: "Отменен", className: "bg-red-100 text-red-800" };
  }
  if (ticket.isUsed) {
    return { label: "Использован", className: "bg-gray-200 text-gray-800" };
  }
  if (now > eventDate) {
    return { label: "Истек", className: "bg-orange-100 text-orange-800" };
  }
  if (
    ["PAYMENT_SUCCESS", "ACTIVE", "ACCEPTED", "completed"].includes(
      ticket.status,
    )
  ) {
    return { label: "Активен", className: "bg-green-100 text-green-800" };
  }

  return { label: "Ожидание", className: "bg-yellow-100 text-yellow-800" };
};

// --- SUB-COMPONENTS ---

const TicketsLoadingSkeleton = () => (
  <div className="container mx-auto py-10 max-w-4xl space-y-6 px-4">
    <Skeleton className="h-10 w-48 mb-6" />
    {[1, 2].map((i) => (
      <Skeleton key={i} className="h-48 w-full rounded-2xl" />
    ))}
  </div>
);

const EmptyState = () => (
  <Card className="border-dashed bg-muted/10 rounded-[2rem]">
    <CardContent className="flex flex-col items-center justify-center py-24 text-center">
      <div className="bg-background p-6 rounded-full shadow-sm mb-6">
        <Ticket className="h-12 w-12 text-muted-foreground opacity-40" />
      </div>
      <h2 className="text-2xl font-bold">Билетов пока нет</h2>
      <p className="text-muted-foreground mt-2 mb-8 max-w-xs">
        Все купленные билеты и подтвержденные приглашения появятся здесь.
      </p>
      <Button asChild size="lg" className="rounded-xl font-bold">
        <Link href="/events">Найти событие</Link>
      </Button>
    </CardContent>
  </Card>
);

const TicketCard = ({
  ticket,
  isProcessing,
  onAction,
}: {
  ticket: UnifiedTicket;
  isProcessing: boolean;
  onAction: (ticket: UnifiedTicket, action: "download" | "print") => void;
}) => {
  const status = getTicketStatus(ticket);
  const isInactive = ["Истек", "Отменен"].includes(status.label);

  return (
    <Card
      className={`overflow-hidden border-none shadow-sm hover:shadow-md transition-all rounded-[1.5rem] flex flex-col sm:flex-row ${
        isInactive ? "opacity-60 grayscale-[0.5]" : ""
      }`}
    >
      {/* Image Section */}
      <div className="sm:w-1/3 h-48 sm:h-auto relative bg-muted group shrink-0">
        <img
          src={ticket.imageUrl || "/images/placeholder-event.jpg"}
          alt={ticket.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <Badge
          className={`absolute top-4 left-4 border-none shadow-md px-3 py-1 font-bold ${status.className}`}
        >
          {status.label}
        </Badge>
      </div>

      {/* Content Section */}
      <div className="sm:w-2/3 p-6 flex flex-col justify-between bg-card w-full">
        <div>
          <div className="flex justify-between items-start mb-4">
            <Link href={`/events/${ticket.eventId}`} className="group">
              <CardTitle className="text-xl font-extrabold line-clamp-2 group-hover:text-primary transition-colors">
                {ticket.title}
              </CardTitle>
            </Link>
            <div className="text-right shrink-0 ml-4 hidden sm:block">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                ID билета
              </p>
              <p className="font-mono text-xs font-bold text-primary">
                #{ticket.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5 text-sm font-medium">
              <div className="bg-primary/10 p-1.5 rounded-lg shrink-0">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <span className="text-foreground/80">
                {format(new Date(ticket.date), "dd MMMM yyyy", { locale: ru })}
              </span>
              {ticket.time && (
                <div className="flex items-center gap-1.5 ml-2 border-l pl-3 shrink-0">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>{ticket.time}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2.5 text-sm font-medium">
              <div className="bg-primary/10 p-1.5 rounded-lg shrink-0">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <span className="truncate text-foreground/80">
                {ticket.city}
                {ticket.address ? `, ${ticket.address}` : ""}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between mt-8 pt-5 border-t border-dashed gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <Ticket className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">
                Количество
              </p>
              <p className="text-sm font-black">
                {ticket.ticketCount}{" "}
                {ticket.ticketCount === 1 ? "билет" : "билета"}
              </p>
            </div>
          </div>

          {status.label === "Активен" && (
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 sm:flex-none rounded-xl font-bold gap-2"
                onClick={() => onAction(ticket, "print")}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Printer className="h-4 w-4" />
                )}
                Печать
              </Button>
              <Button
                variant="default"
                size="sm"
                className="flex-1 sm:flex-none rounded-xl font-bold gap-2 shadow-sm"
                onClick={() => onAction(ticket, "download")}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                PDF
              </Button>
            </div>
          )}

          {isInactive && (
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="text-muted-foreground font-bold shrink-0"
            >
              <Link href={`/events/${ticket.eventId}`}>
                Повторить заказ <ExternalLink className="ml-2 h-3 w-3" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

// --- MAIN PAGE COMPONENT ---
export default function MyTicketsPage() {
  const { status: sessionStatus } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data: tickets = [], isLoading } = useMyOrdersQuery(
    sessionStatus === "authenticated",
  );

  // BEST PRACTICE: Handle redirects inside useEffect, not during render
  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login");
    }
  }, [sessionStatus, router]);

  const handleAction = async (
    ticket: UnifiedTicket,
    action: "download" | "print",
  ) => {
    setProcessingId(ticket.id);
    try {
      const endpoint =
        ticket.type === "ORDER"
          ? `/api/orders/${ticket.id}/pdf`
          : `/api/invitations/${ticket.id}/pdf`;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}${endpoint}`,
      );
      if (!response.ok) throw new Error("Failed to fetch PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      if (action === "print") {
        const printWindow = window.open(url, "_blank");
        if (printWindow) printWindow.onload = () => printWindow.print();
      } else {
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute(
          "download",
          `Ticket_${ticket.title.replace(/\s+/g, "_")}.pdf`,
        );
        document.body.appendChild(link);
        link.click();
        link.remove();
      }

      // Cleanup URL object after action
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось подготовить файл билета.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Prevent flash of content while redirecting
  if (sessionStatus === "unauthenticated") return null;

  if (sessionStatus === "loading" || isLoading) {
    return <TicketsLoadingSkeleton />;
  }

  return (
    <div className="container mx-auto py-10 max-w-4xl px-4 animate-in fade-in">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Ticket className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-black tracking-tight">Мои билеты</h1>
        </div>
      </div>

      {tickets.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-6">
          {tickets.map((ticket: UnifiedTicket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              isProcessing={processingId === ticket.id}
              onAction={handleAction}
            />
          ))}
        </div>
      )}
    </div>
  );
}
