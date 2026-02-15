"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect, useState, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
// Updated import of moderation functions
// Обновленный импорт функций модерации
import { getRegisteredPerformers, approvePerformerProfile, rejectPerformerProfile, approveGalleryItem, rejectGalleryItem, approveCertificate, rejectCertificate, approveRecommendationLetter, rejectRecommendationLetter } from "@/services/admin";
import type { RegisteredPerformer } from "@/services/admin"; // Use 'type' for import // Используем 'type' для импорта
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Bell, CheckCircle, UserPlus, Settings, PackagePlus, User, UserX, Pencil, Tags, BookText, FileImage, Star, Search, BarChart3, Users2, DollarSign, CalendarDays, PieChart, Map, Trash2, PlusCircle, UserCog, Check, Hourglass, ShieldCheck, ShieldX, Award, FileText, BookCheck } from "lucide-react"; // Added icons for moderation, certificates (Award), letters (FileText) // Добавлены иконки для модерации, сертификатов (Award), писем (FileText)
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getArticles, createArticle, updateArticle, deleteArticle } from "@/services/article";
import type { Article } from "@/services/article";
import { getAverageRating } from "@/services/reviews";
import { RatingStars } from "@/components/ui/rating-stars"; // Importing stars // Импорт звезд
import Link from 'next/link';
import { getNotifications } from "@/services/notifications";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, Pie, Cell, ResponsiveContainer } from "recharts";
import { getSupportManagers, addSupportManager, removeSupportManager } from "@/services/support";
import type { SupportManager } from "@/services/support";
// Updated import of functions to get moderation data
// Обновленный импорт функций получения данных на модерацию
import { getPendingPerformerProfiles, getPendingGalleryItems, getPendingCertificates, getPendingRecommendationLetters } from "@/services/performer";
import type { PerformerProfile, GalleryItem, Certificate, RecommendationLetter } from '@/services/performer'; // Importing types // Импорт типов

// User interface (using RegisteredPerformer as base type for performer)
// Интерфейс пользователя (используем RegisteredPerformer как базовый тип для исполнителя)
interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  city: string;
  registrationDate: string;
}

// Performer interface, extending User
// Интерфейс исполнителя, расширяющий User
interface Performer extends RegisteredPerformer { // Using RegisteredPerformer directly // Используем RegisteredPerformer напрямую
  averageRating?: number | null;
}

// Customer interface, extending User
// Интерфейс заказчика, расширяющий User
interface Customer extends User {
  // Customer-specific properties (none for now)
  // Специфичные для заказчика свойства (пока нет)
}

// Type for chart data
// Тип для данных графика
type ChartData = {
    name: string;
    value: number;
    fill?: string;
};

// Type for analytics data
// Тип для аналитических данных
interface AnalyticsData {
    totalPerformers: number;
    performersByRegion: Record<string, number>;
    performersByRole: Record<string, number>;
    totalCustomers: number;
    customersByRegion: Record<string, number>;
    totalRevenue: number;
    subscriptionRevenue: number;
    requestRevenue: number;
}

// Type for items pending moderation
// Тип для элементов на модерации
interface PendingProfileItem extends PerformerProfile {} // Just use the profile type // Просто используем тип профиля
interface PendingGalleryItem {
    performerId: string;
    performerName: string;
    item: GalleryItem;
}
// New types for items pending moderation
// Новые типы для элементов на модерацию
interface PendingCertificateItem {
    performerId: string;
    performerName: string;
    item: Certificate;
}
interface PendingRecommendationLetterItem {
    performerId: string;
    performerName: string;
    item: RecommendationLetter;
}


