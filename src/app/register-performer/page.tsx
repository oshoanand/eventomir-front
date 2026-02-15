"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useState, useEffect, useCallback } from "react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getRussianRegionsWithCities } from "@/services/geo";
import { Separator } from "@/components/ui/separator";
import { Mail } from "lucide-react";
import { registerPerformerWithVerification } from "@/services/auth"; // Import the new auth service
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"; // Импорт RadioGroup
import Link from "next/link"; // Импорт Link
import { useSearchParams } from "next/navigation"; // Импорт для получения параметров URL

// Используем встроенные SVG для Google
const GoogleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="mr-2 h-4 w-4"
  >
    <path d="M20.91 12A8.83 8.83 0 0 0 3 11.24" />
    <path d="M3.83 19A9 9 0 0 1 21 12" />
    <path d="M15 5A8.91 8.91 0 0 0 3.24 5.83" />
  </svg>
);

// Схема валидации формы регистрации исполнителя - упрощенная
const formSchema = z
  .object({
    accountType: z.enum(
      ["selfEmployed", "individualEntrepreneur", "legalEntity", "agency"],
      {
        required_error: "Выберите тип аккаунта.",
      },
    ),
    email: z.string().email({
      message: "Пожалуйста, введите корректный адрес электронной почты.",
    }),
    password: z.string().min(8, {
      message: "Пароль должен содержать не менее 8 символов.",
    }),
    name: z.string().min(2, {
      message:
        "Имя или Название компании должно содержать не менее 2 символов.",
    }),
    companyName: z.string().optional(),
    phone: z.string().regex(/^(\+7|8)\d{10}$/, {
      message: "Пожалуйста, введите корректный номер телефона.",
    }),
    inn: z.string().optional(), // ИНН делаем опциональным на уровне схемы
    city: z.string().min(2, {
      message: "Пожалуйста, выберите или введите город.",
    }),
    agreement: z.boolean().refine((val) => val === true, {
      message: "Необходимо согласиться с обработкой персональных данных.",
    }),
  })
  .refine(
    (data) => {
      // Если выбран тип "юрлицо" или "агентство", то ИНН обязателен
      if (data.accountType === "legalEntity" || data.accountType === "agency") {
        return !!data.inn && /^\d{10}$|^\d{12}$/.test(data.inn);
      }
      return true; // Для самозанятых и ИП ИНН не обязателен на этом шаге
    },
    {
      message:
        "Для юр. лица или агентства ИНН (10 или 12 цифр) является обязательным.",
      path: ["inn"], // Привязываем ошибку к полю ИНН
    },
  );

type RegisterPerformerFormValues = z.infer<typeof formSchema>;

