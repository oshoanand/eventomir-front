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
import { getRussianRegionsWithCities } from "@/services/geo";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams, useRouter } from 'next/navigation';

// Added "Stand-up Comedians" category
// Добавлена категория "Стендап комики"
const artistGenres = [
  "Музыканты", // Musicians
  "Ведущие", // Hosts
  "Танцоры", // Dancers
  "Оригинальный жанр", // Original Genre (magicians, acrobats, shows, etc.) // (фокусники, акробаты, шоу и т.д.)
  "Стендап комики", // Stand-up Comedians
];

const artistLevels = [
    "Начинающие", // Beginners
    "Профессионалы", // Professionals
    "Топовые", // Top-tier
];

const artistFormats = [
    "Классика", // Classic
    "Интерактив", // Interactive
    "Шоу-программы", // Show Programs
];

const artistBudgets = [
  "Эконом", // Economy
  "Средний", // Medium
  "Премиум", // Premium
];

const artistEventTypes = [
    "Свадьбы", // Weddings
    "Корпоративы", // Corporate Events
    "Детские праздники", // Children's Parties
    "Юбилеи/Дни рождения", // Anniversaries/Birthdays
    "Городские праздники", // City Festivals
    "Другое", // Other
];

const artistLocations = [
    "Город", // City
    "Загород", // Countryside
    "Другие регионы", // Other Regions
];

