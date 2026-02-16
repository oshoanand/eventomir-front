"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChefHat } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const CooksLandingPage = () => {
  const router = useRouter();

  const handleSearch = () => {
    router.push("/search?category=Повар");
  };

  return (
    <div className="container mx-auto py-10 flex justify-center">
      <Card className="w-full max-w-2xl text-center">
        <CardHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
            <ChefHat className="h-6 w-6" />
          </div>
          <CardTitle>Повара и кейтеринг</CardTitle>
          <CardDescription>
            Найдите профессиональных поваров и кейтеринговые службы для любого
            события, от частных ужинов до крупных банкетов.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Используйте наш поиск, чтобы отфильтровать специалистов по кухне,
            бюджету и типу мероприятия.
          </p>
          <Button onClick={handleSearch} variant="destructive" size="lg">
            Найти поваров
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CooksLandingPage;
