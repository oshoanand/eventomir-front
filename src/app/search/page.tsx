"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

// UI Components
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Skeleton } from "@/components/ui/skeleton";
import CompareButton from "@/components/CompareButton";

// Icons
import {
  CalendarIcon,
  MapPin,
  Search,
  List,
  Map as MapIcon,
  Crown,
  Briefcase,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Services & Hooks
import { useToast } from "@/hooks/use-toast";
import { useMounted } from "@/hooks/use-mounted";
import { getRussianRegionsWithCities } from "@/services/geo";
import {
  getPerformersPaginated,
  type PerformerProfile,
} from "@/services/performer";
import { getSiteSettings } from "@/services/settings"; // <-- Imported your settings service
import { cn } from "@/utils/utils";

// Fallback categories in case the backend API fails or settings are empty
const FALLBACK_CATEGORIES = [
  "Фотограф",
  "Студия",
  "DJ",
  "Ведущие",
  "Дизайнер",
  "Декоратор",
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

const PAGE_SIZE = 12;

const SearchPage = () => {
  const mounted = useMounted();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  // Dynamic Categories State
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // Filter States (Initialized from URL parameters if present)
  const [cityInput, setCityInput] = useState(searchParams.get("city") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("priceMin") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("priceMax") || "");
  const [selectedService, setSelectedService] = useState<string | null>(
    searchParams.get("category"),
  );
  const [selectedAccountType, setSelectedAccountType] = useState(
    searchParams.get("accountType") || "all",
  );
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [onlyVip, setOnlyVip] = useState(
    searchParams.get("onlyVip") === "true",
  );

  // Pagination & Results States
  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get("page")) || 1,
  );
  const [totalResults, setTotalResults] = useState(0);
  const [searchResults, setSearchResults] = useState<PerformerProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  // Autocomplete States
  const [regions, setRegions] = useState<
    { name: string; cities: { name: string }[] }[]
  >([]);
  const [autocompleteResults, setAutocompleteResults] = useState<string[]>([]);

  // Update URL function (Syncs state to URL for sharing)
  const updateURLParams = useCallback(
    (page: number) => {
      const params = new URLSearchParams();
      if (cityInput) params.set("city", cityInput);
      if (selectedService && selectedService !== "_all_")
        params.set("category", selectedService);
      if (minPrice) params.set("priceMin", minPrice);
      if (maxPrice) params.set("priceMax", maxPrice);
      if (selectedAccountType !== "all")
        params.set("accountType", selectedAccountType);
      if (onlyVip) params.set("onlyVip", "true");
      if (page > 1) params.set("page", page.toString());

      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [
      cityInput,
      selectedService,
      minPrice,
      maxPrice,
      selectedAccountType,
      onlyVip,
      pathname,
      router,
    ],
  );

  // Fetch Results Function
  const fetchResults = useCallback(
    async (page: number) => {
      setIsSearching(true);
      try {
        const result = await getPerformersPaginated({
          page,
          pageSize: PAGE_SIZE,
          category: selectedService === "_all_" ? undefined : selectedService,
          city: cityInput || undefined,
          priceMin: minPrice ? Number(minPrice) : undefined,
          priceMax: maxPrice ? Number(maxPrice) : undefined,
          onlyVip: onlyVip ? "true" : undefined,
          accountType:
            selectedAccountType === "all" ? undefined : selectedAccountType,
        });

        setSearchResults(result.items);
        setTotalResults(result.total);
        updateURLParams(page);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Ошибка",
          description: "Не удалось загрузить результаты.",
        });
      } finally {
        setIsSearching(false);
      }
    },
    [
      selectedService,
      cityInput,
      minPrice,
      maxPrice,
      onlyVip,
      selectedAccountType,
      updateURLParams,
      toast,
    ],
  );

  // --- FETCH DYNAMIC CATEGORIES AND REGIONS ON MOUNT ---
  useEffect(() => {
    // 1. Fetch Geolocation Data
    getRussianRegionsWithCities().then(setRegions).catch(console.error);

    // 2. Fetch Categories using your dedicated settings service
    const loadCategories = async () => {
      try {
        const settings = await getSiteSettings();

        if (
          settings &&
          settings.siteCategories &&
          settings.siteCategories.length > 0
        ) {
          // Extract just the category names to populate the dropdown
          const fetchedCategories = settings.siteCategories.map(
            (cat) => cat.name,
          );
          setCategories(fetchedCategories);
        } else {
          throw new Error("Categories array was empty");
        }
      } catch (error) {
        console.warn(
          "Failed to load categories from backend. Using fallback list.",
          error,
        );
        setCategories(FALLBACK_CATEGORIES);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  // Initial search fetch based on URL params on Mount
  useEffect(() => {
    if (mounted) fetchResults(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  // Handlers
  const handleSearchClick = () => {
    setCurrentPage(1);
    fetchResults(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchResults(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCityInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setAutocompleteResults([...new Set(results)].slice(0, 10)); // Show max 10
    } else {
      setAutocompleteResults([]);
    }
  };

  // Prevent hydration errors
  if (!mounted) {
    return (
      <div className="container mx-auto py-10">
        <Skeleton className="h-[500px] w-full rounded-xl" />
      </div>
    );
  }

  const totalPages = Math.ceil(totalResults / PAGE_SIZE);

  return (
    <div className="container mx-auto py-10">
      <div className="grid gap-6">
        {/* --- FILTERS SECTION --- */}
        <Card className="border-primary/10 shadow-sm">
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              {/* Dynamic Category Select */}
              <div className="space-y-2">
                <Label>Категория услуги</Label>
                <Select
                  value={selectedService || "_all_"}
                  onValueChange={(v) =>
                    setSelectedService(v === "_all_" ? null : v)
                  }
                  disabled={isLoadingCategories}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        isLoadingCategories ? "Загрузка..." : "Все услуги"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all_">Все услуги</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Дата мероприятия</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? (
                        format(selectedDate, "PPP", { locale: ru })
                      ) : (
                        <span>Выбрать дату</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                      locale={ru}
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Тип исполнителя</Label>
                <Select
                  value={selectedAccountType}
                  onValueChange={setSelectedAccountType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Тип аккаунта" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все типы</SelectItem>
                    <SelectItem value="individual">Частный профиль</SelectItem>
                    <SelectItem value="agency">Агентство</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 relative">
                <Label>Город</Label>
                <Input
                  type="text"
                  placeholder="Введите город..."
                  value={cityInput}
                  onChange={handleCityInputChange}
                />
                {autocompleteResults.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border bg-background shadow-lg max-h-60 overflow-y-auto">
                    {autocompleteResults.map((res, i) => (
                      <div
                        key={i}
                        className="cursor-pointer px-4 py-2 text-sm hover:bg-accent"
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <Label>Бюджет (₽)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="от"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    type="number"
                    placeholder="до"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 border rounded-md px-3 py-2 bg-yellow-500/5 border-yellow-500/20 h-10">
                <Checkbox
                  id="vip-only"
                  checked={onlyVip}
                  onCheckedChange={(v) => setOnlyVip(!!v)}
                />
                <Label
                  htmlFor="vip-only"
                  className="text-xs font-bold text-yellow-700 flex items-center gap-1 cursor-pointer"
                >
                  <Crown className="h-3 w-3" /> Только VIP / Звезды
                </Label>
              </div>

              <div className="lg:col-span-2 flex gap-2">
                <Button
                  variant="destructive"
                  className="flex-grow font-bold shadow-lg shadow-destructive/20"
                  onClick={handleSearchClick}
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <Search className="mr-2 h-4 w-4 animate-bounce" />
                  ) : (
                    <Search className="mr-2 h-4 w-4" />
                  )}
                  Найти исполнителей
                </Button>
                <div className="flex gap-1">
                  <Button
                    variant={viewMode === "list" ? "secondary" : "outline"}
                    size="icon"
                    onClick={() => setViewMode("list")}
                    title="Список"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "map" ? "secondary" : "outline"}
                    size="icon"
                    onClick={() => setViewMode("map")}
                    title="Карта"
                  >
                    <MapIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* --- RESULTS SECTION --- */}
        <div className="mt-6 space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold tracking-tight">
              Найдено: {totalResults}
            </h2>
            <div className="text-sm text-muted-foreground">
              Показано {searchResults.length} на странице
            </div>
          </div>

          {isSearching ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-[340px] w-full rounded-xl" />
              ))}
            </div>
          ) : searchResults.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((performer) => (
                  <Card
                    key={performer.id}
                    className={cn(
                      "flex flex-col relative transition-all hover:shadow-xl group border-none shadow-sm bg-card overflow-hidden",
                      performer.isVip && "ring-1 ring-yellow-500/30",
                    )}
                  >
                    {performer.isVip && (
                      <div className="absolute top-0 right-0 p-1.5 bg-yellow-500 text-white rounded-bl-lg shadow-sm z-10 flex items-center gap-1 text-[10px] font-bold">
                        <Crown className="h-3 w-3" /> STAR
                      </div>
                    )}
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <Link
                          href={`/performer-profile?id=${performer.id}`}
                          className="flex items-center gap-3 group/link"
                        >
                          <Avatar className="h-14 w-14 border-2 border-background shadow-sm">
                            <AvatarImage
                              src={performer.profilePicture || ""}
                              alt={performer.name}
                            />
                            <AvatarFallback>
                              {performer.name.substring(0, 1).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-lg group-hover/link:text-primary transition-colors line-clamp-1">
                              {performer.name}
                            </CardTitle>
                            <CardDescription className="flex items-center text-xs gap-1 mt-0.5">
                              <MapPin className="h-3 w-3 text-primary" />
                              {performer.city}
                            </CardDescription>
                            {performer.parentAgencyName && (
                              <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground font-bold uppercase tracking-tight">
                                <Briefcase className="h-2.5 w-2.5" /> от{" "}
                                {performer.parentAgencyName}
                              </div>
                            )}
                          </div>
                        </Link>
                        <CompareButton performerId={performer.id} />
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-sm text-muted-foreground line-clamp-3 italic leading-relaxed">
                        {performer.description || "Нет описания"}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {performer.roles.slice(0, 3).map((r) => (
                          <Badge
                            key={r}
                            variant="secondary"
                            className="text-[10px] bg-primary/5 text-primary border-none"
                          >
                            {r}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between items-center pt-4 border-t bg-muted/5">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">
                          Цена
                        </span>
                        <span className="text-sm font-black text-primary">
                          {performer.priceRange && performer.priceRange[0] > 0
                            ? `${performer.priceRange[0].toLocaleString()} ₽`
                            : "По запросу"}
                        </span>
                      </div>
                      <Button
                        asChild
                        variant={performer.isVip ? "destructive" : "outline"}
                        size="sm"
                        className="font-bold"
                      >
                        <Link href={`/performer-profile?id=${performer.id}`}>
                          Подробнее
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-10">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-sm font-medium">
                    Страница {currentPage} из {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 bg-muted/10 rounded-2xl border-2 border-dashed">
              <Search className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
              <h3 className="text-xl font-bold">Ничего не найдено</h3>
              <p className="text-muted-foreground">
                Попробуйте изменить параметры поиска.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
