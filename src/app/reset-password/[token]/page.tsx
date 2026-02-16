"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Clock,
} from "lucide-react";
import { clsx } from "clsx";
import { toast } from "sonner";
import Link from "next/link";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const token = params.token;

  // --- STATE ---
  const [isExpired, setIsExpired] = useState(false); // State to track expiration
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Visibility Toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // --- 1. CHECK TOKEN EXPIRATION ON LOAD ---
  useEffect(() => {
    if (token) {
      try {
        // Decode JWT payload (Part 2 of the token)
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          window
            .atob(base64)
            .split("")
            .map(function (c) {
              return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join(""),
        );

        const payload = JSON.parse(jsonPayload);
        const now = Date.now() / 1000;

        // If current time > expiration time, set expired state immediately
        if (payload.exp && now > payload.exp) {
          setIsExpired(true);
        }
      } catch (e) {
        // If token is malformed, treat as expired/invalid
        setIsExpired(true);
      }
    }
  }, [token]);

  // --- HANDLERS ---

  // Handler for Resending Link (When Expired)
  const handleResendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validate Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setError("Введите корректный Email адрес");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        },
      );

      if (res.status === 200) {
        toast.success("Новая ссылка отправлена на вашу почту");
        // Optional: Redirect to login or show success message static
        router.push("/login");
      } else {
        setError("Не удалось отправить ссылку");
      }
    } catch (err) {
      setError("Ошибка соединения");
    } finally {
      setLoading(false);
    }
  };

  // Handler for Resetting Password (Normal Flow)
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setError("Введите корректный Email адрес");
      setLoading(false);
      return;
    }
    if (password.length < 8) {
      setError("Пароль должен содержать не менее 8 символов");
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/reset-password/${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email,
            password: password,
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        // If backend says invalid/expired, switch UI to expired view
        if (res.status === 400 || data.message?.includes("expired")) {
          setIsExpired(true);
          throw new Error("Ссылка устарела. Пожалуйста, запросите новую.");
        }
        throw new Error(data.message || "Ошибка сброса пароля");
      }

      toast.success("Пароль успешно изменен");
      router.push("/login");
    } catch (err: any) {
      setError(err.message || "Произошла ошибка");
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER: EXPIRED VIEW ---
  if (isExpired) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <Clock className="h-8 w-8 text-red-600" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Ссылка устарела
          </h2>
          <p className="text-gray-500 text-sm mb-8">
            Срок действия ссылки истек (2 часа). Введите ваш Email, чтобы мы
            отправили новую.
          </p>

          <form onSubmit={handleResendLink} className="w-full space-y-5">
            <div className="space-y-1">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  placeholder="Email адрес"
                  className={clsx(
                    "block w-full pl-10 pr-3 py-3.5 border rounded-xl text-gray-900 outline-none transition-all",
                    error
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100",
                  )}
                />
              </div>
              {error && (
                <div className="flex items-center text-red-500 text-xs mt-1">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Отправить новую ссылку
            </button>

            <div className="text-center mt-4">
              <Link
                href="/login"
                className="text-sm font-medium text-gray-500 hover:text-green-600 inline-flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Вернуться ко входу
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // --- RENDER: NORMAL RESET VIEW ---
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-8">
      {/* LOGO */}
      <div className="w-full h-[130px] flex items-center justify-center mb-6">
        <div className="relative w-[120px] h-[120px]">
          <Image
            src="/images/logo.svg"
            alt="Logo"
            fill
            className="object-contain"
            priority={true}
          />
        </div>
      </div>

      <div className="w-full max-w-sm flex flex-col items-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Новый пароль</h2>
        <p className="text-gray-500 text-sm text-center mb-8">
          Подтвердите ваш Email и придумайте новый надежный пароль
        </p>

        <form onSubmit={handleResetSubmit} className="w-full space-y-5">
          {/* EMAIL CONFIRMATION */}
          <div className="space-y-1">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-green-600 transition-colors" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Подтвердите ваш Email"
                className={clsx(
                  "block w-full pl-10 pr-10 py-3.5 border rounded-xl text-gray-900 outline-none transition-all",
                  error && !email.includes("@")
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100",
                )}
              />
            </div>
          </div>

          {/* NEW PASSWORD */}
          <div className="space-y-1">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-green-600 transition-colors" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Новый пароль (мин. 8 символов)"
                className={clsx(
                  "block w-full pl-10 pr-10 py-3.5 border rounded-xl text-gray-900 outline-none transition-all",
                  error && password.length < 8
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100",
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-green-600 transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* CONFIRM PASSWORD */}
          <div className="space-y-1">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-green-600 transition-colors" />
              </div>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Подтвердите пароль"
                className={clsx(
                  "block w-full pl-10 pr-10 py-3.5 border rounded-xl text-gray-900 outline-none transition-all",
                  error && password !== confirmPassword
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100",
                )}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-green-600 transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>

            <div className="flex justify-between items-start pt-1 px-1 min-h-[24px]">
              {error ? (
                <div className="flex items-center text-red-500 text-xs mt-0.5 animate-in slide-in-from-left-2">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  <span>{error}</span>
                </div>
              ) : (
                <div />
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-base font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-70 transition-all active:scale-[0.98]"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Сохранить пароль"
            )}
          </button>

          <div className="text-center mt-4">
            <Link
              href="/login"
              className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-green-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Вернуться ко входу
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
