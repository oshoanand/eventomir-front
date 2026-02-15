
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Settings, BarChart, Check, X } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { 
    getPartners, 
    approvePartner,
    rejectPartner,
    getPartnershipSettings, 
    updatePartnershipSettings,
    type Partner 
} from "@/services/admin";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';

interface PartnershipSettings {
    commissionRate: number;
    cookieLifetime: number;
    minPayout: number;
}

const AdminPartnership = ({ setError }: { setError: (error: string | null) => void }) => {
    const [allPartners, setAllPartners] = useState<Partner[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [settings, setSettings] = useState<PartnershipSettings>({ commissionRate: 15, cookieLifetime: 30, minPayout: 1000 });
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [partnersData, settingsData] = await Promise.all([
                getPartners(),
                getPartnershipSettings()
            ]);
            setAllPartners(partnersData);
            if(settingsData) {
                setSettings(settingsData);
            }
        } catch (err: any) {
            setError(err.message || "Не удалось загрузить данные партнерской программы.");
        } finally {
            setIsLoading(false);
        }
    }, [setError]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveSettings = async () => {
        setIsSavingSettings(true);
        try {
            await updatePartnershipSettings(settings);
            toast({ title: "Настройки сохранены", description: "Данные партнерской программы успешно обновлены." });
        } catch (err: any) {
            setError(err.message);
            toast({ variant: 'destructive', title: "Ошибка", description: "Не удалось сохранить настройки." });
        } finally {
            setIsSavingSettings(false);
        }
    };

    const handleApprove = async (partnerId: string) => {
        try {
            await approvePartner(partnerId);
            toast({ title: "Партнер одобрен", description: "Пользователь получил уведомление о приглашении." });
            fetchData();
        } catch (err: any) {
            setError(err.message);
             toast({ variant: 'destructive', title: "Ошибка", description: err.message });
        }
    };

    const handleReject = async (partnerId: string) => {
         if (!window.confirm(`Вы уверены, что хотите отклонить заявку партнера ${partnerId}?`)) return;
        try {
            await rejectPartner(partnerId);
            toast({ title: "Заявка отклонена", variant: "destructive" });
            fetchData();
        } catch (err: any) {
            setError(err.message);
             toast({ variant: 'destructive', title: "Ошибка", description: err.message });
        }
    };
    
    const pendingApplications = allPartners.filter(p => p.status === 'pending');
    const approvedPartners = allPartners.filter(p => p.status === 'approved');
    
    const filteredPartners = approvedPartners.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Tabs defaultValue="applications" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="applications">Заявки <Badge variant="secondary" className="ml-2">{pendingApplications.length}</Badge></TabsTrigger>
                <TabsTrigger value="partners">Партнеры</TabsTrigger>
                <TabsTrigger value="settings">Настройки</TabsTrigger>
                <TabsTrigger value="analytics">Аналитика</TabsTrigger>
            </TabsList>
            
            {/* Applications Tab */}
            <TabsContent value="applications" className="mt-4">
                 <Card>
                    <CardHeader>
                        <CardTitle>Новые заявки на партнерство</CardTitle>
                        <CardDescription>Одобрите или отклоните заявки на участие в программе. Одобрение отправит пользователю приглашение на email для создания аккаунта.</CardDescription>
                    </CardHeader>
                     <CardContent>
                         {isLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> :
                         pendingApplications.length > 0 ? (
                            <div className="space-y-3">
                                {pendingApplications.map(app => (
                                    <Card key={app.id} className="p-3">
                                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                                            <div className="flex-grow">
                                                <p className="font-semibold">{app.name}</p>
                                                <p className="text-sm text-muted-foreground">{app.email}</p>
                                                 {app.website && <Link href={app.website} target="_blank" className="text-xs text-primary hover:underline">{app.website}</Link>}
                                            </div>
                                             <div className="flex gap-2 self-end sm:self-center">
                                                <Button size="sm" variant="outline" onClick={() => handleReject(app.id)}><X className="h-4 w-4 mr-1"/>Отклонить</Button>
                                                <Button size="sm" onClick={() => handleApprove(app.id)}><Check className="h-4 w-4 mr-1"/>Одобрить</Button>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                         ) : <p className="text-muted-foreground text-center py-4">Новых заявок нет.</p>}
                     </CardContent>
                 </Card>
            </TabsContent>

            {/* Partners Tab */}
            <TabsContent value="partners" className="mt-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Управление партнерами</CardTitle>
                        <CardDescription>Просмотр и управление вашими активными партнерами.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input
                            placeholder="Поиск по имени или email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <ScrollArea className="h-96 w-full rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Имя</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Баланс</TableHead>
                                        <TableHead>Регистраций</TableHead>
                                        <TableHead>Реф. ID</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                                    ) : filteredPartners.length > 0 ? (
                                        filteredPartners.map(partner => (
                                            <TableRow key={partner.id}>
                                                <TableCell>{partner.name}</TableCell>
                                                <TableCell>{partner.email}</TableCell>
                                                <TableCell>{partner.balance?.toLocaleString() ?? 0} руб.</TableCell>
                                                <TableCell>{partner.registrations || 0}</TableCell>
                                                <TableCell className="font-mono text-xs">{partner.referralId}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow><TableCell colSpan={5} className="h-24 text-center">Активные партнеры не найдены.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="mt-4">
                 <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5"/>Настройки партнерской программы</CardTitle></CardHeader>
                    <CardContent className="space-y-6 max-w-md">
                         <div>
                            <Label htmlFor="commissionRate">Процент вознаграждения (%)</Label>
                            <Input id="commissionRate" type="number" value={settings.commissionRate} onChange={e => setSettings(s => ({...s, commissionRate: Number(e.target.value)}))} />
                            <CardDescription className="text-xs mt-1">Процент от первой оплаты тарифа привлеченным исполнителем.</CardDescription>
                        </div>
                         <div>
                            <Label htmlFor="cookieLifetime">Срок жизни Cookie (дней)</Label>
                            <Input id="cookieLifetime" type="number" value={settings.cookieLifetime} onChange={e => setSettings(s => ({...s, cookieLifetime: Number(e.target.value)}))} />
                             <CardDescription className="text-xs mt-1">В течение скольких дней после перехода по ссылке регистрация будет засчитана партнеру.</CardDescription>
                        </div>
                        <div>
                            <Label htmlFor="minPayout">Минимальная сумма для выплаты (руб.)</Label>
                            <Input id="minPayout" type="number" value={settings.minPayout} onChange={e => setSettings(s => ({...s, minPayout: Number(e.target.value)}))} />
                             <CardDescription className="text-xs mt-1">Минимальная сумма на балансе партнера для возможности запроса выплаты.</CardDescription>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleSaveSettings} disabled={isSavingSettings}>
                            {isSavingSettings && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Сохранить настройки
                        </Button>
                    </CardFooter>
                 </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="mt-4">
                 <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><BarChart className="h-5 w-5"/>Аналитика</CardTitle></CardHeader>
                    <CardContent className="text-center text-muted-foreground py-16">
                        <p>Здесь будет раздел глубокой аналитики.</p>
                        <p className="text-sm">Эффективность партнеров, графики регистраций, конверсии, ROI и т.д.</p>
                    </CardContent>
                 </Card>
            </TabsContent>
        </Tabs>
    );
};

export default AdminPartnership;
