"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";

// --- Services ---
import {
  usePerformerProfile,
  useUpdatePerformerProfile,
  BankDetails,
  SocialLinks,
} from "@/services/performer";

// --- UI Components ---
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  User,
  Link as LinkIcon,
  Banknote,
  CreditCard,
  Building2,
  Save,
  ChevronLeft,
  Trash2,
  PlusCircle,
} from "lucide-react";

// --- Formatters ---
const formatPhone = (val: string) => {
  if (!val) return "";
  let digits = val.replace(/\D/g, "");
  if (!digits) return "";

  // Auto-prefix logic: if starts with 8, replace with 7. If not 7, prepend 7.
  if (digits[0] === "8") digits = "7" + digits.slice(1);
  if (digits[0] !== "7") digits = "7" + digits;

  // Apply mask: +7 XXX XXX XX-XX
  let res = "+7";
  if (digits.length > 1) res += " " + digits.substring(1, 4);
  if (digits.length > 4) res += " " + digits.substring(4, 7);
  if (digits.length > 7) res += " " + digits.substring(7, 9);
  if (digits.length > 9) res += "-" + digits.substring(9, 11);
  return res;
};

// Strict numeric extractors for Russian banking standards
const extractDigits = (val: string, max: number) =>
  val.replace(/\D/g, "").substring(0, max);

const formatCardNumber = (val: string) => {
  const digits = extractDigits(val, 16);
  const matched = digits.match(/.{1,4}/g);
  return matched ? matched.join(" ") : "";
};

