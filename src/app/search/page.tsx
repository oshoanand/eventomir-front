"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { getRussianRegionsWithCities } from "@/services/geo";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarIcon,
  MapPin,
  DollarSign,
  Map as MapIcon,
  List,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/utils/utils";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import CompareButton from "@/components/CompareButton";
import { Skeleton } from "@/components/ui/skeleton";

// --- UPDATED IMPORTS ---
import { useSearchPerformers } from "@/services/performer";
import type { PerformerProfile } from "@/services/performer";

// --- CONSTANTS ---
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
  "Ресторан",
  "Артисты",
  "Стендаперы",
];
const transportTypes = [
  "Легковой автомобиль",
  "Микроавтобус",
  "Автобус",
  "Лимузин",
  "Ретро автомобиль",
];
const transportCapacities = [
  "До 4 человек",
  "5-10 человек",
  "11-20 человек",
  "Более 20 человек",
];
const transportServices = [
  "Декор",
  "Фотосессия",
  "Музыкальное сопровождение",
  "Трансфер",
];
const transportBudgets = ["Эконом", "Средний", "Выше среднего", "Премиум"];
const transportEventStyles = [
  "Свадьба",
  "Корпоратив",
  "День рождения",
  "Юбилей",
  "Детский праздник",
  "Другое",
];
const cookCuisines = [
  "Русская",
  "Европейская",
  "Азиатская",
  "Итальянская",
  "Кавказская",
  "Другая",
];
const cookBudgets = ["Эконом", "Средний", "Выше среднего", "Премиум"];
const cookEventStyles = [
  "Свадьба",
  "Корпоратив",
  "День рождения",
  "Юбилей",
  "Детский праздник",
  "Другое",
];
const artistGenres = [
  "Музыканты",
  "Ведущие",
  "Танцоры",
  "Оригинальный жанр",
  "Стендап комики",
];
const artistLevels = ["Начинающие", "Профессионалы", "Топовые"];
const artistFormats = ["Классика", "Интерактив", "Шоу-программы"];
const artistBudgets = ["Эконом", "Средний", "Премиум"];
const artistEventTypes = [
  "Свадьбы",
  "Корпоративы",
  "Детские праздники",
  "Юбилеи/Дни рождения",
  "Городские праздники",
  "Другое",
];
const restaurantCuisines = [
  "Русская",
  "Европейская",
  "Азиатская",
  "Итальянская",
  "Кавказская",
  "Другая",
];
const restaurantCapacities = [
  "До 50 человек",
  "50-100 человек",
  "100-200 человек",
  "Более 200 человек",
];
const restaurantServicesList = [
  "Кейтеринг",
  "Декор",
  "Живая музыка",
  "Wi-Fi",
  "Парковка",
];
const restaurantBudgets = ["Эконом", "Средний", "Выше среднего", "Премиум"];
const restaurantEventStyles = [
  "Свадьба",
  "Корпоратив",
  "День рождения",
  "Юбилей",
  "Детский праздник",
  "Другое",
];

const SearchPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  // --- 1. UI States (Controlled Inputs) ---
  const [cityInput, setCityInput] = useState(searchParams.get("city") || "");
  const [priceRange, setPriceRange] = useState<number[]>([
    Number(searchParams.get("priceMin")) || 0,
    Number(searchParams.get("priceMax")) || 50000,
  ]);
  const [selectedService, setSelectedService] = useState<string | null>(
    searchParams.get("category") || null,
  );
  const [selectedAccountType, setSelectedAccountType] = useState<string>(
    searchParams.get("accountType") || "all",
  );
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    searchParams.get("date") ? new Date(searchParams.get("date")!) : undefined,
  );

  // Sub-filters (mapped to specific categories)
  const [selectedTransportType, setSelectedTransportType] = useState<
    string | null
  >(null);
  const [selectedTransportCapacity, setSelectedTransportCapacity] = useState<
    string | null
  >(null);
  const [selectedTransportServices, setSelectedTransportServices] = useState<
    string[]
  >([]);
  const [selectedTransportBudget, setSelectedTransportBudget] = useState<
    string | null
  >(null);
  const [selectedTransportEventStyles, setSelectedTransportEventStyles] =
    useState<string[]>([]);

  const [selectedCookCuisine, setSelectedCookCuisine] = useState<string | null>(
    null,
  );
  const [selectedCookBudget, setSelectedCookBudget] = useState<string | null>(
    null,
  );
  const [selectedCookEventStyles, setSelectedCookEventStyles] = useState<
    string[]
  >([]);

  const [selectedArtistGenre, setSelectedArtistGenre] = useState<string | null>(
    null,
  );
  const [selectedArtistLevel, setSelectedArtistLevel] = useState<string | null>(
    null,
  );
  const [selectedArtistFormat, setSelectedArtistFormat] = useState<
    string | null
  >(null);
  const [selectedArtistBudget, setSelectedArtistBudget] = useState<
    string | null
  >(null);
  const [selectedArtistEventTypes, setSelectedArtistEventTypes] = useState<
    string[]
  >([]);

  const [selectedRestaurantCuisine, setSelectedRestaurantCuisine] = useState<
    string | null
  >(null);
  const [selectedRestaurantCapacity, setSelectedRestaurantCapacity] = useState<
    string | null
  >(null);
  const [selectedRestaurantServices, setSelectedRestaurantServices] = useState<
    string[]
  >([]);
  const [selectedRestaurantBudget, setSelectedRestaurantBudget] = useState<
    string | null
  >(null);
  const [selectedRestaurantEventStyles, setSelectedRestaurantEventStyles] =
    useState<string[]>([]);

  // Autocomplete & UI Layout
  const [regions, setRegions] = useState<
    { name: string; cities: { name: string }[] }[]
  >([]);
  const [autocompleteResults, setAutocompleteResults] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  // --- 2. Active Query State (Triggers the Hook) ---
  // We initialize this with URL params so the first load triggers a search
  const [activeQuery, setActiveQuery] = useState<Record<string, any>>(() => {
    const params: any = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    // Ensure defaults if URL is empty but we want initial data
    if (Object.keys(params).length === 0) {
      return { limit: 20 }; // Default fetch
    }
    return params;
  });

  // --- 3. TanStack Query Hook ---
  const {
    data: searchResults = [],
    isLoading: isSearching,
    isError,
  } = useSearchPerformers(activeQuery);

  // --- 4. Effects ---

  // Load Regions on Mount
  useEffect(() => {
    getRussianRegionsWithCities().then(setRegions).catch(console.error);
  }, []);

  // --- 5. Handlers ---

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

  // The Search Action: Commits UI state to Active Query
  const handleSearch = () => {
    // 1. Construct the filters object from current UI state
    const filters: any = {
      city: cityInput,
      category: selectedService === "_all_" ? null : selectedService,
      accountType: selectedAccountType === "all" ? null : selectedAccountType,
      date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : null,
      priceMin: priceRange[0],
      priceMax: priceRange[1],
    };

    // 2. Add Category Specifics
    if (selectedService === "Транспорт") {
      if (selectedTransportType) filters.subType = selectedTransportType;
      if (selectedTransportCapacity)
        filters.capacity = selectedTransportCapacity;
      if (selectedTransportServices.length)
        filters.services = selectedTransportServices;
      if (selectedTransportBudget) filters.budget = selectedTransportBudget;
      if (selectedTransportEventStyles.length)
        filters.eventStyles = selectedTransportEventStyles;
    } else if (selectedService === "Повар") {
      if (selectedCookCuisine) filters.cuisine = selectedCookCuisine;
      if (selectedCookBudget) filters.budget = selectedCookBudget;
      if (selectedCookEventStyles.length)
        filters.eventStyles = selectedCookEventStyles;
    } else if (selectedService === "Артисты") {
      if (selectedArtistGenre) filters.subType = selectedArtistGenre;
      if (selectedArtistLevel) filters.artistLevel = selectedArtistLevel;
      if (selectedArtistFormat) filters.artistFormat = selectedArtistFormat;
      if (selectedArtistBudget) filters.budget = selectedArtistBudget;
      if (selectedArtistEventTypes.length)
        filters.eventStyles = selectedArtistEventTypes;
    } else if (selectedService === "Ресторан") {
      if (selectedRestaurantCuisine)
        filters.cuisine = selectedRestaurantCuisine;
      if (selectedRestaurantCapacity)
        filters.capacity = selectedRestaurantCapacity;
      if (selectedRestaurantServices.length)
        filters.services = selectedRestaurantServices;
      if (selectedRestaurantBudget) filters.budget = selectedRestaurantBudget;
      if (selectedRestaurantEventStyles.length)
        filters.eventStyles = selectedRestaurantEventStyles;
    }

    // 3. Update URL (Shallow push)
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== "") {
        if (Array.isArray(v)) {
          if (v.length > 0) queryParams.append(k, v.join(","));
        } else {
          queryParams.append(k, String(v));
        }
      }
    });
    router.push(`/search?${queryParams.toString()}`, { scroll: false });

    // 4. Trigger Hook by updating Active Query
    setActiveQuery(filters);
    setViewMode("list");
  };

  // Helper for array checkbox toggles
  const toggleArrayState = (setter: any, current: string[], item: string) => {
    setter(
      current.includes(item)
        ? current.filter((i) => i !== item)
        : [...current, item],
    );
  };

  const ResultCardSkeleton = () => (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex justify-between">
          <div className="flex gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
          <Skeleton className="h-8 w-8" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-1">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-24" />
      </CardFooter>
    </Card>
  );

  return (
    <div className="container mx-auto py-10">
      <div className="grid gap-6">
        {/* --- MAIN FILTERS CARD --- */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              {/* Service */}
              <Select
                value={selectedService || "_all_"}
                onValueChange={(val) =>
                  setSelectedService(val === "_all_" ? null : val)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите услугу..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all_">Все услуги</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Account Type */}
              <Select
                value={selectedAccountType}
                onValueChange={setSelectedAccountType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Тип аккаунта" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все типы</SelectItem>
                  <SelectItem value="individual">Частный</SelectItem>
                  <SelectItem value="agency">Агентство</SelectItem>
                </SelectContent>
              </Select>

              {/* City Autocomplete */}
              <div className="relative w-full">
                <Input
                  placeholder="Город..."
                  value={cityInput}
                  onChange={handleCityInputChange}
                  className="w-full"
                />
                {autocompleteResults.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full bg-popover text-popover-foreground border rounded-md shadow-md max-h-60 overflow-y-auto">
                    {autocompleteResults.map((res, i) => (
                      <div
                        key={i}
                        className="px-4 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm"
                        onClick={() => {
                          setCityInput(res);
                          setAutocompleteResults([]);
                        }}
                      >
                        {res}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Search Action */}
              <Button
                variant="destructive"
                onClick={handleSearch}
                disabled={isSearching}
              >
                {isSearching ? "Поиск..." : "Найти"}
              </Button>
            </div>

            {/* Secondary Row: Date & View Toggle */}
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <Label>Дата:</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[240px] text-left font-normal",
                      !selectedDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate
                      ? format(selectedDate, "PPP", { locale: ru })
                      : "Любая дата"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    locale={ru}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <div className="ml-auto flex gap-2">
                <Button
                  variant={viewMode === "list" ? "destructive" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "map" ? "destructive" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("map")}
                >
                  <MapIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* --- DYNAMIC FILTERS CARD --- */}
        {viewMode === "list" && selectedService && (
          <Card>
            <CardHeader>
              <CardTitle>Фильтры: {selectedService}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Transport */}
              {selectedService === "Транспорт" && (
                <>
                  <div>
                    <Label>Тип</Label>
                    <Select
                      value={selectedTransportType || ""}
                      onValueChange={setSelectedTransportType}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Любой" />
                      </SelectTrigger>
                      <SelectContent>
                        {transportTypes.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Вместимость</Label>
                    <Select
                      value={selectedTransportCapacity || ""}
                      onValueChange={setSelectedTransportCapacity}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Любая" />
                      </SelectTrigger>
                      <SelectContent>
                        {transportCapacities.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label>Услуги</Label>
                    <div className="flex flex-wrap gap-4 border p-2 rounded mt-1">
                      {transportServices.map((s) => (
                        <div key={s} className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedTransportServices.includes(s)}
                            onCheckedChange={() =>
                              toggleArrayState(
                                setSelectedTransportServices,
                                selectedTransportServices,
                                s,
                              )
                            }
                          />
                          <Label className="font-normal">{s}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Cook */}
              {selectedService === "Повар" && (
                <>
                  <div>
                    <Label>Кухня</Label>
                    <Select
                      value={selectedCookCuisine || ""}
                      onValueChange={setSelectedCookCuisine}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Любая" />
                      </SelectTrigger>
                      <SelectContent>
                        {cookCuisines.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Бюджет</Label>
                    <Select
                      value={selectedCookBudget || ""}
                      onValueChange={setSelectedCookBudget}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Любой" />
                      </SelectTrigger>
                      <SelectContent>
                        {cookBudgets.map((b) => (
                          <SelectItem key={b} value={b}>
                            {b}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* Artist */}
              {selectedService === "Артисты" && (
                <>
                  <div>
                    <Label>Жанр</Label>
                    <Select
                      value={selectedArtistGenre || ""}
                      onValueChange={setSelectedArtistGenre}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Любой" />
                      </SelectTrigger>
                      <SelectContent>
                        {artistGenres.map((g) => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Уровень</Label>
                    <Select
                      value={selectedArtistLevel || ""}
                      onValueChange={setSelectedArtistLevel}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Любой" />
                      </SelectTrigger>
                      <SelectContent>
                        {artistLevels.map((l) => (
                          <SelectItem key={l} value={l}>
                            {l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* Restaurant */}
              {selectedService === "Ресторан" && (
                <>
                  <div>
                    <Label>Кухня</Label>
                    <Select
                      value={selectedRestaurantCuisine || ""}
                      onValueChange={setSelectedRestaurantCuisine}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Любая" />
                      </SelectTrigger>
                      <SelectContent>
                        {restaurantCuisines.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Вместимость</Label>
                    <Select
                      value={selectedRestaurantCapacity || ""}
                      onValueChange={setSelectedRestaurantCapacity}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Любая" />
                      </SelectTrigger>
                      <SelectContent>
                        {restaurantCapacities.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* Price Slider (General for most) */}
              {!["Ресторан", "Транспорт", "Повар", "Артисты"].includes(
                selectedService,
              ) && (
                <div className="md:col-span-2">
                  <div className="flex justify-between mb-2">
                    <Label>Цена (₽)</Label>
                    <span className="text-sm text-muted-foreground">
                      {priceRange[0].toLocaleString()} -{" "}
                      {priceRange[1].toLocaleString()}
                    </span>
                  </div>
                  <Slider
                    value={priceRange}
                    max={100000}
                    step={500}
                    onValueChange={setPriceRange}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* --- RESULTS SECTION --- */}
        <div className="mt-6">
          {viewMode === "map" ? (
            <Card>
              <CardContent className="p-10 text-center text-muted-foreground">
                Карта временно отключена из-за технических работ.
              </CardContent>
            </Card>
          ) : (
            <>
              <h2 className="text-2xl font-semibold mb-4">
                Найдено: {searchResults.length}
              </h2>

              {/* Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isSearching
                  ? Array(3)
                      .fill(0)
                      .map((_, i) => <ResultCardSkeleton key={i} />)
                  : searchResults.map((performer) => (
                      <Card
                        key={performer.id}
                        className="flex flex-col hover:shadow-lg transition-shadow"
                      >
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div className="flex gap-4">
                              <Avatar className="h-12 w-12 border">
                                <AvatarImage src={performer.profilePicture} />
                                <AvatarFallback>
                                  {performer.name[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <Link
                                  href={`/performer-profile?id=${performer.id}`}
                                  className="font-bold text-lg hover:underline block"
                                >
                                  {performer.name}
                                </Link>
                                <div className="flex items-center text-xs text-muted-foreground gap-1">
                                  <MapPin className="h-3 w-3" />{" "}
                                  {performer.city}
                                </div>
                              </div>
                            </div>
                            <CompareButton performerId={performer.id} />
                          </div>
                        </CardHeader>
                        <CardContent className="flex-grow">
                          <div className="flex flex-wrap gap-1 mb-2">
                            {performer.roles.slice(0, 3).map((r) => (
                              <Badge
                                key={r}
                                variant="secondary"
                                className="text-xs"
                              >
                                {r}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {performer.description || "Нет описания"}
                          </p>
                        </CardContent>
                        <CardFooter className="flex justify-between items-center border-t pt-4">
                          <span className="font-semibold text-sm">
                            {performer.priceRange?.length === 2
                              ? `от ${performer.priceRange[0].toLocaleString()} ₽`
                              : "Цена не указана"}
                          </span>
                          <Button asChild size="sm" variant="default">
                            <Link
                              href={`/performer-profile?id=${performer.id}`}
                            >
                              Подробнее
                            </Link>
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
              </div>

              {!isSearching && searchResults.length === 0 && (
                <div className="text-center py-20 text-muted-foreground bg-muted/20 rounded-xl">
                  <p>По вашему запросу ничего не найдено.</p>
                  <Button
                    variant="link"
                    onClick={() => {
                      setCityInput("");
                      setSelectedService(null);
                      setSelectedAccountType("all");
                      setActiveQuery({ limit: 20 }); // Reset
                    }}
                  >
                    Сбросить фильтры
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
