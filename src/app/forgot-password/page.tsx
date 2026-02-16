"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Mail,
  Loader2,
  ArrowLeft,
  CheckCircle,
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
        toast.success("Запрос обработан");
      } else {
        toast.error("Ошибка сервера");
      }
    } catch (error) {
      toast.error("Не удалось подключиться к серверу");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-in zoom-in">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Проверьте почту</h2>
        <p className="mt-2 text-gray-600 max-w-sm">
          Мы отправили инструкции по сбросу пароля на указанный вами Email адрес
          (если он существует в системе).
        </p>
        <Link
          href="/login"
          className="mt-8 px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
        >
          Вернуться к входу
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="w-full h-[100px] flex items-center justify-center mb-6">
        <div className="relative w-[100px] h-[100px]">
          <Image
            src="/images/logo.svg"
            alt="Logo"
            fill
            className="object-contain"
          />
        </div>
      </div>

      <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl shadow-gray-100">
        <Link
          href="/login"
          className="inline-flex items-center text-sm text-gray-500 hover:text-green-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Вернуться назад
        </Link>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Забыли пароль?
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Введите ваш Email, чтобы получить ссылку для сброса.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-1">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-green-600 transition-colors" />
              </div>
              <input
                type="email"
                placeholder="Email адрес"
                className={clsx(
                  "block w-full pl-10 pr-3 py-3.5 border rounded-xl text-gray-900 transition-all bg-gray-50 outline-none",
                  errors.email
                    ? "border-red-500 bg-red-50 focus:ring-red-200"
                    : "border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:bg-white",
                )}
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-500 ml-1 mt-0.5 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" /> {errors.email.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-70 flex items-center justify-center transition-all active:scale-[0.98]"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              "Сбросить пароль"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
