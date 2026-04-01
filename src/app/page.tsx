// "use client";

// import React, { useState, useEffect } from "react";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { format } from "date-fns";
// import { ru } from "date-fns/locale";

// // UI Components
// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

// // Icons - We import LucideIcons dynamically for categories, and specific ones for UI
// import * as LucideIcons from "lucide-react";
// import {
//   ChefHat,
//   Music,
//   Palette,
//   Camera,
//   Mic,
//   Users,
//   Film,
//   Smile,
//   Utensils,
//   MicVocal,
//   Calendar,
//   MapPin,
//   Sparkles,
//   ArrowRight,
//   Ticket,
//   CheckCircle,
//   ShieldCheck,
//   MessageSquare,
// } from "lucide-react";

// // Services & Hooks
// import { useEventsQuery } from "@/services/events";
// import { getSiteSettings, type SiteSettings } from "@/services/settings";

// // Fallback hardcoded categories in case the settings API is slow or fails

// const fallbackCategories = [
//   { name: "Фотографы", icon: Camera, link: "/search?category=Фотограф" },
//   { name: "Диджеи", icon: Music, link: "/search?category=DJ" },
//   { name: "Ведущие", icon: Mic, link: "/search?category=Ведущие" },
//   { name: "Артисты", icon: MicVocal, link: "/search?category=Артисты" },
//   { name: "Агентства", icon: Users, link: "/search?accountType=agency" },
//   { name: "Дизайнеры", icon: Palette, link: "/search?category=Дизайнер" },
//   { name: "Видеографы", icon: Film, link: "/search?category=Видеограф" },
//   { name: "Повара", icon: ChefHat, link: "/search?category=Повар" },
//   { name: "Аниматоры", icon: Smile, link: "/search?category=Аниматор" },
//   { name: "Рестораны", icon: Utensils, link: "/search?category=Ресторан" },
// ];

// export default function Home() {
//   const router = useRouter();

//   // 1. Fetch Events using the new React Query hook
//   const { data: events = [], isLoading: isEventsLoading } = useEventsQuery();
//   const featuredEvents = events.slice(0, 6);

//   // 2. Fetch Settings (for dynamic categories) using standard state
//   const [settings, setSettings] = useState<SiteSettings | null>(null);
//   const [isSettingsLoading, setIsSettingsLoading] = useState(true);

//   useEffect(() => {
//     getSiteSettings()
//       .then((data) => setSettings(data))
//       .catch((err) => console.error("Failed to load settings:", err))
//       .finally(() => setIsSettingsLoading(false));
//   }, []);

//   // Determine which categories to show (prefer backend, fallback to hardcoded)
//   const displayCategories = settings?.siteCategories?.length
//     ? settings.siteCategories
//     : fallbackCategories;

//   // Helper function to safely render dynamic icons from string names stored in DB
//   const renderIcon = (iconName: string, className: string) => {
//     const IconComponent = (LucideIcons as any)[iconName] as React.ElementType;
//     return IconComponent ? (
//       <IconComponent className={className} />
//     ) : (
//       <LucideIcons.HelpCircle className={className} /> // Fallback icon
//     );
//   };

//   return (
//     <div className="flex flex-col gap-16 pb-20 animate-in fade-in duration-500">
//       {/* Light Hero Section */}
//       <section className="relative h-[60vh] min-h-[400px] flex items-center justify-center overflow-hidden bg-background">
//         <div className="container relative z-10 mx-auto text-center px-4 text-foreground">
//           <Badge
//             variant="outline"
//             className="mb-6 border-primary text-primary px-4 py-1 text-sm font-bold uppercase tracking-widest"
//           >
//             Твой гид в мире событий
//           </Badge>
//           <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight text-balance">
//             События, которые вдохновляют
//           </h1>
//           <p className="text-lg md:text-xl mb-10 max-w-2xl mx-auto opacity-80 text-balance">
//             Найдите лучших профи или забронируйте билет на уникальное событие
//             прямо сейчас.
//           </p>
//           <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
//             <Button
//               size="lg"
//               className="h-12 px-8 text-base font-bold shadow-lg shadow-destructive/20"
//               variant="destructive"
//               onClick={() => router.push("/search")}
//             >
//               Найти исполнителя
//             </Button>
//             <Button
//               size="lg"
//               variant="outline"
//               className="h-12 px-8 text-base font-bold bg-white/50 backdrop-blur-sm"
//               onClick={() => router.push("/events")}
//             >
//               Афиша событий
//             </Button>
//           </div>
//         </div>
//       </section>

//       {/* Featured Events */}
//       <section className="container mx-auto px-4">
//         <div className="flex justify-between items-end mb-8">
//           <div>
//             <h2 className="text-3xl font-bold">Ближайшие события</h2>
//             <p className="text-muted-foreground mt-1">
//               Интересные активности в вашем городе
//             </p>
//           </div>
//           <Button variant="ghost" asChild>
//             <Link href="/events" className="flex items-center">
//               Смотреть всё <ArrowRight className="ml-2 h-4 w-4" />
//             </Link>
//           </Button>
//         </div>

