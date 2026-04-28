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
import { Card, CardContent } from "@/components/ui/card";
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
  Share2,
  BadgeCheck,
  Youtube,
  Globe,
  SendIcon,
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
import {
  useGeneralSettingsQuery,
  type SiteCategory,
} from "@/services/settings";

// --- LIGHTWEIGHT NLP DICTIONARIES ---
const CATEGORY_ALIASES = [
  { root: "фотограф", exactName: "Фотограф", paramType: "category" },
  { root: "видео", exactName: "Видеограф", paramType: "category" },
  { root: "диджей", exactName: "DJ", paramType: "category" },
  { root: "dj", exactName: "DJ", paramType: "category" },
  { root: "ведущ", exactName: "Ведущие", paramType: "category" },
  { root: "тамад", exactName: "Ведущие", paramType: "category" },
  { root: "дизайнер", exactName: "Дизайнер", paramType: "category" },
  { root: "артист", exactName: "Артисты", paramType: "category" },
  { root: "музыкант", exactName: "Артисты", paramType: "category" },
  { root: "повар", exactName: "Повар", paramType: "category" },
  { root: "кейтеринг", exactName: "Повар", paramType: "category" },
  { root: "аниматор", exactName: "Аниматор", paramType: "category" },
  { root: "ресторан", exactName: "Ресторан", paramType: "category" },
  { root: "площадк", exactName: "Ресторан", paramType: "category" },
  { root: "агентств", exactName: "agency", paramType: "accountType" },
];

const TOP_CITIES = [
  { root: "москв", exactName: "Москва" },
  { root: "санкт-петербург", exactName: "Санкт-Петербург" },
  { root: "питер", exactName: "Санкт-Петербург" },
  { root: "спб", exactName: "Санкт-Петербург" },
  { root: "казан", exactName: "Казань" },
  { root: "сочи", exactName: "Сочи" },
  { root: "краснодар", exactName: "Краснодар" },
  { root: "екатеринбург", exactName: "Екатеринбург" },
  { root: "новосибирск", exactName: "Новосибирск" },
  { root: "ростов", exactName: "Ростов-на-Дону" },
  { root: "уф", exactName: "Уфа" },
];

const FALLBACK_CATEGORIES: SiteCategory[] = [
  {
    id: "1",
    name: "Фотограф",
    icon: "Camera",
    link: "/search?category=photographer",
    subCategories: [],
  },
  {
    id: "2",
    name: "DJ",
    icon: "Music",
    link: "/search?category=dj",
    subCategories: [],
  },
  {
    id: "3",
    name: "Ведущие",
    icon: "Mic",
    link: "/search?category=hosts",
    subCategories: [],
  },
  {
    id: "4",
    name: "Дизайнер",
    icon: "Palette",
    link: "/search?category=designer",
    subCategories: [],
  },
  {
    id: "5",
    name: "Видеограф",
    icon: "Film",
    link: "/search?category=videographer",
    subCategories: [],
  },
];

const PAGE_SIZE = 12;

const extractParamFromLink = (link: string | undefined, paramName: string) => {
  if (!link) return null;
  try {
    const urlString = link.startsWith("https")
      ? link
      : `http://dummy.com${link.startsWith("/") ? link : "/" + link}`;
    const url = new URL(urlString);
    return url.searchParams.get(paramName);
  } catch (e) {
    return null;
  }
};

