"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RegisterPerformerForm } from "@/components/auth/RegisterPerformerForm";

const RegisterPerformerPage = () => {
  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4 md:p-4 bg-muted/10 md:bg-transparent">
      {/* Premium responsive card wrapper */}
      <Card className="w-full max-w-[420px] md:max-w-[440px] shadow-none md:shadow-xl border-none md:border-border/50 rounded-[2rem] md:rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        <CardHeader className="space-y-2 md:space-y-1.5 pt-8 md:pt-8 pb-6 md:pb-4 text-center">
          <CardTitle className="text-2xl font-extrabold tracking-tight">
            Аккаунт исполнителя
          </CardTitle>
          <CardDescription className="text-base md:text-sm font-medium">
            Зарегистрируйтесь, чтобы предлагать свои услуги на платформе.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-8 md:px-8 md:pb-8">
          <RegisterPerformerForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPerformerPage;
