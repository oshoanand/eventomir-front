// "use client";

// import { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { useToast } from "@/hooks/use-toast";
// import { apiRequest } from "@/utils/api-client";
// import { Loader2, Ticket, CheckCircle, XCircle } from "lucide-react";
// import { useRouter } from "next/navigation";

// interface EventActionBoxProps {
//   event: {
//     id: string;
//     type: string;
//     paymentType: string;
//     price: number;
//     discountPrice: number | null;
//     availableTickets: number;
//   };
//   isSoldOut: boolean;
//   isExpired: boolean;
// }

// export default function EventActionBox({
//   event,
//   isSoldOut,
//   isExpired,
// }: EventActionBoxProps) {
//   const { toast } = useToast();
//   const router = useRouter();

//   const [isLoading, setIsLoading] = useState(false);
//   const [rsvpState, setRsvpState] = useState<"idle" | "success">("idle");
//   const [ticketToken, setTicketToken] = useState<string | null>(null);

//   // RSVP Form State
//   const [formData, setFormData] = useState({
//     guestName: "",
//     guestEmail: "",
//     guestPhone: "",
//   });

//   // Paid Ticket State
//   const [ticketCount, setTicketCount] = useState(1);

//   const isFree = event.paymentType === "FREE";
//   const currentPrice =
//     event.discountPrice && event.discountPrice > 0
//       ? event.discountPrice
//       : event.price;

//   // --- RSVP HANDLER (FREE EVENTS) ---
//   const handleRSVP = async (status: "ACCEPTED" | "REJECTED") => {
//     if (
//       status === "ACCEPTED" &&
//       (!formData.guestName || !formData.guestEmail)
//     ) {
//       toast({
//         variant: "destructive",
//         title: "Ошибка",
//         description: "Заполните имя и email.",
//       });
//       return;
//     }

//     try {
//       setIsLoading(true);
//       const res = await apiRequest<{ ticketToken?: string; message: string }>({
//         method: "post",
//         url: `/api/events/${event.id}/rsvp`,
//         data: { ...formData, status },
//       });

//       if (status === "ACCEPTED") {
//         setTicketToken(res.ticketToken || null);
//         setRsvpState("success");
//       }

//       toast({
//         title: "Успешно!",
//         description: res.message,
//         className: "bg-green-50 text-green-900 border-green-200",
//       });
//     } catch (error: any) {
//       toast({
//         variant: "destructive",
//         title: "Ошибка",
//         description: error.response?.data?.message || "Ошибка отправки.",
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // --- PURCHASE HANDLER (PAID EVENTS) ---
//   const handlePurchase = async () => {
//     try {
//       setIsLoading(true);
//       const res = await apiRequest<{ paymentUrl: string }>({
//         method: "post",
//         url: `/api/events/${event.id}/purchase`,
//         data: { ticketCount },
//       });
//       console.log(res);
//       console.log(res.paymentUrl);
//       // Redirect to Tinkoff Payment Gateway
//       window.location.href = res.paymentUrl;
//     } catch (error: any) {
//       if (error.response?.status === 401) {
//         toast({
//           title: "Требуется авторизация",
//           description: "Войдите, чтобы купить билет.",
//         });
//         router.push(`/login?callbackUrl=/e/${event.id}`);
//       } else {
//         toast({
//           variant: "destructive",
//           title: "Ошибка",
//           description: error.response?.data?.message || "Ошибка оплаты.",
//         });
//       }
//       setIsLoading(false);
//     }
//   };

//   if (isExpired) {
//     return (
//       <div className="bg-card rounded-3xl p-6 shadow-sm border border-border/50 text-center">
//         <h3 className="text-xl font-bold text-muted-foreground">
//           Мероприятие завершено
//         </h3>
//       </div>
//     );
//   }

