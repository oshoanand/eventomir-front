"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Scanner, IDetectedBarcode } from "@yudiel/react-qr-scanner";

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
} from "lucide-react";
import { apiRequest } from "@/utils/api-client";

type ScanResultState = {
  status: "idle" | "success" | "error";
  message: string;
  attendeeName?: string;
  ticketCount?: number;
};

export default function TicketScannerPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [scanResult, setScanResult] = useState<ScanResultState>({
    status: "idle",
    message: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const handleScan = async (detectedCodes: IDetectedBarcode[]) => {
    // 1. Prevent duplicate API calls if already processing or showing a result
    if (
      isProcessing ||
      scanResult.status !== "idle" ||
      detectedCodes.length === 0
    )
      return;

    const ticketCode = detectedCodes[0].rawValue;
    setIsProcessing(true);

    try {
      const response = await apiRequest<any>({
        method: "post",
        url: `/api/events/tickets/scan`,
        data: { ticketCode, eventId },
      });

      setScanResult({
        status: "success",
        message: response.message || "Вход разрешен!",
        attendeeName: response.attendeeName,
        ticketCount: response.ticketCount,
      });
    } catch (error: any) {
      const errMsg = error.response?.data?.message || "Недействительный билет";
      setScanResult({ status: "error", message: errMsg });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetScanner = () => {
    setScanResult({ status: "idle", message: "" });
  };

  return (
    <div className="container mx-auto py-10 max-w-lg min-h-screen flex flex-col animate-in fade-in">
      <Button
        variant="ghost"
        className="self-start mb-6 -ml-4"
        onClick={() => router.push("/manage-events")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Назад к событиям
      </Button>

      <Card className="shadow-lg border-2 flex-grow flex flex-col overflow-hidden">
        <CardHeader className="text-center bg-muted/20 border-b">
          <CardTitle className="text-2xl flex justify-center items-center gap-2">
            <UserCheck className="h-6 w-6 text-primary" />
            Контроль входа
          </CardTitle>
          <CardDescription>
            Наведите камеру смартфона на QR-код билета гостя.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 flex flex-col items-center flex-grow justify-center">
          {/* SCANNER VIEWPORT */}
          {/* We only render the Scanner when idle. Unmounting it stops the camera cleanly. */}
          {scanResult.status === "idle" && !isProcessing && (
            <div className="w-full max-w-sm rounded-2xl overflow-hidden bg-black border-4 border-muted/50 shadow-inner relative">
              <Scanner
                onScan={handleScan}
                formats={["qr_code"]}
                components={{
                  finder: true, // Show the visual scanning box
                }}
                styles={{
                  container: { width: "100%", height: "100%" },
                }}
              />
            </div>
          )}

          {/* PROCESSING STATE */}
          {isProcessing && (
            <div className="flex flex-col items-center justify-center py-12 w-full animate-in fade-in zoom-in-95">
              <div className="p-6 bg-primary/10 rounded-full mb-6">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
              </div>
              <p className="text-xl font-semibold text-foreground">
                Проверка билета...
              </p>
              <p className="text-muted-foreground mt-2">Связь с сервером</p>
            </div>
          )}

          {/* SUCCESS STATE */}
          {scanResult.status === "success" && (
            <div className="flex flex-col items-center w-full animate-in fade-in zoom-in-95 py-6">
              <div className="flex flex-col items-center text-center w-full">
                <CheckCircle className="h-20 w-20 text-green-500 mb-4 drop-shadow-sm" />
                <h3 className="text-3xl font-extrabold text-green-600 mb-2">
                  Вход разрешен!
                </h3>
                <p className="text-lg text-muted-foreground mb-6">
                  {scanResult.message}
                </p>

                {scanResult.attendeeName && (
                  <div className="bg-green-50/80 border border-green-200 w-full p-4 rounded-xl text-left space-y-1">
                    <p className="text-sm text-green-700 font-medium uppercase tracking-wider">
                      Гость
                    </p>
                    <p className="text-xl font-bold text-green-950">
                      {scanResult.attendeeName}
                    </p>
                    {scanResult.ticketCount && (
                      <p className="text-sm text-green-800 font-medium mt-2">
                        Количество билетов: {scanResult.ticketCount}
                      </p>
                    )}
                  </div>
                )}
              </div>
              <Button
                onClick={resetScanner}
                size="lg"
                className="w-full mt-8 font-bold text-lg h-14"
              >
                Сканировать следующий
              </Button>
            </div>
          )}

          {/* ERROR STATE */}
          {scanResult.status === "error" && (
            <div className="flex flex-col items-center w-full animate-in fade-in zoom-in-95 py-6">
              <div className="flex flex-col items-center text-center w-full">
                <XCircle className="h-20 w-20 text-destructive mb-4 drop-shadow-sm" />
                <h3 className="text-3xl font-extrabold text-destructive mb-2">
                  Вход запрещен
                </h3>

                <div className="bg-red-50/80 border border-red-200 w-full p-4 rounded-xl mt-4">
                  <p className="text-lg font-semibold text-red-900">
                    {scanResult.message}
                  </p>
                </div>
              </div>
              <Button
                onClick={resetScanner}
                variant="outline"
                size="lg"
                className="w-full mt-8 font-bold text-lg h-14 border-2 hover:bg-muted"
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
