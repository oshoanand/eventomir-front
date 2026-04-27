"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { format, isSameDay } from "date-fns";
import { ru } from "date-fns/locale";

import { usePerformerProfile } from "@/services/performer";
import { useCreateBookingRequest } from "@/services/booking";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Loader2,
  CalendarDays,
  Clock,
  MessageSquare,
  ChevronLeft,
  MapPin,
  Wallet,
  Hourglass,
} from "lucide-react";
import { cn } from "@/utils/utils";

function BookingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const performerId = searchParams.get("performerId");

  const { data: profile, isLoading: isProfileLoading } =
    usePerformerProfile(performerId);
  const bookingMut = useCreateBookingRequest();

  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("");
  const [durationType, setDurationType] = useState<"hours" | "days">("hours");
  const [budget, setBudget] = useState("");
  const [address, setAddress] = useState("");
  const [details, setDetails] = useState("");

  if (!performerId)
    return <div className="text-center py-20">Исполнитель не указан.</div>;
  if (isProfileLoading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  if (!profile)
    return <div className="text-center py-20">Исполнитель не найден.</div>;

  const disabledDates = profile.bookedDates
    ? profile.bookedDates.map((d) => new Date(d))
    : [];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const handleSubmit = () => {
    if (!date || !time || !duration || !address.trim() || !details.trim()) {
      return toast({
        variant: "destructive",
        title: "Заполните все обязательные поля.",
      });
    }

    const combinedDate = new Date(date);
    const [hours, minutes] = time.split(":");
    combinedDate.setHours(Number(hours), Number(minutes));

    const formattedDetails = `📍 Адрес: ${address.trim()}\n⏳ Длительность: ${duration} ${durationType === "hours" ? "час." : "дн."}\n💰 Бюджет: ${budget ? budget + " ₽" : "По договоренности"}\n\n📝 Описание мероприятия:\n${details.trim()}`;

    bookingMut.mutate(
      {
        performerId: profile.id,
        date: combinedDate.toISOString(),
        details: formattedDetails,
      },
      {
        onSuccess: () => {
          toast({ title: "Заявка отправлена!", variant: "success" });
          router.push("/bookings");
        },
        onError: (err: any) =>
          toast({
            variant: "destructive",
            title: "Ошибка",
            description: err.response?.data?.message,
          }),
      },
    );
  };

  return (
    <div className="max-w-5xl mx-auto">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-6 rounded-xl -ml-4"
      >
        <ChevronLeft className="w-4 h-4 mr-2" /> Назад к профилю
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-3xl border-border/40 shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/10 border-b pb-6">
              <CardTitle className="text-2xl">Детали бронирования</CardTitle>
              <CardDescription>
                Выберите дату, время и опишите условия.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              <div className="space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-primary" /> 1. Когда
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border rounded-2xl p-2 bg-white flex justify-center shadow-sm">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      locale={ru}
                      disabled={[...disabledDates, { before: yesterday }]}
                      className="w-full"
                      components={{
                        DayContent: ({ date }) => {
                          const isBusy = disabledDates.some((d) =>
                            isSameDay(d, date),
                          );
                          return (
                            <div
                              className={cn(
                                "flex flex-col items-center justify-center w-full h-full relative rounded-md",
                                isBusy &&
                                  "bg-destructive/10 text-destructive font-bold cursor-not-allowed",
                              )}
                            >
                              <span>{date.getDate()}</span>
                              {isBusy && (
                                <span className="absolute bottom-1 text-[8px] font-bold uppercase">
                                  занято
                                </span>
                              )}
                            </div>
                          );
                        },
                      }}
                    />
                  </div>
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label>Время начала</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="time"
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                          className="rounded-xl h-12 bg-muted/20 pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Длительность</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Hourglass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            type="number"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            className="rounded-xl h-12 bg-muted/20 pl-10"
                          />
                        </div>
                        <select
                          value={durationType}
                          onChange={(e) =>
                            setDurationType(e.target.value as "hours" | "days")
                          }
                          className="h-12 px-4 rounded-xl border bg-background text-sm"
                        >
                          <option value="hours">Часов</option>
                          <option value="days">Дней</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" /> 2. Где и за
                  сколько
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label>Адрес мероприятия</Label>
                    <Input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="rounded-xl h-12 bg-muted/20"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Предлагаемый бюджет (₽)</Label>
                    <div className="relative">
                      <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        className="rounded-xl h-12 bg-muted/20 pl-10"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" /> 3. Описание
                </h3>
                <Textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="min-h-[160px] rounded-2xl bg-muted/20 p-4"
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={
                  bookingMut.isPending ||
                  !date ||
                  !time ||
                  !duration ||
                  !address ||
                  !details
                }
                className="w-full rounded-2xl h-14 font-bold text-lg"
              >
                {bookingMut.isPending ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  "Отправить заявку исполнителю"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Summary */}
        <div className="lg:col-span-1">
          <Card className="rounded-3xl border-border/40 shadow-sm sticky top-24 overflow-hidden">
            <div className="h-24 bg-muted/30 relative">
              {profile.backgroundPicture && (
                <img
                  src={profile.backgroundPicture}
                  alt="Cover"
                  className="w-full h-full object-cover opacity-50"
                />
              )}
            </div>
            <CardContent className="p-6 text-center -mt-12 relative z-10">
              <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-white bg-white">
                <AvatarImage
                  src={profile.profilePicture || ""}
                  className="object-cover"
                />
                <AvatarFallback>{profile.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <h3 className="font-bold text-xl">{profile.name}</h3>
              <p className="text-sm text-muted-foreground mb-6">
                {profile.city || "Город не указан"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function BookingRequestPage() {
  const { status } = useSession();
  const router = useRouter();

  if (status === "loading")
    return (
      <div className="flex justify-center py-20 min-h-screen items-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  return (
    <div className="bg-muted/10 min-h-screen pb-20 pt-8 px-4">
      <Suspense
        fallback={
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        }
      >
        <BookingForm />
      </Suspense>
    </div>
  );
}
