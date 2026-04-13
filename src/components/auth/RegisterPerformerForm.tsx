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
import {
  Mail,
  Loader2,
  User,
  Phone,
  Building,
  FileText,
  Lock,
  MapPin,
  CheckCircle2,
  Briefcase,
  Users,
} from "lucide-react";
import { registerPerformerWithVerification } from "@/services/auth";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

// const formSchema = z
//   .object({
//     accountType: z.enum(
//       ["selfEmployed", "individualEntrepreneur", "legalEntity", "agency"],
//       { required_error: "Выберите тип аккаунта." },
//     ),
//     email: z.string().email("Введите корректный email."),
//     password: z.string().min(8, "Минимум 8 символов."),
//     name: z.string().min(2, "Минимум 2 символа."),
//     companyName: z.string().optional(),
//     phone: z
//       .string()
//       .regex(
//         /^\+7 \d{3} \d{3} \d{2}-\d{2}$/,
//         "Введите полный номер телефона (10 цифр).",
//       ),
//     inn: z.string().optional(),
//     city: z.string().min(2, "Выберите город."),
//     agreement: z.boolean().refine((val) => val === true, {
//       message: "Необходимо согласиться с условиями.",
//     }),
//   })
//   .refine(
//     (data) => {
//       if (["legalEntity", "agency"].includes(data.accountType)) {
//         return !!data.inn && /^\d{10}$|^\d{12}$/.test(data.inn);
//       }
//       return true;
//     },
//     {
//       message: "Для юр. лица или агентства ИНН является обязательным.",
//       path: ["inn"],
//     },
//   );

const formSchema = z
  .object({
    accountType: z.enum(
      ["selfEmployed", "individualEntrepreneur", "legalEntity", "agency"],
      { required_error: "Выберите тип аккаунта." },
    ),
    email: z.string().email("Введите корректный email."),
    password: z.string().min(8, "Минимум 8 символов."),
    name: z.string().min(6, "Минимум 6 символа."),
    companyName: z.string().optional(),
    phone: z
      .string()
      .regex(
        /^\+7 \d{3} \d{3} \d{2}-\d{2}$/,
        "Введите полный номер телефона (10 цифр).",
      ),
    inn: z.string().optional(),
    city: z.string().min(2, "Выберите город."),
    agreement: z.boolean().refine((val) => val === true, {
      message: "Необходимо согласиться с условиями.",
    }),
  })
  .superRefine((data, ctx) => {
    // Determine if the selected account type requires business details
    const needsCompanyAndInn = [
      "individualEntrepreneur",
      "legalEntity",
      "agency",
    ].includes(data.accountType);

    if (needsCompanyAndInn) {
      // 1. Validate Company Name
      if (!data.companyName || data.companyName.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Укажите название компании или ИП.",
          path: ["companyName"],
        });
      }

      // 2. Validate INN Presence and Length dynamically
      if (!data.inn || data.inn.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "ИНН обязателен для данного типа аккаунта.",
          path: ["inn"],
        });
      } else {
        const innClean = data.inn.trim();

        if (data.accountType === "individualEntrepreneur") {
          // Exactly 10 digits for ИП
          if (!/^\d{10}$/.test(innClean)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Для ИП ИНН должен состоять ровно из 10 цифр.",
              path: ["inn"],
            });
          }
        } else if (["legalEntity", "agency"].includes(data.accountType)) {
          // 10 to 12 digits for Юр. лицо or Агентство
          if (!/^\d{10,12}$/.test(innClean)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message:
                "Для Юр. лица или Агентства ИНН должен содержать от 10 до 12 цифр.",
              path: ["inn"],
            });
          }
        }
      }
    }
  });

type FormValues = z.infer<typeof formSchema>;

