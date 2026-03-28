"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Html5QrcodeScanner } from "html5-qrcode";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle, XCircle, UserCheck } from "lucide-react";
import { apiRequest } from "@/utils/api-client";

export default function TicketScannerPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const eventId = params.id as string;

  const [scanResult, setScanResult] = useState<{
    status: "idle" | "success" | "error";
    message: string;
    attendeeName?: string;
  }>({ status: "idle", message: "" });

  useEffect(() => {
    // Initialize Scanner on Mount
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false,
    );

    scanner.render(onScanSuccess, onScanFailure);

    async function onScanSuccess(decodedText: string) {
      // Pause scanner while checking backend to prevent spamming the API
      scanner.pause();

      try {
        const response = await apiRequest<{
          isValid: boolean;
          message: string;
          attendeeName: string;
        }>({
          method: "post",
          url: `/api/events/tickets/scan`,
          data: { ticketCode: decodedText, eventId },
        });

        if (response.isValid) {
          setScanResult({
            status: "success",
            message: response.message,
            attendeeName: response.attendeeName,
          });
          // Auto-resume scanner after 3 seconds for the next person
          setTimeout(() => {
            setScanResult({ status: "idle", message: "" });
            scanner.resume();
          }, 3000);
        }
      } catch (error: any) {
        // Backend returned a 400/403/404 error (Ticket invalid, already used, wrong event)
        const errMsg =
          error.response?.data?.message ||
          "Недействительный билет (Invalid ticket)";
        setScanResult({ status: "error", message: errMsg });

        // Auto-resume after error
        setTimeout(() => {
          setScanResult({ status: "idle", message: "" });
          scanner.resume();
        }, 3000);
      }
    }

    function onScanFailure(error: any) {
      // Ignore background noise errors from camera
    }

    return () => {
      // Cleanup camera on unmount
      scanner.clear().catch(console.error);
    };
  }, [eventId]);

  return (
    <div className="container mx-auto py-10 max-w-lg min-h-screen flex flex-col">
      <Button
        variant="ghost"
        className="self-start mb-6"
        onClick={() => router.push("/manage-events")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Назад к событиям
      </Button>

      <Card className="shadow-lg border-2 flex-grow">
        <CardHeader className="text-center bg-muted/20 border-b">
          <CardTitle className="text-2xl flex justify-center items-center gap-2">
            <UserCheck className="h-6 w-6 text-primary" />
            Контроль входа
          </CardTitle>
          <CardDescription>
            Наведите камеру на QR-код билета гостя.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 flex flex-col items-center">
          {/* Camera Feed Container */}
          <div
            id="reader"
            className="w-full max-w-sm rounded-lg overflow-hidden border-2 border-dashed mb-6 bg-black"
          />

          {/* Feedback UI */}
          <div className="w-full h-32 flex items-center justify-center rounded-xl transition-colors duration-300">
            {scanResult.status === "idle" && (
              <p className="text-muted-foreground animate-pulse">
                Ожидание сканирования...
              </p>
            )}

            {scanResult.status === "success" && (
              <div className="flex flex-col items-center text-center text-green-600 bg-green-50 w-full h-full justify-center rounded-xl p-4">
                <CheckCircle className="h-10 w-10 mb-2" />
                <p className="font-bold text-lg">{scanResult.message}</p>
                <p className="text-sm">Гость: {scanResult.attendeeName}</p>
              </div>
            )}

            {scanResult.status === "error" && (
              <div className="flex flex-col items-center text-center text-red-600 bg-red-50 w-full h-full justify-center rounded-xl p-4">
                <XCircle className="h-10 w-10 mb-2" />
                <p className="font-bold text-lg">Отказ во входе</p>
                <p className="text-sm font-medium">{scanResult.message}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
