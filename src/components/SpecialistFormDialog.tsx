"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Camera,
  User,
  Tags,
  DollarSign,
  MapPin,
  Phone,
  Info,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PerformerProfile } from "@/services/performer";
import { apiRequest } from "@/utils/api-client";
import { cn } from "@/utils/utils";

// --- Validation Schema ---
const specialistSchema = z.object({
  name: z.string().min(2, "Имя должно содержать минимум 2 символа."),
  city: z.string().min(2, "Укажите город."),
  contactPhone: z
    .string()
    .regex(/^\+7 \d{3} \d{3} \d{2}-\d{2}$/, "Введите полный номер телефона."),
  description: z.string().max(500, "Слишком длинное описание").optional(),
  roles: z.array(z.string()).min(1, "Выберите хотя бы одну специализацию."),
  priceMin: z.number().min(0).optional(),
  priceMax: z.number().min(0).optional(),
});

type SpecialistFormValues = z.infer<typeof specialistSchema>;

interface SpecialistFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  agencyId: string;
  onFormSubmit: () => void;
  existingSpecialist?: PerformerProfile | null;
  agencyRoles?: string[];
}

export default function SpecialistFormDialog({
  isOpen,
  onClose,
  agencyId,
  onFormSubmit,
  existingSpecialist,
  agencyRoles = [],
}: SpecialistFormDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- State ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Default roles if agency didn't provide any
  const availableRoles =
    agencyRoles.length > 0
      ? agencyRoles
      : [
          "Ведущий",
          "Фотограф",
          "Видеограф",
          "Диджей",
          "Декоратор",
          "Организатор",
        ];

  const form = useForm<SpecialistFormValues>({
    resolver: zodResolver(specialistSchema),
    defaultValues: {
      name: "",
      city: "",
      contactPhone: "",
      description: "",
      roles: [],
      priceMin: 0,
      priceMax: 0,
    },
  });

  // --- Initialize Form Data ---
  useEffect(() => {
    if (isOpen) {
      if (existingSpecialist) {
        form.reset({
          name: existingSpecialist.name || "",
          city: existingSpecialist.city || "",
          contactPhone: existingSpecialist.contactPhone || "",
          description: existingSpecialist.description || "",
          roles: existingSpecialist.roles || [],
          priceMin: existingSpecialist.priceRange?.[0] || 0,
          priceMax: existingSpecialist.priceRange?.[1] || 0,
        });
        setAvatarPreview(existingSpecialist.profilePicture || null);
      } else {
        form.reset({
          name: "",
          city: "",
          contactPhone: "",
          description: "",
          roles: [],
          priceMin: 0,
          priceMax: 0,
        });
        setAvatarPreview(null);
      }
      setAvatarFile(null);
    }
  }, [isOpen, existingSpecialist, form]);

  // --- Handlers ---
  const handlePhoneChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (val: string) => void,
  ) => {
    const val = e.target.value;
    if (!val || val === "+7" || val === "+7 " || val === "+")
      return onChange("");
    let digits = val.replace(/\D/g, "");
    if (digits.startsWith("7") || digits.startsWith("8"))
      digits = digits.slice(1);
    digits = digits.slice(0, 10);

    let formatted = "+7 ";
    if (digits.length > 0) formatted += digits.slice(0, 3);
    if (digits.length >= 4) formatted += " " + digits.slice(3, 6);
    if (digits.length >= 7) formatted += " " + digits.slice(6, 8);
    if (digits.length >= 9) formatted += "-" + digits.slice(8, 10);
    onChange(formatted);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "Файл слишком большой (макс. 5МБ)",
        });
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (values: SpecialistFormValues) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("city", values.city);
      formData.append("phone", values.contactPhone);
      formData.append("description", values.description || "");
      formData.append("roles", JSON.stringify(values.roles));
      formData.append(
        "priceRange",
        JSON.stringify([values.priceMin, values.priceMax]),
      );
      formData.append("parentAgencyId", agencyId);

      if (avatarFile) {
        formData.append("profilePicture", avatarFile);
      }

      // Determine endpoint based on Create vs Update
      const method = existingSpecialist ? "patch" : "post";
      const url = existingSpecialist
        ? `/api/performers/${existingSpecialist.id}`
        : `/api/performers/agency-specialist`; // Ensure this endpoint exists on your backend to handle sub-profiles

      await apiRequest({
        method,
        url,
        data: formData,
        headers: { "Content-Type": undefined },
      });

      onFormSubmit(); // Triggers refresh and closes dialog
    } catch (error: any) {
      console.error("Save error:", error);
      toast({
        variant: "destructive",
        title: "Ошибка сохранения",
        description:
          error.response?.data?.message || "Не удалось сохранить профиль.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !isSubmitting && !open && onClose()}
    >
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-background rounded-2xl">
        <DialogHeader className="bg-muted/30 px-6 py-4 border-b">
          <DialogTitle className="text-xl font-bold">
            {existingSpecialist
              ? "Редактировать специалиста"
              : "Добавить нового специалиста"}
          </DialogTitle>
          <DialogDescription>
            Заполните данные сотрудника. Он будет отображаться в поиске как
            представитель вашего агентства.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col h-full"
          >
            <div className="px-6 py-4 max-h-[65vh] overflow-y-auto custom-scrollbar">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/50 p-1 rounded-xl">
                  <TabsTrigger
                    value="basic"
                    className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <User className="h-4 w-4 mr-2" /> Основные
                  </TabsTrigger>
                  <TabsTrigger
                    value="roles"
                    className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <Tags className="h-4 w-4 mr-2" /> Услуги
                  </TabsTrigger>
                  <TabsTrigger
                    value="media"
                    className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    <Camera className="h-4 w-4 mr-2" /> Фото
                  </TabsTrigger>
                </TabsList>

                {/* --- TAB 1: BASIC INFO --- */}
                <TabsContent
                  value="basic"
                  className="space-y-4 animate-in fade-in duration-300"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-foreground/80">
                            Имя Фамилия <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Александр Иванов"
                              className="bg-muted/20"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-foreground/80">
                            Город <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Москва"
                                className="pl-9 bg-muted/20"
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-foreground/80">
                          Телефон для связи{" "}
                          <span className="text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="+7 999 000 00-00"
                              className="pl-9 bg-muted/20"
                              value={field.value}
                              onChange={(e) =>
                                handlePhoneChange(e, field.onChange)
                              }
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-foreground/80">
                          О себе / Опыт работы
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Расскажите о профессиональном опыте сотрудника..."
                            className="resize-none bg-muted/20 min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* --- TAB 2: ROLES & PRICING --- */}
                <TabsContent
                  value="roles"
                  className="space-y-6 animate-in fade-in duration-300"
                >
                  <FormField
                    control={form.control}
                    name="roles"
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel className="font-semibold text-base text-foreground/80">
                            Специализации{" "}
                            <span className="text-red-500">*</span>
                          </FormLabel>
                          <DialogDescription>
                            Выберите услуги, которые предоставляет данный
                            сотрудник.
                          </DialogDescription>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {availableRoles.map((role) => (
                            <FormField
                              key={role}
                              control={form.control}
                              name="roles"
                              render={({ field }) => {
                                const isChecked = field.value?.includes(role);
                                return (
                                  <FormItem
                                    key={role}
                                    className={cn(
                                      "flex flex-row items-start space-x-3 space-y-0 rounded-xl border p-3 transition-colors cursor-pointer",
                                      isChecked
                                        ? "bg-primary/5 border-primary/50"
                                        : "hover:bg-muted/50",
                                    )}
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={isChecked}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([
                                                ...field.value,
                                                role,
                                              ])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== role,
                                                ),
                                              );
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-medium cursor-pointer w-full text-sm">
                                      {role}
                                    </FormLabel>
                                  </FormItem>
                                );
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-4 border-t space-y-4">
                    <FormLabel className="font-semibold text-base flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-emerald-600" />
                      Диапазон цен (₽)
                    </FormLabel>
                    <div className="flex items-center gap-4">
                      <FormField
                        control={form.control}
                        name="priceMin"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="От"
                                className="bg-muted/20"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <span className="text-muted-foreground">-</span>
                      <FormField
                        control={form.control}
                        name="priceMax"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="До"
                                className="bg-muted/20"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(Number(e.target.value))
                                }
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* --- TAB 3: MEDIA (AVATAR) --- */}
                <TabsContent
                  value="media"
                  className="space-y-6 animate-in fade-in duration-300"
                >
                  <div className="flex flex-col items-center justify-center space-y-6 py-6 bg-muted/10 rounded-2xl border-2 border-dashed">
                    <div className="relative group">
                      <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                        <AvatarImage
                          src={avatarPreview || undefined}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold">
                          {form.watch("name")?.substring(0, 1).toUpperCase() ||
                            "S"}
                        </AvatarFallback>
                      </Avatar>

                      <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                        <Camera className="h-8 w-8" />
                        <input
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          accept="image/*"
                          onChange={handleAvatarChange}
                        />
                      </label>
                    </div>

                    <div className="text-center space-y-2">
                      <h4 className="font-semibold text-base">Фото профиля</h4>
                      <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                        Загрузите качественное фото лица специалиста.
                        Допускаются форматы JPG или PNG до 5 МБ.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Выбрать файл
                      </Button>
                    </div>
                  </div>

                  <Alert className="bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/30 dark:border-blue-900 dark:text-blue-200">
                    <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertTitle>Портфолио специалиста</AlertTitle>
                    <AlertDescription className="text-xs mt-1">
                      Вы сможете загрузить галерею работ и сертификаты для этого
                      специалиста после сохранения профиля, перейдя на его
                      личную страницу через дашборд.
                    </AlertDescription>
                  </Alert>
                </TabsContent>
              </Tabs>
            </div>

            <DialogFooter className="px-6 py-4 border-t bg-muted/30 mt-auto">
              <DialogClose asChild>
                <Button variant="outline" type="button" disabled={isSubmitting}>
                  Отмена
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[140px] shadow-sm"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {existingSpecialist ? "Сохранить" : "Создать профиль"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
