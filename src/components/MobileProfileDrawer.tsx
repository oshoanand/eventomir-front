"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSiteSettings } from "@/components/providers/SiteThemeProvider";
import {
  User,
  LogOut,
  X,
  Settings,
  Ticket,
  Calendar,
  HelpCircle,
  Briefcase,
  Building,
  Upload,
  Check,
  Loader2,
  LogIn,
  UserPlus,
  Mail,
  Phone,
  Gem,
  FileText,
  Heart,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// Assuming you have this hook available based on your previous code
import { useCreateSupportTicket } from "@/services/support";

interface MobileProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileProfileDrawer({
  isOpen,
  onClose,
}: MobileProfileDrawerProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const settings = useSiteSettings();
  const contacts = settings?.contacts;

  // --- SUPPORT SHEET STATE ---
  const [showSupportSheet, setShowSupportSheet] = useState(false);
  const [supportType, setSupportType] = useState("BUG");
  const [problemDescription, setProblemDescription] = useState("");
  const [problemImage, setProblemImage] = useState<File | null>(null);
  const supportFileRef = useRef<HTMLInputElement>(null);

  // Prevent background scrolling when either drawer/sheet is open
  useEffect(() => {
    if (isOpen || showSupportSheet) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, showSupportSheet]);

  // --- MUTATION ---
  const { mutate: submitTicket, isPending: isSubmittingTicket } =
    useCreateSupportTicket(
      () => {
        setShowSupportSheet(false);
        setProblemDescription("");
        setProblemImage(null);
        toast({
          title: "Отправлено",
          description: "Ваше сообщение успешно отправлено в службу поддержки.",
          variant: "success" as any,
        });
      },
      (error: any) => {
        toast({
          title: "Ошибка",
          description: error.message || "Не удалось отправить запрос.",
          variant: "destructive",
        });
      },
    );

  const handleNavigation = (path: string) => {
    onClose();
    setTimeout(() => {
      router.push(path);
    }, 200); // slight delay to allow the drawer to close visually first
  };

  const handleLogout = async () => {
    onClose();
    await signOut({ callbackUrl: "/login" });
  };

  const handleSubmitSupport = () => {
    if (!problemDescription.trim()) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, опишите проблему.",
        variant: "destructive",
      });
      return;
    }

    const rawMobile = (session?.user as any)?.mobile;
    if (!rawMobile) {
      toast({
        title: "Внимание",
        description:
          "Укажите контактные данные в тексте сообщения, так как вы не авторизованы.",
        variant: "default",
      });
    }

    submitTicket({
      mobile: rawMobile || "Гость",
      support_type: supportType,
      description: problemDescription,
      proof: problemImage,
    });
  };

  const user = session?.user as any;
  const isPerformer = user?.role === "performer";

  return (
    <>
      {/* 1. MAIN PROFILE DRAWER (LEFT TO RIGHT) */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 z-[55] backdrop-blur-sm touch-none"
              onClick={onClose}
            />

            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[85vw] max-w-sm bg-background z-[60] shadow-2xl flex flex-col h-[100dvh]"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.1}
              onDragEnd={(e, { offset, velocity }) => {
                if (offset.x < -100 || velocity.x < -20) {
                  onClose();
                }
              }}
            >
              <div className="px-6 py-4 flex justify-between items-center border-b mt-safe">
                <h2 className="text-xl font-extrabold tracking-tight">Меню</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="h-8 w-8 rounded-full bg-muted/50"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 flex flex-col">
                {/* --- HEADER: Logged In vs Logged Out --- */}
                {user ? (
                  <div
                    className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border active:bg-muted/50 transition-colors mb-6"
                    onClick={() =>
                      handleNavigation(
                        isPerformer
                          ? "/performer-profile"
                          : "/customer-profile",
                      )
                    }
                  >
                    <Avatar className="h-14 w-14 border-2 border-background shadow-sm">
                      <AvatarImage src={user.image} className="object-cover" />
                      <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                        {user.name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold truncate">
                        {user.name || "Пользователь"}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {user.email}
                      </p>
                      <div className="mt-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {isPerformer ? "Исполнитель" : "Заказчик"}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 bg-muted/30 rounded-2xl border mb-6 text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                      <User className="h-8 w-8 text-primary" />
                    </div>

                    <p className="text-sm text-muted-foreground mt-1">
                      Войдите или зарегистрируйтесь, чтобы использовать все
                      функции.
                    </p>
                  </div>
                )}

                {/* --- MENU LIST --- */}
                <div className="space-y-1">
                  {user ? (
                    /* LOGGED IN MENU */
                    <>
                      <MenuItem
                        icon={<User className="text-blue-500" />}
                        title="Личный кабинет"
                        subtitle="Настройки и личные данные"
                        onClick={() =>
                          handleNavigation(
                            isPerformer
                              ? "/performer-profile"
                              : "/customer-profile",
                          )
                        }
                      />

                      {isPerformer ? (
                        <MenuItem
                          icon={<Calendar className="text-emerald-500" />}
                          title="Мои мероприятия"
                          subtitle="Управление мероприятием"
                          onClick={() => handleNavigation("/manage-events")}
                        />
                      ) : (
                        <MenuItem
                          icon={<Heart className="text-red-500" />}
                          title="Избранное"
                          subtitle="Список избранных"
                          onClick={() => handleNavigation("/favorites")}
                        />
                      )}

                      <MenuItem
                        icon={<Ticket className="text-purple-500" />}
                        title="Мои билеты"
                        subtitle="Купленные билеты на мероприятия"
                        onClick={() => handleNavigation("/tickets")}
                      />

                      <div className="h-px bg-border my-2 mx-4" />

                      <MenuItem
                        icon={<Gem className="text-amber-500" />}
                        title="Тарифы"
                        subtitle="Подписки и платные функции"
                        onClick={() => handleNavigation("/pricing")}
                      />

                      <MenuItem
                        icon={<FileText className="text-sky-500" />}
                        title="Блог"
                        subtitle="Полезные статьи и новости"
                        onClick={() => handleNavigation("/blog")}
                      />

                      <MenuItem
                        icon={<Building className="text-indigo-500" />}
                        title="О платформе"
                        subtitle="Узнайте больше о нас"
                        onClick={() => handleNavigation("/about")}
                      />

                      <MenuItem
                        icon={<HelpCircle className="text-orange-500" />}
                        title="поддержки"
                        subtitle="Помощь и ответы на вопросы"
                        onClick={() => setShowSupportSheet(true)}
                      />

                      <div className="h-px bg-border my-2 mx-4" />

                      <MenuItem
                        icon={<LogOut className="text-red-500" />}
                        title="Выйти из аккаунта"
                        subtitle="Завершить сеанс"
                        isDestructive
                        onClick={handleLogout}
                      />
                    </>
                  ) : (
                    /* LOGGED OUT MENU */
                    <>
                      <MenuItem
                        icon={<LogIn className="text-blue-500" />}
                        title="Войти"
                        subtitle="Уже есть аккаунт"
                        onClick={() => handleNavigation("/login")}
                      />
                      <MenuItem
                        icon={<UserPlus className="text-emerald-500" />}
                        title="Стать заказчиком"
                        subtitle="Регистрация для поиска профи"
                        onClick={() => handleNavigation("/register")}
                      />
                      <MenuItem
                        icon={<Briefcase className="text-purple-500" />}
                        title="Стать исполнителем"
                        subtitle="Регистрация для специалистов"
                        onClick={() => handleNavigation("/register-performer")}
                      />

                      <div className="h-px bg-border my-2 mx-4" />

                      <MenuItem
                        icon={<Gem className="text-amber-500" />}
                        title="Тарифы"
                        subtitle="Возможности для специалистов"
                        onClick={() => handleNavigation("/pricing")}
                      />

                      <MenuItem
                        icon={<FileText className="text-sky-500" />}
                        title="Блог"
                        subtitle="Полезные статьи и советы"
                        onClick={() => handleNavigation("/blog")}
                      />

                      <MenuItem
                        icon={<Building className="text-indigo-500" />}
                        title="О платформе"
                        subtitle="Узнайте больше о нас"
                        onClick={() => handleNavigation("/about")}
                      />

                      <MenuItem
                        icon={<HelpCircle className="text-orange-500" />}
                        title="поддержки"
                        subtitle="Свяжитесь с нами"
                        onClick={() => setShowSupportSheet(true)}
                      />
                    </>
                  )}
                </div>

                {/* --- FOOTER (Company Details) --- */}
                <div className="mt-auto pt-8 pb-8 pb-safe">
                  <div className="border-t border-border/50 pt-6 px-2">
                    <div className="flex flex-col items-center justify-center space-y-4 text-center">
                      {/* Contact Links */}
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-muted-foreground">
                        {contacts?.email && (
                          <a
                            href={`mailto:${contacts.email}`}
                            className="flex items-center text-[13px] hover:text-primary transition-colors font-medium"
                          >
                            <Mail className="h-4 w-4 mr-2" /> {contacts.email}
                          </a>
                        )}

                        {contacts?.phone && (
                          <a
                            href={`tel:${contacts.phone}`}
                            className="flex items-center text-[13px] hover:text-primary transition-colors font-medium"
                          >
                            <Phone className="h-4 w-4 mr-2" />
                            {contacts.phone}
                          </a>
                        )}
                      </div>

                      {/* Legal Info */}
                      <div className="text-[11px] text-muted-foreground/60 space-y-1.5 font-medium">
                        <p>ООО «АМУЛЕТ КОМПАНИ»| ИНН: 6319258622</p>
                        <p> ОГРН: 1226300038360</p>
                        <p className="pt-2">
                          © {new Date().getFullYear()} Eventomir. Все права
                          защищены. 18+
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 2. SUPPORT SHEET (BOTTOM TO TOP) */}
      <AnimatePresence>
        {showSupportSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[70] backdrop-blur-sm touch-none"
              onClick={() => setShowSupportSheet(false)}
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-background z-[80] rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, { offset, velocity }) => {
                if (offset.y > 100 || velocity.y > 20) {
                  setShowSupportSheet(false);
                }
              }}
            >
              <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Служба поддержки</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSupportSheet(false)}
                  className="rounded-full bg-muted/50 h-8 w-8"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-6 bg-muted/50 p-1 rounded-xl">
                {["BUG", "FEATURE", "OTHER"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setSupportType(type)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
                      supportType === type
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground"
                    }`}
                  >
                    {type === "BUG"
                      ? "ОШИБКА"
                      : type === "FEATURE"
                        ? "ИДЕЯ"
                        : "ДРУГОЕ"}
                  </button>
                ))}
              </div>

              {/* Textarea */}
              <div className="mb-4">
                <label className="block text-xs font-bold text-muted-foreground mb-2">
                  ОПИСАНИЕ ПРОБЛЕМЫ
                </label>
                <textarea
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  placeholder="Подробно опишите, что случилось..."
                  className="w-full p-4 rounded-xl border border-border bg-muted/20 min-h-[120px] outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                />
              </div>

              {/* Upload */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-muted-foreground mb-2">
                  СКРИНШОТ (НЕОБЯЗАТЕЛЬНО)
                </label>
                <div
                  onClick={() => supportFileRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-xl p-4 flex items-center justify-center cursor-pointer hover:bg-muted/30 transition-colors"
                >
                  {problemImage ? (
                    <div className="flex items-center text-primary font-medium">
                      <Check className="w-5 h-5 mr-2" />
                      {problemImage.name}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-muted-foreground">
                      <Upload className="w-6 h-6 mb-1" />
                      <span className="text-xs">Нажмите, чтобы загрузить</span>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={supportFileRef}
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) setProblemImage(e.target.files[0]);
                  }}
                />
              </div>

              <Button
                onClick={handleSubmitSupport}
                disabled={isSubmittingTicket}
                className="w-full py-6 font-bold rounded-xl text-base"
              >
                {isSubmittingTicket ? (
                  <Loader2 className="animate-spin h-5 w-5" />
                ) : (
                  "Отправить запрос"
                )}
              </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// --- Menu Item Helper Component ---
function MenuItem({
  icon,
  title,
  subtitle,
  isDestructive = false,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  isDestructive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center p-3 rounded-2xl hover:bg-muted/50 active:bg-muted transition-colors text-left group touch-manipulation"
    >
      <div
        className={`p-3 rounded-xl mr-4 flex items-center justify-center transition-colors ${
          isDestructive
            ? "bg-red-50 dark:bg-red-950/30 group-hover:bg-red-100"
            : "bg-muted group-hover:bg-background group-hover:shadow-sm"
        }`}
      >
        <div className="[&>svg]:h-5 [&>svg]:w-5">{icon}</div>
      </div>
      <div className="flex-1 min-w-0">
        <h4
          className={`font-bold text-[15px] truncate ${
            isDestructive ? "text-red-600 dark:text-red-400" : "text-foreground"
          }`}
        >
          {title}
        </h4>
        <p className="text-[13px] text-muted-foreground truncate mt-0.5">
          {subtitle}
        </p>
      </div>
    </button>
  );
}
