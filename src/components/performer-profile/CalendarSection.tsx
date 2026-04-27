// "use client";

// import { useState, useEffect } from "react";
// import { CardContent } from "@/components/ui/card";
// import { Calendar } from "@/components/ui/calendar";
// import { ru } from "date-fns/locale";
// import { isSameDay } from "date-fns";
// import { Info, Loader2 } from "lucide-react";
// import { useToast } from "@/hooks/use-toast";
// import {
//   useUpdatePerformerCalendar,
//   PerformerProfile,
// } from "@/services/performer";
// import { cn } from "@/utils/utils";

// interface CalendarSectionProps {
//   profile: PerformerProfile;
//   isOwnProfile: boolean;
// }

// const CalendarSection: React.FC<CalendarSectionProps> = ({
//   profile,
//   isOwnProfile,
// }) => {
//   const { toast } = useToast();

//   // Use the hook we created in @/services/performer
//   const updateCalendarMut = useUpdatePerformerCalendar();

//   // Local state for optimistic UI updates
//   const [selectedDates, setSelectedDates] = useState<Date[]>([]);

//   // Sync with server data on mount
//   useEffect(() => {
//     if (profile.bookedDates) {
//       setSelectedDates(profile.bookedDates.map((d) => new Date(d)));
//     }
//   }, [profile.bookedDates]);

//   // Handle performer clicking dates to toggle busy status
//   const handleSelect = (dates: Date[] | undefined) => {
//     if (!isOwnProfile) return;

//     const newDates = dates || [];
//     setSelectedDates(newDates); // Optimistic instant update

//     updateCalendarMut.mutate(
//       { performerId: profile.id, bookedDates: newDates },
//       {
//         onError: () => {
//           toast({
//             variant: "destructive",
//             title: "Ошибка сохранения календаря",
//           });
//           // Revert to server state on error
//           setSelectedDates(profile.bookedDates?.map((d) => new Date(d)) || []);
//         },
//       },
//     );
//   };

//   const yesterday = new Date();
//   yesterday.setDate(yesterday.getDate() - 1);

//   return (
//     <div className="flex flex-col items-center">
//       {isOwnProfile && (
//         <p className="text-[13px] text-muted-foreground text-center mb-4 flex items-start gap-2 bg-blue-50/50 p-3 rounded-xl border border-blue-100 w-full">
//           <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
//           Отметьте дни, когда вы заняты. Клиенты не смогут забронировать эти
//           даты.
//         </p>
//       )}

//       {updateCalendarMut.isPending && (
//         <div className="flex items-center text-xs text-muted-foreground mb-2">
//           <Loader2 className="w-3 h-3 animate-spin mr-1" /> Сохранение...
//         </div>
//       )}

//       <Calendar
//         mode={isOwnProfile ? "multiple" : "default"}
//         selected={selectedDates}
//         onSelect={isOwnProfile ? handleSelect : undefined}
//         locale={ru}
//         // Disable past dates. If public view, ALSO disable the busy dates.
//         disabled={
//           isOwnProfile
//             ? { before: yesterday }
//             : [...selectedDates, { before: yesterday }]
//         }
//         className="rounded-xl border p-3 w-full flex justify-center bg-white"
//         modifiers={{
//           busy: selectedDates,
//         }}
//         modifiersStyles={{
//           busy: {
//             backgroundColor: "hsl(var(--destructive) / 0.1)",
//             color: "hsl(var(--destructive))",
//             fontWeight: "bold",
//           },
//         }}
//         classNames={{
//           // Make cells slightly taller to fit the text
//           day: "h-12 w-12 p-0 font-normal aria-selected:opacity-100 hover:bg-muted rounded-md relative transition-colors",
//           day_selected:
//             "bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive focus:bg-destructive/20 focus:text-destructive",
//         }}
//         components={{
//           // Custom Day Renderer to show the red "Busy" text
//           DayContent: ({ date }) => {
//             const isBusy = selectedDates.some((d) => isSameDay(d, date));
//             return (
//               <div className="flex flex-col items-center justify-center w-full h-full relative">
//                 <span>{date.getDate()}</span>
//                 {isBusy && (
//                   <span className="absolute bottom-1 text-[8px] font-bold text-destructive uppercase tracking-tighter">
//                     занято
//                   </span>
//                 )}
//               </div>
//             );
//           },
//         }}
//       />
//     </div>
//   );
// };

