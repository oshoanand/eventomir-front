"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ShareButtons from "@/components/ShareButtons"; // Assumes you have this component

// Icons
import { CalendarIcon, Newspaper, Heart, MessageCircle } from "lucide-react";

// Services
import { useArticlesQuery } from "@/services/article";

export default function BlogPage() {
  // 1. Fetch Data using React Query
  const { data: articles = [], isLoading, isError } = useArticlesQuery();

  // 2. Base URL for sharing (client-side safe)
  const [siteBaseUrl, setSiteBaseUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setSiteBaseUrl(window.location.origin);
    }
  }, []);

  // 3. Loading State (Skeleton)
  if (isLoading) {
    return (
      <div className="container mx-auto py-10 px-4 md:px-8">
        <div className="text-center mb-12 space-y-3">
          <Skeleton className="h-10 w-64 mx-auto" />
          <Skeleton className="h-5 w-3/4 max-w-2xl mx-auto" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card
              key={i}
              className="flex flex-col h-full border-none shadow-sm"
            >
              <Skeleton className="h-56 w-full rounded-t-xl rounded-b-none" />
              <CardHeader>
                <Skeleton className="h-4 w-1/3 mb-2" />
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // 4. Error State
  if (isError) {
    return (
      <div className="container mx-auto py-20 text-center text-destructive animate-in fade-in">
        <h2 className="text-2xl font-bold mb-2">Ошибка загрузки</h2>
        <p>
          Не удалось загрузить список статей. Пожалуйста, проверьте подключение
          и попробуйте позже.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 md:px-8 animate-in fade-in duration-500 min-h-screen">
      {/* Page Header */}
      <div className="text-center mb-12 space-y-3">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
          Блог Eventomir
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Читайте полезные статьи, новости и советы по организации мероприятий
          от наших экспертов.
        </p>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {articles.map((article: any) => {
          // Safely strip HTML tags for the preview text if no meta description is provided
          const safeContent = article.content
            ? article.content.replace(/<[^>]+>/g, "")
            : "";
          const previewText =
            article.meta_description || safeContent.substring(0, 150) + "...";

          return (
            <Card
              key={article.id}
              className="flex flex-col h-full hover:shadow-xl transition-all duration-300 group border-none shadow-md bg-card"
            >
              {/* Cover Image */}
              {article.media_url ? (
                <div className="relative h-56 w-full overflow-hidden rounded-t-xl bg-muted">
                  <Link href={`/blog/${article.slug}`}>
                    <img
                      src={article.media_url}
                      alt={article.image_alt_text || article.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </Link>
                </div>
              ) : (
                <div className="h-56 w-full bg-muted/50 flex items-center justify-center rounded-t-xl transition-colors group-hover:bg-muted/70">
                  <Newspaper className="h-12 w-12 text-muted-foreground/30" />
                </div>
              )}

              <CardHeader className="pb-3 pt-5">
                {/* Date & Metrics (Likes/Comments) */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center text-xs font-medium text-primary/80">
                    <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
                    <time dateTime={article.createdAt}>
                      {format(new Date(article.createdAt), "d MMMM yyyy", {
                        locale: ru,
                      })}
                    </time>
                  </div>

                  {/* Social Metrics from Backend */}
                  <div className="flex items-center gap-3 text-muted-foreground text-xs font-medium">
                    <span
                      className="flex items-center gap-1 hover:text-red-500 transition-colors"
                      title="Лайки"
                    >
                      <Heart className="h-3.5 w-3.5" />
                      {article._count?.likes || 0}
                    </span>
                    <span
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                      title="Комментарии"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      {article._count?.comments || 0}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <CardTitle className="text-xl leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                  <Link href={`/blog/${article.slug}`}>{article.title}</Link>
                </CardTitle>
              </CardHeader>

              <CardContent className="flex-grow">
                {/* Preview Text */}
                <CardDescription className="line-clamp-3 text-sm text-foreground/70 leading-relaxed">
                  {previewText}
                </CardDescription>
              </CardContent>

              {/* Footer: Read More + Share */}
              <CardFooter className="pt-4 pb-5 px-6 border-t bg-muted/5 flex justify-between items-center mt-auto">
                <Button
                  asChild
                  variant="link"
                  className="p-0 h-auto font-bold text-primary hover:text-primary/80"
                >
                  <Link href={`/blog/${article.slug}`}>
                    Читать далее &rarr;
                  </Link>
                </Button>

                {/* Uses the base URL evaluated on the client so hydration matches */}
                {siteBaseUrl && (
                  <ShareButtons
                    url={`${siteBaseUrl}/blog/${article.slug}`}
                    title={article.title}
                    description={previewText}
                    imageUrl={article.media_url}
                    variant="ghost"
                    buttonSize="sm"
                  />
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {articles.length === 0 && !isLoading && !isError && (
        <div className="text-center py-24 bg-muted/20 rounded-2xl border-2 border-dashed border-muted mt-8">
          <Newspaper className="mx-auto h-16 w-16 text-muted-foreground mb-4 opacity-30" />
          <h3 className="text-2xl font-bold mb-2">Статей пока нет</h3>
          <p className="text-muted-foreground">
            Загляните позже, мы уже готовим интересный контент!
          </p>
        </div>
      )}
    </div>
  );
}
