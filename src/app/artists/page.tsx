"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MicVocal } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const ArtistsLandingPage = () => {
  const router = useRouter();

  const handleSearch = () => {
    router.push("/search?category=Артисты");
  };

  return (
    <div className="container mx-auto py-10 flex justify-center">
      <Card className="w-full max-w-2xl text-center">
        <CardHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
            <MicVocal className="h-6 w-6" />
          </div>
          <CardTitle>Артисты для вашего мероприятия</CardTitle>
          <CardDescription>
            Найдите музыкантов, танцоров, ведущих и артистов оригинального
            жанра, чтобы сделать ваше событие незабываемым.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Используйте наш поиск, чтобы найти идеальных артистов по жанру,
            бюджету и типу мероприятия.
          </p>
          <Button onClick={handleSearch} variant="destructive" size="lg">
            Найти артистов
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ArtistsLandingPage;
