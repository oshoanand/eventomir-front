
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { getSupportManagers, addSupportManager, removeSupportManager, type SupportManager } from "@/services/support";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, PlusCircle, Loader2 } from "@/components/icons";

const AdminSupport = ({ setError }: { setError: (error: string | null) => void }) => {
    const [managers, setManagers] = useState<SupportManager[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newName, setNewName] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const { toast } = useToast();

    const fetchManagers = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getSupportManagers();
            setManagers(data);
        } catch (err) {
            setError("Не удалось загрузить список менеджеров.");
        } finally {
            setIsLoading(false);
        }
    }, [setError]);

    useEffect(() => {
        fetchManagers();
    }, [fetchManagers]);

    const handleAdd = async () => {
        if (!newName.trim() || !newEmail.trim()) {
            toast({ variant: 'destructive', title: 'Ошибка', description: 'Имя и email обязательны.' });
            return;
        }
        try {
            await addSupportManager(newName, newEmail);
            toast({ title: 'Менеджер добавлен' });
            setNewName("");
            setNewEmail("");
            fetchManagers();
        } catch (err) {
            setError("Ошибка добавления менеджера.");
        }
    };

    const handleDelete = async (managerId: string) => {
        if (!window.confirm("Вы уверены, что хотите удалить этого менеджера?")) return;
        try {
            await removeSupportManager(managerId);
            toast({ title: 'Менеджер удален', variant: 'destructive' });
            fetchManagers();
        } catch (err) {
             setError("Ошибка удаления менеджера.");
        }
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardContent className="pt-6 flex flex-col sm:flex-row gap-2">
                    <Input placeholder="Имя нового менеджера" value={newName} onChange={e => setNewName(e.target.value)} />
                    <Input type="email" placeholder="Email нового менеджера" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                    <Button onClick={handleAdd} className="w-full sm:w-auto"><PlusCircle className="mr-2 h-4 w-4" />Добавить</Button>
                </CardContent>
            </Card>
            <ScrollArea className="h-72 w-full">
                <div className="space-y-2">
                {isLoading ? (
                    <div className="text-center p-4"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground"/></div>
                ) : managers.length > 0 ? (
                     managers.map(manager => (
                        <Card key={manager.id} className="flex items-center justify-between p-3">
                            <div>
                                <p className="font-medium">{manager.name}</p>
                                <p className="text-xs text-muted-foreground">{manager.email}</p>
                            </div>
                            <Button size="icon" variant="destructive" onClick={() => handleDelete(manager.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </Card>
                    ))
                ) : (
                    <p className="text-center text-muted-foreground pt-10">Менеджеров пока нет.</p>
                )}
                </div>
            </ScrollArea>
        </div>
    );
};

export default AdminSupport;
