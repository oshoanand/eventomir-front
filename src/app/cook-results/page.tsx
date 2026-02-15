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
import { useSearchParams, useRouter } from 'next/navigation';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { ru } from 'date-fns/locale'; // Import Russian locale // Импорт русской локали

// Cook cuisine options
// Варианты кухонь для поваров
const cookCuisines = [
  "Русская", // Russian
  "Европейская", // European
  "Азиатская", // Asian
  "Итальянская", // Italian
  "Кавказская", // Caucasian
  "Другая", // Other
];

// Cook budget options
// Варианты бюджета для поваров
const cookBudgets = [
  "Эконом", // Economy
  "Средний", // Medium
  "Выше среднего", // Above Average
  "Премиум", // Premium
];

// Cook event style options
// Варианты стиля мероприятия для поваров
const cookEventStyles = [
  "Свадьба", // Wedding
  "Корпоратив", // Corporate Event
  "День рождения", // Birthday
  "Юбилей", // Anniversary
  "Детский праздник", // Children's Party
  "Другое", // Other
];

// Cook specialization options
// Варианты специализации для поваров
const cookSpecializations = [
    "Шеф-повар", // Chef
    "Повар-кондитер", // Pastry Chef
    "Повар-сушист", // Sushi Chef
    "Повар-пиццайоло", // Pizzaiolo
    "Повар-универсал" // All-around Cook
];

// Cook skill level options
// Варианты уровня мастерства для поваров
const cookSkillLevels = [
    "Новичок", // Novice
    "Любитель", // Amateur
    "Профессионал", // Professional
    "Эксперт" // Expert
];

// Cook service format options
// Варианты формата услуг для поваров
const cookServiceFormats = [
    "Выезд на дом", // Home Visit
    "Работа в ресторане", // Restaurant Work
    "Кейтеринг", // Catering
    "Онлайн-консультации" // Online Consultations
];