//   if (isSoldOut) {
//     return (
//       <div className="bg-card rounded-3xl p-6 shadow-sm border border-border/50 text-center">
//         <h3 className="text-xl font-bold text-red-600 mb-2">
//           Билетов больше нет
//         </h3>
//         <p className="text-muted-foreground text-sm">
//           К сожалению, все места уже заняты.
//         </p>
//       </div>
//     );
//   }

//   // --- SUCCESS STATE (AFTER RSVP) ---
//   if (rsvpState === "success") {
//     return (
//       <div className="bg-card rounded-3xl p-8 shadow-sm border border-border/50 text-center">
//         <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
//         <h3 className="text-2xl font-bold mb-2 text-foreground">Ждем вас!</h3>
//         <p className="text-muted-foreground mb-6">Ваше участие подтверждено.</p>
//         {ticketToken && (
//           <div className="bg-muted/30 p-4 rounded-xl border border-border/50 break-all">
//             <p className="text-xs uppercase font-bold text-muted-foreground mb-1">
//               Код вашего билета:
//             </p>
//             <p className="font-mono font-bold text-primary">
//               {ticketToken.split("-")[0]}
//             </p>
//           </div>
//         )}
//       </div>
//     );
//   }

//   return (
//     <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-lg shadow-black/5 border border-border/50">
//       {/* HEADER: FREE vs PAID */}
//       <div className="mb-6 pb-6 border-b border-border/50">
//         {isFree ? (
//           <div>
//             <h3 className="text-2xl font-black text-foreground mb-1">
//               Вход свободный
//             </h3>
//             <p className="text-sm text-muted-foreground font-medium">
//               Пожалуйста, подтвердите присутствие (RSVP)
//             </p>
//           </div>
//         ) : (
//           <div>
//             <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider mb-1">
//               Стоимость
//             </p>
//             <div className="flex items-baseline gap-3">
//               <h3 className="text-4xl font-black text-foreground">
//                 {currentPrice} ₽
//               </h3>
//               {event.discountPrice &&
//                 event.discountPrice > 0 &&
//                 event.price > event.discountPrice && (
//                   <span className="text-lg text-muted-foreground line-through font-bold">
//                     {event.price} ₽
//                   </span>
//                 )}
//             </div>
//           </div>
//         )}
//       </div>

//       {/* FORM: FREE (RSVP) */}
//       {isFree ? (
//         <div className="space-y-4">
//           <div className="space-y-1.5">
//             <Label className="text-xs font-bold text-muted-foreground uppercase">
//               Имя и Фамилия
//             </Label>
//             <Input
//               value={formData.guestName}
//               onChange={(e) =>
//                 setFormData({ ...formData, guestName: e.target.value })
//               }
//               placeholder="Иван Иванов"
//               className="rounded-xl h-12 bg-muted/20"
//             />
//           </div>
//           <div className="space-y-1.5">
//             <Label className="text-xs font-bold text-muted-foreground uppercase">
//               Email
//             </Label>
//             <Input
//               type="email"
//               value={formData.guestEmail}
//               onChange={(e) =>
//                 setFormData({ ...formData, guestEmail: e.target.value })
//               }
//               placeholder="ivan@example.com"
//               className="rounded-xl h-12 bg-muted/20"
//             />
//           </div>
//           <div className="space-y-1.5">
//             <Label className="text-xs font-bold text-muted-foreground uppercase">
//               Телефон (необязательно)
//             </Label>
//             <Input
//               type="tel"
//               value={formData.guestPhone}
//               onChange={(e) =>
//                 setFormData({ ...formData, guestPhone: e.target.value })
//               }
//               placeholder="+7 (999) 000-00-00"
//               className="rounded-xl h-12 bg-muted/20"
//             />
//           </div>