export default function SearchPage() {
  const mounted = useMounted();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const { data: settings, isLoading: isLoadingCategories } =
    useGeneralSettingsQuery();
  const categories = settings?.siteCategories?.length
    ? settings.siteCategories
    : FALLBACK_CATEGORIES;

  // Filters State (Local Form State)
  const [cityInput, setCityInput] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedAccountType, setSelectedAccountType] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [onlyVip, setOnlyVip] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>(
    [],
  );

  // Results State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [searchResults, setSearchResults] = useState<PerformerProfile[]>([]);
  const [isSearching, setIsSearching] = useState(true); // Default to true until first load
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  // Autocomplete
  const [regions, setRegions] = useState<
    { name: string; cities: { name: string }[] }[]
  >([]);
  const [autocompleteResults, setAutocompleteResults] = useState<string[]>([]);

  const activeCategoryObj = categories.find((c) => c.name === selectedService);
  const availableSubCategories = activeCategoryObj?.subCategories || [];

  // --- 1. THE DATA FETCHER (Decoupled from URL updating) ---
  const fetchResults = useCallback(
    async (fetchArgs: any) => {
      setIsSearching(true);
      try {
        const result = await getPerformersPaginated({
          page: fetchArgs.page || 1,
          pageSize: PAGE_SIZE,
          category:
            fetchArgs.category === "_all_" ? undefined : fetchArgs.category,
          subCategories: fetchArgs.subCategories,
          city: fetchArgs.city,
          priceMin: fetchArgs.priceMin ? Number(fetchArgs.priceMin) : undefined,
          priceMax: fetchArgs.priceMax ? Number(fetchArgs.priceMax) : undefined,
          onlyVip: fetchArgs.onlyVip ? "true" : undefined,
          accountType:
            fetchArgs.accountType === "all" ? undefined : fetchArgs.accountType,
          query: fetchArgs.query,
        });

        setSearchResults(result.items);
        setTotalResults(result.total);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Ошибка",
          description: "Не удалось загрузить результаты поиска.",
        });
      } finally {
        setIsSearching(false);
      }
    },
    [toast],
  );

  // --- 2. THE MASTER EFFECT: URL Parsing, NLP, & Execution ---
  useEffect(() => {
    if (!mounted) return;

    // A. Read raw params from URL
    const paramQuery = searchParams.get("q");
    let resolvedCategoryName = searchParams.get("category");
    let resolvedCityName = searchParams.get("city");
    let resolvedAccountType = searchParams.get("accountType");
    const paramPage = Number(searchParams.get("page")) || 1;
    const paramMinPrice = searchParams.get("priceMin");
    const paramMaxPrice = searchParams.get("priceMax");
    const paramOnlyVip = searchParams.get("onlyVip");

    // B. NLP PARSING
    if (paramQuery) {
      let remainingQuery = paramQuery.toLowerCase();
      let queryWasModified = false;

      // Try to extract City
      if (!resolvedCityName) {
        for (const city of TOP_CITIES) {
          const cityRegex = new RegExp(
            `(?:^|\\s)(?:в\\s+|во\\s+)?${city.root}[а-яА-Яa-zA-Z\\-]*(?=\\s|[.,!?]|$)`,
            "i",
          );
          if (cityRegex.test(remainingQuery)) {
            resolvedCityName = city.exactName;
            remainingQuery = remainingQuery.replace(cityRegex, " ");
            queryWasModified = true;
            break;
          }
        }
      }

      // Try to extract Category
      if (!resolvedCategoryName) {
        for (const cat of CATEGORY_ALIASES) {
          const catRegex = new RegExp(
            `(?:^|\\s)${cat.root}[а-яА-Яa-zA-Z\\-]*(?=\\s|[.,!?]|$)`,
            "i",
          );
          if (catRegex.test(remainingQuery)) {
            if (cat.paramType === "category")
              resolvedCategoryName = cat.exactName;
            else if (cat.paramType === "accountType")
              resolvedAccountType = cat.exactName;
            remainingQuery = remainingQuery.replace(catRegex, " ");
            queryWasModified = true;
            break;
          }
        }
      }

      // If we modified the query via NLP, rewrite the URL to be clean and exit early
      if (queryWasModified) {
        remainingQuery = remainingQuery
          .replace(
            /(?:^|\s)(в|во|на|для|с|и|или|по|к|до|от|за|о)(?=\s|$)/gi,
            " ",
          )
          .replace(/\s+/g, " ")
          .trim();

        const newParams = new URLSearchParams(searchParams.toString());
        if (resolvedCategoryName)
          newParams.set("category", resolvedCategoryName);
        if (resolvedAccountType)
          newParams.set("accountType", resolvedAccountType);
        if (resolvedCityName) newParams.set("city", resolvedCityName);

        if (remainingQuery) newParams.set("q", remainingQuery);
        else newParams.delete("q");

        // 🚨 EXIT EARLY: By replacing the URL here, we trigger this useEffect again with the clean data
        // This prevents the double-fetch flicker!
        router.replace(`${pathname}?${newParams.toString()}`, {
          scroll: false,
        });
        return;
      }
    }

    // C. CATEGORY RESOLUTION
    if (resolvedCategoryName && resolvedCategoryName !== "_all_") {
      const matchedCat = categories.find((c) => {
        const linkCat = extractParamFromLink(c.link, "category");
        return (
          c.name.toLowerCase() === resolvedCategoryName!.toLowerCase() ||
          (linkCat &&
            linkCat.toLowerCase() === resolvedCategoryName!.toLowerCase())
        );
      });
      resolvedCategoryName = matchedCat
        ? matchedCat.name
        : resolvedCategoryName;
    }

    // D. SUBCATEGORY RESOLUTION
    let resolvedSubCats: string[] = [];
    const paramSubCats = searchParams.get("subCategories");
    if (paramSubCats && resolvedCategoryName) {
      const activeCat = categories.find((c) => c.name === resolvedCategoryName);
      if (activeCat && activeCat.subCategories) {
        const tokens = paramSubCats
          .split(",")
          .map((t) => t.trim().toLowerCase());
        resolvedSubCats = tokens.map((token) => {
          const matchedSub = activeCat.subCategories!.find((s) => {
            const linkSub =
              extractParamFromLink(s.link, "subCategories") ||
              extractParamFromLink(s.link, "category");
            return (
              s.name.toLowerCase() === token ||
              (linkSub && linkSub.toLowerCase() === token)
            );
          });
          return matchedSub ? matchedSub.name : token;
        });
        // Deduplicate
        resolvedSubCats = [...new Set(resolvedSubCats)];
      }
    }

    // E. SYNC LOCAL STATE (Ensure UI form matches URL)
    setCityInput(resolvedCityName || "");
    setSelectedService(resolvedCategoryName || null);
    setSelectedAccountType(resolvedAccountType || "all");
    setSelectedSubCategories(resolvedSubCats);
    setMinPrice(paramMinPrice || "");
    setMaxPrice(paramMaxPrice || "");
    setOnlyVip(paramOnlyVip === "true");
    setCurrentPage(paramPage);

    // F. EXECUTE FETCH ONCE
    fetchResults({
      page: paramPage,
      category: resolvedCategoryName,
      subCategories:
        resolvedSubCats.length > 0 ? resolvedSubCats.join(",") : undefined,
      city: resolvedCityName,
      priceMin: paramMinPrice,
      priceMax: paramMaxPrice,
      onlyVip: paramOnlyVip === "true",
      accountType: resolvedAccountType,
      query: paramQuery,
    });
  }, [searchParams, mounted, categories, fetchResults, pathname, router]);

  // Fetch Cities Initial Load
  useEffect(() => {
    getRussianRegionsWithCities().then(setRegions).catch(console.error);
  }, []);

  // --- 3. URL UPDATER (Pushes local form state to URL) ---
  const updateURLParams = useCallback(
    (pageToFetch: number) => {
      const params = new URLSearchParams();

      // Preserve the raw query string if it exists
      const query = searchParams.get("q");
      if (query) params.set("q", query);

      if (cityInput) params.set("city", cityInput);

      if (selectedService && selectedService !== "_all_") {
        const catObj = categories.find((c) => c.name === selectedService);
        const slug = catObj
          ? extractParamFromLink(catObj.link, "category")
          : null;
        params.set("category", slug || selectedService);
      }

      if (
        selectedSubCategories.length > 0 &&
        activeCategoryObj?.subCategories
      ) {
        const subSlugs = selectedSubCategories.map((subName) => {
          const subObj = activeCategoryObj.subCategories!.find(
            (s) => s.name === subName,
          );
          const slug = subObj
            ? extractParamFromLink(subObj.link, "subCategories") ||
              extractParamFromLink(subObj.link, "category")
            : null;
          return slug || subName;
        });
        params.set("subCategories", subSlugs.join(","));
      }

      if (minPrice) params.set("priceMin", minPrice);
      if (maxPrice) params.set("priceMax", maxPrice);
      if (selectedAccountType !== "all")
        params.set("accountType", selectedAccountType);
      if (onlyVip) params.set("onlyVip", "true");
      if (pageToFetch > 1) params.set("page", pageToFetch.toString());

      // 🚨 By replacing the URL here, we trigger the Master useEffect, which fetches the data safely
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
      categories,
      activeCategoryObj,
      searchParams,
    ],
  );

  // --- FORM HANDLERS ---
  const handleCategoryChange = (val: string) => {
    setSelectedService(val === "_all_" ? null : val);
    setSelectedSubCategories([]);
  };

  const toggleSubCategory = (subName: string) => {
    setSelectedSubCategories((prev) =>
      prev.includes(subName)
        ? prev.filter((name) => name !== subName)
        : [...prev, subName],
    );
  };

  const handleSearchClick = () => {
    updateURLParams(1);
  };

  const handlePageChange = (newPage: number) => {
    updateURLParams(newPage);
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

  const handleShare = async (performer: PerformerProfile) => {
    const profileUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/performer-profile?id=${performer.id}`
        : "";
    const shareData = {
      title: `Исполнитель ${performer.name} на Eventomir`,
      text: performer.description
        ? `${performer.description.substring(0, 100)}...`
        : `Забронируйте ${performer.name}!`,
      url: profileUrl,
    };

    try {
      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare(shareData)
      ) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(profileUrl);
        toast({
          title: "Ссылка скопирована",
          description: "Ссылка на профиль скопирована в буфер обмена.",
        });
      }
    } catch (error: any) {
      if (error.name !== "AbortError")
        console.error("Ошибка при попытке поделиться:", error);
    }
  };

  if (!mounted) {
    return (
      <div className="container mx-auto py-10 px-4 md:px-8">
        <Skeleton className="h-[500px] w-full rounded-3xl" />
      </div>
    );
  }

  const totalPages = Math.ceil(totalResults / PAGE_SIZE);

  return (
    <div className="container mx-auto py-10 px-4 md:px-8 animate-in fade-in duration-500">
      <div className="grid gap-6">
        {/* FILTERS SECTION */}
        <Card className="border-primary/10 shadow-sm rounded-3xl overflow-hidden">
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <Label>Категория услуги</Label>
                <Select
                  value={selectedService || "_all_"}
                  onValueChange={handleCategoryChange}
                  disabled={isLoadingCategories}
                >
                  <SelectTrigger className="bg-muted/30 font-semibold rounded-xl h-11">
                    <SelectValue
                      placeholder={
                        isLoadingCategories ? "Загрузка..." : "Все услуги"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value="_all_"
                      className="font-semibold text-primary"
                    >
                      Все услуги
                    </SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.name}>
                        {c.name}
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
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-muted/30 rounded-xl h-11",
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
                  <PopoverContent
                    className="w-auto p-0 rounded-2xl"
                    align="start"
                  >
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
                  <SelectTrigger className="bg-muted/30 rounded-xl h-11">
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
                  className="bg-muted/30 rounded-xl h-11"
                />
                {autocompleteResults.length > 0 && (
                  <div className="absolute z-50 mt-1 w-full rounded-2xl border bg-background shadow-xl max-h-60 overflow-y-auto py-2">
                    {autocompleteResults.map((res, i) => (
                      <div
                        key={i}
                        className="cursor-pointer px-4 py-2.5 text-sm hover:bg-muted font-medium transition-colors"
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

            {availableSubCategories.length > 0 && (
              <div className="pt-4 border-t border-dashed animate-in slide-in-from-top-4 fade-in duration-300">
                <Label className="mb-3 flex items-center gap-2 text-sm font-bold text-primary">
                  <Layers className="h-4 w-4" /> Уточните специализацию:
                </Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={
                      selectedSubCategories.length === 0 ? "default" : "outline"
                    }
                    size="sm"
                    className="rounded-full shadow-sm font-bold"
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
                          "rounded-full shadow-sm transition-all font-semibold",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-background hover:bg-muted",
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end pt-2">
              <div className="space-y-2">
                <Label>Бюджет (₽)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="от"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="bg-muted/30 rounded-xl h-11"
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    type="number"
                    placeholder="до"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="bg-muted/30 rounded-xl h-11"
                  />
                </div>
              </div>

              <div
                className="flex items-center space-x-2 border rounded-xl px-4 py-2 bg-yellow-500/5 border-yellow-500/20 h-11 cursor-pointer transition-colors hover:bg-yellow-500/10"
                onClick={() => setOnlyVip(!onlyVip)}
              >
                <Checkbox
                  id="vip-only"
                  checked={onlyVip}
                  onCheckedChange={(v) => setOnlyVip(!!v)}
                  className="border-yellow-500/50 data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500"
                />
                <Label
                  htmlFor="vip-only"
                  className="text-sm font-bold text-yellow-700 flex items-center gap-1.5 cursor-pointer w-full"
                >
                  <Crown className="h-4 w-4" /> Только VIP / Звезды
                </Label>
              </div>

              <div className="lg:col-span-2 flex gap-2">
                <Button
                  variant="destructive"
                  className="flex-grow font-bold shadow-lg shadow-destructive/20 h-11 rounded-xl text-base"
                  onClick={handleSearchClick}
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <Search className="mr-2 h-5 w-5 animate-bounce" />
                  ) : (
                    <Search className="mr-2 h-5 w-5" />
                  )}
                  Найти исполнителей
                </Button>
                <div className="flex gap-1 bg-muted/20 p-1 rounded-xl border">
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("list")}
                    title="Список"
                    className="h-9 w-9 rounded-lg"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "map" ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("map")}
                    title="Карта"
                    className="h-9 w-9 rounded-lg"
                  >
                    <MapIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RESULTS SECTION */}
        <div className="mt-4 space-y-6">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-2xl font-black tracking-tight">
              Найдено: {totalResults}
            </h2>
            <div className="text-sm text-muted-foreground font-semibold bg-white px-3 py-1 rounded-full border shadow-sm">
              Показано {searchResults.length} на странице
            </div>
          </div>

          {isSearching ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Skeleton key={i} className="h-[420px] w-full rounded-3xl" />
              ))}
            </div>
          ) : searchResults.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {searchResults.map((performer) => {
                  const socials = performer.socialLinks as
                    | Record<string, string>
                    | undefined;
                  const hasSocials = socials && Object.keys(socials).length > 0;
                  const isVerified =
                    performer.isVip ||
                    performer.moderationStatus === "APPROVED";

                  return (
                    <Card
                      key={performer.id}
                      className={cn(
                        "group relative flex flex-col rounded-[24px] overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 border border-border/50 bg-background hover:-translate-y-1",
                        performer.isVip &&
                          "ring-2 ring-yellow-400/60 border-yellow-400/20",
                      )}
                    >
                      <div className="h-32 w-full relative overflow-hidden bg-muted">
                        {performer.backgroundPicture ? (
                          <img
                            src={performer.backgroundPicture}
                            alt="Cover"
                            className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-background" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                        {performer.isVip && (
                          <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-white text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md">
                            <Crown className="w-3 h-3" /> PRO
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between items-end px-5 -mt-10 relative z-10 mb-2">
                        <Avatar className="w-20 h-20 border-4 border-background shadow-md bg-muted">
                          <AvatarImage
                            src={performer.profilePicture || ""}
                            className="object-cover"
                          />
                          <AvatarFallback className="text-2xl font-black text-primary bg-primary/10">
                            {performer.name.substring(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex gap-1 pb-1">
                          {hasSocials && (
                            <>
                              {socials.vk && (
                                <a
                                  href={socials.vk}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-6 h-6 rounded-full bg-[#0077FF]/10 text-[#0077FF] flex items-center justify-center hover:bg-[#0077FF]/20 transition-colors"
                                >
                                  <span className="font-bold text-[10px]">
                                    VK
                                  </span>
                                </a>
                              )}
                              {socials.telegram && (
                                <a
                                  href={socials.telegram}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-6 h-6 rounded-full bg-[#24A1DE]/10 text-[#24A1DE] flex items-center justify-center hover:bg-[#24A1DE]/20 transition-colors"
                                >
                                  <SendIcon className="w-3 h-3" />
                                </a>
                              )}
                              {socials.youtube && (
                                <a
                                  href={socials.youtube}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-6 h-6 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                                >
                                  <Youtube className="w-4 h-4" />
                                </a>
                              )}
                              {socials.website && (
                                <a
                                  href={socials.website}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-6 h-6 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-gray-500/20 transition-colors"
                                >
                                  <Globe className="w-4 h-4" />
                                </a>
                              )}
                            </>
                          )}
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-6 w-6 rounded-full shadow-sm bg-background hover:bg-muted text-muted-foreground transition-colors"
                            onClick={(e) => {
                              e.preventDefault();
                              handleShare(performer);
                            }}
                            title="Поделиться"
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                          <CompareButton performerId={performer.id} />
                        </div>
                      </div>

                      <CardContent className="px-5 pt-2 pb-5 flex-grow flex flex-col">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Link
                            href={`/performer-profile?id=${performer.id}`}
                            className="text-lg font-bold truncate hover:text-primary transition-colors leading-tight"
                            title={performer.name}
                          >
                            {performer.name}
                          </Link>
                          {isVerified && (
                            <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground mb-4 font-medium">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />{" "}
                            {performer.city || "Город не указан"}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {performer.roles.slice(0, 3).map((r) => (
                            <Badge
                              key={r}
                              variant="secondary"
                              className="text-[10px] bg-primary/10 text-primary border-transparent font-bold px-2 py-0.5 rounded-md"
                            >
                              {r}
                            </Badge>
                          ))}
                          {performer.roles.length > 3 && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] bg-muted text-muted-foreground border-transparent font-bold px-2 py-0.5 rounded-md"
                            >
                              +{performer.roles.length - 3}
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed mb-4">
                          {performer.description ||
                            "Информация о себе пока не заполнена."}
                        </p>

                        {performer.parentAgencyName && (
                          <div className="mt-auto pt-2">
                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase tracking-tight bg-muted/40 w-fit px-2.5 py-1 rounded-lg border">
                              <Briefcase className="h-3 w-3" /> от{" "}
                              {performer.parentAgencyName}
                            </div>
                          </div>
                        )}
                      </CardContent>

                      <div className="px-5 py-4 border-t bg-muted/10 flex items-center justify-between mt-auto">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">
                            Стоимость
                          </span>
                          <span className="text-base font-black text-foreground">
                            {performer.priceRange && performer.priceRange[0] > 0
                              ? `от ${performer.priceRange[0].toLocaleString("ru-RU")} ₽`
                              : "По запросу"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button
                            asChild
                            variant={
                              performer.isVip ? "destructive" : "default"
                            }
                            size="sm"
                            className="font-bold rounded-xl px-5 shadow-sm hover:shadow-md transition-shadow"
                          >
                            <Link
                              href={`/performer-profile?id=${performer.id}`}
                            >
                              Перейти
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-14 bg-white border rounded-full w-fit mx-auto p-2 shadow-sm">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-muted transition-colors"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <div className="text-sm font-bold px-4 text-muted-foreground">
                    Страница {currentPage} из {totalPages}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-muted transition-colors"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-24 bg-white rounded-3xl border border-dashed shadow-sm">
              <Search className="h-16 w-16 mx-auto text-muted-foreground opacity-20 mb-4" />
              <h3 className="text-2xl font-bold mb-2">Ничего не найдено</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Попробуйте изменить параметры поиска или выбрать другой город.
              </p>
              <Button
                variant="outline"
                className="mt-6 rounded-xl font-bold"
                onClick={() => {
                  setSelectedService(null);
                  setSelectedSubCategories([]);
                  setCityInput("");
                  setMinPrice("");
                  setMaxPrice("");
                  setOnlyVip(false);
                  router.replace(pathname, { scroll: false }); // Drop URL params
                  fetchResults({ page: 1 }); // Fetch bare minimum
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
}
