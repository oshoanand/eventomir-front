"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Edit, X, Map, CreditCard, Loader2, Save } from "lucide-react";

// --- Zod Validation Schema ---
const profileSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Имя должно содержать минимум 2 символа" })
    .max(50, { message: "Слишком длинное имя" }),
  phone: z.string().optional(),
  city: z.string().max(50, { message: "Слишком длинное название" }).optional(),
  address: z.string().max(150, { message: "Слишком длинный адрес" }).optional(),
  bankCard: z.string().max(19).optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileEditFormProps {
  initialData: any; // The user's current profile data passed from parent
  onSubmit: (data: ProfileFormValues) => void;
  isPending: boolean;
  setIsEditing: (val: boolean) => void;
}

export const ProfileEditForm = ({
  initialData,
  onSubmit,
  isPending,
  setIsEditing,
}: ProfileEditFormProps) => {
  // --- Initialize React Hook Form ---
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: initialData.name || "",
      phone: initialData.phone || "",
      city: initialData.city || "",
      address: initialData.address || "",
    },
  });

  // --- Formatters (Self-contained in the form) ---
  const formatPhoneDisplay = (phone: string) => {
    if (!phone) return "";
    let digits = phone.replace(/\D/g, "");
    if (digits.startsWith("7")) digits = digits.substring(1);
    if (digits.length === 0) return "";
    let formatted = "+7 ";
    if (digits.length > 0) formatted += digits.substring(0, 3);
    if (digits.length > 3) formatted += " " + digits.substring(3, 6);
    if (digits.length > 6) formatted += " " + digits.substring(6, 8);
    if (digits.length > 8) formatted += "-" + digits.substring(8, 10);
    return formatted;
  };

  const handlePhoneInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (val: string) => void,
  ) => {
    const inputValue = e.target.value;
    if (inputValue === "" || inputValue.trim() === "+7" || inputValue === "+") {
      return onChange("");
    }
    let rawInput = inputValue;
    if (rawInput.startsWith("+7 ")) rawInput = rawInput.substring(3);
    else if (rawInput.startsWith("+7")) rawInput = rawInput.substring(2);
    let digits = rawInput.replace(/\D/g, "");
    if (
      (digits.startsWith("7") || digits.startsWith("8")) &&
      digits.length >= 11
    ) {
      digits = digits.substring(1);
    }
    digits = digits.substring(0, 10);
    onChange(digits.length > 0 ? `+7${digits}` : "");
  };

  const handleCardInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (val: string) => void,
  ) => {
    // Strip non-digits, limit to 16, and chunk by 4 spaces
    const raw = e.target.value.replace(/\D/g, "").substring(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, "$1 ");
    onChange(formatted);
  };

  return (
    <div className="bg-card rounded-[2rem] shadow-sm border border-border/50 p-6 md:p-8 animate-in fade-in slide-in-from-top-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Edit className="h-5 w-5 text-primary" /> Редактирование профиля
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsEditing(false)}
          className="rounded-full"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ваше имя</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="rounded-xl bg-muted/20 h-12"
                      placeholder="Иван Иванов"
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
                  <FormLabel>Телефон</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={formatPhoneDisplay(field.value || "")}
                      onChange={(e) => handlePhoneInput(e, field.onChange)}
                      className="rounded-xl bg-muted/20 h-12"
                      placeholder="+7 999 999 99-99"
                      maxLength={18}
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
                  <FormLabel>Город</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="rounded-xl bg-muted/20 h-12"
                      placeholder="Москва"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Точный адрес</FormLabel>
                  <div className="relative">
                    <Map className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input
                        {...field}
                        className="rounded-xl bg-muted/20 h-12 pl-10"
                        placeholder="Ул. Ленина, 10"
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full md:w-auto mt-2 rounded-xl font-bold h-12 px-8"
          >
            {isPending ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Save className="mr-2 h-5 w-5" />
            )}
            Сохранить изменения
          </Button>
        </form>
      </Form>
    </div>
  );
};