// export default CalendarSection;
"use client";

import { useState, useEffect } from "react";
import { CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { ru } from "date-fns/locale";
import { isSameDay } from "date-fns";
import { Info, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  useUpdatePerformerCalendar,
  PerformerProfile,
} from "@/services/performer";
import { cn } from "@/utils/utils";

interface CalendarSectionProps {
  profile: PerformerProfile;
  isOwnProfile: boolean;
}

const CalendarSection: React.FC<CalendarSectionProps> = ({
  profile,
  isOwnProfile,
}) => {
  const { toast } = useToast();
  const updateCalendarMut = useUpdatePerformerCalendar();

  // Local state for optimistic UI updates
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);

  // Sync with server data on mount
  useEffect(() => {
    if (profile.bookedDates) {
      setSelectedDates(profile.bookedDates.map((d) => new Date(d)));
    }
  }, [profile.bookedDates]);

  // Handle performer clicking dates to toggle busy status
  const handleSelect = (dates: Date[] | undefined) => {
    if (!isOwnProfile) return;

    const newDates = dates || [];
    setSelectedDates(newDates); // Optimistic instant update

    updateCalendarMut.mutate(
      { performerId: profile.id, bookedDates: newDates },
      {
        onError: () => {
          toast({
            variant: "destructive",
            title: "Ошибка сохранения календаря",
          });
          // Revert to server state on error
          setSelectedDates(profile.bookedDates?.map((d) => new Date(d)) || []);
        },
      },
    );
  };

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  return (
    <div className="flex flex-col items-center w-full">
      {isOwnProfile && (
        <div className="bg-blue-50/50 border border-blue-100/80 rounded-2xl p-4 mb-5 w-full flex items-start gap-3 shadow-sm">
          <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-900/80 leading-relaxed">
            Отметьте дни, когда вы заняты. Клиенты не смогут забронировать эти
            даты, а в календаре они будут отмечены красным цветом.
          </p>
        </div>
      )}

      {updateCalendarMut.isPending && (
        <div className="flex items-center text-xs font-semibold text-muted-foreground mb-3 animate-pulse">
          <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Сохранение...
        </div>
      )}

      <Calendar
        mode={isOwnProfile ? "multiple" : "default"}
        selected={selectedDates}
        onSelect={isOwnProfile ? handleSelect : undefined}
        locale={ru}
        // Disable past dates. If public view, ALSO disable the busy dates.
        disabled={
          isOwnProfile
            ? { before: yesterday }
            : [...selectedDates, { before: yesterday }]
        }
        className="rounded-3xl border border-border/50 p-4 w-full flex justify-center bg-white shadow-sm"
        classNames={{
          // 🚨 STRIP DEFAULT STYLES: We forcefully remove the default background colors
          // so our custom DayContent inside can handle the styling cleanly.
          day: "h-12 w-12 p-0 font-normal bg-transparent focus-within:relative focus-within:z-20 outline-none",
          day_selected:
            "!bg-transparent !text-current hover:!bg-transparent focus:!bg-transparent",
          day_disabled: "opacity-40",
          day_today: "!bg-transparent",
        }}
        components={{
          // Custom Day Renderer
          DayContent: ({ date }) => {
            const isBusy = selectedDates.some((d) => isSameDay(d, date));
            const isPast = date < yesterday;

            return (
              <div
                className={cn(
                  "flex flex-col items-center justify-center w-[90%] h-[90%] mx-auto relative rounded-[10px] transition-all duration-200",
                  // Elegant Red Styling for Busy Dates
                  isBusy
                    ? "bg-red-50 border border-red-100/80 text-red-600 shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)]"
                    : // Clean Hover state for available dates
                      "hover:bg-slate-100 text-slate-700",
                  !isBusy && !isPast && "cursor-pointer",
                )}
              >
                <span
                  className={cn(
                    "text-[15px] transition-transform",
                    isBusy ? "font-bold -translate-y-1.5" : "font-medium",
                  )}
                >
                  {date.getDate()}
                </span>

                {isBusy && (
                  <span className="absolute bottom-1.5 text-[8px] font-black text-red-500 uppercase tracking-widest leading-none">
                    занято
                  </span>
                )}
              </div>
            );
          },
        }}
      />
    </div>
  );
};

export default CalendarSection;
