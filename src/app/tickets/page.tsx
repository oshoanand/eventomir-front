"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Ticket, Calendar, MapPin, Clock, QrCode } from "lucide-react";

// Import the hook we just created
import { useMyOrdersQuery } from "@/services/order";

export default function MyTicketsPage() {
  const { status: sessionStatus } = useSession();
  const router = useRouter();

  if (sessionStatus === "unauthenticated") {
    router.push("/login");
  }

  // Use the dedicated hook. It automatically waits until the user is authenticated.
  const { data: orders = [], isLoading } = useMyOrdersQuery(
    sessionStatus === "authenticated",
  );

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
    <div className="container mx-auto py-10 max-w-4xl">
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
          {orders.map((order) => (
            <Card
              key={order.id}
              className="overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row"
            >
              <div className="sm:w-1/3 h-48 sm:h-auto relative bg-muted">
                <img
                  src={order.event.imageUrl}
                  alt={order.event.title}
                  className="w-full h-full object-cover"
                />
                <Badge className="absolute top-3 left-3 bg-background/90 text-foreground border-none">
                  {order.status === "completed" ? "Оплачено" : "Ожидание"}
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
                        {order.event.address ? `, ${order.event.address}` : ""}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="flex items-center gap-2 font-semibold">
                    <Ticket className="h-5 w-5 text-primary" />
                    <span>
                      {order.ticketCount}{" "}
                      {order.ticketCount === 1 ? "билет" : "билета/ов"}
                    </span>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <QrCode className="h-4 w-4" /> Показать QR
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