const CookResultsPage: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Initialize state from URL parameters
  // Инициализация состояния из параметров URL
  const cityParam = searchParams.get('city') || "";
  const cuisineParam = searchParams.get('cuisine') || "";
  const budgetParam = searchParams.get('budget') || "";
  const eventStylesParam = searchParams.get('eventStyles') || ""; // Changed from eventStyle // Изменено с eventStyle
  const specializationParam = searchParams.get('specialization') || "";
  const skillLevelParam = searchParams.get('skillLevel') || "";
  const serviceFormatParam = searchParams.get('serviceFormat') || "";
  const dateParam = searchParams.get('date');


  const [city, setCity] = useState(cityParam);
  const [selectedCuisine, setSelectedCuisine] = useState(cuisineParam);
  const [selectedBudget, setSelectedBudget] = useState(budgetParam);
  const [selectedEventStyles, setSelectedEventStyles = useState<string[]>(eventStylesParam ? eventStylesParam.split(',') : []); // Changed from selectedEventStyle // Изменено с selectedEventStyle
  const [selectedSpecialization, setSelectedSpecialization = useState(specializationParam);
  const [selectedSkillLevel, setSelectedSkillLevel = useState(skillLevelParam);
  const [selectedServiceFormat, setSelectedServiceFormat = useState(serviceFormatParam);
   const [selectedDate, setSelectedDate = useState<Date | undefined>(
        dateParam ? new Date(dateParam) : undefined
    );

  const { toast } = useToast();
  const [regions, setRegions = useState<{
    name: string;
    cities: { name: string }[];
  }[]>([]);
  const [cityInput, setCityInput = useState(city); // State for city input // Состояние для ввода города
  const [autocompleteResults, setAutocompleteResults = useState<string[]>([]);


  useEffect(() => {
    // Function to fetch regions and cities
    // Функция для получения регионов и городов
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

  // Handler for city input change and autocomplete
  // Обработчик изменения ввода города и автозаполнения
  const handleCityInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setCityInput(input); // Update input field value // Обновляем значение поля ввода

    if (input.length >= 2) { // Start suggesting after 2 characters // Начинаем предлагать после 2 символов
        // Simple filtering logic
        // Простая логика фильтрации
        const results = regions.flatMap(region =>
            region.cities.map(city => city.name).filter(cityName =>
                cityName.toLowerCase().startsWith(input.toLowerCase())
            )
        );
         // Remove duplicates and limit results
         // Убираем дубликаты и ограничиваем
        setAutocompleteResults([...new Set(results)].slice(0, 10));
    } else {
        setAutocompleteResults([]);
    }
}, [regions]); // Dependency: regions // Зависимость: regions

   // Handler for event style checkboxes
   // Обработчик чекбоксов стиля мероприятия
    const handleEventStyleChange = (style: string) => {
        setSelectedEventStyles((prev) =>
            prev.includes(style)
                ? prev.filter((item) => item !== style)
                : [...prev, style]
        );
    };

    // Handler for search action
    // Обработчик действия поиска
    const handleSearch = () => {
        // Navigate to a cook search results page (or potentially the same page with updated params)
        // Переходим на страницу результатов поиска поваров (или, возможно, на ту же страницу с обновленными параметрами)
        const queryParams = new URLSearchParams();
        if (city) queryParams.append('city', city);
        if (selectedCuisine) queryParams.append('cuisine', selectedCuisine);
        if (selectedBudget) queryParams.append('budget', selectedBudget);
        if (selectedEventStyles.length > 0) queryParams.append('eventStyles', selectedEventStyles.join(',')); // Changed from eventStyle // Изменено с eventStyle
        if (selectedSpecialization) queryParams.append('specialization', selectedSpecialization);
        if (selectedSkillLevel) queryParams.append('skillLevel', selectedSkillLevel);
        if (selectedServiceFormat) queryParams.append('serviceFormat', selectedServiceFormat);
        if (selectedDate) queryParams.append('date', selectedDate.toISOString().split('T')[0]); // Format date as YYYY-MM-DD // Форматируем дату как YYYY-MM-DD

         console.log("Searching cooks with params:", queryParams.toString());
          toast({ title: "Поиск поваров", description: `Идет поиск по параметрам: ${queryParams.toString()}` }); // Cook search // Searching by parameters:
        // Example: Update URL or navigate to a results display component
        // Пример: Обновить URL или перейти к компоненту отображения результатов
        // router.push(`/cook-search-results?${queryParams.toString()}`);
        // For now, just log the search action
        // Пока просто логируем действие поиска
    };

  return (
    div className="container mx-auto py-10">
      Card>
        CardHeader>
          CardTitle>ПовараCardTitle> {/* Cooks */}
          CardDescription>
            Выберите повара по вашим предпочтениям. {/* Choose a cook based on your preferences. */}
          CardDescription>
        CardHeader>
        CardContent className="grid gap-6">
          div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Specialization Filter */}
              {/* Фильтр по специализации */}
              div>
                  Label htmlFor="cookSpecialization">СпециализацияLabel> {/* Specialization */}
                  Select value={selectedSpecialization || ""} onValueChange={setSelectedSpecialization}>
                      SelectTrigger>
                          SelectValue placeholder="Выберите специализацию" /> {/* Select specialization */}
                      SelectTrigger>
                      SelectContent>
                          {cookSpecializations.map((specialization) => (
                              SelectItem key={specialization} value={specialization}>
                                  {specialization}
                              SelectItem>
                          ))}
                      SelectContent>
                  Select>
              div>

              {/* Skill Level Filter */}
              {/* Фильтр по уровню мастерства */}
              div>
                  Label htmlFor="cookSkillLevel">Уровень мастерстваLabel> {/* Skill Level */}
                  Select value={selectedSkillLevel || ""} onValueChange={setSelectedSkillLevel}>
                      SelectTrigger>
                          SelectValue placeholder="Выберите уровень" /> {/* Select level */}
                      SelectTrigger>
                      SelectContent>
                          {cookSkillLevels.map((level) => (
                              SelectItem key={level} value={level}>
                                  {level}
                              SelectItem>
                          ))}
                      SelectContent>
                  Select>
              div>

              {/* Service Format Filter */}
              {/* Фильтр по формату услуг */}
              div>
                  Label htmlFor="cookServiceFormat">Формат услугLabel> {/* Service Format */}
                  Select value={selectedServiceFormat || ""} onValueChange={setSelectedServiceFormat}>
                      SelectTrigger>
                          SelectValue placeholder="Выберите формат" /> {/* Select format */}
                      SelectTrigger>
                      SelectContent>
                          {cookServiceFormats.map((format) => (
                              SelectItem key={format} value={format}>
                                  {format}
                              SelectItem>
                          ))}
                      SelectContent>
                  Select>
              div>

            {/* Cuisine Filter */}
            {/* Фильтр по кухне */}
            div>
              Label htmlFor="cookCuisine">КухняLabel> {/* Cuisine */}
              Select value={selectedCuisine} onValueChange={setSelectedCuisine}>
                SelectTrigger>
                  SelectValue placeholder="Выберите кухню" /> {/* Select cuisine */}
                SelectTrigger>
                SelectContent>
                  {cookCuisines.map((cuisine) => (
                    SelectItem key={cuisine} value={cuisine}>
                      {cuisine}
                    SelectItem>
                  ))}
                SelectContent>
              Select>
            div>

            {/* Budget Filter */}
            {/* Фильтр по бюджету */}
            div>
              Label htmlFor="cookBudget">БюджетLabel> {/* Budget */}
              Select value={selectedBudget} onValueChange={setSelectedBudget}>
                SelectTrigger>
                  SelectValue placeholder="Выберите бюджет" /> {/* Select budget */}
                SelectTrigger>
                SelectContent>
                  {cookBudgets.map((budget) => (
                    SelectItem key={budget} value={budget}>
                      {budget}
                    SelectItem>
                  ))}
                SelectContent>
              Select>
            div>

              {/* City Input with Autocomplete */}
              {/* Поле ввода города с автозаполнением */}
              div className="relative">
                  Label htmlFor="location">ГородLabel> {/* City */}
                  Input
                      type="text"
                      id="location"
                      value={cityInput}
                      onChange={handleCityInputChange}
                      placeholder="Введите город" // Enter city
                       aria-autocomplete="list"
                      aria-controls="cook-city-autocomplete-list"
                  />
                  {autocompleteResults.length > 0 && (
                      div id="cook-city-autocomplete-list" className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-lg max-h-60 overflow-y-auto">
                          {autocompleteResults.map((result, index) => ( // Add index // Добавляем index
                              div
                                  key={`${result}-${index}`} // Use combination of name and index // Используем комбинацию имени и индекса
                                  className="cursor-pointer px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                                  onClick={() => {
                                      setCity(result); // Update the actual city state // Обновляем актуальное состояние города
                                      setCityInput(result); // Update the input field value // Обновляем значение в поле ввода
                                      setAutocompleteResults([]); // Close autocomplete // Закрываем автозаполнение
                                  }}
                                   role="option"
                                  aria-selected={city === result} // Check against actual city state // Проверяем по актуальному состоянию города
                              >
                                  {result}
                              div>
                          ))}
                      div>
                  )}
              div>

            {/* Event Style Checkboxes */}
            {/* Чекбоксы стиля мероприятия */}
            div className="md:col-span-2">
                Label className="block text-sm font-medium leading-none pb-2">Стиль мероприятияLabel> {/* Event Style */}
                div className="border rounded-md p-4">
                    div className="flex flex-wrap gap-4"> {/* Increased gap */} {/* Увеличил gap */}
                        {cookEventStyles.map((style) => (
                            div key={style} className="flex items-center space-x-2">
                                Checkbox
                                    id={`cook-eventStyle-${style}`}
                                    checked={selectedEventStyles.includes(style)}
                                    onCheckedChange={() => handleEventStyleChange(style)}
                                />
                                Label
                                    htmlFor={`cook-eventStyle-${style}`}
                                    className="text-sm font-medium leading-none cursor-pointer"
                                >
                                    {style}
                                Label>
                            div>
                        ))}
                    div>
                div>
            div>
               {/* Date Picker */}
               {/* Выбор даты */}
               div>
                 Label>Выберите дату (необязательно)Label> {/* Select date (optional) */}
                  Popover>
                      PopoverTrigger asChild>
                          Button
                              variant={"outline"}
                              className={cn(
                                  "w-full md:w-[300px] justify-start text-left font-normal mt-2", // Add mt-2 for spacing // Добавляем mt-2 для отступа
                                  !selectedDate && "text-muted-foreground"
                              )}
                          >
                              CalendarIcon className="mr-2 h-4 w-4" />
                              {selectedDate ? format(selectedDate, "PPP", { locale: ru }) : span>Любая датаspan>} {/* Any date */}
                          Button>
                      PopoverTrigger>
                      PopoverContent className="w-auto p-0" align="start">
                          Calendar
                              locale={ru} // Set Russian locale // Устанавливаем русскую локаль
                              mode="single"
                              selected={selectedDate}
                              onSelect={setSelectedDate}
                              disabled={(date) =>
                                  date < new Date(new Date().setHours(0,0,0,0)) // Disable past dates // Отключаем прошлые даты
                              }
                              initialFocus
                          />
                      PopoverContent>
                  Popover>
              div>
          div>

          {/* Search Button */}
          {/* Кнопка поиска */}
          Button onClick={handleSearch} variant="destructive">Найти поваровButton> {/* Find Cooks */}

          {/* Placeholder for Cook Search Results */}
          {/* Placeholder для результатов поиска поваров */}
           div className="mt-6">
               h3 className="text-xl font-semibold mb-4">Результаты поискаh3> {/* Search Results */}
                {/* TODO: Display actual search results here */}
                {/* TODO: Отобразить здесь реальные результаты поиска */}
               p className="text-muted-foreground">Здесь будут отображаться найденные повара...p> {/* Found cooks will be displayed here... */}
           div>
        CardContent>
      Card>
    div>
  );
};

export default CookResultsPage;
