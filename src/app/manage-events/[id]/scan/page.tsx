"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Scanner, IDetectedBarcode } from "@yudiel/react-qr-scanner";
import { useCheckInGuestMutation } from "@/services/events";

// UI Components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  UserCheck,
  Loader2,
  Ticket,
} from "lucide-react";

type ScanResultState = {
  status: "idle" | "success" | "error";
  message: string;
  guestName?: string;
};

export default function TicketScannerPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const checkInMutation = useCheckInGuestMutation();

  const [scanResult, setScanResult] = useState<ScanResultState>({
    status: "idle",
    message: "",
  });

  const handleScan = async (detectedCodes: IDetectedBarcode[]) => {
    // 1. Prevent duplicate API calls if already processing or showing a result
    if (
      checkInMutation.isPending ||
      scanResult.status !== "idle" ||
      detectedCodes.length === 0
    ) {
      return;
    }

    const ticketToken = detectedCodes[0].rawValue;

    try {
      // Use the unified mutation from services/events.ts
      const response = await checkInMutation.mutateAsync({
        ticketToken,
        eventId,
      });

      setScanResult({
        status: "success",
        message: response.message || "Вход разрешен!",
        guestName: response.guestName,
      });
    } catch (error: any) {
      // The API client automatically extracts the error.response.data object
      const errMsg =
        error.response?.data?.message ||
        error.message ||
        "Недействительный билет (Invalid Ticket)";
      setScanResult({ status: "error", message: errMsg });
    }
  };

  const resetScanner = () => {
    setScanResult({ status: "idle", message: "" });
  };

  return (
    <div className="container mx-auto py-6 sm:py-10 px-4 max-w-lg min-h-[100dvh] flex flex-col animate-in fade-in bg-muted/5">
      <Button
        variant="ghost"
        className="self-start mb-6 -ml-4 hover:bg-muted"
        onClick={() => router.push(`/manage-events/${eventId}/attendees`)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Назад к списку
      </Button>

      <Card className="shadow-lg border-border/50 rounded-3xl flex-grow flex flex-col overflow-hidden">
        <CardHeader className="text-center bg-background border-b border-border/40 pb-6 pt-8">
          <CardTitle className="text-2xl flex justify-center items-center gap-2 font-bold tracking-tight">
            <UserCheck className="h-7 w-7 text-primary" />
            Контроль входа
          </CardTitle>
          <CardDescription className="text-[15px] font-medium mt-1.5">
            Наведите камеру смартфона на QR-код билета или приглашения гостя.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 sm:p-8 flex flex-col items-center flex-grow justify-center bg-muted/10">
          {/* SCANNER VIEWPORT */}
          {/* We only render the Scanner when idle. Unmounting it stops the camera cleanly. */}
          {scanResult.status === "idle" && !checkInMutation.isPending && (
            <div className="w-full max-w-sm rounded-[2rem] overflow-hidden bg-black border-[6px] border-muted shadow-xl relative aspect-square">
              <Scanner
                onScan={handleScan}
                formats={["qr_code"]}
                components={{
                  finder: true,
                }}
                styles={{
                  container: { width: "100%", height: "100%" },
                }}
              />
              <div className="absolute bottom-4 left-0 w-full flex justify-center">
                <div className="bg-black/60 backdrop-blur-md text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-2">
                  <Ticket className="w-3.5 h-3.5" />
                  Ожидание кода...
                </div>
              </div>
            </div>
          )}

          {/* PROCESSING STATE */}
          {checkInMutation.isPending && (
            <div className="flex flex-col items-center justify-center py-12 w-full animate-in fade-in zoom-in-95">
              <div className="p-6 bg-primary/10 rounded-full mb-6">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
              </div>
              <p className="text-xl font-bold text-foreground tracking-tight">
                Проверка билета...
              </p>
              <p className="text-sm font-medium text-muted-foreground mt-1">
                Связь с сервером
              </p>
            </div>
          )}

          {/* SUCCESS STATE */}
          {scanResult.status === "success" && (
            <div className="flex flex-col items-center w-full animate-in fade-in zoom-in-95 py-4">
              <div className="flex flex-col items-center text-center w-full">
                <div className="bg-green-100 p-4 rounded-full mb-5">
                  <CheckCircle className="h-16 w-16 text-green-600 drop-shadow-sm" />
                </div>
                <h3 className="text-3xl font-black text-green-700 mb-2 tracking-tight">
                  Вход разрешен!
                </h3>
                <p className="text-base font-medium text-green-900/70 mb-8">
                  {scanResult.message}
                </p>

                {scanResult.guestName && (
                  <div className="bg-white border-2 border-green-200 shadow-sm w-full p-5 rounded-2xl text-left space-y-1.5">
                    <p className="text-[11px] text-green-600/80 font-bold uppercase tracking-widest">
                      Гость
                    </p>
                    <p className="text-2xl font-black text-green-950 leading-none">
                      {scanResult.guestName}
                    </p>
                  </div>
                )}
              </div>
              <Button
                onClick={resetScanner}
                size="lg"
                className="w-full mt-10 font-bold text-lg h-14 rounded-xl shadow-md bg-green-600 hover:bg-green-700"
              >
                Сканировать следующий
              </Button>
            </div>
          )}

          {/* ERROR STATE */}
          {scanResult.status === "error" && (
            <div className="flex flex-col items-center w-full animate-in fade-in zoom-in-95 py-4">
              <div className="flex flex-col items-center text-center w-full">
                <div className="bg-red-100 p-4 rounded-full mb-5">
                  <XCircle className="h-16 w-16 text-red-600 drop-shadow-sm" />
                </div>
                <h3 className="text-3xl font-black text-red-700 mb-2 tracking-tight">
                  Вход запрещен
                </h3>

                <div className="bg-white border-2 border-red-200 shadow-sm w-full p-5 rounded-2xl mt-6">
                  <p className="text-[15px] font-bold text-red-900 leading-snug">
                    {scanResult.message}
                  </p>
                </div>
              </div>
              <Button
                onClick={resetScanner}
                variant="outline"
                size="lg"
                className="w-full mt-10 font-bold text-lg h-14 rounded-xl border-2 border-border/60 hover:bg-muted"
              >
                Попробовать снова
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