//           <div className="flex flex-col gap-3 pt-4">
//             <Button
//               onClick={() => handleRSVP("ACCEPTED")}
//               disabled={isLoading}
//               className="w-full rounded-xl h-12 font-bold shadow-md bg-primary hover:bg-primary/90 text-white"
//             >
//               {isLoading ? (
//                 <Loader2 className="w-5 h-5 animate-spin" />
//               ) : (
//                 "Я пойду"
//               )}
//             </Button>
//             <Button
//               variant="outline"
//               onClick={() => handleRSVP("REJECTED")}
//               disabled={isLoading}
//               className="w-full rounded-xl h-12 font-bold border-border/60 text-muted-foreground hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
//             >
//               К сожалению, не смогу
//             </Button>
//           </div>
//         </div>
//       ) : (
//         /* FORM: PAID (TICKET PURCHASE) */
//         <div className="space-y-6">
//           <div className="flex items-center justify-between bg-muted/20 p-4 rounded-2xl border border-border/50">
//             <Label className="font-bold text-foreground">
//               Количество билетов
//             </Label>
//             <div className="flex items-center gap-4">
//               <Button
//                 variant="outline"
//                 size="icon"
//                 className="h-8 w-8 rounded-full border-border/60"
//                 onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}
//               >
//                 -
//               </Button>
//               <span className="font-black text-lg w-4 text-center">
//                 {ticketCount}
//               </span>
//               <Button
//                 variant="outline"
//                 size="icon"
//                 className="h-8 w-8 rounded-full border-border/60"
//                 onClick={() => setTicketCount(Math.min(10, ticketCount + 1))}
//               >
//                 +
//               </Button>
//             </div>
//           </div>

//           <div className="flex justify-between items-center px-1">
//             <span className="font-bold text-muted-foreground">Итого:</span>
//             <span className="font-black text-2xl">
//               {currentPrice * ticketCount} ₽
//             </span>
//           </div>

//           <Button
//             onClick={handlePurchase}
//             disabled={isLoading}
//             className="w-full rounded-xl h-14 font-bold text-lg shadow-md bg-primary hover:bg-primary/90 text-white flex items-center justify-center gap-2"
//           >
//             {isLoading ? (
//               <Loader2 className="w-5 h-5 animate-spin" />
//             ) : (
//               <Ticket className="w-5 h-5" />
//             )}
//             Купить билет
//           </Button>
//         </div>
//       )}
//     </div>
//   );
// }
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/utils/api-client";
import { Loader2, Ticket, CheckCircle } from "lucide-react";

interface EventActionBoxProps {
  event: {
    id: string;
    type: string;
    paymentType: string;
    price: number;
    discountPrice: number | null;
    availableTickets: number;
  };
  isSoldOut: boolean;
  isExpired: boolean;
}

