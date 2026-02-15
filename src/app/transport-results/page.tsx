"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/utils/utils";
import { getRussianRegionsWithCities } from "@/services/geo";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams, useRouter } from "next/navigation";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { ru } from "date-fns/locale"; // Import Russian locale

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

interface TransportResultsPageProps {
  // Define props if needed, e.g., for server-side fetching initial results
}

const TransportResultsPage: React.FC<TransportResultsPageProps> = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Initialize state from URL parameters
  const cityParam = searchParams.get("city") || "";
  const typeParam = searchParams.get("type") || "";
  const capacityParam = searchParams.get("capacity") || "";
  const servicesParam = searchParams.get("services") || "";
  const budgetParam = searchParams.get("budget") || "";
  const eventStylesParam = searchParams.get("eventStyles") || ""; // Changed from eventStyle
  const dateParam = searchParams.get("date");

  const [city, setCity] = useState(cityParam);
  const [selectedType, setSelectedType] = useState(typeParam);
  const [selectedCapacity, setSelectedCapacity] = useState(capacityParam);
  const [selectedServices, setSelectedServices] = useState<string[]>(
    servicesParam ? servicesParam.split(",") : [],
  );
  const [selectedBudget, setSelectedBudget] = useState(budgetParam);
  const [selectedEventStyles, setSelectedEventStyles] = useState<string[]>(
    eventStylesParam ? eventStylesParam.split(",") : [],
  ); // Changed from selectedEventStyle
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    dateParam ? new Date(dateParam) : undefined,
  );

  const { toast } = useToast();
  const [regions, setRegions] = useState<
    {
      name: string;
      cities: { name: string }[];
    }[]
  >([]);
  const [cityInput, setCityInput] = useState(city); // Separate state for the input field
  const [autocompleteResults, setAutocompleteResults] = useState<string[]>([]);

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

  const handleCityInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      setCityInput(input); // Update input field value

      if (input.length >= 2) {
        // Start suggesting after 2 characters
        const results = regions.flatMap((region) =>
          region.cities
            .map((city) => city.name)
            .filter((cityName) =>
              cityName.toLowerCase().startsWith(input.toLowerCase()),
            ),
        );
        // Убираем дубликаты и ограничиваем
        setAutocompleteResults([...new Set(results)].slice(0, 10));
      } else {
        setAutocompleteResults([]);
      }
    },
    [regions],
  );

  const handleServiceChange = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service)
        ? prev.filter((item) => item !== service)
        : [...prev, service],
    );
  };

  // Handler for event style checkboxes
  const handleEventStyleChange = (style: string) => {
    setSelectedEventStyles((prev) =>
      prev.includes(style)
        ? prev.filter((item) => item !== style)
        : [...prev, style],
    );
  };

  const handleSearch = () => {
    // Update URL with current filter values or navigate to a results display component
    const queryParams = new URLSearchParams();
    if (city) queryParams.append("city", city);
    if (selectedType) queryParams.append("type", selectedType);
    if (selectedCapacity) queryParams.append("capacity", selectedCapacity);
    if (selectedServices.length > 0)
      queryParams.append("services", selectedServices.join(","));
    if (selectedBudget) queryParams.append("budget", selectedBudget);
    if (selectedEventStyles.length > 0)
      queryParams.append("eventStyles", selectedEventStyles.join(",")); // Changed from eventStyle
    if (selectedDate)
      queryParams.append("date", selectedDate.toISOString().split("T")[0]); // Format date as YYYY-MM-DD

    // Example: Update the current URL with new search params
    // router.push(`/transport-results?${queryParams.toString()}`, { scroll: false }); // scroll: false prevents jumping to top
    console.log("Searching transport with params:", queryParams.toString());
    toast({
      title: "Поиск транспорта",
      description: `Идет поиск по параметрам: ${queryParams.toString()}`,
    });
    // TODO: Implement logic to fetch and display results based on filters
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Транспорт</CardTitle>
          <CardDescription>
            Выберите транспорт по вашим предпочтениям.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="transportType">Тип авто</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите тип авто" />
                </SelectTrigger>
                <SelectContent>
                  {transportTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="transportCapacity">Вместимость</Label>
              <Select
                value={selectedCapacity}
                onValueChange={setSelectedCapacity}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите вместимость" />
                </SelectTrigger>
                <SelectContent>
                  {transportCapacities.map((capacity) => (
                    <SelectItem key={capacity} value={capacity}>
                      {capacity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label className="block text-sm font-medium leading-none pb-2">
                Услуги
              </Label>
              <div className="border rounded-md p-4">
                <div className="flex flex-wrap gap-4">
                  {" "}
                  {/* Увеличил gap */}
                  {transportServices.map((service) => (
                    <div key={service} className="flex items-center space-x-2">
                      <Checkbox
                        id={`service-${service}`}
                        checked={selectedServices.includes(service)}
                        onCheckedChange={() => handleServiceChange(service)}
                      />
                      <Label
                        htmlFor={`service-${service}`}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {service}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="transportBudget">Бюджет</Label>
              <Select value={selectedBudget} onValueChange={setSelectedBudget}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите бюджет" />
                </SelectTrigger>
                <SelectContent>
                  {transportBudgets.map((budget) => (
                    <SelectItem key={budget} value={budget}>
                      {budget}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="relative">
              <Label htmlFor="location">Город</Label>
              <Input
                type="text"
                id="location"
                value={cityInput}
                onChange={handleCityInputChange}
                placeholder="Введите город"
                aria-autocomplete="list"
                aria-controls="transport-city-autocomplete-list"
              />
              {autocompleteResults.length > 0 && (
                <div
                  id="transport-city-autocomplete-list"
                  className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-lg max-h-60 overflow-y-auto"
                >
                  {autocompleteResults.map(
                    (
                      result,
                      index, // Добавляем index
                    ) => (
                      <div
                        key={`${result}-${index}`} // Используем комбинацию имени и индекса
                        className="cursor-pointer px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                        onClick={() => {
                          setCity(result); // Update the actual city state
                          setCityInput(result); // Update the input field display
                          setAutocompleteResults([]); // Close autocomplete
                        }}
                        role="option"
                        aria-selected={cityInput === result} // Сравниваем с cityInput
                      >
                        {result}
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <Label className="block text-sm font-medium leading-none pb-2">
                Тип мероприятия
              </Label>
              <div className="border rounded-md p-4">
                <div className="flex flex-wrap gap-4">
                  {" "}
                  {/* Увеличил gap */}
                  {transportEventStyles.map((style) => (
                    <div key={style} className="flex items-center space-x-2">
                      <Checkbox
                        id={`eventStyle-${style}`}
                        checked={selectedEventStyles.includes(style)}
                        onCheckedChange={() => handleEventStyleChange(style)}
                      />
                      <Label
                        htmlFor={`eventStyle-${style}`}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {style}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <Label>Выберите дату (необязательно)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full md:w-[300px] justify-start text-left font-normal mt-2",
                      !selectedDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(selectedDate, "PPP", { locale: ru })
                    ) : (
                      <span>Любая дата</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    locale={ru} // Set Russian locale
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={
                      (date) => date < new Date(new Date().setHours(0, 0, 0, 0)) // Disable past dates
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Button onClick={handleSearch} variant="destructive">
            Найти транспорт
          </Button>

          {/* Placeholder for Transport Search Results */}
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-4">Результаты поиска</h3>
            {/* TODO: Display actual search results here based on filters */}
            <p className="text-muted-foreground">
              Здесь будут отображаться найденные варианты транспорта...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransportResultsPage;
