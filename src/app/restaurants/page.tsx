"use client";

import { useState, useCallback, useEffect } from "react";
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
  SelectGroup, // Import SelectGroup // Импортируем SelectGroup
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/utils/utils";
import { getRussianRegionsWithCities } from "@/services/geo";
import { useToast } from "@/hooks/use-toast";

// Restaurant cuisine options // Варианты кухонь ресторанов
const restaurantCuisines = [
  "Русская", // Russian
  "Европейская", // European
  "Азиатская", // Asian
  "Итальянская", // Italian
  "Кавказская", // Caucasian
  "Другая", // Other
];

// Restaurant capacity options // Варианты вместимости ресторанов
const restaurantCapacities = [
  "До 50 человек", // Up to 50 people
  "50-100 человек", // 50-100 people
  "100-200 человек", // 100-200 people
  "Более 200 человек", // More than 200 people
];

// Restaurant services list // Список услуг ресторанов
const restaurantServicesList = [
  // Renamed to avoid conflict // Переименовано для избежания конфликта
  "Кейтеринг", // Catering
  "Декор", // Decor
  "Живая музыка", // Live Music
  "Wi-Fi",
  "Парковка", // Parking
];

// Restaurant budget options // Варианты бюджета ресторанов
const restaurantBudgets = [
  "Эконом", // Economy
  "Средний", // Medium
  "Выше среднего", // Above Average
  "Премиум", // Premium
];

// Restaurant event style options // Варианты стиля мероприятия для ресторанов
const restaurantEventStyles = [
  "Свадьба", // Wedding
  "Корпоратив", // Corporate Event
  "День рождения", // Birthday
  "Юбилей", // Anniversary
  "Детский праздник", // Children's Party
  "Другое", // Other
];

