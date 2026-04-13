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
  Layers,
} from "lucide-react";

// Services & Hooks
import { useToast } from "@/hooks/use-toast";
import { useMounted } from "@/hooks/use-mounted";
import { getRussianRegionsWithCities } from "@/services/geo";
import {
  getPerformersPaginated,
  type PerformerProfile,
} from "@/services/performer";
import { cn } from "@/utils/utils";

// 🚨 IMPORT REACT QUERY HOOK FOR FRESH SETTINGS 🚨
import {
  useGeneralSettingsQuery,
  type SiteCategory,
} from "@/services/settings";

// Fallback categories in case settings are completely empty
const FALLBACK_CATEGORIES: SiteCategory[] = [
  { id: "1", name: "Фотограф", icon: "Camera", link: "", subCategories: [] },
  { id: "2", name: "DJ", icon: "Music", link: "", subCategories: [] },
  { id: "3", name: "Ведущие", icon: "Mic", link: "", subCategories: [] },
  { id: "4", name: "Дизайнер", icon: "Palette", link: "", subCategories: [] },
  { id: "5", name: "Видеограф", icon: "Film", link: "", subCategories: [] },
];

const PAGE_SIZE = 12;

const SearchPage = () => {
  const mounted = useMounted();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const { data: settings, isLoading: isLoadingCategories } =
    useGeneralSettingsQuery();

  // Safely extract categories from fresh settings
  const categories =
    settings?.siteCategories && settings.siteCategories.length > 0
      ? settings.siteCategories
      : FALLBACK_CATEGORIES;

  // --- FILTER STATES ---
  const [cityInput, setCityInput] = useState(searchParams.get("city") || "");
  const [minPrice, setMinPrice] = useState(searchParams.get("priceMin") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("priceMax") || "");
  const [selectedService, setSelectedService] = useState<string | null>(
    searchParams.get("category"),
  );

  // 🚨 NEW: Array state to support multiple sub-category selections
  const initialSubCats = searchParams.get("subCategories");
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>(
    initialSubCats ? initialSubCats.split(",") : [],
  );

  const [selectedAccountType, setSelectedAccountType] = useState(
    searchParams.get("accountType") || "all",
  );
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [onlyVip, setOnlyVip] = useState(
    searchParams.get("onlyVip") === "true",
  );

  // --- RESULTS STATES ---
  const [currentPage, setCurrentPage] = useState(
    Number(searchParams.get("page")) || 1,
  );
  const [totalResults, setTotalResults] = useState(0);
  const [searchResults, setSearchResults] = useState<PerformerProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  // Autocomplete
  const [regions, setRegions] = useState<
    { name: string; cities: { name: string }[] }[]
  >([]);
  const [autocompleteResults, setAutocompleteResults] = useState<string[]>([]);

  // 🚨 DERIVED STATE: Get the active category object to display its subcategories
  const activeCategoryObj = categories.find((c) => c.name === selectedService);
  const availableSubCategories = activeCategoryObj?.subCategories || [];

  // EFFECT: Clear invalid subcategories if the main category changes
  useEffect(() => {
    if (selectedService && activeCategoryObj) {
      const validSubNames =
        activeCategoryObj.subCategories?.map((s) => s.name) || [];

      setSelectedSubCategories((prev) => {
        const filtered = prev.filter((sub) => validSubNames.includes(sub));
        // 🚨 PREVENT INFINITE LOOP: Only update state if something was actually removed
        if (filtered.length !== prev.length) {
          return filtered;
        }
        return prev;
      });
    } else {
      // 🚨 PREVENT INFINITE LOOP: Only clear if the array isn't already empty
      setSelectedSubCategories((prev) => (prev.length > 0 ? [] : prev));
    }
  }, [selectedService, activeCategoryObj]); // Removed the volatile array from dependencies

  const updateURLParams = useCallback(
    (page: number) => {
      const params = new URLSearchParams();
      if (cityInput) params.set("city", cityInput);
      if (selectedService && selectedService !== "_all_")
        params.set("category", selectedService);

      // Pass multiple sub-categories as a comma-separated string
      if (selectedSubCategories.length > 0) {
        params.set("subCategories", selectedSubCategories.join(","));
      }

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
      selectedSubCategories,
      minPrice,
      maxPrice,
      selectedAccountType,
      onlyVip,
      pathname,
      router,
    ],
  );

  const fetchResults = useCallback(
    async (page: number) => {
      setIsSearching(true);
      try {
        const result = await getPerformersPaginated({
          page,
          pageSize: PAGE_SIZE,
          category: selectedService === "_all_" ? undefined : selectedService,
          // Backend should handle splitting the comma-separated string
          subCategories:
            selectedSubCategories.length > 0
              ? selectedSubCategories.join(",")
              : undefined,
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
      selectedSubCategories,
      cityInput,
      minPrice,
      maxPrice,
      onlyVip,
      selectedAccountType,
      updateURLParams,
      toast,
    ],
  );

  useEffect(() => {
    getRussianRegionsWithCities().then(setRegions).catch(console.error);
  }, []);

  useEffect(() => {
    if (mounted) fetchResults(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

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
      setAutocompleteResults([...new Set(results)].slice(0, 10));
    } else {
      setAutocompleteResults([]);
    }
  };

  // 🚨 NEW: Toggle function for multi-select
  const toggleSubCategory = (subName: string) => {
    setSelectedSubCategories((prev) =>
      prev.includes(subName)
        ? prev.filter((name) => name !== subName)
        : [...prev, subName],
    );
  };

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
                  <SelectTrigger className="bg-muted/30">
                    <SelectValue
                      placeholder={
                        isLoadingCategories ? "Загрузка..." : "Все услуги"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all_">Все услуги</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Select */}
              <div className="space-y-2">
                <Label>Дата мероприятия</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal bg-muted/30",
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

              {/* Account Type */}
              <div className="space-y-2">
                <Label>Тип исполнителя</Label>
                <Select
                  value={selectedAccountType}
                  onValueChange={setSelectedAccountType}
                >
                  <SelectTrigger className="bg-muted/30">
                    <SelectValue placeholder="Тип аккаунта" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все типы</SelectItem>
                    <SelectItem value="individual">Частный профиль</SelectItem>
                    <SelectItem value="agency">Агентство</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* City Input */}
              <div className="space-y-2 relative">
                <Label>Город</Label>
                <Input
                  type="text"
                  placeholder="Введите город..."
                  value={cityInput}
                  onChange={handleCityInputChange}
                  className="bg-muted/30"
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

            {/* DYNAMIC SUB-CATEGORY BLOCK */}
            {availableSubCategories.length > 0 && (
              <div className="pt-4 border-t border-dashed animate-in slide-in-from-top-4 fade-in duration-300">
                <Label className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
                  <Layers className="h-4 w-4" /> Уточните специализацию:
                </Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={
                      selectedSubCategories.length === 0 ? "default" : "outline"
                    }
                    size="sm"
                    className="rounded-full shadow-sm"
                    onClick={() => setSelectedSubCategories([])}
                  >
                    Все в категории "{activeCategoryObj?.name}"
                  </Button>
                  {availableSubCategories.map((sub) => {
                    const isSelected = selectedSubCategories.includes(sub.name);
                    return (
                      <Button
                        key={sub.id}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        className={cn(
                          "rounded-full shadow-sm transition-all",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-background",
                        )}
                        onClick={() => toggleSubCategory(sub.name)}
                      >
                        {sub.name}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Price & Search Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end pt-2">
              <div className="space-y-2">
                <Label>Бюджет (₽)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="от"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="bg-muted/30"
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    type="number"
                    placeholder="до"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="bg-muted/30"
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
                  className="flex-grow font-bold shadow-lg shadow-destructive/20 h-10"
                  onClick={handleSearchClick}
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <Search className="mr-2 h-4 w-4 animate-bounce" />
                  ) : (
                    <Search className="mr-2 h-4 w-4" />
                  )}{" "}
                  Найти исполнителей
                </Button>
                <div className="flex gap-1">
                  <Button
                    variant={viewMode === "list" ? "secondary" : "outline"}
                    size="icon"
                    onClick={() => setViewMode("list")}
                    title="Список"
                    className="h-10 w-10"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "map" ? "secondary" : "outline"}
                    size="icon"
                    onClick={() => setViewMode("map")}
                    title="Карта"
                    className="h-10 w-10"
                  >
                    <MapIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* --- RESULTS SECTION --- */}
        <div className="mt-4 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold tracking-tight">
              Найдено: {totalResults}
            </h2>
            <div className="text-sm text-muted-foreground font-medium">
              Показано {searchResults.length} на странице
            </div>
          </div>

          {isSearching ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-[340px] w-full rounded-2xl" />
              ))}
            </div>
          ) : searchResults.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((performer) => (
                  <Card
                    key={performer.id}
                    className={cn(
                      "flex flex-col relative transition-all hover:shadow-xl group border border-muted shadow-sm bg-card overflow-hidden rounded-2xl",
                      performer.isVip &&
                        "ring-2 ring-yellow-500/50 border-yellow-500/20",
                    )}
                  >
                    {performer.isVip && (
                      <div className="absolute top-0 right-0 p-1.5 bg-gradient-to-tr from-yellow-600 to-yellow-400 text-white rounded-bl-xl shadow-md z-10 flex items-center gap-1 text-[10px] font-extrabold tracking-wider">
                        <Crown className="h-3 w-3" /> STAR
                      </div>
                    )}
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <Link
                          href={`/performer-profile?id=${performer.id}`}
                          className="flex items-center gap-4 group/link flex-grow"
                        >
                          <Avatar className="h-16 w-16 border-2 border-background shadow-md">
                            <AvatarImage
                              src={performer.profilePicture || ""}
                              alt={performer.name}
                              className="object-cover"
                            />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                              {performer.name.substring(0, 1).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col overflow-hidden">
                            <CardTitle className="text-lg group-hover/link:text-primary transition-colors truncate">
                              {performer.name}
                            </CardTitle>
                            <CardDescription className="flex items-center text-xs gap-1 mt-1 font-medium">
                              <MapPin className="h-3 w-3 text-primary/70 shrink-0" />{" "}
                              <span className="truncate">{performer.city}</span>
                            </CardDescription>
                            {performer.parentAgencyName && (
                              <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase tracking-tight bg-muted/50 w-fit px-2 py-0.5 rounded-full">
                                <Briefcase className="h-3 w-3" /> от{" "}
                                {performer.parentAgencyName}
                              </div>
                            )}
                          </div>
                        </Link>
                        <CompareButton performerId={performer.id} />
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                        {performer.description || "О себе не рассказано"}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {performer.roles.slice(0, 4).map((r) => (
                          <Badge
                            key={r}
                            variant="secondary"
                            className="text-[10px] bg-primary/10 text-primary hover:bg-primary/20 transition-colors border-none"
                          >
                            {r}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between items-center pt-5 border-t bg-muted/10">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">
                          Стоимость
                        </span>
                        <span className="text-sm font-black text-primary">
                          {performer.priceRange && performer.priceRange[0] > 0
                            ? `от ${performer.priceRange[0].toLocaleString()} ₽`
                            : "По запросу"}
                        </span>
                      </div>
                      <Button
                        asChild
                        variant={performer.isVip ? "destructive" : "default"}
                        size="sm"
                        className="font-bold rounded-full px-5 shadow-sm"
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
                <div className="flex justify-center items-center gap-4 mt-12 bg-card border rounded-full w-fit mx-auto p-2 shadow-sm">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <div className="text-sm font-semibold px-4 text-muted-foreground">
                    Страница {currentPage} из {totalPages}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-24 bg-muted/10 rounded-3xl border-2 border-dashed">
              <Search className="h-16 w-16 mx-auto text-muted-foreground opacity-20 mb-4" />
              <h3 className="text-2xl font-bold mb-2">Ничего не найдено</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Попробуйте изменить параметры поиска, убрать фильтры или выбрать
                другой город.
              </p>
              <Button
                variant="outline"
                className="mt-6 rounded-full"
                onClick={() => {
                  setSelectedService(null);
                  setSelectedSubCategories([]);
                  setCityInput("");
                  setMinPrice("");
                  setMaxPrice("");
                  setOnlyVip(false);
                  handleSearchClick();
                }}
              >
                Сбросить фильтры
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