//         <ScrollArea className="w-full whitespace-nowrap">
//           <div className="flex space-x-6 pb-6">
//             {isEventsLoading ? (
//               // Loading Skeletons
//               [1, 2, 3, 4].map((i) => (
//                 <div
//                   key={i}
//                   className="w-[300px] h-[400px] bg-muted animate-pulse rounded-xl shrink-0"
//                 />
//               ))
//             ) : featuredEvents.length > 0 ? (
//               featuredEvents.map((event) => (
//                 <Card
//                   key={event.id}
//                   className="w-[300px] shrink-0 overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 border-none shadow-sm group"
//                   onClick={() => router.push(`/events/${event.id}`)}
//                 >
//                   <div className="relative aspect-[3/4] overflow-hidden bg-muted">
//                     <img
//                       src={event.imageUrl}
//                       alt={event.title}
//                       className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
//                       data-ai-hint="event image"
//                       onError={(e) => {
//                         (e.target as HTMLImageElement).style.display = "none";
//                       }}
//                     />
//                     <Badge className="absolute top-3 left-3 bg-background/90 text-foreground border-none backdrop-blur-sm z-10">
//                       {event.category}
//                     </Badge>
//                     <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
//                       <p className="text-white font-bold text-lg">
//                         {event.price} ₽
//                       </p>
//                     </div>
//                   </div>
//                   <CardContent className="p-4 space-y-2">
//                     <h3 className="font-bold text-lg line-clamp-1">
//                       {event.title}
//                     </h3>
//                     <div className="flex items-center text-sm text-muted-foreground gap-2">
//                       <Calendar className="h-3 w-3" />{" "}
//                       {format(new Date(event.date), "d MMM", { locale: ru })}
//                       <MapPin className="h-3 w-3 ml-2" /> {event.city}
//                     </div>
//                   </CardContent>
//                 </Card>
//               ))
//             ) : (
//               <p className="text-muted-foreground py-10">
//                 Ближайших событий пока нет.
//               </p>
//             )}
//           </div>
//           <ScrollBar orientation="horizontal" />
//         </ScrollArea>
//       </section>

//       {/* Discovery Collections */}
//       <section className="container mx-auto px-4">
//         <h2 className="text-3xl font-bold mb-8">Откройте для себя новое</h2>
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           <Card
//             className="group relative h-64 overflow-hidden border-none cursor-pointer"
//             onClick={() => router.push("/events?category=Гастро-ужин")}
//           >
//             <img
//               src="https://picsum.photos/seed/food/800/600"
//               className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
//               alt="Food"
//               data-ai-hint="culinary workshop"
//             />
//             <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
//             <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
//               <h3 className="text-2xl font-bold">
//                 Гастрономические приключения
//               </h3>
//               <p className="text-sm opacity-90">
//                 Ужины и мастер-классы от лучших шеф-поваров
//               </p>
//             </div>
//           </Card>
//           <Card
//             className="group relative h-64 overflow-hidden border-none cursor-pointer"
//             onClick={() => router.push("/events?category=Мастер-класс")}
//           >
//             <img
//               src="https://picsum.photos/seed/art/800/600"
//               className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
//               alt="Art"
//               data-ai-hint="artist workshop"
//             />
//             <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
//             <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
//               <h3 className="text-2xl font-bold">Творчество и развитие</h3>
//               <p className="text-sm opacity-90">
//                 Воркшопы, лекции и фото-прогулки
//               </p>
//             </div>
//           </Card>
//         </div>
//       </section>

//       {/* Dynamic Categories Grid */}
//       <section className="bg-muted/30 py-16">
//         <div className="container mx-auto px-4">
//           <h2 className="text-3xl font-bold text-center mb-12">
//             Найдите своего профи
//           </h2>

//           {isSettingsLoading ? (
//             // Loading Skeletons for Categories
//             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
//               {[1, 2, 3, 4, 5].map((i) => (
//                 <div
//                   key={i}
//                   className="h-[120px] bg-muted/50 animate-pulse rounded-xl"
//                 />
//               ))}
//             </div>
//           ) : (
//             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
//               {displayCategories.map((category: any) => (
//                 <Card
//                   key={category.id || category.name}
//                   className="hover:border-primary/50 transition-all cursor-pointer text-center p-6 shadow-sm hover:shadow-md border-none bg-card group"
//                   onClick={() => router.push(category.link)}
//                 >
//                   <div className="flex flex-col items-center gap-3">
//                     <div className="p-3 rounded-full bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
//                       {/* Safely render the icon from the string name */}
//                       {renderIcon(category.icon, "w-6 h-6")}
//                     </div>
//                     <h3 className="font-semibold text-sm">{category.name}</h3>
//                   </div>
//                 </Card>
//               ))}
//             </div>
//           )}
//         </div>
//       </section>

