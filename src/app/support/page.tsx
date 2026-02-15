"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { User, MessageSquare, ShieldQuestion, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
// TODO: Import service for getting support profile and requests
// TODO: Импортировать сервис для получения профиля поддержки и запросов
// import { getSupportProfile, getSupportRequests } from "@/services/support";
// import type { SupportAuthProfile } from "@/services/auth"; // Type for profile // Тип для профиля
// import type { SupportRequest } from "@/services/support"; // Type for support request // Тип для запроса в поддержку

// Mock data (replace with real data)
// Имитация данных (заменить реальными)
interface SupportRequest {
    id: string;
    chatId: string;
    requesterId: string;
    requesterName: string; // Name of the requester // Имя запросившего
    createdAt: Date;
    status: 'open' | 'in_progress' | 'closed';
    assignedManagerId?: string; // ID of the manager who took the request // ID менеджера, который взял запрос
}

// Mock support profile data
// Имитация данных профиля поддержки
const mockSupportProfile = {
    id: 'support-1',
    name: 'Мария Поддержкина', // Maria Supportkina
    email: 'support1@eventomir.com',
};

// Mock support requests
// Имитация запросов в поддержку
const mockSupportRequests: SupportRequest[] = [
    { id: 'sup-req-1', chatId: 'chat-example-id-1', requesterId: 'cust456', requesterName: 'Тестовый Заказчик', createdAt: new Date(2024, 7, 16, 14, 0), status: 'open' }, // Test Customer
    { id: 'sup-req-2', chatId: 'chat-example-id-2', requesterId: 'perf123', requesterName: 'Тест Исполнитель', createdAt: new Date(2024, 7, 16, 15, 30), status: 'in_progress', assignedManagerId: 'support-1' }, // Test Performer
];


