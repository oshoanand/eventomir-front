import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/utils/utils";

interface MediaItem {
  url: string;
  alt?: string;
  description?: string;
}

export default function MediaCarousel({ items }: { items: MediaItem[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!items || items.length === 0) return null;

  if (items.length === 1) {
    return (
      <div className="relative rounded-2xl overflow-hidden bg-black/5 flex items-center justify-center">
        <img
          src={items[0].url}
          alt={items[0].alt || "Media"}
          className="max-h-[500px] w-full object-cover rounded-2xl"
        />
        {items[0].description && (
          <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/80 to-transparent p-4 pt-12 text-white text-sm">
            {items[0].description}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden bg-black/5 group flex items-center justify-center max-h-[500px]">
      <div
        className="flex transition-transform duration-500 ease-out h-full w-full"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {items.map((item, idx) => (
          <div
            key={idx}
            className="w-full shrink-0 h-full flex items-center justify-center relative"
          >
            <img
              src={item.url}
              alt={item.alt || `Media ${idx + 1}`}
              className="max-h-[500px] w-full object-contain bg-black/90 rounded-2xl"
            />
            {item.description && (
              <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/80 to-transparent p-4 pt-12 text-white text-sm">
                {item.description}
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={() =>
          setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1))
        }
        className="absolute left-2 bg-black/50 backdrop-blur-md text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={() =>
          setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1))
        }
        className="absolute right-2 bg-black/50 backdrop-blur-md text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      <div className="absolute bottom-3 flex gap-1.5 justify-center w-full z-10">
        {items.map((_, idx) => (
          <div
            key={idx}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              idx === currentIndex
                ? "w-4 bg-white shadow-sm"
                : "w-1.5 bg-white/50",
            )}
          />
        ))}
      </div>
    </div>
  );
}