//       {/* Trust & Safety Section */}
//       <section className="container mx-auto px-4">
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-12 border-y">
//           <div className="flex flex-col items-center text-center space-y-3">
//             <div className="p-3 bg-green-100 text-green-600 rounded-full">
//               <ShieldCheck className="h-8 w-8" />
//             </div>
//             <h3 className="font-bold">Проверенные профи</h3>
//             <p className="text-sm text-muted-foreground">
//               Каждый исполнитель проходит ручную модерацию перед публикацией.
//             </p>
//           </div>
//           <div className="flex flex-col items-center text-center space-y-3">
//             <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
//               <CheckCircle className="h-8 w-8" />
//             </div>
//             <h3 className="font-bold">Безопасная оплата</h3>
//             <p className="text-sm text-muted-foreground">
//               Ваши средства под защитой до момента подтверждения услуги.
//             </p>
//           </div>
//           <div className="flex flex-col items-center text-center space-y-3">
//             <div className="p-3 bg-orange-100 text-orange-600 rounded-full">
//               <MessageSquare className="h-8 w-8" />
//             </div>
//             <h3 className="font-bold">Поддержка 24/7</h3>
//             <p className="text-sm text-muted-foreground">
//               Мы всегда на связи, чтобы помочь решить любой вопрос.
//             </p>
//           </div>
//         </div>
//       </section>

//       {/* CTA */}
//       <section className="container mx-auto px-4 text-center py-12">
//         <div className="bg-secondary rounded-3xl p-12 text-foreground shadow-sm border border-primary/10">
//           <Sparkles className="h-12 w-12 mx-auto mb-6 text-primary opacity-80" />
//           <h2 className="text-3xl md:text-4xl font-bold mb-6">
//             Готовы организовать событие?
//           </h2>
//           <p className="text-lg mb-8 text-muted-foreground max-w-xl mx-auto">
//             Присоединяйтесь к сообществу профессионалов и создавайте яркие
//             моменты вместе с Eventomir.
//           </p>
//           <div className="flex flex-wrap justify-center gap-4">
//             <Button
//               size="lg"
//               variant="destructive"
//               className="font-bold px-8 h-12 shadow-lg shadow-destructive/20"
//               asChild
//             >
//               <Link href="/register-customer">Создать заказ</Link>
//             </Button>
//             <Button
//               size="lg"
//               variant="outline"
//               className="font-bold px-8 h-12 bg-background/50 hover:bg-background"
//               asChild
//             >
//               <Link href="/register-performer">Стать профи</Link>
//             </Button>
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// }

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

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      router.push(`/search?q=${encodeURIComponent(heroSearch.trim())}`);
    }
  };

  return (
    <div className="flex flex-col gap-16 pb-20 animate-in fade-in duration-700">
      {/* --- HERO SECTION --- */}
      <section className="relative w-full pt-24 pb-32 overflow-hidden flex flex-col items-center justify-center">
        {/* Modern Background Gradient */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />

        <div className="container relative z-10 mx-auto px-4 text-center max-w-4xl">
          <Badge
            variant="secondary"
            className="mb-6 bg-primary/10 text-primary hover:bg-primary/20 px-4 py-1.5 text-sm font-bold uppercase tracking-widest border-transparent"
          >
            Твой гид в мире событий
          </Badge>

          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight text-balance leading-tight">
            События, которые{" "}
            <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              вдохновляют
            </span>
          </h1>

          <p className="text-lg md:text-xl mb-10 text-muted-foreground max-w-2xl mx-auto text-balance">
            Найдите лучших профи или забронируйте билет на уникальное событие
            прямо сейчас.
          </p>

          {/* Integrated Fast Search Bar */}
          <form
            onSubmit={handleHeroSearch}
            className="flex flex-col sm:flex-row max-w-2xl mx-auto gap-3 bg-background/80 backdrop-blur-xl p-2 rounded-3xl sm:rounded-full shadow-xl border border-primary/10"
          >
            <div className="relative flex-grow flex items-center pl-4">
              <Search className="h-5 w-5 text-muted-foreground shrink-0" />
              <Input
                type="text"
                placeholder="Кого вы ищете? (например: Фотограф на свадьбу)"
                className="border-0 shadow-none focus-visible:ring-0 text-base h-12 bg-transparent w-full"
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="h-12 sm:rounded-full rounded-2xl px-8 text-base font-bold shrink-0"
            >
              Найти
            </Button>
          </form>
        </div>
      </section>

      {/* --- DYNAMIC CATEGORIES GRID --- */}
      <section className="container mx-auto px-4 -mt-12 relative z-20">
        <div className="bg-card rounded-3xl shadow-lg border p-6 md:p-8">
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

      {/* --- FEATURED EVENTS --- */}
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
                    <h3 className="font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
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

      {/* --- TRUST SECTION --- */}
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

      {/* --- CTA SECTION --- */}
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
