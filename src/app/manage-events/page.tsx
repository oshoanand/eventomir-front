"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { QRCodeSVG } from "qrcode.react";
import { toPng } from "html-to-image";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

// Icons
import {
  PlusCircle,
  Pencil,
  Trash2,
  Calendar,
  MapPin,
  QrCode,
  Users,
  MoreVertical,
  Share2,
  Lock,
  Globe,
  Download,
  Loader2,
} from "lucide-react";

import {
  useMyHostedEventsQuery,
  useDeleteEventMutation,
  Event,
} from "@/services/events";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ManageEventsPage() {
  const router = useRouter();
  const { toast, promise } = useToast();
  const { data: session, status: sessionStatus } = useSession();

  const isPerformer =
    session?.user?.role === "performer" ||
    session?.user?.role === "administrator";

  const { data: events = [], isLoading } = useMyHostedEventsQuery(
    sessionStatus === "authenticated",
    !!isPerformer,
  );

  const deleteMutation = useDeleteEventMutation();

  // --- ФУНКЦИЯ СКАЧИВАНИЯ ПОСТЕРА С QR ---
  const handleDownloadBrandedQR = async (event: Event) => {
    // 1. Create a temporary container that is off-screen but NOT display:none
    const tempContainer = document.createElement("div");
    tempContainer.style.position = "fixed";
    tempContainer.style.left = "-9999px";
    tempContainer.style.top = "0";
    document.body.appendChild(tempContainer);

    // 2. We use a separate function to generate the HTML string to avoid React mounting delays
    const generateAction = async () => {
      // Find the template and clone it into our temp container
      const originalNode = document.getElementById(
        `branded-qr-poster-${event.id}`,
      );
      if (!originalNode) throw new Error("Template not found");

      const clonedNode = originalNode.cloneNode(true) as HTMLElement;
      clonedNode.style.display = "flex"; // Ensure it's visible in the clone
      clonedNode.style.position = "static";
      tempContainer.appendChild(clonedNode);

      // Give the browser a moment to render the clone and load images
      await new Promise((resolve) => setTimeout(resolve, 600));

      try {
        const dataUrl = await toPng(clonedNode, {
          quality: 1,
          pixelRatio: 2,
          backgroundColor: "white",
          skipFonts: false,
        });

        const downloadLink = document.createElement("a");
        const safeTitle = event.title
          .replace(/[^а-яёA-Z0-9]/gi, "_")
          .toLowerCase();
        downloadLink.download = `Eventomir_QR_${safeTitle}.png`;
        downloadLink.href = dataUrl;
        downloadLink.click();
      } finally {
        // 3. Cleanup: Remove the temporary container
        document.body.removeChild(tempContainer);
      }
      return "success";
    };

    promise(generateAction(), {
      loading: "Создание постера...",
      success: "Готово! Постер скачан ✅",
      error: "Ошибка при создании изображения ❌",
    });
  };

  // --- ФУНКЦИЯ ПОДЕЛИТЬСЯ ---
  const handleShareLink = async (
    eventId: string,
    title: string,
    description: string,
  ) => {
    const url = `${window.location.origin}/manage-events/e/${eventId}`;
    const shareData = {
      title: title,
      text: description
        ? description.substring(0, 100) + "..."
        : "Приглашаю вас на мероприятие!",
      url: url,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (error: any) {
        if (error.name !== "AbortError") console.error("Error sharing:", error);
      }
    } else {
      navigator.clipboard.writeText(url);
      toast({
        title: "Ссылка скопирована! 🔗",
        description: "Теперь вы можете отправить её друзьям.",
      });
    }
  };

  const handleDelete = async (event: Event) => {
    const ticketsSold =
      (event.totalTickets || 0) -
      (event.availableTickets ?? event.totalTickets ?? 0);
    if (ticketsSold > 0) {
      toast({
        variant: "destructive",
        title: "Удаление невозможно",
        description: "На это событие уже есть зарегистрированные гости.",
      });
      return;
    }
    if (!confirm("Вы уверены? Это действие нельзя будет отменить.")) return;

    try {
      await deleteMutation.mutateAsync(event.id);
      toast({ title: "Событие удалено." });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось удалить событие.",
      });
    }
  };

  if (sessionStatus === "loading" || isLoading) {
    return (
      <div className="p-10 flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-medium">
          Загрузка мероприятий...
        </p>
      </div>
    );
  }

  const getEventData = (event: Event) => {
    const ticketsSold =
      (event.totalTickets || 0) -
      (event.availableTickets ?? event.totalTickets ?? 0);
    const progressPercent =
      event.totalTickets > 0 ? (ticketsSold / event.totalTickets) * 100 : 0;
    const isSelfCheckIn =
      event.type === "PUBLIC" && event.paymentType === "FREE";

    const badgeStyles: Record<
      string,
      {
        label: string;
        variant: "default" | "secondary" | "destructive" | "outline";
      }
    > = {
      active: { label: "Активно", variant: "default" },
      completed: { label: "Завершено", variant: "secondary" },
      cancelled: { label: "Отменено", variant: "destructive" },
      draft: { label: "Черновик", variant: "outline" },
    };

    return {
      ticketsSold,
      progressPercent,
      isSelfCheckIn,
      currentBadge: badgeStyles[event.status] || {
        label: event.status,
        variant: "secondary",
      },
    };
  };

  return (
    <div className="container mx-auto py-8 px-4 sm:py-10 max-w-6xl animate-in fade-in bg-muted/5 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Управление событиями
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Создавайте приглашения, управляйте гостями и билетами.
          </p>
        </div>
        <Button
          onClick={() => router.push("/manage-events/new")}
          size="lg"
          className="w-full sm:w-auto shadow-md rounded-xl font-bold"
        >
          <PlusCircle className="mr-2 h-5 w-5" /> Создать событие
        </Button>
      </div>

      {events.length === 0 ? (
        <Card className="border-dashed border-2 shadow-none bg-transparent">
          <CardContent className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <Calendar className="h-12 w-12 opacity-20 mb-4" />
            <p className="text-lg font-medium">
              У вас пока нет созданных событий
            </p>
            <Button
              variant="link"
              onClick={() => router.push("/manage-events/new")}
            >
              Нажмите, чтобы создать первое
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="md:hidden space-y-4 pb-20">
            {events.map((event) => {
              const {
                ticketsSold,
                progressPercent,
                isSelfCheckIn,
                currentBadge,
              } = getEventData(event);
              return (
                <Card
                  key={event.id}
                  className="rounded-[2rem] overflow-hidden shadow-sm border border-border/50"
                >
                  <div className="h-36 w-full relative bg-muted">
                    <img
                      src={event.imageUrl || "/images/default-event.jpg"}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 flex gap-2">
                      <Badge
                        variant="secondary"
                        className="shadow-sm font-bold bg-white/90 text-black border-0"
                      >
                        {event.type === "PRIVATE" ? (
                          <Lock className="w-3 h-3 mr-1 inline" />
                        ) : (
                          <Globe className="w-3 h-3 mr-1 inline" />
                        )}
                        {event.type === "PRIVATE" ? "Приватное" : "Публичное"}
                      </Badge>
                      <Badge
                        variant={currentBadge.variant}
                        className="shadow-sm font-bold"
                      >
                        {currentBadge.label}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-[17px] leading-tight line-clamp-2 pr-2">
                        {event.title}
                      </h3>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 -mr-2"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-56 rounded-xl"
                        >
                          <DropdownMenuLabel>Действия</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() =>
                              handleShareLink(
                                event.id,
                                event.title,
                                event.description || "",
                              )
                            }
                          >
                            <Share2 className="mr-2 h-4 w-4 text-blue-600" />{" "}
                            Поделиться
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(
                                `/manage-events/${event.id}/attendees`,
                              )
                            }
                          >
                            <Users className="mr-2 h-4 w-4 text-blue-600" />{" "}
                            Список гостей
                          </DropdownMenuItem>
                          {isSelfCheckIn ? (
                            <DropdownMenuItem
                              onClick={() => handleDownloadBrandedQR(event)}
                            >
                              <Download className="mr-2 h-4 w-4 text-purple-600" />{" "}
                              Скачать QR для входа
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/manage-events/${event.id}/scan`)
                              }
                            >
                              <QrCode className="mr-2 h-4 w-4 text-green-600" />{" "}
                              Сканировать билеты
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/manage-events/update/${event.id}`)
                            }
                          >
                            <Pencil className="mr-2 h-4 w-4" /> Изменить
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(event)}
                            disabled={ticketsSold > 0}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Удалить
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex flex-col gap-1 text-[13px] text-muted-foreground font-medium mb-4">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />{" "}
                        {format(new Date(event.date), "d MMM yyyy", {
                          locale: ru,
                        })}{" "}
                        {event.time}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" /> {event.city}
                      </span>
                    </div>
                    <div className="bg-muted/40 rounded-xl p-3 border border-border/50">
                      <div className="flex justify-between items-end mb-1.5">
                        <span className="text-xs font-bold">Гости / Лимит</span>
                        <span className="text-[10px] font-medium">
                          {ticketsSold} / {event.totalTickets}
                        </span>
                      </div>
                      <Progress value={progressPercent} className="h-2" />
                    </div>
                    {isSelfCheckIn && renderHiddenBrandedPoster(event)}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="hidden md:block shadow-sm border-border/50 rounded-[2rem] overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6 h-14">Событие</TableHead>
                    <TableHead>Тип и Статус</TableHead>
                    <TableHead>Дата и Место</TableHead>
                    <TableHead>Наполнение</TableHead>
                    <TableHead className="text-right pr-6">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => {
                    const {
                      ticketsSold,
                      progressPercent,
                      isSelfCheckIn,
                      currentBadge,
                    } = getEventData(event);
                    return (
                      <TableRow key={event.id} className="border-border/40">
                        <TableCell className="pl-6 py-4">
                          <div className="flex items-center gap-4">
                            <img
                              src={
                                event.imageUrl || "/images/default-event.jpg"
                              }
                              alt=""
                              className="h-12 w-12 rounded-lg object-cover border border-border/50"
                            />
                            <div>
                              <p className="font-bold text-[15px] line-clamp-1">
                                {event.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {event.category} •{" "}
                                {event.paymentType === "FREE"
                                  ? "Бесплатно"
                                  : `${event.price} ₽`}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1.5">
                            <Badge
                              variant={currentBadge.variant}
                              className="font-semibold text-[10px] uppercase w-fit"
                            >
                              {currentBadge.label}
                            </Badge>
                            <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                              {event.type === "PRIVATE" ? (
                                <Lock className="w-3 h-3" />
                              ) : (
                                <Globe className="w-3 h-3" />
                              )}
                              {event.type === "PRIVATE"
                                ? "ПРИВАТНОЕ"
                                : "ПУБЛИЧНОЕ"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-[13px] font-medium">
                            <p>
                              {format(new Date(event.date), "d MMM yyyy", {
                                locale: ru,
                              })}
                            </p>
                            <p className="text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {event.city}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="w-48">
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs font-bold">
                              <span className="text-primary">
                                {ticketsSold} / {event.totalTickets}
                              </span>
                            </div>
                            <Progress
                              value={progressPercent}
                              className="h-1.5"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex justify-end gap-1.5">
                            <Button
                              variant="secondary"
                              size="icon"
                              className="h-9 w-9 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 shadow-none"
                              title="Поделиться"
                              onClick={() =>
                                handleShareLink(
                                  event.id,
                                  event.title,
                                  event.description || "",
                                )
                              }
                            >
                              <Share2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="secondary"
                              size="icon"
                              className="h-9 w-9 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 shadow-none"
                              title="Гости"
                              onClick={() =>
                                router.push(
                                  `/manage-events/${event.id}/attendees`,
                                )
                              }
                            >
                              <Users className="h-4 w-4" />
                            </Button>
                            {isSelfCheckIn ? (
                              <>
                                {renderHiddenBrandedPoster(event)}
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  className="h-9 w-9 rounded-full bg-purple-50 text-purple-600 hover:bg-purple-100 shadow-none"
                                  title="Скачать постер для входа"
                                  onClick={() => handleDownloadBrandedQR(event)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="secondary"
                                size="icon"
                                className="h-9 w-9 rounded-full bg-green-50 text-green-600 hover:bg-green-100 shadow-none"
                                title="Сканировать билеты"
                                onClick={() =>
                                  router.push(`/manage-events/${event.id}/scan`)
                                }
                              >
                                <QrCode className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="secondary"
                              size="icon"
                              className="h-9 w-9 rounded-full bg-muted text-foreground hover:bg-muted/80 shadow-none"
                              title="Редактировать"
                              onClick={() =>
                                router.push(`/manage-events/update/${event.id}`)
                              }
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="secondary"
                              size="icon"
                              className="h-9 w-9 rounded-full bg-red-50 text-red-600 hover:bg-red-100 shadow-none disabled:opacity-50"
                              disabled={ticketsSold > 0}
                              onClick={() => handleDelete(event)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

const renderHiddenBrandedPoster = (event: Event) => {
  const selfCheckInUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/manage-events/e/${event.id}/checkin`;
  const hostName = (event as any).host?.name || "Организатор";

  return (
    <div
      id={`branded-qr-poster-${event.id}`}
      style={{
        position: "fixed",
        top: 0,
        left: "-9999px",
        width: "600px",
        height: "850px",
        backgroundColor: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 40px 60px 40px", // Увеличен нижний отступ до 60px
        boxSizing: "border-box", // Гарантирует, что padding не "раздует" картинку
        zIndex: -1,
      }}
    >
      {/* 1. Логотип */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "20px",
          width: "100%",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            backgroundColor: "#2563eb",
            padding: "10px",
            borderRadius: "12px",
          }}
        >
          <Calendar style={{ color: "white", width: "32px", height: "32px" }} />
        </div>
        <p
          style={{
            fontSize: "36px",
            fontWeight: "900",
            margin: 0,
            color: "black",
          }}
        >
          Eventomir<span style={{ color: "#2563eb" }}>.ru</span>
        </p>
      </div>

      {/* Основной контент */}
      <div
        style={{
          width: "100%",
          flex: 1, // Растягивается, чтобы занять место
          borderRadius: "40px",
          border: "8px dashed #f3f4f6",
          padding: "30px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          backgroundColor: "white",
          boxSizing: "border-box",
        }}
      >
        {/* 2. Блок события (СВЕРХУ) */}
        <div
          style={{
            width: "100%",
            backgroundColor: "#eff6ff",
            padding: "20px",
            borderRadius: "30px",
            border: "1px solid #dbeafe",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div style={{ flex: 1 }}>
              <p
                style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  color: "#2563eb",
                  textTransform: "uppercase",
                  margin: "0 0 4px 0",
                }}
              >
                Мероприятие
              </p>
              <p
                style={{
                  fontSize: "22px",
                  fontWeight: "900",
                  margin: 0,
                  color: "black",
                  lineHeight: "1.2",
                }}
              >
                {event.title}
              </p>
            </div>
            {event.imageUrl && (
              <img
                src={event.imageUrl}
                crossOrigin="anonymous"
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "15px",
                  objectFit: "cover",
                }}
              />
            )}
          </div>
          <div
            style={{
              marginTop: "15px",
              paddingTop: "15px",
              borderTop: "1px solid #dbeafe",
              display: "flex",
              gap: "10px",
              fontSize: "14px",
              fontWeight: "bold",
              color: "#6b7280",
            }}
          >
            <span>
              {format(new Date(event.date), "d MMM yyyy", { locale: ru })}
            </span>
            <span>{event.time}</span>
            <span style={{ marginLeft: "auto", color: "#111827" }}>
              {hostName}
            </span>
          </div>
        </div>

        {/* 3. Инструкция и QR (СНИЗУ) */}
        <div style={{ textAlign: "center", marginBottom: "15px" }}>
          <h1
            style={{
              fontSize: "36px",
              fontWeight: "900",
              margin: "0 0 5px 0",
              color: "black",
            }}
          >
            Вход по QR-коду
          </h1>
          <p style={{ fontSize: "16px", color: "#6b7280", margin: 0 }}>
            Наведите камеру телефона на код ниже
          </p>
        </div>

        <div
          style={{
            backgroundColor: "#f9fafb",
            padding: "20px",
            borderRadius: "30px",
            border: "2px solid #f3f4f6",
            marginBottom: "20px",
          }}
        >
          {/* Уменьшили размер QR на 20px, чтобы дать больше места отступам */}
          <QRCodeSVG value={selfCheckInUrl} size={280} level="H" />
        </div>

        {/* Шаги */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: "10px",
            width: "100%",
            marginTop: "auto",
          }}
        >
          {["Камера", "На QR", "Готово"].map((s, i) => (
            <div
              key={i}
              style={{
                backgroundColor: "#f3f4f6",
                padding: "10px",
                borderRadius: "12px",
                fontSize: "11px",
                fontWeight: "bold",
                textAlign: "center",
                color: "#9ca3af",
              }}
            >
              {i + 1}. {s}
            </div>
          ))}
        </div>
      </div>

      {/* 4. Технический подвал для отступа */}
      <div
        style={{
          width: "100%",
          height: "40px", // Создает гарантированную пустую зону внизу
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
        }}
      >
        <p
          style={{
            fontSize: "10px",
            fontWeight: "bold",
            color: "#e5e7eb",
            textTransform: "uppercase",
            letterSpacing: "2px",
          }}
        >
          app.eventomir.ru — {format(new Date(), "yyyy")}
        </p>
      </div>
    </div>
  );
};
