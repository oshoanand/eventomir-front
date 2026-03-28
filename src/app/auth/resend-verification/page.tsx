"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";

// Validation schema
const resendSchema = z.object({
  email: z.string().email({ message: "Введите корректный email адрес." }),
});

type ResendFormValues = z.infer<typeof resendSchema>;

export default function ResendVerificationPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const form = useForm<ResendFormValues>({
    resolver: zodResolver(resendSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (values: ResendFormValues) => {
    setIsSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/resend-verification`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: values.email }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(
          data.message || "Новая ссылка отправлена на ваш email.",
        );
        form.reset();
      } else {
        setErrorMessage(data.message || "Произошла ошибка. Попробуйте позже.");
      }
    } catch (error) {
      console.error("Resend error:", error);
      setErrorMessage("Ошибка соединения с сервером.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-20 flex justify-center min-h-screen items-center">
      <Card className="w-full max-w-md shadow-lg border-2">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Повторная отправка ссылки</CardTitle>
          <CardDescription>
            Введите email, который вы указывали при регистрации, и мы отправим
            вам новую ссылку для подтверждения.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {successMessage && (
            <Alert className="mb-6 bg-green-50 border-green-200 text-green-800">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle>Отправлено!</AlertTitle>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          {errorMessage && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Ошибка</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email адрес</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="example@mail.ru"
                        type="email"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full h-11 text-base font-medium mt-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Отправка...
                  </>
                ) : (
                  "Отправить новую ссылку"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center border-t bg-muted/20 p-4">
          <Button
            variant="ghost"
            asChild
            className="text-muted-foreground hover:text-foreground"
          >
            <Link href="/login" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Вернуться ко входу
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
