
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getRegisteredPerformers, type RegisteredPerformer } from "@/services/admin";
import { Loader2, Trash2 } from "@/components/icons";

const AdminPerformers = ({ performers, setPerformers, setError }: { performers: RegisteredPerformer[], setPerformers: (performers: RegisteredPerformer[]) => void, setError: (error: string | null) => void }) => {
    const [filteredPerformers, setFilteredPerformers] = useState<RegisteredPerformer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchPerformers = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getRegisteredPerformers();
            setPerformers(data);
            setFilteredPerformers(data);
        } catch (err) {
            setError("Не удалось загрузить список исполнителей.");
        } finally {
            setIsLoading(false);
        }
    }, [setPerformers, setError]);

    useEffect(() => {
        fetchPerformers();
    }, [fetchPerformers]);

    useEffect(() => {
        const results = performers.filter(performer =>
            performer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            performer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (performer.inn && performer.inn.includes(searchTerm))
        );
        setFilteredPerformers(results);
    }, [searchTerm, performers]);

    const handleDelete = (performerId: string) => {
        if (!window.confirm(`Вы уверены, что хотите удалить исполнителя ${performerId}?`)) return;
        // TODO: Implement API call
        console.log(`Удаление исполнителя ${performerId}`);
        setPerformers(performers.filter(p => p.id !== performerId));
    };

    return (
        <div className="space-y-4">
            <Input
                placeholder="Поиск по имени, email или ИНН..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <ScrollArea className="h-96 w-full rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Имя / Компания</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Роли</TableHead>
                            <TableHead>Статус</TableHead>
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
                        ) : filteredPerformers.length > 0 ? (
                            filteredPerformers.map(performer => (
                                <TableRow key={performer.id}>
                                    <TableCell>{performer.name}</TableCell>
                                    <TableCell>{performer.email}</TableCell>
                                    <TableCell>{performer.roles.join(', ')}</TableCell>
                                    <TableCell>{performer.moderationStatus}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="destructive" size="icon" onClick={() => handleDelete(performer.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                             <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    Исполнители не найдены.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </ScrollArea>
        </div>
    );
};

export default AdminPerformers;
