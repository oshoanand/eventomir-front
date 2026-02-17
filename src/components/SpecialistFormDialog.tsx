"use client";

import { useState, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import {
  saveSpecialist, // Import the new robust service
} from "@/services/agency";
import { PerformerProfile } from "@/services/performer";

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Define the validation schema
const formSchema = z.object({
  name: z.string().min(2, "Имя должно содержать не менее 2 символов."),
  email: z.string().email("Введите корректный email."),
  phone: z
    .string()
    .regex(
      /^(\+7|8)\d{10}$/,
      "Введите корректный номер телефона (например, +79001234567).",
    ),
  // INN validation: 10 or 12 digits
  inn: z
    .string()
    .refine(
      (val) => /^\d{10}$|^\d{12}$/.test(val),
      "ИНН должен содержать 10 или 12 цифр.",
    ),
  city: z.string().min(2, "Пожалуйста, выберите город."),
  roles: z
    .array(z.string())
    .refine((value) => value.length > 0, "Выберите хотя бы одну роль."),
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
  agencyId: string; // Kept for prop compatibility, though backend uses session
  onFormSubmit: () => void;
  existingSpecialist?: PerformerProfile | null;
  agencyRoles: string[];
}

const SpecialistFormDialog: React.FC<SpecialistFormDialogProps> = ({
  isOpen,
  onClose,
  onFormSubmit,
  existingSpecialist,
  agencyRoles,
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // City Autocomplete State
  const [regions, setRegions] = useState<
    { name: string; cities: { name: string }[] }[]
  >([]);
  const [cityInput, setCityInput] = useState("");
  const [autocompleteResults, setAutocompleteResults] = useState<string[]>([]);

  const isEditing = !!existingSpecialist;

  // Load Regions on mount
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

  // Populate form when editing
  useEffect(() => {
    if (existingSpecialist) {
      form.reset({
        name: existingSpecialist.name,
        email: existingSpecialist.email || "",
        phone: existingSpecialist.contactPhone || "", // Assuming 'phone' in PerformerProfile
        inn: existingSpecialist.inn || "",
        city: existingSpecialist.city,
        roles: existingSpecialist.roles,
        description: existingSpecialist.description || "",
        // If accountType isn't in profile, default to selfEmployed
        accountType: (existingSpecialist.accountType as any) || "selfEmployed",
      });
      setCityInput(existingSpecialist.city || "");
    } else {
      form.reset({
        name: "",
        email: "",
        phone: "",
        inn: "",
        city: "",
        roles: [],
        description: "",
        accountType: "selfEmployed",
      });
      setCityInput("");
    }
  }, [existingSpecialist, form, isOpen]);

  const onSubmit = async (values: SpecialistFormValues) => {
    setIsSubmitting(true);
    try {
      // Prepare payload for the robust backend
      const payload: Partial<PerformerProfile> = {
        // If editing, include the ID so backend knows to update
        ...(isEditing && existingSpecialist
          ? { id: existingSpecialist.id }
          : {}),
        name: values.name,
        email: values.email,
        contactPhone: values.phone,
        inn: values.inn,
        city: values.city,
        roles: values.roles,
        description: values.description,
        accountType: values.accountType,
        // The backend handles parentAgencyId assignment via the session token
      };

      // Call the unified agency service
      await saveSpecialist(payload);

      toast({
        title: isEditing ? "Профиль обновлен" : "Специалист добавлен",
        description: isEditing
          ? "Данные специалиста успешно обновлены."
          : "Новый специалист добавлен в ваше агентство.",
        className: "bg-green-600 text-white border-green-700",
      });

      onFormSubmit(); // Refresh parent data
      onClose(); // Close dialog
    } catch (error: any) {
      console.error("Save Specialist Error:", error);
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
      form.setValue("city", input);

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
              ? "Обновите данные профиля специалиста."
              : "Заполните анкету для добавления исполнителя в базу агентства."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-4 p-1"
            >
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ФИО специалиста *</FormLabel>
                    <FormControl>
                      <Input placeholder="Иванов Иван Иванович" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email & Phone Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="spec@agency.com"
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
                        <Input placeholder="+79990000000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* City & INN Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* City with Autocomplete */}
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem className="relative">
                      <FormLabel>Город *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Начните вводить..."
                          value={cityInput}
                          onChange={handleCityInputChange}
                          autoComplete="off"
                        />
                      </FormControl>
                      {autocompleteResults.length > 0 && (
                        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md max-h-40 overflow-y-auto">
                          {autocompleteResults.map((result) => (
                            <div
                              key={result}
                              className="cursor-pointer px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
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
                  name="inn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ИНН *</FormLabel>
                      <FormControl>
                        <Input placeholder="123456789012" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Account Type */}
              <FormField
                control={form.control}
                name="accountType"
                render={({ field }) => (
                  <FormItem className="space-y-3 pt-2">
                    <FormLabel>Форма занятости *</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col sm:flex-row gap-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="selfEmployed" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            Самозанятый
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="individualEntrepreneur" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            ИП
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="legalEntity" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            В штате
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Roles Selection */}
              <FormField
                control={form.control}
                name="roles"
                render={() => (
                  <FormItem>
                    <FormLabel>Роли (категории услуг) *</FormLabel>
                    <ScrollArea className="h-40 rounded-md border p-4">
                      {agencyRoles.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                          {agencyRoles.map((role) => (
                            <FormField
                              key={role}
                              control={form.control}
                              name="roles"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(role)}
                                      onCheckedChange={(checked) => {
                                        const current = field.value || [];
                                        const updated = checked
                                          ? [...current, role]
                                          : current.filter(
                                              (val) => val !== role,
                                            );
                                        field.onChange(updated);
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal cursor-pointer">
                                    {role}
                                  </FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground text-center py-8">
                          У вашего агентства не выбраны роли. Перейдите в
                          настройки профиля агентства.
                        </div>
                      )}
                    </ScrollArea>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>О специалисте</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Опыт работы, ключевые навыки..."
                        className="resize-none h-24"
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

        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSubmitting}>
              Отмена
            </Button>
          </DialogClose>
          <Button
            type="submit"
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Сохранить изменения" : "Создать"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SpecialistFormDialog;
