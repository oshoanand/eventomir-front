"use client";

import { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import {
  createSubProfile,
  updateSubProfile,
  type PerformerProfile,
} from "@/services/performer";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { getRussianRegionsWithCities } from "@/services/geo";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";

const formSchema = z.object({
  name: z.string().min(2, "Имя должно содержать не менее 2 символов."),
  email: z.string().email("Введите корректный email."),
  phone: z
    .string()
    .regex(/^(\+7|8)\d{10}$/, "Введите корректный номер телефона."),
  inn: z
    .string()
    .refine(
      (val) => /^\d{10}$|^\d{12}$/.test(val),
      "ИНН должен содержать 10 или 12 цифр.",
    ),
  city: z.string().min(2, "Пожалуйста, выберите город."),
  roles: z
    .array(z.string())
    .refine(
      (value) => value.some((item) => item),
      "Выберите хотя бы одну роль.",
    ),
  description: z
    .string()
    .max(500, "Описание не должно превышать 500 символов.")
    .optional(),
  accountType: z.enum([
    "selfEmployed",
    "individualEntrepreneur",
    "legalEntity",
  ]),
});

type SpecialistFormValues = z.infer<typeof formSchema>;

interface SpecialistFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  agencyId: string;
  onFormSubmit: () => void;
  existingSpecialist?: PerformerProfile | null;
  agencyRoles: string[]; // <-- Добавили это свойство
}

const SpecialistFormDialog: React.FC<SpecialistFormDialogProps> = ({
  isOpen,
  onClose,
  agencyId,
  onFormSubmit,
  existingSpecialist,
  agencyRoles, // <-- Получаем роли агентства
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [regions, setRegions] = useState<
    { name: string; cities: { name: string }[] }[]
  >([]);
  const [cityInput, setCityInput] = useState("");
  const [autocompleteResults, setAutocompleteResults] = useState<string[]>([]);
  const isEditing = !!existingSpecialist;

  useEffect(() => {
    getRussianRegionsWithCities().then(setRegions).catch(console.error);
  }, []);

  const form = useForm<SpecialistFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      inn: "",
      city: "",
      roles: [],
      description: "",
      accountType: "selfEmployed",
    },
  });

  useEffect(() => {
    if (existingSpecialist) {
      form.reset({
        name: existingSpecialist.name,
        email: existingSpecialist.email,
        phone: existingSpecialist.contactPhone,
        inn: existingSpecialist.inn,
        city: existingSpecialist.city,
        roles: existingSpecialist.roles,
        description: existingSpecialist.description,
        accountType: existingSpecialist.accountType,
      });
      setCityInput(existingSpecialist.city || "");
    } else {
      form.reset();
      setCityInput("");
    }
  }, [existingSpecialist, form]);

  const onSubmit = async (values: SpecialistFormValues) => {
    setIsSubmitting(true);
    try {
      const profileData = {
        name: values.name,
        email: values.email,
        contactPhone: values.phone,
        inn: values.inn,
        city: values.city,
        roles: values.roles,
        description: values.description,
        accountType: values.accountType,
      };

      if (isEditing && existingSpecialist) {
        await updateSubProfile(agencyId, existingSpecialist.id, profileData);
        toast({
          title: "Специалист обновлен",
          description: "Данные специалиста отправлены на модерацию.",
        });
      } else {
        await createSubProfile(agencyId, profileData);
        toast({
          title: "Специалист добавлен",
          description: "Профиль специалиста отправлен на модерацию.",
        });
      }

      onFormSubmit();
    } catch (error: any) {
      console.error(
        isEditing
          ? "Ошибка обновления суб-профиля:"
          : "Ошибка создания суб-профиля:",
        error,
      );
      toast({
        variant: "destructive",
        title: "Ошибка",
        description:
          error.message || "Не удалось сохранить данные специалиста.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCityInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      setCityInput(input);
      form.setValue("city", input); // Keep form value in sync
      if (input.length > 1) {
        const results = regions.flatMap((region) =>
          region.cities
            .map((city) => city.name)
            .filter((cityName) =>
              cityName.toLowerCase().startsWith(input.toLowerCase()),
            ),
        );
        setAutocompleteResults([...new Set(results)].slice(0, 10));
      } else {
        setAutocompleteResults([]);
      }
    },
    [regions, form],
  );

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? "Редактировать специалиста"
              : "Добавить нового специалиста"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Измените данные и отправьте на повторную модерацию."
              : "Создайте профиль для специалиста вашего агентства. Он появится в поиске после модерации."}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] p-1">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 p-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ФИО специалиста *</FormLabel>
                    <FormControl>
                      <Input placeholder="Иван Иванов" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="specialist@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Телефон *</FormLabel>
                    <FormControl>
                      <Input placeholder="+7..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="inn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ИНН *</FormLabel>
                    <FormControl>
                      <Input placeholder="10 или 12 цифр" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accountType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Форма занятости *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="selfEmployed" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Самозанятый
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="individualEntrepreneur" />
                          </FormControl>
                          <FormLabel className="font-normal">ИП</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="legalEntity" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Юр. лицо (в штате)
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem className="relative">
                    <FormLabel>Город *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Введите город"
                        value={cityInput}
                        onChange={handleCityInputChange}
                      />
                    </FormControl>
                    {autocompleteResults.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-lg max-h-60 overflow-y-auto">
                        {autocompleteResults.map((result) => (
                          <div
                            key={result}
                            className="cursor-pointer px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                            onClick={() => {
                              setCityInput(result);
                              field.onChange(result);
                              setAutocompleteResults([]);
                            }}
                          >
                            {result}
                          </div>
                        ))}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="roles"
                render={() => (
                  <FormItem>
                    <FormLabel>Роли (выберите хотя бы одну) *</FormLabel>
                    <ScrollArea className="h-40 rounded-md border">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4">
                        {agencyRoles.map((category) => (
                          <FormField
                            key={category}
                            control={form.control}
                            name="roles"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(category)}
                                    onCheckedChange={(checked) => {
                                      const newValue = checked
                                        ? [...(field.value || []), category]
                                        : (field.value || []).filter(
                                            (value) => value !== category,
                                          );
                                      field.onChange(newValue);
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="text-sm font-normal cursor-pointer">
                                  {category}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Описание</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Кратко опишите специалиста и его услуги..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Отмена
            </Button>
          </DialogClose>
          <Button
            type="submit"
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Сохранить изменения" : "Создать специалиста"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SpecialistFormDialog;
