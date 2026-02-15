"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  getPendingPerformerProfiles,
  getPendingGalleryItems,
  getPendingCertificates,
  getPendingRecommendationLetters,
  moderatePerformerProfile,
  moderateGalleryItem,
  moderateCertificate,
  moderateRecommendationLetter,
  type RegisteredPerformer,
} from "@/services/admin";
import type {
  GalleryItem,
  Certificate,
  RecommendationLetter,
} from "@/services/performer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Check, X, ShieldCheck } from "@/components/icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type ModerationItem<T> = {
  performerId: string;
  performerName: string;
  item: T;
};

const AdminModeration = ({
  setPerformers,
  setError,
}: {
  setPerformers: React.Dispatch<React.SetStateAction<RegisteredPerformer[]>>;
  setError: (error: string | null) => void;
}) => {
  const [pendingProfiles, setPendingProfiles] = useState<RegisteredPerformer[]>(
    [],
  );
  const [pendingGallery, setPendingGallery] = useState<
    ModerationItem<GalleryItem>[]
  >([]);
  const [pendingCerts, setPendingCerts] = useState<
    ModerationItem<Certificate>[]
  >([]);
  const [pendingLetters, setPendingLetters] = useState<
    ModerationItem<RecommendationLetter>[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState("");
  const [dialogData, setDialogData] = useState<{
    id: string;
    type: "profile" | "gallery" | "cert" | "letter";
    performerId?: string;
  } | null>(null);

  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [profiles, gallery, certs, letters] = await Promise.all([
        getPendingPerformerProfiles(),
        getPendingGalleryItems(),
        getPendingCertificates(),
        getPendingRecommendationLetters(),
      ]);
      setPendingProfiles(profiles);
      setPendingGallery(gallery);
      setPendingCerts(certs);
      setPendingLetters(letters);
    } catch (err) {
      setError("Не удалось загрузить очередь модерации.");
    } finally {
      setIsLoading(false);
    }
  }, [setError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (
    id: string,
    type: "profile" | "gallery" | "cert" | "letter",
    performerId?: string,
  ) => {
    try {
      switch (type) {
        case "profile":
          await moderatePerformerProfile(id, "approve");
          break;
        case "gallery":
          await moderateGalleryItem(performerId!, id, "approve");
          break;
        case "cert":
          await moderateCertificate(performerId!, id, "approve");
          break;
        case "letter":
          await moderateRecommendationLetter(performerId!, id, "approve");
          break;
      }
      toast({ title: "Одобрено" });
      fetchData();
    } catch (err) {
      setError("Ошибка одобрения.");
    }
  };

  const handleReject = () => {
    if (!dialogData) return;
    const { id, type, performerId } = dialogData;

    try {
      switch (type) {
        case "profile":
          moderatePerformerProfile(id, "reject", rejectionReason);
          break;
        case "gallery":
          moderateGalleryItem(performerId!, id, "reject", rejectionReason);
          break;
        case "cert":
          moderateCertificate(performerId!, id, "reject", rejectionReason);
          break;
        case "letter":
          moderateRecommendationLetter(
            performerId!,
            id,
            "reject",
            rejectionReason,
          );
          break;
      }
      toast({ title: "Отклонено", variant: "destructive" });
      fetchData();
      setDialogData(null);
      setRejectionReason("");
    } catch (err) {
      setError("Ошибка отклонения.");
    }
  };

  const openRejectDialog = (
    id: string,
    type: "profile" | "gallery" | "cert" | "letter",
    performerId?: string,
  ) => {
    setDialogData({ id, type, performerId });
  };

  const ModerationList = ({
    items,
    type,
    title,
  }: {
    items: any[];
    type: "profile" | "gallery" | "cert" | "letter";
    title: string;
  }) => (
    <div className="space-y-2">
      {items.length > 0 ? (
        items.map((p) => {
          const item = type === "profile" ? p : p.item;
          const performerName = type === "profile" ? p.name : p.performerName;
          const performerId = type === "profile" ? p.id : p.performerId;

          return (
            <Card key={item.id} className="p-3">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div className="flex-grow">
                  <p className="font-semibold">
                    {title}: {item.title || item.description || performerName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Исполнитель: {performerName}
                  </p>
                </div>
                <div className="flex gap-2 self-end sm:self-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApprove(item.id, type, performerId)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => openRejectDialog(item.id, type, performerId)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })
      ) : (
        <p className="text-muted-foreground text-sm text-center py-4">
          Нет элементов для модерации.
        </p>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="text-center p-4">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
        </div>
      ) : (
        <Tabs defaultValue="profiles">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profiles">
              Профили{" "}
              <Badge variant="secondary" className="ml-2">
                {pendingProfiles.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="gallery">
              Галерея{" "}
              <Badge variant="secondary" className="ml-2">
                {pendingGallery.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="certs">
              Сертификаты{" "}
              <Badge variant="secondary" className="ml-2">
                {pendingCerts.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="letters">
              Письма{" "}
              <Badge variant="secondary" className="ml-2">
                {pendingLetters.length}
              </Badge>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="profiles">
            <ModerationList
              items={pendingProfiles}
              type="profile"
              title="Профиль"
            />
          </TabsContent>
          <TabsContent value="gallery">
            <ModerationList
              items={pendingGallery}
              type="gallery"
              title="Работа"
            />
          </TabsContent>
          <TabsContent value="certs">
            <ModerationList
              items={pendingCerts}
              type="cert"
              title="Сертификат"
            />
          </TabsContent>
          <TabsContent value="letters">
            <ModerationList
              items={pendingLetters}
              type="letter"
              title="Письмо"
            />
          </TabsContent>
        </Tabs>
      )}

      <Dialog
        open={!!dialogData}
        onOpenChange={(isOpen) => !isOpen && setDialogData(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Причина отклонения</DialogTitle>
            <DialogDescription>
              Укажите причину, по которой элемент отклоняется. Пользователь
              получит уведомление.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Например: Некачественные фотографии, недостоверная информация..."
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Отмена</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleReject}>
              Отклонить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminModeration;
