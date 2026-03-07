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
import { useToast } from "@/hooks/use-toast";

// Icons
import {
  PlusCircle,
  Pencil,
  Trash2,
  Calendar,
  MapPin,
  Ticket,
  AlertCircle,
} from "lucide-react";

import {
  useMyHostedEventsQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useDeleteEventMutation,
  Event,
} from "@/services/events";

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

  // Role Protection
  const isPerformer = session?.user?.role === "performer";

  if (
    sessionStatus === "unauthenticated" ||
    (sessionStatus === "authenticated" && !isPerformer)
  ) {
    router.push("/login"); // Redirect unauthorized users
  }

  // Fetch only events hosted by this performer
  const { data: events = [], isLoading } = useMyHostedEventsQuery(
    sessionStatus === "authenticated",
    isPerformer,
  );

  const createMutation = useCreateEventMutation();
  const updateMutation = useUpdateEventMutation();
  const deleteMutation = useDeleteEventMutation();

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState(defaultFormState);

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
      // The backend should automatically securely assign hostId based on the token
      const payload = { ...formData };

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

  const handleDelete = async (id: string) => {
    if (!confirm("Вы уверены? Это действие нельзя отменить.")) return;
    try {
      await deleteMutation.mutateAsync(id);
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
  if (!isPerformer) return null; // Prevent rendering while redirecting

  return (
    <div className="container mx-auto py-10 max-w-6xl animate-in fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Управление событиями</h1>
          <p className="text-muted-foreground">
            Создавайте и редактируйте ваши мероприятия.
          </p>
        </div>
        <Button onClick={openCreateDialog} size="lg" className="shadow-md">
          <PlusCircle className="mr-2 h-5 w-5" /> Создать событие
        </Button>
      </div>

      <Card className="shadow-sm border-primary/10">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="pl-6">Событие</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Дата и Место</TableHead>
                  <TableHead>Продажи</TableHead>
                  <TableHead className="text-right pr-6">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-16 text-muted-foreground"
                    >
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Calendar className="h-10 w-10 opacity-20" />
                        <p>У вас пока нет созданных событий.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  events.map((event) => {
                    const ticketsSold =
                      event.totalTickets - event.availableTickets;
                    const revenue = ticketsSold * event.price;

                    return (
                      <TableRow key={event.id}>
                        <TableCell className="pl-6">
                          <div className="flex items-center gap-4">
                            <img
                              src={event.imageUrl}
                              alt=""
                              className="h-12 w-12 rounded-md object-cover bg-muted"
                            />
                            <div>
                              <p className="font-bold line-clamp-1">
                                {event.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {event.category} • {event.price} ₽
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              event.status === "active"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {event.status === "active"
                              ? "Активно"
                              : event.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium">
                              {format(new Date(event.date), "dd MMM yyyy", {
                                locale: ru,
                              })}{" "}
                              {event.time}
                            </p>
                            <p className="text-muted-foreground flex items-center gap-1 text-xs">
                              <MapPin className="h-3 w-3" /> {event.city}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-semibold text-primary">
                              {ticketsSold} / {event.totalTickets} продано
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Доход: {revenue.toLocaleString()} ₽
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(event)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(event.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* CREATE / EDIT DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingEvent ? "Редактировать событие" : "Создать новое событие"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-5 py-4">
            <div className="col-span-2 space-y-2">
              <Label>Название мероприятия</Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Например: Выступление стендап комиков"
              />
            </div>

            <div className="space-y-2">
              <Label>Категория</Label>
              <Input
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                placeholder="Концерт, Мастер-класс..."
              />
            </div>

            <div className="space-y-2">
              <Label>Статус</Label>
              <Select
                value={formData.status}
                onValueChange={(val) =>
                  setFormData({ ...formData, status: val })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Активно (в продаже)</SelectItem>
                  <SelectItem value="draft">Черновик (скрыто)</SelectItem>
                  <SelectItem value="cancelled">Отменено</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Дата</Label>
              <Input
                type="date"
                value={formData.date.split("T")[0]}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Время начала</Label>
              <Input
                type="time"
                value={formData.time}
                onChange={(e) =>
                  setFormData({ ...formData, time: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Город</Label>
              <Input
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                placeholder="Москва"
              />
            </div>

            <div className="space-y-2">
              <Label>Точный адрес</Label>
              <Input
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Красная площадь, 1"
              />
            </div>

            <div className="space-y-2">
              <Label>Вместимость (Кол-во билетов)</Label>
              <Input
                type="number"
                min="1"
                value={formData.totalTickets}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    totalTickets: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Цена билета (₽)</Label>
              <Input
                type="number"
                min="0"
                value={formData.price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Ссылка на обложку (URL)</Label>
              <Input
                value={formData.imageUrl}
                onChange={(e) =>
                  setFormData({ ...formData, imageUrl: e.target.value })
                }
                placeholder="https://..."
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label>Описание мероприятия</Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={5}
                placeholder="Опишите, что ждет гостей..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSaving}
            >
              Отмена
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Сохранение..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