export function RegisterPerformerForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const referralId = searchParams.get("ref");

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
      accountType: "selfEmployed",
      email: "",
      password: "",
      name: "",
      phone: "",
      city: "",
      agreement: false,
    },
  });

  const accountType = form.watch("accountType");

  const handlePhoneChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (val: string) => void,
  ) => {
    const val = e.target.value;
    if (!val || val === "+7" || val === "+7 " || val === "+") {
      onChange("");
      return;
    }
    const digits = val.replace(/\D/g, "");
    if (!digits) return;

    let coreDigits = digits;
    if (digits.startsWith("7") || digits.startsWith("8")) {
      coreDigits = digits.slice(1);
    } else if (digits.startsWith("9")) {
      coreDigits = digits;
    }
    coreDigits = coreDigits.slice(0, 10);

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
      const cleanPhone = "+7" + values.phone.replace(/\D/g, "").slice(1);
      const result = await registerPerformerWithVerification(
        {
          accountType: values.accountType,
          email: values.email,
          name: values.name,
          companyName: values.companyName,
          phone: cleanPhone,
          inn: values.inn,
          city: values.city,
        },
        values.password,
        referralId,
      );

      if (result.success) {
        setIsSuccess(true);
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
      <div className="text-center p-8 md:p-6 bg-green-50/50 border border-green-200 rounded-2xl md:rounded-xl animate-in fade-in zoom-in-95 duration-500">
        <div className="mx-auto h-16 w-16 md:h-12 md:w-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 ring-4 ring-green-50">
          <CheckCircle2 className="h-8 w-8 md:h-6 md:w-6" />
        </div>
        <h3 className="text-2xl md:text-xl font-bold text-green-800 tracking-tight">
          Заявка принята!
        </h3>
        <p className="text-muted-foreground mt-3 md:mt-2 text-base md:text-sm leading-relaxed">
          Мы отправили ссылку для подтверждения на ваш Email. Пожалуйста,
          проверьте почту.
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 md:space-y-2 text-left"
      >
        {/* PREMIUM 2x2 RADIO BUTTON CARDS */}
        <FormField
          control={form.control}
          name="accountType"
          render={({ field }) => (
            <FormItem className="space-y-3 md:space-y-2.5">
              <FormLabel className="font-semibold ml-1 text-sm md:text-xs text-foreground/80">
                Тип аккаунта
              </FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid grid-cols-2 gap-3 md:gap-4"
                >
                  <FormItem>
                    <FormControl>
                      <RadioGroupItem
                        value="selfEmployed"
                        className="peer sr-only"
                      />
                    </FormControl>
                    <FormLabel className="flex flex-col items-center justify-center rounded-xl md:rounded-lg border-2 border-muted bg-transparent p-4 md:p-3 hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all h-full">
                      <User className="mb-2 h-6 w-6 md:h-5 md:w-5 text-muted-foreground peer-data-[state=checked]:text-primary" />
                      <span className="text-sm md:text-xs font-semibold text-center leading-tight">
                        Самозанятый
                      </span>
                    </FormLabel>
                  </FormItem>
                  <FormItem>
                    <FormControl>
                      <RadioGroupItem
                        value="individualEntrepreneur"
                        className="peer sr-only"
                      />
                    </FormControl>
                    <FormLabel className="flex flex-col items-center justify-center rounded-xl md:rounded-lg border-2 border-muted bg-transparent p-4 md:p-3 hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all h-full">
                      <Briefcase className="mb-2 h-6 w-6 md:h-5 md:w-5 text-muted-foreground peer-data-[state=checked]:text-primary" />
                      <span className="text-sm md:text-xs font-semibold text-center leading-tight">
                        ИП
                      </span>
                    </FormLabel>
                  </FormItem>
                  <FormItem>
                    <FormControl>
                      <RadioGroupItem
                        value="legalEntity"
                        className="peer sr-only"
                      />
                    </FormControl>
                    <FormLabel className="flex flex-col items-center justify-center rounded-xl md:rounded-lg border-2 border-muted bg-transparent p-4 md:p-3 hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all h-full">
                      <Building className="mb-2 h-6 w-6 md:h-5 md:w-5 text-muted-foreground peer-data-[state=checked]:text-primary" />
                      <span className="text-sm md:text-xs font-semibold text-center leading-tight">
                        Юр. лицо
                      </span>
                    </FormLabel>
                  </FormItem>
                  <FormItem>
                    <FormControl>
                      <RadioGroupItem value="agency" className="peer sr-only" />
                    </FormControl>
                    <FormLabel className="flex flex-col items-center justify-center rounded-xl md:rounded-lg border-2 border-muted bg-transparent p-4 md:p-3 hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all h-full">
                      <Users className="mb-2 h-6 w-6 md:h-5 md:w-5 text-muted-foreground peer-data-[state=checked]:text-primary" />
                      <span className="text-sm md:text-xs font-semibold text-center leading-tight">
                        Агентство
                      </span>
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage className="ml-1 text-xs" />
            </FormItem>
          )}
        />

        {/* FULL WIDTH: NAME */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold ml-1 text-sm md:text-xs text-foreground/80">
                {["selfEmployed", "individualEntrepreneur"].includes(
                  accountType,
                )
                  ? "ФИО руководителя"
                  : "Контактное лицо"}
              </FormLabel>
              <FormControl>
                <div className="relative group">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 md:h-4 md:w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    className="pl-11 md:pl-10 h-12 md:h-10 rounded-xl md:rounded-lg bg-muted/40 focus:bg-background transition-all border-muted-foreground/20 text-base md:text-sm"
                    placeholder={
                      ["selfEmployed", "individualEntrepreneur"].includes(
                        accountType,
                      )
                        ? "Иван Иванов"
                        : "Менеджер Иван"
                    }
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage className="ml-1 text-xs" />
            </FormItem>
          )}
        />

        {/* LEGAL ENTITY / AGENCY FIELDS */}
        {["individualEntrepreneur", "legalEntity", "agency"].includes(
          accountType,
        ) && (
          <div className="p-4 bg-muted/20 border border-border/50 rounded-2xl md:rounded-xl space-y-4 animate-in fade-in zoom-in-95">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold ml-1 text-sm md:text-xs text-foreground/80">
                    Брендовое название (необязательно)
                  </FormLabel>
                  <FormControl>
                    <div className="relative group">
                      <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 md:h-4 md:w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        className="pl-11 md:pl-10 h-12 md:h-10 rounded-xl md:rounded-lg bg-background focus:bg-background transition-all border-muted-foreground/20 text-base md:text-sm"
                        placeholder="Eventomir Agency"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="ml-1 text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="inn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-semibold ml-1 text-sm md:text-xs text-foreground/80">
                    ИНН
                  </FormLabel>
                  <FormControl>
                    <div className="relative group">
                      <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 md:h-4 md:w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input
                        className="pl-11 md:pl-10 h-12 md:h-10 rounded-xl md:rounded-lg bg-background focus:bg-background transition-all border-muted-foreground/20 text-base md:text-sm"
                        placeholder="10 или 12 цифр"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="ml-1 text-xs" />
                </FormItem>
              )}
            />
          </div>
        )}

        {/* FULL WIDTH: EMAIL */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold ml-1 text-sm md:text-xs text-foreground/80">
                Email
              </FormLabel>
              <FormControl>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 md:h-4 md:w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    className="pl-11 md:pl-10 h-12 md:h-10 rounded-xl md:rounded-lg bg-muted/40 focus:bg-background transition-all border-muted-foreground/20 text-base md:text-sm"
                    type="email"
                    placeholder="mail@example.com"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage className="ml-1 text-xs" />
            </FormItem>
          )}
        />

        {/* HALF WIDTH GRID: PHONE & CITY */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-semibold ml-1 text-sm md:text-xs text-foreground/80">
                  Телефон
                </FormLabel>
                <FormControl>
                  <div className="relative group">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 md:h-4 md:w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      className="pl-11 md:pl-10 h-12 md:h-10 rounded-xl md:rounded-lg bg-muted/40 focus:bg-background transition-all border-muted-foreground/20 text-base md:text-sm"
                      placeholder="+7 999 000 00-00"
                      value={field.value}
                      onChange={(e) => handlePhoneChange(e, field.onChange)}
                      onBlur={field.onBlur}
                      name={field.name}
                    />
                  </div>
                </FormControl>
                <FormMessage className="ml-1 text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem className="relative">
                <FormLabel className="font-semibold ml-1 text-sm md:text-xs text-foreground/80">
                  Город
                </FormLabel>
                <FormControl>
                  <div className="relative group">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 md:h-4 md:w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      className="pl-11 md:pl-10 h-12 md:h-10 rounded-xl md:rounded-lg bg-muted/40 focus:bg-background transition-all border-muted-foreground/20 text-base md:text-sm"
                      placeholder="Вводить город..."
                      value={cityInput}
                      onChange={handleCitySearch}
                      onBlur={field.onBlur}
                    />
                  </div>
                </FormControl>
                {filteredCities.length > 0 && (
                  <div className="absolute z-50 w-full bg-background border border-border/50 rounded-xl shadow-xl mt-2 py-2 overflow-hidden animate-in fade-in">
                    {filteredCities.map((city) => (
                      <div
                        key={city}
                        className="px-4 py-2.5 hover:bg-muted/50 cursor-pointer text-sm font-medium transition-colors"
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
                <FormMessage className="ml-1 text-xs" />
              </FormItem>
            )}
          />
        </div>

        {/* FULL WIDTH: PASSWORD */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="font-semibold ml-1 text-sm md:text-xs text-foreground/80">
                Пароль
              </FormLabel>
              <FormControl>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 md:h-4 md:w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    className="pl-11 md:pl-10 h-12 md:h-10 rounded-xl md:rounded-lg bg-muted/40 focus:bg-background transition-all border-muted-foreground/20 text-base md:text-sm"
                    type="password"
                    placeholder="••••••••"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage className="ml-1 text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="agreement"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 mt-6 p-4 md:p-3 bg-muted/20 rounded-xl md:rounded-lg border border-border/40 transition-colors hover:bg-muted/30">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="mt-1 md:mt-0.5"
                />
              </FormControl>
              <div className="space-y-1 leading-tight">
                <FormLabel className="text-sm md:text-xs font-medium text-muted-foreground cursor-pointer">
                  Я принимаю{" "}
                  <Link
                    href="/documents/terms-of-service"
                    target="_blank"
                    className="underline text-foreground hover:text-primary transition-colors underline-offset-2"
                  >
                    Пользовательское соглашение
                  </Link>{" "}
                  и{" "}
                  <Link
                    href="/documents/privacy-policy"
                    target="_blank"
                    className="underline text-foreground hover:text-primary transition-colors underline-offset-2"
                  >
                    Политику обработки данных
                  </Link>
                  . *
                </FormLabel>
                <FormMessage className="text-xs" />
              </div>
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-12 md:h-10 rounded-xl md:rounded-lg font-bold text-base md:text-sm mt-6 shadow-md hover:shadow-lg transition-all"
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-5 w-5 md:h-4 md:w-4 animate-spin" />
          ) : null}
          {isSubmitting ? "Создание аккаунта..." : "Зарегистрироваться"}
        </Button>

        <div className="mt-8 md:mt-6 text-center text-sm md:text-xs font-medium text-muted-foreground">
          Уже есть аккаунт?{" "}
          <Link
            href="/login"
            className="text-foreground font-bold hover:text-primary transition-colors underline-offset-4 hover:underline"
          >
            Войти
          </Link>
        </div>
      </form>
    </Form>
  );
}