export default function EventActionBox({
  event,
  isSoldOut,
  isExpired,
}: EventActionBoxProps) {
  const { toast } = useToast();
  const router = useRouter();

  // 🚨 ПРОАКТИВНАЯ ПРОВЕРКА АВТОРИЗАЦИИ
  const { status: sessionStatus } = useSession();

  const [isLoading, setIsLoading] = useState(false);
  const [rsvpState, setRsvpState] = useState<"idle" | "success">("idle");
  const [ticketToken, setTicketToken] = useState<string | null>(null);

  // RSVP Form State
  const [formData, setFormData] = useState({
    guestName: "",
    guestEmail: "",
    guestPhone: "",
  });

  // Paid Ticket State
  const [ticketCount, setTicketCount] = useState(1);

  const isFree = event.paymentType === "FREE";
  const currentPrice =
    event.discountPrice && event.discountPrice > 0
      ? event.discountPrice
      : event.price;

  // --- RSVP HANDLER (FREE EVENTS) ---
  const handleRSVP = async (status: "ACCEPTED" | "REJECTED") => {
    // 1. Проверяем авторизацию перед отправкой запроса
    // if (sessionStatus === "unauthenticated") {
    //   toast({
    //     title: "Требуется авторизация",
    //     description:
    //       "Пожалуйста, войдите в систему, чтобы подтвердить участие.",
    //   });
    //   router.push(`/login?callbackUrl=/e/${event.id}`);
    //   return;
    // }

    // 2. Валидация полей
    if (
      status === "ACCEPTED" &&
      (!formData.guestName || !formData.guestEmail)
    ) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Заполните имя и email.",
      });
      return;
    }

    // 3. Отправка запроса
    try {
      setIsLoading(true);
      const cleanEventId = event.id.trim();

      const res = await apiRequest<{ ticketToken?: string; message: string }>({
        method: "post",
        url: `/api/events/${cleanEventId}/rsvp`,
        data: { ...formData, status },
      });

      if (status === "ACCEPTED") {
        setTicketToken(res.ticketToken || null);
        setRsvpState("success");
      }

      toast({
        title: "Успешно!",
        description: res.message,
        className: "bg-green-50 text-green-900 border-green-200",
      });
    } catch (error: any) {
      console.error("RSVP Error:", error.response?.data || error.message);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.response?.data?.message || "Ошибка отправки формы.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- PURCHASE HANDLER (PAID EVENTS) ---
  const handlePurchase = async () => {
    // 1. Проверяем авторизацию перед отправкой запроса
    if (sessionStatus === "unauthenticated") {
      toast({
        title: "Требуется авторизация",
        description: "Войдите или зарегистрируйтесь, чтобы купить билет.",
      });
      router.push(`/login?callbackUrl=/e/${event.id}`);
      return;
    }

    try {
      setIsLoading(true);

      // Очищаем ID от возможных пробелов, чтобы избежать 404
      const cleanEventId = event.id.trim();

      const res = await apiRequest<{ paymentUrl: string }>({
        method: "post",
        url: `/api/events/${cleanEventId}/purchase`,
        data: { ticketCount },
      });

      // Перенаправление на шлюз Tinkoff
      window.location.href = res.paymentUrl;
    } catch (error: any) {
      console.error("Purchase Error:", error.response?.data || error.message);

      // Оставляем фолбэк-проверку на 401 на случай, если сессия истекла ровно в момент клика
      if (error.response?.status === 401) {
        toast({
          title: "Сессия истекла",
          description: "Пожалуйста, войдите в систему заново.",
        });
        router.push(`/login?callbackUrl=/e/${event.id}`);
      } else if (error.response?.status === 404) {
        toast({
          variant: "destructive",
          title: "Ошибка 404",
          description:
            error.response?.data?.message ||
            "Мероприятие или пользователь не найден.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Ошибка при покупке",
          description:
            error.response?.data?.message ||
            "Не удалось создать заказ. Попробуйте еще раз.",
        });
      }
      setIsLoading(false); // Выключаем загрузку только при ошибке (при успехе страница перезагружается на оплату)
    }
  };

  // --- РЕНДЕР СОСТОЯНИЙ (ОШИБКИ ИЛИ УСПЕХ) ---

  if (isExpired) {
    return (
      <div className="bg-card rounded-3xl p-6 shadow-sm border border-border/50 text-center">
        <h3 className="text-xl font-bold text-muted-foreground">
          Мероприятие завершено
        </h3>
      </div>
    );
  }

  if (isSoldOut) {
    return (
      <div className="bg-card rounded-3xl p-6 shadow-sm border border-border/50 text-center">
        <h3 className="text-xl font-bold text-red-600 mb-2">
          Билетов больше нет
        </h3>
        <p className="text-muted-foreground text-sm">
          К сожалению, все места уже заняты.
        </p>
      </div>
    );
  }

  if (rsvpState === "success") {
    return (
      <div className="bg-card rounded-3xl p-8 shadow-sm border border-border/50 text-center animate-in fade-in zoom-in-95 duration-300">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-2 text-foreground">Ждем вас!</h3>
        <p className="text-muted-foreground mb-6">Ваше участие подтверждено.</p>
        {ticketToken && (
          <div className="bg-muted/30 p-4 rounded-xl border border-border/50 break-all">
            <p className="text-xs uppercase font-bold text-muted-foreground mb-1">
              Код вашего билета:
            </p>
            <p className="font-mono font-bold text-primary">
              {ticketToken.split("-")[0]}
            </p>
          </div>
        )}
      </div>
    );
  }

  // --- ОСНОВНОЙ РЕНДЕР ФОРМЫ ПОКУПКИ / RSVP ---
  return (
    <div className="bg-card rounded-3xl p-6 sm:p-8 shadow-lg shadow-black/5 border border-border/50">
      {/* HEADER: FREE vs PAID */}
      <div className="mb-6 pb-6 border-b border-border/50">
        {isFree ? (
          <div>
            <h3 className="text-2xl font-black text-foreground mb-1">
              Вход свободный
            </h3>
            <p className="text-sm text-muted-foreground font-medium">
              Пожалуйста, подтвердите присутствие (RSVP)
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-muted-foreground font-bold uppercase tracking-wider mb-1">
              Стоимость
            </p>
            <div className="flex items-baseline gap-3">
              <h3 className="text-4xl font-black text-foreground">
                {currentPrice.toLocaleString("ru-RU")} ₽
              </h3>
              {event.discountPrice &&
                event.discountPrice > 0 &&
                event.price > event.discountPrice && (
                  <span className="text-lg text-muted-foreground line-through font-bold">
                    {event.price.toLocaleString("ru-RU")} ₽
                  </span>
                )}
            </div>
          </div>
        )}
      </div>

      {/* FORM: FREE (RSVP) */}
      {isFree ? (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase">
              Имя и Фамилия
            </Label>
            <Input
              value={formData.guestName}
              onChange={(e) =>
                setFormData({ ...formData, guestName: e.target.value })
              }
              placeholder="Иван Иванов"
              className="rounded-xl h-12 bg-muted/20 focus-visible:ring-1"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase">
              Email
            </Label>
            <Input
              type="email"
              value={formData.guestEmail}
              onChange={(e) =>
                setFormData({ ...formData, guestEmail: e.target.value })
              }
              placeholder="ivan@example.com"
              className="rounded-xl h-12 bg-muted/20 focus-visible:ring-1"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase">
              Телефон (необязательно)
            </Label>
            <Input
              type="tel"
              value={formData.guestPhone}
              onChange={(e) =>
                setFormData({ ...formData, guestPhone: e.target.value })
              }
              placeholder="+7 (999) 000-00-00"
              className="rounded-xl h-12 bg-muted/20 focus-visible:ring-1"
            />
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button
              onClick={() => handleRSVP("ACCEPTED")}
              disabled={isLoading}
              className="w-full rounded-xl h-12 font-bold shadow-md bg-primary hover:bg-primary/90 text-white"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Я пойду"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleRSVP("REJECTED")}
              disabled={isLoading}
              className="w-full rounded-xl h-12 font-bold border-border/60 text-muted-foreground hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
            >
              К сожалению, не смогу
            </Button>
          </div>
        </div>
      ) : (
        /* FORM: PAID (TICKET PURCHASE) */
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-muted/20 p-4 rounded-2xl border border-border/50">
            <Label className="font-bold text-foreground">
              Количество билетов
            </Label>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full border-border/60"
                onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}
                disabled={isLoading}
              >
                -
              </Button>
              <span className="font-black text-lg w-4 text-center">
                {ticketCount}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-full border-border/60"
                onClick={() => setTicketCount(Math.min(10, ticketCount + 1))}
                disabled={isLoading || ticketCount >= event.availableTickets}
              >
                +
              </Button>
            </div>
          </div>

          <div className="flex justify-between items-center px-1">
            <span className="font-bold text-muted-foreground">Итого:</span>
            <span className="font-black text-2xl text-foreground">
              {(currentPrice * ticketCount).toLocaleString("ru-RU")} ₽
            </span>
          </div>

          <Button
            onClick={handlePurchase}
            disabled={isLoading}
            className="w-full rounded-xl h-14 font-bold text-lg shadow-md bg-primary hover:bg-primary/90 text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Ticket className="w-5 h-5" />
            )}
            Купить билет
          </Button>
        </div>
      )}
    </div>
  );
}
