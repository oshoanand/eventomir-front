
"use client";

import { useState, useEffect } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, Users, Briefcase } from "@/components/icons";
import { ChartTooltipContent } from "@/components/ui/chart";
import { getTotalCustomers, getTotalPerformers, getFinancialData, getOverviewData } from "@/services/admin";
import { Skeleton } from "../ui/skeleton";


const AdminAnalytics = ({ setError }: { setError: (error: string | null) => void }) => {
    const [financialData, setFinancialData] = useState<any[]>([]);
    const [overviewData, setOverviewData] = useState<any>(null);
    const [totalCustomers, setTotalCustomers] = useState<number | null>(null);
    const [totalPerformers, setTotalPerformers] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [finData, ovData, customersCount, performersCount] = await Promise.all([
                    getFinancialData(),
                    getOverviewData(),
                    getTotalCustomers(),
                    getTotalPerformers()
                ]);
                setFinancialData(finData);
                setOverviewData(ovData);
                setTotalCustomers(customersCount);
                setTotalPerformers(performersCount);
            } catch (err) {
                setError("Не удалось загрузить данные аналитики.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [setError]);

    return (
        <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Общий доход</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-7 w-3/4" /> : <div className="text-2xl font-bold">{overviewData?.totalRevenue.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}</div> }
                        <p className="text-xs text-muted-foreground">Данные о доходе требуют настройки на бэкенде.</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Всего заказчиков</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                         {isLoading ? <Skeleton className="h-7 w-1/4" /> : <div className="text-2xl font-bold">+{totalCustomers}</div>}
                        <p className="text-xs text-muted-foreground">Общее количество зарегистрированных заказчиков</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Всего исполнителей</CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-7 w-1/4" /> : <div className="text-2xl font-bold">+{totalPerformers}</div>}
                        <p className="text-xs text-muted-foreground">Общее количество зарегистрированных исполнителей</p>
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Обзор доходов</CardTitle>
                    <CardDescription>Реализация этого графика требует настройки RPC-функций в базе данных для безопасного подсчета.</CardDescription>
                </CardHeader>
                <CardContent className="h-[350px]">
                    {isLoading ? <Skeleton className="h-full w-full"/> : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={financialData}>
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${(value as number / 1000)}k`}
                                />
                                <Tooltip
                                    cursor={false}
                                    content={<ChartTooltipContent
                                        formatter={(value) => value.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}
                                        indicator="dot"
                                    />}
                                />
                                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminAnalytics;

    