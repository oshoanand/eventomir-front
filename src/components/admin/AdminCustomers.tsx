
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type CustomerProfile } from "@/services/customer";
import { Loader2, Trash2 } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

const AdminCustomers = ({ setError }: { setError: (error: string | null) => void }) => {
    const [customers, setCustomers] = useState<CustomerProfile[]>([]);
    const [filteredCustomers, setFilteredCustomers] = useState<CustomerProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchCustomers = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'customer');

            if (error) {
                throw error;
            }

            const customerProfiles: CustomerProfile[] = data.map(profile => ({
                id: profile.id,
                email: profile.email,
                name: profile.name,
                phone: profile.phone,
                city: profile.city,
                profilePicture: profile.profile_picture,
                registrationDate: new Date(profile.created_at),
                accountType: profile.account_type,
                companyName: profile.company_name,
                inn: profile.inn,
            }));

            setCustomers(customerProfiles);
            setFilteredCustomers(customerProfiles);
        } catch (err: any) {
            console.error("Ошибка загрузки заказчиков:", err.message);
            setError("Не удалось загрузить список заказчиков.");
        } finally {
            setIsLoading(false);
        }
    }, [setError]);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    useEffect(() => {
        const results = customers.filter(customer =>
            customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (customer.phone && customer.phone.includes(searchTerm))
        );
        setFilteredCustomers(results);
    }, [searchTerm, customers]);

    const handleDelete = (customerId: string) => {
        if (!window.confirm(`Вы уверены, что хотите удалить заказчика ${customerId}?`)) return;
        // TODO: Implement API call
        console.log(`Удаление заказчика ${customerId}`);
        setCustomers(prev => prev.filter(c => c.id !== customerId));
    };

    return (
        <div className="space-y-4">
            <Input
                placeholder="Поиск по имени, email или телефону..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <ScrollArea className="h-96 w-full rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Имя</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Телефон</TableHead>
                            <TableHead>Город</TableHead>
                            <TableHead className="text-right">Действия</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : filteredCustomers.length > 0 ? (
                            filteredCustomers.map(customer => (
                                <TableRow key={customer.id}>
                                    <TableCell>{customer.name} {customer.companyName ? `(${customer.companyName})` : ''}</TableCell>
                                    <TableCell>{customer.email}</TableCell>
                                    <TableCell>{customer.phone || 'N/A'}</TableCell>
                                    <TableCell>{customer.city || 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="destructive" size="icon" onClick={() => handleDelete(customer.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    Заказчики не найдены.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </ScrollArea>
        </div>
    );
};

export default AdminCustomers;

    