const ArtistsPage: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Filter states, initialized from URL
  // Состояния фильтров, инициализированные из URL
  const genreParam = searchParams.get('genre') || "";
  const levelParam = searchParams.get('level') || "";
  const formatParam = searchParams.get('format') || "";
  const budgetParam = searchParams.get('budget') || "";
  const eventTypesParam = searchParams.get('eventTypes') || "";
  const locationTypeParam = searchParams.get('locationType') || "";
  const cityParam = searchParams.get('city') || "";

  const [selectedGenre, setSelectedGenre] = useState(genreParam);
  const [selectedLevel, setSelectedLevel] = useState(levelParam);
  const [selectedFormat, setSelectedFormat] = useState(formatParam);
  const [selectedBudget, setSelectedBudget] = useState(budgetParam);
  const [selectedEventTypes, setSelectedEventTypes = useState<string[]>(eventTypesParam ? eventTypesParam.split(',') : []);
  const [selectedLocationType, setSelectedLocationType = useState(locationTypeParam);
  const [city, setCity] = useState(cityParam);

  const { toast } = useToast();
  const [regions, setRegions = useState<{ name: string; cities: { name: string }[]; }[]>([]);
  const [cityInput, setCityInput = useState(city);
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
  }, [toast]);

  // Handler for city input change and autocomplete
  // Обработчик изменения ввода города и автозаполнения
  const handleCityInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setCityInput(input);
    if (input.length >= 2) {
      // Simple filtering logic (can be improved with fuzzy search)
      // Простая логика фильтрации (можно улучшить нечетким поиском)
      const results = regions.flatMap(region =>
        region.cities.map(city => city.name).filter(cityName =>
          cityName.toLowerCase().startsWith(input.toLowerCase())
        )
      );
      // Remove duplicates and limit results
      // Убираем дубликаты и ограничиваем результаты
      setAutocompleteResults([...new Set(results)].slice(0, 10));
    } else {
      setAutocompleteResults([]);
    }
  }, [regions]);

  // Handler for event type checkbox changes
  // Обработчик изменения чекбоксов типа мероприятия
  const handleEventTypeChange = (eventType: string) => {
    setSelectedEventTypes((prev) =>
      prev.includes(eventType)
        ? prev.filter((item) => item !== eventType)
        : [...prev, eventType]
    );
  };

    // Handler for search action
    // Обработчик действия поиска
    const handleSearch = () => {
        const queryParams = new URLSearchParams();
        if (selectedGenre) queryParams.append('genre', selectedGenre);
        if (selectedLevel) queryParams.append('level', selectedLevel);
        if (selectedFormat) queryParams.append('format', selectedFormat);
        if (selectedBudget) queryParams.append('budget', selectedBudget);
        if (selectedEventTypes.length > 0) queryParams.append('eventTypes', selectedEventTypes.join(','));
        if (selectedLocationType) queryParams.append('locationType', selectedLocationType); // Add artist location type // Добавляем тип локации артиста
        if (city) queryParams.append('city', city); // City where customer is searching // Город, в котором ищет заказчик

        // Navigate to the general search page with artist-specific parameters
        // Переходим на общую страницу поиска с параметрами для артистов
        router.push(`/search?category=Артисты&${queryParams.toString()}`); // Artists

        console.log("Searching artists with params:", queryParams.toString());
        toast({ title: "Поиск артистов", description: `Идет поиск по параметрам: ${queryParams.toString()}` }); // Artist search // Searching by parameters:
         // TODO: Results will be displayed on the /search page
         // TODO: Отображение результатов будет происходить на странице /search
    };

  return (
    div className="container mx-auto py-10">
      Card>
        CardHeader>
          CardTitle>АртистыCardTitle> {/* Artists */}
          CardDescription>
            Найдите артистов для вашего мероприятия. {/* Find artists for your event. */}
          CardDescription>
        CardHeader>
        CardContent className="grid gap-6">
          {/* Main Filters */} {/* Основные фильтры */}
          div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Genre/Specialization */} {/* Жанр и специализация */}
            div>
              Label htmlFor="artistGenre">Жанр / СпециализацияLabel> {/* Genre / Specialization */}
              Select value={selectedGenre} onValueChange={setSelectedGenre}>
                SelectTrigger>
                  SelectValue placeholder="Выберите жанр" /> {/* Select genre */}
                SelectTrigger>
                SelectContent>
                  {artistGenres.map((genre) => (
                    SelectItem key={genre} value={genre}>
                      {genre}
                    SelectItem>
                  ))}
                SelectContent>
              Select>
            div>

            {/* Skill Level */} {/* Уровень мастерства */}
            div>
              Label htmlFor="artistLevel">Уровень мастерстваLabel> {/* Skill Level */}
              Select value={selectedLevel} onValueChange={setSelectedLevel}>
                SelectTrigger>
                  SelectValue placeholder="Выберите уровень" /> {/* Select level */}
                SelectTrigger>
                SelectContent>
                  {artistLevels.map((level) => (
                    SelectItem key={level} value={level}>
                      {level}
                    SelectItem>
                  ))}
                SelectContent>
              Select>
            div>

            {/* Performance Format */} {/* Формат выступлений */}
            div>
              Label htmlFor="artistFormat">Формат выступленийLabel> {/* Performance Format */}
              Select value={selectedFormat} onValueChange={setSelectedFormat}>
                SelectTrigger>
                  SelectValue placeholder="Выберите формат" /> {/* Select format */}
                SelectTrigger>
                SelectContent>
                  {artistFormats.map((format) => (
                    SelectItem key={format} value={format}>
                      {format}
                    SelectItem>
                  ))}
                SelectContent>
              Select>
            div>
          div>

          {/* Additional Filters */} {/* Дополнительные фильтры */}
          div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Budget */} {/* Бюджет */}
            div>
              Label htmlFor="artistBudget">БюджетLabel> {/* Budget */}
              Select value={selectedBudget} onValueChange={setSelectedBudget}>
                SelectTrigger>
                  SelectValue placeholder="Выберите бюджет" /> {/* Select budget */}
                SelectTrigger>
                SelectContent>
                  {artistBudgets.map((budget) => (
                    SelectItem key={budget} value={budget}>
                      {budget}
                    SelectItem>
                  ))}
                SelectContent>
              Select>
            div>

            {/* Location (type) */} {/* Локация (тип) */}
            div>
              Label htmlFor="artistLocationType">Локация артистаLabel> {/* Artist Location */}
              Select value={selectedLocationType} onValueChange={setSelectedLocationType}>
                SelectTrigger>
                  SelectValue placeholder="Любая локация артиста" /> {/* Any artist location */}
                SelectTrigger>
                SelectContent>
                  {artistLocations.map((location) => (
                    SelectItem key={location} value={location}>
                      {location}
                    SelectItem>
                  ))}
                SelectContent>
              Select>
              p className="text-xs text-muted-foreground mt-1">Укажите, где базируется артист, чтобы уточнить поиск.p> {/* Specify where the artist is based to refine the search. */}
            div>

            {/* Location (city) */} {/* Локация (город) */}
            div className="relative">
              Label htmlFor="artistCity">Город мероприятияLabel> {/* Event City */}
              Input
                type="text"
                id="artistCity"
                value={cityInput}
                onChange={handleCityInputChange}
                placeholder="Введите город мероприятия" // Enter event city
                aria-autocomplete="list"
                aria-controls="artist-city-autocomplete-list"
              />
              {autocompleteResults.length > 0 && (
                div id="artist-city-autocomplete-list" className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-lg max-h-60 overflow-y-auto">
                  {autocompleteResults.map((result, index) => (
                    div
                      key={`${result}-${index}-${Math.random()}`} // Add Math.random for uniqueness // Добавляем Math.random для уникальности
                      className="cursor-pointer px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                      onClick={() => {
                        setCity(result);
                        setCityInput(result);
                        setAutocompleteResults([]);
                      }}
                      role="option"
                      aria-selected={cityInput === result}
                    >
                      {result}
                    div>
                  ))}
                div>
              )}
            div>
          div>

           {/* Event Type */} {/* Тип мероприятия */}
           div className="md:col-span-3"> {/* Spans full width on medium screens */} {/* Занимает всю ширину на средних экранах */}
              Label className="block text-sm font-medium leading-none pb-2">
                Тип мероприятия {/* Event Type */}
              Label>
              div className="border rounded-md p-4">
                div className="flex flex-wrap gap-x-6 gap-y-3"> {/* Increased gap */} {/* Увеличен gap */}
                  {artistEventTypes.map((eventType) => (
                    div key={eventType} className="flex items-center space-x-2">
                      Checkbox
                        id={`artist-eventType-${eventType}`}
                        checked={selectedEventTypes.includes(eventType)}
                        onCheckedChange={() => handleEventTypeChange(eventType)}
                      />
                      Label
                        htmlFor={`artist-eventType-${eventType}`}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {eventType}
                      Label>
                    div>
                  ))}
                div>
              div>
            div>

          Button variant="destructive" onClick={handleSearch}>Найти артистовButton> {/* Find Artists */}

          {/* Placeholder for artist search results */} {/* Placeholder для результатов поиска артистов */}
          div className="mt-6">
            h3 className="text-xl font-semibold mb-4">Результаты поискаh3> {/* Search Results */}
            p className="text-muted-foreground">Результаты будут отображены на странице поиска...p> {/* Results will be displayed on the search page... */}
            {/* Optionally add a button to navigate to the search results page */} {/* Можно добавить кнопку для перехода на страницу поиска */}
             Button variant="outline" onClick={handleSearch} className="mt-2">Перейти к результатамButton> {/* Go to results */}
          div>
        CardContent>
      Card>
    div>
  );
};

export default ArtistsPage;
