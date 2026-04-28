"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

// Icons
import * as LucideIcons from "lucide-react";
import {
  ChefHat,
  Music,
  Palette,
  Camera,
  Mic,
  Users,
  Film,
  Smile,
  Utensils,
  MicVocal,
  Calendar,
  MapPin,
  Sparkles,
  ArrowRight,
  CheckCircle,
  ShieldCheck,
  MessageSquare,
  Search,
} from "lucide-react";

// Services & Hooks
import { useEventsQuery } from "@/services/events";
import { getSiteSettings, type SiteSettings } from "@/services/settings";

// --- LIGHTWEIGHT NLP DICTIONARIES ---
const CATEGORY_ALIASES = [
  { root: "фотограф", exactName: "Фотограф", paramType: "category" },
  { root: "видео", exactName: "Видеограф", paramType: "category" },
  { root: "диджей", exactName: "DJ", paramType: "category" },
  { root: "dj", exactName: "DJ", paramType: "category" },
  { root: "ведущ", exactName: "Ведущие", paramType: "category" },
  { root: "тамад", exactName: "Ведущие", paramType: "category" },
  { root: "дизайнер", exactName: "Дизайнер", paramType: "category" },
  { root: "артист", exactName: "Артисты", paramType: "category" },
  { root: "музыкант", exactName: "Артисты", paramType: "category" },
  { root: "повар", exactName: "Повар", paramType: "category" },
  { root: "кейтеринг", exactName: "Повар", paramType: "category" },
  { root: "аниматор", exactName: "Аниматор", paramType: "category" },
  { root: "ресторан", exactName: "Ресторан", paramType: "category" },
  { root: "площадк", exactName: "Ресторан", paramType: "category" },
  { root: "агентств", exactName: "agency", paramType: "accountType" },
];

const TOP_CITIES = [
  { root: "москв", exactName: "Москва" },
  { root: "санкт-петербург", exactName: "Санкт-Петербург" },
  { root: "питер", exactName: "Санкт-Петербург" },
  { root: "спб", exactName: "Санкт-Петербург" },
  { root: "казан", exactName: "Казань" },
  { root: "сочи", exactName: "Сочи" },
  { root: "краснодар", exactName: "Краснодар" },
  { root: "екатеринбург", exactName: "Екатеринбург" },
  { root: "новосибирск", exactName: "Новосибирск" },
  { root: "ростов", exactName: "Ростов-на-Дону" },
  { root: "уф", exactName: "Уфа" },
];

const fallbackCategories = [
  { name: "Фотографы", icon: "Camera", link: "/search?category=Фотограф" },
  { name: "Диджеи", icon: "Music", link: "/search?category=DJ" },
  { name: "Ведущие", icon: "Mic", link: "/search?category=Ведущие" },
  { name: "Артисты", icon: "MicVocal", link: "/search?category=Артисты" },
  { name: "Агентства", icon: "Users", link: "/search?accountType=agency" },
  { name: "Дизайнеры", icon: "Palette", link: "/search?category=Дизайнер" },
  { name: "Видеографы", icon: "Film", link: "/search?category=Видеограф" },
  { name: "Повара", icon: "ChefHat", link: "/search?category=Повар" },
  { name: "Аниматоры", icon: "Smile", link: "/search?category=Аниматор" },
  { name: "Рестораны", icon: "Utensils", link: "/search?category=Ресторан" },
];

