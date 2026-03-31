"use client";

import { useState } from "react";
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
} from "lucide-react";

import { useMyOrdersQuery } from "@/services/order";

// Helper function to determine the exact ticket status
const getTicketStatus = (order: any) => {
  const now = new Date();
  const eventDate = new Date(order.event.date);
  // Add 24 hours buffer for expiration to cover the entire day of the event
  eventDate.setHours(eventDate.getHours() + 24);

  if (order.status === "cancelled" || order.status === "CANCELLED") {
    return {
      label: "Отменен",
      className: "bg-red-100 text-red-800 hover:bg-red-100",
    };
  }
  if (order.isUsed) {
    return {
      label: "Использован",
      className: "bg-gray-200 text-gray-800 hover:bg-gray-200",
    };
  }
  if (now > eventDate) {
    return {
      label: "Истек",
      className: "bg-orange-100 text-orange-800 hover:bg-orange-100",
    };
  }
  if (
    order.status === "completed" ||
    order.status === "PAYMENT_SUCCESS" ||
    order.status === "ACTIVE"
  ) {
    return {
      label: "Активен",
      className: "bg-green-100 text-green-800 hover:bg-green-100",
    };
  }
  return {
    label: "Ожидание",
    className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  };
};

export default function MyTicketsPage() {
  const { status: sessionStatus } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  // Track which order is currently generating a PDF
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (sessionStatus === "unauthenticated") {
    router.push("/login");
  }

  const { data: orders = [], isLoading } = useMyOrdersQuery(
    sessionStatus === "authenticated",
  );

  // --- PDF Handlers ---
  const handleDownloadPdf = async (order: any) => {
    setProcessingId(order.id);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders/${order.id}/pdf`,
      );
      if (!response.ok) throw new Error("Failed to generate PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Ticket_${order.event.title.replace(/\s+/g, "_")}.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось скачать билет. Попробуйте позже.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handlePrint = async (order: any) => {
    setProcessingId(order.id);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/orders/${order.id}/pdf`,
      );
      if (!response.ok) throw new Error("Failed to generate PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Open the PDF in a new browser tab where the user can hit CTRL+P
      const printWindow = window.open(url, "_blank");
      if (printWindow) {
        // Optional: Trigger print dialog automatically after PDF loads
        printWindow.onload = () => printWindow.print();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось подготовить билет к печати.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (sessionStatus === "loading" || isLoading) {
    return (
      <div className="container mx-auto py-10 max-w-4xl space-y-6">
        <Skeleton className="h-10 w-48 mb-6" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 max-w-4xl animate-in fade-in">
      <div className="flex items-center gap-3 mb-8">
        <Ticket className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Мои билеты</h1>
      </div>

      {orders.length === 0 ? (
        <Card className="border-dashed bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <Ticket className="h-16 w-16 text-muted-foreground mb-4 opacity-20" />
            <h2 className="text-2xl font-bold mb-2">У вас пока нет билетов</h2>
            <p className="text-muted-foreground mb-6">
              Самое время найти интересное событие!
            </p>
            <Button asChild variant="destructive">
              <Link href="/events">Смотреть афишу</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {orders.map((order: any) => {
            const status = getTicketStatus(order);
            const isProcessing = processingId === order.id;

            return (
              <Card
                key={order.id}
                className={`overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row ${
                  status.label === "Истек" || status.label === "Отменен"
                    ? "opacity-75 grayscale"
                    : ""
                }`}
              >
                <div className="sm:w-1/3 h-48 sm:h-auto relative bg-muted">
                  <img
                    src={order.event.imageUrl}
                    alt={order.event.title}
                    className="w-full h-full object-cover"
                  />
                  <Badge
                    className={`absolute top-3 left-3 border-none shadow-sm ${status.className}`}
                  >
                    {status.label}
                  </Badge>
                </div>
                <div className="sm:w-2/3 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <Link
                        href={`/events/${order.event.id}`}
                        className="hover:underline decoration-primary"
                      >
                        <CardTitle className="text-xl line-clamp-2">
                          {order.event.title}
                        </CardTitle>
                      </Link>
                      <div className="text-right shrink-0 ml-4">
                        <p className="text-sm text-muted-foreground">Заказ №</p>
                        <p className="font-mono text-xs font-semibold">
                          {order.id.split("-")[0].toUpperCase()}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 mt-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>
                          {format(new Date(order.event.date), "dd MMMM yyyy", {
                            locale: ru,
                          })}
                        </span>
                        {order.event.time && (
                          <>
                            <Clock className="h-4 w-4 text-primary ml-2" />
                            <span>{order.event.time}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="truncate">
                          {order.event.city}
                          {order.event.address
                            ? `, ${order.event.address}`
                            : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-6 pt-4 border-t gap-4 sm:gap-0">
                    <div className="flex items-center gap-2 font-semibold">
                      <Ticket className="h-5 w-5 text-primary" />
                      <span>
                        {order.ticketCount}{" "}
                        {order.ticketCount === 1 ? "билет" : "билета/ов"}
                      </span>
                    </div>

                    {/* Only show download/print if the ticket is successfully purchased */}
                    {(status.label === "Активен" ||
                      status.label === "Использован") && (
                      <div className="flex gap-2 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 w-full sm:w-auto"
                          onClick={() => handlePrint(order)}
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
                          className="gap-2 w-full sm:w-auto"
                          onClick={() => handleDownloadPdf(order)}
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                          Скачать PDF
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