const SupportProfilePage = () => {
    // const [profile, setProfile] = useState<SupportAuthProfile | null>(null); // For real data // Для реальных данных
    const [profile, setProfile] = useState(mockSupportProfile); // Using mock data // Используем заглушку
    const [requests, setRequests] = useState<SupportRequest[]>(mockSupportRequests); // Using mock data // Используем заглушку
    const [isLoadingProfile, setIsLoadingProfile] = useState(false); // Initially false for mock data // Изначально false для заглушки
    const [isLoadingRequests, setIsLoadingRequests] = useState(false); // Initially false for mock data // Изначально false для заглушки
    const { toast } = useToast();
    const router = useRouter();

    // TODO: Get current support manager ID from authentication context
    // TODO: Получить ID текущего менеджера поддержки из контекста аутентификации
    const currentSupportManagerId = 'support-1'; // Placeholder // Заглушка

    /* // Commented out as we are using mock data
       // Закомментировано, т.к. используем заглушки
    useEffect(() => {
        const fetchProfile = async () => {
            setIsLoadingProfile(true);
            try {
                // const data = await getSupportProfile(currentSupportManagerId);
                // setProfile(data);
            } catch (error) {
                console.error("Ошибка загрузки профиля поддержки:", error); // Error loading support profile:
                toast({ variant: "destructive", title: "Ошибка", description: "Не удалось загрузить профиль." }); // Error // Could not load profile.
            } finally {
                setIsLoadingProfile(false);
            }
        };

        const fetchRequests = async () => {
            setIsLoadingRequests(true);
            try {
                // const data = await getSupportRequests(); // Get all open/assigned requests // Получаем все открытые/назначенные запросы
                // setRequests(data);
            } catch (error) {
                console.error("Ошибка загрузки запросов в поддержку:", error); // Error loading support requests:
                toast({ variant: "destructive", title: "Ошибка", description: "Не удалось загрузить запросы." }); // Error // Could not load requests.
            } finally {
                setIsLoadingRequests(false);
            }
        };

        fetchProfile();
        fetchRequests();
    }, [currentSupportManagerId, toast]);
    */

    // Logout handler
    // Обработчик выхода
    const handleLogout = () => {
        // TODO: Implement logout logic
        // TODO: Реализовать выход из системы
        console.log("Выход из системы..."); // Logging out...
        toast({ title: "Выход", description: "Вы вышли из системы." }); // Logout // You have logged out.
        router.push('/login');
    };

    // Handler to take a request
    // Обработчик взятия запроса в работу
    const handleTakeRequest = (requestId: string) => {
        // TODO: Implement logic to take the request (assign to self)
        // TODO: Реализовать взятие запроса в работу (назначение себе)
        console.log(`Взятие в работу запроса ${requestId}...`); // Taking request ${requestId}...
        setRequests(prev => prev.map(req => req.id === requestId ? { ...req, status: 'in_progress', assignedManagerId: currentSupportManagerId } : req));
        toast({ title: "Запрос взят в работу", description: `Вы начали обрабатывать запрос ${requestId}.` }); // Request taken // You started processing request ${requestId}.
    };

    // Handler to open chat
    // Обработчик открытия чата
    const handleOpenChat = (chatId: string) => {
        // TODO: Open the chat component with the specified chatId
        // TODO: Открыть компонент чата с указанным chatId
        console.log(`Открытие чата ${chatId}...`); // Opening chat ${chatId}...
        // Example: Use a modal or navigate to a separate chat page
        // Например, можно использовать модальное окно или перейти на отдельную страницу чата
        toast({ title: "Открытие чата", description: `Открытие чата ${chatId} (заглушка).` }); // Opening chat // Opening chat ${chatId} (placeholder).
         // router.push(`/support/chat/${chatId}`);
    };

    // Handler to close a request
    // Обработчик закрытия запроса
    const handleCloseRequest = (requestId: string) => {
         // TODO: Implement logic to close the request
         // TODO: Реализовать закрытие запроса
        console.log(`Закрытие запроса ${requestId}...`); // Closing request ${requestId}...
        setRequests(prev => prev.map(req => req.id === requestId ? { ...req, status: 'closed' } : req));
        toast({ title: "Запрос закрыт", description: `Запрос ${requestId} успешно закрыт.` }); // Request closed // Request ${requestId} closed successfully.
    }

    // Loading skeletons
    // Скелеты загрузки
    const ProfileSkeleton = () => (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-1/2 mb-2" /> {/* Title Skeleton */}
                <Skeleton className="h-4 w-3/4" /> {/* Description Skeleton */}
            </CardHeader>
            <CardContent>
                <Skeleton className="h-4 w-1/3" /> {/* Content Skeleton */}
            </CardContent>
        </Card>
    );
    const RequestsSkeleton = () => (
         <Card>
            <CardHeader>
                <Skeleton className="h-5 w-1/4 mb-1" /> {/* Title Skeleton */}
                <Skeleton className="h-4 w-1/2" /> {/* Description Skeleton */}
            </CardHeader>
             <CardContent className="space-y-4">
                <Skeleton className="h-16 w-full" /> {/* Request Item Skeleton */}
                <Skeleton className="h-16 w-full" /> {/* Request Item Skeleton */}
             </CardContent>
        </Card>
    );

    // Display loading state if profile is loading
    // Отображаем состояние загрузки, если профиль загружается
    if (isLoadingProfile) {
        return <div className="container mx-auto py-10"><ProfileSkeleton /></div>;
    }

    // Display message if profile is not found
    // Отображаем сообщение, если профиль не найден
    if (!profile) {
        return <div className="container mx-auto py-10 text-center">Профиль не найден. Возможно, вам нужно войти.</div>; // Profile not found. Perhaps you need to log in.
    }

    return (
        <div className="container mx-auto py-10 space-y-8">
            {/* Manager Profile Card */}
            {/* Карточка профиля менеджера */}
            <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                        <CardTitle className="flex items-center gap-2"><User className="h-5 w-5"/> Профиль менеджера поддержки</CardTitle> {/* Support Manager Profile */}
                        <CardDescription>Ваши данные и панель управления.</CardDescription> {/* Your data and control panel. */}
                    </div>
                     <div className="flex gap-2">
                        {/* TODO: Add link to support profile settings */}
                        {/* TODO: Добавить ссылку на настройки профиля поддержки */}
                        {/* <Link href="/support/settings">
                            <Button variant="outline" size="icon"><Settings className="h-4 w-4" /></Button>
                        </Link> */}
                        <Button variant="outline" size="sm" onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" /> Выйти {/* Log Out */}
                        </Button>
                     </div>
                </CardHeader>
                <CardContent>
                    <p><strong>Имя:</strong> {profile.name}</p> {/* Name: */}
                    <p><strong>Email:</strong> {profile.email}</p>
                </CardContent>
            </Card>

            {/* Support Requests List */}
            {/* Список запросов в поддержку */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ShieldQuestion className="h-5 w-5"/> Запросы в поддержку</CardTitle> {/* Support Requests */}
                    <CardDescription>Просмотр и обработка запросов от пользователей.</CardDescription> {/* View and process user requests. */}
                </CardHeader>
                <CardContent>
                     {isLoadingRequests ? (
                        <RequestsSkeleton />
                    ) : requests.length === 0 ? (
                        <p className="text-center text-muted-foreground">Активных запросов в поддержку нет.</p> // No active support requests.
                    ) : (
                        <div className="space-y-4">
                            {requests.map((req) => (
                                <Card key={req.id} className={
                                    req.status === 'open' ? "border-l-4 border-yellow-500" : // Open
                                    req.status === 'in_progress' && req.assignedManagerId === currentSupportManagerId ? "border-l-4 border-blue-500" : // In progress (yours)
                                    req.status === 'in_progress' ? "border-l-4 border-gray-400 opacity-70" : // In progress (other manager) // В работе у другого
                                    "border-l-4 border-green-500" // Closed // Закрыт
                                }>
                                    <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                                        <div className="space-y-1 md:col-span-2">
                                            <p><strong>Запрос от:</strong> {req.requesterName} (ID: {req.requesterId})</p> {/* Request from: */}
                                            <p className="text-sm text-muted-foreground"><strong>Время:</strong> {new Date(req.createdAt).toLocaleString('ru-RU')}</p> {/* Time: */}
                                            <p className="text-sm"><strong>Статус:</strong> { // Status:
                                                req.status === 'open' ? 'Открыт' : // Open
                                                req.status === 'in_progress' && req.assignedManagerId === currentSupportManagerId ? 'В работе (у вас)' : // In progress (yours)
                                                req.status === 'in_progress' ? 'В работе (другой менеджер)' : // In progress (other manager)
                                                'Закрыт' // Closed
                                            }</p>
                                        </div>
                                        <div className="flex flex-col md:items-end gap-2">
                                            {/* Show "Take Request" button if open */}
                                            {/* Показываем кнопку "Взять в работу", если открыт */}
                                            {req.status === 'open' && (
                                                <Button size="sm" variant="destructive" onClick={() => handleTakeRequest(req.id)}>
                                                    Взять в работу {/* Take Request */}
                                                </Button>
                                            )}
                                            {/* Show "Open Chat" button if open or assigned to current manager */}
                                            {/* Показываем кнопку "Открыть чат", если открыт или назначен текущему менеджеру */}
                                            {(req.status === 'open' || (req.status === 'in_progress' && req.assignedManagerId === currentSupportManagerId)) && (
                                                <Button size="sm" variant="outline" onClick={() => handleOpenChat(req.chatId)}>
                                                    <MessageSquare className="mr-2 h-4 w-4" /> Открыть чат {/* Open Chat */}
                                                </Button>
                                            )}
                                             {/* Show "Close Request" button if assigned to current manager */}
                                             {/* Показываем кнопку "Закрыть запрос", если назначен текущему менеджеру */}
                                             {req.status === 'in_progress' && req.assignedManagerId === currentSupportManagerId && (
                                                <Button size="sm" variant="secondary" onClick={() => handleCloseRequest(req.id)}>
                                                   Закрыть запрос {/* Close Request */}
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default SupportProfilePage;