export default function Home() {
  const router = useRouter();
  const [heroSearch, setHeroSearch] = useState("");

  const { data: events = [], isLoading: isEventsLoading } = useEventsQuery();
  const featuredEvents = events.slice(0, 6);

  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);

  useEffect(() => {
    getSiteSettings()
      .then((data) => setSettings(data))
      .catch((err) => console.error("Failed to load settings:", err))
      .finally(() => setIsSettingsLoading(false));
  }, []);

  const displayCategories = settings?.siteCategories?.length
    ? settings.siteCategories
    : fallbackCategories;

  const renderIcon = (iconName: string, className: string) => {
    const IconComponent = (LucideIcons as any)[iconName] as React.ElementType;
    return IconComponent ? (
      <IconComponent className={className} />
    ) : (
      <LucideIcons.HelpCircle className={className} />
    );
  };

  // --- SMART SEARCH HANDLER ---
  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const rawQuery = heroSearch.trim();
    if (!rawQuery) return;

    let extractedCity = "";
    let extractedCategory = "";
    let extractedAccountType = "";
    let remainingQuery = rawQuery.toLowerCase();

    // Parse City (Cyrillic-safe regex)
    for (const city of TOP_CITIES) {
      const cityRegex = new RegExp(
        `(?:^|\\s)(?:в\\s+|во\\s+)?${city.root}[а-яА-Яa-zA-Z\\-]*(?=\\s|[.,!?]|$)`,
        "i",
      );
      if (cityRegex.test(remainingQuery)) {
        extractedCity = city.exactName;
        remainingQuery = remainingQuery.replace(cityRegex, " ");
        break;
      }
    }

    // Parse Category / Account Type (Cyrillic-safe regex)
    for (const cat of CATEGORY_ALIASES) {
      const catRegex = new RegExp(
        `(?:^|\\s)${cat.root}[а-яА-Яa-zA-Z\\-]*(?=\\s|[.,!?]|$)`,
        "i",
      );
      if (catRegex.test(remainingQuery)) {
        if (cat.paramType === "category") {
          extractedCategory = cat.exactName;
        } else if (cat.paramType === "accountType") {
          extractedAccountType = cat.exactName;
        }
        remainingQuery = remainingQuery.replace(catRegex, " ");
        break;
      }
    }

    // Strip prepositions
    remainingQuery = remainingQuery
      .replace(/(?:^|\s)(в|во|на|для|с|и|или|по|к|до|от|за|о)(?=\s|$)/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

    const params = new URLSearchParams();

    if (extractedCategory) params.set("category", extractedCategory);
    if (extractedAccountType) params.set("accountType", extractedAccountType);
    if (extractedCity) params.set("city", extractedCity);
    if (remainingQuery) params.set("q", remainingQuery);

    if (
      !extractedCategory &&
      !extractedAccountType &&
      !extractedCity &&
      !remainingQuery
    ) {
      params.set("q", rawQuery);
    }

    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-16 pb-20 animate-in fade-in duration-700">
      {/* HERO SECTION */}
      <section className="relative w-full py-20 md:py-24 overflow-hidden flex flex-col items-center justify-center">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />

        <div className="container relative z-10 mx-auto px-4 text-center max-w-4xl">
          <Badge
            variant="secondary"
            className="mb-6 bg-primary/10 text-primary hover:bg-primary/20 px-4 py-1.5 text-sm font-bold uppercase tracking-widest border-transparent"
          >
            Твой гид в мире событий
          </Badge>

          <h1 className="text-4xl md:text-7xl font-extrabold mb-6 tracking-tight text-balance leading-tight">
            События, которые{" "}
            <span className="text-primary bg-clip-text  bg-gradient-to-r from-primary to-primary/60">
              вдохновляют
            </span>
          </h1>

          <p className="text-lg md:text-xl mb-10 text-muted-foreground max-w-2xl mx-auto text-balance">
            Найдите лучших профи или забронируйте билет на уникальное событие
            прямо сейчас.
          </p>
          <form
            onSubmit={handleHeroSearch}
            // 🚨 FIX: Removed border and ring on mobile, kept them for 'sm' and up
            className="flex items-center max-w-2xl mx-auto w-full bg-background/95 backdrop-blur-xl p-1.5 sm:p-2 rounded-full border-0 sm:border sm:border-primary/20 shadow-xl shadow-primary/5 transition-all focus-within:ring-0 sm:focus-within:ring-2 sm:focus-within:ring-primary/20 sm:focus-within:border-primary/30"
          >
            <div className="flex-grow flex items-center pl-3 sm:pl-4">
              <Search className="h-5 w-5 text-muted-foreground/70 shrink-0" />
              <Input
                type="text"
                placeholder="Кого вы ищете? (например: Фотограф на свадьбу...)"
                className="border-0 shadow-none focus-visible:ring-0 text-sm sm:text-base h-10 sm:h-12 bg-transparent w-full truncate placeholder:text-muted-foreground/60"
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="h-10 w-10 sm:h-12 sm:w-auto p-0 sm:px-8 rounded-full shrink-0 shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center justify-center"
            >
              {/* Text shows only on screens larger than mobile */}
              <span className="hidden sm:inline text-base font-bold">
                Найти
              </span>

              {/* Icon shows only on mobile */}
              <Search className="h-4 w-4 sm:hidden" />
            </Button>
          </form>
        </div>
      </section>

      {/* DYNAMIC CATEGORIES GRID */}
      <section className="container mx-auto px-4 -mt-12 relative z-20">
        <div className="bg-card rounded-3xl border p-6 md:p-8 shadow-sm">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Популярные услуги
          </h2>

          {isSettingsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-28 bg-muted animate-pulse rounded-2xl"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {displayCategories.map((category: any) => (
                <Card
                  key={category.id || category.name}
                  className="group hover:border-primary transition-all cursor-pointer text-center p-4 shadow-sm hover:shadow-md bg-muted/30 hover:bg-primary/5 border-transparent"
                  onClick={() => router.push(category.link)}
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 rounded-full bg-background shadow-sm text-primary transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
                      {renderIcon(category.icon || "HelpCircle", "w-6 h-6")}
                    </div>
                    <h3 className="font-semibold text-sm md:text-base">
                      {category.name}
                    </h3>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FEATURED EVENTS */}
      <section className="container mx-auto px-4 mt-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Ближайшие события
            </h2>
            <p className="text-muted-foreground mt-2 text-lg">
              Интересные активности в вашем городе
            </p>
          </div>
          <Button variant="ghost" className="hidden sm:flex text-base" asChild>
            <Link href="/events">
              Смотреть всё <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <ScrollArea className="w-full whitespace-nowrap pb-6">
          <div className="flex space-x-6">
            {isEventsLoading ? (
              [1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-[300px] h-[400px] bg-muted animate-pulse rounded-2xl shrink-0"
                />
              ))
            ) : featuredEvents.length > 0 ? (
              featuredEvents.map((event) => (
                <Card
                  key={event.id}
                  className="w-[280px] md:w-[320px] shrink-0 overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 border border-muted bg-card group rounded-2xl"
                  onClick={() => router.push(`/events/${event.id}`)}
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <Badge className="absolute top-3 left-3 bg-background/95 text-foreground backdrop-blur-sm border-none shadow-sm px-3 py-1 font-semibold">
                      {event.category}
                    </Badge>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-5">
                      <p className="text-white font-extrabold text-2xl drop-shadow-md">
                        {event.price > 0
                          ? `${event.price.toLocaleString()} ₽`
                          : "Бесплатно"}
                      </p>
                    </div>
                  </div>
                  <CardContent className="p-5 space-y-3">
                    <h3 className="font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors whitespace-normal">
                      {event.title}
                    </h3>
                    <div className="flex flex-col gap-2 text-sm text-muted-foreground font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary/70" />{" "}
                        {format(new Date(event.date), "d MMMM", { locale: ru })}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary/70" />{" "}
                        <span className="truncate">{event.city}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-muted-foreground py-10 w-full text-center">
                Ближайших событий пока нет.
              </p>
            )}
          </div>
          <ScrollBar orientation="horizontal" className="hidden sm:flex" />
        </ScrollArea>
        <Button variant="outline" className="w-full sm:hidden mt-4" asChild>
          <Link href="/events">Смотреть все события</Link>
        </Button>
      </section>

      {/* TRUST SECTION */}
      <section className="bg-muted/30 py-16 border-y">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 bg-background shadow-sm rounded-2xl text-green-600">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold">Проверенные профи</h3>
            <p className="text-muted-foreground">
              Каждый исполнитель проходит модерацию перед публикацией.
            </p>
          </div>
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 bg-background shadow-sm rounded-2xl text-blue-600">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold">Безопасная оплата</h3>
            <p className="text-muted-foreground">
              Ваши средства под защитой до момента подтверждения услуги.
            </p>
          </div>
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="p-4 bg-background shadow-sm rounded-2xl text-orange-600">
              <MessageSquare className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold">Поддержка 24/7</h3>
            <p className="text-muted-foreground">
              Мы всегда на связи, чтобы помочь решить любой вопрос.
            </p>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="container mx-auto px-4 text-center">
        <div className="bg-primary/5 rounded-[2.5rem] p-10 md:p-16 text-foreground border border-primary/10">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-6 tracking-tight">
            Готовы организовать событие?
          </h2>
          <p className="text-lg md:text-xl mb-10 text-muted-foreground max-w-2xl mx-auto">
            Присоединяйтесь к сообществу профессионалов и создавайте яркие
            моменты вместе с Eventomir.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              size="lg"
              className="font-bold px-8 h-14 text-base rounded-full shadow-lg"
              asChild
            >
              <Link href="/register-customer">Создать заказ</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="font-bold px-8 h-14 text-base rounded-full bg-background hover:bg-muted"
              asChild
            >
              <Link href="/register-performer">Стать исполнителем</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
