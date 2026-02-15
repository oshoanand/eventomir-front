'use client';

import { useState } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { requestPasswordReset } from '@/services/auth'; // Import the service function // Импорт функции сервиса
import Link from 'next/link'; // Import Link // Импорт Link

// Validation schema for password reset request form
// Схема валидации формы запроса сброса пароля
const formSchema = z.object({
    email: z.string().email({
        message: 'Пожалуйста, введите корректный адрес электронной почты.', // Please enter a valid email address.
    }),
});

const ForgotPasswordPage = () => {
    const [isSubmitting, setIsSubmitting = useState(false); // State for submission tracking // Состояние для отслеживания отправки
    const [isSubmitted, setIsSubmitted = useState(false); // Track if the form has been submitted // Отслеживаем, была ли отправлена форма
    const { toast } = useToast(); // Hook for displaying notifications // Хук для отображения уведомлений

    // Form initialization with react-hook-form and zodResolver
    // Инициализация формы с помощью react-hook-form и zodResolver
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: '',
        },
    });

    // Form submission handler
    // Функция обработки отправки формы
    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSubmitting(true); // Set submitting flag // Устанавливаем флаг отправки
        setIsSubmitted(false); // Reset submission state on new attempt // Сбрасываем состояние отправки при новой попытке
        try {
            // Call the password reset request function
            // Вызываем функцию запроса сброса пароля
            const result = await requestPasswordReset(values.email);

            if (result.success) {
                toast({
                    title: 'Запрос отправлен', // Request sent
                    description: result.message,
                });
                setIsSubmitted(true); // Set submission state to true // Устанавливаем состояние отправки в true
                form.reset(); // Optionally clear the form // Опционально очищаем форму
            } else {
                // Show error, but potentially use the same generic success message
                // for security (don't reveal if email exists)
                // Показываем ошибку, но потенциально используем то же общее сообщение об успехе
                // из соображений безопасности (не раскрываем, существует ли email)
                toast({
                    variant: 'destructive', // Or default, depending on security preference // Или default, в зависимости от предпочтений безопасности
                    title: 'Запрос отправлен', // Generic title // Общий заголовок
                    description: result.message, // Generic message // Общее сообщение
                });
                // Keep isSubmitted false or handle as needed // Оставляем isSubmitted false или обрабатываем по необходимости
            }
        } catch (error) {
            console.error("Password reset request error:", error);
            toast({
                variant: 'destructive',
                title: 'Ошибка', // Error
                description: 'Не удалось отправить запрос на сброс пароля. Пожалуйста, попробуйте еще раз.', // Could not send password reset request. Please try again.
            });
        } finally {
            setIsSubmitting(false); // Reset submitting flag // Сбрасываем флаг отправки
        }
    };

    return (
        div className="container mx-auto py-10 flex justify-center">
            Card className="w-full max-w-md">
                CardHeader>
                    CardTitle>Восстановление пароляCardTitle> {/* Password Recovery */}
                    CardDescription>
                        Введите ваш email, чтобы получить инструкции по сбросу пароля. {/* Enter your email to receive password reset instructions. */}
                    CardDescription>
                CardHeader>
                CardContent>
                    {isSubmitted ? (
                        // Show verification message if submitted
                        // Показываем сообщение о верификации, если отправлено
                        div className="text-center p-4 border border-green-500 bg-green-50 rounded-md text-green-800">
                            p className="font-semibold">Проверьте вашу почту!p> {/* Check your email! */}
                            p className="text-sm">Инструкции по сбросу пароля были отправлены на ваш email, если он зарегистрирован в системе.p> {/* Password reset instructions have been sent to your email if it is registered in the system. */}
                            Button variant="link" asChild className="mt-4 text-green-800">
                                Link href="/login">Вернуться ко входуLink> {/* Back to login */}
                            Button>
                        div>
                    ) : (
                        // Show the form if not submitted
                        // Показываем форму, если не отправлено
                        Form {...form}>
                            form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                {/* Email Field */} {/* Поле Email */}
                                FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        FormItem>
                                            FormLabel>EmailFormLabel>
                                            FormControl>
                                                Input
                                                    placeholder="example@mail.com"
                                                    {...field}
                                                    type="email"
                                                />
                                            FormControl>
                                            FormMessage /> {/* Validation error message */} {/* Сообщение об ошибке валидации */}
                                        FormItem>
                                    )}
                                />
                                {/* "Send Instructions" Button */} {/* Кнопка "Отправить инструкции" */}
                                Button variant="destructive" type="submit" disabled={isSubmitting} className="w-full">
                                    {isSubmitting ? 'Отправка...' : 'Отправить инструкции'} {/* Sending... / Send Instructions */}
                                Button>
                            form>
                        Form>
                    )}
                     {/* "Back to Login" Link */} {/* Ссылка "Вернуться ко входу" */}
                     {!isSubmitted && (
                        div className="mt-4 text-center text-sm">
                            Link href="/login" className="underline text-muted-foreground hover:text-primary">
                                Вернуться ко входу {/* Back to login */}
                            Link>
                        div>
                    )}
                CardContent>
            Card>
        div>
    );
};

export default ForgotPasswordPage;
