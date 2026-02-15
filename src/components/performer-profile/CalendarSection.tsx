"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { ru } from "date-fns/locale";
import type { PerformerProfile } from "@/services/performer";

interface CalendarSectionProps {
  profile: PerformerProfile;
}

const CalendarSection: React.FC<CalendarSectionProps> = ({ profile }) => {
  const bookedDates = profile.bookedDates?.map((d) => new Date(d)) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Календарь занятости</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center">
        <Calendar
          mode="multiple"
          selected={bookedDates}
          className="rounded-md border"
          locale={ru}
          modifiers={{ booked: bookedDates }}
          modifiersStyles={{
            booked: {
              border: "2px solid hsl(var(--destructive))",
              borderRadius: "50%",
            },
          }}
          disabled // Make the calendar non-interactive for display purposes
        />
      </CardContent>
    </Card>
  );
};

export default CalendarSection;
