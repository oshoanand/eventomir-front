import { Metadata, ResolvingMetadata } from "next";
import { prisma } from "@/utils/prisma";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { notFound } from "next/navigation";
import { MapPin, Calendar, Clock, User } from "lucide-react";
import EventActionBox from "./EventActionBox";

// Define the type for the async params
type Props = {
  params: Promise<{ id: string }>;
};

// --- DYNAMIC OPEN GRAPH METADATA ---
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  // Await the params
  const { id: eventId } = await params;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { host: { select: { name: true } } },
  });

  if (!event) {
    return { title: "Событие не найдено | Eventomir" };
  }

  const appDomain = process.env.NEXTAUTH_URL || "https://app.eventomir.ru";
  const eventUrl = `${appDomain}/e/${eventId}`;
  const hostName = event.host?.name || "Eventomir";

  const ogTitle = `${event.title} | Приглашение от ${hostName}`;
  const ogDescription = event.description
    ? event.description.substring(0, 150) + "..."
    : `Приглашаем вас на ${event.title} — ${format(new Date(event.date), "d MMMM yyyy", { locale: ru })}`;

  const ogImage = event.imageUrl || `${appDomain}/images/default-event-og.jpg`;

  return {
    title: event.title,
    description: ogDescription,
    alternates: {
      canonical: eventUrl,
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: eventUrl,
      siteName: "Eventomir",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: event.title,
        },
      ],
      locale: "ru_RU",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      images: [ogImage],
    },
  };
}

// --- MAIN PAGE COMPONENT ---
export default async function PublicEventPage({ params }: Props) {
  // Await the params
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id: id },
    include: { host: { select: { name: true, profile_picture: true } } },
  });

  if (!event || event.status === "draft") {
    notFound();
  }

  const isSoldOut = event.availableTickets <= 0;
  const isExpired = new Date() > new Date(event.date);

  return (
    <div className="min-h-screen bg-muted/10 pb-20 font-sans selection:bg-primary/20">
      {/* ... rest of your UI code stays exactly the same ... */}
      <div className="w-full h-[40vh] md:h-[55vh] relative bg-black">
        <img
          src={event.imageUrl || "/images/default-event-og.jpg"}
          alt={event.title}
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 pb-12 md:pb-16 container mx-auto max-w-5xl z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold uppercase tracking-widest mb-4">
            {event.category}
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
            {event.title}
          </h1>
          <div className="flex items-center gap-3 mt-4 text-white/90">
            {event.host?.profile_picture ? (
              <img
                src={event.host.profile_picture}
                alt="Host"
                className="w-8 h-8 rounded-full border border-white/30"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
            <p className="font-medium text-lg">
              Организатор: {event.host?.name || "Eventomir"}
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-5xl -mt-8 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-sm border border-border/50">
              <h2 className="text-xl font-bold mb-6">О мероприятии</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 bg-muted/30 p-5 rounded-2xl">
                <div className="flex gap-3">
                  <div className="bg-background p-3 rounded-xl shadow-sm h-fit">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                      Когда
                    </p>
                    <p className="font-semibold text-foreground">
                      {format(new Date(event.date), "d MMMM yyyy", {
                        locale: ru,
                      })}
                    </p>
                    {event.time && (
                      <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {event.time}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="bg-background p-3 rounded-xl shadow-sm h-fit">
                    <MapPin className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                      Где
                    </p>
                    <p className="font-semibold text-foreground">
                      {event.city}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {event.address || "Уточняется"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="prose prose-sm sm:prose-base max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {event.description || "Описание скоро появится."}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <EventActionBox
                event={{
                  id: event.id,
                  type: event.type,
                  paymentType: event.paymentType,
                  price: event.price,
                  discountPrice: event.discountPrice,
                  availableTickets: event.availableTickets,
                }}
                isSoldOut={isSoldOut}
                isExpired={isExpired}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
