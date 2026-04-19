"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UploadCloud, X, Music } from "lucide-react";
import { cn } from "@/utils/utils";

// 🚨 ИМПОРТ ХУКА ТАРИФОВ ДЛЯ ЛИМИТОВ
import { useTariff } from "@/hooks/use-tariff";

interface AudioUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  onFileUpload: (file: File, title: string) => Promise<boolean>;
  accept?: string;
}

const AudioUploadDialog: React.FC<AudioUploadDialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  onFileUpload,
  accept = "audio/mpeg, audio/wav", // По умолчанию MP3 и WAV
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [trackTitle, setTrackTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { getLimit } = useTariff();
  const planMaxFileSize = getLimit("maxFileSize");
  const limitMB = planMaxFileSize > 0 ? planMaxFileSize : 15;

  // Создание URL для предпрослушивания аудио
  useEffect(() => {
    if (file && file.type.startsWith("audio/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [file]);

  const handleReset = () => {
    setFile(null);
    setTrackTitle("");
    setPreviewUrl(null);
    setDragActive(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const processFile = (selectedFile: File) => {
    if (selectedFile.size > limitMB * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Файл слишком большой",
        description: `Для вашего тарифа максимальный размер файла составляет ${limitMB} МБ.`,
      });
      return;
    }

    if (!selectedFile.type.startsWith("audio/")) {
      toast({
        variant: "destructive",
        title: "Неверный тип файла",
        description: "Допустимы только аудиофайлы (MP3, WAV).",
      });
      return;
    }

    setFile(selectedFile);
    // Автоматически подставляем имя файла (без расширения) в качестве названия трека
    setTrackTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      toast({ variant: "destructive", title: "Файл не выбран" });
      return;
    }

    if (!trackTitle.trim()) {
      toast({ variant: "destructive", title: "Укажите название трека" });
      return;
    }

    setIsUploading(true);

    const success = await onFileUpload(file, trackTitle.trim());

    setIsUploading(false);
    if (success) {
      handleClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
          <DialogDescription className="text-sm mt-1.5">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-5">
          {/* ЗОНА ПЕРЕТАСКИВАНИЯ (DRAG AND DROP) */}
          {!file ? (
            <div
              className={cn(
                "relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all duration-200 cursor-pointer overflow-hidden",
                dragActive
                  ? "border-primary bg-primary/5 scale-[1.02]"
                  : "border-border hover:bg-muted/40 hover:border-primary/50",
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                accept={accept}
                onChange={handleFileChange}
              />
              <div
                className={cn(
                  "p-4 rounded-full mb-3 transition-colors",
                  dragActive
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <UploadCloud className="h-8 w-8" />
              </div>
              <h4 className="text-sm font-semibold mb-1 text-foreground">
                Нажмите или перетащите аудиофайл
              </h4>
              <p className="text-xs text-muted-foreground font-medium">
                MP3, WAV до {limitMB} МБ
              </p>
            </div>
          ) : (
            /* ПРЕВЬЮ ВЫБРАННОГО ФАЙЛА С АУДИОПЛЕЕРОМ */
            <div className="relative border rounded-xl p-4 flex flex-col gap-3 bg-muted/20 animate-in fade-in zoom-in-95 duration-200 shadow-sm">
              <div className="flex items-center gap-4 pr-8">
                <div className="h-12 w-12 shrink-0 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Music className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-grow min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">
                    {(file.size / (1024 * 1024)).toFixed(2)} МБ
                  </p>
                </div>
              </div>

              {/* Аудиоплеер для проверки трека */}
              {previewUrl && (
                <audio
                  controls
                  className="w-full h-10 outline-none rounded-full"
                >
                  <source src={previewUrl} type={file.type} />
                  Ваш браузер не поддерживает элемент audio.
                </audio>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReset();
                }}
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* ПОЛЕ ВВОДА НАЗВАНИЯ ТРЕКА */}
          <div className="space-y-2">
            <Label htmlFor="track-title" className="font-semibold text-sm">
              Название трека <span className="text-destructive">*</span>
            </Label>
            <Input
              id="track-title"
              value={trackTitle}
              onChange={(e) => setTrackTitle(e.target.value)}
              className="bg-muted/20"
              placeholder="Например: Мой лучший сет 2026..."
              disabled={isUploading || !file}
            />
          </div>
        </div>

        <DialogFooter className="pt-2">
          <DialogClose asChild>
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isUploading}
            >
              Отмена
            </Button>
          </DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={isUploading || !file || !trackTitle.trim()}
            className="font-bold shadow-sm"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Загрузка...
              </>
            ) : (
              "Загрузить трек"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AudioUploadDialog;
