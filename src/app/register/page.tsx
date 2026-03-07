"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RegisterCustomerForm } from "@/components/auth/RegisterCustomerForm";
import { RegisterPerformerForm } from "@/components/auth/RegisterPerformerForm";
import { Briefcase, User } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion"; // Import framer-motion

export default function RegisterPage() {
  const [activeTab, setActiveTab] = useState("customer");

  return (
    <div className="container mx-auto py-10 min-h-screen flex items-center justify-center bg-muted/20">
      <Card className="w-full max-w-2xl shadow-xl border-border/60">
        {/* <CardHeader className="text-center pb-2">
          <CardDescription className="text-md text-muted-foreground">
            Создайте аккаунт, чтобы начать работу с Eventomir
          </CardDescription>
        </CardHeader> */}
        <CardContent className="p-6">
          <Tabs
            defaultValue="customer"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="relative grid w-full grid-cols-2 mb-8 h-14 p-1 bg-muted rounded-xl">
              <TabsTrigger
                value="customer"
                // Removed the hardcoded bg-background. Made it relative to hold the absolute motion div.
                className="relative h-full rounded-lg data-[state=active]:text-primary transition-colors text-base font-medium z-10"
              >
                {/* Framer Motion Gliding Background */}
                {activeTab === "customer" && (
                  <motion.div
                    layoutId="active-tab-indicator"
                    className="absolute inset-0 bg-background rounded-lg shadow-sm"
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                {/* Content wrapper ensures text stays above the animated background */}
                <span className="relative z-20 flex items-center justify-center">
                  <User className="mr-2 h-5 w-5" />Я Заказчик
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="performer"
                className="relative h-full rounded-lg data-[state=active]:text-primary transition-colors text-base font-medium z-10"
              >
                {/* Framer Motion Gliding Background */}
                {activeTab === "performer" && (
                  <motion.div
                    layoutId="active-tab-indicator"
                    className="absolute inset-0 bg-background rounded-lg shadow-sm"
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-20 flex items-center justify-center">
                  <Briefcase className="mr-2 h-5 w-5" />Я Исполнитель
                </span>
              </TabsTrigger>
            </TabsList>

            <div className="mt-2">
              <TabsContent
                value="customer"
                className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                {/* <div className="text-center mb-6">
                  <h3 className="text-lg font-medium text-foreground">
                    Поиск специалистов
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Находите лучших профессионалов для ваших событий
                  </p>
                </div> */}
                <RegisterCustomerForm />
              </TabsContent>

              <TabsContent
                value="performer"
                className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300"
              >
                <div className="text-center mb-6">
                  <h3 className="text-lg font-medium text-foreground">
                    Поиск заказов
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Создайте профиль и получайте заказы на свои услуги
                  </p>
                </div>
                <RegisterPerformerForm />
              </TabsContent>
            </div>
          </Tabs>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Уже есть аккаунт?{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline transition-colors"
            >
              Войти
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