const RegisterPerformerPage = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false); // Состояние для сообщения о верификации
  const { toast } = useToast();
  const searchParams = useSearchParams(); // Hook для получения параметров URL
  const [regions, setRegions] = useState<
    {
      name: string;
      cities: { name: string }[];
    }[]
  >([]);
  const [cityInput, setCityInput] = useState(""); // Track input value
  const [autocompleteResults, setAutocompleteResults] = useState<string[]>([]);
  const referralId = searchParams.get("ref"); // Получаем ref ID из URL

  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const regionsWithCities = await getRussianRegionsWithCities();
        setRegions(regionsWithCities);
      } catch (error) {
        console.error("Failed to fetch regions:", error);
        toast({
          variant: "destructive",
          title: "Ошибка",
          description: "Не удалось загрузить список городов.",
        });
      }
    };

    fetchRegions();
  }, [toast]);

  const form = useForm<RegisterPerformerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accountType: "selfEmployed", // По умолчанию Самозанятый
      email: "",
      password: "",
      name: "",
      companyName: "",
      phone: "",
      inn: "",
      city: "",
      agreement: false, // Значение по умолчанию для галочки
    },
  });

  // Получаем текущий выбранный тип аккаунта для условного рендеринга
  const accountType = form.watch("accountType");

  // Функция обработки отправки формы
  const onSubmit = async (values: RegisterPerformerFormValues) => {
    setIsSubmitting(true);
    setShowVerificationMessage(false); // Сбрасываем сообщение
    try {
      // Используем новую функцию регистрации с верификацией
      const result = await registerPerformerWithVerification(
        {
          // Передаем данные профиля
          accountType: values.accountType, // Передаем тип аккаунта
          email: values.email,
          name: values.name,
          companyName: values.companyName,
          phone: values.phone,
          inn: values.inn, // ИНН теперь может быть undefined
          city: values.city,
        },
        values.password, // Передаем пароль
        referralId, // Передаем реферальный ID
      );

      if (result.success) {
        toast({
          title: "Регистрация почти завершена!",
          description: result.message,
        });
        setShowVerificationMessage(true); // Показываем сообщение о верификации
        form.reset(); // Очищаем форму
      } else {
        toast({
          variant: "destructive",
          title: "Ошибка регистрации",
          description: result.message, // Показываем ошибку от сервиса
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        variant: "destructive",
        title: "Ошибка регистрации",
        description:
          "Произошла непредвиденная ошибка. Пожалуйста, попробуйте еще раз.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Обработчик ввода и автозаполнения города
  const handleCityInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      setCityInput(input);

      if (input.length > 1) {
        // Начинаем поиск с 2 символов
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
    [regions],
  );

  // Обработчики для входа через Google/Яндекс (заглушки)
  const handleGoogleLogin = () => {
    console.log("Attempting Google login...");
    toast({
      title: "Вход через Google",
      description: "Функционал входа через Google будет добавлен позже.",
    });
  };

  const handleYandexLogin = () => {
    console.log("Attempting Yandex login...");
    toast({
      title: "Вход через Яндекс",
      description: "Функционал входа через Яндекс будет добавлен позже.",
    });
  };

  return (
    <div className="container mx-auto py-10 flex justify-center">
      <Card className="w-full max-w-lg">
        {" "}
        {/* Увеличил max-w для доп. полей */}
        <CardHeader>
          <CardTitle>Регистрация исполнителя</CardTitle>
          <CardDescription>
            Зарегистрируйтесь, чтобы предлагать свои услуги на нашей платформе.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showVerificationMessage ? ( // Показываем сообщение о верификации
            <div className="text-center p-4 border border-yellow-500 bg-yellow-50 rounded-md">
              <p className="font-semibold">Проверьте вашу почту!</p>
              <p className="text-sm text-muted-foreground">
                Мы отправили вам письмо с ссылкой для подтверждения вашего email
                адреса.
              </p>
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                {/* Выбор типа аккаунта */}
                <FormField
                  control={form.control}
                  name="accountType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Тип аккаунта *</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid grid-cols-2 gap-4"
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
                              Юр. лицо
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="agency" />
                            </FormControl>
                            <FormLabel className="font-normal">
                              Агентство
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Поле Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="example@mail.com"
                          {...field}
                          type="email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Поле Пароль */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Пароль *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="••••••••"
                          {...field}
                          type="password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Поле Имя или Название */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {accountType === "selfEmployed" ||
                        accountType === "individualEntrepreneur"
                          ? "ФИО *"
                          : "Название *"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={
                            accountType === "selfEmployed" ||
                            accountType === "individualEntrepreneur"
                              ? "Иванов Иван"
                              : 'ООО "Праздник"'
                          }
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Поле Название компании (брендовое) */}
                {(accountType === "legalEntity" ||
                  accountType === "agency") && (
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Брендовое название (необязательно)
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Eventomir" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {/* Поле Номер телефона */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Номер телефона *</FormLabel>
                      <FormControl>
                        <Input placeholder="+79998887766" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Поле ИНН (условное) */}
                {(accountType === "legalEntity" ||
                  accountType === "agency") && (
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
                )}
                {/* Поле Город */}
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem className="relative">
                      <FormLabel>Город оказания услуг *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Введите или выберите город"
                          value={cityInput}
                          onChange={(e) => {
                            handleCityInputChange(e);
                            field.onChange(e.target.value);
                          }}
                          onBlur={field.onBlur}
                          ref={field.ref}
                          name={field.name}
                          aria-autocomplete="list"
                          aria-controls="performer-city-autocomplete-list"
                        />
                      </FormControl>
                      {autocompleteResults.length > 0 && (
                        <div
                          id="performer-city-autocomplete-list"
                          className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-lg max-h-60 overflow-y-auto"
                        >
                          {autocompleteResults.map((result, index) => (
                            <div
                              key={`${result}-${index}`}
                              className="cursor-pointer px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                              onClick={() => {
                                setCityInput(result);
                                field.onChange(result);
                                setAutocompleteResults([]);
                              }}
                              role="option"
                              aria-selected={cityInput === result}
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

                {/* Поле Согласия */}
                <FormField
                  control={form.control}
                  name="agreement"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="cursor-pointer">
                          Я согласен(а) с{" "}
                          <Link
                            href="/documents/terms-of-service"
                            className="underline hover:text-primary"
                            target="_blank"
                          >
                            Пользовательским соглашением
                          </Link>{" "}
                          и{" "}
                          <Link
                            href="/documents/privacy-policy"
                            className="underline hover:text-primary"
                            target="_blank"
                          >
                            Политикой обработки персональных данных
                          </Link>
                          . *
                        </FormLabel>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
                {/* Кнопка Зарегистрироваться */}
                <Button
                  variant="destructive"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Регистрация..." : "Зарегистрироваться"}
                </Button>
              </form>
            </Form>
          )}
          {/* Разделитель и кнопки соцсетей */}
          {!showVerificationMessage && ( // Скрываем соцсети после начала верификации
            <>
              <Separator className="my-4" />
              <div className="flex flex-col items-center space-y-2">
                <Button
                  variant="outline"
                  onClick={handleGoogleLogin}
                  className="w-full"
                >
                  <GoogleIcon /> {/* Используем компонент иконки */}
                  Регистрация через Google
                </Button>
                <Button
                  variant="outline"
                  onClick={handleYandexLogin}
                  className="w-full"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Регистрация через Яндекс
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPerformerPage;
