"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import Link from "next/link";

// Hooks & Services
import {
  useBlogQuery,
  useToggleLikeMutation,
  useAddCommentMutation,
} from "@/services/article";
import { useToast } from "@/hooks/use-toast";

// UI Components
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Icons
import {
  Heart,
  MessageCircle,
  Share2,
  ArrowLeft,
  CornerDownRight,
  CheckCircle2,
  CalendarIcon,
} from "lucide-react";

// --- Helper to build nested comment tree from flat DB array ---
const buildCommentTree = (comments: any[]) => {
  const commentMap: any = {};
  const roots: any[] = [];

  // Initialize map
  comments.forEach((c) => (commentMap[c.id] = { ...c, replies: [] }));

  // Build tree
  comments.forEach((c) => {
    if (c.parentId && commentMap[c.parentId]) {
      commentMap[c.parentId].replies.push(commentMap[c.id]);
    } else {
      roots.push(commentMap[c.id]);
    }
  });
  return roots;
};

export default function BlogDetailPage() {
  const { slug } = useParams() as { slug: string };
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  // Fetch the article by slug
  const { data: article, isLoading } = useBlogQuery(slug, session?.user?.id);

  // Mutations
  const likeMutation = useToggleLikeMutation(slug);
  const commentMutation = useAddCommentMutation();

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");

  // Set page title dynamically (Client-side workaround for App Router)
  useEffect(() => {
    if (article?.title) {
      document.title = `${article.meta_title || article.title} | Eventomir`;
    }
  }, [article]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: article?.title,
          text: article?.meta_description || "",
          url,
        });
      } catch (e) {
        console.log("Share cancelled or failed", e);
      }
    } else {
      navigator.clipboard.writeText(url);
      toast({
        title: "Ссылка скопирована!",
        description: "Вы можете поделиться ей с друзьями.",
      });
    }
  };

  const handleLike = () => {
    if (!session?.user) {
      toast({
        title: "Требуется авторизация",
        description: "Войдите, чтобы ставить лайки.",
      });
      return router.push("/login");
    }
    if (article) likeMutation.mutate(article.id);
  };

  const handleSubmitComment = async (parentId?: string) => {
    if (!session?.user) {
      toast({
        title: "Требуется авторизация",
        description: "Войдите, чтобы оставить комментарий.",
      });
      return router.push("/login");
    }

    if (!commentText.trim() || !article) return;

    try {
      await commentMutation.mutateAsync({
        articleId: article.id,
        content: commentText,
        parentId,
      });

      setCommentText("");
      setReplyingTo(null);

      toast({
        variant: "success",
        title: "Отправлено на модерацию",
        description: "Ваш комментарий появится после проверки администратором.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Ошибка отправки",
        description: "Не удалось отправить комментарий.",
      });
    }
  };

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="container mx-auto py-10 px-4 max-w-4xl space-y-6">
        <Skeleton className="h-10 w-32 mb-6" />
        <Skeleton className="h-14 w-3/4" />
        <Skeleton className="h-[400px] w-full rounded-2xl" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  // --- Not Found State ---
  if (!article) {
    return (
      <div className="container py-32 text-center">
        <h2 className="text-3xl font-bold mb-4">Статья не найдена</h2>
        <p className="text-muted-foreground mb-8">
          Возможно, она была удалена или скрыта.
        </p>
        <Button asChild>
          <Link href="/blog">Вернуться в блог</Link>
        </Button>
      </div>
    );
  }

  const commentTree = buildCommentTree(article.comments || []);

  // --- Recursive Component for Nested Comments ---
  const CommentThread = ({
    comment,
    isReply = false,
  }: {
    comment: any;
    isReply?: boolean;
  }) => (
    <div
      className={`mt-5 ${isReply ? "ml-6 md:ml-12 border-l-2 border-muted/60 pl-4 md:pl-6" : ""}`}
    >
      <div className="flex gap-3 md:gap-4">
        <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shadow-sm">
          {comment.user?.name?.charAt(0).toUpperCase() || "U"}
        </div>
        <div className="flex-1 space-y-2">
          <div className="bg-muted/30 p-4 rounded-xl border border-muted/30">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-sm">
                {comment.user?.name || "Пользователь"}
              </span>
              <span className="text-xs text-muted-foreground">
                {format(new Date(comment.createdAt), "dd MMM yyyy, HH:mm", {
                  locale: ru,
                })}
              </span>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
              {comment.content}
            </p>
          </div>

          <button
            onClick={() => {
              setReplyingTo(replyingTo === comment.id ? null : comment.id);
              setCommentText(""); // Reset text when opening new reply box
            }}
            className="text-xs font-semibold text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors ml-1"
          >
            <CornerDownRight className="h-3 w-3" /> Ответить
          </button>

          {/* Reply Input Box */}
          {replyingTo === comment.id && (
            <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-2">
              <Textarea
                placeholder={`Ответить ${comment.user?.name}...`}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="bg-background shadow-sm resize-none"
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setReplyingTo(null);
                    setCommentText("");
                  }}
                >
                  Отмена
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleSubmitComment(comment.id)}
                  disabled={commentMutation.isPending || !commentText.trim()}
                >
                  {commentMutation.isPending ? "Отправка..." : "Отправить"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Render nested replies recursively */}
      {comment.replies?.map((reply: any) => (
        <CommentThread key={reply.id} comment={reply} isReply={true} />
      ))}
    </div>
  );

  return (
    <div className="container mx-auto max-w-4xl py-10 px-4 md:px-0 animate-in fade-in duration-500">
      <Button
        variant="ghost"
        asChild
        className="mb-6 -ml-4 text-muted-foreground hover:text-foreground"
      >
        <Link href="/blog">
          <ArrowLeft className="mr-2 h-4 w-4" /> Назад к статьям
        </Link>
      </Button>

      {/* Article Header & Media */}
      <header className="space-y-6 mb-10">
        <div className="flex items-center text-sm font-medium text-primary/80 gap-2">
          <CalendarIcon className="h-4 w-4" />
          <span>
            {format(new Date(article.createdAt), "dd MMMM yyyy", {
              locale: ru,
            })}
          </span>
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight text-foreground">
          {article.title}
        </h1>

        {article.media_url && (
          <div className="w-full h-auto max-h-[500px] overflow-hidden rounded-2xl shadow-md border bg-muted mt-8">
            {article.media_type === "video" ? (
              <video
                src={article.media_url}
                controls
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={article.media_url}
                alt={article.image_alt_text || article.title}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        )}
      </header>

      {/* Article Content (Rendered HTML) */}
      <article
        className="prose prose-lg md:prose-xl dark:prose-invert max-w-none prose-p:leading-relaxed prose-img:rounded-xl text-foreground/90 mb-12"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />

      {/* Interaction Bar (Likes & Shares) */}
      <div className="flex items-center justify-between py-6 border-y border-border mb-12 bg-muted/5 px-4 rounded-xl">
        <Button
          variant="ghost"
          size="lg"
          onClick={handleLike}
          className={`gap-2 rounded-full px-6 transition-all duration-300 ${
            article.userHasLiked
              ? "text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-600 dark:bg-red-950/30"
              : "hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 text-muted-foreground"
          }`}
        >
          <Heart
            className={`h-6 w-6 transition-transform ${article.userHasLiked ? "fill-current scale-110" : ""}`}
          />
          <span className="text-lg font-semibold">
            {article._count?.likes || 0}
          </span>
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={handleShare}
          className="gap-2 rounded-full px-6"
        >
          <Share2 className="h-5 w-5" /> Поделиться
        </Button>
      </div>

      {/* Comments Section */}
      <section className="space-y-8 scroll-mt-20" id="comments">
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <MessageCircle className="h-6 w-6 text-primary" /> Комментарии (
          {article.comments?.length || 0})
        </h3>

        {/* Main Comment Input */}
        <Card className="p-5 shadow-sm border-muted/60 bg-muted/10">
          {session?.user ? (
            <div className="space-y-3">
              <Textarea
                placeholder="Поделитесь своими мыслями об этой статье..."
                value={replyingTo === null ? commentText : ""}
                onChange={(e) => {
                  setCommentText(e.target.value);
                  if (replyingTo !== null) setReplyingTo(null);
                }}
                className="min-h-[100px] resize-none bg-background focus-visible:ring-primary/20"
              />
              <div className="flex justify-end">
                <Button
                  onClick={() => handleSubmitComment()}
                  disabled={commentMutation.isPending || !commentText.trim()}
                  className="font-semibold shadow-sm"
                >
                  {commentMutation.isPending ? "Отправка..." : "Опубликовать"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="h-10 w-10 mx-auto opacity-20 mb-3" />
              <p className="mb-4 font-medium">
                Войдите в систему, чтобы оставлять комментарии и делиться
                мнением.
              </p>
              <Button asChild variant="default" className="shadow-sm">
                <Link href="/login">Войти</Link>
              </Button>
            </div>
          )}
        </Card>

        {/* Render Comment Tree */}
        <div className="space-y-2 mt-8">
          {commentTree.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-muted rounded-2xl bg-muted/5">
              <p className="text-muted-foreground font-medium">
                Пока нет комментариев. Будьте первым!
              </p>
            </div>
          ) : (
            commentTree.map((comment: any) => (
              <CommentThread key={comment.id} comment={comment} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
