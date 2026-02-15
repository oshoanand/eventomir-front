"use client";

import { useState, useEffect } from "react"; // Added useEffect // Добавлен useEffect
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
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import * as LucideIcons from "lucide-react"; // Import all icons // Импорт всех иконок
import { Palette, Text, Image as ImageIcon, Settings, Brush, Tags, UserCog, Pencil, Trash2, PlusCircle, DollarSign, Mic, Star, FileImage } from "lucide-react"; // Changed Heading to Mic, added Star, FileImage // Заменена Heading на Mic, добавлена Star, FileImage
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select // Импортируем Select
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getPriceConfig, updatePriceConfig, SubscriptionPriceConfig } from "@/services/payment"; // Import pricing services // Импорт сервисов цен
import { Skeleton } from "@/components/ui/skeleton"; // Import skeleton // Импорт скелетона

// List of popular web fonts
// Список популярных веб-шрифтов
const popularFonts = [
    "Arial, sans-serif",
    "Verdana, sans-serif",
    "Helvetica, sans-serif",
    "Tahoma, sans-serif",
    "Trebuchet MS, sans-serif",
    "Times New Roman, serif",
    "Georgia, serif",
    "Garamond, serif",
    "Courier New, monospace",
    "Brush Script MT, cursive",
    // Google Fonts (require connection in layout.tsx or globals.css)
    // Шрифты Google Fonts (требуют подключения в layout.tsx или globals.css)
    // "Roboto, sans-serif",
    // "Open Sans, sans-serif",
    // "Montserrat, sans-serif",
    // "Lato, sans-serif",
    // "Inter, sans-serif", // Geist Sans/Mono are already used // Geist Sans/Mono уже используются
];

// Type for category
// Тип для категории
interface SiteCategory {
    id: string;
    name: string;
    icon: keyof typeof LucideIcons; // Use keyof for icon names // Используем keyof для имен иконок
    link?: string; // Link (optional, if needed) // Ссылка (опционально, если нужно)
}


