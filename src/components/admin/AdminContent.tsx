
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getArticles, createArticle, updateArticle, deleteArticle, type Article } from "@/services/article";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Pencil, PlusCircle, Loader2 } from "@/components/icons";

const AdminContent = ({ setError }: { setError: (error: string | null) => void }) => {
    const [articles, setArticles] = useState<Article[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingArticle, setEditingArticle] = useState<Article | null>(null);
    const [formData, setFormData] = useState<Partial<Article>>({});
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchArticles = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getArticles();
            setArticles(data);
        } catch (err) {
            setError("Не удалось загрузить статьи.");
        } finally {
            setIsLoading(false);
        }
    }, [setError]);

    useEffect(() => {
        fetchArticles();
    }, [fetchArticles]);

    const handleOpenDialog = (article: Article | null = null) => {
        setEditingArticle(article);
        setFormData(article || { mediaType: 'image' });
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingArticle(null);
        setFormData({});
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = async () => {
        if (!formData.title || !formData.content) {
            toast({ variant: 'destructive', title: 'Ошибка', description: 'Заголовок и содержание обязательны.' });
            return;
        }

        try {
            if (editingArticle) {
                await updateArticle({ ...editingArticle, ...formData } as Article);
                toast({ title: 'Статья обновлена' });
            } else {
                await createArticle(
                    formData.title,
                    formData.content,
                    formData.mediaUrl,
                    formData.mediaType,
                    formData.metaTitle,
                    formData.metaDescription,
                    formData.keywords,
                    formData.imageAltText
                );
                toast({ title: 'Статья создана' });
            }
            fetchArticles();
            handleCloseDialog();
        } catch (err) {
            setError("Ошибка сохранения статьи.");
            toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось сохранить статью.' });
        }
    };
    
    const handleDelete = async (id: string) => {
        if (!window.confirm("Вы уверены, что хотите удалить эту статью?")) return;
        try {
            await deleteArticle(id);
            toast({ title: 'Статья удалена', variant: 'destructive' });
            fetchArticles();
        } catch (err) {
            setError("Ошибка удаления статьи.");
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button onClick={() => handleOpenDialog()}><PlusCircle className="mr-2 h-4 w-4" />Добавить статью</Button>
            </div>
            <ScrollArea className="h-96 w-full">
                 <div className="space-y-4">
                 {isLoading ? (
                    <div className="text-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground"/>
                        <p className="text-sm text-muted-foreground mt-2">Загрузка статей...</p>
                    </div>
                 ) : articles.length > 0 ? (
                    articles.map(article => (
                        <Card key={article.id} className="flex items-center justify-between p-4">
                            <div className="flex-grow pr-4">
                                <p className="font-semibold">{article.title}</p>
                                <p className="text-xs text-muted-foreground">{article.content.substring(0, 80)}...</p>
                            </div>
                            <div className="flex gap-2">
                                <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(article)}><Pencil className="h-4 w-4" /></Button>
                                <Button size="icon" variant="destructive" onClick={() => handleDelete(article.id)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        </Card>
                    ))
                ) : (
                    <p className="text-center text-muted-foreground pt-10">Статей пока нет.</p>
                )}
                 </div>
            </ScrollArea>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{editingArticle ? 'Редактировать статью' : 'Добавить статью'}</DialogTitle>
                    </DialogHeader>
                     <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-2">
                        <Input name="title" value={formData.title || ''} onChange={handleFormChange} placeholder="Заголовок" />
                        <Textarea name="content" value={formData.content || ''} onChange={handleFormChange} placeholder="Содержание" className="min-h-[150px]" />
                        <Input name="mediaUrl" value={formData.mediaUrl || ''} onChange={handleFormChange} placeholder="URL медиа (изображение, видео)" />
                        <Input name="imageAltText" value={formData.imageAltText || ''} onChange={handleFormChange} placeholder="Alt текст для изображения (SEO)" />
                        <Input name="metaTitle" value={formData.metaTitle || ''} onChange={handleFormChange} placeholder="SEO Заголовок" />
                        <Textarea name="metaDescription" value={formData.metaDescription || ''} onChange={handleFormChange} placeholder="SEO Описание" />
                        <Input name="keywords" value={formData.keywords || ''} onChange={handleFormChange} placeholder="Ключевые слова (через запятую)" />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline">Отмена</Button></DialogClose>
                        <Button onClick={handleSave}>Сохранить</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminContent;
