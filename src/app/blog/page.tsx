"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useArticles } from "@/services/article"; // Hook from your updated service
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
import ShareButtons from "@/components/ShareButtons";
import { CalendarIcon, Loader2, Newspaper } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default function BlogPage() {
  // 1. Fetch Data using React Query
  const { data: articles = [], isLoading, isError } = useArticles();

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
      <div className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-8 text-center">Блог</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="flex flex-col h-full">
              <Skeleton className="h-48 w-full rounded-t-xl" />
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
      <div className="container mx-auto py-20 text-center text-destructive">
        <h2 className="text-xl font-bold">Ошибка загрузки</h2>
        <p>Не удалось загрузить список статей. Пожалуйста, попробуйте позже.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      {/* Page Header */}
      <div className="text-center mb-10 space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Блог Eventomir
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Читайте полезные статьи, новости и советы по организации мероприятий.
        </p>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <Card
            key={article.id}
            className="flex flex-col h-full hover:shadow-lg transition-shadow duration-200"
          >
            {/* Cover Image */}
            {article.media_url && article.media_type === "image" ? (
              <div className="relative h-48 w-full overflow-hidden rounded-t-xl bg-muted">
                <img
                  src={article.media_url}
                  alt={article.image_alt_text || article.title}
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                  data-ai-hint="blog post thumbnail"
                />
              </div>
            ) : (
              // Fallback placeholder if no image
              <div className="h-48 w-full bg-muted flex items-center justify-center rounded-t-xl">
                <Newspaper className="h-12 w-12 text-muted-foreground/50" />
              </div>
            )}

            <CardHeader className="pb-3">
              {/* Date */}
              <div className="flex items-center text-xs text-muted-foreground mb-2">
                <CalendarIcon className="mr-1 h-3 w-3" />
                <time dateTime={article.createdAt}>
                  {format(new Date(article.createdAt), "d MMMM yyyy", {
                    locale: ru,
                  })}
                </time>
              </div>

              {/* Title */}
              <CardTitle className="text-xl leading-tight line-clamp-2 hover:text-primary transition-colors">
                <Link href={`/blog/${article.slug}`}>{article.title}</Link>
              </CardTitle>
            </CardHeader>

            <CardContent className="flex-grow">
              {/* Preview Text (Strip HTML tags) */}
              <CardDescription className="line-clamp-3 text-sm">
                {article.meta_description ||
                  article.content.replace(/<[^>]+>/g, "").substring(0, 150)}
                ...
              </CardDescription>
            </CardContent>

            {/* Footer: Read More + Share */}
            <CardFooter className="pt-4 border-t mt-auto flex justify-between items-center bg-muted/20">
              <Button
                asChild
                variant="link"
                className="p-0 h-auto font-semibold"
              >
                <Link href={`/blog/${article.slug}`}>Читать далее →</Link>
              </Button>

              <ShareButtons
                url={`${siteBaseUrl}/blog/${article.slug}`}
                title={article.title}
                description={article.meta_description}
                imageUrl={article.media_url}
                variant="ghost"
                buttonSize="sm"
              />
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {articles.length === 0 && (
        <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed">
          <Newspaper className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Статей пока нет</h3>
          <p className="text-muted-foreground">
            Загляните позже, мы готовим интересный контент!
          </p>
        </div>
      )}
    </div>
  );
}
