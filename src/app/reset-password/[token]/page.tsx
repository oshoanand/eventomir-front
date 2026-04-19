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
  const [isExpired, setIsExpired] = useState(false);
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

        if (payload.exp && now > payload.exp) {
          setIsExpired(true);
        }
      } catch (e) {
        setIsExpired(true);
      }
    }
  }, [token]);

  // --- HANDLERS ---
  const handleResendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

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
        router.push("/login");
      } else {
        setError("Не удалось отправить ссылку. Попробуйте позже.");
      }
    } catch (err) {
      setError("Ошибка соединения с сервером");
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

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
          body: JSON.stringify({ email, password }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background selection:bg-primary/20">
      {isExpired ? (
        /* --- RENDER: EXPIRED VIEW --- */
        <div className="w-full max-w-md bg-card p-8 sm:p-10 rounded-[2.5rem] shadow-2xl shadow-black/5 border border-border/50 animate-in zoom-in-95 fade-in duration-500 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
            <Clock className="h-10 w-10 text-destructive" />
          </div>

          <h2 className="text-3xl font-black text-foreground mb-3 tracking-tight">
            Ссылка устарела
          </h2>
          <p className="text-muted-foreground font-medium text-sm mb-8 leading-relaxed max-w-sm">
            Срок действия ссылки истек (2 часа). Введите ваш Email адрес, чтобы
            мы отправили новую.
          </p>

          <form onSubmit={handleResendLink} className="w-full space-y-6">
            <div className="space-y-1.5 text-left">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  placeholder="Ваш Email адрес"
                  className={clsx(
                    "block w-full pl-12 pr-4 py-4 border rounded-2xl text-foreground font-medium transition-all bg-muted/20 outline-none placeholder:text-muted-foreground/60",
                    error
                      ? "border-destructive/50 bg-destructive/5 focus:ring-4 focus:ring-destructive/10"
                      : "border-border/60 hover:border-primary/30 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-background",
                  )}
                />
              </div>
              {error && (
                <div className="flex items-center text-destructive text-xs mt-1.5 font-medium animate-in fade-in">
                  <AlertCircle className="w-3.5 h-3.5 mr-1" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-primary-foreground font-bold text-base rounded-2xl hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
            >
              {loading ? (
                <Loader2 className="animate-spin w-5 h-5" />
              ) : (
                <RefreshCw className="w-5 h-5" />
              )}
              Отправить новую ссылку
            </button>
          </form>

          <div className="mt-8">
            <Link
              href="/login"
              className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-primary transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5 group-hover:-translate-x-1 transition-transform" />{" "}
              Вернуться ко входу
            </Link>
          </div>
        </div>
      ) : (
        /* --- RENDER: NORMAL RESET VIEW --- */
        <div className="w-full max-w-md bg-card p-8 sm:p-10 rounded-[2.5rem] shadow-2xl shadow-black/5 border border-border/50 animate-in slide-in-from-bottom-4 fade-in duration-500">
          <Link
            href="/login"
            className="inline-flex items-center text-sm font-semibold text-muted-foreground hover:text-primary mb-8 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5 group-hover:-translate-x-1 transition-transform" />
            Назад ко входу
          </Link>

          <h2 className="text-3xl font-black text-foreground mb-2 tracking-tight">
            Новый пароль
          </h2>
          <p className="text-sm font-medium text-muted-foreground mb-8 leading-relaxed">
            Подтвердите ваш Email и придумайте новый надежный пароль для вашего
            аккаунта.
          </p>

          <form onSubmit={handleResetSubmit} className="w-full space-y-5">
            {/* EMAIL CONFIRMATION */}
            <div className="space-y-1.5">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
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
                    "block w-full pl-12 pr-4 py-4 border rounded-2xl text-foreground font-medium transition-all bg-muted/20 outline-none placeholder:text-muted-foreground/60",
                    error && !email.includes("@")
                      ? "border-destructive/50 bg-destructive/5 focus:ring-4 focus:ring-destructive/10"
                      : "border-border/60 hover:border-primary/30 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-background",
                  )}
                />
              </div>
            </div>

            {/* NEW PASSWORD */}
            <div className="space-y-1.5">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Новый пароль (мин. 8 символов)"
                  className={clsx(
                    "block w-full pl-12 pr-12 py-4 border rounded-2xl text-foreground font-medium transition-all bg-muted/20 outline-none placeholder:text-muted-foreground/60",
                    error && password.length > 0 && password.length < 8
                      ? "border-destructive/50 bg-destructive/5 focus:ring-4 focus:ring-destructive/10"
                      : "border-border/60 hover:border-primary/30 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-background",
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-primary transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* CONFIRM PASSWORD */}
            <div className="space-y-1.5">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Подтвердите пароль"
                  className={clsx(
                    "block w-full pl-12 pr-12 py-4 border rounded-2xl text-foreground font-medium transition-all bg-muted/20 outline-none placeholder:text-muted-foreground/60",
                    error &&
                      confirmPassword.length > 0 &&
                      password !== confirmPassword
                      ? "border-destructive/50 bg-destructive/5 focus:ring-4 focus:ring-destructive/10"
                      : "border-border/60 hover:border-primary/30 focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-background",
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-primary transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* GLOBAL ERROR DISPLAY */}
              <div className="flex justify-between items-start pt-1 min-h-[24px]">
                {error && (
                  <div className="flex items-center text-destructive text-xs font-medium animate-in slide-in-from-left-2">
                    <AlertCircle className="w-3.5 h-3.5 mr-1" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-2 bg-primary text-primary-foreground font-bold text-base rounded-2xl hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin w-5 h-5 mr-2" />
                  Сохранение...
                </>
              ) : (
                "Сохранить пароль"
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