// Admin panel component
// Компонент админ панели
const AdminPanel = () => {
  // Component states // Состояния компонента
  const [performers, setPerformers] = useState<Performer[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [supportManagers, setSupportManagers] = useState<SupportManager[]>([]);
  const [pendingProfiles, setPendingProfiles] = useState<PendingProfileItem[]>([]);
  const [pendingGallery, setPendingGallery] = useState<PendingGalleryItem[]>([]);
  const [pendingCertificates, setPendingCertificates] = useState<PendingCertificateItem[]>([]); // New state // Новое состояние
  const [pendingLetters, setPendingLetters] = useState<PendingRecommendationLetterItem[]>([]); // New state // Новое состояние
  const [loadingPerformers, setLoadingPerformers] = useState<boolean>(true);
  const [loadingCustomers, setLoadingCustomers] = useState<boolean>(true);
  const [loadingSupportManagers, setLoadingSupportManagers] = useState<boolean>(true);
  const [loadingModeration, setLoadingModeration] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadAdminNotificationsCount, setUnreadAdminNotificationsCount] = useState<number>(0);

  const [editPerformerId, setEditPerformerId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Performer>>({});
  const [editCustomerId, setEditCustomerId] = useState<string | null>(null);
  const [editCustomerFormData, setEditCustomerFormData] = useState<Partial<Customer>>({});

  const [articles, setArticles] = useState<Article[]>([]);
  const [articleTitle, setArticleTitle] = useState<string>("");
  const [articleContent, setArticleContent] = useState<string>("");
  const [editingArticle, setEditingArticle] = useState<Article | null>(null); // Article being edited // Редактируемая статья
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'link'>('image');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [metaTitle, setMetaTitle] = useState<string>('');
  const [metaDescription, setMetaDescription] = useState<string>('');
  const [keywords, setKeywords] = useState<string>('');
  const [imageAltText, setImageAltText] = useState<string>('');

  const [performerSearchQuery, setPerformerSearchQuery] = useState<string>('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>('');

  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState<boolean>(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('last30days');

   const [performersByRegionChartData, setPerformersByRegionChartData] = useState<ChartData[]>([]);
   const [performersByRoleChartData, setPerformersByRoleChartData] = useState<ChartData[]>([]);
   const [customersByRegionChartData, setCustomersByRegionChartData] = useState<ChartData[]>([]);
   const [revenueChartData, setRevenueChartData] = useState<ChartData[]>([]);

   const [newManagerName, setNewManagerName] = useState<string>('');
   const [newManagerEmail, setNewManagerEmail] = useState<string>('');
   const [isAddManagerDialogOpen, setIsAddManagerDialogOpen] = useState<boolean>(false);

   // States for moderation dialog
   // Состояния для диалога модерации
   const [moderationItemId, setModerationItemId] = useState<string | null>(null); // ID of profile or work/certificate/letter // ID профиля или работы/сертификата/письма
   // Updated moderation type
   // Обновленный тип модерации
   const [moderationItemType, setModerationItemType] = useState<'profile' | 'gallery' | 'certificate' | 'letter' | null>(null);
   const [moderationAction, setModerationAction] = useState<'approve' | 'reject' | null>(null);
   const [rejectionReason, setRejectionReason] = useState<string>('');


  const { toast } = useToast();

  // Get current admin ID
  // Получить ID текущего администратора
  const currentAdminUserId = 'admin-user-id'; // Placeholder // Заглушка

  const fetchAdminNotificationsCount = useCallback(async () => {
    try {
      const adminNotifications = await getNotifications(currentAdminUserId);
      const unreadCount = adminNotifications.filter(n => !n.read).length;
      setUnreadAdminNotificationsCount(unreadCount);
    } catch (error) {
      console.error("Failed to fetch admin notifications:", error);
    }
  }, [currentAdminUserId]);

  const fetchArticles = useCallback(async () => {
    try {
      const articlesData = await getArticles();
      setArticles(articlesData);
    } catch (error) {
      console.error("Failed to fetch articles:", error);
      setError("Не удалось загрузить список статей."); // Could not load the list of articles.
    }
  }, []);

    const fetchAnalyticsData = useCallback(async (timeRange: string) => {
        setLoadingAnalytics(true);
        try {
            console.log(`Загрузка аналитики за период: ${timeRange}`); // Loading analytics for period:
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay // Имитация задержки сети

            // Mock data for analytics
            // Заглушка данных для аналитики
            const mockData: AnalyticsData = {
                totalPerformers: 150 + Math.floor(Math.random() * 50),
                performersByRegion: { 'Москва': 50, 'Санкт-Петербург': 30, 'Другие': 70 + Math.floor(Math.random() * 50) }, // Moscow, Saint Petersburg, Others
                performersByRole: { 'Фотограф': 60, 'DJ': 40, 'Ведущий': 30, 'Другие': 20 + Math.floor(Math.random() * 50) }, // Photographer, DJ, Host, Others
                totalCustomers: 500 + Math.floor(Math.random() * 200),
                customersByRegion: { 'Москва': 150, 'Санкт-Петербург': 100, 'Другие': 250 + Math.floor(Math.random() * 200) }, // Moscow, Saint Petersburg, Others
                totalRevenue: 150000 + Math.floor(Math.random() * 50000),
                subscriptionRevenue: 120000 + Math.floor(Math.random() * 40000),
                requestRevenue: 30000 + Math.floor(Math.random() * 10000),
            };
            setAnalyticsData(mockData);

            // Prepare chart data from mock data
            // Подготовка данных для графиков из заглушки
            setPerformersByRegionChartData(Object.entries(mockData.performersByRegion).map(([name, value]) => ({ name, value })))
            setPerformersByRoleChartData(Object.entries(mockData.performersByRole).map(([name, value]) => ({ name, value })))
            setCustomersByRegionChartData(Object.entries(mockData.customersByRegion).map(([name, value]) => ({ name, value })))
            setRevenueChartData([
                { name: 'Подписки', value: mockData.subscriptionRevenue, fill: 'hsl(var(--chart-1))' }, // Subscriptions
                { name: 'Запросы', value: mockData.requestRevenue, fill: 'hsl(var(--chart-2))' }, // Requests
            ])

            setError(null);
        } catch (e: unknown) {
            console.error("Failed to fetch analytics data:", e);
            setError("Не удалось загрузить данные аналитики."); // Could not load analytics data.
            setAnalyticsData(null);
        } finally {
            setLoadingAnalytics(false);
        }
    }, []);

    const fetchSupportManagers = useCallback(async () => {
        setLoadingSupportManagers(true);
        try {
            const managers = await getSupportManagers();
            setSupportManagers(managers);
        } catch (error) {
            console.error("Failed to fetch support managers:", error);
            setError("Не удалось загрузить список менеджеров поддержки."); // Could not load the list of support managers.
        } finally {
            setLoadingSupportManagers(false);
        }
    }, []);

    // Function to load moderation queue data
    // Функция загрузки данных на модерацию
    const fetchModerationQueue = useCallback(async () => {
        setLoadingModeration(true);
        try {
            // Load all queues in parallel
            // Загружаем все очереди параллельно
            const [profiles, galleryItems, certificates, letters] = await Promise.all([
                getPendingPerformerProfiles(),
                getPendingGalleryItems(),
                getPendingCertificates(),
                getPendingRecommendationLetters(),
            ]);
            setPendingProfiles(profiles);
            setPendingGallery(galleryItems);
            setPendingCertificates(certificates);
            setPendingLetters(letters);
        } catch (error) {
            console.error("Failed to fetch moderation queue:", error);
            setError("Не удалось загрузить очередь модерации."); // Could not load the moderation queue.
        } finally {
            setLoadingModeration(false);
        }
    }, []);


  useEffect(() => {
    // Function to fetch performers
    // Функция для получения исполнителей
    const fetchPerformers = async () => {
      try {
        setLoadingPerformers(true);
        const data = await getRegisteredPerformers();
        // Get average rating for each performer
        // Получаем средний рейтинг для каждого исполнителя
        const performersWithRating = await Promise.all(
            data.map(async (performer) => {
                const avgRating = await getAverageRating(performer.id);
                return { ...performer, averageRating: avgRating };
            })
        );
        setPerformers(performersWithRating);
        setError(null);
      } catch (e: unknown) {
        console.error("Failed to fetch performers:", e);
        setError("Не удалось загрузить список зарегистрированных исполнителей."); // Could not load the list of registered performers.
      } finally {
        setLoadingPerformers(false);
      }
    };

    // Function to fetch customers
    // Функция для получения заказчиков
    const fetchCustomers = async () => {
      try {
        setLoadingCustomers(true);
        // Implement getting customers from API
        // Реализовать получение заказчиков из API
        // Mock data for customers
        // Заглушка данных для заказчиков
        const data: Customer[] = [
          {
            id: "3",
            email: "customer1@example.com",
            name: "Заказчик Один", // Customer One
            phone: "+79991112233",
            city: "Казань", // Kazan
            registrationDate: "2024-05-01",
          },
          {
            id: "4",
            email: "customer2@example.com",
            name: "Заказчик Два", // Customer Two
            phone: "+79994445566",
            city: "Москва", // Moscow
            registrationDate: "2024-06-01",
          },
        ];
        setCustomers(data);
        setError(null);
      } catch (e: unknown) {
        console.error("Failed to fetch customers:", e);
        setError("Не удалось загрузить список зарегистрированных заказчиков."); // Could not load the list of registered customers.
      } finally {
        setLoadingCustomers(false);
      }
    };

    // Initial data fetching on component mount
    // Первичная загрузка данных при монтировании компонента
    fetchPerformers();
    fetchCustomers();
    fetchArticles();
    fetchAdminNotificationsCount();
    fetchAnalyticsData(selectedTimeRange);
    fetchSupportManagers();
    fetchModerationQueue(); // Load moderation queue // Загрузка очереди модерации
  }, [fetchArticles, fetchAdminNotificationsCount, fetchAnalyticsData, selectedTimeRange, fetchSupportManagers, fetchModerationQueue]); // Added fetchModerationQueue dependency // Добавлена зависимость fetchModerationQueue

  // Handler to start editing a performer
  // Обработчик начала редактирования исполнителя
  const handleEditPerformer = (id: string) => {
    const performerToEdit = performers.find(performer => performer.id === id);
    if (performerToEdit) {
      setEditPerformerId(id);
      setEditFormData(performerToEdit);
    }
  };

  // Handler for changes in the performer edit form
  // Обработчик изменений в форме редактирования исполнителя
  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData(prevData => ({
      ...prevData,
      [name]: value,
      // roles: prevData.roles, // roles don't need to be saved here, they don't change // roles не нужно сохранять здесь, они не меняются
    }));
  };

  // Handler to save performer edits
  // Обработчик сохранения изменений исполнителя
  const handleSaveEdit = () => {
    // Implement save logic on backend
    // Реализовать логику сохранения на бэкенде
    console.log('Saving edits for performer:', editFormData);
    // Update local state
    // Обновляем локальное состояние
    setPerformers(performers.map(performer =>
      performer.id === editPerformerId ? { ...performer, ...editFormData } as Performer : performer
    ));
    toast({
        title: "Данные исполнителя обновлены", // Performer data updated
        description: "Изменения успешно сохранены.", // Changes saved successfully.
    });
    setEditPerformerId(null); // Close edit dialog // Закрываем диалог редактирования
  };

  // Handler to freeze/unfreeze a performer account
  // Обработчик заморозки/разморозки аккаунта исполнителя
  const handleFreeze = (id: string) => {
    // Update local state
    // Обновляем локальное состояние
    setPerformers(performers.map(performer =>
      performer.id === id ? { ...performer, status: performer.status === 'active' ? 'frozen' : 'active' } : performer
    ));
      toast({
          title: "Статус исполнителя изменен", // Performer status changed
          description: `Статус исполнителя с ID ${id} был изменен.`, // Status of performer with ID ${id} has been changed.
      });
     // Implement status change on backend
     // Реализовать изменение статуса на бэкенде
  };

  // Handler to delete a performer
  // Обработчик удаления исполнителя
  const handleDelete = (id: string) => {
    // Implement delete logic on backend
    // Реализовать логику удаления на бэкенде
    console.log('Deleting performer with id:', id);
    // Update local state
    // Обновляем локальное состояние
    setPerformers(performers.filter(performer => performer.id !== id));
    toast({
        title: "Исполнитель удален", // Performer deleted
        description: `Исполнитель с ID ${id} был удален.`, // Performer with ID ${id} has been deleted.
         variant: "destructive",
    });
  };

  // Handler to start editing a customer
  // Обработчик начала редактирования заказчика
  const handleEditCustomer = (id: string) => {
    const customerToEdit = customers.find(customer => customer.id === id);
    if (customerToEdit) {
      setEditCustomerId(id);
      setEditCustomerFormData(customerToEdit);
    }
  };

  // Handler for changes in the customer edit form
  // Обработчик изменений в форме редактирования заказчика
  const handleEditCustomerFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditCustomerFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handler to save customer edits
  // Обработчик сохранения изменений заказчика
  const handleSaveCustomerEdit = () => {
    // Implement save logic on backend
    // Реализовать логику сохранения на бэкенде
    console.log('Saving edits for customer:', editCustomerFormData);
    // Update local state
    // Обновляем локальное состояние
    setCustomers(customers.map(customer =>
      customer.id === editCustomerId ? { ...customer, ...editCustomerFormData } as Customer : customer
    ));
      toast({
          title: "Данные заказчика обновлены", // Customer data updated
          description: "Изменения успешно сохранены.", // Changes saved successfully.
      });
    setEditCustomerId(null); // Close edit dialog // Закрываем диалог редактирования
  };

  // Handler to delete a customer
  // Обработчик удаления заказчика
  const handleDeleteCustomer = (id: string) => {
    // Implement delete logic on backend
    // Реализовать логику удаления на бэкенде
    console.log('Deleting customer with id:', id);
    // Update local state
    // Обновляем локальное состояние
    setCustomers(customers.filter(customer => customer.id !== id));
     toast({
        title: "Заказчик удален", // Customer deleted
        description: `Заказчик с ID ${id} был удален.`, // Customer with ID ${id} has been deleted.
         variant: "destructive",
    });
  };

  // Handler to publish an article
  // Обработчик публикации статьи
  const handlePublishArticle = async () => {
    let finalMediaUrl = mediaUrl;
    let finalMediaType = mediaType;

    // Function to process publishing after media handling
    // Функция для обработки публикации после работы с медиа
    const processPublish = async (url: string) => {
         try {
            await createArticle(
                articleTitle,
                articleContent,
                url,
                finalMediaType,
                metaTitle,
                metaDescription,
                keywords,
                imageAltText
            );
            toast({
                title: 'Статья опубликована!', // Article published!
                description: 'Ваша статья успешно опубликована на сайте.', // Your article has been successfully published on the site.
            });
            resetArticleForm(); // Clear the form // Очистка формы
            fetchArticles(); // Refresh the article list // Обновление списка статей
        } catch (error) {
            console.error("Failed to publish article:", error);
            toast({
                variant: "destructive",
                title: 'Ошибка', // Error
                description: 'Не удалось опубликовать статью.', // Failed to publish article.
            });
        }
    };

    // If a media file is selected, read it as Data URL and then publish
    // Если выбран медиа файл, читаем его как Data URL и публикуем
    if (mediaFile) {
      finalMediaType = mediaFile.type.startsWith('image/') ? 'image' : 'video';
      const reader = new FileReader();
      reader.onloadend = async () => {
        finalMediaUrl = reader.result as string;
        await processPublish(finalMediaUrl);
      };
      reader.readAsDataURL(mediaFile);
    } else {
      // Otherwise, publish with the provided URL
      // Иначе публикуем с предоставленным URL
      await processPublish(finalMediaUrl);
    }
  };

  // Handler to start editing an article
  // Обработчик начала редактирования статьи
  const handleEditArticle = (articleId: string) => {
    const articleToEdit = articles.find(article => article.id === articleId);
    if (articleToEdit) {
      setEditingArticle(articleToEdit);
      setArticleTitle(articleToEdit.title);
      setArticleContent(articleToEdit.content);
      setMediaUrl(articleToEdit.mediaUrl || '');
      setMediaType(articleToEdit.mediaType || 'image');
      setMetaTitle(articleToEdit.metaTitle || '');
      setMetaDescription(articleToEdit.metaDescription || '');
      setKeywords(articleToEdit.keywords || '');
      setImageAltText(articleToEdit.imageAltText || '');
      //setSelectedArticleId(articleId); // Not used // Не используется
      setMediaFile(null); // Reset media file input // Сброс поля файла
    }
  };

  // Handler to update an article
  // Обработчик обновления статьи
  const handleUpdateArticle = async () => {
    if (!editingArticle) return;

    let finalMediaUrl = mediaUrl;
    let finalMediaType = mediaType;

    // Function to process update after media handling
    // Функция для обработки обновления после работы с медиа
    const processUpdate = async (url: string) => {
        const updatedArticle: Article = {
            id: editingArticle.id,
            title: articleTitle,
            content: articleContent,
            mediaUrl: url,
            mediaType: finalMediaType,
            metaTitle: metaTitle,
            metaDescription: metaDescription,
            keywords: keywords,
            imageAltText: imageAltText,
        };
         try {
            await updateArticle(updatedArticle);
            // Update local state
            // Обновляем локальное состояние
            setArticles(articles.map(article =>
                article.id === editingArticle.id ? updatedArticle : article
            ));
            resetArticleForm(); // Clear the form // Очистка формы
             toast({
                title: 'Статья обновлена!', // Article updated!
                description: 'Статья успешно обновлена.', // Article updated successfully.
            });
        } catch (error) {
            handleUpdateError(error); // Handle update error // Обработка ошибки обновления
        }
    };

    // If a new media file is selected, read it and then update
    // Если выбран новый медиа файл, читаем его и обновляем
     if (mediaFile) {
        finalMediaType = mediaFile.type.startsWith('image/') ? 'image' : 'video';
        const reader = new FileReader();
        reader.onloadend = async () => {
            finalMediaUrl = reader.result as string;
            await processUpdate(finalMediaUrl);
        };
        reader.readAsDataURL(mediaFile);
    } else {
        // Otherwise, update with the current or new URL
        // Иначе обновляем с текущим или новым URL
        await processUpdate(finalMediaUrl);
    }
  };

    // Function to handle update errors
    // Функция для обработки ошибок обновления
    const handleUpdateError = (error: unknown) => {
        console.error("Failed to update article:", error);
        toast({
            variant: "destructive",
            title: 'Ошибка', // Error
            description: 'Не удалось обновить статью.', // Failed to update article.
        });
    };

    // Function to reset the article form
    // Функция для сброса формы статьи
    const resetArticleForm = () => {
        setEditingArticle(null);
        setArticleTitle('');
        setArticleContent('');
        setMediaUrl('');
        setMediaType('image');
        setMetaTitle('');
        setMetaDescription('');
        setKeywords('');
        setImageAltText('');
        //setSelectedArticleId(null); // Not used // Не используется
        setMediaFile(null);
    };

  // Handler to delete an article
  // Обработчик удаления статьи
  const handleDeleteArticle = async (articleId: string) => {
    try {
      await deleteArticle(articleId);
      // Update local state
      // Обновляем локальное состояние
      setArticles(articles.filter(article => article.id !== articleId));
      toast({
        title: 'Статья удалена!', // Article deleted!
        description: 'Статья успешно удалена.', // Article deleted successfully.
        variant: "destructive",
      });
    } catch (error) {
      console.error("Failed to delete article:", error);
      toast({
        variant: "destructive",
        title: 'Ошибка', // Error
        description: 'Не удалось удалить статью.', // Failed to delete article.
      });
    }
  };

  // Handler for media URL input change
  // Обработчик изменения URL медиа
  const handleMediaUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMediaUrl(e.target.value);
     if (e.target.value) {
        setMediaFile(null); // Reset file if URL is entered // Сброс файла при вводе URL
    }
  };

  // Handler for media type select change
  // Обработчик изменения типа медиа
  const handleMediaTypeChange = (value: string) => {
    setMediaType(value as 'image' | 'video' | 'link');
  };

  // Handler for media file input change
  // Обработчик изменения файла медиа
  const handleMediaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      setMediaFile(file || null);
      if (file) {
        setMediaUrl(''); // Reset URL if file is selected // Сброс URL при выборе файла
        setMediaType(file.type.startsWith('image/') ? 'image' : 'video'); // Set type based on file // Установка типа по файлу
      }
  };

   // Filter performers based on search query
   // Фильтрация исполнителей по поисковому запросу
   const filteredPerformers = performers.filter(performer => {
     const query = performerSearchQuery.toLowerCase();
     return (
       performer.name.toLowerCase().includes(query) ||
       performer.email.toLowerCase().includes(query) ||
       performer.phone.includes(query) ||
       (performer.inn && performer.inn.includes(query)) || // Added check for inn existence // Добавлена проверка на существование inn
       (performer.companyName && performer.companyName.toLowerCase().includes(query)) // Added check for companyName existence // Добавлена проверка на существование companyName
     );
   });

   // Filter customers based on search query
   // Фильтрация заказчиков по поисковому запросу
   const filteredCustomers = customers.filter(customer => {
     const query = customerSearchQuery.toLowerCase();
     return (
       customer.name.toLowerCase().includes(query) ||
       customer.email.toLowerCase().includes(query) ||
       customer.phone.toLowerCase().includes(query)
     );
   });

    // Handler for time range change in analytics
    // Обработчик изменения временного диапазона в аналитике
    const handleTimeRangeChange = (value: string) => {
        setSelectedTimeRange(value);
        // fetchAnalyticsData(value); // Reload triggered by useEffect // Перезагрузка в useEffect
    };

    // Handler to add a new support manager
    // Обработчик добавления нового менеджера поддержки
    const handleAddSupportManager = async () => {
        if (!newManagerName.trim() || !newManagerEmail.trim()) {
            toast({ variant: "destructive", title: "Ошибка", description: "Введите имя и email нового менеджера." }); // Enter name and email for the new manager.
            return;
        }
        try {
            const newManager = await addSupportManager(newManagerName, newManagerEmail);
            setSupportManagers(prev => [...prev, newManager]);
            toast({ title: "Менеджер добавлен", description: `Менеджер "${newManager.name}" успешно добавлен.` }); // Manager added // Manager "${newManager.name}" added successfully.
            setNewManagerName('');
            setNewManagerEmail('');
            setIsAddManagerDialogOpen(false); // Close dialog // Закрываем диалог
        } catch (error) {
            console.error("Failed to add support manager:", error);
            toast({ variant: "destructive", title: "Ошибка", description: "Не удалось добавить менеджера поддержки." }); // Failed to add support manager.
        }
    };

    // Handler to remove a support manager
    // Обработчик удаления менеджера поддержки
    const handleRemoveSupportManager = async (managerId: string, managerName: string) => {
        // Add confirmation dialog before deleting
        // Добавить диалог подтверждения перед удалением
        try {
            await removeSupportManager(managerId);
            setSupportManagers(prev => prev.filter(manager => manager.id !== managerId));
            toast({ variant: "destructive", title: "Менеджер удален", description: `Менеджер "${managerName}" удален.` }); // Manager removed // Manager "${managerName}" removed.
        } catch (error) {
            console.error("Failed to remove support manager:", error);
            toast({ variant: "destructive", title: "Ошибка", description: "Не удалось удалить менеджера поддержки." }); // Failed to remove support manager.
        }
    };

    // --- Moderation functions --- // --- Функции модерации ---
    // Updated moderation type // Обновленный тип модерации
    const openModerationDialog = (
        id: string,
        type: 'profile' | 'gallery' | 'certificate' | 'letter',
        action: 'approve' | 'reject'
    ) => {
        setModerationItemId(id);
        setModerationItemType(type);
        setModerationAction(action);
        setRejectionReason(''); // Reset reason // Сброс причины
    };


    // Handler for moderation dialog submit
    // Обработчик отправки диалога модерации
    const handleModerationSubmit = async () => {
        if (!moderationItemId || !moderationItemType || !moderationAction) return;

        const isRejecting = moderationAction === 'reject';
        if (isRejecting && !rejectionReason.trim()) {
            toast({ variant: "destructive", title: "Ошибка", description: "Укажите причину отклонения." }); // Specify the rejection reason.
            return;
        }

        try {
            let successMessage = '';
            // Handle moderation based on item type
            // Обработка модерации в зависимости от типа элемента
            if (moderationItemType === 'profile') {
                if (moderationAction === 'approve') {
                    await approvePerformerProfile(moderationItemId);
                    successMessage = 'Профиль одобрен.'; // Profile approved.
                } else {
                    await rejectPerformerProfile(moderationItemId, rejectionReason);
                    successMessage = 'Профиль отклонен.'; // Profile rejected.
                }
                 // Update the list of profiles pending moderation
                 // Обновляем список профилей на модерацию
                setPendingProfiles(prev => prev.filter(p => p.id !== moderationItemId));
                // Update status in the general performer list
                // Обновляем статус в общем списке исполнителей
                setPerformers(prev => prev.map(p => p.id === moderationItemId ? { ...p, moderationStatus: moderationAction === 'approve' ? 'approved' : 'rejected' } : p));

            } else if (moderationItemType === 'gallery') {
                 const galleryItemData = pendingGallery.find(g => g.item.id === moderationItemId);
                 if (!galleryItemData) throw new Error("Элемент галереи не найден в очереди"); // Gallery item not found in queue
                if (moderationAction === 'approve') {
                    await approveGalleryItem(galleryItemData.performerId, moderationItemId);
                    successMessage = 'Работа в галерее одобрена.'; // Gallery work approved.
                } else {
                    await rejectGalleryItem(galleryItemData.performerId, moderationItemId, rejectionReason);
                    successMessage = 'Работа в галерее отклонена.'; // Gallery work rejected.
                }
                // Update the list of works pending moderation
                // Обновляем список работ на модерацию
                 setPendingGallery(prev => prev.filter(g => g.item.id !== moderationItemId));
            } else if (moderationItemType === 'certificate') { // Certificate moderation // Модерация сертификатов
                const certItemData = pendingCertificates.find(c => c.item.id === moderationItemId);
                if (!certItemData) throw new Error("Сертификат не найден в очереди"); // Certificate not found in queue
                if (moderationAction === 'approve') {
                    await approveCertificate(certItemData.performerId, moderationItemId);
                    successMessage = 'Сертификат одобрен.'; // Certificate approved.
                } else {
                    await rejectCertificate(certItemData.performerId, moderationItemId, rejectionReason);
                    successMessage = 'Сертификат отклонен.'; // Certificate rejected.
                }
                setPendingCertificates(prev => prev.filter(c => c.item.id !== moderationItemId));
            } else if (moderationItemType === 'letter') { // Letter moderation // Модерация писем
                 const letterItemData = pendingLetters.find(l => l.item.id === moderationItemId);
                 if (!letterItemData) throw new Error("Письмо не найдено в очереди"); // Letter not found in queue
                if (moderationAction === 'approve') {
                    await approveRecommendationLetter(letterItemData.performerId, moderationItemId);
                    successMessage = 'Благодарственное письмо одобрено.'; // Recommendation letter approved.
                } else {
                    await rejectRecommendationLetter(letterItemData.performerId, moderationItemId, rejectionReason);
                    successMessage = 'Благодарственное письмо отклонено.'; // Recommendation letter rejected.
                }
                 setPendingLetters(prev => prev.filter(l => l.item.id !== moderationItemId));
            }


            toast({ title: "Успех", description: successMessage }); // Success
        } catch (error) {
            console.error("Ошибка модерации:", error); // Moderation error:
            toast({ variant: "destructive", title: "Ошибка", description: "Не удалось выполнить действие модерации." }); // Failed to perform moderation action.
        } finally {
            // Reset moderation dialog state
            // Сброс состояния диалога модерации
            setModerationItemId(null);
            setModerationItemType(null);
            setModerationAction(null);
            setRejectionReason('');
        }
    };


   // Configuration for performers by region chart
   // Конфигурация для графика исполнителей по регионам
   const performersByRegionChartConfig = {
       value: { label: "Количество" }, // Quantity
       name: { label: "Регион" }, // Region
   };

   // Configuration for performers by role chart
   // Конфигурация для графика исполнителей по ролям
   const performersByRoleChartConfig = {
       value: { label: "Количество" }, // Quantity
       name: { label: "Роль" }, // Role
   };

   // Configuration for customers by region chart
   // Конфигурация для графика заказчиков по регионам
   const customersByRegionChartConfig = {
         value: { label: "Количество" }, // Quantity
         name: { label: "Регион" }, // Region
     };

   // Configuration for revenue chart
   // Конфигурация для графика доходов
   const revenueChartConfig = {
       subscriptionRevenue: { label: "Подписки", color: "hsl(var(--chart-1))" }, // Subscriptions
       requestRevenue: { label: "Запросы", color: "hsl(var(--chart-2))" }, // Requests
   };

   // --- Helper functions to display moderation status ---
   // --- Вспомогательные функции для отображения статуса модерации ---
    const getModerationStatusBadge = (status: RegisteredPerformer['moderationStatus']) => {
        switch (status) {
            case 'pending_approval':
                return <Badge variant="outline" className="text-yellow-600 border-yellow-400"><Hourglass className="mr-1 h-3 w-3" /> На модерации</Badge>; // Pending
            case 'approved':
                return <Badge variant="secondary" className="text-green-600 border-green-400"><ShieldCheck className="mr-1 h-3 w-3" /> Одобрен</Badge>; // Approved
            case 'rejected':
                return <Badge variant="destructive"><ShieldX className="mr-1 h-3 w-3" /> Отклонен</Badge>; // Rejected
            default:
                return null;
        }
    };

  // JSX structure of the admin panel
  // Структура JSX админ панели
  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold">Админ Панель</CardTitle> {/* Admin Panel */}
            <CardDescription>
              Управление платформой Eventomir. {/* Eventomir platform management. */}
            </CardDescription>
          </div>
           <div className="flex items-center space-x-4">
             <Link href="/notifications">
                 <Button variant="ghost" size="icon" className="relative">
                     <Bell className="h-5 w-5" />
                     {unreadAdminNotificationsCount > 0 && (
                         <Badge
                             variant="destructive"
                             className="absolute -top-1 -right-1 h-4 w-4 min-w-4 p-0 flex items-center justify-center rounded-full text-xs"
                         >
                             {unreadAdminNotificationsCount > 9 ? '9+' : unreadAdminNotificationsCount}
                         </Badge>
                      )}
                      <span className="sr-only">Уведомления</span> {/* Notifications */}
                 </Button>
              </Link>
             <Link href="/admin/settings">
                <Button variant="destructive">
                <Settings className="h-4 w-4 mr-2" />
                Настройки сайта {/* Site Settings */}
                </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Ошибка</AlertTitle> {/* Error */}
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Accordion type="multiple" defaultValue={["performers", "moderation", "customers", "content", "analytics", "support"]}>
            {/* Performer Management Section */}
            {/* Раздел управления исполнителями */}
            <AccordionItem value="performers">
              <AccordionTrigger>Управление исполнителями</AccordionTrigger> {/* Performer Management */}
              <AccordionContent>
                <div className="mb-4 relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Поиск по имени, email, телефону, ИНН, компании..." // Search by name, email, phone, INN, company...
                        value={performerSearchQuery}
                        onChange={(e) => setPerformerSearchQuery(e.target.value)}
                        className="pl-8 w-full md:w-1/2 lg:w-1/3"
                    />
                 </div>
                {loadingPerformers ? (
                  <div>Загрузка исполнителей...</div> // Loading performers...
                ) : (
                  <ScrollArea className="max-h-[400px]">
                    <Table>
                      <TableCaption>Список зарегистрированных исполнителей</TableCaption> {/* List of registered performers */}
                      <TableHeader>
                        <TableRow>
                          <TableHead>Имя</TableHead> {/* Name */}
                          <TableHead>Email</TableHead>
                          <TableHead>Телефон</TableHead> {/* Phone */}
                          <TableHead>Компания</TableHead> {/* Company */}
                          <TableHead>ИНН</TableHead> {/* INN */}
                          <TableHead>Роли</TableHead> {/* Roles */}
                          <TableHead>Город</TableHead> {/* City */}
                          <TableHead>Рейтинг</TableHead> {/* Rating */}
                          <TableHead>Статус Аккаунта</TableHead> {/* Account Status */}
                          <TableHead>Статус Модерации</TableHead> {/* Moderation Status */} {/* New column */} {/* Новая колонка */}
                          <TableHead>Действия</TableHead> {/* Actions */}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPerformers.length > 0 ? (
                            filteredPerformers.map((performer) => (
                              <TableRow key={performer.id}>
                                <TableCell>{performer.name}</TableCell>
                                <TableCell>{performer.email}</TableCell>
                                <TableCell>{performer.phone}</TableCell>
                                <TableCell>{performer.companyName}</TableCell>
                                <TableCell>{performer.inn}</TableCell>
                                <TableCell>
                                  {performer.roles.map((role) => (
                                    <Badge key={role} variant="secondary" className="mr-1">{role}</Badge>
                                  ))}
                                </TableCell>
                                <TableCell>{performer.city}</TableCell>
                                  <TableCell>
                                    {(performer.averageRating !== undefined && performer.averageRating !== null) ? (
                                        <div className="flex items-center gap-1">
                                            <RatingStars value={performer.averageRating} readOnly size={16} />
                                            ({performer.averageRating.toFixed(1)})
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground">Нет оценок</span> // No ratings
                                    )}
                                </TableCell>
                                  <TableCell>
                                      <Badge variant={performer.status === 'active' ? 'default' : 'destructive'}>
                                          {performer.status === 'active' ? 'Активен' : 'Заморожен'} {/* Active / Frozen */}
                                      </Badge>
                                  </TableCell>
                                  <TableCell> {/* Display moderation status */} {/* Отображение статуса модерации */}
                                       {getModerationStatusBadge(performer.moderationStatus)}
                                  </TableCell>
                                  <TableCell>
                                      <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                              <Button variant="ghost" className="h-8 w-8 p-0">
                                                  <span className="sr-only">Открыть меню</span> {/* Open menu */}
                                                  <Settings className="h-4 w-4" />
                                              </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                              <DropdownMenuItem onClick={() => handleEditPerformer(performer.id)}>
                                                  <Pencil className="mr-2 h-4 w-4" />
                                                  Редактировать {/* Edit */}
                                              </DropdownMenuItem>
                                              <DropdownMenuItem onClick={() => handleFreeze(performer.id)}>
                                                  <UserX className="mr-2 h-4 w-4" />
                                                  {performer.status === 'active' ? 'Заморозить' : 'Активировать'} {/* Freeze / Activate */}
                                              </DropdownMenuItem>
                                              {/* Profile moderation buttons if pending */}
                                              {/* Кнопки модерации профиля, если он на рассмотрении */}
                                              {performer.moderationStatus === 'pending_approval' && (
                                                  <>
                                                       <Separator />
                                                       <DropdownMenuItem onClick={() => openModerationDialog(performer.id, 'profile', 'approve')} className="text-green-600">
                                                          <ShieldCheck className="mr-2 h-4 w-4" /> Одобрить профиль {/* Approve profile */}
                                                       </DropdownMenuItem>
                                                       <DropdownMenuItem onClick={() => openModerationDialog(performer.id, 'profile', 'reject')} className="text-destructive">
                                                           <ShieldX className="mr-2 h-4 w-4" /> Отклонить профиль {/* Reject profile */}
                                                       </DropdownMenuItem>
                                                       <Separator />
                                                  </>
                                              )}
                                              <DropdownMenuItem onClick={() => handleDelete(performer.id)} className="text-destructive">
                                                  <User className="mr-2 h-4 w-4" />
                                                  Удалить {/* Delete */}
                                              </DropdownMenuItem>
                                          </DropdownMenuContent>
                                      </DropdownMenu>
                                  </TableCell>
                              </TableRow>
                            ))
                          ) : (
                              <TableRow>
                                  <TableCell colSpan={11} className="h-24 text-center">
                                     Исполнители не найдены. {/* Performers not found. */}
                                  </TableCell>
                              </TableRow>
                          )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </AccordionContent>
            </AccordionItem>

             {/* Moderation Section */}
             {/* Раздел модерации */}
             <AccordionItem value="moderation">
                 <AccordionTrigger>Очередь модерации</AccordionTrigger> {/* Moderation Queue */}
                 <AccordionContent>
                     {loadingModeration ? (
                         <div>Загрузка очереди модерации...</div> // Loading moderation queue...
                     ) : (
                         <div className="space-y-6">
                             {/* Profile Moderation */}
                             {/* Модерация профилей */}
                             <div>
                                 <h3 className="text-lg font-medium mb-2">Профили на модерации ({pendingProfiles.length})</h3> {/* Profiles pending moderation */}
                                 {pendingProfiles.length === 0 ? (
                                     <p className="text-muted-foreground">Нет профилей, ожидающих модерации.</p> // No profiles pending moderation.
                                 ) : (
                                     <ScrollArea className="max-h-[300px]">
                                         <Table>
                                             <TableHeader>
                                                 <TableRow>
                                                     <TableHead>Исполнитель</TableHead> {/* Performer */}
                                                     <TableHead>Email</TableHead>
                                                     <TableHead>Дата регистрации/изменения</TableHead> {/* Registration/Modification Date */}
                                                     <TableHead>Действия</TableHead> {/* Actions */}
                                                 </TableRow>
                                             </TableHeader>
                                             <TableBody>
                                                 {pendingProfiles.map(profile => (
                                                     <TableRow key={profile.id}>
                                                         <TableCell>{profile.name} ({profile.companyName})</TableCell>
                                                         <TableCell>{profile.email}</TableCell>
                                                          <TableCell>Не указано</TableCell> {/* Not specified */} {/* Add last modification date */} {/* Добавить дату последнего изменения */}
                                                         <TableCell className="space-x-2">
                                                             <Button size="sm" variant="secondary" className="text-green-600" onClick={() => openModerationDialog(profile.id, 'profile', 'approve')}>
                                                                 <ShieldCheck className="mr-1 h-4 w-4" /> Одобрить {/* Approve */}
                                                             </Button>
                                                             <Button size="sm" variant="destructive" onClick={() => openModerationDialog(profile.id, 'profile', 'reject')}>
                                                                 <ShieldX className="mr-1 h-4 w-4" /> Отклонить {/* Reject */}
                                                             </Button>
                                                              {/* Add button to view changes */} {/* Добавить кнопку просмотра изменений */}
                                                         </TableCell>
                                                     </TableRow>
                                                 ))}
                                             </TableBody>
                                         </Table>
                                     </ScrollArea>
                                 )}
                             </div>

                             <Separator />

                             {/* Gallery Work Moderation */}
                             {/* Модерация работ в галерее */}
                              <div>
                                 <h3 className="text-lg font-medium mb-2">Работы в галерее на модерации ({pendingGallery.length})</h3> {/* Gallery works pending moderation */}
                                  {pendingGallery.length === 0 ? (
                                     <p className="text-muted-foreground">Нет работ, ожидающих модерации.</p> // No works pending moderation.
                                 ) : (
                                     <ScrollArea className="max-h-[300px]">
                                          <div className="space-y-4">
                                             {pendingGallery.map(galleryItem => (
                                                 <Card key={galleryItem.item.id}>
                                                     <CardContent className="p-4 flex items-start gap-4">
                                                          {/* Display the first image from the array */}
                                                          {/* Отображаем первое изображение из массива */}
                                                          <img src={galleryItem.item.imageUrls[0]} alt={galleryItem.item.imageAltText || "Работа"} className="w-20 h-20 object-cover rounded-md flex-shrink-0" data-ai-hint="gallery moderation image" /> {/* Work */}
                                                         <div className="flex-grow space-y-1">
                                                             <p><strong>Исполнитель:</strong> {galleryItem.performerName} (ID: {galleryItem.performerId})</p> {/* Performer */}
                                                             <p className="text-sm"><strong>Описание:</strong> {galleryItem.item.description || "Нет"}</p> {/* Description / None */}
                                                             <p className="text-xs text-muted-foreground"><strong>Alt текст:</strong> {galleryItem.item.imageAltText || "Нет"}</p> {/* Alt text / None */}
                                                             <p className="text-xs text-muted-foreground"><strong>Кол-во фото:</strong> {galleryItem.item.imageUrls.length}</p> {/* Photo count */}
                                                             {/* Display other SEO fields if needed */} {/* Отображать другие SEO поля, если нужно */}
                                                         </div>
                                                         <div className="flex flex-col gap-2 flex-shrink-0">
                                                             <Button size="sm" variant="secondary" className="text-green-600" onClick={() => openModerationDialog(galleryItem.item.id, 'gallery', 'approve')}>
                                                                 <ShieldCheck className="mr-1 h-4 w-4" /> Одобрить {/* Approve */}
                                                             </Button>
                                                             <Button size="sm" variant="destructive" onClick={() => openModerationDialog(galleryItem.item.id, 'gallery', 'reject')}>
                                                                 <ShieldX className="mr-1 h-4 w-4" /> Отклонить {/* Reject */}
                                                             </Button>
                                                         </div>
                                                     </CardContent>
                                                 </Card>
                                             ))}
                                         </div>
                                     </ScrollArea>
                                 )}
                             </div>

                             <Separator />

                             {/* Certificate Moderation */}
                             {/* Модерация сертификатов */}
                            <div>
                                <h3 className="text-lg font-medium mb-2 flex items-center gap-2"><Award className="h-5 w-5"/> Сертификаты на модерации ({pendingCertificates.length})</h3> {/* Certificates pending moderation */}
                                {pendingCertificates.length === 0 ? (
                                    <p className="text-muted-foreground">Нет сертификатов, ожидающих модерации.</p> // No certificates pending moderation.
                                ) : (
                                    <ScrollArea className="max-h-[300px]">
                                        <div className="space-y-4">
                                            {pendingCertificates.map(certItem => (
                                                <Card key={certItem.item.id}>
                                                    <CardContent className="p-4 flex items-center justify-between gap-4">
                                                        <div className="flex items-center gap-3 flex-grow">
                                                             {/* Add preview or link to file */} {/* Добавить превью или ссылку на файл */}
                                                            <FileText className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                                                            <div className="min-w-0">
                                                                <p className="truncate"><strong>Исполнитель:</strong> {certItem.performerName}</p> {/* Performer */}
                                                                <p className="text-sm truncate"><strong>Описание:</strong> {certItem.item.description || "Нет"}</p> {/* Description / None */}
                                                                {/* Add link to view file */} {/* Добавить ссылку для просмотра файла */}
                                                                 <a href={certItem.item.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Просмотреть файл</a> {/* View file */}
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2 flex-shrink-0">
                                                            <Button size="sm" variant="secondary" className="text-green-600" onClick={() => openModerationDialog(certItem.item.id, 'certificate', 'approve')}>
                                                                <ShieldCheck className="mr-1 h-4 w-4" /> Одобрить {/* Approve */}
                                                            </Button>
                                                            <Button size="sm" variant="destructive" onClick={() => openModerationDialog(certItem.item.id, 'certificate', 'reject')}>
                                                                <ShieldX className="mr-1 h-4 w-4" /> Отклонить {/* Reject */}
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                )}
                            </div>

                            <Separator />

                             {/* Recommendation Letter Moderation */}
                             {/* Модерация благодарственных писем */}
                            <div>
                                <h3 className="text-lg font-medium mb-2 flex items-center gap-2"><BookCheck className="h-5 w-5"/> Благодарственные письма на модерации ({pendingLetters.length})</h3> {/* Recommendation letters pending moderation */}
                                {pendingLetters.length === 0 ? (
                                    <p className="text-muted-foreground">Нет писем, ожидающих модерации.</p> // No letters pending moderation.
                                ) : (
                                    <ScrollArea className="max-h-[300px]">
                                        <div className="space-y-4">
                                            {pendingLetters.map(letterItem => (
                                                <Card key={letterItem.item.id}>
                                                     <CardContent className="p-4 flex items-center justify-between gap-4">
                                                        <div className="flex items-center gap-3 flex-grow">
                                                            <FileText className="h-6 w-6 text-muted-foreground flex-shrink-0" />
                                                             <div className="min-w-0">
                                                                <p className="truncate"><strong>Исполнитель:</strong> {letterItem.performerName}</p> {/* Performer */}
                                                                <p className="text-sm truncate"><strong>Описание:</strong> {letterItem.item.description || "Нет"}</p> {/* Description / None */}
                                                                {/* Add link to view file */} {/* Добавить ссылку для просмотра файла */}
                                                                <a href={letterItem.item.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Просмотреть файл</a> {/* View file */}
                                                            </div>
                                                        </div>
                                                         <div className="flex gap-2 flex-shrink-0">
                                                            <Button size="sm" variant="secondary" className="text-green-600" onClick={() => openModerationDialog(letterItem.item.id, 'letter', 'approve')}>
                                                                <ShieldCheck className="mr-1 h-4 w-4" /> Одобрить {/* Approve */}
                                                            </Button>
                                                            <Button size="sm" variant="destructive" onClick={() => openModerationDialog(letterItem.item.id, 'letter', 'reject')}>
                                                                <ShieldX className="mr-1 h-4 w-4" /> Отклонить {/* Reject */}
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                )}
                            </div>

                         </div>
                     )}
                 </AccordionContent>
             </AccordionItem>


            {/* Customer Management Section */}
            {/* Раздел управления заказчиками */}
            <AccordionItem value="customers">
              <AccordionTrigger>Управление заказчиками</AccordionTrigger> {/* Customer Management */}
              <AccordionContent>
                 <div className="mb-4 relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Поиск по имени, email, телефону..." // Search by name, email, phone...
                        value={customerSearchQuery}
                        onChange={(e) => setCustomerSearchQuery(e.target.value)}
                        className="pl-8 w-full md:w-1/2 lg:w-1/3"
                    />
                 </div>
                {loadingCustomers ? (
                  <div>Загрузка заказчиков...</div> // Loading customers...
                ) : (
                  <ScrollArea className="max-h-[400px]">
                    <Table>
                     <TableCaption>Список зарегистрированных заказчиков</TableCaption> {/* List of registered customers */}
                      <TableHeader>
                        <TableRow>
                          <TableHead>Имя</TableHead> {/* Name */}
                          <TableHead>Email</TableHead>
                          <TableHead>Телефон</TableHead> {/* Phone */}
                          <TableHead>Город</TableHead> {/* City */}
                          <TableHead>Дата рег.</TableHead> {/* Reg. Date */}
                          <TableHead>Действия</TableHead> {/* Actions */}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                         {filteredCustomers.length > 0 ? (
                            filteredCustomers.map((customer) => (
                              <TableRow key={customer.id}>
                                <TableCell>{customer.name}</TableCell>
                                <TableCell>{customer.email}</TableCell>
                                <TableCell>{customer.phone}</TableCell>
                                <TableCell>{customer.city}</TableCell>
                                <TableCell>{customer.registrationDate}</TableCell>
                                <TableCell>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Открыть меню</span> {/* Open menu */}
                                        <Settings className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handleEditCustomer(customer.id)}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Редактировать {/* Edit */}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => handleDeleteCustomer(customer.id)} className="text-destructive">
                                        <User className="mr-2 h-4 w-4" />
                                        Удалить {/* Delete */}
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))
                         ) : (
                             <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                     Заказчики не найдены. {/* Customers not found. */}
                                </TableCell>
                            </TableRow>
                         )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </AccordionContent>
            </AccordionItem>

             {/* Support Management Section */}
             {/* Раздел управления поддержкой */}
             <AccordionItem value="support">
                <AccordionTrigger>Управление поддержкой</AccordionTrigger> {/* Support Management */}
                <AccordionContent>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Менеджеры поддержки</h3> {/* Support Managers */}
                        <Dialog open={isAddManagerDialogOpen} onOpenChange={setIsAddManagerDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="destructive">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Добавить менеджера {/* Add Manager */}
                                </Button>
                            </DialogTrigger>
                             <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Добавить менеджера поддержки</DialogTitle> {/* Add Support Manager */}
                                    <DialogDescription>Введите имя и email нового менеджера.</DialogDescription> {/* Enter name and email for the new manager. */}
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="managerName" className="text-right">Имя</Label> {/* Name */}
                                        <Input
                                            id="managerName"
                                            value={newManagerName}
                                            onChange={(e) => setNewManagerName(e.target.value)}
                                            className="col-span-3"
                                            placeholder="Иван Иванов" // Ivan Ivanov
                                        />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="managerEmail" className="text-right">Email</Label>
                                        <Input
                                            id="managerEmail"
                                            type="email"
                                            value={newManagerEmail}
                                            onChange={(e) => setNewManagerEmail(e.target.value)}
                                            className="col-span-3"
                                            placeholder="manager@example.com"
                                        />
                                    </div>
                                     {/* Add password field or invitation sending */} {/* Добавить поле для пароля или отправку приглашения */}
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild><Button type="button" variant="outline">Отмена</Button></DialogClose> {/* Cancel */}
                                    <Button type="button" variant="destructive" onClick={handleAddSupportManager}>Добавить</Button> {/* Add */}
                                </DialogFooter>
                             </DialogContent>
                        </Dialog>
                    </div>
                     {loadingSupportManagers ? (
                        <div>Загрузка менеджеров поддержки...</div> // Loading support managers...
                    ) : (
                        <ScrollArea className="max-h-[400px]">
                            <Table>
                                <TableCaption>Список менеджеров поддержки</TableCaption> {/* List of support managers */}
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Имя</TableHead> {/* Name */}
                                        <TableHead>Email</TableHead>
                                        <TableHead>Дата добавления</TableHead> {/* Date Added */}
                                        <TableHead>Действия</TableHead> {/* Actions */}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {supportManagers.length > 0 ? (
                                        supportManagers.map((manager) => (
                                            <TableRow key={manager.id}>
                                                <TableCell>{manager.name}</TableCell>
                                                <TableCell>{manager.email}</TableCell>
                                                <TableCell>{new Date(manager.addedAt).toLocaleDateString('ru-RU')}</TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="destructive"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => handleRemoveSupportManager(manager.id, manager.name)}
                                                        title="Удалить менеджера" // Delete manager
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                         <span className="sr-only">Удалить</span> {/* Delete */}
                                                    </Button>
                                                    {/* Add edit/reset password button if needed */} {/* Добавить кнопку редактирования/сброса пароля, если нужно */}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">
                                                Менеджеры поддержки не добавлены. {/* No support managers added. */}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    )}
                    {/* Add section for viewing/managing support requests */} {/* Добавить секцию для просмотра/управления запросами в поддержку */}
                </AccordionContent>
            </AccordionItem>

            {/* Content Management Section (Blog) */}
            {/* Раздел управления контентом сайта (Блог) */}
            <AccordionItem value="content">
              <AccordionTrigger>Управление контентом сайта (Блог)</AccordionTrigger> {/* Site Content Management (Blog) */}
              <AccordionContent>
                <ScrollArea className="max-h-[400px]">
                {articles.map(article => (
                  <Card key={article.id} className="mb-4">
                    <CardHeader>
                      <CardTitle>{article.title}</CardTitle>
                      <CardDescription>
                        {article.content.substring(0, 100)}...
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {article.mediaUrl && (
                        <div className="mb-4">
                          {article.mediaType === 'image' && (
                            <img src={article.mediaUrl} alt={article.imageAltText || article.title} className="max-h-40 rounded-md" data-ai-hint="article blog post"/>
                          )}
                          {article.mediaType === 'video' && (
                             <video controls src={article.mediaUrl} className="max-h-40 rounded-md" title={article.imageAltText || article.title} />
                          )}
                          {article.mediaType === 'link' && (
                            <a href={article.mediaUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
                              Ссылка на внешний ресурс {/* Link to external resource */}
                            </a>
                          )}
                        </div>
                      )}
                       <div className="text-xs text-muted-foreground space-y-1 mt-2">
                            {article.metaTitle && <p><strong>Meta Title:</strong> {article.metaTitle}</p>}
                            {article.metaDescription && <p><strong>Meta Desc:</strong> {article.metaDescription.substring(0,50)}...</p>}
                            {article.keywords && <p><strong>Ключевые слова:</strong> {article.keywords}</p>} {/* Keywords */}
                            {article.imageAltText && (article.mediaType === 'image' || article.mediaType === 'video') && <p><strong>Alt текст:</strong> {article.imageAltText}</p>} {/* Alt text */}
                        </div>
                      <div className="flex space-x-2 mt-4">
                          <Button variant="secondary" onClick={() => handleEditArticle(article.id)} className="mr-2">Редактировать</Button> {/* Edit */}
                          <Button variant="destructive" onClick={() => handleDeleteArticle(article.id)}>Удалить</Button> {/* Delete */}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                </ScrollArea>
                <Separator className="my-4" />
                 <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="add-edit-article">
                         <AccordionTrigger>
                             {editingArticle ? 'Редактировать статью' : 'Добавить новую статью'} {/* Edit article / Add new article */}
                         </AccordionTrigger>
                         <AccordionContent>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="articleTitle">Заголовок статьи:</Label> {/* Article Title: */}
                                <Input
                                  type="text"
                                  id="articleTitle"
                                  value={articleTitle}
                                  onChange={(e) => setArticleTitle(e.target.value)}
                                />
                              </div>
                              <div>
                                <Label htmlFor="articleContent">Содержание статьи:</Label> {/* Article Content: */}
                                <Textarea
                                  id="articleContent"
                                  className="min-h-[200px]"
                                  value={articleContent}
                                  onChange={(e) => setArticleContent(e.target.value)}
                                />
                              </div>
                               <Separator className="my-4" />
                                <h4 className="text-md font-semibold">Медиа</h4> {/* Media */}
                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                   <div>
                                      <Label htmlFor="mediaFile">Загрузить изображение/видео:</Label> {/* Upload image/video: */}
                                      <Input
                                          type="file"
                                          id="mediaFile"
                                          accept="image/*, video/*"
                                          onChange={handleMediaFileChange}
                                          className="block mt-2"
                                           disabled={!!mediaUrl}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="mediaUrl">URL изображения/видео/ссылки:</Label> {/* Image/Video/Link URL: */}
                                        <Input
                                          type="text"
                                          id="mediaUrl"
                                          value={mediaUrl}
                                          onChange={handleMediaUrlChange}
                                           disabled={!!mediaFile}
                                        />
                                     </div>
                                      <div>
                                        <Label htmlFor="mediaType">Тип медиа:</Label> {/* Media Type: */}
                                        <Select value={mediaType} onValueChange={handleMediaTypeChange} disabled={!!mediaFile}>
                                          <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Выберите тип" /> {/* Select type */}
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="image">Изображение</SelectItem> {/* Image */}
                                            <SelectItem value="video">Видео</SelectItem> {/* Video */}
                                            <SelectItem value="link">Ссылка</SelectItem> {/* Link */}
                                          </SelectContent>
                                        </Select>
                                     </div>
                                      {(mediaType === 'image' || mediaType === 'video') && (mediaFile || mediaUrl) && (
                                        <div>
                                            <Label htmlFor="imageAltText"><FileImage className="inline h-4 w-4 mr-1" /> Alt текст для изображения/видео:</Label> {/* Alt text for image/video: */}
                                            <Input
                                                type="text"
                                                id="imageAltText"
                                                value={imageAltText}
                                                onChange={(e) => setImageAltText(e.target.value)}
                                                placeholder="Краткое описание изображения для SEO" // Short description of the image for SEO
                                            />
                                        </div>
                                       )}
                               </div>
                               <Separator className="my-4" />
                                <h4 className="text-md font-semibold">SEO Настройки</h4> {/* SEO Settings */}
                               <div className="space-y-4">
                                   <div>
                                        <Label htmlFor="metaTitle"><BookText className="inline h-4 w-4 mr-1" /> Meta Title (Заголовок для поисковиков):</Label> {/* Meta Title (Title for search engines): */}
                                        <Input
                                            type="text"
                                            id="metaTitle"
                                            value={metaTitle}
                                            onChange={(e) => setMetaTitle(e.target.value)}
                                            maxLength={60}
                                            placeholder="Привлекательный заголовок (до 60 символов)" // Catchy title (up to 60 characters)
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="metaDescription"><BookText className="inline h-4 w-4 mr-1" /> Meta Description (Описание для поисковиков):</Label> {/* Meta Description (Description for search engines): */}
                                        <Textarea
                                            id="metaDescription"
                                            value={metaDescription}
                                            onChange={(e) => setMetaDescription(e.target.value)}
                                            maxLength={160}
                                            placeholder="Краткое описание статьи (до 160 символов)" // Short description of the article (up to 160 characters)
                                            className="min-h-[80px]"
                                        />
                                    </div>
                                     <div>
                                        <Label htmlFor="keywords"><Tags className="inline h-4 w-4 mr-1" /> Ключевые слова (через запятую):</Label> {/* Keywords (comma-separated): */}
                                        <Input
                                            type="text"
                                            id="keywords"
                                            value={keywords}
                                            onChange={(e) => setKeywords(e.target.value)}
                                            placeholder="Пример: свадьба, фотограф, москва" // Example: wedding, photographer, moscow
                                        />
                                    </div>
                               </div>

                              {editingArticle ? (
                                <Button variant="destructive" onClick={handleUpdateArticle}>Сохранить изменения</Button> // Save changes
                              ) : (
                                <Button variant="destructive" onClick={handlePublishArticle}>Опубликовать статью</Button> // Publish article
                              )}
                               {editingArticle && (
                                    <Button variant="outline" onClick={resetArticleForm} className="ml-2">Отмена</Button> // Cancel
                                )}
                            </div>
                         </AccordionContent>
                    </AccordionItem>
                 </Accordion>
              </AccordionContent>
            </AccordionItem>

             {/* Analytics Section */}
             {/* Раздел аналитики */}
            <AccordionItem value="analytics">
                <AccordionTrigger>Аналитика</AccordionTrigger> {/* Analytics */}
                <AccordionContent className="space-y-6">
                    <div className="flex items-center gap-4">
                        <Label htmlFor="timeRange"><CalendarDays className="inline h-4 w-4 mr-1"/> Временной диапазон:</Label> {/* Time Range: */}
                        <Select value={selectedTimeRange} onValueChange={handleTimeRangeChange}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Выберите период" /> {/* Select period */}
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="last7days">Последние 7 дней</SelectItem> {/* Last 7 days */}
                                <SelectItem value="last30days">Последние 30 дней</SelectItem> {/* Last 30 days */}
                                <SelectItem value="last90days">Последние 90 дней</SelectItem> {/* Last 90 days */}
                                <SelectItem value="lastYear">Последний год</SelectItem> {/* Last year */}
                                <SelectItem value="allTime">За все время</SelectItem> {/* All time */}
                            </SelectContent>
                        </Select>
                    </div>

                    {loadingAnalytics ? (
                        <div>Загрузка аналитики...</div> // Loading analytics...
                    ) : analyticsData ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2"><Users2 className="h-5 w-5"/>Исполнители</CardTitle> {/* Performers */}
                                     <CardDescription>Всего: {analyticsData.totalPerformers}</CardDescription> {/* Total: */}
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="h-[200px]">
                                         <h4 className="text-sm font-medium mb-2 flex items-center gap-1"><Map className="h-4 w-4"/>По регионам</h4> {/* By Region */}
                                         <ChartContainer config={performersByRegionChartConfig} className="h-full w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={performersByRegionChartData} layout="vertical" margin={{ right: 20 }}>
                                                    <XAxis type="number" hide />
                                                    <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={10} width={80} />
                                                    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                                    <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={4} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </ChartContainer>
                                    </div>
                                    <div className="h-[200px]">
                                         <h4 className="text-sm font-medium mb-2 flex items-center gap-1"><Tags className="h-4 w-4"/>По ролям</h4> {/* By Role */}
                                         <ChartContainer config={performersByRoleChartConfig} className="h-full w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                 <BarChart data={performersByRoleChartData} layout="vertical" margin={{ right: 20 }}>
                                                     <XAxis type="number" hide />
                                                     <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={10} width={80} />
                                                     <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                                     <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={4} />
                                                 </BarChart>
                                            </ResponsiveContainer>
                                        </ChartContainer>
                                    </div>
                                    {/* Add charts/indicators for rating, completed orders */} {/* Добавить графики/индикаторы рейтинга, выполненных заказов */}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                     <CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5"/>Заказчики</CardTitle> {/* Customers */}
                                     <CardDescription>Всего: {analyticsData.totalCustomers}</CardDescription> {/* Total: */}
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="h-[200px]">
                                         <h4 className="text-sm font-medium mb-2 flex items-center gap-1"><Map className="h-4 w-4"/>По регионам</h4> {/* By Region */}
                                        <ChartContainer config={customersByRegionChartConfig} className="h-full w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                 <BarChart data={customersByRegionChartData} layout="vertical" margin={{ right: 20 }}>
                                                     <XAxis type="number" hide />
                                                     <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={10} width={80} />
                                                     <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                                     <Bar dataKey="value" fill="hsl(var(--chart-3))" radius={4} />
                                                 BarChart data={customersByRegionChartData} layout="vertical" margin={{ right: 20 }}>
                                                     <XAxis type="number" hide />
                                                     <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} tickMargin={10} width={80} />
                                                     <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                                     <Bar dataKey="value" fill="hsl(var(--chart-3))" radius={4} />
                                                 </BarChart>
                                            </ResponsiveContainer>
                                        </ChartContainer>
                                    </div>
                                      <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                                        (Графики активности и источников будут добавлены позже) {/* (Activity and source charts will be added later) */}
                                    </div>
                                </CardContent>
                            </Card>

                             <Card className="lg:col-span-2">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2"><DollarSign className="h-5 w-5"/>Финансы</CardTitle> {/* Finances */}
                                    <CardDescription>Общий доход: {analyticsData.totalRevenue.toLocaleString()} руб.</CardDescription> {/* Total Revenue: */}
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[250px]">
                                         <ChartContainer config={revenueChartConfig} className="h-full w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="name" />} />
                                                    <Pie data={revenueChartData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={5}>
                                                        {revenueChartData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                                        ))}
                                                    Pie>
                                                    <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        ChartContainer>
                                    </div>
                                </CardContent>
                             Card>

                        div>
                    ) : (
                        <p className="text-muted-foreground">Не удалось загрузить данные аналитики.</p> // Could not load analytics data.
                    )}
                AccordionContent>
            </AccordionItem>
          Accordion>
        CardContent>
      Card>

        {/* Performer Edit Dialog */}
        {/* Диалог редактирования исполнителя */}
      Dialog open={editPerformerId !== null} onOpenChange={() => setEditPerformerId(null)}>
        DialogContent>
          DialogHeader>
            DialogTitle>Редактировать исполнителя</DialogTitle> {/* Edit Performer */}
            DialogDescription>
              Измените информацию об исполнителе. {/* Change performer information. */}
            DialogDescription>
          ScrollArea className="max-h-[70vh]">
          div className="grid gap-4 py-4 px-6">
            div className="grid grid-cols-4 items-center gap-4">
              Label htmlFor="edit-name" className="text-right">
                Имя: {/* Name: */}
              Label>
              Input
                type="text"
                id="edit-name"
                name="name"
                value={editFormData.name || ""}
                onChange={handleEditFormChange}
                className="col-span-3"
              />
            div>
            div className="grid grid-cols-4 items-center gap-4">
              Label htmlFor="edit-companyName" className="text-right">
                Компания: {/* Company: */}
              Label>
              Input
                type="text"
                id="edit-companyName"
                name="companyName"
                value={editFormData.companyName || ""}
                onChange={handleEditFormChange}
                className="col-span-3"
              />
            div>
            div className="grid grid-cols-4 items-center gap-4">
              Label htmlFor="edit-email" className="text-right">
                Email:
              Label>
              Input
                type="email"
                id="edit-email"
                name="email"
                value={editFormData.email || ""}
                onChange={handleEditFormChange}
                className="col-span-3"
              />
            div>
            div className="grid grid-cols-4 items-center gap-4">
              Label htmlFor="edit-phone" className="text-right">
                Телефон: {/* Phone: */}
              Label>
              Input
                type="text"
                id="edit-phone"
                name="phone"
                value={editFormData.phone || ""}
                onChange={handleEditFormChange}
                className="col-span-3"
              />
            div>
            div className="grid grid-cols-4 items-center gap-4">
              Label htmlFor="edit-inn" className="text-right">
                ИНН: {/* INN: */}
              Label>
              Input
                type="text"
                id="edit-inn"
                name="inn"
                value={editFormData.inn || ""}
                onChange={handleEditFormChange}
                className="col-span-3"
              />
            div>
            div className="grid grid-cols-4 items-center gap-4">
              Label htmlFor="edit-city" className="text-right">
                Город: {/* City: */}
              Label>
              Input
                type="text"
                id="edit-city"
                name="city"
                value={editFormData.city || ""}
                onChange={handleEditFormChange}
                className="col-span-3"
              />
            div>
            div className="grid grid-cols-4 items-start gap-4">
              Label htmlFor="edit-description" className="text-right">
                Описание: {/* Description: */}
              Label>
              Textarea
                id="edit-description"
                name="description"
                value={editFormData.description || ""}
                onChange={handleEditFormChange}
                className="col-span-3 min-h-[100px]"
              />
            div>
          div>
          ScrollArea>
          div className="px-6 pb-4">
            Button variant="destructive" onClick={handleSaveEdit}>Сохранить измененияButton> {/* Save changes */}
          div>
        DialogContent>
      Dialog>

        {/* Customer Edit Dialog */}
        {/* Диалог редактирования заказчика */}
      Dialog open={editCustomerId !== null} onOpenChange={() => setEditCustomerId(null)}>
        DialogContent>
          DialogHeader>
            DialogTitle>Редактировать заказчикаDialogTitle> {/* Edit Customer */}
            DialogDescription>
              Измените информацию о заказчике. {/* Change customer information. */}
            DialogDescription>
          DialogHeader>
           ScrollArea className="max-h-[70vh]">
          div className="grid gap-4 py-4 px-6">
            div className="grid grid-cols-4 items-center gap-4">
              Label htmlFor="edit-customer-name" className="text-right">
                Имя: {/* Name: */}
              Label>
              Input
                type="text"
                id="edit-customer-name"
                name="name"
                value={editCustomerFormData.name || ""}
                onChange={handleEditCustomerFormChange}
                className="col-span-3"
              />
            div>
            div className="grid grid-cols-4 items-center gap-4">
              Label htmlFor="edit-customer-email" className="text-right">
                Email:
              Label>
              Input
                type="email"
                id="edit-customer-email"
                name="email"
                value={editCustomerFormData.email || ""}
                onChange={handleEditCustomerFormChange}
                className="col-span-3"
              />
            div>
            div className="grid grid-cols-4 items-center gap-4">
              Label htmlFor="edit-customer-phone" className="text-right">
                Телефон: {/* Phone: */}
              Label>
              Input
                type="text"
                id="edit-customer-phone"
                name="phone"
                value={editCustomerFormData.phone || ""}
                onChange={handleEditCustomerFormChange}
                className="col-span-3"
              />
            div>
            div className="grid grid-cols-4 items-center gap-4">
              Label htmlFor="edit-customer-city" className="text-right">
                Город: {/* City: */}
              Label>
              Input
                type="text"
                id="edit-customer-city"
                name="city"
                value={editCustomerFormData.city || ""}
                onChange={handleEditCustomerFormChange}
                className="col-span-3"
              />
            div>
          div>
          ScrollArea>
          div className="px-6 pb-4">
              Button variant="destructive" onClick={handleSaveCustomerEdit}>Сохранить измененияButton> {/* Save changes */}
          div>
        DialogContent>
      Dialog>

        {/* Moderation Confirmation Dialog */}
        {/* Диалог подтверждения модерации */}
        Dialog open={!!moderationItemId} onOpenChange={() => setModerationItemId(null)}>
            DialogContent className="sm:max-w-[425px]">
                DialogHeader>
                    DialogTitle>Подтверждение модерацииDialogTitle> {/* Moderation Confirmation */}
                    DialogDescription>
                         Вы уверены, что хотите {moderationAction === 'approve' ? 'одобрить' : 'отклонить'} этот элемент? {/* Are you sure you want to {approve/reject} this item? */}
                     DialogDescription>
                 DialogHeader>
                 {moderationAction === 'reject' && (
                     div className="grid gap-4 py-4">
                         Label htmlFor="rejectionReason">Причина отклоненияLabel> {/* Rejection Reason */}
                         Textarea
                             id="rejectionReason"
                             value={rejectionReason}
                             onChange={(e) => setRejectionReason(e.target.value)}
                             placeholder="Укажите причину отклонения..." // Specify the rejection reason...
                         />
                     div>
                 )}
                 DialogFooter>
                     DialogClose asChild>
                         Button type="button" variant="outline">ОтменаButton> {/* Cancel */}
                     DialogClose>
                     Button
                         type="button"
                         variant={moderationAction === 'approve' ? 'secondary' : 'destructive'}
                         onClick={handleModerationSubmit}
                         disabled={moderationAction === 'reject' && !rejectionReason.trim()}
                     >
                         {moderationAction === 'approve' ? 'Одобрить' : 'Отклонить'} {/* Approve / Reject */}
                     Button>
                 DialogFooter>
             DialogContent>
         Dialog>

    div>
  );
};

export default AdminPanel;
