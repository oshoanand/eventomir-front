"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "@/utils/api-client";
import { useEventQuery } from "@/services/events";

// UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default function SelfCheckInPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const eventId = params.id as string;

  // Fetch event details to show the user what they are checking into
  const { data: event, isLoading: isEventLoading } = useEventQuery(eventId);

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    guestName: "",
    guestEmail: "",
  });

  const handleSelfCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.guestName || !formData.guestEmail) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Заполните все поля.",
      });
      return;
    }

    try {
      setIsLoading(true);
      const res = await apiRequest<{ message: string }>({
        method: "post",
        url: `/api/events/${eventId}/self-checkin`,
        data: formData,
      });

      setIsSuccess(true);
      toast({
        title: "Успешно!",
        description: res.message,
        className: "bg-green-50 border-green-200 text-green-900",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description:
          error.response?.data?.message || "Не удалось зарегистрироваться.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isEventLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event || event.type !== "PUBLIC" || event.paymentType !== "FREE") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold text-destructive mb-2">
          Доступ запрещен
        </h1>
        <p className="text-muted-foreground">
          Саморегистрация для этого мероприятия недоступна.
        </p>
        <Button className="mt-6" onClick={() => router.push("/")}>
          На главную
        </Button>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-muted/10 flex items-center justify-center p-4">
        <div className="bg-card rounded-[2rem] p-8 sm:p-10 shadow-lg border border-border/50 w-full max-w-md text-center animate-in zoom-in-95">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6 drop-shadow-sm" />
          <h1 className="text-3xl font-black text-foreground mb-2 tracking-tight">
            Добро пожаловать!
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Вы успешно зарегистрировались на мероприятие.
          </p>
          <div className="bg-muted/30 p-4 rounded-xl mb-8">
            <p className="font-bold text-primary">{event.title}</p>
          </div>
          <Button
            className="w-full h-12 rounded-xl font-bold text-lg"
            onClick={() => router.push(`/e/${eventId}`)}
          >
            Страница мероприятия
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-muted/10 flex flex-col items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
            <MapPin className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground mb-2">
            Check-in
          </h1>
          <p className="text-muted-foreground font-medium">
            Зарегистрируйтесь для входа на мероприятие
          </p>
        </div>

        <div className="bg-card rounded-[2rem] shadow-xl border border-border/50 overflow-hidden">
          <div className="bg-primary/5 p-6 border-b border-border/40">
            <h2 className="font-bold text-xl leading-tight mb-2 text-foreground">
              {event.title}
            </h2>
            <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />{" "}
                {format(new Date(event.date), "d MMM", { locale: ru })}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> {event.city}
              </span>
            </div>
          </div>

          <form onSubmit={handleSelfCheckIn} className="p-6 sm:p-8 space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Имя и Фамилия
              </Label>
              <Input
                required
                value={formData.guestName}
                onChange={(e) =>
                  setFormData({ ...formData, guestName: e.target.value })
                }
                placeholder="Иван Иванов"
                className="rounded-xl h-14 bg-muted/20 border-border/50 focus-visible:bg-background text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Email
              </Label>
              <Input
                required
                type="email"
                value={formData.guestEmail}
                onChange={(e) =>
                  setFormData({ ...formData, guestEmail: e.target.value })
                }
                placeholder="ivan@example.com"
                className="rounded-xl h-14 bg-muted/20 border-border/50 focus-visible:bg-background text-lg"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 rounded-xl font-bold text-lg shadow-md bg-primary hover:bg-primary/90 text-white mt-4 transition-all hover:-translate-y-0.5"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                "Отметить присутствие"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
