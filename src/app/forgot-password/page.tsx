"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Mail,
  Loader2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";
import { toast } from "sonner";
import Image from "next/image";

// Validation Schema
const schema = z.object({
  email: z.string().email({
    message: "Пожалуйста, введите корректный адрес электронной почты.",
  }),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: data.email }),
        },
      );

      // We treat 200 as success regardless of whether email exists (Security practice)
      if (res.status === 200) {
        setIsSuccess(true);
        toast.success("Запрос успешно обработан");
      } else {
        toast.error("Ошибка сервера. Попробуйте позже.");
      }
    } catch (error) {
      toast.error("Не удалось подключиться к серверу");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background text-center selection:bg-primary/20">
        <div className="w-full max-w-md bg-card p-10 rounded-[2.5rem] shadow-xl shadow-primary/5 border border-border/50 flex flex-col items-center animate-in zoom-in-95 fade-in duration-500">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-3xl font-extrabold text-foreground tracking-tight mb-3">
            Проверьте почту
          </h2>
          <p className="text-muted-foreground leading-relaxed max-w-sm mb-8">
            Мы отправили инструкции по сбросу пароля на указанный вами адрес,
            если он существует в нашей системе.
          </p>
          <Link
            href="/login"
            className="w-full py-4 bg-muted/50 text-foreground font-bold rounded-2xl hover:bg-muted transition-colors border border-border/50"
          >
            Вернуться к входу
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background selection:bg-primary/20">
      <div className="w-full max-w-md bg-card p-8 sm:p-10 rounded-[2.5rem] shadow-2xl shadow-black/5 border border-border/50 animate-in slide-in-from-bottom-4 fade-in duration-500">
        <Link
          href="/login"
          className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-primary mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5 group-hover:-translate-x-1 transition-transform" />
          Назад ко входу
        </Link>

        <h2 className="text-3xl font-black text-foreground mb-2 tracking-tight">
          Восстановление
        </h2>
        <p className="text-sm font-medium text-muted-foreground mb-8 leading-relaxed">
          Введите ваш Email адрес, и мы отправим вам ссылку для безопасного
          сброса пароля.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-1.5">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              </div>
              <input
                type="email"
                placeholder="Ваш Email адрес"
                className={clsx(
                  "block w-full pl-12 pr-4 py-4 border rounded-2xl text-foreground font-medium transition-all bg-muted/20 outline-none placeholder:text-muted-foreground/60",
                  errors.email
                    ? "border-destructive/50 bg-destructive/5 focus:ring-4 focus:ring-destructive/10"
                    : "border-border/60 hover:border-primary/30 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-background",
                )}
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-destructive ml-1 mt-1.5 flex items-center font-medium animate-in fade-in">
                <AlertCircle className="w-3.5 h-3.5 mr-1" />{" "}
                {errors.email.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-primary text-primary-foreground font-bold text-base rounded-2xl hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin w-5 h-5 mr-2" />
                Отправка...
              </>
            ) : (
              "Получить ссылку"
            )}
          </button>
        </form>
      </div>

      {/* Bottom Footer Text */}
      <p className="mt-10 text-sm text-muted-foreground font-medium">
        Вспомнили пароль?{" "}
        <Link href="/login" className="text-primary hover:underline font-bold">
          Войти
        </Link>
      </p>
    </div>
  );
}
