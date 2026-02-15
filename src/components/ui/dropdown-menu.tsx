"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Circle } from "lucide-react"; // Icon components // Компоненты иконок

import { cn } from "@/utils/utils";

// DropdownMenu root component // Корневой компонент DropdownMenu
const DropdownMenu = DropdownMenuPrimitive.Root;

// DropdownMenu trigger component (usually a button) // Компонент триггера DropdownMenu (обычно кнопка)
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

// DropdownMenu group component (for grouping items) // Компонент группы DropdownMenu (для группировки элементов)
const DropdownMenuGroup = DropdownMenuPrimitive.Group;

// DropdownMenu portal component (renders content outside the normal DOM flow) // Компонент портала DropdownMenu (рендерит контент вне обычного потока DOM)
const DropdownMenuPortal = DropdownMenuPrimitive.Portal;

// DropdownMenu sub-menu component // Компонент подменю DropdownMenu
const DropdownMenuSub = DropdownMenuPrimitive.Sub;

// DropdownMenu radio group component // Компонент группы радиокнопок DropdownMenu
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

// DropdownMenu sub-menu trigger component // Компонент триггера подменю DropdownMenu
const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>, // Ref element type // Тип элемента ref
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    // Props type // Тип пропсов
    inset?: boolean; // Optional prop for indented style // Опциональный пропс для стиля с отступом
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref} // Forward the ref // Перенаправляем ref
    className={cn(
      // Base styles: flex layout, cursor, selection, padding, focus/open states, icon styles
      // Базовые стили: flex расположение, курсор, выделение, паддинг, состояния фокуса/открытия, стили иконок
      "flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8", // Apply left padding if inset // Применяем левый паддинг, если inset
      className, // Apply custom classes // Применяем кастомные классы
    )}
    {...props} // Spread remaining props // Распространяем остальные пропсы
  >
    {children} {/* The content of the sub-trigger (usually text) */}{" "}
    {/* Содержимое триггера подменю (обычно текст) */}
    <ChevronRight className="ml-auto h-4 w-4" /> {/* Right chevron icon */}{" "}
    {/* Иконка стрелки вправо */}
  </DropdownMenuPrimitive.SubTrigger>
));
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName; // Set display name // Устанавливаем имя

// DropdownMenu sub-menu content component // Компонент содержимого подменю DropdownMenu
const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>, // Ref element type // Тип элемента ref
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent> // Props type // Тип пропсов
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref} // Forward the ref // Перенаправляем ref
    className={cn(
      // Base styles: z-index, width, overflow, border, background, padding, text color, animations
      // Базовые стили: z-index, ширина, переполнение, граница, фон, паддинг, цвет текста, анимации
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
      className, // Apply custom classes // Применяем кастомные классы
    )}
    {...props} // Spread remaining props // Распространяем остальные пропсы
  />
));
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName; // Set display name // Устанавливаем имя

// DropdownMenu content component (the main dropdown panel) // Компонент содержимого DropdownMenu (основная выпадающая панель)
const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>, // Ref element type // Тип элемента ref
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> // Props type // Тип пропсов
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    {" "}
    {/* Render content within the portal */}{" "}
    {/* Рендерим контент внутри портала */}
    <DropdownMenuPrimitive.Content
      ref={ref} // Forward the ref // Перенаправляем ref
      sideOffset={sideOffset} // Offset from the trigger // Смещение от триггера
      className={cn(
        // Base styles: z-index, width, overflow, border, background, padding, text color, shadow, animations // Базовые стили: z-index, ширина, переполнение, граница, фон, паддинг, цвет текста, тень, анимации
        "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className, // Apply custom classes // Применяем кастомные классы
      )}
      {...props} // Spread remaining props // Распространяем остальные пропсы
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName; // Set display name // Устанавливаем имя

// DropdownMenuItem component (a basic menu item) // Компонент элемента DropdownMenu (базовый элемент меню)
const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>, // Ref element type // Тип элемента ref
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    // Props type // Тип пропсов
    inset?: boolean; // Optional prop for indented style // Опциональный пропс для стиля с отступом
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref} // Forward the ref // Перенаправляем ref
    className={cn(
      // Base styles: flex, cursor, selection, padding, text style, focus state, disabled state // Базовые стили: flex, курсор, выделение, паддинг, стиль текста, состояние фокуса, состояние disabled
      "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8", // Apply left padding if inset // Применяем левый паддинг, если inset
      className, // Apply custom classes // Применяем кастомные классы
    )}
    {...props} // Spread remaining props // Распространяем остальные пропсы
  />
));
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName; // Set display name // Устанавливаем имя

