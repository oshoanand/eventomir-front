"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getRussianRegionsWithCities } from "@/services/geo";
import { Separator } from "@/components/ui/separator";
import {
  Mail,
  Loader2,
  User,
  Phone,
  Building,
  FileText,
  Lock,
  MapPin,
} from "lucide-react";
import { registerCustomerWithVerification } from "@/services/auth";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Link from "next/link";

// 1. Updated Schema: Validates the formatted phone mask (+7 XXX XXX XX-XX)
const formSchema = z
  .object({
    accountType: z.enum(["individual", "legalEntity"], {
      required_error: "Выберите тип аккаунта.",
    }),
    email: z.string().email("Введите корректный email."),
    password: z.string().min(8, "Минимум 8 символов."),
    name: z.string().min(6, "Минимум 6 символов."),
    companyName: z.string().optional(),
    inn: z.string().optional(),
    phone: z
      .string()
      .regex(
        /^\+7 \d{3} \d{3} \d{2}-\d{2}$/,
        "Введите полный номер телефона (10 цифр).",
      ),
    city: z.string().min(2, "Выберите город."),
    agreement: z.boolean().refine((val) => val === true, {
      message: "Необходимо согласиться с условиями.",
    }),
  })
  .refine(
    (data) => {
      if (data.accountType === "legalEntity") {
        return (
          !!data.companyName && !!data.inn && /^\d{10}$|^\d{12}$/.test(data.inn)
        );
      }
      return true;
    },
    { message: "Заполните данные компании корректно.", path: ["inn"] },
  );

type FormValues = z.infer<typeof formSchema>;

