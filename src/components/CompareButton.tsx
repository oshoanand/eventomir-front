"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { GitCompare } from "@/components/icons";
import {
  addToCompare,
  removeFromCompare,
  getCompareList,
} from "@/services/compare";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/utils/utils";

interface CompareButtonProps {
  performerId: string;
  className?: string; // For additional styling // Для дополнительной стилизации
}

const CompareButton: React.FC<CompareButtonProps> = ({
  performerId,
  className,
}) => {
  const [isInCompare, setIsInCompare] = useState(false); // State to track if the item is in comparison list // Состояние для отслеживания, находится ли элемент в списке сравнения
  const { toast } = useToast(); // Hook for notifications // Хук для уведомлений

  // Check if the performer is in the comparison list on component mount
  // Проверяем, находится ли исполнитель в списке сравнения при монтировании
  useEffect(() => {
    setIsInCompare(getCompareList().includes(performerId));
  }, [performerId]); // Dependency: performerId // Зависимость: performerId

  // Handler to toggle the comparison state
  // Обработчик переключения состояния сравнения
  const handleToggleCompare = (event: React.MouseEvent) => {
    // Note: Comparison logic is currently client-side. Consider moving to backend for persistence and sync.
    event.preventDefault(); // Prevent event bubbling if the button is inside a link // Предотвращаем всплытие события, если кнопка внутри ссылки
    event.stopPropagation();

    if (isInCompare) {
      // Remove from compare list
      // Удаляем из списка сравнения
      const success = removeFromCompare(performerId);
      if (success) {
        setIsInCompare(false);
        toast({ title: "Удалено из сравнения" }); // Removed from comparison
      } else {
        toast({
          variant: "destructive",
          title: "Ошибка",
          description: "Не удалось удалить из сравнения",
        }); // Error // Could not remove from comparison
      }
    } else {
      // Optionally: add a limit to the number of items in comparison
      // Опционально: добавить ограничение на максимальное количество элементов в сравнении
      // const currentList = getCompareList();
      // if (currentList.length >= 5) { // Example limit // Пример ограничения
      //     toast({ variant: "destructive", title: "Список сравнения полон", description: "Удалите элементы, чтобы добавить новые." }); // Comparison list full // Remove items to add new ones.
      //     return;
      // }
      // Add to compare list
      // Добавляем в список сравнения
      const success = addToCompare(performerId);
      if (success) {
        setIsInCompare(true);
        toast({ title: "Добавлено к сравнению" }); // Added to comparison
      } else {
        toast({
          variant: "destructive",
          title: "Ошибка",
          description: "Не удалось добавить к сравнению",
        }); // Error // Could not add to comparison
      }
    }
  };

  return (
    <Button
      variant={isInCompare ? "secondary" : "outline"} // Change variant based on state // Изменяем вариант в зависимости от состояния
      size="icon" // Icon button size // Размер иконки кнопки
      onClick={handleToggleCompare}
      className={cn("h-8 w-8", className)} // Reduce button size, apply custom class // Уменьшаем размер кнопки, применяем кастомный класс
      title={isInCompare ? "Удалить из сравнения" : "Добавить к сравнению"} // Tooltip text // Текст всплывающей подсказки
    >
      <GitCompare
        className={cn("h-4 w-4", isInCompare ? "text-primary" : "")}
      />{" "}
      {/* Use GitCompare icon, change color if active */}{" "}
      {/* Используем иконку GitCompare, меняем цвет если активно */}
      <span className="sr-only">
        {isInCompare ? "Удалить из сравнения" : "Добавить к сравнению"}
      </span>{" "}
      {/* Screen reader text */} {/* Текст для скринридера */}
    </Button>
  );
};

export default CompareButton;