export default function SettingsPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const performerId = session?.user?.id;

  const { data: profile, isLoading: isProfileLoading } = usePerformerProfile(
    performerId || null,
  );
  const updateMutation = useUpdatePerformerProfile();

  // --- Form State ---
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");
  const [socials, setSocials] = useState<SocialLinks>({
    vk: "",
    telegram: "",
    youtube: "",
    website: "",
  });
  const [banks, setBanks] = useState<BankDetails[]>([]);

  // --- Initialize State ---
  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setCity(profile.city || "");
      setAddress(profile.address || "");

      const rawPhone = profile.phone || profile.contactPhone || "";
      setPhone(rawPhone ? formatPhone(rawPhone) : "");

      setDescription(profile.description || "");

      if (profile.priceRange && profile.priceRange.length > 0) {
        setPriceMin(profile.priceRange[0].toString());
        if (profile.priceRange[1])
          setPriceMax(profile.priceRange[1].toString());
      }

      if (profile.socialLinks)
        setSocials({ ...socials, ...profile.socialLinks });

      if (profile.bankDetails) {
        setBanks(
          profile.bankDetails.map((bank: any) => ({
            ...bank,
            type: bank.type || "CARD", // Legacy fallback to CARD
            accountNumber:
              bank.type === "ACCOUNT"
                ? extractDigits(bank.accountNumber || "", 20)
                : formatCardNumber(bank.accountNumber || ""),
          })),
        );
      }
    }
  }, [profile]);

  // --- Handlers ---
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleSave = () => {
    if (!performerId) return;

    // Validation: Phone
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits && phoneDigits.length < 11) {
      toast({
        variant: "destructive",
        title: "Некорректный номер",
        description: "Мобильный номер должен содержать 10 цифр после +7.",
      });
      return;
    }

    // Validation: Banks
    for (let i = 0; i < banks.length; i++) {
      const b = banks[i];
      if (b.type === "CARD") {
        const digits = b.accountNumber
          ? b.accountNumber.replace(/\D/g, "")
          : "";
        if (digits && digits.length !== 16) {
          toast({
            variant: "destructive",
            title: "Ошибка в реквизитах",
            description: `Реквизиты #${i + 1}: Номер карты должен содержать ровно 16 цифр.`,
          });
          return;
        }
      } else if (b.type === "ACCOUNT") {
        if (!b.bankName) {
          toast({
            variant: "destructive",
            title: "Ошибка в реквизитах",
            description: `Реквизиты #${i + 1}: Укажите название банка.`,
          });
          return;
        }
        if (b.bik?.length !== 9) {
          toast({
            variant: "destructive",
            title: "Ошибка в реквизитах",
            description: `Реквизиты #${i + 1}: БИК должен содержать ровно 9 цифр.`,
          });
          return;
        }
        if (b.inn?.length !== 10 && b.inn?.length !== 12) {
          toast({
            variant: "destructive",
            title: "Ошибка в реквизитах",
            description: `Реквизиты #${i + 1}: ИНН должен содержать 10 или 12 цифр.`,
          });
          return;
        }
        if (b.corrAccount?.length !== 20) {
          toast({
            variant: "destructive",
            title: "Ошибка в реквизитах",
            description: `Реквизиты #${i + 1}: Корреспондентский счет должен содержать ровно 20 цифр.`,
          });
          return;
        }
        if (b.accountNumber?.length !== 20) {
          toast({
            variant: "destructive",
            title: "Ошибка в реквизитах",
            description: `Реквизиты #${i + 1}: Расчетный счет должен содержать ровно 20 цифр.`,
          });
          return;
        }
        if (b.kpp && b.kpp.length !== 9) {
          toast({
            variant: "destructive",
            title: "Ошибка в реквизитах",
            description: `Реквизиты #${i + 1}: КПП должен содержать ровно 9 цифр.`,
          });
          return;
        }
      }
    }

    // Pricing
    const min = parseInt(priceMin) || 0;
    const max = parseInt(priceMax) || 0;
    const priceRange = min > 0 ? (max > min ? [min, max] : [min]) : [];

    // Clean payloads for API
    const cleanPhone = phone ? phone.replace(/[-\s]/g, "") : "";
    const cleanBanks = banks.map((b) => ({
      ...b,
      accountNumber: b.accountNumber.replace(/\s/g, ""), // Strip spaces
    }));

    updateMutation.mutate(
      {
        performerId,
        data: {
          name,
          city,
          address,
          phone: cleanPhone,
          contactPhone: cleanPhone,
          description,
          priceRange,
          socialLinks: socials,
          bankDetails: cleanBanks,
        },
      },
      {
        onSuccess: () => {
          toast({ title: "Настройки успешно сохранены!", variant: "success" });
          router.push("/performer-profile");
        },
        onError: () =>
          toast({ variant: "destructive", title: "Ошибка при сохранении" }),
      },
    );
  };

  const handleAddBank = () => {
    setBanks([
      ...banks,
      {
        type: "CARD",
        bankName: "",
        accountNumber: "",
        cardType: "MIR",
        isDefault: banks.length === 0,
      },
    ]);
  };

  const handleUpdateBank = (
    index: number,
    field: keyof BankDetails,
    value: string | boolean,
  ) => {
    const newBanks = [...banks];

    if (field === "isDefault" && value === true) {
      newBanks.forEach((b) => (b.isDefault = false));
    }

    if (field === "accountNumber") {
      newBanks[index][field] =
        newBanks[index].type === "CARD"
          ? formatCardNumber(value as string)
          : extractDigits(value as string, 20);
    } else if (field === "bik" || field === "kpp") {
      newBanks[index][field] = extractDigits(value as string, 9);
    } else if (field === "inn") {
      newBanks[index][field] = extractDigits(value as string, 12);
    } else if (field === "corrAccount") {
      newBanks[index][field] = extractDigits(value as string, 20);
    } else if (field === "type") {
      // Clear specific fields when switching types to avoid database pollution
      newBanks[index] = {
        ...newBanks[index],
        type: value as "CARD" | "ACCOUNT",
        accountNumber: "",
        bik: "",
        corrAccount: "",
        inn: "",
        kpp: "",
      };
    } else {
      newBanks[index] = { ...newBanks[index], [field]: value };
    }

    setBanks(newBanks);
  };

  const handleRemoveBank = (index: number) => {
    const newBanks = banks.filter((_, i) => i !== index);
    if (newBanks.length > 0 && banks[index].isDefault)
      newBanks[0].isDefault = true;
    setBanks(newBanks);
  };

  if (authStatus === "loading" || isProfileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (authStatus === "unauthenticated" || (!isProfileLoading && !profile)) {
    router.push("/login");
    return null;
  }

  return (
    <div className="bg-muted/10 min-h-screen pb-20 pt-10">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.back()}
              className="rounded-xl h-10 w-10"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Настройки профиля
              </h1>
              <p className="text-muted-foreground text-sm">
                Управление личной информацией, соцсетями и реквизитами
              </p>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="rounded-xl px-6 h-10 font-bold shadow-sm"
          >
            {updateMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}{" "}
            Сохранить
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <Tabs
            defaultValue="general"
            className="col-span-1 md:col-span-4 flex flex-col md:flex-row gap-8"
          >
            <TabsList className="flex md:flex-col justify-start h-auto bg-transparent p-0 space-y-0 md:space-y-2 space-x-2 md:space-x-0 overflow-x-auto w-full md:w-64 shrink-0 no-scrollbar">
              <TabsTrigger
                value="general"
                className="w-full justify-start rounded-xl px-4 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary border border-transparent data-[state=active]:border-border/50"
              >
                <User className="w-4 h-4 mr-3" /> Основное
              </TabsTrigger>
              <TabsTrigger
                value="social"
                className="w-full justify-start rounded-xl px-4 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary border border-transparent data-[state=active]:border-border/50"
              >
                <LinkIcon className="w-4 h-4 mr-3" /> Соцсети
              </TabsTrigger>
              <TabsTrigger
                value="finance"
                className="w-full justify-start rounded-xl px-4 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary border border-transparent data-[state=active]:border-border/50"
              >
                <Banknote className="w-4 h-4 mr-3" /> Реквизиты
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 min-w-0">
              {/* --- GENERAL INFO TAB --- */}
              <TabsContent
                value="general"
                className="m-0 space-y-6 focus-visible:outline-none animate-in fade-in"
              >
                <Card className="rounded-2xl shadow-sm border-border/40">
                  <CardHeader>
                    <CardTitle>Личная информация</CardTitle>
                    <CardDescription>
                      Эти данные будут отображаться в вашем публичном профиле.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-2">
                      <Label className="font-semibold">Имя / Псевдоним</Label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-muted/20 rounded-xl"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label className="font-semibold">Город</Label>
                        <Input
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="bg-muted/20 rounded-xl"
                          placeholder="Например: Москва"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-semibold">Телефон</Label>
                        <Input
                          value={phone}
                          onChange={handlePhoneChange}
                          className="bg-muted/20 rounded-xl font-mono text-sm tracking-wide"
                          placeholder="+7 ___ ___ __-__"
                          maxLength={18}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-semibold">Полный адрес</Label>
                      <Input
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Самара г, Советской Армии ул, дом № 181, корпус 6Б, квартира 46"
                        className="bg-muted/20 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-semibold">О себе</Label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="bg-muted/20 border border-border/40 rounded-xl min-h-[120px] resize-y transition-colors focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary"
                        placeholder="Расскажите о своем опыте, репертуаре и преимуществах..."
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl shadow-sm border-border/40">
                  <CardHeader>
                    <CardTitle>Стоимость услуг</CardTitle>
                    <CardDescription>
                      Укажите примерный диапазон цен на ваши выступления.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-semibold">От (₽)</Label>
                        <Input
                          type="number"
                          value={priceMin}
                          onChange={(e) => setPriceMin(e.target.value)}
                          className="bg-muted/20 rounded-xl"
                          placeholder="15000"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="font-semibold">
                          До (₽){" "}
                          <span className="text-muted-foreground font-normal">
                            (необязательно)
                          </span>
                        </Label>
                        <Input
                          type="number"
                          value={priceMax}
                          onChange={(e) => setPriceMax(e.target.value)}
                          className="bg-muted/20 rounded-xl"
                          placeholder="50000"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* --- SOCIAL LINKS TAB --- */}
              <TabsContent
                value="social"
                className="m-0 space-y-6 focus-visible:outline-none animate-in fade-in"
              >
                <Card className="rounded-2xl shadow-sm border-border/40">
                  <CardHeader>
                    <CardTitle>Социальные сети</CardTitle>
                    <CardDescription>
                      Добавьте ссылки на ваши соцсети, чтобы клиенты могли
                      видеть больше ваших работ.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-2">
                      <Label className="font-semibold text-[#0077FF]">
                        ВКонтакте
                      </Label>
                      <Input
                        value={socials.vk}
                        onChange={(e) =>
                          setSocials({ ...socials, vk: e.target.value })
                        }
                        className="bg-muted/20 rounded-xl"
                        placeholder="https://vk.com/ваша_страница"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-semibold text-[#24A1DE]">
                        Telegram
                      </Label>
                      <Input
                        value={socials.telegram}
                        onChange={(e) =>
                          setSocials({ ...socials, telegram: e.target.value })
                        }
                        className="bg-muted/20 rounded-xl"
                        placeholder="https://t.me/ваш_канал"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-semibold text-red-500">
                        YouTube
                      </Label>
                      <Input
                        value={socials.youtube}
                        onChange={(e) =>
                          setSocials({ ...socials, youtube: e.target.value })
                        }
                        className="bg-muted/20 rounded-xl"
                        placeholder="https://youtube.com/@ваш_канал"
                      />
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <Label className="font-semibold">Личный сайт</Label>
                      <Input
                        value={socials.website}
                        onChange={(e) =>
                          setSocials({ ...socials, website: e.target.value })
                        }
                        className="bg-muted/20 rounded-xl"
                        placeholder="https://www.example.com"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* --- FINANCE / BANKING TAB --- */}
              <TabsContent
                value="finance"
                className="m-0 space-y-6 focus-visible:outline-none animate-in fade-in"
              >
                <Card className="rounded-2xl shadow-sm border-border/40">
                  <CardHeader>
                    <CardTitle>Платежные реквизиты</CardTitle>
                    <CardDescription>
                      Заполните данные для безопасного вывода средств.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {banks.map((bank, index) => (
                      <div
                        key={index}
                        className="p-5 border rounded-2xl bg-muted/10 relative group space-y-5"
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 text-destructive hover:bg-red-50 opacity-50 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveBank(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>

                        {/* Payment Method Toggle */}
                        <div className="space-y-2">
                          <Label>Формат реквизитов</Label>
                          <Select
                            value={bank.type}
                            onValueChange={(val) =>
                              handleUpdateBank(index, "type", val)
                            }
                          >
                            <SelectTrigger className="bg-white rounded-xl max-w-[300px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CARD">
                                <div className="flex items-center">
                                  <CreditCard className="w-4 h-4 mr-2" />
                                  Банковская карта (Физ. лицо)
                                </div>
                              </SelectItem>
                              <SelectItem value="ACCOUNT">
                                <div className="flex items-center">
                                  <Building2 className="w-4 h-4 mr-2" />
                                  Расчетный счет (ИП / ООО)
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <Separator className="bg-border/50" />

                        {/* --- DYNAMIC FORM: CARD --- */}
                        {bank.type === "CARD" && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>
                                Название банка{" "}
                                <span className="text-muted-foreground font-normal">
                                  (Сбербанк, Т-Банк)
                                </span>
                              </Label>
                              <Input
                                value={bank.bankName}
                                onChange={(e) =>
                                  handleUpdateBank(
                                    index,
                                    "bankName",
                                    e.target.value,
                                  )
                                }
                                className="bg-white rounded-xl"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Платежная система</Label>
                              <Select
                                value={bank.cardType || "MIR"}
                                onValueChange={(val) =>
                                  handleUpdateBank(index, "cardType", val)
                                }
                              >
                                <SelectTrigger className="bg-white rounded-xl">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="MIR">МИР</SelectItem>
                                  <SelectItem value="VISA">VISA</SelectItem>
                                  <SelectItem value="MASTERCARD">
                                    MasterCard
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                              <Label>Номер карты (16 цифр)</Label>
                              <div className="relative">
                                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                  value={bank.accountNumber}
                                  onChange={(e) =>
                                    handleUpdateBank(
                                      index,
                                      "accountNumber",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="0000 0000 0000 0000"
                                  className="bg-white rounded-xl pl-10 font-mono tracking-wider text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* --- DYNAMIC FORM: ACCOUNT --- */}
                        {bank.type === "ACCOUNT" && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 md:col-span-2">
                              <Label>
                                Название банка{" "}
                                <span className="text-destructive">*</span>
                              </Label>
                              <Input
                                value={bank.bankName}
                                onChange={(e) =>
                                  handleUpdateBank(
                                    index,
                                    "bankName",
                                    e.target.value,
                                  )
                                }
                                placeholder="ПАО СБЕРБАНК"
                                className="bg-white rounded-xl"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>
                                БИК (9 цифр){" "}
                                <span className="text-destructive">*</span>
                              </Label>
                              <Input
                                value={bank.bik || ""}
                                onChange={(e) =>
                                  handleUpdateBank(index, "bik", e.target.value)
                                }
                                placeholder="044525225"
                                className="bg-white rounded-xl font-mono text-sm tracking-wider"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>
                                ИНН (10 или 12 цифр){" "}
                                <span className="text-destructive">*</span>
                              </Label>
                              <Input
                                value={bank.inn || ""}
                                onChange={(e) =>
                                  handleUpdateBank(index, "inn", e.target.value)
                                }
                                placeholder="7700000000"
                                className="bg-white rounded-xl font-mono text-sm tracking-wider"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>
                                Расчетный счет (20 цифр){" "}
                                <span className="text-destructive">*</span>
                              </Label>
                              <Input
                                value={bank.accountNumber}
                                onChange={(e) =>
                                  handleUpdateBank(
                                    index,
                                    "accountNumber",
                                    e.target.value,
                                  )
                                }
                                placeholder="40702810..."
                                className="bg-white rounded-xl font-mono text-sm tracking-wider"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>
                                Корр. счет (20 цифр){" "}
                                <span className="text-destructive">*</span>
                              </Label>
                              <Input
                                value={bank.corrAccount || ""}
                                onChange={(e) =>
                                  handleUpdateBank(
                                    index,
                                    "corrAccount",
                                    e.target.value,
                                  )
                                }
                                placeholder="30101810..."
                                className="bg-white rounded-xl font-mono text-sm tracking-wider"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>
                                КПП{" "}
                                <span className="text-muted-foreground font-normal">
                                  (9 цифр, опц. для ИП)
                                </span>
                              </Label>
                              <Input
                                value={bank.kpp || ""}
                                onChange={(e) =>
                                  handleUpdateBank(index, "kpp", e.target.value)
                                }
                                placeholder="770001001"
                                className="bg-white rounded-xl font-mono text-sm tracking-wider"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    <Button
                      variant="outline"
                      onClick={handleAddBank}
                      className="w-full border-dashed rounded-xl h-12 font-bold text-muted-foreground hover:text-foreground"
                    >
                      <PlusCircle className="w-4 h-4 mr-2" /> Добавить реквизиты
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
