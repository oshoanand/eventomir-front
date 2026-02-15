"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react"; // Import useSession
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
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";

// Services
import { getRussianRegionsWithCities } from "@/services/geo";
import { getPaidRequestPrice } from "@/services/payment";
import { useCreatePaidRequestMutation } from "@/services/requests";

// Constants
const categories = [
  "Фотограф",
  "DJ",
  "Ведущие",
  "Дизайнер",
  "Видеограф",
  "Флорист",
  "Повар",
  "Транспорт",
  "Аниматор",
  "Визажист",
  "Стилист",
  "Рестораны",
  "Артисты",
  "Стендаперы",
];

const CreateRequestPage = () => {
  // --- Auth & Router ---
  const { data: session, status } = useSession(); // Fetch session
  const router = useRouter();
  const { toast } = useToast();

  // --- State ---
  const [category, setCategory] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [budget, setBudget] = useState("");

  // City Autocomplete State
  const [city, setCity] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [regions, setRegions] = useState<
    { name: string; cities: { name: string }[] }[]
  >([]);
  const [autocompleteResults, setAutocompleteResults] = useState<string[]>([]);

  // Price State
  const [requestPrice, setRequestPrice] = useState<number | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);

  // TanStack Query Mutation
  const { mutate: createRequest, isPending: isSubmitting } =
    useCreatePaidRequestMutation();

  // --- Effects ---

  // 1. Auth Check: Redirect if not logged in
  useEffect(() => {
    if (status === "unauthenticated") {
      toast({
        variant: "destructive",
        title: "Доступ запрещен",
        description: "Пожалуйста, войдите в систему.",
      });
      router.push("/auth/login");
    }
  }, [status, router, toast]);

  // 2. Load Price
  useEffect(() => {
    const fetchRequestPrice = async () => {
      setIsLoadingPrice(true);
      try {
        const price = await getPaidRequestPrice();
        setRequestPrice(price);
      } catch (error) {
        console.error("Error loading price:", error);
        setRequestPrice(490); // Default fallback
        toast({
          variant: "destructive",
          title: "Ошибка",
          description: "Не удалось загрузить актуальную цену.",
        });
      } finally {
        setIsLoadingPrice(false);
      }
    };
    fetchRequestPrice();
  }, [toast]);

  // 3. Load Regions (for city autocomplete)
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const regionsWithCities = await getRussianRegionsWithCities();
        setRegions(regionsWithCities);
      } catch (error) {
        console.error("Failed to fetch regions:", error);
      }
    };
    fetchRegions();
  }, []);

  // --- Handlers ---

  const handleCityInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      setCityInput(input);

      if (input.length >= 2) {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 0. Auth Validation
    const currentCustomerId = session?.user?.id;
    if (!currentCustomerId) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Вы не авторизованы.",
      });
      return;
    }

    // 1. Form Validation
    if (!category || !serviceDescription) {
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Пожалуйста, заполните категорию и описание услуги.",
      });
      return;
    }

    // 2. Prepare Data
    const cityToSubmit = cityInput.trim() || undefined;

    // 3. Call Mutation
    createRequest(
      {
        customerId: currentCustomerId, // Using the ID from session
        category,
        serviceDescription,
        budget: budget || undefined,
        city: cityToSubmit,
      },
      {
        onSuccess: () => {
          toast({
            title: "Запрос успешно создан!",
            description: "Ваш запрос отправлен исполнителям.",
          });
          router.push("/customer-profile");
        },
        onError: (error: any) => {
          console.error("Submission error:", error);
          toast({
            variant: "destructive",
            title: "Ошибка",
            description: error.message || "Не удалось создать запрос.",
          });
        },
      },
    );
  };

  // --- Render Helpers ---
  const priceText = requestPrice !== null ? `${requestPrice} руб.` : "...";
  const buttonText = isLoadingPrice
    ? "Загрузка цены..."
    : `Оплатить и опубликовать (${priceText})`;

  // Loading state for the entire page (waiting for session)
  if (status === "loading") {
    return (
      <div className="container mx-auto py-10 max-w-2xl flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If unauthenticated (useEffect will redirect, but we return null to avoid flash)
  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      {/* Back Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Назад к профилю
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Создать платный запрос на услугу</CardTitle>
          {isLoadingPrice ? (
            <Skeleton className="h-4 w-3/4 mt-2" />
          ) : (
            <CardDescription>
              Опишите задачу, и её увидят тысячи исполнителей. Стоимость
              размещения:{" "}
              <span className="font-semibold text-foreground">{priceText}</span>
              .
            </CardDescription>
          )}
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category Select */}
            <div className="space-y-2">
              <Label htmlFor="category">Категория услуги *</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger id="category">
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

            {/* Description Textarea */}
            <div className="space-y-2">
              <Label htmlFor="serviceDescription">Подробное описание *</Label>
              <Textarea
                id="serviceDescription"
                value={serviceDescription}
                onChange={(e) => setServiceDescription(e.target.value)}
                placeholder="Опишите детали: дата, количество гостей, пожелания..."
                required
                className="min-h-[120px]"
              />
            </div>

            {/* Budget Input */}
            <div className="space-y-2">
              <Label htmlFor="budget">Бюджет (необязательно)</Label>
              <Input
                id="budget"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="Например: до 50 000 руб."
              />
            </div>

            {/* City Autocomplete */}
            <div className="space-y-2 relative">
              <Label htmlFor="city">Город (необязательно)</Label>
              <Input
                id="city"
                type="text"
                placeholder="Начните вводить город..."
                value={cityInput}
                onChange={handleCityInputChange}
                autoComplete="off"
              />

              {/* Dropdown Results */}
              {autocompleteResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md max-h-60 overflow-y-auto">
                  {autocompleteResults.map((result, index) => (
                    <div
                      key={`${result}-${index}`}
                      className="cursor-pointer px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                      onClick={() => {
                        setCityInput(result);
                        setCity(result);
                        setAutocompleteResults([]);
                      }}
                    >
                      {result}
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Оставьте пустым для онлайн-услуг.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                variant="default"
                disabled={isSubmitting || isLoadingPrice}
                className="w-full sm:w-auto"
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isSubmitting ? "Публикация..." : buttonText}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateRequestPage;
