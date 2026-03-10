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
    <div className="container mx-auto py-6 flex justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Регистрация исполнителя</CardTitle>
          <CardDescription>
            Зарегистрируйтесь, чтобы предлагать свои услуги на нашей платформе.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterPerformerForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPerformerPage;
