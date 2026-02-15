
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, User, ShieldQuestion } from "@/components/icons"; // Import icons // Импорт иконок
import { getMessages, sendMessage, requestSupport } from '@/services/chat'; // Import chat services // Импорт сервисов чата
import type { ChatMessage } from '@/services/chat'; // Import message type // Импорт типа сообщения
import { useToast } from '@/hooks/use-toast'; // Import hook for notifications // Импорт хука для уведомлений
import { format } from 'date-fns'; // Import format function // Импорт функции format

interface ChatDialogProps {
    isOpen: boolean; // Whether the dialog is open // Открыт ли диалог
    onClose: () => void; // Function to close the dialog // Функция закрытия диалога
    chatId: string; // ID of the chat // ID чата
    performerName: string; // Performer's name for the title // Имя исполнителя для заголовка
    currentUserId: string; // ID of the current user (customer) // ID текущего пользователя (заказчика)
    performerId: string; // ID of the performer // ID исполнителя
}

const ChatDialog: React.FC<ChatDialogProps> = ({
    isOpen,
    onClose,
    chatId,
    performerName,
    currentUserId,
    performerId,
}) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]); // State for storing messages // Состояние для хранения сообщений
    const [newMessage, setNewMessage] = useState(''); // State for the new message input // Состояние для нового сообщения
    const [isLoading, setIsLoading] = useState(false); // Message loading state // Состояние загрузки сообщений
    const [isSending, setIsSending] = useState(false); // Message sending state // Состояние отправки сообщения
    const [isRequestingSupport, setIsRequestingSupport] = useState(false); // Support request state // Состояние запроса поддержки
    const scrollAreaRef = useRef<HTMLDivElement>(null); // Ref for the scroll area // Ref для области прокрутки
    const { toast } = useToast(); // Hook for notifications // Хук для уведомлений

    // Function to load messages // Функция для загрузки сообщений
    const fetchMessages = useCallback(async () => {
        if (!chatId) return;
        setIsLoading(true);
        try {
            const fetchedMessages = await getMessages(chatId);
            setMessages(fetchedMessages);
            // Scroll down after loading messages // Прокрутка вниз после загрузки сообщений
             setTimeout(() => scrollToBottom(), 100); // Small delay for rendering // Небольшая задержка для рендера
        } catch (error) {
            console.error("Ошибка загрузки сообщений:", error); // Error loading messages:
            toast({ variant: "destructive", title: "Ошибка", description: "Не удалось загрузить сообщения." }); // Error // Could not load messages.
        } finally {
            setIsLoading(false);
        }
    }, [chatId, toast]); // Dependencies: chatId, toast // Зависимости: chatId, toast

    // Function to scroll to the bottom of the message list
    // Функция для прокрутки в конец списка сообщений
    const scrollToBottom = () => {
        if (scrollAreaRef.current) {
            // Use scrollIntoView for the last element
            // Используем scrollIntoView для последнего элемента
            const lastMessageElement = scrollAreaRef.current.querySelector('[data-last-message="true"]');
             if (lastMessageElement) {
                 lastMessageElement.scrollIntoView({ behavior: 'smooth' });
             }
        }
    };


    // Load messages when the dialog opens or chatId changes
    // Загрузка сообщений при открытии диалога и при изменении chatId
    useEffect(() => {
        if (isOpen && chatId) {
            fetchMessages();

             // Set interval for periodic message updates (optional)
             // Установка интервала для периодического обновления сообщений (опционально)
             const intervalId = setInterval(fetchMessages, 5000); // Update every 5 seconds // Обновлять каждые 5 секунд

            // Clear interval when the dialog closes or chatId changes
            // Очистка интервала при закрытии диалога или изменении chatId
            return () => clearInterval(intervalId);
        }
    }, [isOpen, chatId, fetchMessages]); // Dependencies: isOpen, chatId, fetchMessages // Зависимости: isOpen, chatId, fetchMessages

     // Scroll down when a new message is added
     // Прокрутка вниз при добавлении нового сообщения
     useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom();
        }
     }, [messages]); // Dependency: messages // Зависимость: messages


    // Function to send a message // Функция отправки сообщения
    const handleSendMessage = async () => {
        if (!newMessage.trim() || !chatId || isSending) return;

        // Check for links // Проверка на наличие ссылок
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        if (urlRegex.test(newMessage)) {
            toast({ variant: "destructive", title: "Ошибка", description: "Отправка ссылок запрещена." }); // Error // Sending links is prohibited.
            return;
        }
        // Add checks for other forbidden elements if necessary
        // Добавить проверку на другие запрещенные элементы, если необходимо

        setIsSending(true);
        try {
            const sentMessage = await sendMessage(chatId, currentUserId, newMessage);
            setMessages(prev => [...prev, sentMessage]); // Add new message to the list // Добавляем новое сообщение в список
            setNewMessage(''); // Clear input field // Очищаем поле ввода
            scrollToBottom(); // Scroll down after sending // Прокрутка вниз после отправки
        } catch (error) {
            console.error("Ошибка отправки сообщения:", error); // Error sending message:
            toast({ variant: "destructive", title: "Ошибка", description: "Не удалось отправить сообщение." }); // Error // Could not send message.
        } finally {
            setIsSending(false);
        }
    };

    // Function to request support // Функция запроса поддержки
    const handleRequestSupport = async () => {
        if (!chatId || isRequestingSupport) return;
        setIsRequestingSupport(true);
        try {
            await requestSupport(chatId, currentUserId);
            toast({ title: "Поддержка запрошена", description: "Менеджер скоро подключится к чату." }); // Support requested // A manager will join the chat soon.
            // Can add a system message to the chat about the support request
            // Можно добавить системное сообщение в чат о запросе поддержки
             const supportMessage: ChatMessage = {
                id: `support-${Date.now()}`,
                chatId: chatId,
                senderId: 'system', // Special ID for system messages // Специальный ID для системных сообщений
                senderName: 'Система', // System
                content: 'Пользователь запросил помощь поддержки.', // User requested support.
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, supportMessage]);
            scrollToBottom();
        } catch (error) {
            console.error("Ошибка запроса поддержки:", error); // Error requesting support:
            toast({ variant: "destructive", title: "Ошибка", description: "Не удалось запросить поддержку." }); // Error // Could not request support.
        } finally {
            setIsRequestingSupport(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] flex flex-col h-[80vh]">
                <DialogHeader>
                    <DialogTitle>Чат с {performerName}</DialogTitle> {/* Chat with {performerName} */}
                    <DialogDescription>
                        Обсудите детали вашего мероприятия. Отправка ссылок и файлов запрещена. {/* Discuss the details of your event. Sending links and files is prohibited. */}
                    </DialogDescription>
                </DialogHeader>
            
                {/* Message Area */} {/* Область сообщений */}
                <ScrollArea className="flex-grow border rounded-md p-4 mb-4" ref={scrollAreaRef}>
                    {isLoading ? (
                        <p className="text-center text-muted-foreground">Загрузка сообщений...</p> // Loading messages...
                    ) : messages.length === 0 ? (
                        <p className="text-center text-muted-foreground">Нет сообщений. Начните диалог первым!</p> // No messages. Start the conversation first!
                    ) : (
                        <div className="space-y-4">
                            {messages.map((msg, index) => (
                                <div
                                    key={msg.id} 
                                    className={`flex items-start gap-3 ${msg.senderId === currentUserId ? 'justify-end' : ''}`} // Align current user's messages to the right // Выравниваем сообщения текущего пользователя справа
                                     // Add attribute for the last message // Добавляем атрибут для последнего сообщения
                                    data-last-message={index === messages.length - 1 ? 'true' : undefined}
                                >
                                     {/* Sender Avatar (if not current user and not system) */}
                                     {/* Аватар отправителя (если это не текущий пользователь и не система) */}
                                     {msg.senderId !== currentUserId && msg.senderId !== 'system' && (
                                         <Avatar className="h-8 w-8">
                                             {/* Get performer's avatar URL */} {/* Получить URL аватара исполнителя */}
                                             {/*  <AvatarImage src={performerAvatarUrl} alt={performerName} /> */}
                                             <AvatarFallback>{performerName.substring(0, 1).toUpperCase()}</AvatarFallback>
                                         </Avatar> 
                                      )}

                                    {/* Message Block */}                                 
                                    <div className={`rounded-lg p-3 max-w-[75%] ${
                                            msg.senderId === currentUserId
                                                ? 'bg-primary text-primary-foreground' // Current user's message // Сообщение текущего пользователя
                                                : msg.senderId === 'system'
                                                    ? 'bg-yellow-100 text-yellow-800 w-full text-center text-sm italic' // System message // Системное сообщение
                                                    : 'bg-muted' // Other user's message // Сообщение собеседника
                                        }`}>
                                         {/* Sender Name (for other user's messages) */}
                                         {/* Имя отправителя (для сообщений собеседника) */}
                                        {msg.senderId !== currentUserId && msg.senderId !== 'system' && (                                          
                                             <p className="text-xs font-medium mb-1">{msg.senderName}</p>
                                         )}
                                        <p className="text-sm">{msg.content}</p>
                                         {/* Timestamp */} {/* Временная метка */}
                                         <p className={`text-xs mt-1 ${
                                             msg.senderId === currentUserId ? 'text-primary-foreground/70' : msg.senderId === 'system' ? 'text-yellow-600' : 'text-muted-foreground'
                                          } ${msg.senderId !== 'system' ? (msg.senderId === currentUserId ? 'text-right' : 'text-left') : 'text-center'}`}>
                                            {format(new Date(msg.timestamp), 'HH:mm')}
                                        </p>
                                    </div>

                                     {/* Current User Avatar */} {/* Аватар текущего пользователя */}
                                    {msg.senderId === currentUserId && (
                                        <Avatar className="h-8 w-8">
                                             {/* Get current user's avatar URL */} {/* Получить URL аватара текущего пользователя */}
                                            {/* <AvatarImage src={currentUserAvatarUrl} alt="Вы" /> */} {/* You */}
                                            <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                                        </Avatar>
                                    )}                                    
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {/* Input Field and Buttons */} {/* Поле ввода и кнопки */}
                <DialogFooter className="flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex-grow flex items-center gap-2">
                        <Input
                            placeholder="Введите сообщение..." // Enter message...
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && !isSending && handleSendMessage()} // Send on Enter key press // Отправка по нажатию Enter
                            disabled={isSending || isRequestingSupport} // Disable while sending or requesting support // Отключить во время отправки или запроса поддержки
                            className="flex-grow"
                        />                      
                         <Button onClick={handleSendMessage} disabled={isSending || !newMessage.trim() || isRequestingSupport} variant="destructive" size="icon">
                             <Send className="h-4 w-4" />
                             <span className="sr-only">Отправить</span> {/* Send */}
                         </Button>
                    </div>
                    {/* Support Request Button */} {/* Кнопка запроса поддержки */}
                    <Button onClick={handleRequestSupport} disabled={isRequestingSupport || isSending} variant="outline" size="sm">
                        <ShieldQuestion className="mr-2 h-4 w-4" />
                        Поддержка {/* Support */}
                    </Button>
                     {/* Close Button */} {/* Кнопка Закрыть */}
                     <DialogClose asChild>
                        <Button type="button" variant="secondary" onClick={onClose}>
                            Закрыть {/* Close */}
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ChatDialog;
