"use client"; // Directive for client component // Директива для клиентского компонента

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import React, { useState } from "react";
// Importing icons from lucide-react // Импорт иконок из lucide-react
import {
  ChefHat,
  Music as MusicIcon,
  Palette,
  Camera as CameraIcon,
  Mic,
  Car,
  Users,
  Film,
  Flower2,
  Truck,
  Smile,
  Brush,
  Utensils,
  Asterisk,
  MicVocal,
} from "lucide-react"; // Added MicVocal // Добавлена MicVocal
import { useRouter } from "next/navigation";
// import { useUsers } from "@/hooks/api/useUsers";
// Defining service categories with icons and links
// Определение категорий услуг с иконками и ссылками
const categories = [
  {
    name: "Фотографы",
    icon: CameraIcon,
    link: "/search?category=photographers",
  }, // Photographers
  { name: "Диджеи", icon: MusicIcon, link: "/search?category=djs" }, // DJs
  { name: "Дизайнеры", icon: Palette, link: "/search?category=designers" }, // Designers
  { name: "Тамада", icon: Mic, link: "/search?category=tamada" }, // Tamada (Host) - Renamed, changed icon and link // Переименовано, изменена иконка и ссылка
  { name: "Видеографы", icon: Film, link: "/search?category=videographers" }, // Videographers
  { name: "Флористы", icon: Flower2, link: "/search?category=florists" }, // Florists
  { name: "Повара", icon: ChefHat, link: "/cook-results" }, // Cooks (link to cooks results page) // Повара (ссылка на страницу результатов поваров)
  { name: "Транспорт", icon: Car, link: "/transport-results" }, // Transport (link to transport results page) // Транспорт (ссылка на страницу результатов транспорта)
  { name: "Аниматоры", icon: Smile, link: "/search?category=animators" }, // Animators
  { name: "Визажисты", icon: Brush, link: "/search?category=makeupartists" }, // Makeup Artists
  { name: "Стилисты", icon: Palette, link: "/search?category=stylists" }, // Stylists (used Palette icon) // Стилисты (использована иконка Palette)
  { name: "Рестораны", icon: Utensils, link: "/restaurants" }, // Restaurants (link to restaurants page) // Рестораны (ссылка на страницу ресторанов)
  { name: "Ведущие", icon: Mic, link: "/search?category=hosts" }, // Hosts - Renamed from "Other", changed icon and link // Переименовано с "Другое", изменена иконка и ссылка
  { name: "Артисты", icon: MicVocal, link: "/artists" }, // Added "Artists" category // Добавлена категория "Артисты"
];

// Home page component // Компонент главной страницы
export default function Home() {
  // const { data, isPending } = useUsers();

  // State for tracking hovered category // Состояние для отслеживания наведенной категории
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  // Hook for navigation // Хук для навигации
  const router = useRouter();

  // Handler for category click // Обработчик клика по категории
  const handleCategoryClick = (link: string, categoryName: string) => {
    if (categoryName === "Транспорт") {
      router.push("/transport-results"); // Direct navigation for Transport // Прямой переход для Транспорта
    } else if (categoryName === "Рестораны") {
      router.push("/restaurants"); // Direct navigation for Restaurants // Прямой переход для Ресторанов
    } else if (categoryName === "Повара") {
      router.push("/cook-results"); // Direct navigation for Cooks // Прямой переход для Поваров
    } else if (categoryName === "Артисты") {
      router.push("/artists"); // Direct navigation for Artists // Прямой переход для Артистов
    } else {
      router.push(link); // Otherwise use standard link for search // Иначе используем стандартную ссылку для поиска
    }
  };

  return (
    <div>
      {/* Hero Section */} {/* Секция Hero */}
      <section className="py-20 bg-background">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            Найдите идеальных профессионалов для вашего мероприятия
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Просмотрите наш каталог талантливых фотографов, диджеев, дизайнеров
            и других.
          </p>
          {/* Button to navigate to search page */}{" "}
          {/* Кнопка для перехода на страницу поиска */}
          <Link href="/search">
            <Button size="lg" className="cursor-pointer" variant="destructive">
              Начать поиск
            </Button>
          </Link>
        </div>
      </section>
      {/* Categories Section */} {/* Секция категорий */}
      <section className="py-12">
        <div className="container mx-auto">
          <h2 className="text-2xl font-semibold mb-6 text-center text-foreground">
            Изучите категории услуг
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Displaying each category */}{" "}
            {/* Отображение каждой категории */}
            {categories.map((category) => (
              <div
                key={category.name}
                // Dynamic classes for styling and hover animation
                // Динамические классы для стилизации и анимации при наведении
                className={`relative p-6 rounded-lg shadow-md transition-transform duration-300 ease-in-out hover:scale-105 ${
                  hoveredCategory === category.name ? "scale-105" : ""
                } cursor-pointer bg-card text-card-foreground`} // Added classes for card background and text // Добавлены классы для фона и текста карточки
                // Mouse event handlers for animation
                // Обработчики событий мыши для анимации
                onMouseEnter={() => setHoveredCategory(category.name)}
                onMouseLeave={() => setHoveredCategory(null)}
                // Click handler for navigation
                // Обработчик клика для навигации
                onClick={() =>
                  handleCategoryClick(category.link, category.name)
                } // Pass category name // Передаем имя категории
              >
                {/* Background layer for visual effect (commented out) */}
                {/* Фоновый слой для визуального эффекта */}
                {/* <div className="absolute inset-0 bg-secondary rounded-lg opacity-20"></div> */}
                {/* Category card content */} {/* Контент карточки категории */}
                <div className="relative flex flex-col items-center justify-center h-full">
                  <category.icon className="w-8 h-8 mb-2 text-primary" />{" "}
                  {/* Category icon */} {/* Иконка категории */}
                  <h3 className="text-lg font-semibold text-foreground">
                    {category.name}
                  </h3>{" "}
                  {/* Category name */} {/* Название категории */}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Testimonials Section (Example) */} {/* Секция отзывов (Пример) */}
      <section className="py-12 bg-muted">
        <div className="container mx-auto text-center">
          <h2 className="text-2xl font-semibold mb-6 text-foreground">
            Что говорят наши клиенты
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Example testimonial */} {/* Пример отзыва */}
            <Card>
              <CardContent className="pt-6">
                {" "}
                {/* Added pt-6 for padding */} {/* Добавлен pt-6 для отступа */}
                <p className="text-muted-foreground">
                  "Eventomir упростил поиск идеального фотографа для нашей
                  свадьбы. Мы не могли быть счастливее!"
                </p>{" "}
                {/* Changed name */} {/* Изменено название */}
                <p className="mt-2 font-medium text-foreground">- Jane Doe</p>
              </CardContent>
            </Card>
            {/* Add more testimonials here */}{" "}
            {/* Добавьте больше отзывов здесь */}
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  "Отличный выбор диджеев! Нашли именно того, кто зажег нашу
                  вечеринку."
                </p>
                <p className="mt-2 font-medium text-foreground">- Иван П.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  "Очень удобный поиск и большой выбор исполнителей.
                  Рекомендую!"
                </p>
                <p className="mt-2 font-medium text-foreground">- Мария С.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
