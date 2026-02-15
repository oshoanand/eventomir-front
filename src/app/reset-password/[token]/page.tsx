
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import { verifyPasswordResetToken, resetPassword } from '@/services/auth'; // Import auth services
import Link from 'next/link';
import { Loader2, CheckCircle, XCircle } from 'lucide-react'; // Icons
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Схема валидации формы сброса пароля
const formSchema = z.object({
    newPassword: z.string().min(8, { message: "Новый пароль должен содержать не менее 8 символов." }),
    confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "Пароли не совпадают.",
    path: ["confirmPassword"],
});

const ResetPasswordPage = () => {
    const params = useParams<{ token?: string }>();
    const token = params?.token;
    const router = useRouter();
    const { toast } = useToast();

    const [verificationStatus, setVerificationStatus] = useState<'loading' | 'valid' | 'invalid'>('loading');
    const [verificationMessage, setVerificationMessage] = useState('Проверка токена...');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Инициализация формы
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            newPassword: '',
            confirmPassword: '',
        },
    });

    // Проверка токена при загрузке страницы
    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setVerificationMessage('Токен сброса пароля не найден.');
                setVerificationStatus('invalid');
                return;
            }

            try {
                const result = await verifyPasswordResetToken(token);
                if (result.success) {
                    setVerificationStatus('valid');
                    setVerificationMessage(''); // Clear message on success
                } else {
                    setVerificationMessage(result.message);
                    setVerificationStatus('invalid');
                }
            } catch (error) {
                console.error("Ошибка проверки токена:", error);
                setVerificationMessage('Ошибка при проверке токена.');
                setVerificationStatus('invalid');
            }
        };

        verifyToken();
    }, [token]);

    // Функция обработки отправки формы нового пароля
    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (verificationStatus !== 'valid' || !token) return; // Double-check token validity

        setIsSubmitting(true);
        try {
            const result = await resetPassword(token, values.newPassword);

            if (result.success) {
                toast({
                    title: 'Успех!',
                    description: result.message,
                });
                router.push('/login'); // Перенаправляем на страницу входа
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Ошибка',
                    description: result.message,
                });
            }
        } catch (error) {
            console.error("Ошибка сброса пароля:", error);
            toast({
                variant: 'destructive',
                title: 'Ошибка',
                description: 'Не удалось сбросить пароль. Пожалуйста, попробуйте еще раз.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto py-10 flex justify-center">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Установка нового пароля</CardTitle>
                    <CardDescription>
                        {verificationStatus === 'valid' ? 'Введите новый пароль для вашего аккаунта.' : ''}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {verificationStatus === 'loading' && (
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-muted-foreground">{verificationMessage}</p>
                        </div>
                    )}

                    {verificationStatus === 'invalid' && (
                        <Alert variant="destructive">
                            <XCircle className="h-5 w-5" />
                            <AlertTitle>Ошибка!</AlertTitle>
                            <AlertDescription>{verificationMessage}</AlertDescription>
                            <Button variant="link" asChild className="mt-4 text-destructive">
                                <Link href="/forgot-password">Запросить сброс снова</Link>
                            </Button>
                        </Alert>
                    )}

                    {verificationStatus === 'valid' && (
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                {/* Поле Новый пароль */}
                                <FormField
                                    control={form.control}
                                    name="newPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Новый пароль</FormLabel>
                                            <FormControl>
                                                <Input placeholder="••••••••" {...field} type="password" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {/* Поле Подтверждение пароля */}
                                <FormField
                                    control={form.control}
                                    name="confirmPassword"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Подтвердите новый пароль</FormLabel>
                                            <FormControl>
                                                <Input placeholder="••••••••" {...field} type="password" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {/* Кнопка "Установить пароль" */}
                                <Button variant="destructive" type="submit" disabled={isSubmitting} className="w-full">
                                    {isSubmitting ? 'Сохранение...' : 'Установить новый пароль'}
                                </Button>
                            </form>
                        </Form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default ResetPasswordPage;