// Site settings page component
// Компонент страницы настроек сайта
const SettingsPage = () => {
    const { toast } = useToast();

    // States for settings // Состояния для настроек
    const [siteName, setSiteName] = useState("Eventomir"); // Site name // Название сайта
    const [logoUrl, setLogoUrl] = useState(""); // Logo URL // URL логотипа
    const [logoFile, setLogoFile = useState<File | null>(null); // Logo file // Файл логотипа
    const [logoAltText, setLogoAltText = useState<string>('Логотип Eventomir'); // Alt text for logo // Alt текст для логотипа
    const [faviconUrl, setFaviconUrl = useState("/favicon.ico"); // Favicon URL (default) // URL фавикона (по умолчанию)
    const [faviconFile, setFaviconFile = useState<File | null>(null); // Favicon file // Файл фавикона
    // Revert to using HEX for color pickers // Возвращаем использование HEX для color picker'ов
    const [backgroundColor, setBackgroundColor = useState("#f5f5dc"); // Background color (Soft Beige) // Цвет фона (Soft Beige)
    const [primaryColor, setPrimaryColor = useState("#ffb6c1"); // Primary color (Light Pastel Pink) // Основной цвет (Light Pastel Pink)
    const [accentColor, setAccentColor = useState("#ffd700"); // Accent color (Gold) // Акцентный цвет (Gold)
    // Set generated SEO values as default // Устанавливаем сгенерированные SEO значения по умолчанию
    const [siteTitle, setSiteTitle = useState("Eventomir: Найдите лучших исполнителей для мероприятий"); // Site SEO Title // SEO Title сайта
    const [siteDescription, setSiteDescription = useState("Eventomir - платформа для поиска фотографов, DJ, ведущих, кейтеринга и других профессионалов для свадьбы, дня рождения, корпоратива. Удобный поиск и отзывы."); // Site SEO Description // SEO Description сайта
    const [siteKeywords, setSiteKeywords = useState("организация мероприятий, поиск исполнителей, фотограф на свадьбу, DJ на праздник, ведущий на корпоратив, кейтеринг, декор мероприятий, аренда транспорта, артисты, планирование событий, Eventomir, ивентомир"); // Site SEO Keywords // SEO Keywords сайта
    const [selectedFontFamily, setSelectedFontFamily = useState("Arial, sans-serif"); // Site font, default selected // Шрифт сайта, выбранный по умолчанию

    // State for categories (load from service/API or use mock)
    // Состояние для категорий (загрузить из сервиса/API или использовать мок)
    const [siteCategories, setSiteCategories = useState<SiteCategory[]>([ // Example existing categories // Пример существующих категорий
        { id: "1", name: "Фотографы", icon: "Camera" }, // Photographers
        { id: "2", name: "DJ", icon: "Music" },
        { id: "3", name: 'Дизайнеры', icon: 'Palette' }, // Designers
        { id: '4', name: 'Тамада', icon: 'Mic' }, // Tamada (Host) - Renamed, changed icon // Переименовано, изменена иконка
        { id: '5', name: 'Видеографы', icon: 'Film' }, // Videographers
        { id: '6', name: 'Флористы', icon: 'Flower2' }, // Florists
        { id: '7', name: 'Повара', icon: 'ChefHat' }, // Cooks
        { id: '8', name: 'Транспорт', icon: 'Car' }, // Transport
        { id: '9', name: 'Аниматоры', icon: 'Smile' }, // Animators
        { id: '10', name: 'Визажисты', icon: 'Brush' }, // Makeup Artists
        { id: '11', name: 'Стилисты', icon: 'Palette' }, // Stylists
        { id: '12', name: 'Рестораны', icon: 'Utensils' }, // Restaurants
        { id: '13', name: 'Ведущие', icon: 'Mic' }, // Hosts - Renamed from "Other" // Переименовано с "Другое"
    ]);

    // States for add/edit category dialog
    // Состояния для диалога добавления/редактирования категории
    const [isCategoryDialogOpen, setIsCategoryDialogOpen = useState(false);
    const [editingCategory, setEditingCategory = useState<SiteCategory | null>(null); // null for adding, object for editing // null для добавления, объект для редактирования
    const [categoryFormData, setCategoryFormData = useState<{ name: string; icon: keyof typeof LucideIcons }>({ name: '', icon: 'Asterisk' });

    // States for managing prices // Состояния для управления ценами
    const [priceConfig, setPriceConfig = useState<SubscriptionPriceConfig | null>(null);
    const [paidRequestPrice, setPaidRequestPrice = useState<number>(490); // Added state for request price // Добавлено состояние для цены запроса
    const [isLoadingPrices, setIsLoadingPrices = useState(true);

    // Load current prices on mount // Загрузка текущих цен при монтировании
    useEffect(() => {
        const fetchPrices = async () => {
            setIsLoadingPrices(true);
            try {
                const config = await getPriceConfig();
                setPriceConfig(config);
                setPaidRequestPrice(config.paidRequestPrice); // Load request price // Загружаем цену запроса
            } catch (error) {
                console.error("Ошибка загрузки цен:", error); // Error loading prices:
                toast({ variant: "destructive", title: "Ошибка", description: "Не удалось загрузить текущие цены." }); // Error // Could not load current prices.
            } finally {
                setIsLoadingPrices(false);
            }
        };
        fetchPrices();
    }, [toast]);


    // Function to render Lucide icons by name
    // Функция для рендеринга иконок Lucide по имени
    const renderIcon = (iconName: keyof typeof LucideIcons, props: React.ComponentProps<typeof LucideIcons.Icon>) => {
        const IconComponent = LucideIcons[iconName] as React.ElementType; // Get the icon component // Получаем компонент иконки
        if (!IconComponent) {
            // Return default icon or null if icon not found
            // Возвращаем иконку по умолчанию или null, если иконка не найдена
            return <LucideIcons.HelpCircle {...props} />;
        }
        return <IconComponent {...props} />;
    };


    // Handler for logo change (file)
    // Обработчик изменения логотипа (файл)
    const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            setLogoUrl(""); // Reset URL if file is selected // Сбрасываем URL, если выбран файл
        }
    };

    // Handler for logo change (URL)
    // Обработчик изменения логотипа (URL)
    const handleLogoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLogoUrl(e.target.value);
        setLogoFile(null); // Reset file if URL is entered // Сбрасываем файл, если введен URL
    };

     // Handler for favicon change (file)
     // Обработчик изменения фавикона (файл)
     const handleFaviconFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // File type check (.ico, .png, .svg)
            // Проверка типа файла (должен быть .ico, .png, .svg)
            if (!['image/x-icon', 'image/png', 'image/svg+xml'].includes(file.type)) {
                toast({ variant: "destructive", title: "Ошибка", description: "Допустимые форматы для фавикона: .ico, .png, .svg." }); // Error // Allowed formats for favicon: .ico, .png, .svg.
                return;
            }
            setFaviconFile(file);
            setFaviconUrl(""); // Reset URL // Сбрасываем URL
        }
    };

    // Handler for favicon change (URL)
    // Обработчик изменения фавикона (URL)
    const handleFaviconUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFaviconUrl(e.target.value);
        setFaviconFile(null); // Reset file // Сбрасываем файл
    };


    // Handler for saving general settings
    // Обработчик сохранения общих настроек
    const handleSaveGeneralSettings = () => {
        // Implement saving name, logo, logo alt text, and favicon on backend
        // Реализовать сохранение названия, логотипа, alt текста логотипа и фавикона на бэкенде
        console.log("Сохранение общих настроек:", { siteName, logoUrl, logoFile, logoAltText, faviconUrl, faviconFile }); // Saving general settings:
        toast({ title: "Общие настройки сохранены", description: "Изменения фавикона могут потребовать очистки кэша браузера." }); // General settings saved // Favicon changes may require clearing browser cache.
    };

    // Handler for saving color scheme
    // Обработчик сохранения цветовой палитры
    const handleSaveColorScheme = () => {
        // Implement updating CSS theme variables in globals.css from HEX to HSL
        // Реализовать обновление CSS переменных темы в globals.css из HEX в HSL
        console.log("Сохранение цветовой схемы (HEX):", { backgroundColor, primaryColor, accentColor }); // Saving color scheme (HEX):
        toast({ title: "Цветовая схема сохранена", description: "Для полного применения может потребоваться обновление темы и перезагрузка." }); // Color scheme saved // Full application may require theme update and reload.
    };

    // Handler for saving SEO settings
    // Обработчик сохранения SEO настроек
    const handleSaveSeoSettings = () => {
        // Implement saving site SEO meta tags (possibly via API or config file)
        // Реализовать сохранение SEO мета-тегов сайта (возможно, через API или конфигурационный файл)
        console.log("Сохранение SEO настроек:", { siteTitle, siteDescription, siteKeywords }); // Saving SEO settings:
        toast({ title: "SEO настройки сохранены" }); // SEO settings saved
    };

     // Handler for saving font settings
     // Обработчик сохранения настроек шрифтов
     const handleSaveFontSettings = () => {
        // Implement changing fonts on the site.
        // Реализовать изменение шрифтов на сайте.
        console.log("Сохранение настроек шрифтов:", { fontFamily: selectedFontFamily }); // Saving font settings:
        toast({ title: "Настройки шрифтов сохранены", description: "Изменения могут потребовать обновления стилей." }); // Font settings saved // Changes may require updating styles.
    };


    // --- Category Management --- // --- Управление категориями ---

    // Open dialog for adding
    // Открытие диалога для добавления
    const openAddCategoryDialog = () => {
        setEditingCategory(null);
        setCategoryFormData({ name: '', icon: 'Asterisk' }); // Reset form // Сброс формы
        setIsCategoryDialogOpen(true);
    };

    // Open dialog for editing
    // Открытие диалога для редактирования
    const openEditCategoryDialog = (category: SiteCategory) => {
        setEditingCategory(category);
        setCategoryFormData({ name: category.name, icon: category.icon }); // Fill form with data // Заполнение формы данными
        setIsCategoryDialogOpen(true);
    };

    // Handler for category form field changes
    // Обработчик изменения полей формы категории
    const handleCategoryFormChange = (field: 'name' | 'icon', value: string) => {
        if (field === 'icon') {
           // Check if the icon name is valid in LucideIcons
           // Проверяем, является ли имя иконки допустимым в LucideIcons
           if (!(value in LucideIcons)) {
               console.warn(`Invalid icon name: ${value}`);
                // Allow setting invalid icon name temporarily for user input, but validation will catch it on save
                // Разрешаем временную установку невалидного имени для ввода, но валидация поймает это при сохранении
                setCategoryFormData(prev => ({ ...prev, [field]: value as keyof typeof LucideIcons }));
               return;
           }
        }
         // Update the form data state
         // Обновляем состояние данных формы
         setCategoryFormData(prev => ({ ...prev, [field]: value as keyof typeof LucideIcons }));
    };


    // Handler for saving/adding category
    // Обработчик сохранения/добавления категории
    const handleSaveCategory = () => {
        if (!categoryFormData.name.trim()) {
            toast({ variant: "destructive", title: "Ошибка", description: "Введите название категории." }); // Error // Enter category name.
            return;
        }
        // Validate icon name on save
        // Проверка имени иконки при сохранении
        if (!(categoryFormData.icon in LucideIcons)) {
             toast({ variant: "destructive", title: "Ошибка", description: "Укажите неверное имя иконки Lucide." }); // Error // Incorrect Lucide icon name specified.
             return;
        }

        if (editingCategory) {
            // Editing // Редактирование
             // Implement category update in DB // Реализовать обновление категории в БД
             const updatedCategory: SiteCategory = { ...editingCategory, ...categoryFormData };
             setSiteCategories(siteCategories.map(cat => cat.id === updatedCategory.id ? updatedCategory : cat));
             console.log("Обновление категории:", updatedCategory); // Updating category:
             toast({ title: "Категория обновлена", description: `Категория "${updatedCategory.name}" успешно обновлена.` }); // Category updated // Category "${updatedCategory.name}" updated successfully.
        } else {
            // Adding // Добавление
             // Implement adding category to DB // Реализовать добавление категории в БД
            const newCategory: SiteCategory = {
                id: String(Date.now()), // Temporary ID // Временный ID
                ...categoryFormData
            };
            setSiteCategories([...siteCategories, newCategory]);
            console.log("Добавление новой категории:", newCategory); // Adding new category:
            toast({ title: "Категория добавлена", description: `Категория "${newCategory.name}" успешно добавлена.` }); // Category added // Category "${newCategory.name}" added successfully.
        }
        setIsCategoryDialogOpen(false); // Close dialog // Закрыть диалог
    };


    // Handler for removing category
    // Обработчик удаления категории
    const handleRemoveCategory = (categoryId: string, categoryName: string) => {
         // Implement category deletion from DB (possibly with check if it's used)
         // Реализовать удаление категории из БД (возможно, с проверкой, не используется ли она)
        setSiteCategories(siteCategories.filter(cat => cat.id !== categoryId));
        console.log("Удаление категории:", categoryId); // Removing category:
        toast({ variant: "destructive", title: "Категория удалена", description: `Категория "${categoryName}" удалена.` }); // Category removed // Category "${categoryName}" removed.
    };

     // --- Price Management --- // --- Управление ценами ---

    // Handler for changing plan price
    // Обработчик изменения цены тарифа
    const handlePriceChange = (plan: 'standard' | 'premium', duration: 'monthly' | 'halfYearly' | 'yearly', value: string) => {
        setPriceConfig(prev => {
            if (!prev) return null;
            const newPrice = parseInt(value, 10);
            if (isNaN(newPrice) || newPrice < 0) return prev; // Ignore invalid input // Игнорируем невалидный ввод

            return {
                ...prev,
                [plan]: {
                    ...prev[plan],
                    [duration]: newPrice
                }
            };
        });
    };

     // Handler for changing paid request price
     // Обработчик изменения цены платного запроса
     const handlePaidRequestPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const newPrice = parseInt(value, 10);
        if (!isNaN(newPrice) && newPrice >= 0) {
            setPaidRequestPrice(newPrice);
        } else if (value === '') {
             setPaidRequestPrice(0); // Can set 0 or another default on empty input // Можно установить 0 или другое значение по умолчанию при пустом вводе
        }
    };


    // Handler for saving prices
    // Обработчик сохранения цен
    const handleSavePrices = async () => {
        if (!priceConfig) return;
        setIsLoadingPrices(true);
        try {
            await updatePriceConfig({ ...priceConfig, paidRequestPrice }); // Add request price // Добавляем цену запроса
            toast({ title: "Цены сохранены", description: "Новые цены для тарифных планов и запросов успешно обновлены." }); // Prices saved // New prices for tariff plans and requests successfully updated.
        } catch (error) {
            console.error("Ошибка сохранения цен:", error); // Error saving prices:
            toast({ variant: "destructive", title: "Ошибка", description: "Не удалось сохранить цены." }); // Error // Could not save prices.
        } finally {
            setIsLoadingPrices(false);
        }
    };

     // Skeleton for loading prices
     // Скелет для загрузки цен
     const PriceSkeleton = () => (
        div className="space-y-4">
             Skeleton className="h-8 w-1/3 mb-4" /> {/* Tariff Prices Header */} {/* Заголовок Цены тарифов */}
            Skeleton className="h-8 w-1/4" /> {/* Standard Header */} {/* Заголовок Стандарт */}
            div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                Skeleton className="h-10 w-full" />
                Skeleton className="h-10 w-full" />
                Skeleton className="h-10 w-full" />
            div>
            Separator />
             Skeleton className="h-8 w-1/4" /> {/* Premium Header */} {/* Заголовок Премиум */}
            div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                Skeleton className="h-10 w-full" />
                Skeleton className="h-10 w-full" />
                Skeleton className="h-10 w-full" />
            div>
            Separator />
             Skeleton className="h-8 w-1/3 mb-2" /> {/* Request Price Header */} {/* Заголовок Цена запроса */}
             Skeleton className="h-10 w-1/2" /> {/* Request Price Input Field */} {/* Поле ввода цены запроса */}
             Skeleton className="h-10 w-32" /> {/* Save Button */} {/* Кнопка Сохранить */}
        div>
     );


    return (
        div className="container mx-auto py-10">
            Card>
                CardHeader>
                    CardTitle className="text-2xl flex items-center">
                        Settings className="mr-2 h-6 w-6" /> Настройки Сайта {/* Site Settings */}
                    CardTitle>
                    CardDescription>
                        Управление основными параметрами и внешним видом платформы Eventomir. {/* Manage the main parameters and appearance of the Eventomir platform. */}
                    CardDescription>
                CardHeader>
                CardContent className="space-y-8">

                    {/* Section: General Settings */} {/* Секция: Общие настройки */}
                    Card>
                        CardHeader>
                            CardTitle className="text-lg flex items-center">
                                ImageIcon className="mr-2 h-5 w-5" /> Общие настройки {/* General Settings */}
                            CardTitle>
                        CardHeader>
                        CardContent className="space-y-4">
                            div>
                                Label htmlFor="siteName">Название сайтаLabel> {/* Site Name */}
                                Input
                                    id="siteName"
                                    value={siteName}
                                    onChange={(e) => setSiteName(e.target.value)}
                                />
                            div>
                            Separator />
                            div>
                                Label>ЛоготипLabel> {/* Logo */}
                                div className="flex flex-col sm:flex-row items-start gap-4 mt-2">
                                    {/* Display current logo */} {/* Отображение текущего лого */}
                                    div className="w-20 h-20 bg-muted rounded flex items-center justify-center flex-shrink-0">
                                        {logoUrl || logoFile ? (
                                            img
                                                src={logoUrl || (logoFile ? URL.createObjectURL(logoFile) : '')}
                                                alt={logoAltText || "Логотип сайта"} // Use Alt text // Используем Alt текст
                                                className="max-w-full max-h-full object-contain"
                                                data-ai-hint="site logo"
                                            />
                                        ) : (
                                            span className="text-xs text-muted-foreground">Нет логоspan> {/* No logo */}
                                        )}
                                    div>
                                    div className="flex-grow space-y-2">
                                        div>
                                            Label htmlFor="logoFile">Загрузить файлLabel> {/* Upload file */}
                                            Input
                                                id="logoFile"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleLogoFileChange}
                                                disabled={!!logoUrl}
                                            />
                                             p className="text-xs text-muted-foreground mt-1">
                                                 Рекомендуемый формат: PNG, JPG, SVG. Макс. размер: 2MB. {/* Recommended format: PNG, JPG, SVG. Max size: 2MB. */}
                                            p>
                                        div>
                                        div className="text-center text-muted-foreground text-sm">илиdiv> {/* or */}
                                        div>
                                            Label htmlFor="logoUrl">URL логотипаLabel> {/* Logo URL */}
                                            Input
                                                id="logoUrl"
                                                type="url"
                                                placeholder="https://..."
                                                value={logoUrl}
                                                onChange={handleLogoUrlChange}
                                                disabled={!!logoFile}
                                            />
                                        div>
                                         {/* Field for Logo Alt Text */} {/* Поле для Alt текста логотипа */}
                                        div>
                                            Label htmlFor="logoAltText">Alt текст для логотипа (SEO)Label> {/* Alt text for logo (SEO) */}
                                            Input
                                                id="logoAltText"
                                                type="text"
                                                placeholder="Краткое описание логотипа" // Short description of the logo
                                                value={logoAltText}
                                                onChange={(e) => setLogoAltText(e.target.value)}
                                            />
                                             p className="text-xs text-muted-foreground mt-1">
                                                Опишите логотип для поисковых систем и доступности. {/* Describe the logo for search engines and accessibility. */}
                                            p>
                                        div>
                                    div>
                                div>
                            div>
                             Separator />
                             {/* Section for Favicon */} {/* Раздел для Фавикона */}
                             div>
                                Label>ФавиконLabel> {/* Favicon */}
                                div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
                                    {/* Display current favicon */} {/* Отображение текущего фавикона */}
                                    div className="w-10 h-10 bg-muted rounded flex items-center justify-center flex-shrink-0">
                                        {faviconUrl || faviconFile ? (
                                            img
                                                src={faviconUrl || (faviconFile ? URL.createObjectURL(faviconFile) : '')}
                                                alt="Фавикон сайта" // Site Favicon
                                                className="max-w-full max-h-full object-contain"
                                                 data-ai-hint="site favicon"
                                            />
                                        ) : (
                                            Star className="h-5 w-5 text-muted-foreground" /> // Fallback icon // Запасная иконка
                                        )}
                                    div>
                                    div className="flex-grow space-y-2">
                                        div>
                                            Label htmlFor="faviconFile">Загрузить файлLabel> {/* Upload file */}
                                            Input
                                                id="faviconFile"
                                                type="file"
                                                accept=".ico, image/png, image/svg+xml" // Allowed formats // Допустимые форматы
                                                onChange={handleFaviconFileChange}
                                                disabled={!!faviconUrl}
                                            />
                                            p className="text-xs text-muted-foreground mt-1">
                                                Рекомендуемый формат: ICO, PNG, SVG. Рекомендуемый размер: 32x32 или 64x64 px. {/* Recommended format: ICO, PNG, SVG. Recommended size: 32x32 or 64x64 px. */}
                                            p>
                                        div>
                                        div className="text-center text-muted-foreground text-sm">илиdiv> {/* or */}
                                        div>
                                            Label htmlFor="faviconUrl">URL фавиконаLabel> {/* Favicon URL */}
                                            Input
                                                id="faviconUrl"
                                                type="url"
                                                placeholder="/favicon.ico или https://..." // /favicon.ico or https://...
                                                value={faviconUrl}
                                                onChange={handleFaviconUrlChange}
                                                disabled={!!faviconFile}
                                            />
                                        div>
                                    div>
                                div>
                             div>
                            Button variant="destructive" onClick={handleSaveGeneralSettings}>Сохранить общие настройкиButton> {/* Save General Settings */}
                        CardContent>
                    Card>

                    {/* Section: Color Scheme */} {/* Секция: Цветовая схема */}
                    Card>
                        CardHeader>
                            CardTitle className="text-lg flex items-center">
                                Palette className="mr-2 h-5 w-5" /> Цветовая схема {/* Color Scheme */}
                            CardTitle>
                             CardDescription>
                                Выберите цвета, которые будут использоваться на сайте. Для применения необходимо будет обновить тему. {/* Select the colors to be used on the site. Theme update will be required for application. */}
                             CardDescription>
                        CardHeader>
                        CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Return color pickers */} {/* Возвращаем color picker'ы */}
                            div>
                                Label htmlFor="backgroundColor">Цвет фонаLabel> {/* Background Color */}
                                Input
                                    id="backgroundColor"
                                    type="color"
                                    value={backgroundColor}
                                    onChange={(e) => setBackgroundColor(e.target.value)}
                                    className="h-10" // Increase height for color picker // Увеличим высоту для color picker
                                />
                            div>
                            div>
                                Label htmlFor="primaryColor">Основной цветLabel> {/* Primary Color */}
                                Input
                                    id="primaryColor"
                                    type="color"
                                    value={primaryColor}
                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                     className="h-10"
                                />
                            div>
                            div>
                                Label htmlFor="accentColor">Акцентный цветLabel> {/* Accent Color */}
                                Input
                                    id="accentColor"
                                    type="color"
                                    value={accentColor}
                                    onChange={(e) => setAccentColor(e.target.value)}
                                     className="h-10"
                                />
                            div>
                            div className="sm:col-span-3">
                                Button variant="destructive" onClick={handleSaveColorScheme}>Сохранить цветовую схемуButton> {/* Save Color Scheme */}
                            div>
                        CardContent>
                    Card>

                    {/* Section: SEO */} {/* Секция: SEO */}
                    Card>
                        CardHeader>
                            CardTitle className="text-lg flex items-center">
                                Tags className="mr-2 h-5 w-5" /> SEO Настройки сайта {/* Site SEO Settings */}
                            CardTitle>
                             CardDescription>
                                Оптимизируйте сайт для поисковых систем. {/* Optimize the site for search engines. */}
                             CardDescription>
                        CardHeader>
                        CardContent className="space-y-4">
                            div>
                                Label htmlFor="siteTitle">Заголовок сайта (Title)Label> {/* Site Title (Title) */}
                                Input
                                    id="siteTitle"
                                    value={siteTitle}
                                    onChange={(e) => setSiteTitle(e.target.value)}
                                    maxLength={60} // Recommended Title length // Рекомендованная длина Title
                                    placeholder="Привлекательный заголовок (до 60 символов)" // Catchy title (up to 60 characters)
                                />
                                p className="text-xs text-muted-foreground mt-1">
                                     Оптимальная длина: 50-60 символов. Включайте ключевые слова и название бренда. {/* Optimal length: 50-60 characters. Include keywords and brand name. */}
                                p>
                            div>
                            div>
                                Label htmlFor="siteDescription">Описание сайта (Description)Label> {/* Site Description (Description) */}
                                Textarea
                                    id="siteDescription"
                                    value={siteDescription}
                                    onChange={(e) => setSiteDescription(e.target.value)}
                                    maxLength={160} // Recommended Description length // Рекомендованная длина Description
                                    placeholder="Краткое и емкое описание сайта (до 160 символов)" // Short and concise site description (up to 160 characters)
                                     className="min-h-[100px]"
                                />
                                 p className="text-xs text-muted-foreground mt-1">
                                     Оптимальная длина: 150-160 символов. Включайте призыв к действию и ключевые слова. {/* Optimal length: 150-160 characters. Include a call to action and keywords. */}
                                p>
                            div>
                            div>
                                Label htmlFor="siteKeywords">Ключевые слова (Keywords)Label> {/* Keywords (Keywords) */}
                                Input
                                    id="siteKeywords"
                                    value={siteKeywords}
                                    onChange={(e) => setSiteKeywords(e.target.value)}
                                    placeholder="Пример: организация мероприятий, фотограф, DJ, ведущий, кейтеринг" // Example: event organization, photographer, DJ, host, catering
                                />
                                 p className="text-xs text-muted-foreground mt-1">
                                     Хотя мета-тег Keywords менее важен для Google, он может использоваться другими поисковиками. Укажите основные релевантные слова через запятую. {/* Although the Keywords meta tag is less important for Google, it may be used by other search engines. Specify the main relevant words separated by commas. */}
                                p>
                            div>
                            Button variant="destructive" onClick={handleSaveSeoSettings}>Сохранить SEOBotton> {/* Save SEO */}
                        CardContent>
                    Card>

                    {/* Section: Fonts */} {/* Секция: Шрифты */}
                    Card>
                        CardHeader>
                            CardTitle className="text-lg flex items-center">
                                Text className="mr-2 h-5 w-5" /> Шрифты {/* Fonts */}
                            CardTitle>
                        CardHeader>
                        CardContent className="space-y-4">
                             div>
                                Label htmlFor="fontFamilySelect">Основной шрифт сайтаLabel> {/* Main Site Font */}
                                 {/* Replaced Input with Select */} {/* Заменен Input на Select */}
                                Select value={selectedFontFamily} onValueChange={setSelectedFontFamily}>
                                    SelectTrigger id="fontFamilySelect">
                                        SelectValue placeholder="Выберите шрифт" /> {/* Select font */}
                                    SelectTrigger>
                                    SelectContent>
                                        {popularFonts.map((font) => (
                                            SelectItem key={font} value={font} style={{ fontFamily: font }}>
                                                {font.split(',')[0]} {/* Display only the font name */} {/* Отображаем только название шрифта */}
                                            SelectItem>
                                        ))}
                                    SelectContent>
                                Select>
                                p className="text-xs text-muted-foreground mt-1">
                                     Текущие шрифты (Geist Sans) установлены через next/font. Выбор другого шрифта здесь потребует ручного обновления конфигурации. {/* Current fonts (Geist Sans) are set via next/font. Selecting another font here will require manual configuration update. */}
                                p>
                            div>
                            Button variant="destructive" onClick={handleSaveFontSettings}>Сохранить настройки шрифтовButton> {/* Save Font Settings */}
                        CardContent>
                    Card>

                    {/* Section: Category Management */} {/* Секция: Управление категориями */}
                    Card>
                        CardHeader className="flex flex-row items-center justify-between">
                            div className="space-y-1">
                                CardTitle className="text-lg flex items-center">
                                    UserCog className="mr-2 h-5 w-5" /> Управление категориями {/* Category Management */}
                                CardTitle>
                                CardDescription>
                                    Добавляйте, редактируйте или удаляйте категории услуг. {/* Add, edit, or remove service categories. */}
                                CardDescription>
                            div>
                             Button variant="destructive" onClick={openAddCategoryDialog}>
                                PlusCircle className="mr-2 h-4 w-4" /> Добавить категорию {/* Add Category */}
                            Button>
                        CardHeader>
                        CardContent className="space-y-4">
                            {/* List of existing categories */} {/* Список существующих категорий */}
                            ScrollArea className="h-72 w-full rounded-md border">
                                div className="p-4">
                                    {siteCategories.length > 0 ? (
                                        siteCategories.map(category => (
                                            div key={category.id} className="flex items-center justify-between py-2 px-3 hover:bg-muted/50 rounded-md">
                                                div className="flex items-center gap-3">
                                                    {renderIcon(category.icon, { className: "h-5 w-5 text-muted-foreground" })}
                                                    span className="font-medium">{category.name}span>
                                                div>
                                                div className="flex gap-2">
                                                    Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditCategoryDialog(category)}>
                                                        Pencil className="h-4 w-4" />
                                                        span className="sr-only">Редактироватьspan> {/* Edit */}
                                                    Button>
                                                    {/* Add confirmation dialog before deletion */} {/* Добавить диалог подтверждения перед удалением */}
                                                    Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleRemoveCategory(category.id, category.name)}>
                                                        Trash2 className="h-4 w-4" />
                                                         span className="sr-only">Удалитьspan> {/* Delete */}
                                                    Button>
                                                div>
                                            div>
                                        ))
                                    ) : (
                                        p className="text-sm text-center text-muted-foreground py-4">Категорий пока нет.p> // No categories yet.
                                    )}
                                div>
                            ScrollArea>
                        CardContent>
                    Card>

                     {/* Section: Price Management */} {/* Секция: Управление ценами */}
                    Card>
                        CardHeader>
                            CardTitle className="text-lg flex items-center">
                                DollarSign className="mr-2 h-5 w-5" /> Управление ценами {/* Price Management */}
                            CardTitle>
                            CardDescription>
                                Установите цены для тарифных планов и платных запросов. {/* Set prices for tariff plans and paid requests. */}
                            CardDescription>
                        CardHeader>
                        CardContent className="space-y-6">
                            {isLoadingPrices || !priceConfig ? (
                                PriceSkeleton />
                            ) : (
                                div className="space-y-6">
                                     {/* Header for tariff prices */} {/* Заголовок для цен тарифов */}
                                     h4 className="font-medium text-base">Цены тарифных планов (руб.)h4> {/* Tariff Plan Prices (RUB) */}
                                    {/* Prices for "Standard" */} {/* Цены для "Стандарт" */}
                                    div>
                                        h5 className="font-medium mb-2">Тариф "Стандарт"h5> {/* "Standard" Tariff */}
                                        div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            div>
                                                Label htmlFor="standardMonthly">Цена за месяцLabel> {/* Price per month */}
                                                Input
                                                    id="standardMonthly"
                                                    type="number"
                                                    min="0"
                                                    value={priceConfig.standard.monthly}
                                                    onChange={(e) => handlePriceChange('standard', 'monthly', e.target.value)}
                                                    disabled={isLoadingPrices}
                                                />
                                            div>
                                            div>
                                                Label htmlFor="standardHalfYearly">Цена за 6 месяцевLabel> {/* Price per 6 months */}
                                                Input
                                                    id="standardHalfYearly"
                                                    type="number"
                                                    min="0"
                                                    value={priceConfig.standard.halfYearly}
                                                    onChange={(e) => handlePriceChange('standard', 'halfYearly', e.target.value)}
                                                    disabled={isLoadingPrices}
                                                />
                                            div>
                                            div>
                                                Label htmlFor="standardYearly">Цена за 12 месяцевLabel> {/* Price per 12 months */}
                                                Input
                                                    id="standardYearly"
                                                    type="number"
                                                    min="0"
                                                    value={priceConfig.standard.yearly}
                                                    onChange={(e) => handlePriceChange('standard', 'yearly', e.target.value)}
                                                    disabled={isLoadingPrices}
                                                />
                                            div>
                                        div>
                                    div>

                                    Separator />

                                    {/* Prices for "Premium" */} {/* Цены для "Премиум" */}
                                    div>
                                        h5 className="font-medium mb-2">Тариф "Премиум"h5> {/* "Premium" Tariff */}
                                        div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            div>
                                                Label htmlFor="premiumMonthly">Цена за месяцLabel> {/* Price per month */}
                                                Input
                                                    id="premiumMonthly"
                                                    type="number"
                                                    min="0"
                                                    value={priceConfig.premium.monthly}
                                                    onChange={(e) => handlePriceChange('premium', 'monthly', e.target.value)}
                                                    disabled={isLoadingPrices}
                                                />
                                            div>
                                            div>
                                                Label htmlFor="premiumHalfYearly">Цена за 6 месяцевLabel> {/* Price per 6 months */}
                                                Input
                                                    id="premiumHalfYearly"
                                                    type="number"
                                                    min="0"
                                                    value={priceConfig.premium.halfYearly}
                                                    onChange={(e) => handlePriceChange('premium', 'halfYearly', e.target.value)}
                                                    disabled={isLoadingPrices}
                                                />
                                            div>
                                            div>
                                                Label htmlFor="premiumYearly">Цена за 12 месяцевLabel> {/* Price per 12 months */}
                                                Input
                                                    id="premiumYearly"
                                                    type="number"
                                                    min="0"
                                                    value={priceConfig.premium.yearly}
                                                    onChange={(e) => handlePriceChange('premium', 'yearly', e.target.value)}
                                                    disabled={isLoadingPrices}
                                                />
                                            div>
                                        div>
                                    div>

                                     Separator className="my-6" /> {/* Larger separator */} {/* Разделитель побольше */}

                                     {/* Paid Request Price Management */} {/* Управление ценой платного запроса */}
                                     div>
                                        h4 className="font-medium text-base mb-2">Стоимость размещения платного запроса (руб.)h4> {/* Cost of posting a paid request (RUB) */}
                                        div>
                                            Label htmlFor="paidRequestPrice">Цена за один запросLabel> {/* Price per request */}
                                            Input
                                                id="paidRequestPrice"
                                                type="number"
                                                min="0"
                                                value={paidRequestPrice}
                                                onChange={handlePaidRequestPriceChange}
                                                disabled={isLoadingPrices}
                                                className="max-w-xs" // Limit field width // Ограничим ширину поля
                                            />
                                             p className="text-xs text-muted-foreground mt-1">Эта цена будет взиматься с заказчика за публикацию одного платного запроса.p> {/* This price will be charged to the customer for publishing one paid request. */}
                                        div>
                                    div>

                                    {/* Save Prices Button */} {/* Кнопка сохранения цен */}
                                    Button variant="destructive" onClick={handleSavePrices} disabled={isLoadingPrices} className="mt-6">
                                        {isLoadingPrices ? "Сохранение..." : "Сохранить все цены"} {/* Saving... / Save All Prices */}
                                    Button>
                                div>
                            )}
                        CardContent>
                    Card>


                CardContent>
            Card>

            {/* Add/Edit Category Dialog */} {/* Диалог добавления/редактирования категории */}
             Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                DialogContent className="sm:max-w-[425px]">
                    DialogHeader>
                        DialogTitle>{editingCategory ? 'Редактировать категорию' : 'Добавить новую категорию'}DialogTitle> {/* Edit Category / Add New Category */}
                        DialogDescription>
                            {editingCategory ? 'Измените название или иконку категории.' : 'Введите название и выберите иконку для новой категории.'} {/* Change the name or icon of the category. / Enter the name and select an icon for the new category. */}
                        DialogDescription>
                    DialogHeader>
                    div className="grid gap-4 py-4">
                        div className="grid grid-cols-4 items-center gap-4">
                            Label htmlFor="categoryName" className="text-right">
                                Название {/* Name */}
                            Label>
                             Input
                                id="categoryName"
                                value={categoryFormData.name}
                                onChange={(e) => handleCategoryFormChange('name', e.target.value)}
                                className="col-span-3"
                                placeholder="Например, Кейтеринг" // Example, Catering
                            />
                        div>
                         div className="grid grid-cols-4 items-center gap-4">
                            Label htmlFor="categoryIcon" className="text-right">
                                Иконка (Lucide) {/* Icon (Lucide) */}
                            Label>
                             {/* Improved icon selection */} {/* Улучшенный выбор иконки */}
                             div className="col-span-3 flex items-center gap-2">
                                 Select value={categoryFormData.icon} onValueChange={(value) => handleCategoryFormChange('icon', value)}>
                                     SelectTrigger className="flex-grow">
                                         SelectValue placeholder="Выберите иконку" /> {/* Select icon */}
                                     SelectTrigger>
                                     SelectContent>
                                         ScrollArea className="h-48">
                                             {/* Filter out unnecessary exports */} {/* Фильтруем ненужные экспорты */}
                                             {Object.keys(LucideIcons).filter(key => key !== 'createLucideIcon' && key !== 'Icon' && key !== 'icons' && !key.endsWith('IconNode')).map((iconName) => (
                                                 SelectItem key={iconName} value={iconName}>
                                                     div className="flex items-center gap-2">
                                                         {renderIcon(iconName as keyof typeof LucideIcons, { className: "h-4 w-4" })}
                                                         {iconName}
                                                     div>
                                                 SelectItem>
                                             ))}
                                         ScrollArea>
                                     SelectContent>
                                 Select>
                                 {/* Display selected icon */} {/* Отображение выбранной иконки */}
                                 div className="p-2 border rounded-md">
                                     {renderIcon(categoryFormData.icon, { className: "h-5 w-5" })}
                                 div>
                             div>
                        div>
                         {/* Display warning for invalid icon */} {/* Отображение предупреждения для невалидной иконки */}
                          {categoryFormData.icon && !(categoryFormData.icon in LucideIcons) && (
                             p className="col-span-4 text-xs text-destructive text-center">
                                 Введено неверное имя иконки Lucide. Выберите из списка. {/* Invalid Lucide icon name entered. Select from the list. */}
                             p>
                         )}
                    div>
                    DialogFooter>
                        DialogClose asChild>
                             Button type="button" variant="outline">
                                Отмена {/* Cancel */}
                            Button>
                        DialogClose>
                        Button type="button" variant="destructive" onClick={handleSaveCategory}>
                            {editingCategory ? 'Сохранить изменения' : 'Добавить категорию'} {/* Save Changes / Add Category */}
                        Button>
                    DialogFooter>
                DialogContent>
            Dialog>

        div>
    );
};

export default SettingsPage;
