
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client'; // Import Supabase client

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { createNotification } from '@/services/notifications';

const supabase = createClient();

// Real function to register a partner application
const registerPartner = async (data: { name: string; email: string; website: string; }) => {
  console.log("Registering partner application:", data);
  
  // Generate a unique referral ID
  const referralId = `REF-${data.name.substring(0, 3).toUpperCase()}${Date.now().toString().slice(-4)}`;

  const { error } = await supabase
    .from('partners')
    .insert({
      name: data.name,
      email: data.email,
      website: data.website,
      referral_id: referralId,
      status: 'pending' // Initial status is pending approval
    });

  if (error) {
    if (error.code === '23505') { // Unique constraint violation
      throw new Error("Партнер с таким email уже существует.");
    }
    console.error("Ошибка создания заявки партнера:", error);
    throw new Error("Не удалось отправить заявку. Попробуйте еще раз.");
  }
  
  // Notify admin about the new application
  await createNotification({
    userId: 'admin-user-id', // Placeholder for admin ID
    title: 'Новая заявка на партнерство',
    message: `Пользователь ${data.name} (${data.email}) подал заявку на участие в партнерской программе.`,
    link: '/admin#partnership',
    type: 'admin',
  });

  return { success: true, message: "Вы успешно зарегистрированы! Мы скоро свяжемся с вами." };
};


const formSchema = z.object({
  name: z.string().min(2, { message: "Имя обязательно для заполнения." }),
  email: z.string().email({ message: "Введите корректный email." }),
  website: z.string().url({ message: "Введите корректную ссылку на ваш ресурс (сайт, блог, соцсеть)." }),
  agreement: z.boolean().refine(val => val === true, {
    message: "Необходимо принять условия партнерской программы.",
  }),
});

const PartnershipForm = () => {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { name: "", email: "", website: "", agreement: false },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSubmitting(true);
        try {
        const result = await registerPartner(values);
        if (result.success) {
            toast({ title: "Заявка отправлена!", description: result.message });
            setIsSubmitted(true);
            form.reset();
        }
        } catch (error: any) {
        toast({ variant: "destructive", title: "Ошибка регистрации", description: error.message });
        } finally {
        setIsSubmitting(false);
        }
    };
    
    if (isSubmitted) {
        return (
            <div className="text-center p-4 border border-green-500 bg-green-50 rounded-md text-green-800">
                <p className="font-semibold">Спасибо за вашу заявку!</p>
                <p className="text-sm">Мы рассмотрим ее и свяжемся с вами в ближайшее время.</p>
            </div>
        );
    }
    
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                    <FormLabel>Ваше имя или название компании</FormLabel>
                    <FormControl><Input placeholder="Иван Петров" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                    <FormLabel>Контактный Email</FormLabel>
                    <FormControl><Input type="email" placeholder="partner@example.com" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )} />
                <FormField control={form.control} name="website" render={({ field }) => (
                <FormItem>
                    <FormLabel>Ваш ресурс</FormLabel>
                    <FormControl><Input placeholder="https://my-blog.com" {...field} /></FormControl>
                    <FormDescription>Ссылка на ваш сайт, блог или страницу в социальной сети.</FormDescription>
                    <FormMessage />
                </FormItem>
                )} />
                <FormField control={form.control} name="agreement" render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <div className="space-y-1 leading-none">
                            <FormLabel>Я согласен с <Link href="/documents/terms-of-service" className="underline hover:text-primary">условиями</Link> партнерской программы.</FormLabel>
                            <FormMessage />
                        </div>
                    </FormItem>
                )} />
                <Button type="submit" variant="destructive" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Отправка..." : "Отправить заявку"}
                </Button>
            </form>
        </Form>
    );
};

export default PartnershipForm;