// DropdownMenu checkbox item component // Компонент элемента-чекбокса DropdownMenu
const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>, // Ref element type // Тип элемента ref
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem> // Props type // Тип пропсов
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref} // Forward the ref // Перенаправляем ref
    className={cn(
      // Base styles: flex, cursor, selection, padding, text style, focus state, disabled state
      // Базовые стили: flex, курсор, выделение, паддинг, стиль текста, состояние фокуса, состояние disabled
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className, // Apply custom classes // Применяем кастомные классы
    )}
    checked={checked} // Pass checked state // Передаем состояние checked
    {...props} // Spread remaining props // Распространяем остальные пропсы
  >
    {/* Check indicator */} {/* Индикатор галочки */}
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" /> {/* Check icon */} {/* Иконка галочки */}
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children} {/* The content of the checkbox item (usually text) */}{" "}
    {/* Содержимое элемента-чекбокса (обычно текст) */}
  </DropdownMenuPrimitive.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName; // Set display name // Устанавливаем имя

// DropdownMenu radio item component // Компонент элемента-радиокнопки DropdownMenu
const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>, // Ref element type // Тип элемента ref
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem> // Props type // Тип пропсов
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref} // Forward the ref // Перенаправляем ref
    className={cn(
      // Base styles: flex, cursor, selection, padding, text style, focus state, disabled state
      // Базовые стили: flex, курсор, выделение, паддинг, стиль текста, состояние фокуса, состояние disabled
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className, // Apply custom classes // Применяем кастомные классы
    )}
    {...props} // Spread remaining props // Распространяем остальные пропсы
  >
    {/* Radio indicator (circle) */} {/* Индикатор радиокнопки (кружок) */}
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" /> {/* Circle icon */}{" "}
        {/* Иконка кружка */}
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children} {/* The content of the radio item */}{" "}
    {/* Содержимое элемента радиокнопки */}
  </DropdownMenuPrimitive.RadioItem>
));
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName; // Set display name // Устанавливаем имя

// DropdownMenu label component (non-interactive text label) // Компонент метки DropdownMenu (неинтерактивная текстовая метка)
const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>, // Ref element type // Тип элемента ref
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    // Props type // Тип пропсов
    inset?: boolean; // Optional prop for indented style // Опциональный пропс для стиля с отступом
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref} // Forward the ref // Перенаправляем ref
    className={cn(
      "px-2 py-1.5 text-sm font-semibold", // Base styles: padding, text style // Базовые стили: паддинг, стиль текста
      inset && "pl-8", // Apply left padding if inset // Применяем левый паддинг, если inset
      className, // Apply custom classes // Применяем кастомные классы
    )}
    {...props} // Spread remaining props // Распространяем остальные пропсы
  />
));
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName; // Set display name // Устанавливаем имя

// DropdownMenu separator component // Компонент разделителя DropdownMenu
const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>, // Ref element type // Тип элемента ref
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator> // Props type // Тип пропсов
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref} // Forward the ref // Перенаправляем ref
    className={cn("-mx-1 my-1 h-px bg-muted", className)} // Base styles: margin, height, background color // Базовые стили: margin, высота, цвет фона
    {...props} // Spread remaining props // Распространяем остальные пропсы
  />
));
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName; // Set display name // Устанавливаем имя

// DropdownMenu shortcut component (displays keyboard shortcuts) // Компонент ярлыка DropdownMenu (отображает сочетания клавиш)
const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)} // Base styles: margin, text style, tracking, opacity // Базовые стили: margin, стиль текста, трекинг, прозрачность
      {...props} // Spread remaining props // Распространяем остальные пропсы
    />
  );
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"; // Set display name (note: lowercase 'n') // Устанавливаем имя (примечание: строчная 'n')

// Export the components // Экспортируем компоненты
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
};
