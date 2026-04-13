"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Briefcase,
  MapPin,
  Phone,
  Loader2,
  CheckCircle2,
} from "lucide-react";

// Services
import { completeOAuthRegistration } from "@/services/auth";
import { getRussianRegionsWithCities } from "@/services/geo";
import { cn } from "@/utils/utils";

const CompleteRegistrationPage = () => {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [role, setRole] = useState<"customer" | "performer" | null>(null);
  const [accountType, setAccountType] = useState<string>("individual");
  const [companyName, setCompanyName] = useState("");
  const [inn, setINN] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [regions, setRegions] = useState<
    { name: string; cities: { name: string }[] }[]
  >([]);
  const [cityInput, setCityInput] = useState("");
  const [autocompleteResults, setAutocompleteResults] = useState<string[]>([]);

  // 1. Check Authentication and Role Status
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      if (session?.user?.role) {
        const dashboard =
          session.user.role === "customer"
            ? "/customer-profile"
            : session.user.role === "performer"
              ? "/performer-profile"
              : "/";
        router.push(dashboard);
      }
    }
  }, [status, session, router]);

  // Reset account type to a safe default if role changes
  useEffect(() => {
    if (
      role === "customer" &&
      ["agency", "selfEmployed", "individualEntrepreneur"].includes(accountType)
    ) {
      setAccountType("individual");
    }
  }, [role, accountType]);

  // 2. Fetch City/Region Data
  useEffect(() => {
    getRussianRegionsWithCities()
      .then(setRegions)
      .catch((err) => console.error("Failed to load regions:", err));
  }, []);

  // 3. Handle City Autocomplete
  const handleCityInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      setCityInput(input);
      setCity(input);

      if (input.length >= 2 && regions.length > 0) {
        const results = regions.flatMap((region) =>
          region.cities
            .map((c) => c.name)
            .filter((cityName) =>
              cityName.toLowerCase().startsWith(input.toLowerCase()),
            ),
        );
        setAutocompleteResults([...new Set(results)].slice(0, 10)); // Max 10 results
      } else {
        setAutocompleteResults([]);
      }
    },
    [regions],
  );

  // 4. Handle Phone Number Masking (+7 (XXX) XXX-XX-XX)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;

    if (!input || input === "+7" || input === "+7 (" || input === "+") {
      setPhone("");
      return;
    }

    let digits = input.replace(/\D/g, "");

    if (digits.startsWith("7") || digits.startsWith("8")) {
      digits = digits.slice(1);
    }

    digits = digits.slice(0, 10);

    let formatted = "+7";
    if (digits.length > 0) formatted += ` (${digits.slice(0, 3)}`;
    if (digits.length >= 4) formatted += `) ${digits.slice(3, 6)}`;
    if (digits.length >= 7) formatted += `-${digits.slice(6, 8)}`;
    if (digits.length >= 9) formatted += `-${digits.slice(8, 10)}`;

    setPhone(formatted);
  };

  // 5. Submit Registration
  const handleComplete = async () => {
    if (!role) {
      toast({
        variant: "destructive",
        title: "Выберите роль",
        description:
          "Пожалуйста, укажите, как вы планируете использовать платформу.",
      });
      return;
    }

    const needsCompanyNameAndINN = [
      "legalEntity",
      "individualEntrepreneur",
      "agency",
    ].includes(accountType);

    if (
      needsCompanyNameAndINN &&
      (!companyName || companyName.trim().length < 2)
    ) {
      toast({
        variant: "destructive",
        title: "Укажите название",
        description:
          "Для данного типа профиля необходимо указать название компании или ИП.",
      });
      return;
    }

    // 🚨 FIX: Strict INN Regex validation (Must be 10 or 12 digits)
    if (
      needsCompanyNameAndINN &&
      (!inn || !/^\d{10}$|^\d{12}$/.test(inn.trim()))
    ) {
      toast({
        variant: "destructive",
        title: "Некорректный ИНН",
        description: "ИНН должен состоять из 10 или 12 цифр.",
      });
      return;
    }

    if (!city || city.length < 2) {
      toast({
        variant: "destructive",
        title: "Укажите город",
        description: "Нам нужно знать ваш город для правильной работы поиска.",
      });
      return;
    }

    const rawDigits = phone.replace(/\D/g, "");

    if (rawDigits.length !== 11) {
      toast({
        variant: "destructive",
        title: "Некорректный телефон",
        description:
          "Пожалуйста, введите номер телефона полностью (10 цифр после +7).",
      });
      return;
    }

    const formattedPhoneForBackend = `+${rawDigits}`;

    setIsSubmitting(true);
    try {
      const result = await completeOAuthRegistration({
        role,
        phone: formattedPhoneForBackend,
        city,
        accountType,
        companyName: needsCompanyNameAndINN ? companyName.trim() : undefined,
        inn: needsCompanyNameAndINN ? inn.trim() : undefined,
      });

      if (!result.success) {
        throw new Error(result.message);
      }

      // Update basic session info
      await update({ role });

      toast({
        variant: "success",
        title: "Профиль настроен!",
        description: "Добро пожаловать в Eventomir.",
      });

      // 🚨 CRITICAL FIX: Hard Redirect
      // Do NOT use router.push() here. Using window.location.href forces the app to fully
      // reload. This triggers the NextAuth backend callbacks to fetch the user's newly assigned
      // 'FREE' subscription features, granting them immediate access to their dashboard.
      window.location.href =
        role === "customer" ? "/customer-profile" : "/performer-profile";
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ошибка сохранения",
        description: error.message,
      });
      setIsSubmitting(false); // Only stop loading if it fails. If success, let it spin while redirecting.
    }
  };

  if (
    status === "loading" ||
    (status === "authenticated" && session?.user?.role)
  ) {
    return (
      <div className="container mx-auto py-20 flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Загрузка профиля...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 max-w-2xl animate-in fade-in duration-500">
      <header className="text-center mb-10 space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Почти готово!</h1>
        <p className="text-muted-foreground">
          Выберите вашу роль и заполните контактные данные, чтобы завершить
          регистрацию.
        </p>
      </header>

      <div className="grid gap-8">
        {/* Role Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card
            className={cn(
              "relative cursor-pointer transition-all border-2 hover:border-primary/50",
              role === "customer"
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-transparent",
            )}
            onClick={() => setRole("customer")}
          >
            {role === "customer" && (
              <CheckCircle2 className="absolute top-3 right-3 h-5 w-5 text-primary" />
            )}
            <CardHeader className="text-center pb-2">
              <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                <User className="h-6 w-6" />
              </div>
              <CardTitle>Я Заказчик</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-xs text-muted-foreground px-4 pb-6">
              Хочу искать лучших исполнителей и организовывать свои события.
            </CardContent>
          </Card>

          <Card
            className={cn(
              "relative cursor-pointer transition-all border-2 hover:border-primary/50",
              role === "performer"
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-transparent",
            )}
            onClick={() => setRole("performer")}
          >
            {role === "performer" && (
              <CheckCircle2 className="absolute top-3 right-3 h-5 w-5 text-primary" />
            )}
            <CardHeader className="text-center pb-2">
              <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
                <Briefcase className="h-6 w-6" />
              </div>
              <CardTitle>Я Исполнитель</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-xs text-muted-foreground px-4 pb-6">
              Хочу предлагать свои услуги, вести портфолио и получать заказы.
            </CardContent>
          </Card>
        </div>

        {/* Additional Info Form */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Дополнительная информация</CardTitle>
            <CardDescription>
              Эти данные необходимы для связи и корректной работы платформы.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Account Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="accountType" className="font-semibold">
                Тип профиля <span className="text-destructive">*</span>
              </Label>
              <Select
                value={accountType}
                onValueChange={setAccountType}
                disabled={isSubmitting || !role}
              >
                <SelectTrigger className="bg-muted/20">
                  <SelectValue placeholder="Выберите тип профиля" />
                </SelectTrigger>
                <SelectContent>
                  {role === "performer" ? (
                    <>
                      <SelectItem value="selfEmployed">Самозанятый</SelectItem>
                      <SelectItem value="individualEntrepreneur">
                        Индивидуальный предприниматель (ИП)
                      </SelectItem>
                      <SelectItem value="legalEntity">
                        Юридическое лицо
                      </SelectItem>
                      <SelectItem value="agency">Агентство</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="individual">
                        Физическое лицо
                      </SelectItem>
                      <SelectItem value="legalEntity">
                        Юридическое лицо
                      </SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              {!role && (
                <p className="text-[11px] text-muted-foreground">
                  Сначала выберите вашу роль выше.
                </p>
              )}
            </div>

            {/* Conditional Company Name */}
            {["legalEntity", "individualEntrepreneur", "agency"].includes(
              accountType,
            ) && (
              <div className="space-y-2 animate-in slide-in-from-top-2">
                <Label htmlFor="companyName" className="font-semibold">
                  Название компании / ИП{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="companyName"
                  className="bg-muted/20"
                  placeholder='Например: ООО "Ивент Плюс" или ИП Иванов И.И.'
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            )}

            {/* Conditional INN */}
            {["legalEntity", "individualEntrepreneur", "agency"].includes(
              accountType,
            ) && (
              <div className="space-y-2 animate-in slide-in-from-top-2">
                <Label htmlFor="inn" className="font-semibold">
                  ИНН <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="inn"
                  className="bg-muted/20"
                  placeholder="10 или 12 цифр"
                  value={inn}
                  onChange={(e) => setINN(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            )}

            {/* City Field */}
            <div className="space-y-2 relative">
              <Label htmlFor="city" className="font-semibold">
                Ваш город <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="city"
                  className="pl-10 h-11 bg-muted/20"
                  placeholder="Например: Самара"
                  value={cityInput}
                  onChange={handleCityInputChange}
                  disabled={isSubmitting}
                />
              </div>

              {/* Autocomplete Dropdown */}
              {autocompleteResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-lg max-h-40 overflow-y-auto">
                  {autocompleteResults.map((res) => (
                    <div
                      key={res}
                      className="cursor-pointer px-4 py-3 text-sm hover:bg-accent transition-colors border-b last:border-0"
                      onClick={() => {
                        setCityInput(res);
                        setCity(res);
                        setAutocompleteResults([]);
                      }}
                    >
                      {res}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Phone Field */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="font-semibold">
                Номер телефона <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  className="pl-10 h-11 bg-muted/20"
                  placeholder="+7 (999) 000-00-00"
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  disabled={isSubmitting}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Телефон используется для связи с клиентами и верификации.
              </p>
            </div>
          </CardContent>

          <CardFooter>
            <Button
              className="w-full h-12 font-bold text-base"
              variant="destructive"
              onClick={handleComplete}
              disabled={isSubmitting || !role}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Сохранение...
                </>
              ) : (
                "Начать работу"
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default CompleteRegistrationPage;
