"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { SubscriptionPlanDetails } from "@/services/payment";
import type { PerformerProfile } from "@/services/performer";
import { Gem, ArrowRight } from "lucide-react";
import Link from "next/link";

interface SubscriptionManagerProps {
  currentProfile: PerformerProfile;
  onSubscriptionChange: () => void; // Callback для обновления профиля
}

const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({
  currentProfile,
  onSubscriptionChange,
}) => {
  // Получаем имя плана из его ID
  const getPlanName = (planId: SubscriptionPlanDetails["id"]): string => {
    const planNames: Record<SubscriptionPlanDetails["id"], string> = {
      econom: "Эконом",
      standard: "Стандарт",
      premium: "Премиум",
    };
    return planNames[planId] || "Неизвестный";
  };

  const isPaidPlan = currentProfile.subscriptionPlanId !== "econom";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gem className="h-5 w-5 text-primary" />
            Ваш текущий тариф
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold mb-2">
            {getPlanName(currentProfile.subscriptionPlanId)}
          </p>
          {currentProfile.subscriptionEndDate && (
            <p className="text-muted-foreground">
              Действителен до:{" "}
              {new Date(currentProfile.subscriptionEndDate).toLocaleDateString(
                "ru-RU",
              )}
            </p>
          )}
        </CardContent>
        <CardContent>
          {isPaidPlan ? (
            <Button asChild>
              <Link href="/manage-subscription">
                Управлять подпиской <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <div className="space-y-2">
              <p className="text-muted-foreground">
                У вас базовый бесплатный тариф. Расширьте свои возможности,
                чтобы получать больше заказов!
              </p>
              <Button asChild variant="destructive">
                <Link href="/pricing">
                  Выбрать платный тариф <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionManager;
