"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  Info,
  MoreVertical,
  Banknote,
} from "lucide-react";

import {
  useMyHostedEventsQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
  Event,
} from "@/services/events";

// Dropdown Menu for Mobile Actions
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const defaultFormState = {
  title: "",
  category: "Мастер-класс",
  price: 0,
  date: "",
  time: "",
  city: "",
  address: "",
  imageUrl: "",
  description: "",
  totalTickets: 10,
  status: "active",
};

export default function ManageEventsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session, status: sessionStatus } = useSession();

  const isPerformer = session?.user?.role === "performer";

  if (
    sessionStatus === "unauthenticated" ||
    (sessionStatus === "authenticated" && !isPerformer)
  ) {
    router.push("/login");
  }

  const { data: events = [], isLoading } = useMyHostedEventsQuery(
    sessionStatus === "authenticated",
    isPerformer,
  );

  const createMutation = useCreateEventMutation();
  const updateMutation = useUpdateEventMutation();
  const deleteMutation = useDeleteEventMutation();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState(defaultFormState);

  const editingEventTicketsSold = editingEvent
    ? (editingEvent.totalTickets || 0) -
      (editingEvent.availableTickets ?? editingEvent.totalTickets ?? 0)
    : 0;
  const editingEventHasSales = editingEventTicketsSold > 0;

  const openCreateDialog = () => {
    setEditingEvent(null);
    setFormData(defaultFormState);
    setIsDialogOpen(true);
  };

  const openEditDialog = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      category: event.category,
      price: event.price,
      city: event.city,
      address: event.address || "",
      imageUrl: event.imageUrl,
      date: new Date(event.date).toISOString().slice(0, 16),
      time: event.time || "",
      description: event.description || "",
      totalTickets: event.totalTickets || 0,
      status: event.status || "active",
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...formData,
        availableTickets: formData.totalTickets,
      };

      if (editingEvent) {
        await updateMutation.mutateAsync({
          id: editingEvent.id,
          data: payload,
        });
        toast({ title: "Событие успешно обновлено!" });
      } else {
        await createMutation.mutateAsync(payload as any);
        toast({ title: "Новое событие создано!" });
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: error.message || "Не удалось сохранить событие",
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
        title: "Удаление запрещено",
        description:
          "Вы не можете удалить событие, на которое уже проданы билеты.",
      });
      return;
    }

    if (!confirm("Вы уверены? Это действие нельзя отменить.")) return;

    try {
      await deleteMutation.mutateAsync(event.id);
      toast({ title: "Событие удалено" });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось удалить событие",
      });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (sessionStatus === "loading" || isLoading)
    return <div className="p-10 text-center">Загрузка...</div>;
  if (!isPerformer) return null;

  // --- Helpers for Event Rendering ---
  const getEventData = (event: Event) => {
    const ticketsSold =
      (event.totalTickets || 0) -
      (event.availableTickets ?? event.totalTickets ?? 0);
    const revenue = ticketsSold * event.price;
    const hasSales = ticketsSold > 0;
    const progressPercent =
      event.totalTickets > 0 ? (ticketsSold / event.totalTickets) * 100 : 0;

    const isExpiredNatural = new Date() > new Date(event.date);
    let displayStatus = event.status;
    if (event.status !== "cancelled" && isExpiredNatural)
      displayStatus = "completed";

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
      revenue,
      hasSales,
      displayStatus,
      progressPercent,
      currentBadge: badgeStyles[displayStatus] || {
        label: displayStatus,
        variant: "secondary",
      },
    };
  };

  return (
    <div className="container mx-auto py-8 px-4 sm:py-10 max-w-6xl animate-in fade-in bg-muted/10 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Управление событиями
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Создавайте и редактируйте ваши мероприятия.
          </p>
        </div>
        <Button
          onClick={openCreateDialog}
          size="lg"
          className="w-full sm:w-auto shadow-md rounded-xl font-bold"
        >
          <PlusCircle className="mr-2 h-5 w-5" /> Создать событие
        </Button>
      </div>

      {events.length === 0 ? (
        <Card className="border-dashed border-2 shadow-none bg-transparent">
          <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Calendar className="h-12 w-12 opacity-20 mb-4" />
            <p className="text-lg font-medium text-foreground">
              У вас пока нет событий
            </p>
            <p className="text-sm mt-1">
              Нажмите "Создать событие", чтобы добавить первое.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ========================================================= */}
          {/* MOBILE VIEW (Cards) - Visible only on screens smaller than md */}
          {/* ========================================================= */}
          <div className="md:hidden space-y-4 pb-20">
            {events.map((event) => {
              const {
                ticketsSold,
                revenue,
                hasSales,
                displayStatus,
                progressPercent,
                currentBadge,
              } = getEventData(event);
              const isInactive =
                displayStatus === "completed" || displayStatus === "cancelled";

              return (
                <Card
                  key={event.id}
                  className={`rounded-3xl overflow-hidden shadow-sm border border-border/50 ${isInactive ? "opacity-75" : ""}`}
                >
                  {/* Card Image Header */}
                  <div className="h-32 w-full relative bg-muted">
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge
                        variant={currentBadge.variant}
                        className="shadow-sm font-bold px-2 py-0.5 text-[10px] uppercase tracking-wider backdrop-blur-md bg-opacity-90"
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

                      {/* Mobile Actions Dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 -mr-2 -mt-1 rounded-full text-muted-foreground"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-48 rounded-xl"
                        >
                          <DropdownMenuLabel>Действия</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(
                                `/manage-events/${event.id}/attendees`,
                              )
                            }
                          >
                            <Users className="mr-2 h-4 w-4 text-blue-600" />{" "}
                            Гости
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={displayStatus === "cancelled"}
                            onClick={() =>
                              router.push(`/manage-events/${event.id}/scan`)
                            }
                          >
                            <QrCode className="mr-2 h-4 w-4 text-green-600" />{" "}
                            Сканировать
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => openEditDialog(event)}
                          >
                            <Pencil className="mr-2 h-4 w-4" /> Редактировать
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(event)}
                            disabled={hasSales}
                            className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Удалить
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex flex-col gap-1.5 text-[13px] text-muted-foreground font-medium mb-4">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(event.date), "dd MMM yyyy", {
                          locale: ru,
                        })}{" "}
                        {event.time}
                      </span>
                      <span className="flex items-center gap-1.5 truncate">
                        <MapPin className="h-3.5 w-3.5 shrink-0" /> {event.city}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Banknote className="h-3.5 w-3.5" /> {event.price} ₽
                      </span>
                    </div>

                    {/* Sales Progress */}
                    <div className="bg-muted/40 rounded-xl p-3 border border-border/50">
                      <div className="flex justify-between items-end mb-1.5">
                        <span className="text-xs font-bold text-foreground">
                          Продажи
                        </span>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {ticketsSold} / {event.totalTickets} шт.
                        </span>
                      </div>
                      <Progress value={progressPercent} className="h-2 mb-2" />
                      <p className="text-xs text-primary font-bold text-right">
                        +{revenue.toLocaleString()} ₽
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* ========================================================= */}
          {/* DESKTOP VIEW (Table) - Visible only on md and larger screens */}
          {/* ========================================================= */}
          <Card className="hidden md:block shadow-sm border-border/50 rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6 h-12">Событие</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Дата и Место</TableHead>
                    <TableHead>Продажи</TableHead>
                    <TableHead className="text-right pr-6">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event) => {
                    const {
                      ticketsSold,
                      revenue,
                      hasSales,
                      displayStatus,
                      progressPercent,
                      currentBadge,
                    } = getEventData(event);
                    const isInactive =
                      displayStatus === "completed" ||
                      displayStatus === "cancelled";

                    return (
                      <TableRow
                        key={event.id}
                        className={isInactive ? "opacity-75" : ""}
                      >
                        <TableCell className="pl-6 py-4">
                          <div className="flex items-center gap-4">
                            <img
                              src={event.imageUrl}
                              alt=""
                              className="h-12 w-12 rounded-lg object-cover border"
                            />
                            <div>
                              <p className="font-bold text-[15px] line-clamp-1">
                                {event.title}
                              </p>
                              <p className="text-xs text-muted-foreground font-medium mt-0.5">
                                {event.category} • {event.price} ₽
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={currentBadge.variant}
                            className="font-semibold text-[10px] uppercase tracking-wider"
                          >
                            {currentBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-[13px] font-medium space-y-0.5">
                            <p className="text-foreground">
                              {format(new Date(event.date), "dd MMM yyyy", {
                                locale: ru,
                              })}{" "}
                              {event.time}
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
                              <span className="text-muted-foreground">
                                {revenue.toLocaleString()} ₽
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
                              className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 shadow-none"
                              title="Гости"
                              onClick={() =>
                                router.push(
                                  `/manage-events/${event.id}/attendees`,
                                )
                              }
                            >
                              <Users className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="secondary"
                              size="icon"
                              className="h-8 w-8 rounded-full bg-green-50 text-green-600 hover:bg-green-100 shadow-none"
                              title="Сканировать"
                              disabled={displayStatus === "cancelled"}
                              onClick={() =>
                                router.push(`/manage-events/${event.id}/scan`)
                              }
                            >
                              <QrCode className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="secondary"
                              size="icon"
                              className="h-8 w-8 rounded-full bg-muted text-foreground hover:bg-muted/80 shadow-none"
                              title="Редактировать"
                              onClick={() => openEditDialog(event)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="secondary"
                              size="icon"
                              className="h-8 w-8 rounded-full bg-red-50 text-red-600 hover:bg-red-100 shadow-none disabled:opacity-50"
                              title={
                                hasSales
                                  ? "Нельзя удалить событие с продажами"
                                  : "Удалить"
                              }
                              disabled={hasSales}
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

      {/* CREATE / EDIT DIALOG (Optimized for mobile viewing) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto rounded-3xl p-4 sm:p-6 custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingEvent ? "Редактировать событие" : "Создать новое событие"}
            </DialogTitle>
            {editingEventHasSales && (
              <DialogDescription className="text-amber-600 font-bold pt-2 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                Внимание: на это событие продано {editingEventTicketsSold}{" "}
                билетов. Некоторые действия ограничены.
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase">
                Название
              </Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Выступление стендап комиков"
                className="rounded-xl h-11 bg-muted/20 border border-border/60 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase">
                Категория
              </Label>
              <Input
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                placeholder="Мастер-класс"
                className="rounded-xl h-11 bg-muted/20 border border-border/60 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase">
                Статус
              </Label>
              <Select
                value={formData.status}
                onValueChange={(val) =>
                  setFormData({ ...formData, status: val })
                }
              >
                <SelectTrigger className="rounded-xl h-11 bg-muted/20 border border-border/60 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="active" className="font-medium">
                    Активно (в продаже)
                  </SelectItem>
                  <SelectItem value="draft" className="font-medium">
                    Черновик (скрыто)
                  </SelectItem>
                  <SelectItem
                    value="cancelled"
                    disabled={editingEventHasSales}
                    className="font-medium text-destructive focus:text-destructive"
                  >
                    Отменено {editingEventHasSales && "(Недоступно)"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {editingEventHasSales && (
              <div className="sm:col-span-2">
                <Alert className="bg-blue-50 text-blue-800 border-blue-200 rounded-xl">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="font-bold">
                    Нужно отменить мероприятие?
                  </AlertTitle>
                  <AlertDescription className="text-xs mt-1 font-medium">
                    Так как билеты куплены, прямая отмена недоступна.
                    Пожалуйста, обратитесь в{" "}
                    <a
                      href="/support"
                      className="underline font-bold text-blue-700 hover:text-blue-900"
                    >
                      службу поддержки
                    </a>{" "}
                    для оформления возврата.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase">
                Дата
              </Label>
              <Input
                type="date"
                value={formData.date.split("T")[0]}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="rounded-xl h-11 bg-muted/20 border border-border/60 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase">
                Время
              </Label>
              <Input
                type="time"
                value={formData.time}
                onChange={(e) =>
                  setFormData({ ...formData, time: e.target.value })
                }
                className="rounded-xl h-11 bg-muted/20 border border-border/60 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase">
                Город
              </Label>
              <Input
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                placeholder="Москва"
                className="rounded-xl h-11 bg-muted/20 border border-border/60 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase">
                Адрес
              </Label>
              <Input
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Красная площадь, 1"
                className="rounded-xl h-11 bg-muted/20 border border-border/60 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase">
                Билетов (шт.)
              </Label>
              <Input
                type="number"
                min={editingEventHasSales ? editingEventTicketsSold : "1"}
                value={formData.totalTickets}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    totalTickets: parseInt(e.target.value) || 0,
                  })
                }
                className="rounded-xl h-11 bg-muted/20 border border-border/60 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all font-bold"
              />
              {editingEventHasSales && (
                <p className="text-[10px] text-muted-foreground font-medium pl-1">
                  Минимум: {editingEventTicketsSold}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase">
                Цена (₽)
              </Label>
              <Input
                type="number"
                min="0"
                value={formData.price}
                disabled={editingEventHasSales}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: parseFloat(e.target.value) || 0,
                  })
                }
                className="rounded-xl h-11 bg-muted/20 border border-border/60 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all font-bold"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase">
                Обложка (URL)
              </Label>
              <Input
                value={formData.imageUrl}
                onChange={(e) =>
                  setFormData({ ...formData, imageUrl: e.target.value })
                }
                placeholder="https://..."
                className="rounded-xl h-11 bg-muted/20 border border-border/60 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase">
                Описание
              </Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                placeholder="Опишите, что ждет гостей..."
                className="rounded-xl bg-muted/20 border border-border/60 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary transition-all resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSaving}
              className="rounded-xl h-12 w-full sm:w-auto font-semibold border-border/60"
            >
              Отмена
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-xl h-12 w-full sm:w-auto font-bold shadow-md"
            >
              {isSaving ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
