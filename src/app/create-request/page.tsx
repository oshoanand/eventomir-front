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
} from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  ArrowLeft,
  MapPin,
  Wallet,
  CreditCard,
  AlertCircle,
} from "lucide-react";

import { getRussianRegionsWithCities } from "@/services/geo";
import { getPaidRequestPrice } from "@/services/payment";
import { useCreatePaidRequestMutation } from "@/services/requests";
import { getSiteSettings } from "@/services/settings";
import { useCustomerProfile } from "@/services/customer";
import { cn } from "@/utils/utils";

export default function CreateRequestPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const { data: profile, isLoading: isProfileLoading } = useCustomerProfile();

  // Wallet Data
  const walletBalance = profile?.walletBalance || 0;

  // --- Form State ---
  const [category, setCategory] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "gateway">(
    "wallet",
  );

  const [categories, setCategories] = useState<string[]>([]);
  const [city, setCity] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [regions, setRegions] = useState<
    { name: string; cities: { name: string }[] }[]
  >([]);
  const [autocompleteResults, setAutocompleteResults] = useState<string[]>([]);

  const [requestPrice, setRequestPrice] = useState<number>(500); // Default to 500
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);

  const { mutate: createRequest, isPending: isSubmitting } =
    useCreatePaidRequestMutation();

  // Automatically switch to gateway if wallet balance is too low
  useEffect(() => {
    if (!isProfileLoading && walletBalance < requestPrice) {
      setPaymentMethod("gateway");
    }
  }, [walletBalance, requestPrice, isProfileLoading]);

  // Load Settings, Pricing, and Geography (Omitted boilerplate useEffects for brevity, same as before)
  useEffect(() => {
    getSiteSettings().then(
      (s) =>
        s?.siteCategories &&
        setCategories(s.siteCategories.map((c: any) => c.name)),
    );
    getRussianRegionsWithCities().then(setRegions);
    getPaidRequestPrice()
      .then(setRequestPrice)
      .finally(() => setIsLoadingPrice(false));
  }, []);

  const handleCityInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      setCityInput(input);
      if (input.length >= 2) {
        const results = regions.flatMap((r) =>
          r.cities
            .map((c) => c.name)
            .filter((name) =>
              name.toLowerCase().startsWith(input.toLowerCase()),
            ),
        );
        setAutocompleteResults([...new Set(results)].slice(0, 10));
      } else {
        setAutocompleteResults([]);
      }
    },
    [regions],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !serviceDescription || !cityInput) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Заполните обязательные поля.",
      });
      return;
    }

    createRequest(
      {
        customerId: session!.user.id,
        category,
        serviceDescription,
        budget: budget || undefined,
        city: cityInput.trim(),
        paymentMethod,
      },
      {
        onSuccess: (response: any) => {
          if (response.requiresGateway) {
            toast({ title: "Переход к оплате..." });
            window.location.href = response.paymentUrl;
          } else {
            toast({
              variant: "success",
              title: "Успешно!",
              description: "Заявка оплачена с кошелька и опубликована.",
            });
            router.push("/customer-profile");
          }
        },
        onError: (error: any) => {
          toast({
            variant: "destructive",
            title: "Ошибка",
            description: error.message || "Не удалось создать запрос.",
          });
        },
      },
    );
  };

  const hasEnoughBalance = walletBalance >= requestPrice;

  if (status === "loading" || isProfileLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 max-w-2xl px-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Назад
      </Button>

      <Card className="border-2 shadow-lg">
        <CardHeader className="bg-secondary/10 border-b">
          <CardTitle className="text-2xl">Создать платную заявку</CardTitle>
          <CardDescription>
            Стоимость публикации:{" "}
            <span className="font-bold text-foreground">
              {requestPrice} руб.
            </span>
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ... Category, City, Description, Budget Inputs (Same as previous implementation) ... */}
            <div className="space-y-2">
              <Label>Категория услуги *</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 relative">
              <Label>Город *</Label>
              <Input
                value={cityInput}
                onChange={handleCityInputChange}
                placeholder="Например: Москва"
                required
                autoComplete="off"
              />
              {autocompleteResults.length > 0 && (
                <div className="absolute z-10 w-full bg-background border rounded-md shadow-md mt-1">
                  {autocompleteResults.map((res) => (
                    <div
                      key={res}
                      onClick={() => {
                        setCityInput(res);
                        setAutocompleteResults([]);
                      }}
                      className="p-2 hover:bg-muted cursor-pointer text-sm"
                    >
                      {res}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Описание задачи *</Label>
              <Textarea
                value={serviceDescription}
                onChange={(e) => setServiceDescription(e.target.value)}
                required
                className="h-24"
              />
            </div>

            {/* --- NEW: PROFESSIONAL PAYMENT SELECTION --- */}
            <div className="space-y-3 pt-4 border-t">
              <Label className="text-lg font-semibold">Способ оплаты</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* WALLET CARD */}
                <div
                  onClick={() => hasEnoughBalance && setPaymentMethod("wallet")}
                  className={cn(
                    "relative border-2 rounded-xl p-4 cursor-pointer transition-all",
                    paymentMethod === "wallet"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50",
                    !hasEnoughBalance &&
                      "opacity-50 cursor-not-allowed grayscale-[50%]",
                  )}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={cn(
                        "p-2 rounded-full",
                        paymentMethod === "wallet"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted",
                      )}
                    >
                      <Wallet className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold leading-none">Мой кошелек</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Баланс: {walletBalance.toLocaleString()} ₽
                      </p>
                    </div>
                  </div>
                  {!hasEnoughBalance && (
                    <p className="text-xs text-destructive flex items-center mt-2">
                      <AlertCircle className="h-3 w-3 mr-1" /> Недостаточно
                      средств
                    </p>
                  )}
                </div>

                {/* GATEWAY CARD */}
                <div
                  onClick={() => setPaymentMethod("gateway")}
                  className={cn(
                    "relative border-2 rounded-xl p-4 cursor-pointer transition-all",
                    paymentMethod === "gateway"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "p-2 rounded-full",
                        paymentMethod === "gateway"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted",
                      )}
                    >
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold leading-none">
                        Банковская карта
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        МИР, Visa, MasterCard
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-lg"
              disabled={
                isSubmitting ||
                (!hasEnoughBalance && paymentMethod === "wallet")
              }
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : null}
              {paymentMethod === "wallet"
                ? "Оплатить с кошелька"
                : "Перейти к оплате картой"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
