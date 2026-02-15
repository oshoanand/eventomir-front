"use client";

import { useState, useEffect } from "react";
import {
  getCompareList,
  removeFromCompare,
  clearCompareList,
} from "@/services/compare";
import { getPerformersByIds, PerformerWithRating } from "@/services/performer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, X } from "lucide-react"; // Changed import to standard lucide-react
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RatingStars } from "@/components/ui/rating-stars";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ComparePage = () => {
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [performers, setPerformers] = useState<PerformerWithRating[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8800";

  // Helper for images
  const getImageUrl = (path: string | undefined | null) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${API_BASE}${path}`;
  };

  // 1. Initial Load of IDs
  useEffect(() => {
    const storedIds = getCompareList();
    setCompareIds(storedIds);
  }, []);

  // 2. Fetch Data when IDs change
  useEffect(() => {
    const fetchPerformers = async () => {
      // Early exit if no IDs (but ensure loading stops)
      if (compareIds.length === 0) {
        setPerformers([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Fetch data (Rating is now included in this call)
        const performersData = await getPerformersByIds(compareIds);

        // Sort the data to match the user's addition order (compareIds array)
        const sortedPerformers = compareIds
          .map((id) => performersData.find((p) => p.id === id))
          .filter((p): p is PerformerWithRating => !!p);

        setPerformers(sortedPerformers);
      } catch (error) {
        console.error("Ошибка загрузки данных:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if we actually have IDs to fetch
    fetchPerformers();
  }, [compareIds]);

  const handleRemove = (performerId: string) => {
    removeFromCompare(performerId);
    // Immediately update state to reflect removal without re-fetching
    setCompareIds((prev) => prev.filter((id) => id !== performerId));
    setPerformers((prev) => prev.filter((p) => p.id !== performerId));
  };

  const handleClearAll = () => {
    clearCompareList();
    setCompareIds([]);
    setPerformers([]);
  };

  const CompareTableSkeleton = () => (
    <Table className="min-w-full border-collapse">
      <TableHeader>
        <TableRow>
          <TableHead className="w-[150px] font-semibold">Параметр</TableHead>
          {[1, 2].map((i) => (
            <TableHead key={i} className="w-[300px] p-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...Array(5)].map((_, rowIndex) => (
          <TableRow key={rowIndex}>
            <TableCell>
              <Skeleton className="h-5 w-24" />
            </TableCell>
            {[1, 2].map((i) => (
              <TableCell key={i}>
                <Skeleton className="h-5 w-full" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle>Сравнение исполнителей</CardTitle>
            <CardDescription>
              Сравните выбранных вами исполнителей по ключевым параметрам.
            </CardDescription>
          </div>
          {performers.length > 0 && (
            <Button variant="destructive" size="sm" onClick={handleClearAll}>
              <Trash2 className="mr-2 h-4 w-4" />
              Очистить список
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <CompareTableSkeleton />
          ) : performers.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground bg-muted/20 rounded-lg">
              <p>Список сравнения пуст.</p>
              <p className="text-sm mt-2">
                Добавляйте исполнителей со страницы поиска.
              </p>
              <Button className="mt-4" asChild>
                <Link href="/search">Перейти к поиску</Link>
              </Button>
            </div>
          ) : (
            <ScrollArea className="w-full whitespace-nowrap rounded-md border">
              <Table className="min-w-[800px]">
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-[150px] font-semibold sticky left-0 bg-muted/50 z-10">
                      Параметр
                    </TableHead>
                    {performers.map((performer) => (
                      <TableHead
                        key={performer.id}
                        className="w-[300px] p-4 min-w-[250px]"
                      >
                        <div className="flex flex-col gap-2 relative">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemove(performer.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>

                          <Link
                            href={`/performer-profile?id=${performer.id}`}
                            className="flex items-center gap-3 group"
                          >
                            <Avatar className="h-12 w-12 border">
                              <AvatarImage
                                src={getImageUrl(performer.profilePicture)}
                                alt={performer.name}
                              />
                              <AvatarFallback>
                                {performer.name.substring(0, 1)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <span className="font-semibold text-foreground group-hover:underline block">
                                {performer.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {performer.city}
                              </span>
                            </div>
                          </Link>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Rating */}
                  <TableRow>
                    <TableCell className="font-medium sticky left-0 bg-background z-10">
                      Рейтинг
                    </TableCell>
                    {performers.map((p) => (
                      <TableCell key={p.id}>
                        {p.averageRating ? (
                          <div className="flex items-center gap-1">
                            <RatingStars
                              value={p.averageRating}
                              readOnly
                              size={16}
                            />
                            <span className="text-xs text-muted-foreground">
                              ({p.averageRating.toFixed(1)})
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            Нет оценок
                          </span>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Roles */}
                  <TableRow>
                    <TableCell className="font-medium sticky left-0 bg-background z-10">
                      Роли
                    </TableCell>
                    {performers.map((p) => (
                      <TableCell key={p.id}>
                        <div className="flex flex-wrap gap-1">
                          {p.roles?.map((role) => (
                            <Badge
                              key={role}
                              variant="secondary"
                              className="text-xs"
                            >
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Price */}
                  <TableRow>
                    <TableCell className="font-medium sticky left-0 bg-background z-10">
                      Цена
                    </TableCell>
                    {performers.map((p) => (
                      <TableCell key={p.id}>
                        {p.priceRange && p.priceRange.length === 2
                          ? `${p.priceRange[0].toLocaleString()} - ${p.priceRange[1].toLocaleString()} ₽`
                          : "Не указана"}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Description */}
                  <TableRow>
                    <TableCell className="font-medium align-top sticky left-0 bg-background z-10">
                      Описание
                    </TableCell>
                    {performers.map((p) => (
                      <TableCell
                        key={p.id}
                        className="text-sm text-muted-foreground whitespace-pre-wrap align-top line-clamp-4 block min-h-[100px]"
                      >
                        {p.description || "Нет описания."}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Action */}
                  <TableRow>
                    <TableCell className="sticky left-0 bg-background z-10"></TableCell>
                    {performers.map((p) => (
                      <TableCell key={p.id}>
                        <Link href={`/performer-profile?id=${p.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            Перейти в профиль
                          </Button>
                        </Link>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ComparePage;
