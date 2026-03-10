"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

// Icons
import {
  Ticket,
  MapPin,
  Calendar as CalendarIcon,
  Search,
  Clock,
  Users,
} from "lucide-react";

// Services
import { useEventsQuery } from "@/services/events";

export default function EventsPage() {
  // --- Data Fetching ---
  const { data: events = [], isLoading } = useEventsQuery();

  // --- Filters State ---
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // --- Client-Side Filtering ---
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // 1. PUBLIC VISIBILITY RULE: Only show active events
      if (event.status !== "active") return false;

      // 2. Search Query Filter (Title or City)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = event.title.toLowerCase().includes(query);
        const matchesCity = event.city.toLowerCase().includes(query);
        if (!matchesTitle && !matchesCity) return false;
      }

      // 3. Category Filter
      if (categoryFilter !== "all" && event.category !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [events, searchQuery, categoryFilter]);

  // Dynamically extract unique categories from active events for the dropdown
  const availableCategories = useMemo(() => {
    const activeEvents = events.filter((e) => e.status === "active");
    const categories = new Set(activeEvents.map((e) => e.category));
    return Array.from(categories).sort();
  }, [events]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Action is handled automatically by useMemo, just preventing form reload
  };

  const EventCardSkeleton = () => (
    <Card className="overflow-hidden border-none shadow-sm">
      <Skeleton className="h-48 w-full rounded-none" />
      <CardHeader>
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-12 w-full" />
      </CardFooter>
    </Card>
  );

  return (
    <div className="container mx-auto py-10 px-4 md:px-8 space-y-8 animate-in fade-in duration-500 min-h-screen">
      <header className="text-center space-y-4 pt-4">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          Афиша событий
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Найдите то, что вдохновит вас сегодня. Выбирайте лучшие мероприятия в
          вашем городе и бронируйте билеты онлайн.
        </p>
      </header>

      {/* Filters Section */}
      <Card className="bg-muted/30 border-none shadow-none">
        <CardContent className="pt-6">
          <form
            onSubmit={handleSearch}
            className="grid grid-cols-1 md:grid-cols-12 gap-4"
          >
            <div className="md:col-span-5 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Поиск по названию или городу..."
                className="pl-10 h-12 bg-background text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="md:col-span-4">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-12 bg-background text-base">
                  <SelectValue placeholder="Все категории" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все категории</SelectItem>
                  {availableCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3">
              <Button
                type="button"
                variant="destructive"
                className="w-full h-12 text-base font-bold shadow-lg shadow-destructive/20"
              >
                Найти
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Events Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <EventCardSkeleton />
          <EventCardSkeleton />
          <EventCardSkeleton />
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-24 bg-muted/20 rounded-2xl border-2 border-dashed">
          <Ticket className="h-16 w-16 mx-auto text-muted-foreground mb-4 opacity-20" />
          <h3 className="text-2xl font-bold mb-2">События не найдены</h3>
          <p className="text-muted-foreground mb-6">
            По вашему запросу ничего не нашлось. Попробуйте изменить параметры
            поиска.
          </p>
          {(searchQuery || categoryFilter !== "all") && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setCategoryFilter("all");
              }}
            >
              Сбросить фильтры
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredEvents.map((event) => {
            const isSoldOut = event.availableTickets <= 0;

            return (
              <Card
                key={event.id}
                className="flex flex-col overflow-hidden hover:shadow-xl transition-all duration-300 group border-none shadow-md bg-card"
              >
                <div className="relative h-60 overflow-hidden bg-muted">
                  <Link href={`/events/${event.id}`}>
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </Link>
                  <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
                    <Badge className="bg-primary/90 text-white backdrop-blur-sm border-none shadow-sm text-sm px-3 py-1">
                      {event.category}
                    </Badge>
                    {isSoldOut && (
                      <Badge
                        variant="destructive"
                        className="border-none w-fit shadow-sm text-xs"
                      >
                        SOLD OUT
                      </Badge>
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4">
                    <p className="text-white font-extrabold text-2xl">
                      {event.price > 0
                        ? `${event.price.toLocaleString()} ₽`
                        : "Бесплатно"}
                    </p>
                  </div>
                </div>

                <CardHeader className="pb-3">
                  <Link
                    href={`/events/${event.id}`}
                    className="hover:underline decoration-primary underline-offset-4"
                  >
                    <CardTitle className="text-xl line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                      {event.title}
                    </CardTitle>
                  </Link>
                  <CardDescription className="flex items-center gap-1.5 text-primary/80 font-medium mt-2">
                    <Users className="h-4 w-4" />
                    <span className="truncate">
                      {event.host?.name || "Платформа Eventomir"}
                    </span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-grow space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 shrink-0 text-primary/70" />
                    <span>
                      {format(new Date(event.date), "d MMMM yyyy", {
                        locale: ru,
                      })}
                    </span>
                  </div>
                  {event.time && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 shrink-0 text-primary/70" />
                      <span>{event.time}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0 text-primary/70" />
                    <span className="truncate">
                      {event.city}
                      {event.address ? `, ${event.address}` : ""}
                    </span>
                  </div>
                </CardContent>

                <CardFooter className="pt-4 pb-6 px-6 border-t bg-muted/5 flex flex-col gap-3 mt-auto">
                  <div className="w-full flex justify-between items-center text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-medium">
                      <Ticket className="h-3.5 w-3.5" /> Билеты
                    </span>
                    <span
                      className={
                        isSoldOut
                          ? "text-destructive font-bold"
                          : "font-medium text-foreground"
                      }
                    >
                      {event.availableTickets} / {event.totalTickets}
                    </span>
                  </div>
                  <Button
                    asChild
                    variant={isSoldOut ? "secondary" : "destructive"}
                    className="w-full h-12 text-base font-bold shadow-sm"
                  >
                    <Link href={`/events/${event.id}`}>
                      {isSoldOut ? "Мест нет" : "Купить билет"}
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