const RestaurantsPage = () => {
  // State for filters // Состояния фильтров
  const [selectedCuisine, setSelectedCuisine] = useState("");
  const [selectedCapacity, setSelectedCapacity] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedBudget, setSelectedBudget] = useState("");
  const [location, setLocation] = useState(""); // Selected location // Выбранная локация
  const [cityInput, setCityInput] = useState(""); // Input field value for city // Значение поля ввода для города
  const [autocompleteResults, setAutocompleteResults] = useState<string[]>([]); // Autocomplete results // Результаты автозаполнения
  const [regions, setRegions] = useState<
    {
      // List of regions and cities // Список регионов и городов
      name: string;
      cities: { name: string }[];
    }[]
  >([]);
  const [selectedEventStyles, setSelectedEventStyles] = useState<string[]>([]); // Changed from selectedEventStyle // Изменено с selectedEventStyle
  const { toast } = useToast(); // Hook for notifications // Хук для уведомлений

  // Handler for service checkbox changes // Обработчик изменения чекбоксов услуг
  const handleServiceChange = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service)
        ? prev.filter((item) => item !== service)
        : [...prev, service],
    );
  };

  // Handler for event style checkboxes // Обработчик чекбоксов стиля мероприятия
  const handleEventStyleChange = (style: string) => {
    setSelectedEventStyles((prev) =>
      prev.includes(style)
        ? prev.filter((item) => item !== style)
        : [...prev, style],
    );
  };

  // Fetch regions and cities on component mount // Получение регионов и городов при монтировании компонента
  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const regionsWithCities = await getRussianRegionsWithCities();
        setRegions(regionsWithCities);
      } catch (error) {
        console.error("Failed to fetch regions:", error);
        toast({
          variant: "destructive",
          title: "Ошибка", // Error
          description: "Не удалось загрузить список городов.", // Could not load the list of cities.
        });
      }
    };

    fetchRegions();
  }, [toast]); // Dependency: toast // Зависимость: toast

  // Handler for city input change and autocomplete // Обработчик изменения ввода города и автозаполнения
  const handleCityInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      setCityInput(input); // Update input field value // Обновляем значение поля ввода

      if (input.length > 1) {
        // Start searching after 2 characters // Начинаем поиск с 2 символов
        // Simple filtering, replace with Genkit flow for AI-powered suggestions if needed
        // Простая фильтрация, замените на Genkit flow для предложений на основе ИИ, если необходимо
        const results = regions.flatMap((region) =>
          region.cities
            .map((city) => city.name)
            .filter((cityName) =>
              cityName.toLowerCase().startsWith(input.toLowerCase()),
            ),
        );
        // Remove duplicates and limit results // Убираем дубликаты и ограничиваем
        setAutocompleteResults([...new Set(results)].slice(0, 10)); // Limit to 10 results // Ограничиваем до 10 результатов
      } else {
        setAutocompleteResults([]); // Clear results if input is short // Очищаем результаты, если ввод короткий
      }
    },
    [regions],
  ); // Dependency: regions // Зависимость: regions

  // Handler for search action // Обработчик действия поиска
  const handleSearch = () => {
    // TODO: Implement search logic using selected filters
    // TODO: Реализовать логику поиска с использованием выбранных фильтров
    const searchParams = new URLSearchParams({
      cuisine: selectedCuisine,
      capacity: selectedCapacity,
      services: selectedServices.join(","),
      budget: selectedBudget,
      location: location, // Use the selected location state // Используем состояние выбранной локации
      eventStyles: selectedEventStyles.join(","), // Changed from eventStyle // Изменено с eventStyle
    });
    console.log("Searching restaurants with params:", searchParams.toString());
    toast({
      title: "Поиск ресторанов",
      description: `Идет поиск по параметрам: ${searchParams.toString()}`,
    }); // Restaurant search // Searching by parameters:
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Рестораны</CardTitle> {/* Restaurants */}
          <CardDescription>
            Выберите ресторан по вашим предпочтениям.{" "}
            {/* Choose a restaurant based on your preferences. */}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cuisine Filter */} {/* Фильтр по кухне */}
            <div>
              <Label htmlFor="cuisine">Тип кухни</Label> {/* Cuisine Type */}
              <Select
                value={selectedCuisine}
                onValueChange={setSelectedCuisine}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите тип кухни" />{" "}
                  {/* Select cuisine type */}
                </SelectTrigger>
                <SelectContent>
                  {restaurantCuisines.map((cuisine) => (
                    <SelectItem key={cuisine} value={cuisine}>
                      {cuisine}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Capacity Filter */} {/* Фильтр по вместимости */}
            <div>
              <Label htmlFor="capacity">Вместимость зала</Label>{" "}
              {/* Hall Capacity */}
              <Select
                value={selectedCapacity}
                onValueChange={setSelectedCapacity}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите вместимость" />{" "}
                  {/* Select capacity */}
                </SelectTrigger>
                <SelectContent>
                  {restaurantCapacities.map((capacity) => (
                    <SelectItem key={capacity} value={capacity}>
                      {capacity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Services Checkboxes */} {/* Чекбоксы услуг */}
            <div className="md:col-span-2">
              <Label className="block text-sm font-medium leading-none pb-2">
                Услуги {/* Services */}
              </Label>
              <div className="border rounded-md p-4">
                <div className="flex flex-wrap gap-4">
                  {" "}
                  {/* Increased gap */} {/* Увеличил gap */}
                  {restaurantServicesList.map((service) => (
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
            {/* Budget Filter */} {/* Фильтр по бюджету */}
            <div>
              <Label htmlFor="budget">Бюджет</Label> {/* Budget */}
              <Select value={selectedBudget} onValueChange={setSelectedBudget}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите бюджет" />{" "}
                  {/* Select budget */}
                </SelectTrigger>
                <SelectContent>
                  {restaurantBudgets.map((budget) => (
                    <SelectItem key={budget} value={budget}>
                      {budget}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* City Input with Autocomplete */}{" "}
            {/* Поле ввода города с автозаполнением */}
            <div className="relative">
              <Label htmlFor="location">Город</Label> {/* City */}
              <Input
                type="text"
                id="location"
                value={cityInput} // Use cityInput for the input field value // Используем cityInput для значения поля ввода
                onChange={handleCityInputChange}
                placeholder="Введите город" // Enter city
                aria-autocomplete="list"
                aria-controls="restaurant-city-autocomplete-list"
              />
              {/* Autocomplete results list */}{" "}
              {/* Список результатов автозаполнения */}
              {autocompleteResults.length > 0 && (
                <div
                  id="restaurant-city-autocomplete-list"
                  className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-lg max-h-60 overflow-y-auto"
                >
                  {autocompleteResults.map(
                    (
                      result,
                      index, // Add index // Добавляем index
                    ) => (
                      <div
                        key={`${result}-${index}-${Math.random()}`} // Use combination of name, index, and random for unique key // Используем комбинацию имени, индекса и случайного числа для уникального ключа
                        className="cursor-pointer px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                        onClick={() => {
                          setLocation(result); // Update the actual location state // Обновляем актуальное состояние локации
                          setCityInput(result); // Update the input field display // Обновляем отображение в поле ввода
                          setAutocompleteResults([]); // Close autocomplete // Закрываем автозаполнение
                        }}
                        role="option"
                        aria-selected={cityInput === result} // Compare with cityInput // Сравниваем с cityInput
                      >
                        {result}
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>
            {/* Event Style Checkboxes */} {/* Чекбоксы стиля мероприятия */}
            <div className="md:col-span-2">
              <Label className="block text-sm font-medium leading-none pb-2">
                Стиль мероприятия {/* Event Style */}
              </Label>
              <div className="border rounded-md p-4">
                <div className="flex flex-wrap gap-4">
                  {" "}
                  {/* Increased gap */} {/* Увеличил gap */}
                  {restaurantEventStyles.map((style) => (
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
          </div>
          {/* Search Button */} {/* Кнопка поиска */}
          <Button variant="destructive" onClick={handleSearch}>
            Найти рестораны
          </Button>{" "}
          {/* Find Restaurants */}
          {/* Placeholder for Restaurant Search Results */}{" "}
          {/* Placeholder для результатов поиска ресторанов */}
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-4">Результаты поиска</h3>{" "}
            {/* Search Results */}
            {/* TODO: Display actual search results here based on filters */}
            {/* TODO: Отобразить здесь реальные результаты поиска на основе фильтров */}
            <p className="text-muted-foreground">
              Здесь будут отображаться найденные рестораны...
            </p>{" "}
            {/* Found restaurants will be displayed here... */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RestaurantsPage;
