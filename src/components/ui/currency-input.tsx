import * as React from "react";
import { cn } from "@/libs/utils";
import { formatCurrencyInput, parseCurrencyInput } from "@/libs/number";

export interface CurrencyInputProps
  extends Omit<React.ComponentProps<"input">, "value" | "onChange"> {
  value?: number | string;
  onValueChange?: (numericValue: number, formattedValue: string) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  prefixSymbol?: string;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      className,
      value,
      onValueChange,
      onChange,
      prefixSymbol = "Rp",
      placeholder = "0",
      disabled,
      ...props
    },
    ref
  ) => {
    const formattedDisplay = React.useMemo(() => {
      if (value === undefined || value === null || value === "") return "";
      return formatCurrencyInput(value);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawInput = e.target.value;
      const formatted = formatCurrencyInput(rawInput);
      const numeric = parseCurrencyInput(rawInput);

      if (onValueChange) {
        onValueChange(numeric, formatted);
      }

      if (onChange) {
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            value: formatted,
          },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    };

    return (
      <div className="relative flex items-center w-full">
        {prefixSymbol && (
          <span className="absolute left-2.5 text-xs font-semibold text-muted-foreground select-none pointer-events-none z-10">
            {prefixSymbol}
          </span>
        )}
        <input
          ref={ref}
          type="text"
          inputMode="numeric"
          disabled={disabled}
          placeholder={placeholder}
          value={formattedDisplay}
          onChange={handleChange}
          data-slot="currency-input"
          className={cn(
            "h-7 w-full min-w-0 rounded-md border border-input bg-input/20 py-0.5 text-xs transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 font-mono tracking-tight",
            prefixSymbol ? "pl-8 pr-2" : "px-2",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";
