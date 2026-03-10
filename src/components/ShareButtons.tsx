"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check } from "lucide-react";
import { cn } from "@/utils/utils";
import { VkontakteIcon, TelegramIcon } from "@/components/icons";

interface ShareButtonsProps {
  url: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  className?: string;
  buttonSize?: "sm" | "default" | "lg" | "icon";
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
}

const ShareButtons: React.FC<ShareButtonsProps> = ({
  url,
  title = "",
  description = "",
  imageUrl = "",
  className,
  buttonSize = "icon",
  variant = "outline",
}) => {
  const { toast } = useToast();
  const [isClient, setIsClient] = React.useState(false);
  const [isCopied, setIsCopied] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  // URL Encoding for safe sharing
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);
  const encodedImageUrl = encodeURIComponent(imageUrl);

  // Copy to clipboard with visual icon swap feedback
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);

      // Visual feedback on the button itself
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);

      toast({
        variant: "success",
        title: "Ссылка скопирована",
        description: "Вы можете поделиться ей с друзьями.",
      });
    } catch (err) {
      console.error("Ошибка копирования ссылки:", err);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось скопировать ссылку.",
      });
    }
  };

  // Construct share URLs
  const vkShareUrl = `https://vk.com/share.php?url=${encodedUrl}&title=${encodedTitle}&description=${encodedDescription}&image=${encodedImageUrl}`;
  const tgShareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`;

  const openShareWindow = (shareUrl: string) => {
    window.open(shareUrl, "_blank", "noopener,noreferrer,width=600,height=400");
  };

  // 1. Uniform Icon Size Logic
  const iconSizeClass = cn(
    buttonSize === "sm"
      ? "w-4 h-4"
      : buttonSize === "lg"
        ? "w-6 h-6"
        : "w-5 h-5",
  );

  // 2. Uniform Button Base Styles (Circular, slight shadow on hover, lift effect)
  const baseButtonClass =
    "rounded-full transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5";

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {/* VKontakte Button */}
      <Button
        variant={variant}
        size={buttonSize === "icon" ? "icon" : "default"}
        onClick={() => openShareWindow(vkShareUrl)}
        title="Поделиться ВКонтакте"
        className={cn(
          baseButtonClass,
          "hover:bg-[#1976d2]/10 border-muted-foreground/20",
        )}
      >
        <VkontakteIcon className={iconSizeClass} />
        <span className="sr-only">Поделиться ВКонтакте</span>
      </Button>

      {/* Telegram Button */}
      <Button
        variant={variant}
        size={buttonSize === "icon" ? "icon" : "default"}
        onClick={() => openShareWindow(tgShareUrl)}
        title="Поделиться в Telegram"
        className={cn(
          baseButtonClass,
          "hover:bg-[#2AABEE]/10 border-muted-foreground/20",
        )}
      >
        <TelegramIcon className={iconSizeClass} />
        <span className="sr-only">Поделиться в Telegram</span>
      </Button>

      {/* Copy Link Button */}
      <Button
        variant={variant}
        size={buttonSize === "icon" ? "icon" : "default"}
        onClick={copyToClipboard}
        title="Скопировать ссылку"
        className={cn(
          baseButtonClass,
          "border-muted-foreground/20",
          isCopied
            ? "bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/30"
            : "hover:bg-primary/10 hover:text-primary",
        )}
      >
        {isCopied ? (
          <Check
            className={cn(iconSizeClass, "scale-110 transition-transform")}
            strokeWidth={3}
          />
        ) : (
          <Copy className={iconSizeClass} />
        )}
        <span className="sr-only">Скопировать ссылку</span>
      </Button>
    </div>
  );
};

export default ShareButtons;