export function RegisterCustomerForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const [cityInput, setCityInput] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [filteredCities, setFilteredCities] = useState<string[]>([]);

  useEffect(() => {
    getRussianRegionsWithCities().then((data) => {
      const allCities = data.flatMap((r) => r.cities.map((c) => c.name));
      setCities(allCities);
    });
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accountType: "individual",
      email: "",
      password: "",
      name: "",
      phone: "",
      city: "",
      agreement: false,
    },
  });

  const accountType = form.watch("accountType");

  // 2. Phone Formatter Function
  const handlePhoneChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (val: string) => void,
  ) => {
    const val = e.target.value;

    // Allow user to clear the input completely
    if (!val || val === "+7" || val === "+7 " || val === "+") {
      onChange("");
      return;
    }

    // Extract only digits
    const digits = val.replace(/\D/g, "");
    if (!digits) return;

    // Strip Russian leading 7 or 8 if the user typed/pasted it
    let coreDigits = digits;
    if (digits.startsWith("7") || digits.startsWith("8")) {
      coreDigits = digits.slice(1);
    } else if (digits.startsWith("9")) {
      coreDigits = digits; // Assuming it's a mobile number starting with 9
    }

    // Limit to 10 numbers max
    coreDigits = coreDigits.slice(0, 10);

    // Build the mask: +7 XXX XXX XX-XX
    let formatted = "+7 ";
    if (coreDigits.length > 0) formatted += coreDigits.slice(0, 3);
    if (coreDigits.length >= 4) formatted += " " + coreDigits.slice(3, 6);
    if (coreDigits.length >= 7) formatted += " " + coreDigits.slice(6, 8);
    if (coreDigits.length >= 9) formatted += "-" + coreDigits.slice(8, 10);

    onChange(formatted);
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      // Clean the phone number before sending to the database (e.g., +7 999 123 45-67 -> +79991234567)
      const cleanPhone = "+7" + values.phone.replace(/\D/g, "").slice(1);

      const result = await registerCustomerWithVerification(
        {
          accountType: values.accountType,
          email: values.email,
          name: values.name,
          companyName:
            values.accountType === "legalEntity"
              ? values.companyName
              : undefined,
          inn: values.accountType === "legalEntity" ? values.inn : undefined,
          phone: cleanPhone,
          city: values.city,
        },
        values.password,
      );

      if (result.success) {
        setIsSuccess(true);
        toast({
          title: "Успешно!",
          description: "Проверьте почту для подтверждения.",
        });
        form.reset();
      } else {
        toast({
          variant: "destructive",
          title: "Ошибка",
          description: result.message,
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Что-то пошло не так.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCitySearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCityInput(val);
    form.setValue("city", val);
    if (val.length > 1) {
      setFilteredCities(
        cities
          .filter((c) => c.toLowerCase().startsWith(val.toLowerCase()))
          .slice(0, 5),
      );
    } else {
      setFilteredCities([]);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center p-8 bg-green-50/50 border border-green-200 rounded-xl animate-in fade-in zoom-in-95 duration-500">
        <div className="mx-auto h-12 w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
          <Mail className="h-6 w-6" />
        </div>
        <h3 className="text-xl font-semibold text-green-800">
          Регистрация успешна!
        </h3>
        <p className="text-muted-foreground mt-2">
          Мы отправили ссылку для подтверждения на ваш Email.
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-3 text-left"
      >
        {/* КЛАССИЧЕСКИЕ РАДИО-КНОПКИ */}
        <FormField
          control={form.control}
          name="accountType"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel className="text-foreground">Тип аккаунта *</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex space-x-6"
                >
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="individual" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      Физическое лицо
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="legalEntity" />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      Юридическое лицо
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
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {accountType === "legalEntity"
                  ? "Контактное лицо *"
                  : "Имя пользователя *"}
              </FormLabel>
              <FormControl>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-10 bg-muted/30 focus-visible:bg-background transition-colors"
                    placeholder="Иван Иванов"
                    {...field}
                  />
                </div>
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
              <FormLabel>Номер телефона *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-10 bg-muted/30 focus-visible:bg-background transition-colors"
                    placeholder="+7 999 000 00-00"
                    value={field.value}
                    onChange={(e) => handlePhoneChange(e, field.onChange)}
                    onBlur={field.onBlur}
                    name={field.name}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {accountType === "legalEntity" && (
          <div className="p-5 bg-muted/20 border border-border/50 rounded-xl animate-in fade-in zoom-in-95">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название компании *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-10 bg-background"
                        placeholder='ООО "Пример"'
                        {...field}
                      />
                    </div>
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
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-10 bg-background"
                        placeholder="10 или 12 цифр"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-10 bg-muted/30 focus-visible:bg-background transition-colors"
                    type="email"
                    placeholder="mail@example.com"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Пароль *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-10 bg-muted/30 focus-visible:bg-background transition-colors"
                    type="password"
                    placeholder="••••••••"
                    {...field}
                  />
                </div>
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
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-10 bg-muted/30 focus-visible:bg-background transition-colors"
                    placeholder="Начните вводить город..."
                    value={cityInput}
                    onChange={handleCitySearch}
                    onBlur={field.onBlur}
                  />
                </div>
              </FormControl>
              {filteredCities.length > 0 && (
                <div className="absolute z-50 w-full bg-popover border border-border/50 rounded-lg shadow-xl mt-1 py-1 overflow-hidden animate-in fade-in">
                  {filteredCities.map((city) => (
                    <div
                      key={city}
                      className="px-4 py-2 hover:bg-accent/50 cursor-pointer text-sm transition-colors"
                      onClick={() => {
                        setCityInput(city);
                        form.setValue("city", city);
                        setFilteredCities([]);
                      }}
                    >
                      {city}
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
          name="agreement"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-3 bg-muted/10 rounded-lg border border-border/40">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm font-normal text-muted-foreground cursor-pointer">
                  Я принимаю{" "}
                  <Link
                    href="/documents/terms-of-service"
                    target="_blank"
                    className="underline text-foreground hover:text-primary transition-colors"
                  >
                    условия соглашения
                  </Link>{" "}
                  и даю согласие на обработку данных.
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <Button
          type="submit"
          size="lg"
          className="w-full text-base font-medium shadow-md transition-all hover:shadow-lg"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Создание аккаунта...
            </>
          ) : (
            "Зарегистрироваться"
          )}
        </Button>

        {/* <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Или войдите через
            </span>
          </div>
        </div> */}
        {/* 
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            type="button"
            className="w-full bg-background hover:bg-muted/50"
          >
            Google
          </Button>
          <Button
            variant="outline"
            type="button"
            className="w-full bg-background hover:bg-muted/50"
          >
            Яндекс
          </Button>
        </div> */}
      </form>
    </Form>
  );
}
