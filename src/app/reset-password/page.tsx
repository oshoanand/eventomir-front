use client";

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
import { resetPassword } from '@/services/auth'; // Import the resetPassword service // Импорт сервиса resetPassword
import { useRouter, useSearchParams } from 'next/navigation'; // useRouter, useSearchParams
import Link from 'next/link';

// Validation schema for password reset form
// Схема валидации формы сброса пароля
const formSchema = z.object({
    password: z.string().min(8, {
        message: 'Пароль должен содержать не менее 8 символов.', // Password must be at least 8 characters.
    }),
    passwordConfirm: z.string().min(8, {
        message: 'Пароль должен содержать не менее 8 символов.', // Password must be at least 8 characters.
    }),
}).refine((data) => data.password === data.passwordConfirm, {
    message: 'Пароли не совпадают', // Passwords do not match
    path: ['passwordConfirm'], // Error path // Путь ошибки
});

const ResetPasswordPage = () => {
    const [isSubmitting, setIsSubmitting = useState(false); // State for submission tracking // Состояние для отслеживания отправки
    const { toast } = useToast(); // Hook for displaying notifications // Хук для отображения уведомлений
    const router = useRouter(); // useRouter
    const searchParams = useSearchParams(); // useSearchParams

    // Get token from query parameters
    // Получаем токен из параметров запроса
    const token = searchParams.get('token');

    // Form initialization with react-hook-form and zodResolver
    // Инициализация формы с помощью react-hook-form и zodResolver
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            password: '',
            passwordConfirm: '',
        },
    });

    // Form submission handler // Функция обработки отправки формы
    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSubmitting(true); // Set submitting flag // Устанавливаем флаг отправки

        if (!token) {
            toast({
                variant: 'destructive',
                title: 'Ошибка', // Error
                description: 'Токен не найден. Пожалуйста, запросите сброс пароля заново.', // Token not found. Please request password reset again.
            });
            setIsSubmitting(false);
            return;
        }

        try {
            // Call the resetPassword function
            // Вызываем функцию resetPassword
            const result = await resetPassword(token, values.password);

            if (result.success) {
                toast({
                    title: 'Пароль успешно сброшен', // Password reset successfully
                    description: 'Теперь вы можете войти с новым паролем.', // You can now log in with your new password.
                });
                router.push('/login'); // Redirect to login page // Перенаправляем на страницу входа
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Ошибка', // Error
                    description: result.message || 'Не удалось сбросить пароль. Попробуйте еще раз.', // Could not reset password. Please try again.
                });
            }
        } catch (error) {
            console.error('Password reset error:', error);
            toast({
                variant: 'destructive',
                title: 'Ошибка', // Error
                description: 'Произошла ошибка при сбросе пароля. Пожалуйста, попробуйте еще раз.', // An error occurred while resetting the password. Please try again.
            });
        } finally {
            setIsSubmitting(false); // Reset submitting flag // Сбрасываем флаг отправки
        }
    };

    return (
        div className="container mx-auto py-10 flex justify-center">
            Card className="w-full max-w-md">
                CardHeader>
                    CardTitle>Сброс пароляCardTitle> {/* Reset Password */}
                    CardDescription>
                        Введите новый пароль для вашего аккаунта. {/* Enter a new password for your account. */}
                    CardDescription>
                CardHeader>
                CardContent>
                    <Form {...form}>
                        form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            {/* Password Field */} {/* Поле Пароль */}
                            FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    FormItem>
                                        FormLabel>ПарольLabel> {/* Password */}
                                        FormControl>
                                            Input
                                                placeholder="••••••••"
                                                {...field}
                                                type="password"
                                            />
                                        FormControl>
                                        FormMessage /> {/* Validation error message */} {/* Сообщение об ошибке валидации */}
                                    FormItem>
                                )}
                            />
                            {/* Confirm Password Field */} {/* Поле Подтверждение Пароля */}
                            FormField
                                control={form.control}
                                name="passwordConfirm"
                                render={({ field }) => (
                                    FormItem>
                                        FormLabel>Подтвердите парольFormLabel> {/* Confirm Password */}
                                        FormControl>
                                            Input
                                                placeholder="••••••••"
                                                {...field}
                                                type="password"
                                            />
                                        FormControl>
                                        FormMessage /> {/* Validation error message */} {/* Сообщение об ошибке валидации */}
                                    FormItem>
                                )}
                            />
                            {/* Submit Button */} {/* Кнопка Submit */}
                            Button variant="destructive" type="submit" disabled={isSubmitting} className="w-full">
                                {isSubmitting ? 'Сброс...' : 'Сбросить пароль'} {/* Resetting... / Reset Password */}
                            Button>
                        form>
                    Form>
                CardContent>
            Card>
        div>
    );
};

export default ResetPasswordPage;
