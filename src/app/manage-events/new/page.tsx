"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import {
  useCreateEventMutation,
  useUploadImageMutation,
} from "@/services/events";
import { useToast } from "@/hooks/use-toast";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  Save,
  Loader2,
  Lock,
  Globe,
  Ticket,
  Banknote,
  ImagePlus,
  X,
} from "lucide-react";

export default function NewEventPage() {
  const router = useRouter();
  const { toast } = useToast();

  // Мутации
  const createMutation = useCreateEventMutation();
  const uploadMutation = useUploadImageMutation();

  // Состояния
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    category: "Частное мероприятие",
    type: "PRIVATE", // "PRIVATE" (RSVP) | "PUBLIC"
    paymentType: "FREE", // "FREE" | "PAID"
    price: 0,
    discountPrice: 0,
    date: "",
    time: "",
    city: "",
    address: "",
    imageUrl: "",
    description: "",
    totalTickets: 50,
    status: "active",
  });

  // --- ОБРАБОТКА ЗАГРУЗКИ ИЗОБРАЖЕНИЯ ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);

      // 1. Сжатие изображения перед загрузкой
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 1920,
      });

      // 2. Подготовка FormData
      const uploadData = new FormData();
      uploadData.append("image", compressedFile);

      // 3. Загрузка через сервис
      const res = await uploadMutation.mutateAsync(uploadData);

      // 4. Обновление URL в данных формы
      setFormData({ ...formData, imageUrl: res.url });

      toast({
        title: "Изображение загружено!",
        className: "bg-green-50 border-green-200 text-green-900",
      });
    } catch (error: any) {
      console.error("Ошибка загрузки изображения:", error);
      toast({
        variant: "destructive",
        title: "Ошибка загрузки",
        description:
          error.message || "Не удалось загрузить обложку. Попробуйте еще раз.",
      });
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // --- СОХРАНЕНИЕ МЕРОПРИЯТИЯ ---
  const handleSave = async () => {
    try {
      // Если мероприятие бесплатное, принудительно ставим цены 0
      const finalPrice = formData.paymentType === "FREE" ? 0 : formData.price;
      const finalDiscountPrice =
        formData.paymentType === "FREE" ? 0 : formData.discountPrice;

      const payload = {
        ...formData,
        price: finalPrice,
        discountPrice: finalDiscountPrice,
        availableTickets: formData.totalTickets,
      };

      await createMutation.mutateAsync(payload as any);

      toast({
        variant: "success",
        title: "Событие создано! 🎉",
        description:
          "Теперь вы можете скопировать ссылку для приглашения в панели управления.",
        className: "bg-green-50 border-green-200 text-green-900",
      });

      router.push("/manage-events");
    } catch (error: any) {
      console.error("Ошибка при создании события:", error);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description:
          error.message ||
          "Не удалось создать событие. Проверьте введенные данные.",
      });
    }
  };

  const isImageLoading = isCompressing || uploadMutation.isPending;

  return (
    <div className="container mx-auto py-8 px-4 sm:py-10 max-w-3xl animate-in fade-in bg-muted/5 min-h-screen">
      {/* ЗАГОЛОВОК */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="rounded-full hover:bg-muted"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Новое событие
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Настройте детали, приватность и билеты.
          </p>
        </div>
      </div>

      {/* КАРТОЧКА ФОРМЫ */}
      <div className="bg-card border border-border/50 rounded-[2rem] p-6 sm:p-8 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Название события
            </Label>
            <Input
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Например: Свадьба Ивана и Марии / Мастер-класс"
              className="rounded-xl h-12 bg-muted/20 border-border/50 focus-visible:bg-background"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Категория
            </Label>
            <Input
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              placeholder="Вечеринка, Воркшоп, Нетворкинг..."
              className="rounded-xl h-12 bg-muted/20 border-border/50 focus-visible:bg-background"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Статус публикации
            </Label>
            <Select
              value={formData.status}
              onValueChange={(val) => setFormData({ ...formData, status: val })}
            >
              <SelectTrigger className="rounded-xl h-12 bg-muted/20 border-border/50 font-semibold focus:bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="active" className="font-medium">
                  Активно (Опубликовано)
                </SelectItem>
                <SelectItem value="draft" className="font-medium">
                  Черновик (Скрыто)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ПРИВАТНОСТЬ */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Доступ (Приватность)
            </Label>
            <Select
              value={formData.type}
              onValueChange={(val) => setFormData({ ...formData, type: val })}
            >
              <SelectTrigger className="rounded-xl h-12 bg-muted/20 border-border/50 font-semibold focus:bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="PRIVATE" className="font-medium">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-orange-500" /> Приватное
                    (только RSVP)
                  </div>
                </SelectItem>
                <SelectItem value="PUBLIC" className="font-medium">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-500" /> Публичное
                    (открыто для всех)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ТИП ОПЛАТЫ */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Тип билета
            </Label>
            <Select
              value={formData.paymentType}
              onValueChange={(val) =>
                setFormData({ ...formData, paymentType: val })
              }
            >
              <SelectTrigger className="rounded-xl h-12 bg-muted/20 border-border/50 font-semibold focus:bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="FREE" className="font-medium">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-green-500" /> Бесплатно
                  </div>
                </SelectItem>
                <SelectItem value="PAID" className="font-medium">
                  <div className="flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-emerald-600" /> Платно
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ДИНАМИЧЕСКИЕ ПОЛЯ ЦЕНЫ */}
          {formData.paymentType === "PAID" && (
            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6 bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  Цена билета (₽)
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.price || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="rounded-xl h-12 bg-white font-bold text-emerald-900 border-emerald-200 focus-visible:ring-emerald-500"
                  placeholder="1500"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  Цена со скидкой{" "}
                  <span className="font-normal normal-case opacity-70">
                    - необязательно
                  </span>
                </Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.discountPrice || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discountPrice: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="rounded-xl h-12 bg-white font-bold text-emerald-900 border-emerald-200 focus-visible:ring-emerald-500"
                  placeholder="1000"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Дата
            </Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className="rounded-xl h-12 bg-muted/20 border-border/50 font-medium focus-visible:bg-background"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Время
            </Label>
            <Input
              type="time"
              value={formData.time}
              onChange={(e) =>
                setFormData({ ...formData, time: e.target.value })
              }
              className="rounded-xl h-12 bg-muted/20 border-border/50 font-medium focus-visible:bg-background"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Город
            </Label>
            <Input
              value={formData.city}
              onChange={(e) =>
                setFormData({ ...formData, city: e.target.value })
              }
              placeholder="Москва"
              className="rounded-xl h-12 bg-muted/20 border-border/50 focus-visible:bg-background"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Место / Адрес
            </Label>
            <Input
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              placeholder="Парк Горького, ул. Крымский Вал, 9"
              className="rounded-xl h-12 bg-muted/20 border-border/50 focus-visible:bg-background"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Лимит гостей (билетов)
            </Label>
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
              className="rounded-xl h-12 bg-muted/20 border-border/50 font-bold focus-visible:bg-background"
            />
          </div>

          {/* ЗАГРУЗКА ИЗОБРАЖЕНИЯ */}
          <div className="sm:col-span-2 space-y-2 mt-2">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Обложка события
            </Label>

            <input
              type="file"
              accept="image/jpeg, image/png, image/webp"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageUpload}
            />

            {formData.imageUrl ? (
              <div className="relative w-full h-48 sm:h-64 rounded-2xl overflow-hidden border border-border/50 group">
                <img
                  src={formData.imageUrl}
                  alt="Обложка"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                    className="font-bold shadow-lg"
                  >
                    Изменить фото
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, imageUrl: "" })}
                  className="absolute top-3 right-3 p-1.5 bg-black/50 hover:bg-red-500 text-white rounded-full backdrop-blur-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => !isImageLoading && fileInputRef.current?.click()}
                className={`w-full h-48 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-colors cursor-pointer ${
                  isImageLoading
                    ? "bg-muted/10 border-muted opacity-70 cursor-not-allowed"
                    : "bg-muted/20 border-border/60 hover:bg-muted/40 hover:border-primary/50"
                }`}
              >
                {isImageLoading ? (
                  <>
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-sm font-medium text-muted-foreground">
                      Загрузка изображения...
                    </p>
                  </>
                ) : (
                  <>
                    <div className="p-3 bg-background rounded-full shadow-sm">
                      <ImagePlus className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-foreground">
                        Нажмите для загрузки обложки
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        JPEG, PNG или WebP (макс. 2МБ)
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Приветствие / Описание
            </Label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={6}
              placeholder="Дорогие друзья! Приглашаем вас разделить этот особенный день с нами..."
              className="rounded-xl bg-muted/20 border-border/50 resize-none p-4 focus-visible:bg-background leading-relaxed"
            />
          </div>
        </div>

        {/* КНОПКИ ДЕЙСТВИЯ */}
        <div className="mt-10 flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-border/40">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={createMutation.isPending || isImageLoading}
            className="rounded-xl h-12 px-6 border-border/60 hover:bg-muted"
          >
            Отмена
          </Button>
          <Button
            onClick={handleSave}
            disabled={createMutation.isPending || isImageLoading}
            className="rounded-xl h-12 px-8 font-bold shadow-md bg-blue-600 hover:bg-blue-700 text-white transition-all hover:-translate-y-0.5"
          >
            {createMutation.isPending ? (
              <Loader2 className="animate-spin h-5 w-5 mr-2" />
            ) : (
              <Save className="h-5 w-5 mr-2" />
            )}
            Создать событие
          </Button>
        </div>
      </div>
    </div>
  );
}
