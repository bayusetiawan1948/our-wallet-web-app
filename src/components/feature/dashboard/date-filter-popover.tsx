import { useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { cn } from "@/libs/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarBlankIcon, CaretDownIcon, CheckIcon } from "@phosphor-icons/react";

export type DatePresetKey = "1d" | "7d" | "30d" | "3m" | "6m" | "1y" | "custom";

export interface DatePresetOption {
  value: DatePresetKey;
  label: string;
}

export const DATE_PRESET_OPTIONS: DatePresetOption[] = [
  { value: "1d", label: "1 Hari" },
  { value: "7d", label: "7 Hari" },
  { value: "30d", label: "30 Hari" },
  { value: "3m", label: "3 Bulan" },
  { value: "6m", label: "6 Bulan" },
  { value: "1y", label: "1 Tahun" },
  { value: "custom", label: "Custom" },
];

interface DateFilterPopoverProps {
  datePreset: DatePresetKey;
  onDatePresetChange: (preset: DatePresetKey) => void;
  customRange: DateRange | undefined;
  onCustomRangeChange: (range: DateRange | undefined) => void;
}

export function DateFilterPopover({
  datePreset,
  onDatePresetChange,
  customRange,
  onCustomRangeChange,
}: DateFilterPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getDateFilterDisplayLabel = () => {
    if (datePreset !== "custom") {
      const found = DATE_PRESET_OPTIONS.find((item) => item.value === datePreset);
      return found ? found.label : "30 Hari";
    }

    if (customRange?.from) {
      if (customRange.to) {
        return `${format(customRange.from, "d MMM yyyy", { locale: id })} - ${format(
          customRange.to,
          "d MMM yyyy",
          { locale: id }
        )}`;
      }
      return format(customRange.from, "d MMM yyyy", { locale: id });
    }

    return "Custom Tanggal";
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 font-medium min-w-[120px] justify-between flex-1 xl:flex-none"
        >
          <div className="flex items-center gap-1.5 truncate">
            <CalendarBlankIcon className="size-3.5 text-muted-foreground shrink-0" />
            <span className="truncate">{getDateFilterDisplayLabel()}</span>
          </div>
          <CaretDownIcon className="size-3.5 text-muted-foreground shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-3 max-w-[90vw] sm:max-w-none">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between px-1 border-b pb-2">
            <span className="text-xs font-semibold text-foreground">Filter Tanggal</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {DATE_PRESET_OPTIONS.map((item) => {
              const isActive = datePreset === item.value;
              return (
                <Button
                  key={item.value}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-8 text-xs justify-between px-2.5 font-normal transition-all",
                    isActive && "font-medium"
                  )}
                  onClick={() => {
                    onDatePresetChange(item.value);
                    if (item.value !== "custom") {
                      setIsOpen(false);
                    }
                  }}
                >
                  <span>{item.label}</span>
                  {isActive && <CheckIcon className="size-3.5 ml-1" />}
                </Button>
              );
            })}
          </div>
          {datePreset === "custom" && (
            <div className="pt-2 border-t flex flex-col gap-2">
              <p className="text-[11px] text-muted-foreground px-1">
                Pilih rentang tanggal:
              </p>
              <Calendar
                mode="range"
                selected={customRange}
                onSelect={onCustomRangeChange}
                numberOfMonths={1}
                locale={id}
              />
              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button
                  size="sm"
                  variant="default"
                  className="h-7 text-xs px-3"
                  onClick={() => setIsOpen(false)}
                >
                  Terapkan
                </Button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
