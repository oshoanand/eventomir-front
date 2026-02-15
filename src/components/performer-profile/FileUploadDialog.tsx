
"use client";

import { useState } from 'react';
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
import { Loader2 } from "@/components/icons";

interface FileUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  onFileUpload: (file: File, description: string) => Promise<boolean>;
}

const FileUploadDialog: React.FC<FileUploadDialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  onFileUpload,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileDescription, setFileDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ variant: 'destructive', title: 'Файл слишком большой', description: 'Максимальный размер файла 5MB.' });
        return;
      }
      if (!['application/pdf', 'image/jpeg', 'image/png'].includes(selectedFile.type)) {
        toast({ variant: 'destructive', title: 'Неверный тип файла', description: 'Допустимы только PDF, JPG, PNG.' });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      toast({ variant: 'destructive', title: 'Файл не выбран' });
      return;
    }
    setIsUploading(true);
    const success = await onFileUpload(file, fileDescription);
    setIsUploading(false);
    if (success) {
      setFile(null);
      setFileDescription("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="file-upload" className="text-right">Файл</Label>
            <Input id="file-upload" type="file" className="col-span-3" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png" />
          </div>
          {file && <p className="text-sm text-center text-muted-foreground col-span-4">Выбран файл: {file.name}</p>}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="file-description" className="text-right">Описание</Label>
            <Input id="file-description" value={fileDescription} onChange={(e) => setFileDescription(e.target.value)} className="col-span-3" placeholder="Краткое описание" />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline" disabled={isUploading}>Отмена</Button></DialogClose>
          <Button onClick={handleSubmit} disabled={isUploading || !file}>
            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Загрузить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FileUploadDialog;
    